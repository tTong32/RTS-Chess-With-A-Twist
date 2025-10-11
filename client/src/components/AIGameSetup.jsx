import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BoardEditorPanel from './BoardEditorPanel.jsx';

const EnhancedAIGameSetup = () => {
  const [aiElo, setAiElo] = useState(1200);
  const [playerColor, setPlayerColor] = useState('white');
  const [customBoard, setCustomBoard] = useState(null);
  const [showBoardEditor, setShowBoardEditor] = useState(false);
  const navigate = useNavigate();

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

  const handleBoardChange = (newBoard) => {
    setCustomBoard(newBoard);
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
            {/* Left Side - Board Editor */}
            <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Customize Your Board</h2>
                <button
                  onClick={() => setShowBoardEditor(!showBoardEditor)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                    showBoardEditor 
                      ? 'bg-[#404040] hover:bg-[#505050] text-white' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                  }`}
                >
                  {showBoardEditor ? 'Hide Editor' : 'Show Editor'}
                </button>
              </div>
              
              {showBoardEditor ? (
                <div className="max-h-[600px] overflow-y-auto">
                  <BoardEditorPanel
                    initialBoard={customBoard}
                    onBoardChange={handleBoardChange}
                    playerColor="white"
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">♔</div>
                  <p className="text-gray-400 mb-4">
                    Customize your starting board with special pieces
                  </p>
                  <p className="text-sm text-gray-500">
                    Click "Show Editor" to replace standard pieces with custom ones like Twisted Pawns, Flying Castles, and more!
                  </p>
                </div>
              )}
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

                {/* Game Rules Reminder */}
                <div className="bg-[#404040]/30 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Enhanced Game Rules</h4>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                      Real-time gameplay with energy system
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                      Each piece costs different energy amounts
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      Energy regeneration increases over time
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                      Custom pieces have unique abilities
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                      First to capture the opponent's king wins
                    </li>
                  </ul>
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