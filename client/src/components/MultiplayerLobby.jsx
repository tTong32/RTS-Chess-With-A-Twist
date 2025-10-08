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
      setGameData(data);
      setIsCreatingRoom(false);
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
      setGameData(data);
      setIsJoiningRoom(false);
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
      setError(data.message);
      setIsCreatingRoom(false);
      setIsJoiningRoom(false);
    });

    return () => {
      newSocket.close();
    };
  }, [navigate, customBoard]);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">RTS Chess - Multiplayer</h1>
          <p className="text-blue-200">Play with friends online with custom pieces</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Board Editor */}
          <div className="bg-white rounded-lg shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Customize Your Board</h2>
              <button
                onClick={() => setShowBoardEditor(!showBoardEditor)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                  showBoardEditor 
                    ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
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
                <p className="text-gray-600 mb-4">
                  Customize your starting board with special pieces
                </p>
                <p className="text-sm text-gray-500">
                  Click "Show Editor" to replace standard pieces with custom ones like Twisted Pawns, Flying Castles, and more!
                </p>
              </div>
            )}
          </div>

          {/* Right Side - Lobby Controls */}
          <div className="bg-white rounded-lg shadow-2xl p-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Player Name Input */}
              <div>
                <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your name"
                  maxLength={20}
                />
              </div>

              {/* Create Room Section */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Create a Room</h2>
                <button
                  onClick={handleCreateRoom}
                  disabled={isCreatingRoom || isJoiningRoom}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  {isCreatingRoom ? 'Creating Room...' : 'Create New Room'}
                </button>
              </div>

              {/* Join Room Section */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Join a Room</h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter room code"
                    maxLength={6}
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={isCreatingRoom || isJoiningRoom}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    {isJoiningRoom ? 'Joining Room...' : 'Join Room'}
                  </button>
                </div>
              </div>

              {/* Game Info */}
              <div className="border-t pt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Game Features</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Real-time gameplay with energy system</li>
                  <li>• Custom pieces with unique abilities</li>
                  <li>• Progressive energy regeneration</li>
                  <li>• Strategic resource management</li>
                </ul>
              </div>

              {/* Back to Home */}
              <div className="border-t pt-6 text-center">
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-600 hover:text-gray-800 underline"
                >
                  ← Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMultiplayerLobby;
