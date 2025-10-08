// GameBoard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ChessRules } from '../game/ChessRules.js'

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
    const colToChar = c => String.fromCharCode(97 + c); // 0 -> 'a', 1 -> 'b', etc.
    const rowToNum = r => 8 - r; // 0 -> '8', 1 -> '7', etc.

    let notation = '';

    // Piece initial (uppercase for pieces, pawns get no letter)
    if (pieceType !== 'pawn') {
        notation += pieceType.charAt(0).toUpperCase();
    }

    // From square
    notation += colToChar(fromC) + rowToNum(fromR);

    // Separator (simple hyphen for all moves/captures as per simplified rules)
    notation += '-'; 

    // To square
    notation += colToChar(toC) + rowToNum(toR);

    return notation;
}

const GameBoard = ({ customBoard }) => {
  // Re-introducing initializeBoard here, as it's needed for New Game/Rematch
  // (Assuming you've incorporated ChessRules.getCooldownTimes here as per previous steps)
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

  const [board, setBoard] = useState(customBoard || initializeBoard());
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [gameTime, setGameTime] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'white-wins', 'black-wins'
  const [moveHistory, setMoveHistory] = useState([]); // For recording moves
  const [showWinPopup, setShowWinPopup] = useState(false); // Controls popup visibility
  const [winMessage, setWinMessage] = useState(''); // Message for the popup
  const [winColor, setWinColor] = useState(''); // Winner color for popup styling/text

  const isValidMove = useCallback((board, fromRow, fromCol, toRow, toCol, piece) => {
    return ChessRules.isValidMove(board, fromRow, fromCol, toRow, toCol, piece);
  }, []);

  useEffect(() => {
    // Stop the timer if the game is no longer 'playing'
    if (gameStatus !== 'playing') {
        return; 
    }

    const timer = setInterval(() => {
      setGameTime(prev => prev + 100);
      
      setBoard(prevBoard => 
        prevBoard.map(row => 
          row.map(cell => 
            cell && cell.cooldown > 0 
              ? { ...cell, cooldown: Math.max(0, cell.cooldown - 100) }
              : cell
          )
        )
      );
    }, 100);
    
    return () => clearInterval(timer);
  }, [gameStatus]); // Depend on gameStatus to pause/resume timer


  // showWinScreen function is completed
  const showWinScreen = useCallback((winnerColor) => {
    const winningColorText = winnerColor.charAt(0).toUpperCase() + winnerColor.slice(1);
    setWinMessage(`${winningColorText} Wins!`); // Simplified message
    setWinColor(winnerColor);
    setGameStatus(`${winnerColor}-wins`);
    setShowWinPopup(true);
  }, []);


  const movePiece = useCallback((fromRow, fromCol, toRow, toCol) => {
    // Store move for history before modifying the board
    const algebraicMove = toAlgebraicNotation(fromRow, fromCol, toRow, toCol, board[fromRow][fromCol].type);
    setMoveHistory(prevHistory => [...prevHistory, { move: algebraicMove, time: (gameTime / 1000).toFixed(1) }]);

    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => [...row]);
      const piece = newBoard[fromRow][fromCol];
      const targetPiece = newBoard[toRow][toCol]; // Get the piece at the target square *before* moving

      // Check for king capture
      if (targetPiece && targetPiece.type === 'king') {
        showWinScreen(targetPiece.color === 'white' ? 'white' : 'black'); // The current player wins by capturing the king
      }

      // Place the piece on the new square with cooldown
      newBoard[toRow][toCol] = { ...piece, cooldown: piece.cooldownTime };
      // Clear the original square
      newBoard[fromRow][fromCol] = null;

      return newBoard;
    });
  }, [showWinScreen, gameTime, board]); // Dependencies for movePiece


  // calculateValidMoves remains similar, but without check logic
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
  }, [isValidMove]); // Depends on isValidMove


  const handleSquareClick = useCallback((row, col) => {
    if (gameStatus !== 'playing') return; // Prevent interaction if game is over

    const piece = board[row][col];
    
    // Select piece if it's current player's, on cooldown 0, and not already selected
    if (piece && piece.cooldown === 0 && (!selectedPiece || selectedPiece.piece.color === piece.color)){
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
  }, [board, selectedPiece, validMoves, gameStatus, movePiece, calculateValidMoves]); // Added all dependencies


  const getCooldownPercentage = (piece) => {
    return piece ? (piece.cooldown / piece.cooldownTime) * 100 : 0;
  };

  // Function to display current game status and player turn
  const renderGameInfo = () => {
    switch (gameStatus) {
      case 'white-wins': return <p className="text-xl font-bold text-green-700">White Wins!</p>;
      case 'black-wins': return <p className="text-xl font-bold text-green-700">Black Wins!</p>;
      case 'playing': 
      default: return null;
    }
  };

  // Reset game function for 'New Game' / 'Rematch' buttons
  const resetGame = useCallback(() => {
      setBoard(customBoard || initializeBoard()); // Reset to initial prop or default
      setSelectedPiece(null);
      setValidMoves([]);
      setGameTime(0);
      setCurrentPlayer('white');
      setGameStatus('playing');
      setMoveHistory([]);
      setShowWinPopup(false);
      setWinMessage('');
      setWinColor('');
  }, [customBoard]); // customBoard should be a dependency if it could change


  return (
    <div className="flex flex-col items-center p-5">
      <div className="mb-5 text-center">
        <h2 className="text-3xl font-bold">RTS Chess</h2>
        <p className="text-lg">Game Time: {(gameTime / 1000).toFixed(1)}s</p>
        {renderGameInfo()} {/* Display game status and current turn */}
      </div>
      
      <div className="flex items-start"> {/* Use items-start for consistent top alignment */}
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

        {/* Right-side move history panel */}
        <div className="ml-4 p-4 bg-gray-100 border border-gray-300 rounded-lg w-64 max-h-[540px] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">Move History</h3>
            <ol className="list-decimal list-inside text-sm">
                {moveHistory.map((entry, index) => (
                    <li key={index} className="mb-1">
                        <span className="font-medium">{entry.move}</span>
                        <span className="text-gray-500 text-xs ml-2">({entry.time}s)</span>
                    </li>
                ))}
            </ol>
        </div>
      </div>

      {/* Win Popup Modal (styled to match screenshot) */}
      {showWinPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-700 text-white p-6 rounded-lg shadow-xl text-center min-w-[300px] max-w-sm w-full">
                  <h3 className="text-3xl font-bold mb-4">{winMessage}</h3>
                  
                  {winColor && (
                      <div className="flex items-center justify-center gap-3 mb-6">
                        {/* Placeholder for player icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${winColor === 'white' ? 'bg-white text-black' : 'bg-black text-white'}`}>
                            {winColor === 'white' ? '♔' : '♚'}
                        </div>
                        <p className="text-lg">{winColor.charAt(0).toUpperCase() + winColor.slice(1)} built a lead and didn't let up.</p>
                      </div>
                  )}

                  {/* Placeholder for accuracy stats, similar to screenshot */}
                  <div className="flex justify-around items-center mb-6 text-sm">
                    <div className="flex flex-col items-center">
                        <span className="text-green-500 text-2xl">👍</span>
                        <span>6 Best</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-yellow-500 text-2xl">👌</span>
                        <span>3 Excellent</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-red-500 text-2xl">❌</span>
                        <span>1 Miss</span>
                    </div>
                  </div>

                  <button
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200 mb-3"
                      onClick={resetGame}
                  >
                      Game Review
                  </button>
                  
                  <div className="flex justify-center gap-3">
                      <button
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                          onClick={resetGame}
                      >
                          New Bot
                      </button>
                      <button
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                          onClick={resetGame} // Rematch for now acts like New Game, can be extended
                      >
                          Rematch
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default GameBoard;