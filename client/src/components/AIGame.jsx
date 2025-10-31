import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChessAI } from '../game/ChessAI.js';
import { CustomPieces } from '../game/CustomPieces.js';
import { EnergySystem } from '../game/EnergySystem.js';

// Helper function to get piece symbol
function getPieceSymbol(type) {
  const customPiecesInstance = new CustomPieces();
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
  const { aiElo, playerColor, customBoard } = location.state || {};
  
  const customPieces = useRef(new CustomPieces()).current;
  const energySystem = useRef(new EnergySystem()).current;

  const initializeBoard = useCallback(() => {
    const initialBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    for (let i = 0; i < 8; i++) {
      const pawnInfo = customPieces.getPieceInfo('pawn');
      initialBoard[1][i] = { type: 'pawn', color: 'black', cooldown: 0, cooldownTime: pawnInfo.cooldownTime };
      initialBoard[6][i] = { type: 'pawn', color: 'white', cooldown: 0, cooldownTime: pawnInfo.cooldownTime };
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
  }, [customPieces]);

  const [board, setBoard] = useState(() => customBoard || initializeBoard());
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
  const [boardRotated, setBoardRotated] = useState(playerColor === 'black');
  
  // Energy system state
  const [whiteEnergy, setWhiteEnergy] = useState(energySystem.energyLimits.startingEnergy);
  const [blackEnergy, setBlackEnergy] = useState(energySystem.energyLimits.startingEnergy);
  const [lastEnergyUpdate, setLastEnergyUpdate] = useState(0);

  const isValidMove = useCallback((board, fromRow, fromCol, toRow, toCol, piece) => {
    return customPieces.isValidMove(board, fromRow, fromCol, toRow, toCol, piece);
  }, [customPieces]);

  // Initialize AI
  useEffect(() => {
    if (aiElo && playerColor) {
      const aiInstance = new ChessAI(aiElo);
      aiInstance.color = playerColor === 'white' ? 'black' : 'white';
      aiInstance.energySystem = energySystem;
      setAi(aiInstance);
    } else {
      navigate('/ai-setup');
    }
  }, [aiElo, playerColor, navigate, energySystem]);

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
  }, [gameStatus, ai, energySystem, lastEnergyUpdate, whiteEnergy, blackEnergy]);

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

      // Trigger piece's special onMove effect if it has one
      const pieceInfo = customPieces.getPieceInfo(piece.type);
      if (pieceInfo.onMove) {
        pieceInfo.onMove(newBoard, toRow, toCol, piece);
      }

      return newBoard;
    });
  }, [showWinScreen, gameTime, playerColor, board, energySystem, whiteEnergy, blackEnergy]);

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
    const currentRegenerationRate = energySystem.getRegenerationRate(gameTime); 
    
    switch (gameStatus) {
      case 'white-wins': return <p className="text-xl font-bold text-green-400">White Wins!</p>;
      case 'black-wins': return <p className="text-xl font-bold text-green-400">Black Wins!</p>;
      case 'playing': 
      default: return (
        <div className="text-center">
          <p className="text-lg">You are playing as <span className="font-bold text-blue-400">{playerColor}</span></p>
          <p className="text-sm text-gray-400">AI ELO: <span className="font-bold text-orange-400">{aiElo}</span></p>
          <p className="text-sm text-gray-400">Energy Regen: {currentRegenerationRate.toFixed(1)}/sec</p>
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
    setWhiteEnergy(energySystem.energyLimits.startingEnergy);
    setBlackEnergy(energySystem.energyLimits.startingEnergy);
    setLastEnergyUpdate(0);
    if (ai) {
      ai.moveHistory = [];
      ai.lastMoveTime = 0;
    }
  }, [ai, energySystem, initializeBoard]);

  const handleLeaveGame = () => {
    navigate('/');
  };

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
              onClick={() => navigate('/ai-setup')}
              className="w-full flex items-center px-4 py-3 rounded-lg bg-[#404040] text-white hover:bg-[#505050] transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Play vs AI
            </button>
            
            <button 
              onClick={() => navigate('/multiplayer')}
              className="w-full flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-[#404040] transition-colors"
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
              <h1 className="text-4xl font-bold mb-2">RTS Chess vs AI</h1>
              <p className="text-gray-400 text-lg">Challenge our intelligent chess AI</p>
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
              <div className="text-2xl font-bold">{(gameTime / 1000).toFixed(1)}s</div>
            </div>

            <div className="bg-[#2c2c2c] rounded-xl p-6 border border-[#404040]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-300">AI ELO</h3>
                <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="text-2xl font-bold">{aiElo}</div>
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
                
                {/* AI Status */}
                <div className="mt-4 text-sm bg-[#404040] rounded-lg p-3">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <span className="text-gray-400">AI Thinking:</span>
                      <span className={`ml-2 font-bold ${aiStatus.isThinking ? 'text-red-400' : 'text-green-400'}`}>
                        {aiStatus.isThinking ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">AI Moves:</span>
                      <span className="ml-2 font-bold text-blue-400">{aiStatus.moveCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Energy Regen:</span>
                      <span className="ml-2 font-bold text-green-400">{energySystem.getRegenerationRate(gameTime).toFixed(1)}/sec</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
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
                            {entry.isAI ? 'AI' : 'You'}
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
                <div className="space-y-3">
                  <button
                    onClick={resetGame}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    New Game
                  </button>
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
                <p className="text-lg">
                  {winColor === playerColor ? 'You won!' : 'AI won!'}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
                onClick={resetGame}
              >
                Play Again
              </button>
              
              <button
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
                onClick={handleLeaveGame}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIGame;