import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BoardEditorPanel from './BoardEditorPanel.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const BoardEditor = () => {
  const navigate = useNavigate();
  const { user, fetchCustomBoard, saveCustomBoard } = useAuth();
  const [customBoard, setCustomBoard] = useState(null);

  // Load saved board configuration from user account or localStorage
  useEffect(() => {
    const loadBoard = async () => {
      if (user) {
        // Try to load from server
        const serverBoard = await fetchCustomBoard();
        if (serverBoard) {
          setCustomBoard(serverBoard);
          return;
        }
      }
      
      // Fallback to localStorage
      const savedBoard = localStorage.getItem('savedBoardConfiguration');
      if (savedBoard) {
        try {
          setCustomBoard(JSON.parse(savedBoard));
        } catch (error) {
          console.error('Error loading saved board configuration:', error);
        }
      }
    };
    
    loadBoard();
  }, [user]);

  const handleBoardChange = (newBoard) => {
    setCustomBoard(newBoard);
  };

  const validateBoard = (board) => {
    // Check if board has missing pieces in the standard setup
    const requiredPieces = {
      frontRow: ['pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'],
      backRow: ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
    };

    // Check front row (row 6 - pawns)
    for (let col = 0; col < 8; col++) {
      if (!board[6][col]) {
        return { isValid: false, message: `Missing piece at row 1, column ${String.fromCharCode(97 + col)}` };
      }
    }

    // Check back row (row 7 - major pieces)
    for (let col = 0; col < 8; col++) {
      if (!board[7][col]) {
        return { isValid: false, message: `Missing piece at row 2, column ${String.fromCharCode(97 + col)}` };
      }
    }

    return { isValid: true };
  };

  const handleSaveBoard = async () => {
    if (!customBoard) {
      alert('No board configuration to save');
      return;
    }

    const validation = validateBoard(customBoard);
    if (!validation.isValid) {
      alert(`Cannot save board: ${validation.message}`);
      return;
    }

    // Save to user account if logged in
    if (user) {
      const result = await saveCustomBoard(customBoard);
      if (result.success) {
        alert('Board configuration saved to your account!');
      } else {
        alert('Failed to save to account. Saving locally instead.');
        localStorage.setItem('savedBoardConfiguration', JSON.stringify(customBoard));
      }
    } else {
      // Save to localStorage
      localStorage.setItem('savedBoardConfiguration', JSON.stringify(customBoard));
      alert('Board configuration saved locally! Sign in to sync across devices.');
    }
  };

  const handleClearBoard = async () => {
    setCustomBoard(null);
    localStorage.removeItem('savedBoardConfiguration');
    
    // Clear from account if logged in
    if (user) {
      await saveCustomBoard(null);
    }
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
              className="w-full flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-[#404040] transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              Multiplayer
            </button>
            
            <button 
              onClick={() => navigate('/board-editor')}
              className="w-full flex items-center px-4 py-3 rounded-lg bg-[#404040] text-white hover:bg-[#505050] transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
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
              <h1 className="text-4xl font-bold mb-2">Board Editor</h1>
              <p className="text-gray-400 text-lg">Create and customize your chess board with special pieces</p>
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

          {/* Board Editor Content */}
          <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] p-8">
            <div className="space-y-8">
              {/* Board Editor Panel */}
              <div>
                <BoardEditorPanel
                  initialBoard={customBoard}
                  onBoardChange={handleBoardChange}
                  playerColor="white"
                />
              </div>

              {/* Configuration Status with Save Button */}
              <div className="bg-[#404040]/30 rounded-lg p-6 border border-[#505050]">
                <h4 className="font-semibold text-white mb-4 text-center">Configuration Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center justify-between p-4 bg-[#2c2c2c] rounded-lg">
                    <span className="text-gray-300">Saved Configuration:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      localStorage.getItem('savedBoardConfiguration') 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {localStorage.getItem('savedBoardConfiguration') ? 'Saved' : 'None'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#2c2c2c] rounded-lg">
                    <span className="text-gray-300">Current Board:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      customBoard 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {customBoard ? 'Custom' : 'Standard'}
                    </span>
                  </div>
                </div>
                
                {/* Save Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleSaveBoard}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Save Board Configuration
                  </button>
                </div>
              </div>

              {/* Back to Home */}
              <div className="text-center pt-4">
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
  );
};

export default BoardEditor;