import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomPieces } from '../game/CustomPieces.js';
import { initializeDefaultBoard } from '../App.jsx';
import SharedNav from './SharedNav.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

// Helper function to get piece symbol
function getPieceSymbol(type) {
  const customPieces = new CustomPieces();
  return customPieces.getPieceInfo(type).symbol;
}

const EnhancedAIGameSetup = () => {
  const [aiElo, setAiElo] = useState(1200);
  const [playerColor, setPlayerColor] = useState('white');
  const [customBoard, setCustomBoard] = useState(null);
  const [displayBoard, setDisplayBoard] = useState(null);
  const navigate = useNavigate();
  const { user, fetchCustomBoard } = useAuth();

  // Load saved board configuration - check server first, then localStorage
  useEffect(() => {
    const loadBoard = async () => {
      let board = null;
      
      // First, try to load from server if user is logged in
      if (user) {
        try {
          board = await fetchCustomBoard();
          if (board) {
            setCustomBoard(board);
            setDisplayBoard(board);
            return;
          }
        } catch (error) {
          console.error('Error loading board from server:', error);
        }
      }
      
      // Fallback to localStorage
      const savedBoard = localStorage.getItem('savedBoardConfiguration');
      if (savedBoard) {
        try {
          const parsedBoard = JSON.parse(savedBoard);
          setCustomBoard(parsedBoard);
          setDisplayBoard(parsedBoard);
          return;
        } catch (error) {
          console.error('Error loading saved board configuration:', error);
        }
      }
      
      // Default board if nothing found
      setDisplayBoard(initializeDefaultBoard());
    };
    
    loadBoard();
  }, [user, fetchCustomBoard]);

  const eloRanges = [
    { min: 400, max: 800, label: 'Beginner', description: 'Makes basic moves, slow reactions', color: 'green' },
    { min: 800, max: 1200, label: 'Novice', description: 'Understands basic tactics', color: 'blue' },
    { min: 1200, max: 1600, label: 'Intermediate', description: 'Good positional play', color: 'yellow' },
    { min: 1600, max: 2000, label: 'Advanced', description: 'Strong tactical awareness', color: 'orange' },
    { min: 2000, max: 2400, label: 'Expert', description: 'Very strong play', color: 'red' },
    { min: 2400, max: 2800, label: 'Master', description: 'Near-perfect play', color: 'purple' }
  ];

  const getEloRange = (elo) => {
    return eloRanges.find(range => elo >= range.min && elo < range.max) || eloRanges[0];
  };

  const currentRange = getEloRange(aiElo);

  const handleStartGame = () => {
    navigate('/ai-game', { 
      state: { 
        aiElo, 
        playerColor,
        gameMode: 'ai',
        customBoard: customBoard
      } 
    });
  };


  const getColorClass = (color) => {
    const colorMap = {
      green: 'from-green-500 to-emerald-500',
      blue: 'from-blue-500 to-cyan-500',
      yellow: 'from-yellow-500 to-orange-500',
      orange: 'from-orange-500 to-red-500',
      red: 'from-red-500 to-pink-500',
      purple: 'from-purple-500 to-indigo-500'
    };
    return colorMap[color] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <SharedNav />

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Play Against AI</h1>
              <p className="text-gray-400 text-lg">Choose your opponent's strength and customize your board</p>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Your Board */}
            <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Board</h2>
                <button
                  onClick={() => navigate('/board-editor')}
                  className="px-4 py-2 rounded-lg font-semibold transition-colors duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  Edit Board
                </button>
              </div>
              
              <div className="text-center py-8">
                {displayBoard && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white mb-4">{customBoard ? 'Your Custom Board' : 'Default Board'}</h4>
                    <div className="flex justify-center">
                      <div className="grid grid-cols-8 gap-1 border-2 border-gray-600 p-2 bg-[#404040]/20 rounded">
                        {displayBoard.map((row, rowIndex) => 
                          row.map((cell, colIndex) => (
                            <div
                              key={`${rowIndex}-${colIndex}`}
                              className={`w-8 h-8 flex items-center justify-center text-sm ${
                                (rowIndex + colIndex) % 2 === 0 ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'
                              }`}
                            >
                              {cell && (
                                <span 
                                  className={`${
                                    cell.color === 'white' ? 'text-white' : 'text-black'
                                  }`}
                                  style={{
                                    textShadow: cell.color === 'white' 
                                      ? '1px 1px 2px black' 
                                      : '1px 1px 2px white'
                                  }}
                                >
                                  {getPieceSymbol(cell.type)}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mt-4">
                      {customBoard ? 'Your saved board configuration will be used for this game.' : 'Click "Edit Board" to create a custom board configuration.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Game Setup */}
            <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] p-6">
              <h2 className="text-2xl font-bold mb-6">Game Setup</h2>

              <div className="space-y-6">
                {/* AI Difficulty Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">AI Difficulty</h3>
                  <div className="space-y-3">
                    {eloRanges.map((range) => (
                      <button
                        key={range.min}
                        onClick={() => setAiElo((range.min + range.max) / 2)}
                        className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          aiElo >= range.min && aiElo < range.max
                            ? `border-${range.color}-500 bg-${range.color}-500/20`
                            : 'border-[#404040] bg-[#404040]/30 hover:bg-[#404040]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{range.label}</div>
                            <div className="text-sm text-gray-400">{range.description}</div>
                          </div>
                          <div className="text-sm font-mono">
                            {range.min}-{range.max}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Current Selection */}
                  <div className={`mt-4 p-4 rounded-lg bg-gradient-to-r ${getColorClass(currentRange.color)} text-white`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold">{currentRange.label}</div>
                        <div className="text-sm opacity-90">{currentRange.description}</div>
                      </div>
                      <div className="text-2xl font-bold">ELO {aiElo}</div>
                    </div>
                  </div>
                </div>

                {/* Player Color Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Your Color</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPlayerColor('white')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        playerColor === 'white'
                          ? 'border-white bg-white text-black'
                          : 'border-gray-400 bg-[#404040] text-white hover:bg-[#505050]'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">♔</div>
                        <div className="font-semibold">White</div>
                        <div className="text-sm opacity-75">Moves first</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setPlayerColor('black')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        playerColor === 'black'
                          ? 'border-black bg-black text-white'
                          : 'border-gray-400 bg-[#404040] text-white hover:bg-[#505050]'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">♚</div>
                        <div className="font-semibold">Black</div>
                        <div className="text-sm opacity-75">AI moves first</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
                  >
                    Back to Home
                  </button>
                  
                  <button
                    onClick={handleStartGame}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Start Game
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAIGameSetup;