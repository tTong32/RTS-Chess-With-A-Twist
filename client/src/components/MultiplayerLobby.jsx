import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const MultiplayerLobby = () => {
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [error, setError] = useState('');
  const [gameData, setGameData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('room-created', (data) => {
      setGameData(data);
      setIsCreatingRoom(false);
      navigate('/multiplayer-game', { state: { ...data, playerName, isHost: true } });
    });

    newSocket.on('room-joined', (data) => {
      setGameData(data);
      setIsJoiningRoom(false);
      navigate('/multiplayer-game', { state: { ...data, playerName, isHost: false } });
    });

    newSocket.on('error', (data) => {
      setError(data.message);
      setIsCreatingRoom(false);
      setIsJoiningRoom(false);
    });

    return () => {
      newSocket.close();
    };
  }, [navigate]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    setError('');
    setIsCreatingRoom(true);
    socket.emit('create-room', playerName.trim());
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
    socket.emit('join-room', { roomId: roomCode.trim().toUpperCase(), playerName: playerName.trim() });
  };

  const copyRoomCode = () => {
    if (gameData?.roomId) {
      navigator.clipboard.writeText(gameData.roomId);
      // You could add a toast notification here
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">RTS Chess</h1>
          <p className="text-gray-600">Play with friends online</p>
        </div>

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
  );
};

export default MultiplayerLobby;
