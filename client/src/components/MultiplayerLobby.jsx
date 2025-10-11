import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import BoardEditorPanel from './BoardEditorPanel.jsx';

const EnhancedMultiplayerLobby = () => {
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [error, setError] = useState('');
  const [gameData, setGameData] = useState(null);
  const [customBoard, setCustomBoard] = useState(null);
  const [showBoardEditor, setShowBoardEditor] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('room-created', (data) => {
      console.log('Room created:', data);
      setGameData(data);
      setIsCreatingRoom(false);
      
      // Store socket and player info for game component
      window.multiplayerSocket = newSocket;
      window.multiplayerPlayerName = playerName;
      
      console.log('Navigating to game with state:', { ...data, playerName, isHost: true });
      navigate('/multiplayer-game', { 
        state: { 
          ...data, 
          playerName, 
          isHost: true,
          customBoard: customBoard
        } 
      });
    });

    newSocket.on('room-joined', (data) => {
      console.log('Room joined:', data);
      setGameData(data);
      setIsJoiningRoom(false);
      
      // Store socket and player info for game component
      window.multiplayerSocket = newSocket;
      window.multiplayerPlayerName = playerName;
      
      navigate('/multiplayer-game', { 
        state: { 
          ...data, 
          playerName, 
          isHost: false,
          customBoard: customBoard
        } 
      });
    });

    newSocket.on('error', (data) => {
      console.error('Lobby socket error:', data);
      setError(data.message);
      setIsCreatingRoom(false);
      setIsJoiningRoom(false);
    });

    return () => {
      // Only close socket if we're not navigating to game
      if (!window.multiplayerSocket) {
        newSocket.close();
      }
    };
  }, [navigate, customBoard, playerName]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    setError('');
    setIsCreatingRoom(true);
    socket.emit('create-room', { 
      playerName: playerName.trim(),
      customBoard: customBoard
    });
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    setError('');
    setIsJoiningRoom(true);
    socket.emit('join-room', { 
      roomId: roomCode.trim().toUpperCase(), 
      playerName: playerName.trim(),
      customBoard: customBoard
    });
  };

  const handleBoardChange = (newBoard) => {
    setCustomBoard(newBoard);
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
              <p className="text-gray-400 text-lg">Play with friends online with custom pieces</p>
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

            {/* Right Side - Lobby Controls */}
            <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] p-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Player Name Input */}
                <div>
                  <label htmlFor="playerName" className="block text-sm font-medium text-gray-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="playerName"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#404040] border border-[#505050] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                    maxLength={20}
                  />
                </div>

                {/* Create Room Section */}
                <div className="border-t border-[#404040] pt-6">
                  <h2 className="text-lg font-semibold mb-4">Create a Room</h2>
                  <button
                    onClick={handleCreateRoom}
                    disabled={isCreatingRoom || isJoiningRoom}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                  >
                    {isCreatingRoom ? 'Creating Room...' : 'Create New Room'}
                  </button>
                </div>

                {/* Join Room Section */}
                <div className="border-t border-[#404040] pt-6">
                  <h2 className="text-lg font-semibold mb-4">Join a Room</h2>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-[#404040] border border-[#505050] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter room code"
                      maxLength={6}
                    />
                    <button
                      onClick={handleJoinRoom}
                      disabled={isCreatingRoom || isJoiningRoom}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                    >
                      {isJoiningRoom ? 'Joining Room...' : 'Join Room'}
                    </button>
                  </div>
                </div>

                {/* Game Info */}
                <div className="border-t border-[#404040] pt-6 bg-[#404040]/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Game Features</h3>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                      Real-time gameplay with energy system
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                      Custom pieces with unique abilities
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      Progressive energy regeneration
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                      Strategic resource management
                    </li>
                  </ul>
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