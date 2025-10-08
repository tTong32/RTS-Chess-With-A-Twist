import React, { useState, useEffect, useCallback, useRef } from 'react'; // Import useRef
import { useLocation, useNavigate } from 'react-router-dom';
import { ChessAI } from '../game/ChessAI.js';
import { CustomPieces } from '../game/CustomPieces.js';
import { EnergySystem } from '../game/EnergySystem.js';

// Helper function to get piece symbol
function getPieceSymbol(type) {
  // customPieces will be stable, so it's okay to create it here too, or pass it as an argument
  const customPiecesInstance = new CustomPieces(); // Still a new instance, but outside of React component scope
  return customPiecesInstance.getPieceInfo(type).symbol;
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

const AIGame = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { aiElo, playerColor } = location.state || {};
  
  // FIX: Use useRef to create stable instances of CustomPieces and EnergySystem
  const customPieces = useRef(new CustomPieces()).current;
  const energySystem = useRef(new EnergySystem()).current;

  // Now, initializeBoard must also use the stable customPieces instance
  const initializeBoard = useCallback(() => {
    const initialBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    for (let i = 0; i < 8; i++) {
      const pawnInfo = customPieces.getPieceInfo('pawn'); // Use customPieces from useRef
      initialBoard[1][i] = { type: 'pawn', color: 'black', cooldown: 0, cooldownTime: pawnInfo.cooldownTime };
      initialBoard[6][i] = { type: 'pawn', color: 'white', cooldown: 0, cooldownTime: pawnInfo.cooldownTime };
    }
    
    const backRowPieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    
    backRowPieces.forEach((pieceType, i) => {
      const pieceInfo = customPieces.getPieceInfo(pieceType); // Use customPieces from useRef
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
  }, [customPieces]); // Add customPieces to dependency array for initializeBoard

  const [board, setBoard] = useState(() => initializeBoard());
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [gameTime, setGameTime] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing');
  const [moveHistory, setMoveHistory] = useState([]);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winMessage, setWinMessage] = useState('');
  const [winColor, setWinColor] = useState('');
  const [ai, setAi] = useState(null);
  const [aiStatus, setAiStatus] = useState({ isThinking: false });
  
  // Energy system state
  // FIX: Use energySystem.current for initial state, which is stable
  const [whiteEnergy, setWhiteEnergy] = useState(energySystem.energyLimits.startingEnergy);
  const [blackEnergy, setBlackEnergy] = useState(energySystem.energyLimits.startingEnergy);
  const [lastEnergyUpdate, setLastEnergyUpdate] = useState(0);

  // isValidMove now correctly uses the stable customPieces
  const isValidMove = useCallback((board, fromRow, fromCol, toRow, toCol, piece) => {
    return customPieces.isValidMove(board, fromRow, fromCol, toRow, toCol, piece);
  }, [customPieces]); // Add customPieces to dependency array

  // Initialize AI
  useEffect(() => {
    if (aiElo && playerColor) {
      const aiInstance = new ChessAI(aiElo);
      aiInstance.color = playerColor === 'white' ? 'black' : 'white';
      aiInstance.energySystem = energySystem; // energySystem is now a stable reference
      setAi(aiInstance);
    } else {
      navigate('/ai-setup');
    }
  }, [aiElo, playerColor, navigate, energySystem]); // energySystem is now a stable reference in the dependency array

  // Game timer and AI move handling
  useEffect(() => {
    if (gameStatus !== 'playing' || !ai) return;

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

        // AI move logic
        if (ai && !ai.isThinking && gameStatus === 'playing') {
          setBoard(currentBoard => {
            // Check if it's AI's turn (any AI piece is available)
            const aiPiecesAvailable = currentBoard.some(row => 
              row.some(cell => 
                cell && cell.color === ai.color && cell.cooldown === 0
              )
            );

            if (aiPiecesAvailable) {
              const aiEnergy = ai.color === 'white' ? whiteEnergy : blackEnergy;
              ai.makeMove(currentBoard, newTime, aiEnergy).then(move => {
                if (move) {
                  setBoard(prevBoard => {
                    const newBoard = prevBoard.map(row => [...row]);
                    const piece = newBoard[move.fromRow][move.fromCol];
                    const targetPiece = newBoard[move.toRow][move.toCol];

                    // Check for king capture
                    if (targetPiece && targetPiece.type === 'king') {
                      setWinMessage(`${ai.color === 'white' ? 'White' : 'Black'} Wins!`);
                      setWinColor(ai.color);
                      setGameStatus(`${ai.color}-wins`);
                      setShowWinPopup(true);
                    }

                    // Deduct energy for AI move
                    const moveCost = energySystem.getEnergyCost(piece.type);
                    if (piece.color === 'white') {
                      setWhiteEnergy(prev => prev - moveCost);
                    } else {
                      setBlackEnergy(prev => prev - moveCost);
                    }

                    // Record AI move
                    const algebraicMove = toAlgebraicNotation(move.fromRow, move.fromCol, move.toRow, move.toCol, piece.type);
                    setMoveHistory(prevHistory => [...prevHistory, { 
                      move: algebraicMove, 
                      time: (newTime / 1000).toFixed(1),
                      player: ai.color,
                      isAI: true,
                      energy: moveCost
                    }]);

                    // Update board
                    newBoard[move.toRow][move.toCol] = { ...piece, cooldown: piece.cooldownTime };
                    newBoard[move.fromRow][move.fromCol] = null;

                    return newBoard;
                  });
                }
              });
            }
            return currentBoard;
          });
        }

        return newTime;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [gameStatus, ai, energySystem, lastEnergyUpdate, whiteEnergy, blackEnergy]); // Add whiteEnergy, blackEnergy to dependencies

  // Update AI status for display
  useEffect(() => {
    if (ai) {
      const interval = setInterval(() => {
        setAiStatus(ai.getStatus());
      }, 100);
      return () => clearInterval(interval);
    }
  }, [ai]);

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

    // Store move for history before modifying the board
    const algebraicMove = toAlgebraicNotation(fromRow, fromCol, toRow, toCol, piece.type);
    setMoveHistory(prevHistory => [...prevHistory, { 
      move: algebraicMove, 
      time: (gameTime / 1000).toFixed(1),
      player: playerColor,
      isAI: false,
      energy: moveCost
    }]);

    // Update energy
    if (piece.color === 'white') {
      setWhiteEnergy(prev => prev - moveCost);
    } else {
      setBlackEnergy(prev => prev - moveCost);
    }

    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => [...row]);

      // Check for king capture
      if (targetPiece && targetPiece.type === 'king') {
        showWinScreen(targetPiece.color === 'white' ? 'white' : 'black');
      }

      // Place the piece on the new square with cooldown
      newBoard[toRow][toCol] = { ...piece, cooldown: piece.cooldownTime };
      // Clear the original square
      newBoard[fromRow][fromCol] = null;

      return newBoard;
    });
  }, [showWinScreen, gameTime, playerColor, board, energySystem, whiteEnergy, blackEnergy, setWhiteEnergy, setBlackEnergy]); // Added setWhiteEnergy, setBlackEnergy

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

  const renderGameInfo = () => {
    // energySystem.current is now used if EnergySystem instance itself is stored in ref
    // But since `energySystem` is `useRef(new EnergySystem()).current`, `energySystem` is already the instance
    const currentRegenerationRate = energySystem.getRegenerationRate(gameTime); 
    
    switch (gameStatus) {
      case 'white-wins': return <p className="text-xl font-bold text-green-700">White Wins!</p>;
      case 'black-wins': return <p className="text-xl font-bold text-green-700">Black Wins!</p>;
      case 'playing': 
      default: return (
        <div className="text-center">
          <p className="text-lg">You are playing as <span className="font-bold">{playerColor}</span></p>
          <p className="text-sm text-gray-600">AI ELO: {aiElo}</p>
          <p className="text-sm text-gray-600">Energy Regen: {currentRegenerationRate.toFixed(1)}/sec</p>
        </div>
      );
    }
  };

  const resetGame = useCallback(() => {
    setBoard(initializeBoard()); // initializeBoard itself uses customPieces
    setSelectedPiece(null);
    setValidMoves([]);
    setGameTime(0);
    setGameStatus('playing');
    setMoveHistory([]);
    setShowWinPopup(false);
    setWinMessage('');
    setWinColor('');
    setWhiteEnergy(energySystem.energyLimits.startingEnergy); // energySystem is stable
    setBlackEnergy(energySystem.energyLimits.startingEnergy); // energySystem is stable
    setLastEnergyUpdate(0);
    if (ai) {
      ai.moveHistory = [];
      ai.lastMoveTime = 0;
    }
  }, [ai, energySystem, initializeBoard]); // Added initializeBoard to dependencies

  const handleLeaveGame = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center p-5 min-h-screen bg-gray-100">
      {/* Top Energy Bar - Black */}
      <div className="w-full max-w-2xl mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">Black Energy</span>
          <span className="text-sm font-bold">{Math.round(blackEnergy)}/{energySystem.getMaxEnergy()}</span>
        </div>
        <div className="w-full h-4 bg-gray-300 rounded-full">
          <div 
            className="h-full bg-black border border-gray-400 rounded-full transition-all duration-300"
            style={{ width: `${(blackEnergy / energySystem.getMaxEnergy()) * 100}%` }}
          />
        </div>
      </div>

      {/* Top Info Bar */}
      <div className="mb-5 text-center">
        <h2 className="text-3xl font-bold">RTS Chess vs AI</h2>
        <p className="text-lg">Game Time: {(gameTime / 1000).toFixed(1)}s</p>
        {renderGameInfo()}
        
        {/* AI Status */}
        <div className="mt-2 text-sm">
          <span className="mr-4">AI ELO: <span className="font-bold">{aiElo}</span></span>
          <span className="mr-4">AI Thinking: <span className={aiStatus.isThinking ? 'text-red-600' : 'text-green-600'}>{aiStatus.isThinking ? 'Yes' : 'No'}</span></span>
          <span>AI Moves: <span className="font-bold">{aiStatus.moveCount || 0}</span></span>
        </div>
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
                  } ${isSelected ? 'bg-[#aec6cf]' : ''}`}
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
                      
                      {/* Energy cost indicator */}
                      {(() => {
                        const currentEnergy = cell.color === 'white' ? whiteEnergy : blackEnergy;
                        const moveCost = energySystem.getEnergyCost(cell.type);
                        const canMove = currentEnergy >= moveCost && cell.cooldown === 0;
                        return cell.cooldown === 0 && (
                          <div className={`absolute top-1 right-1 w-6 h-6 rounded-full border border-white flex items-center justify-center ${
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
          ))}
          {/* Bottom column letters (a-h) */}
          <div className="flex justify-around pt-1 text-gray-700 font-semibold text-sm">
              {Array.from({ length: 8 }, (_, i) => String.fromCharCode(97 + i)).map(char => (
                  <div key={char} className="w-[60px] flex items-center justify-center">{char}</div>
              ))}
          </div>
        </div>
        </div>

        {/* Right-side panel - Move History Only */}
        <div className="ml-4">

          {/* Move History Panel */}
          <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg w-64 max-h-[300px] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">Move History</h3>
            <ol className="list-decimal list-inside text-sm">
                {moveHistory.map((entry, index) => (
                    <li key={index} className="mb-1">
                        <span className="font-medium">{entry.move}</span>
                        <span className="text-gray-500 text-xs ml-2">({entry.time}s)</span>
                        <span className={`text-xs ml-2 px-1 py-0.5 rounded ${
                          entry.player === 'white' ? 'bg-white text-black' : 'bg-black text-white'
                        }`}>
                          {entry.isAI ? 'AI' : 'You'}
                        </span>
                        {entry.energy && (
                          <span className="text-xs ml-2 text-red-600">-{entry.energy}</span>
                        )}
                    </li>
                ))}
            </ol>
          </div>

          {/* Game Controls */}
          <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg w-64 space-y-2">
            <button
              onClick={resetGame}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
            >
              New Game
            </button>
            <button
              onClick={handleLeaveGame}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
            >
              Leave Game
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Energy Bar - White */}
      <div className="w-full max-w-2xl mt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">White Energy</span>
          <span className="text-sm font-bold">{Math.round(whiteEnergy)}/{energySystem.getMaxEnergy()}</span>
        </div>
        <div className="w-full h-4 bg-gray-300 rounded-full">
          <div 
            className="h-full bg-white border border-gray-400 rounded-full transition-all duration-300"
            style={{ width: `${(whiteEnergy / energySystem.getMaxEnergy()) * 100}%` }}
          />
        </div>
      </div>

      {/* Win Popup Modal */}
      {showWinPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-700 text-white p-6 rounded-lg shadow-xl text-center min-w-[300px] max-w-sm w-full">
                  <h3 className="text-3xl font-bold mb-4">{winMessage}</h3>
                  
                  {winColor && (
                      <div className="flex items-center justify-center gap-3 mb-6">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${winColor === 'white' ? 'bg-white text-black' : 'bg-black text-white'}`}>
                            {winColor === 'white' ? '♔' : '♚'}
                        </div>
                        <p className="text-lg">
                          {winColor === playerColor ? 'You won!' : 'AI won!'}
                        </p>
                      </div>
                  )}

                  <button
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200 mb-3"
                      onClick={resetGame}
                  >
                      Play Again
                  </button>
                  
                  <button
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                      onClick={handleLeaveGame}
                  >
                      Back to Home
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default AIGame;