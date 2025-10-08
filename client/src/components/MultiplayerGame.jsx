import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ChessRules } from '../game/ChessRules.js';

// Helper function to get piece symbol
function getPieceSymbol(type) {
  const symbols = {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙'
  };
  return symbols[type] || '?';
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

  const isValidMove = useCallback((board, fromRow, fromCol, toRow, toCol, piece) => {
    return ChessRules.isValidMove(board, fromRow, fromCol, toRow, toCol, piece);
  }, []);

  useEffect(() => {
    if (!roomId || !playerColor) {
      navigate('/multiplayer');
      return;
    }

    // Initialize socket connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('game-state', (state) => {
      setBoard(state.board);
      setGameState(state);
    });

    newSocket.on('player-joined', (data) => {
      setPlayers(prev => [...prev, { name: data.playerName, color: data.playerColor }]);
    });

    newSocket.on('player-left', (data) => {
      setPlayers(prev => prev.filter(p => p.name !== data.playerName));
    });

    newSocket.on('move-made', (data) => {
      // Clear selection when opponent makes a move
      setSelectedPiece(null);
      setValidMoves([]);
    });

    newSocket.on('error', (data) => {
      setError(data.message);
    });

    // Join the room
    newSocket.emit('join-room', { roomId, playerName });

    return () => {
      newSocket.close();
    };
  }, [roomId, playerColor, playerName, navigate]);

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
    if (gameState.currentPlayer !== playerColor) return;

    const piece = board[row][col];
    
    // Select piece if it's current player's, on cooldown 0, and not already selected
    if (piece && piece.cooldown === 0 && piece.color === playerColor && 
        (!selectedPiece || selectedPiece.piece.color === piece.color)) {
      setSelectedPiece({ row, col, piece });
      const moves = calculateValidMoves(board, row, col, piece);
      setValidMoves(moves);
      return;
    }
    
    // If a piece is already selected, attempt to move it
    if (selectedPiece) {
      const isValid = validMoves.some(move => 
        move.row === row && move.col === col
      );
      
      if (isValid) {
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
  }, [board, selectedPiece, validMoves, gameState, playerColor, socket, calculateValidMoves]);

  const getCooldownPercentage = (piece) => {
    return piece ? (piece.cooldown / piece.cooldownTime) * 100 : 0;
  };

  const renderGameInfo = () => {
    if (gameState.gameStatus === 'waiting') {
      return <p className="text-xl font-bold text-yellow-600">Waiting for opponent...</p>;
    }
    if (gameState.gameStatus === 'finished') {
      return <p className="text-xl font-bold text-green-700">{gameState.winner} Wins!</p>;
    }
    if (gameState.currentPlayer === playerColor) {
      return <p className="text-xl font-bold text-blue-600">Your turn</p>;
    } else {
      return <p className="text-xl font-bold text-gray-600">Opponent's turn</p>;
    }
  };

  const handleLeaveGame = () => {
    if (socket) {
      socket.disconnect();
    }
    navigate('/multiplayer');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={handleLeaveGame}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-5 min-h-screen bg-gray-100">
      <div className="mb-5 text-center">
        <h2 className="text-3xl font-bold">RTS Chess - Multiplayer</h2>
        <p className="text-lg">Room: {roomId} | You are: {playerColor}</p>
        <p className="text-lg">Game Time: {(gameState.gameTime / 1000).toFixed(1)}s</p>
        {renderGameInfo()}
      </div>
      
      <div className="flex items-start">
        {/* Left-side row numbers (8-1) */}
        <div className="flex flex-col justify-around pr-1 text-gray-700 font-semibold text-sm">
          {Array.from({ length: 8 }, (_, i) => 8 - i).map(num => (
            <div key={num} className="h-[60px] flex items-center justify-center">{num}</div>
          ))}
        </div>

        {/* The Chess Board with bottom column letters */}
        <div>
          <div className="inline-block border-2 border-gray-800">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => {
              const isSelected = selectedPiece && 
              selectedPiece.row === rowIndex && 
              selectedPiece.col === colIndex;
              
              const isValidTarget = selectedPiece &&
              validMoves.some(move => move.row === rowIndex && move.col === colIndex);
              
              return (
              <div
                  key={colIndex}
                  className={`w-[60px] h-[60px] flex items-center justify-center relative cursor-pointer ${
                  (rowIndex + colIndex) % 2 === 0 ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'
                  } ${isSelected ? 'bg-[#aec6cf]' : ''} ${
                    gameState.currentPlayer === playerColor ? '' : 'cursor-not-allowed opacity-75'
                  }`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
              >
                  {isValidTarget && (
                  <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-[rgba(95,95,95,0.75)] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1]" />
                  )}
                  
                  {cell && (
                  <div className="relative w-full h-full flex items-center justify-center">
                      <div 
                      className={`text-4xl z-[2] relative ${
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
          ))}
          {/* Bottom column letters (a-h) */}
          <div className="flex justify-around pt-1 text-gray-700 font-semibold text-sm">
              {Array.from({ length: 8 }, (_, i) => String.fromCharCode(97 + i)).map(char => (
                  <div key={char} className="w-[60px] flex items-center justify-center">{char}</div>
              ))}
          </div>
        </div>
        </div>

        {/* Right-side panels */}
        <div className="ml-4 space-y-4">
          {/* Players Panel */}
          <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg w-64">
            <h3 className="text-lg font-semibold mb-2">Players</h3>
            <div className="space-y-2">
              {players.map((player, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{player.name}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    player.color === 'white' ? 'bg-white text-black' : 'bg-black text-white'
                  }`}>
                    {player.color}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Move History Panel */}
          <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg w-64 max-h-[300px] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">Move History</h3>
            <ol className="list-decimal list-inside text-sm">
                {gameState.moveHistory.map((entry, index) => (
                    <li key={index} className="mb-1">
                        <span className="font-medium">{entry.move}</span>
                        <span className="text-gray-500 text-xs ml-2">({entry.time}s)</span>
                        <span className={`text-xs ml-2 px-1 py-0.5 rounded ${
                          entry.player === 'white' ? 'bg-white text-black' : 'bg-black text-white'
                        }`}>
                          {entry.player}
                        </span>
                    </li>
                ))}
            </ol>
          </div>

          {/* Game Controls */}
          <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg w-64">
            <button
              onClick={handleLeaveGame}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
            >
              Leave Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerGame;
