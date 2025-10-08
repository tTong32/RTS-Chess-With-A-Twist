import React, { useState, useEffect } from 'react';
import { CustomPieces } from '../game/CustomPieces.js';

// Helper function to get piece symbol
function getPieceSymbol(type) {
  const customPieces = new CustomPieces();
  return customPieces.getPieceInfo(type).symbol;
}

const BoardEditorPanel = ({ initialBoard, onBoardChange, playerColor = 'white' }) => {
  const [customPieces] = useState(new CustomPieces());
  const [board, setBoard] = useState(initialBoard || initializeEmptyBoard());
  const [selectedPieceType, setSelectedPieceType] = useState('pawn');
  const [selectedSquare, setSelectedSquare] = useState(null);

  function initializeEmptyBoard() {
    return Array(8).fill().map(() => Array(8).fill(null));
  }

  // Initialize board with standard setup if no initial board provided
  useEffect(() => {
    if (!initialBoard) {
      const standardBoard = getStandardSetup();
      setBoard(standardBoard);
      onBoardChange(standardBoard);
    }
  }, [initialBoard, onBoardChange]);

  function getStandardSetup() {
    const newBoard = initializeEmptyBoard();
    const cooldownTimes = {
      pawn: 3000, knight: 4000, bishop: 5000, rook: 6000, queen: 8000, king: 10000
    };

    // Set up pawns
    for (let i = 0; i < 8; i++) {
      newBoard[1][i] = { type: 'pawn', color: 'black', cooldown: 0, cooldownTime: cooldownTimes.pawn };
      newBoard[6][i] = { type: 'pawn', color: 'white', cooldown: 0, cooldownTime: cooldownTimes.pawn };
    }

    // Set up back row pieces
    const backRowPieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    backRowPieces.forEach((pieceType, i) => {
      newBoard[0][i] = { 
        type: pieceType, 
        color: 'black', 
        cooldown: 0, 
        cooldownTime: cooldownTimes[pieceType] 
      };
      newBoard[7][i] = { 
        type: pieceType, 
        color: 'white', 
        cooldown: 0, 
        cooldownTime: cooldownTimes[pieceType] 
      };
    });

    return newBoard;
  }

  const handleSquareClick = (row, col) => {
    const piece = board[row][col];
    
    if (piece && piece.color === playerColor) {
      // Select existing piece
      setSelectedSquare({ row, col });
    } else {
      // Place new piece
      const pieceInfo = customPieces.getPieceInfo(selectedPieceType);
      const newBoard = board.map(row => [...row]);
      
      newBoard[row][col] = {
        type: selectedPieceType,
        color: playerColor,
        cooldown: 0,
        cooldownTime: pieceInfo.cooldownTime
      };
      
      setBoard(newBoard);
      onBoardChange(newBoard);
      setSelectedSquare(null);
    }
  };

  const handlePieceTypeSelect = (pieceType) => {
    setSelectedPieceType(pieceType);
    setSelectedSquare(null);
  };

  const clearSquare = (row, col) => {
    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = null;
    setBoard(newBoard);
    onBoardChange(newBoard);
    setSelectedSquare(null);
  };

  const clearAllPieces = () => {
    const newBoard = initializeEmptyBoard();
    setBoard(newBoard);
    onBoardChange(newBoard);
    setSelectedSquare(null);
  };

  const resetToStandard = () => {
    const standardBoard = getStandardSetup();
    setBoard(standardBoard);
    onBoardChange(standardBoard);
    setSelectedSquare(null);
  };

  const allPieceTypes = customPieces.getAllPieceTypes();
  const customPieceTypes = customPieces.getCustomPieceTypes();

  return (
    <div className="flex gap-4">
      {/* Board */}
      <div className="flex flex-col">
        {/* Row numbers */}
        <div className="flex">
          <div className="w-6"></div>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="w-12 h-6 flex items-center justify-center text-sm font-semibold">
              {String.fromCharCode(97 + i)}
            </div>
          ))}
        </div>

        {/* Board squares */}
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {/* Row number */}
            <div className="w-6 h-12 flex items-center justify-center text-sm font-semibold">
              {8 - rowIndex}
            </div>
            
            {row.map((cell, colIndex) => {
              const isSelected = selectedSquare && 
                selectedSquare.row === rowIndex && selectedSquare.col === colIndex;
              
              return (
                <div
                  key={colIndex}
                  className={`w-12 h-12 flex items-center justify-center cursor-pointer border ${
                    (rowIndex + colIndex) % 2 === 0 ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'
                  } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    clearSquare(rowIndex, colIndex);
                  }}
                >
                  {cell && (
                    <div className={`text-2xl ${
                      cell.color === 'white' ? 'text-white' : 'text-black'
                    }`} style={{
                      textShadow: cell.color === 'white' 
                        ? '1px 1px 2px black' 
                        : '1px 1px 2px white'
                    }}>
                      {getPieceSymbol(cell.type)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Piece Selection Panel */}
      <div className="w-64 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Piece Selection</h3>
          <p className="text-sm text-gray-600 mb-3">
            Click a piece type to select it, then click on the board to place it.
            Right-click to remove pieces.
          </p>
        </div>

        {/* Standard Pieces */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Standard Pieces</h4>
          <div className="grid grid-cols-2 gap-2">
            {allPieceTypes.filter(type => !customPieceTypes.includes(type)).map(pieceType => {
              const pieceInfo = customPieces.getPieceInfo(pieceType);
              const isSelected = selectedPieceType === pieceType;
              
              return (
                <button
                  key={pieceType}
                  onClick={() => handlePieceTypeSelect(pieceType)}
                  className={`p-2 rounded border text-center ${
                    isSelected 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-lg mb-1">{pieceInfo.symbol}</div>
                  <div className="text-xs">{pieceInfo.name}</div>
                  <div className="text-xs opacity-75">{pieceInfo.energyCost} energy</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Pieces */}
        {customPieceTypes.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Custom Pieces</h4>
            <div className="grid grid-cols-2 gap-2">
              {customPieceTypes.map(pieceType => {
                const pieceInfo = customPieces.getPieceInfo(pieceType);
                const isSelected = selectedPieceType === pieceType;
                
                return (
                  <button
                    key={pieceType}
                    onClick={() => handlePieceTypeSelect(pieceType)}
                    className={`p-2 rounded border text-center ${
                      isSelected 
                        ? 'bg-purple-500 text-white border-purple-500' 
                        : 'bg-white border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-lg mb-1">{pieceInfo.symbol}</div>
                    <div className="text-xs">{pieceInfo.name}</div>
                    <div className="text-xs opacity-75">{pieceInfo.energyCost} energy</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Piece Info */}
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-semibold text-gray-700 mb-2">Selected Piece</h4>
          {(() => {
            const pieceInfo = customPieces.getPieceInfo(selectedPieceType);
            return (
              <div>
                <div className="text-lg mb-1">{pieceInfo.symbol} {pieceInfo.name}</div>
                <div className="text-sm text-gray-600 mb-2">{pieceInfo.description}</div>
                <div className="text-sm">
                  <div>Energy Cost: {pieceInfo.energyCost}</div>
                  <div>Cooldown: {pieceInfo.cooldownTime / 1000}s</div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Board Controls */}
        <div className="space-y-2">
          <button
            onClick={resetToStandard}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm"
          >
            Reset to Standard
          </button>
          <button
            onClick={clearAllPieces}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoardEditorPanel;
