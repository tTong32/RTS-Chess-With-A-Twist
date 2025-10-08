import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AIGameSetup = () => {
  const [aiElo, setAiElo] = useState(1200);
  const [playerColor, setPlayerColor] = useState('white');
  const navigate = useNavigate();

  const eloRanges = [
    { min: 400, max: 800, label: 'Beginner', description: 'Makes basic moves, slow reactions' },
    { min: 800, max: 1200, label: 'Novice', description: 'Understands basic tactics' },
    { min: 1200, max: 1600, label: 'Intermediate', description: 'Good positional play' },
    { min: 1600, max: 2000, label: 'Advanced', description: 'Strong tactical awareness' },
    { min: 2000, max: 2400, label: 'Expert', description: 'Very strong play' },
    { min: 2400, max: 2800, label: 'Master', description: 'Near-perfect play' }
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
        gameMode: 'ai'
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Play Against AI</h1>
          <p className="text-gray-600">Choose your opponent's strength</p>
        </div>

        <div className="space-y-8">
          {/* ELO Slider */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label htmlFor="elo-slider" className="text-lg font-semibold text-gray-700">
                AI Difficulty (ELO Rating)
              </label>
              <span className="text-2xl font-bold text-blue-600">{aiElo}</span>
            </div>
            
            <input
              type="range"
              id="elo-slider"
              min="400"
              max="2800"
              step="50"
              value={aiElo}
              onChange={(e) => setAiElo(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((aiElo - 400) / 2400) * 100}%, #e5e7eb ${((aiElo - 400) / 2400) * 100}%, #e5e7eb 100%)`
              }}
            />
            
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>400 (Beginner)</span>
              <span>2800 (Master)</span>
            </div>
          </div>

          {/* Current Difficulty Display */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {currentRange.label} Level
              </h3>
              <p className="text-gray-600 mb-4">
                {currentRange.description}
              </p>
              
              {/* Difficulty Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded p-3">
                  <div className="font-semibold text-gray-700">Reaction Time</div>
                  <div className="text-blue-600">
                    {Math.max(200, 2000 - (aiElo - 400) * 0.7).toFixed(0)}ms
                  </div>
                </div>
                <div className="bg-white rounded p-3">
                  <div className="font-semibold text-gray-700">Search Depth</div>
                  <div className="text-blue-600">
                    {Math.max(1, Math.floor((aiElo - 400) / 400) + 1)} moves
                  </div>
                </div>
                <div className="bg-white rounded p-3">
                  <div className="font-semibold text-gray-700">Accuracy</div>
                  <div className="text-blue-600">
                    {Math.max(0.3, Math.min(1.0, (aiElo - 400) / 2000) * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="bg-white rounded p-3">
                  <div className="font-semibold text-gray-700">Aggressiveness</div>
                  <div className="text-blue-600">
                    {Math.max(0.2, Math.min(1.0, (aiElo - 400) / 1500) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Player Color Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Choose Your Color</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setPlayerColor('white')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all duration-200 ${
                  playerColor === 'white'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">♔</div>
                  <div className="font-semibold">White</div>
                  <div className="text-sm opacity-75">You go first</div>
                </div>
              </button>
              
              <button
                onClick={() => setPlayerColor('black')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all duration-200 ${
                  playerColor === 'black'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">♚</div>
                  <div className="font-semibold">Black</div>
                  <div className="text-sm opacity-75">AI goes first</div>
                </div>
              </button>
            </div>
          </div>

          {/* Game Rules Reminder */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Real-time Chess Rules</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• No turns - move any available piece at any time</li>
              <li>• Pieces have cooldown timers after moving</li>
              <li>• First to capture the opponent's king wins</li>
              <li>• Plan your moves around cooldown timings</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Back to Home
            </button>
            
            <button
              onClick={handleStartGame}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGameSetup;
