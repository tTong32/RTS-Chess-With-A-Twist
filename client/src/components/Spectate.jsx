import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../config.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import SharedNav from './SharedNav.jsx';

const Spectate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [activeGames, setActiveGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spectatingRoomId, setSpectatingRoomId] = useState(null);

  useEffect(() => {
    loadActiveGames();
    
    // Initialize socket
    const newSocket = io(SERVER_URL, {
      transports: ['websocket'],
      upgrade: false
    });
    setSocket(newSocket);

    // Listen for game state updates
    newSocket.on('game-state', (gameState) => {
      // Update local state if spectating
      console.log('Game state update:', gameState);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const loadActiveGames = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/games/active`);
      const data = await response.json();
      
      if (data.success) {
        setActiveGames(data.games);
      }
    } catch (error) {
      console.error('Error loading active games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpectate = (roomId) => {
    if (!socket) return;
    
    setSpectatingRoomId(roomId);
    socket.emit('spectate-game', { roomId });
    
    // Navigate to spectate view (we'll create this or use existing game view)
    navigate(`/multiplayer-game?spectate=true&room=${roomId}`, {
      state: {
        roomId,
        spectating: true
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <SharedNav />

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Spectate Games</h1>
              <p className="text-gray-400 text-lg">Watch games in progress</p>
            </div>
            <button
              onClick={loadActiveGames}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Active Games List */}
          <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500 mx-auto"></div>
              </div>
            ) : activeGames.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👀</div>
                <p className="text-gray-400 text-lg">No active games to spectate</p>
                <p className="text-gray-500">Games will appear here when players start playing</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeGames.map((game) => (
                  <div key={game.roomId} className="flex items-center justify-between bg-[#404040] p-4 rounded-lg hover:bg-[#505050] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold">{game.player1} vs {game.player2}</div>
                        <div className="text-sm text-gray-400">Room: {game.roomId}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSpectate(game.roomId)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Spectate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Spectate;

