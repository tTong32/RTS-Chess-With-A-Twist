import React, { useState, useEffect, useRef } from 'react';
import { CustomPieces } from '../game/CustomPieces.js';

// Helper function to get piece symbol
function getPieceSymbol(type) {
  const customPieces = new CustomPieces();
  return customPieces.getPieceInfo(type).symbol;
}

// Helper function to categorize pieces
function categorizePieces(customPieces) {
  const allPieceTypes = customPieces.getAllPieceTypes();
  const customPieceTypes = customPieces.getCustomPieceTypes();
  
  return {
    frontRow: allPieceTypes.filter(type => type === 'pawn').concat(
      customPieceTypes.filter(type => ['twisted-pawn'].includes(type))
    ),
    backRow: allPieceTypes.filter(type => ['rook', 'knight', 'bishop', 'queen'].includes(type)).concat(
      customPieceTypes.filter(type => ['flying-castle', 'shadow-knight', 'ice-bishop'].includes(type))
    ),
    king: allPieceTypes.filter(type => type === 'king')
  };
}

// Helper function to get piece category
function getPieceCategory(pieceType) {
  if (pieceType === 'pawn' || pieceType === 'twisted-pawn') return 'frontRow';
  if (['rook', 'knight', 'bishop', 'queen', 'flying-castle', 'shadow-knight', 'ice-bishop'].includes(pieceType)) return 'backRow';
  if (pieceType === 'king') return 'king';
  return 'backRow'; // default
}

// Loading indicator component
const LoadingIndicator = ({ isVisible, position }) => {
  if (!isVisible) return null;

  return (
    <div 
      className="absolute z-50 bg-[#1a1a1a] border border-[#404040] rounded-lg p-4 shadow-lg"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)'
      }}
    >
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500"></div>
        <span className="text-white text-sm">Loading...</span>
      </div>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#404040]"></div>
      </div>
    </div>
  );
};

// Tooltip component for piece information
const PieceTooltip = ({ pieceInfo, isVisible, position, onMouseEnter, onMouseLeave }) => {
  if (!isVisible || !pieceInfo) return null;

  return (
    <div 
      className="absolute z-50 bg-[#1a1a1a] border border-[#404040] rounded-lg p-3 shadow-lg max-w-xs"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="text-white font-semibold mb-2">{pieceInfo.name}</div>
      <div className="text-sm text-gray-300 mb-2">{pieceInfo.description}</div>
      <div className="text-sm text-gray-400">
        <div>Energy Cost: {pieceInfo.energyCost}</div>
        <div>Cooldown: {pieceInfo.cooldownTime / 1000}s</div>
      </div>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#404040]"></div>
      </div>
    </div>
  );
};

