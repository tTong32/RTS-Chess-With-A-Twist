import React, { useState, useEffect, useCallback } from 'react';
import './GameBoard.css';
import { ChessRules } from '../game/ChessRules.js'

const GameBoard = () => {
  const [board, setBoard] = useState(initializeBoard());
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [gameTime, setGameTime] = useState(0);

  const isValidMove = useCallback((board, fromRow, fromCol, toRow, toCol, piece) => {
    return ChessRules.isValidMove(board, fromRow, fromCol, toRow, toCol, piece);
  }, []);

  function initializeBoard() {
    const initialBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    for (let i = 0; i < 8; i++) {
      initialBoard[1][i] = { type: 'pawn', color: 'black', cooldown: 0, cooldownTime: 2000 };
      initialBoard[6][i] = { type: 'pawn', color: 'white', cooldown: 0, cooldownTime: 2000 };
    }
    
    const backRowPieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    const cooldownTimes = {
      pawn: 2000,
      knight: 3000,
      bishop: 4000,
      rook: 5000,
      queen: 6000,
      king: 7000
    };
    
    backRowPieces.forEach((piece, i) => {
      initialBoard[0][i] = { 
        type: piece, 
        color: 'black', 
        cooldown: 0, 
        cooldownTime: cooldownTimes[piece] 
      };
      initialBoard[7][i] = { 
        type: piece, 
        color: 'white', 
        cooldown: 0, 
        cooldownTime: cooldownTimes[piece] 
      };
    });
    
    return initialBoard;
  }

  useEffect(() => {
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
  }, []);

  const handleSquareClick = useCallback((row, col) => {
    const piece = board[row][col]; // piece that you clicked
    
    if (piece && piece.cooldown === 0 && (!selectedPiece || selectedPiece.piece.color === piece.color)){
      setSelectedPiece({ row, col, piece });
      const moves = calculateValidMoves(board, row, col, piece);
      setValidMoves(moves);
      return;
    }
    
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
  }, [board, selectedPiece, validMoves]);

  const calculateValidMoves = (board, fromRow, fromCol, piece) => {
    const moves = [];
    
    for (let toRow = 0; toRow < 8; toRow++) {
      for (let toCol = 0; toCol < 8; toCol++) {
        if (isValidMove(board, fromRow, fromCol, toRow, toCol, piece)) {
          moves.push({ row: toRow, col: toCol });
        }
      }
    }
    
    return moves;
  }

  const movePiece = (fromRow, fromCol, toRow, toCol) => {
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => [...row]);
      const piece = newBoard[fromRow][fromCol];
      
      newBoard[toRow][toCol] = { ...piece, cooldown: piece.cooldownTime };
      newBoard[fromRow][fromCol] = null;
      
      return newBoard;
    });
  };

  const getCooldownPercentage = (piece) => {
    return piece ? (piece.cooldown / piece.cooldownTime) * 100 : 0;
  };

  return (
    <div className="game-container">
      <div className="game-info">
        <h2>RTS Chess</h2>
        <p>Game Time: {(gameTime / 1000).toFixed(1)}s</p>
      </div>
      
      <div className="chess-board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, colIndex) => {
              const isSelected = selectedPiece && 
                selectedPiece.row === rowIndex && 
                selectedPiece.col === colIndex;
              
              const isValidTarget = selectedPiece &&
                validMoves.some(move => move.row === rowIndex && move.col === colIndex);
              return (
                <div
                  key={colIndex}
                  className={`square ${(rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark'} ${
                    isSelected ? 'selected' : ''
                  } ${isValidTarget ? 'valid-move' : ''}`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                >
                  {cell && (
                    <div className="piece-container">
                      <div 
                        className={`piece ${cell.color} ${cell.type} ${
                          cell.cooldown > 0 ? 'on-cooldown' : 'ready'
                        }`}
                      >
                        {getPieceSymbol(cell.type)}
                      </div>
                      {cell.cooldown > 0 && (
                        <div 
                          className="cooldown-overlay"
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
      </div>
    </div>
  );
};

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

export default GameBoard;