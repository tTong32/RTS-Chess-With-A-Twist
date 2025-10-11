import React, { useState, useEffect, useCallback } from 'react';
import { CustomPieces } from '../game/CustomPieces.js';
import { EnergySystem } from '../game/EnergySystem.js';

// Helper function to get piece symbol
function getPieceSymbol(type) {
  const customPieces = new CustomPieces();
  return customPieces.getPieceInfo(type).symbol;
}

// Helper function for algebraic notation
function toAlgebraicNotation(fromR, fromC, toR, toC, pieceType) {
  const colToChar = c => String.fromCharCode(97 + c);
  const rowToNum = r => 8 - r;

  let notation = '';
  if (pieceType !== 'pawn') {
    notation += pieceType.charAt(0).toUpperCase();
  }
  notation += colToChar(fromC) + rowToNum(fromR);
  notation += '-';
  notation += colToChar(toC) + rowToNum(toR);
  return notation;
}

const EnhancedGameBoard = ({ customBoard, playerColor = 'white' }) => {
  const [customPieces] = useState(new CustomPieces());
  const [energySystem] = useState(new EnergySystem());
  
  const [board, setBoard] = useState(customBoard || initializeBoard());
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [gameTime, setGameTime] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing');
  const [moveHistory, setMoveHistory] = useState([]);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winMessage, setWinMessage] = useState('');
  const [winColor, setWinColor] = useState('');
  const [boardRotated, setBoardRotated] = useState(false);
  
  // Energy system state
  const [whiteEnergy, setWhiteEnergy] = useState(energySystem.energyLimits.startingEnergy);
  const [blackEnergy, setBlackEnergy] = useState(energySystem.energyLimits.startingEnergy);
  const [lastEnergyUpdate, setLastEnergyUpdate] = useState(0);

  function initializeBoard() {
    const initialBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Use custom pieces system for cooldown times
    const pieceTypes = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
    
    for (let i = 0; i < 8; i++) {
      const pawnInfo = customPieces.getPieceInfo('pawn');
      initialBoard[1][i] = { 
        type: 'pawn', 
        color: 'black', 
        cooldown: 0, 
        cooldownTime: pawnInfo.cooldownTime 
      };
      initialBoard[6][i] = { 
        type: 'pawn', 
        color: 'white', 
        cooldown: 0, 
        cooldownTime: pawnInfo.cooldownTime 
      };
    }
    
    const backRowPieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    
    backRowPieces.forEach((pieceType, i) => {
      const pieceInfo = customPieces.getPieceInfo(pieceType);
      initialBoard[0][i] = { 
        type: pieceType, 
        color: 'black', 
        cooldown: 0, 
        cooldownTime: pieceInfo.cooldownTime 
      };
      initialBoard[7][i] = { 
        type: pieceType, 
        color: 'white', 
        cooldown: 0, 
        cooldownTime: pieceInfo.cooldownTime 
      };
    });
    
    return initialBoard;
  }

  const isValidMove = useCallback((board, fromRow, fromCol, toRow, toCol, piece) => {
    return customPieces.isValidMove(board, fromRow, fromCol, toRow, toCol, piece);
  }, [customPieces]);

  // Main game loop with energy system
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const timer = setInterval(() => {
      setGameTime(prev => {
        const newTime = prev + 100;
        
        // Update energy for both players
        setWhiteEnergy(prevEnergy => 
          energySystem.updateEnergy(prevEnergy, newTime, lastEnergyUpdate)
        );
        setBlackEnergy(prevEnergy => 
          energySystem.updateEnergy(prevEnergy, newTime, lastEnergyUpdate)
        );
        setLastEnergyUpdate(newTime);
        
        // Update board cooldowns
        setBoard(prevBoard => 
          prevBoard.map(row => 
            row.map(cell => 
              cell && cell.cooldown > 0 
                ? { ...cell, cooldown: Math.max(0, cell.cooldown - 100) }
                : cell
            )
          )
        );

        return newTime;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [gameStatus, energySystem, lastEnergyUpdate]);

  const showWinScreen = useCallback((winnerColor) => {
    const winningColorText = winnerColor.charAt(0).toUpperCase() + winnerColor.slice(1);
    setWinMessage(`${winningColorText} Wins!`);
    setWinColor(winnerColor);
    setGameStatus(`${winnerColor}-wins`);
    setShowWinPopup(true);
  }, []);

  const movePiece = useCallback((fromRow, fromCol, toRow, toCol) => {
    const piece = board[fromRow][fromCol];
    const targetPiece = board[toRow][toCol];
    const moveCost = energySystem.getEnergyCost(piece.type);
    
    // Check if player has enough energy
    const currentEnergy = piece.color === 'white' ? whiteEnergy : blackEnergy;
    if (currentEnergy < moveCost) {
      alert(`Not enough energy! Need ${moveCost}, have ${currentEnergy}`);
      return;
    }

    // Check for king capture
    if (targetPiece && targetPiece.type === 'king') {
      showWinScreen(piece.color);
    }

    // Store move for history before modifying the board
    const algebraicMove = toAlgebraicNotation(fromRow, fromCol, toRow, toCol, piece.type);
    setMoveHistory(prevHistory => [...prevHistory, { 
      move: algebraicMove, 
      time: (gameTime / 1000).toFixed(1),
      energy: moveCost,
      player: piece.color
    }]);

    // Update energy
    if (piece.color === 'white') {
      setWhiteEnergy(prev => prev - moveCost);
    } else {
      setBlackEnergy(prev => prev - moveCost);
    }

    // Update board
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => [...row]);
      newBoard[toRow][toCol] = { ...piece, cooldown: piece.cooldownTime };
      newBoard[fromRow][fromCol] = null;
      return newBoard;
    });
  }, [showWinScreen, gameTime, energySystem, whiteEnergy, blackEnergy, board]);

  const calculateValidMoves = useCallback((board, fromRow, fromCol, piece) => {
    const moves = [];
    const currentEnergy = piece.color === 'white' ? whiteEnergy : blackEnergy;
    const moveCost = energySystem.getEnergyCost(piece.type);
    
    // Only calculate moves if player has enough energy
    if (currentEnergy < moveCost) {
      return moves;
    }
    
    for (let toRow = 0; toRow < 8; toRow++) {
      for (let toCol = 0; toCol < 8; toCol++) {
        if (isValidMove(board, fromRow, fromCol, toRow, toCol, piece)) {
          moves.push({ row: toRow, col: toCol });
        }
      }
    }
    return moves;
  }, [isValidMove, energySystem, whiteEnergy, blackEnergy]);

  const handleSquareClick = useCallback((row, col) => {
    if (gameStatus !== 'playing') return;

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
        movePiece(selectedPiece.row, selectedPiece.col, row, col);
      }
      
      setSelectedPiece(null);
      setValidMoves([]);
    }
  }, [board, selectedPiece, validMoves, gameStatus, movePiece, calculateValidMoves, playerColor]);

  const getCooldownPercentage = (piece) => {
    return piece ? (piece.cooldown / piece.cooldownTime) * 100 : 0;
  };

  const canAffordMove = (piece) => {
    const currentEnergy = piece.color === 'white' ? whiteEnergy : blackEnergy;
    return energySystem.canAffordMove(currentEnergy, piece.type);
  };

  const renderGameInfo = () => {
    switch (gameStatus) {
      case 'white-wins': return <p className="text-xl font-bold text-green-400">White Wins!</p>;
      case 'black-wins': return <p className="text-xl font-bold text-green-400">Black Wins!</p>;
      case 'playing': 
      default: return (
        <div className="text-center">
          <p className="text-lg">You are playing as <span className="font-bold text-blue-400">{playerColor}</span></p>
        </div>
      );
    }
  };

  const resetGame = useCallback(() => {
    setBoard(customBoard || initializeBoard());
    setSelectedPiece(null);
    setValidMoves([]);
    setGameTime(0);
    setGameStatus('playing');
    setMoveHistory([]);
    setShowWinPopup(false);
    setWinMessage('');
    setWinColor('');
    setWhiteEnergy(energySystem.energyLimits.startingEnergy);
    setBlackEnergy(energySystem.energyLimits.startingEnergy);
    setLastEnergyUpdate(0);
  }, [customBoard, energySystem]);

  const currentRegenerationRate = energySystem.getRegenerationRate(gameTime);
  const maxEnergy = energySystem.getMaxEnergy();

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">RTS Chess - Enhanced</h1>
            <p className="text-gray-400 text-lg">Custom game mode with energy management</p>
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
              <div className="text-2xl font-bold">{(gameTime / 1000).toFixed(1)}s</div>
            </div>

            <div className="bg-[#2c2c2c] rounded-xl p-6 border border-[#404040]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-300">Energy Regen</h3>
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-2xl font-bold">{currentRegenerationRate.toFixed(1)}/sec</div>
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
                            
                            const canMove = cell && cell.cooldown === 0 && canAffordMove(cell);
                            const isPlayerPiece = cell && cell.color === playerColor;
                            
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
                                
                                {/* Energy cost indicator */}
                                {cell && cell.cooldown === 0 && (
                                  <div className={`absolute top-1 right-1 w-5 h-5 rounded-full border border-white flex items-center justify-center ${
                                    canMove ? 'bg-green-500' : 'bg-gray-400'
                                  }`}>
                                    <span className="text-xs font-bold text-white">{energySystem.getEnergyCost(cell.type)}</span>
                                  </div>
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
            {/* Energy Panel */}
            <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] p-6">
              <h3 className="text-lg font-semibold mb-4">Energy Status</h3>
              <div className="space-y-4">
                {/* White Energy */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">White Energy:</span>
                    <span className="font-bold">{Math.round(whiteEnergy)}/{maxEnergy}</span>
                  </div>
                  <div className="w-full h-3 bg-[#404040] rounded-full">
                    <div 
                      className="h-full bg-white border border-gray-400 rounded-full transition-all duration-300"
                      style={{ width: `${(whiteEnergy / maxEnergy) * 100}%` }}
                    />
                  </div>
                </div>
                
                {/* Black Energy */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">Black Energy:</span>
                    <span className="font-bold">{Math.round(blackEnergy)}/{maxEnergy}</span>
                  </div>
                  <div className="w-full h-3 bg-[#404040] rounded-full">
                    <div 
                      className="h-full bg-black border border-gray-400 rounded-full transition-all duration-300"
                      style={{ width: `${(blackEnergy / maxEnergy) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="text-xs text-gray-400">
                  Regen: {currentRegenerationRate.toFixed(1)}/sec
                </div>
              </div>
            </div>

            {/* Piece Costs Panel */}
            <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] p-6">
              <h3 className="text-lg font-semibold mb-4">Piece Energy Costs</h3>
              <div className="space-y-2">
                {['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'].map(pieceType => {
                  const cost = energySystem.getEnergyCost(pieceType);
                  const canAfford = (playerColor === 'white' ? whiteEnergy : blackEnergy) >= cost;
                  return (
                    <div key={pieceType} className={`flex justify-between text-sm ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                      <span className="capitalize">{pieceType}:</span>
                      <span>{cost} energy</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Move History */}
            <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] p-6">
              <h3 className="text-lg font-semibold mb-4">Move History</h3>
              <div className="max-h-[300px] overflow-y-auto">
                <ol className="space-y-2">
                  {moveHistory.map((entry, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-[#404040] rounded-lg">
                      <div>
                        <span className="font-medium text-sm">{entry.move}</span>
                        <span className="text-xs text-gray-400 ml-2">({entry.time}s)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          entry.player === 'white' ? 'bg-white text-black' : 'bg-black text-white'
                        }`}>
                          {entry.player}
                        </span>
                        {entry.energy && (
                          <span className="text-xs text-red-400">-{entry.energy}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Game Controls */}
            <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] p-6">
              <h3 className="text-lg font-semibold mb-4">Controls</h3>
              <button
                onClick={resetGame}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
              >
                New Game
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Win Popup Modal */}
      {showWinPopup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2c2c2c] border border-[#404040] p-8 rounded-xl shadow-2xl text-center max-w-md">
            <h3 className="text-3xl font-bold mb-4">{winMessage}</h3>
            
            {winColor && (
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${winColor === 'white' ? 'bg-white text-black' : 'bg-black text-white'}`}>
                  {winColor === 'white' ? '♔' : '♚'}
                </div>
                <p className="text-lg">{winColor.charAt(0).toUpperCase() + winColor.slice(1)} captured the king!</p>
              </div>
            )}

            <button
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
              onClick={resetGame}
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedGameBoard;