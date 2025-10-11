import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

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
              className="w-full flex items-center px-4 py-3 rounded-lg bg-[#404040] text-white hover:bg-[#505050] transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Home
            </button>
            
            <button 
              onClick={() => navigate('/ai-setup')}
              className="w-full flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-[#404040] transition-colors"
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome to RTS Chess</h1>
              <p className="text-gray-400 text-lg">Strategic real-time chess with energy management</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#2c2c2c] rounded-xl p-6 border border-[#404040]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Games Played</h3>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2">127</div>
              <div className="flex items-center text-green-400">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">+12.5%</span>
              </div>
            </div>

            <div className="bg-[#2c2c2c] rounded-xl p-6 border border-[#404040]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Win Rate</h3>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2">78.5%</div>
              <div className="flex items-center text-green-400">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">+5.2%</span>
              </div>
            </div>

            <div className="bg-[#2c2c2c] rounded-xl p-6 border border-[#404040]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Rating</h3>
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2">1,847</div>
              <div className="flex items-center text-green-400">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">+127</span>
              </div>
            </div>
          </div>

          {/* Game Modes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI Game Mode */}
            <div className="bg-[#2c2c2c] rounded-xl p-8 border border-[#404040]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Play vs AI</h3>
                  <p className="text-gray-400">Challenge our intelligent chess AI</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-300">Difficulty Levels</span>
                  <span className="text-white font-semibold">5 Available</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-300">Average Game Time</span>
                  <span className="text-white font-semibold">15-25 min</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-300">AI Response Time</span>
                  <span className="text-white font-semibold">&lt; 2 seconds</span>
                </div>
              </div>

              <button 
                onClick={() => navigate('/ai-setup')}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Start AI Game
              </button>
            </div>

            {/* Multiplayer Mode */}
            <div className="bg-[#2c2c2c] rounded-xl p-8 border border-[#404040]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Multiplayer</h3>
                  <p className="text-gray-400">Play with friends online</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-300">Online Players</span>
                  <span className="text-green-400 font-semibold">1,247 Active</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-300">Average Queue Time</span>
                  <span className="text-white font-semibold">&lt; 30 seconds</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-300">Custom Boards</span>
                  <span className="text-white font-semibold">Supported</span>
                </div>
              </div>

              <button 
                onClick={() => navigate('/multiplayer')}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Enter Lobby
              </button>
            </div>
          </div>

          {/* Recent Games */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Recent Games</h3>
              <button className="text-blue-400 hover:text-blue-300 transition-colors">
                View All
              </button>
            </div>
            
            <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#404040]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Opponent</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Result</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Duration</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#404040]">
                    <tr className="hover:bg-[#404040]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mr-3"></div>
                          <span className="font-medium">AI Master</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-sm font-medium">Win</span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">18:42</td>
                      <td className="px-6 py-4 text-gray-300">2 hours ago</td>
                    </tr>
                    <tr className="hover:bg-[#404040]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mr-3"></div>
                          <span className="font-medium">ChessPlayer123</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-md text-sm font-medium">Loss</span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">25:17</td>
                      <td className="px-6 py-4 text-gray-300">1 day ago</td>
                    </tr>
                    <tr className="hover:bg-[#404040]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mr-3"></div>
                          <span className="font-medium">StrategicMind</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-sm font-medium">Win</span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">32:08</td>
                      <td className="px-6 py-4 text-gray-300">3 days ago</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;