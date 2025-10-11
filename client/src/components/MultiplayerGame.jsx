import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { CustomPieces } from '../game/CustomPieces.js';
import { EnergySystem } from '../game/EnergySystem.js';

// Helper function to get piece symbol
function getPieceSymbol(type) {
  const customPieces = new CustomPieces();
  return customPieces.getPieceInfo(type).symbol;
}

const MultiplayerGame = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomId, playerColor, playerName, isHost } = location.state || {};
  
  const [socket, setSocket] = useState(null);
  const [board, setBoard] = useState(Array(8).fill().map(() => Array(8).fill(null)));
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [gameState, setGameState] = useState({
    currentPlayer: 'white',
    gameStatus: 'waiting',
    moveHistory: [],
    gameTime: 0,
    winner: null
  });
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');
  const [boardRotated, setBoardRotated] = useState(false);
  
  const [customPieces] = useState(new CustomPieces());
  const [energySystem] = useState(new EnergySystem());
  
  // Energy system state
  const [whiteEnergy, setWhiteEnergy] = useState(energySystem.energyLimits.startingEnergy);
  const [blackEnergy, setBlackEnergy] = useState(energySystem.energyLimits.startingEnergy);
  const [lastEnergyUpdate, setLastEnergyUpdate] = useState(0);

  const isValidMove = useCallback((board, fromRow, fromCol, toRow, toCol, piece) => {
    return customPieces.isValidMove(board, fromRow, fromCol, toRow, toCol, piece);
  }, [customPieces]);

  // Local energy timer (since server doesn't handle energy yet)
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return;

    const timer = setInterval(() => {
      setWhiteEnergy(prevEnergy => 
        energySystem.updateEnergy(prevEnergy, gameState.gameTime, lastEnergyUpdate)
      );
      setBlackEnergy(prevEnergy => 
        energySystem.updateEnergy(prevEnergy, gameState.gameTime, lastEnergyUpdate)
      );
      setLastEnergyUpdate(gameState.gameTime);
    }, 100);

    return () => clearInterval(timer);
  }, [gameState.gameStatus, gameState.gameTime, energySystem, lastEnergyUpdate]);

  useEffect(() => {
    if (!roomId || !playerColor) {
      console.log('Missing roomId or playerColor, redirecting...', { roomId, playerColor });
      navigate('/multiplayer');
      return;
    }

    console.log('MultiplayerGame mounting with:', { roomId, playerColor, playerName, isHost });

    // Use existing socket from lobby or create new one
    const existingSocket = window.multiplayerSocket;
    const savedPlayerName = window.multiplayerPlayerName || playerName;
    console.log('Existing socket?', !!existingSocket, 'Player name:', savedPlayerName);
    
    const newSocket = existingSocket || io('http://localhost:3001');
    setSocket(newSocket);
    
    // Clear the global references
    if (existingSocket) {
      window.multiplayerSocket = null;
      window.multiplayerPlayerName = null;
      console.log('Reusing socket from lobby, already in room:', roomId);
    } else {
      console.log('Creating new socket and joining room:', roomId);
    }

    // Socket event listeners
    newSocket.on('game-state', (state) => {
      console.log('Received game-state:', state);
      setBoard(state.board);
      setGameState(state);
    });

    newSocket.on('player-joined', (data) => {
      console.log('Player joined:', data);
      setPlayers(prev => [...prev, { name: data.playerName, color: data.playerColor }]);
    });

    newSocket.on('player-left', (data) => {
      console.log('Player left:', data);
      setPlayers(prev => prev.filter(p => p.name !== data.playerName));
    });

    newSocket.on('move-made', (data) => {
      console.log('Move made:', data);
      // Clear selection when opponent makes a move
      setSelectedPiece(null);
      setValidMoves([]);
    });

    newSocket.on('error', (data) => {
      console.error('Socket error:', data);
      setError(data.message);
    });

    // Only join the room if this is a new socket (not from lobby)
    if (!existingSocket) {
      console.log('Emitting join-room:', { roomId, playerName: savedPlayerName });
      newSocket.emit('join-room', { roomId, playerName: savedPlayerName });
    }

    return () => {
      // Only close socket when actually leaving (not just React strict mode re-renders)
      console.log('MultiplayerGame cleanup running');
      // Don't close the socket in cleanup - we'll handle it when leaving the game
    };
  }, [roomId, playerColor, playerName, navigate, isHost]);

  const calculateValidMoves = useCallback((board, fromRow, fromCol, piece) => {
    const moves = [];
    for (let toRow = 0; toRow < 8; toRow++) {
      for (let toCol = 0; toCol < 8; toCol++) {
        if (isValidMove(board, fromRow, fromCol, toRow, toCol, piece)) {
          moves.push({ row: toRow, col: toCol });
        }
      }
    }
    return moves;
  }, [isValidMove]);

  const handleSquareClick = useCallback((row, col) => {
    if (gameState.gameStatus !== 'playing') return;

    const piece = board[row][col];
    
    // Select piece if it's current player's, on cooldown 0, has enough energy, and not already selected
    if (piece && piece.cooldown === 0 && piece.color === playerColor && 
        (!selectedPiece || selectedPiece.piece.color === piece.color)) {
      const moveCost = energySystem.getEnergyCost(piece.type);
      const currentEnergy = piece.color === 'white' ? whiteEnergy : blackEnergy;
      
      if (currentEnergy >= moveCost) {
        setSelectedPiece({ row, col, piece });
        const moves = calculateValidMoves(board, row, col, piece);
        setValidMoves(moves);
        return;
      } else {
        alert(`Not enough energy! Need ${moveCost}, have ${currentEnergy}`);
        return;
      }
    }
    
    // If a piece is already selected, attempt to move it
    if (selectedPiece) {
      const isValid = validMoves.some(move => 
        move.row === row && move.col === col
      );
      
      if (isValid) {
        // Deduct energy locally (server will handle this later)
        const moveCost = energySystem.getEnergyCost(selectedPiece.piece.type);
        if (selectedPiece.piece.color === 'white') {
          setWhiteEnergy(prev => prev - moveCost);
        } else {
          setBlackEnergy(prev => prev - moveCost);
        }
        
        // Send move to server
        socket.emit('make-move', {
          fromRow: selectedPiece.row,
          fromCol: selectedPiece.col,
          toRow: row,
          toCol: col
        });
      }
      
      setSelectedPiece(null);
      setValidMoves([]);
    }
  }, [board, selectedPiece, validMoves, gameState, playerColor, socket, calculateValidMoves, energySystem, whiteEnergy, blackEnergy]);

  const getCooldownPercentage = (piece) => {
    return piece ? (piece.cooldown / piece.cooldownTime) * 100 : 0;
  };

  const renderGameInfo = () => {
    if (gameState.gameStatus === 'waiting') {
      return null; // Will show overlay instead
    }
    if (gameState.gameStatus === 'finished') {
      return <p className="text-xl font-bold text-green-400">{gameState.winner} Wins!</p>;
    }
    return <p className="text-lg">Playing as: <span className="font-bold text-blue-400">{playerColor}</span></p>;
  };

  const handleLeaveGame = () => {
    if (socket) {
      console.log('Disconnecting socket on leave');
      socket.disconnect();
    }
    // Clean up any global references
    window.multiplayerSocket = null;
    window.multiplayerPlayerName = null;
    navigate('/multiplayer');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="bg-[#2c2c2c] border border-[#404040] p-8 rounded-xl shadow-2xl text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={handleLeaveGame}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  const maxEnergy = energySystem.getMaxEnergy();
  
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Navigation Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-[#2c2c2c] border-r border-[#404040]">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">♔</span>
            </div>
            <span className="text-xl font-bold">RTS Chess</span>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            <button 
              onClick={() => navigate('/')}
              className="w-full flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-[#404040] transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Home
            </button>
            
            <button 
              onClick={() => navigate('/multiplayer')}
              className="w-full flex items-center px-4 py-3 rounded-lg bg-[#404040] text-white hover:bg-[#505050] transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              Multiplayer
            </button>
            
            <button 
              onClick={() => navigate('/board-editor')}
              className="w-full flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-[#404040] transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
              Board Editor
            </button>
          </nav>
        </div>

        {/* Theme Toggle */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center justify-center bg-[#404040] rounded-lg p-2">
            <button className="flex items-center justify-center w-8 h-8 rounded-md bg-[#2c2c2c] text-white">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">RTS Chess - Multiplayer</h1>
              <p className="text-gray-400 text-lg">Room: <span className="font-mono text-blue-400">{roomId}</span> | You are: <span className="font-bold text-blue-400">{playerColor}</span></p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 bg-[#2c2c2c] rounded-lg hover:bg-[#404040] transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="p-2 bg-[#2c2c2c] rounded-lg hover:bg-[#404040] transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
            </div>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#2c2c2c] rounded-xl p-6 border border-[#404040]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-300">Game Time</h3>
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-2xl font-bold">{(gameState.gameTime / 1000).toFixed(1)}s</div>
            </div>

            <div className="bg-[#2c2c2c] rounded-xl p-6 border border-[#404040]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-300">Energy Regen</h3>
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-2xl font-bold">{energySystem.getRegenerationRate(gameState.gameTime).toFixed(1)}/sec</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Chess Board */}
            <div className="lg:col-span-3">
              <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Game Board</h2>
                  <button
                    onClick={() => setBoardRotated(!boardRotated)}
                    className="bg-[#404040] hover:bg-[#505050] text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                    title="Rotate board"
                  >
                    🔄 Rotate
                  </button>
                </div>

                <div className="flex items-start justify-center">
                  {/* Left-side row numbers */}
                  <div className="flex flex-col justify-around pr-2 text-gray-400 font-semibold text-sm">
                    {Array.from({ length: 8 }, (_, i) => boardRotated ? (i + 1) : (8 - i)).map(num => (
                      <div key={num} className="h-[50px] flex items-center justify-center">{num}</div>
                    ))}
                  </div>

                  {/* The Rounded Chess Board Container */}
                  <div className="relative">
                    {/* Top Energy Bar */}
                    <div className="absolute -top-16 left-0 right-0 flex justify-center">
                      <div className="bg-[#2c2c2c] border border-[#404040] rounded-lg px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold">{boardRotated ? 'White' : 'Black'} Energy</span>
                          <span className="text-sm font-bold">{Math.round(boardRotated ? whiteEnergy : blackEnergy)}/{maxEnergy}</span>
                          <div className={`w-4 h-4 rounded-full border border-gray-400 ${boardRotated ? 'bg-white' : 'bg-black'}`}></div>
                        </div>
                      </div>
                    </div>

                    <div className="w-[400px] h-[400px] bg-gradient-to-br from-[#8B4513] to-[#A0522D] rounded-xl border-4 border-[#654321] shadow-2xl overflow-hidden">
                      {(boardRotated ? [...board].reverse() : board).map((row, displayRowIndex) => {
                        const rowIndex = boardRotated ? (7 - displayRowIndex) : displayRowIndex;
                        return (
                          <div key={rowIndex} className="flex h-[50px]">
                            {(boardRotated ? [...row].reverse() : row).map((cell, displayColIndex) => {
                              const colIndex = boardRotated ? (7 - displayColIndex) : displayColIndex;
                              const isSelected = selectedPiece && 
                                selectedPiece.row === rowIndex && 
                                selectedPiece.col === colIndex;
                              
                              const isValidTarget = selectedPiece &&
                                validMoves.some(move => move.row === rowIndex && move.col === colIndex);
                              
                              return (
                                <div
                                  key={colIndex}
                                  className={`w-[50px] h-[50px] flex items-center justify-center relative cursor-pointer ${
                                    (rowIndex + colIndex) % 2 === 0 ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'
                                  } ${isSelected ? 'bg-[#aec6cf]' : ''}`}
                                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                                >
                                  {isValidTarget && (
                                    <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-[rgba(95,95,95,0.75)] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1]" />
                                  )}
                                  
                                  {cell && (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                      <div 
                                        className={`text-2xl z-[2] relative ${
                                          cell.cooldown > 0 ? 'opacity-60' : ''
                                        } ${
                                          cell.color === 'white' ? 'text-white' : 'text-black'
                                        }`}
                                        style={{
                                          textShadow: cell.color === 'white' 
                                            ? '1px 1px 2px black' 
                                            : '1px 1px 2px white'
                                        }}
                                      >
                                        {getPieceSymbol(cell.type)}
                                      </div>
                                      
                                      {/* Energy cost indicator */}
                                      {(() => {
                                        const currentEnergy = cell.color === 'white' ? whiteEnergy : blackEnergy;
                                        const moveCost = energySystem.getEnergyCost(cell.type);
                                        const canMove = currentEnergy >= moveCost && cell.cooldown === 0;
                                        return cell.cooldown === 0 && (
                                          <div className={`absolute top-1 right-1 w-5 h-5 rounded-full border border-white flex items-center justify-center ${
                                            canMove ? 'bg-green-500' : 'bg-gray-400'
                                          }`}>
                                            <span className="text-xs font-bold text-white">{moveCost}</span>
                                          </div>
                                        );
                                      })()}
                                      
                                      {cell.cooldown > 0 && (
                                        <div 
                                          className="absolute bottom-0 left-0 w-full bg-[rgba(255,0,0,0.3)] z-[1] transition-[height] duration-100"
                                          style={{ height: `${getCooldownPercentage(cell)}%` }}
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Bottom column letters */}
                    <div className="flex justify-around pt-2 text-gray-400 font-semibold text-sm">
                      {Array.from({ length: 8 }, (_, i) => String.fromCharCode((boardRotated ? (104 - i) : (97 + i)))).map(char => (
                        <div key={char} className="w-[50px] flex items-center justify-center">{char}</div>
                      ))}
                    </div>

                    {/* Bottom Energy Bar */}
                    <div className="absolute -bottom-16 left-0 right-0 flex justify-center">
                      <div className="bg-[#2c2c2c] border border-[#404040] rounded-lg px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold">{boardRotated ? 'Black' : 'White'} Energy</span>
                          <span className="text-sm font-bold">{Math.round(boardRotated ? blackEnergy : whiteEnergy)}/{maxEnergy}</span>
                          <div className={`w-4 h-4 rounded-full border border-gray-400 ${boardRotated ? 'bg-black' : 'bg-white'}`}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {renderGameInfo()}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Move History */}
              <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] p-6">
                <h3 className="text-lg font-semibold mb-4">Move History</h3>
                <div className="max-h-[300px] overflow-y-auto">
                  <ol className="space-y-2">
                    {gameState.moveHistory.map((entry, index) => (
                      <li key={index} className="flex items-center justify-between p-2 bg-[#404040] rounded-lg">
                        <div>
                          <span className="font-medium text-sm">{entry.move}</span>
                          <span className="text-xs text-gray-400 ml-2">({entry.time}s)</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          entry.player === 'white' ? 'bg-white text-black' : 'bg-black text-white'
                        }`}>
                          {entry.player}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Game Controls */}
              <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] p-6">
                <h3 className="text-lg font-semibold mb-4">Controls</h3>
                <button
                  onClick={handleLeaveGame}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                >
                  Leave Game
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Waiting for Opponent Overlay */}
      {gameState.gameStatus === 'waiting' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#2c2c2c] border border-[#404040] p-8 rounded-xl shadow-2xl text-center max-w-md">
            <div className="animate-pulse mb-6">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-2xl font-bold mb-2">Waiting for Opponent...</h3>
              <p className="text-gray-400">Room Code: <span className="font-mono font-bold text-blue-400">{roomId}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerGame;