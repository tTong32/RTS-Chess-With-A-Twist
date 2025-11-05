import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { CustomPieces } from '../game/CustomPieces.js';
import SharedNav from './SharedNav.jsx';

// Helper function to get piece symbol
function getPieceSymbol(type) {
  const customPieces = new CustomPieces();
  return customPieces.getPieceInfo(type).symbol;
}

const Home = () => {
  const navigate = useNavigate();
  const { user, loading, signup, login, logout, refreshUserData, fetchCustomBoard } = useAuth();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Auth form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [customBoard, setCustomBoard] = useState(null);

  useEffect(() => {
    if (user) {
      loadCustomBoard();
      refreshUserData();
    }
  }, [user]);

  const loadCustomBoard = async () => {
    const board = await fetchCustomBoard();
    setCustomBoard(board);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      let result;
      if (isSignup) {
        result = await signup(username, email, password, rememberMe);
      } else {
        result = await login(email, password, rememberMe);
      }

      if (result.success) {
        setShowAuthModal(false);
        setUsername('');
        setEmail('');
        setPassword('');
        setRememberMe(false);
      } else {
        setAuthError(result.error);
      }
    } catch (error) {
      setAuthError('An unexpected error occurred');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePlayClick = (destination) => {
    if (!user) {
      setShowAuthModal(true);
      setAuthError('Please sign up or log in to play');
    } else {
      navigate(destination);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <SharedNav />

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
              {user ? (
                <div className="relative group">
                  <button className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{user.username.charAt(0).toUpperCase()}</span>
                  </button>
                  <div className="absolute right-0 top-12 w-48 bg-[#2c2c2c] border border-[#404040] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <div className="p-4 border-b border-[#404040]">
                      <p className="text-white font-semibold">{user.username}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-300 hover:bg-[#404040] transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg transition-all"
                >
                  Sign Up / Login
                </button>
              )}
            </div>
          </div>

          {!user ? (
            // Not logged in - show welcome message and prompt to sign up
            <div className="bg-[#2c2c2c] rounded-xl p-12 border border-[#404040] text-center">
              <h2 className="text-3xl font-bold mb-4">Welcome to RTS Chess</h2>
              <p className="text-gray-400 text-lg mb-8">
                Sign up to start playing strategic real-time chess with energy management
              </p>
              <button 
                onClick={() => setShowAuthModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all transform hover:scale-105"
              >
                Get Started
              </button>
            </div>
          ) : (
            <>
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
                  <div className="text-3xl font-bold mb-2">{user.stats.gamesPlayed || 0}</div>
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
                  <div className="text-3xl font-bold mb-2">
                    {user.stats.gamesPlayed > 0 
                      ? ((user.stats.wins / user.stats.gamesPlayed) * 100).toFixed(1) 
                      : 0}%
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
                  <div className="text-3xl font-bold mb-2">{user.stats.rating || 1000}</div>
                </div>
              </div>

              {/* Game Modes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Custom Board Showcase */}
                <div className="bg-[#2c2c2c] rounded-xl p-6 border border-[#404040]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Your Custom Board</h3>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" />
                      </svg>
                    </div>
                  </div>
                  
                  {customBoard ? (
                    <div className="mb-4">
                      <div className="grid grid-cols-8 gap-1 bg-[#1a1a1a] p-2 rounded-lg">
                        {Array(8).fill().map((_, row) =>
                          Array(8).fill().map((_, col) => {
                            const piece = customBoard[row]?.[col];
                            const isDark = (row + col) % 2 === 0;
                            return (
                              <div
                                key={`${row}-${col}`}
                                className={`w-6 h-6 flex items-center justify-center text-xs ${isDark ? 'bg-[#2c2c2c]' : 'bg-[#4a4a4a]'}`}
                              >
                                {piece && (
                                  <span className={piece.color === 'white' ? 'text-white' : 'text-gray-400'}>
                                    {getPieceSymbol(piece.type)}
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 mb-4">No custom board saved yet</p>
                  )}

                  <button 
                    onClick={() => navigate('/board-editor')}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    {customBoard ? 'Edit Board' : 'Create Board'}
                  </button>
                </div>

                {/* AI Game Mode */}
                <div className="bg-[#2c2c2c] rounded-xl p-6 border border-[#404040]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">Play vs AI</h3>
                      <p className="text-gray-400 text-sm">Challenge our intelligent chess AI</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate('/ai-setup')}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Start AI Game
                  </button>
                </div>

                {/* Multiplayer Mode */}
                <div className="bg-[#2c2c2c] rounded-xl p-6 border border-[#404040]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">Multiplayer</h3>
                      <p className="text-gray-400 text-sm">Play with friends online</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate('/multiplayer')}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Enter Lobby
                  </button>
                </div>
              </div>

              {/* Recent Games */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">Recent Games</h3>
                </div>
                
                <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] overflow-hidden">
                  {user.recentGames && user.recentGames.length > 0 ? (
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
                          {user.recentGames.slice(0, 5).map((game, index) => (
                            <tr key={index} className="hover:bg-[#404040]/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mr-3"></div>
                                  <span className="font-medium">{game.opponent || 'Unknown'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-md text-sm font-medium ${
                                  game.result === 'Win' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : game.result === 'Loss'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {game.result}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-300">{game.duration || 'N/A'}</td>
                              <td className="px-6 py-4 text-gray-300">{formatDate(game.date)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <p className="text-gray-400 text-lg">No games played yet</p>
                      <p className="text-gray-500">Start playing to see your recent games here</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAuthModal(false)}>
          <div className="bg-[#2c2c2c] rounded-xl p-8 max-w-md w-full mx-4 border border-[#404040]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{isSignup ? 'Sign Up' : 'Login'}</h2>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAuth}>
              {isSignup && (
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#404040] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#404040] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#404040] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Remember Me Checkbox - only show on login */}
              {!isSignup && (
                <div className="mb-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 bg-[#1a1a1a] border border-[#404040] rounded text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-2 text-gray-300">Remember Me</span>
                  </label>
                </div>
              )}

              {authError && (
                <div className="mb-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? 'Loading...' : (isSignup ? 'Sign Up' : 'Login')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignup(!isSignup);
                  setAuthError('');
                }}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
