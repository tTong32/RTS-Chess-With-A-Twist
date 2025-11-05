import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import SharedNav from './SharedNav.jsx';

const Friends = () => {
  const navigate = useNavigate();
  const { user, fetchFriends, addFriend, removeFriend, searchUsers } = useAuth();
  
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadFriends();
  }, [user]);

  const loadFriends = async () => {
    setLoading(true);
    const friendsList = await fetchFriends();
    setFriends(friendsList);
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError('');
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const handleAddFriend = async (friendId, username) => {
    setError('');
    setSuccess('');
    
    const result = await addFriend(username);
    if (result.success) {
      setSuccess(`Successfully added ${username} as a friend!`);
      loadFriends();
      setSearchQuery('');
      setSearchResults([]);
    } else {
      setError(result.error);
    }
  };

  const handleRemoveFriend = async (friendId, username) => {
    setError('');
    setSuccess('');
    
    const result = await removeFriend(friendId);
    if (result.success) {
      setSuccess(`Removed ${username} from friends`);
      loadFriends();
    } else {
      setError(result.error);
    }
  };

  const isFriend = (userId) => {
    return friends.some(f => f.id === userId);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white flex items-center justify-center">
        <p className="text-xl">Please log in to view friends</p>
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
              <h1 className="text-4xl font-bold mb-2">Friends</h1>
              <p className="text-gray-400 text-lg">Manage your friends list</p>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          {/* Search for Friends */}
          <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Search for Friends</h2>
            <form onSubmit={handleSearch}>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-3 bg-[#404040] border border-[#505050] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter username"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Search Results</h3>
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between bg-[#404040] p-4 rounded-lg">
                      <div>
                        <div className="font-semibold">{result.username}</div>
                        <div className="text-sm text-gray-400">Rating: {result.stats.rating}</div>
                      </div>
                      {isFriend(result.id) ? (
                        <button
                          onClick={() => handleRemoveFriend(result.id, result.username)}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          Remove
                        </button>
                      ) : result.id === user.id ? (
                        <span className="px-4 py-2 text-gray-500">You</span>
                      ) : (
                        <button
                          onClick={() => handleAddFriend(result.id, result.username)}
                          className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                        >
                          Add Friend
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Friends List */}
          <div className="bg-[#2c2c2c] rounded-xl border border-[#404040] p-6">
            <h2 className="text-2xl font-bold mb-4">Your Friends ({friends.length})</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-500 mx-auto"></div>
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-400 text-lg">No friends yet</p>
                <p className="text-gray-500">Search for users to add them as friends</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between bg-[#404040] p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{friend.username.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="font-semibold">{friend.username}</div>
                        <div className="text-sm text-gray-400">Rating: {friend.stats.rating} | Games: {friend.stats.gamesPlayed}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFriend(friend.id, friend.username)}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Remove
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

export default Friends;

