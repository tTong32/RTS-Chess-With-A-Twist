import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChessRules } from '../game/ChessRules.js';
import { ChessAI } from '../game/ChessAI.js';

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

  function initializeBoard() {
    const initialBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    const cooldownTimes = ChessRules.getCooldownTimes();
    
    for (let i = 0; i < 8; i++) {
      initialBoard[1][i] = { type: 'pawn', color: 'black', cooldown: 0, cooldownTime: cooldownTimes.pawn };
      initialBoard[6][i] = { type: 'pawn', color: 'white', cooldown: 0, cooldownTime: cooldownTimes.pawn };
    }
    
    const backRowPieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    
    backRowPieces.forEach((pieceType, i) => {
      initialBoard[0][i] = { 
        type: pieceType, 
        color: 'black', 
        cooldown: 0, 
        cooldownTime: cooldownTimes[pieceType] 
      };
      initialBoard[7][i] = { 
        type: pieceType, 
        color: 'white', 
        cooldown: 0, 
        cooldownTime: cooldownTimes[pieceType] 
      };
    });
    
    return initialBoard;
  }

  const isValidMove = useCallback((board, fromRow, fromCol, toRow, toCol, piece) => {
    return ChessRules.isValidMove(board, fromRow, fromCol, toRow, toCol, piece);
  }, []);

  // Initialize AI
  useEffect(() => {
    if (aiElo && playerColor) {
      const aiInstance = new ChessAI(aiElo);
      aiInstance.color = playerColor === 'white' ? 'black' : 'white';
      setAi(aiInstance);
    } else {
      navigate('/ai-setup');
    }
  }, [aiElo, playerColor, navigate]);

  // Game timer and AI move handling
  useEffect(() => {
    if (gameStatus !== 'playing' || !ai) return;

    const timer = setInterval(() => {
      setGameTime(prev => {
        const newTime = prev + 100;
        
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
              ai.makeMove(currentBoard, newTime).then(move => {
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

                    // Record AI move
                    const algebraicMove = toAlgebraicNotation(move.fromRow, move.fromCol, move.toRow, move.toCol, piece.type);
                    setMoveHistory(prevHistory => [...prevHistory, { 
                      move: algebraicMove, 
                      time: (newTime / 1000).toFixed(1),
                      player: ai.color,
                      isAI: true
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
  }, [gameStatus, ai]);

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
    // Store move for history before modifying the board
    const algebraicMove = toAlgebraicNotation(fromRow, fromCol, toRow, toCol, board[fromRow][fromCol].type);
    setMoveHistory(prevHistory => [...prevHistory, { 
      move: algebraicMove, 
      time: (gameTime / 1000).toFixed(1),
      player: playerColor,
      isAI: false
    }]);

    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => [...row]);
      const piece = newBoard[fromRow][fromCol];
      const targetPiece = newBoard[toRow][toCol];

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
  }, [showWinScreen, gameTime, playerColor, board]);

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
    switch (gameStatus) {
      case 'white-wins': return <p className="text-xl font-bold text-green-700">White Wins!</p>;
      case 'black-wins': return <p className="text-xl font-bold text-green-700">Black Wins!</p>;
      case 'playing': 
      default: return (
        <div className="text-center">
          <p className="text-lg">You are playing as <span className="font-bold">{playerColor}</span></p>
          <p className="text-sm text-gray-600">AI ELO: {aiElo}</p>
        </div>
      );
    }
  };

  const resetGame = useCallback(() => {
    setBoard(initializeBoard());
    setSelectedPiece(null);
    setValidMoves([]);
    setGameTime(0);
    setGameStatus('playing');
    setMoveHistory([]);
    setShowWinPopup(false);
    setWinMessage('');
    setWinColor('');
    if (ai) {
      ai.moveHistory = [];
      ai.lastMoveTime = 0;
    }
  }, [ai]);

  const handleLeaveGame = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center p-5 min-h-screen bg-gray-100">
      <div className="mb-5 text-center">
        <h2 className="text-3xl font-bold">RTS Chess vs AI</h2>
        <p className="text-lg">Game Time: {(gameTime / 1000).toFixed(1)}s</p>
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
          {/* AI Status Panel */}
          <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg w-64">
            <h3 className="text-lg font-semibold mb-2">AI Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>ELO Rating:</span>
                <span className="font-bold">{aiElo}</span>
              </div>
              <div className="flex justify-between">
                <span>Thinking:</span>
                <span className={aiStatus.isThinking ? 'text-red-600' : 'text-green-600'}>
                  {aiStatus.isThinking ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Moves Made:</span>
                <span>{aiStatus.moveCount || 0}</span>
              </div>
            </div>
          </div>

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