const BoardEditorPanel = ({ initialBoard, onBoardChange, playerColor = 'white' }) => {
  const [customPieces] = useState(new CustomPieces());
  const [board, setBoard] = useState(initialBoard || initializeEmptyBoard());
  const [selectedPieceType, setSelectedPieceType] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipPieceInfo, setTooltipPieceInfo] = useState(null);
  const [loadingVisible, setLoadingVisible] = useState(false);
  const [loadingPosition, setLoadingPosition] = useState({ top: 0, left: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const [boardSize, setBoardSize] = useState(400); // Board size in pixels
  const [isResizing, setIsResizing] = useState(false);
  const tooltipTimeoutRef = useRef(null);
  const resizeRef = useRef(null);
  const tooltipDelay = 500;

  function initializeEmptyBoard() {
    return Array(8).fill().map(() => Array(8).fill(null));
  }

  // Initialize board with standard setup if no initial board provided
  useEffect(() => {
    if (!initialBoard) {
      const standardBoard = getStandardSetup();
      setBoard(standardBoard);
      onBoardChange(standardBoard);
    } else {
      setBoard(initialBoard);
    }
  }, [initialBoard]);

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
    // Only allow editing rows 1 and 2 (rows 6 and 7 in array index)
    if (row < 6 || row > 7) {
      setErrorMessage('Only rows 1 and 2 are editable');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const piece = board[row][col];
    
    if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
      // Deselect if clicking the same square
      setSelectedSquare(null);
      setSelectedPieceType(null);
      return;
    }

    if (selectedSquare && piece) {
      // Perform true unit-to-unit swap
      const sourcePiece = board[selectedSquare.row][selectedSquare.col];
      const targetPiece = board[row][col];
      
      // Check if we can swap (same category)
      const sourceCategory = getPieceCategory(sourcePiece.type);
      const targetCategory = getPieceCategory(targetPiece.type);
      
      if (sourceCategory !== targetCategory) {
        setErrorMessage(`Cannot swap ${sourcePiece.type} with ${targetPiece.type}. Must be same category.`);
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }
      
      // Perform the swap
      const newBoard = board.map(row => [...row]);
      newBoard[selectedSquare.row][selectedSquare.col] = targetPiece;
      newBoard[row][col] = sourcePiece;
      
      setBoard(newBoard);
      onBoardChange(newBoard);
      setSelectedSquare(null);
      setSelectedPieceType(null);
      setErrorMessage('');
      return;
    }

    if (piece && piece.color === playerColor) {
      // Select the piece on the board for swapping
      setSelectedSquare({ row, col });
      setSelectedPieceType(null); // Don't select in piece panel
    } else if (selectedPieceType) {
      // Place new piece from panel
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
      setSelectedPieceType(null);
      setErrorMessage('');
    }
  };

  const handlePieceTypeSelect = (pieceType) => {
    setSelectedPieceType(pieceType);
    setSelectedSquare(null); // Clear board selection when selecting from panel
    setErrorMessage('');
  };

  const clearSquare = (row, col) => {
    // Only allow clearing rows 1 and 2
    if (row < 6 || row > 7) {
      setErrorMessage('Only rows 1 and 2 are editable');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = null;
    setBoard(newBoard);
    onBoardChange(newBoard);
    setSelectedSquare(null);
    setSelectedPieceType(null);
  };

  const clearAllPieces = () => {
    const newBoard = board.map(row => [...row]);
    // Clear only rows 1 and 2
    for (let i = 6; i <= 7; i++) {
      for (let j = 0; j < 8; j++) {
        newBoard[i][j] = null;
      }
    }
    setBoard(newBoard);
    onBoardChange(newBoard);
    setSelectedSquare(null);
    setSelectedPieceType(null);
  };

  const resetToStandard = () => {
    const standardBoard = getStandardSetup();
    setBoard(standardBoard);
    onBoardChange(standardBoard);
    setSelectedSquare(null);
    setSelectedPieceType(null);
  };

  const handlePieceHover = (pieceType, event) => {
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    // Show loading indicator immediately
    const rect = event.currentTarget.getBoundingClientRect();
    setLoadingPosition({
      top: rect.bottom + 10,
      left: rect.left + rect.width / 2
    });
    setLoadingVisible(true);

    // Set timeout for 1.5 seconds
    tooltipTimeoutRef.current = setTimeout(() => {
      const pieceInfo = customPieces.getPieceInfo(pieceType);
      
      setLoadingVisible(false);
      setTooltipPieceInfo(pieceInfo);
      setTooltipPosition({
        top: rect.bottom + 10,
        left: rect.left + rect.width / 2
      });
      setTooltipVisible(true);
    }, tooltipDelay);
  };

  const handlePieceHoverEnd = () => {
    // Clear timeout if mouse leaves before 1.5s
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setLoadingVisible(false);
    // Don't hide tooltip immediately - let it stay visible
  };

  const handleTooltipHover = () => {
    // Keep tooltip visible when hovering over it
    setLoadingVisible(false);
  };

  const handleTooltipHoverEnd = () => {
    // Hide tooltip when mouse leaves the tooltip
    setTooltipVisible(false);
    setTooltipPieceInfo(null);
  };

  // Board resize handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    const newSize = Math.max(300, Math.min(700, e.clientX - 100));
    setBoardSize(newSize);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const pieceCategories = categorizePieces(customPieces);
  const squareSize = boardSize / 8;
  const pieceIconSize = Math.max(16, Math.min(48, squareSize * 0.4));

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header with Clear Board button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-white">Board Editor</h3>
          <p className="text-sm text-gray-400 mt-1">Only rows 1 and 2 are editable. Click pieces to swap or select from panel to place.</p>
        </div>
        <button
          onClick={clearAllPieces}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
        >
          Clear Editable Rows
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Board with resize handle - Centered */}
      <div className="flex justify-center">
        <div className="flex flex-col relative" style={{ width: boardSize + 32 }}>
          {/* Column letters */}
          <div className="flex">
            <div className="w-8"></div>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex items-center justify-center text-sm font-semibold text-white" style={{ width: squareSize }}>
                {String.fromCharCode(97 + i)}
              </div>
            ))}
          </div>

          {/* Board squares */}
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {/* Row number */}
              <div className="w-8 flex items-center justify-center text-sm font-semibold text-white" style={{ height: squareSize }}>
                {8 - rowIndex}
              </div>
              
              {row.map((cell, colIndex) => {
                const isSelected = selectedSquare && 
                  selectedSquare.row === rowIndex && selectedSquare.col === colIndex;
                const isEditable = rowIndex >= 6 && rowIndex <= 7; // Only rows 1 and 2
                
                return (
                  <div
                    key={colIndex}
                    className={`flex items-center justify-center border ${
                      (rowIndex + colIndex) % 2 === 0 ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'
                    } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${
                      isEditable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                    }`}
                    style={{
                      width: squareSize,
                      height: squareSize
                    }}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (isEditable) {
                        clearSquare(rowIndex, colIndex);
                      }
                    }}
                  >
                    {cell && (
                      <div className={`${
                        cell.color === 'white' ? 'text-white' : 'text-black'
                      }`} style={{
                        textShadow: cell.color === 'white' 
                          ? '1px 1px 2px black' 
                          : '1px 1px 2px white',
                        fontSize: `${pieceIconSize}px`
                      }}>
                        {getPieceSymbol(cell.type)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Resize handle */}
          <div
            ref={resizeRef}
            className="absolute bottom-0 right-0 w-4 h-4 bg-gray-500 hover:bg-gray-400 cursor-se-resize flex items-center justify-center transition-colors"
            onMouseDown={handleMouseDown}
            style={{
              transform: 'translate(50%, 50%)'
            }}
          >
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 12l4-4 4 4H8z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Piece Selection */}
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Piece Selection</h4>
          <p className="text-sm text-gray-300 mb-4">
            Click a piece type to select it, then click on editable rows to place it. Click existing pieces to swap with same category.
          </p>
          {selectedPieceType && (
            <div className="bg-blue-500/20 border border-blue-500/50 text-blue-400 px-4 py-2 rounded-lg mb-4">
              Selected: {customPieces.getPieceInfo(selectedPieceType).name}
            </div>
          )}
          {selectedSquare && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg mb-4">
              Board piece selected for swapping
            </div>
          )}
        </div>

        {/* Front Row (Pawns + Twisted Pawn) */}
        <div>
          <h5 className="font-semibold text-gray-300 mb-2">Front Row</h5>
          <div className="grid grid-cols-4 gap-3">
            {pieceCategories.frontRow.map(pieceType => {
              const pieceInfo = customPieces.getPieceInfo(pieceType);
              const isSelected = selectedPieceType === pieceType;
              
              return (
                <button
                  key={pieceType}
                  onClick={() => handlePieceTypeSelect(pieceType)}
                  onMouseEnter={(e) => handlePieceHover(pieceType, e)}
                  onMouseLeave={handlePieceHoverEnd}
                  className={`relative p-3 rounded-lg border text-center transition-all duration-200 ${
                    isSelected 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-[#404040] border-[#505050] hover:border-[#606060] text-white hover:bg-[#505050]'
                  }`}
                >
                  <div className="text-2xl mb-2">{pieceInfo.symbol}</div>
                  <div className="text-sm font-medium">{pieceInfo.name}</div>
                  <div className="text-xs opacity-75 mt-1">
                    <div>{pieceInfo.energyCost} energy</div>
                    <div>{pieceInfo.cooldownTime / 1000}s cooldown</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Back Row (Rook, Knight, Bishop, Queen + Custom Back Row pieces) */}
        <div>
          <h5 className="font-semibold text-gray-300 mb-2">Back Row</h5>
          <div className="grid grid-cols-4 gap-3">
            {pieceCategories.backRow.map(pieceType => {
              const pieceInfo = customPieces.getPieceInfo(pieceType);
              const isSelected = selectedPieceType === pieceType;
              
              return (
                <button
                  key={pieceType}
                  onClick={() => handlePieceTypeSelect(pieceType)}
                  onMouseEnter={(e) => handlePieceHover(pieceType, e)}
                  onMouseLeave={handlePieceHoverEnd}
                  className={`relative p-3 rounded-lg border text-center transition-all duration-200 ${
                    isSelected 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-[#404040] border-[#505050] hover:border-[#606060] text-white hover:bg-[#505050]'
                  }`}
                >
                  <div className="text-2xl mb-2">{pieceInfo.symbol}</div>
                  <div className="text-sm font-medium">{pieceInfo.name}</div>
                  <div className="text-xs opacity-75 mt-1">
                    <div>{pieceInfo.energyCost} energy</div>
                    <div>{pieceInfo.cooldownTime / 1000}s cooldown</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* King */}
        <div>
          <h5 className="font-semibold text-gray-300 mb-2">King</h5>
          <div className="grid grid-cols-4 gap-3">
            {pieceCategories.king.map(pieceType => {
              const pieceInfo = customPieces.getPieceInfo(pieceType);
              const isSelected = selectedPieceType === pieceType;
              
              return (
                <button
                  key={pieceType}
                  onClick={() => handlePieceTypeSelect(pieceType)}
                  onMouseEnter={(e) => handlePieceHover(pieceType, e)}
                  onMouseLeave={handlePieceHoverEnd}
                  className={`relative p-3 rounded-lg border text-center transition-all duration-200 ${
                    isSelected 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-[#404040] border-[#505050] hover:border-[#606060] text-white hover:bg-[#505050]'
                  }`}
                >
                  <div className="text-2xl mb-2">{pieceInfo.symbol}</div>
                  <div className="text-sm font-medium">{pieceInfo.name}</div>
                  <div className="text-xs opacity-75 mt-1">
                    <div>{pieceInfo.energyCost} energy</div>
                    <div>{pieceInfo.cooldownTime / 1000}s cooldown</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Board Controls */}
      <div className="flex justify-center space-x-4 pt-4">
        <button
          onClick={resetToStandard}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg text-sm font-medium transition-colors"
        >
          Reset to Standard
        </button>
      </div>

      {/* Loading Indicator */}
      <LoadingIndicator 
        isVisible={loadingVisible}
        position={loadingPosition}
      />

      {/* Tooltip */}
      <PieceTooltip 
        pieceInfo={tooltipPieceInfo}
        isVisible={tooltipVisible}
        position={tooltipPosition}
        onMouseEnter={handleTooltipHover}
        onMouseLeave={handleTooltipHoverEnd}
      />
    </div>
  );
};

export default BoardEditorPanel;