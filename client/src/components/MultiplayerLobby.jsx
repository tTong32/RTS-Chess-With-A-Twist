import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { CustomPieces } from '../game/CustomPieces.js';
import { initializeDefaultBoard } from '../App.jsx';
import { SERVER_URL } from '../config.js';
import { useAuth } from '../contexts/AuthContext.jsx';

// Helper function to get piece symbol
function getPieceSymbol(type) {
  const customPieces = new CustomPieces();
  return customPieces.getPieceInfo(type).symbol;
}

const EnhancedMultiplayerLobby = () => {
  const navigate = useNavigate();
  const { user, fetchFriends } = useAuth();
  
  const [socket, setSocket] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [gameData, setGameData] = useState(null);
  const [customBoard, setCustomBoard] = useState(null);
  const [displayBoard, setDisplayBoard] = useState(null);
  const [friends, setFriends] = useState([]);
  
  // Load friends
  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user]);
  
  const loadFriends = async () => {
    const friendsList = await fetchFriends();
    setFriends(friendsList);
  };

  // Load saved board configuration from localStorage
  useEffect(() => {
    const savedBoard = localStorage.getItem('savedBoardConfiguration');
    if (savedBoard) {
      try {
        const parsedBoard = JSON.parse(savedBoard);
        setCustomBoard(parsedBoard);
        setDisplayBoard(parsedBoard);
      } catch (error) {
        console.error('Error loading saved board configuration:', error);
        setDisplayBoard(initializeDefaultBoard());
      }
    } else {
      setDisplayBoard(initializeDefaultBoard());
    }
  }, []);

  useEffect(() => {
    // Check if we already have a socket to prevent duplicates
    if (socket) {
      console.log('Socket already exists, not creating new one');
      return;
    }

    // Initialize socket connection ONCE when component mounts
    console.log('Creating new socket connection to:', SERVER_URL);
    const newSocket = io(SERVER_URL, {
      transports: ['websocket'],
      upgrade: false
    });
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('room-created', (data) => {
      console.log('Room created:', data);
      setGameData(data);
      setIsSearching(false);
      
      window.multiplayerSocket = newSocket;
      
      navigate('/multiplayer-game', { 
        state: { 
          ...data,
          isHost: true
        } 
      });
    });

    newSocket.on('room-joined', (data) => {
      console.log('Room joined:', data);
      setGameData(data);
      setIsSearching(false);
      
      window.multiplayerSocket = newSocket;
      
      navigate('/multiplayer-game', { 
        state: { 
          ...data,
          isHost: false
        } 
      });
    });

    newSocket.on('error', (data) => {
      console.error('Lobby socket error:', data);
      setError(data.message);
      setIsSearching(false);
    });

    return () => {
      if (!window.multiplayerSocket) {
        newSocket.close();
      }
    };
  }, []);

  const handleFindGame = async () => {
    if (!user) {
      setError('Please log in to play multiplayer');
      return;
    }

    setError('');
    setIsSearching(true);

    try {
      const response = await fetch(`${SERVER_URL}/api/user/${user.id}/matchmaking/queue`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success && data.matched) {
        // Match found! Create game room
        socket.emit('create-room', { 
          playerName: user.username,
          customBoard: customBoard
        });
      } else if (data.success) {
        // Still searching, poll for match
        setError('Searching for opponent...');
        const pollInterval = setInterval(async () => {
          const pollResponse = await fetch(`${SERVER_URL}/api/user/${user.id}/matchmaking/queue`, {
            method: 'POST'
          });
          const pollData = await pollResponse.json();
          
          if (pollData.success && pollData.matched) {
            clearInterval(pollInterval);
            socket.emit('create-room', { 
              playerName: user.username,
              customBoard: customBoard
            });
          }
        }, 2000);
        
        // Stop polling after 30 seconds
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsSearching(false);
          setError('No opponent found. Please try again.');
        }, 30000);
      }
    } catch (error) {
      console.error('Matchmaking error:', error);
      setError('Error finding game. Please try again.');
      setIsSearching(false);
    }
  };

  const handlePlayFriend = (friendId) => {
    if (!user) {
      setError('Please log in to play');
      return;
    }

    setError('');
    // Create unrated game room for friend
    const roomId = uuidv4().substring(0, 6).toUpperCase();
    socket.emit('create-room', { 
      playerName: user.username,
      customBoard: customBoard,
      isRated: false
    });
  };

  // Check authentication on mount
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user]);

  if (!user) {
    return null;
  }

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
              className="w-full flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-[#404040] transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Play vs AI
            </button>
            
            <button 
              onClick={() => navigate('/multiplayer')}
              className="w-full flex items-center px-4 py-3 rounded-lg bg-[#404040] text-white hover:bg-[#505050] transition-colors"
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

            <button 
              onClick={() => navigate('/friends')}
              className="w-full flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-[#404040] transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Friends
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
              <h1 className="text-4xl font-bold mb-2">Multiplayer Lobby</h1>
              <p className="text-gray-400 text-lg">Play with friends online</p>
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
                      {customBoard ? 'Your saved board configuration will be used for this multiplayer game.' : 'Click "Edit Board" to create a custom board configuration.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Game Modes */}
            <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] p-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Find Game Section */}
                <div>
                  <h2 className="text-2xl font-bold mb-2">Find Game</h2>
                  <p className="text-gray-400 mb-4">Match against an opponent of similar skill level</p>
                  <p className="text-yellow-400 text-sm mb-4">⚠️ Rating changes apply</p>
                  <button
                    onClick={handleFindGame}
                    disabled={isSearching}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                  >
                    {isSearching ? 'Searching for Opponent...' : 'Find Game'}
                  </button>
                </div>

                {/* Play a Friend Section */}
                <div className="border-t border-[#404040] pt-6">
                  <h2 className="text-2xl font-bold mb-2">Play a Friend</h2>
                  <p className="text-gray-400 mb-4">Challenge a friend to a casual game</p>
                  <p className="text-green-400 text-sm mb-4">✓ No rating changes</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {friends.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No friends added yet. Visit the Friends page to add friends.</p>
                    ) : (
                      friends.map((friend) => (
                        <button
                          key={friend.id}
                          onClick={() => handlePlayFriend(friend.id)}
                          className="w-full flex items-center justify-between bg-[#404040] hover:bg-[#505050] p-3 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">{friend.username.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="font-medium">{friend.username}</span>
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 4a4 4 0 100 8 4 4 0 000-8zm0 6L5 7l1.41-1.41L8 8.17l3.59-3.58L13 7l-5 3z" />
                          </svg>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Back to Home */}
                <div className="border-t border-[#404040] pt-6 text-center">
                  <button
                    onClick={() => navigate('/')}
                    className="text-gray-400 hover:text-white underline transition-colors"
                  >
                    ← Back to Home
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

export default EnhancedMultiplayerLobby;
