import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active games
const games = new Map();

// In-memory user database (in production, use a real database)
const users = new Map(); // userId -> user object

// API Routes for authentication and user data
app.post('/api/signup', (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  
  // Check if user already exists
  for (const [_, user] of users.entries()) {
    if (user.email === email || user.username === username) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
  }
  
  const userId = uuidv4();
  const newUser = {
    id: userId,
    username,
    email,
    password, // In production, hash this!
    createdAt: new Date().toISOString(),
    stats: {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      rating: 1000
    },
    recentGames: [],
    customBoard: null,
    friends: [],
    pendingFriendRequests: []
  };
  
  users.set(userId, newUser);
  
  res.json({ 
    success: true, 
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      stats: newUser.stats
    },
    token: userId // In production, use JWT tokens
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Missing email or password' });
  }
  
  // Find user by email
  let foundUser = null;
  for (const [_, user] of users.entries()) {
    if (user.email === email && user.password === password) {
      foundUser = user;
      break;
    }
  }
  
  if (!foundUser) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
  
  res.json({ 
    success: true, 
    user: {
      id: foundUser.id,
      username: foundUser.username,
      email: foundUser.email,
      stats: foundUser.stats
    },
    token: foundUser.id
  });
});

app.get('/api/user/:userId', (req, res) => {
  const { userId } = req.params;
  const user = users.get(userId);
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  res.json({ 
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      stats: user.stats,
      recentGames: user.recentGames
    }
  });
});

app.get('/api/user/:userId/custom-board', (req, res) => {
  const { userId } = req.params;
  const user = users.get(userId);
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  res.json({ 
    success: true,
    customBoard: user.customBoard
  });
});

app.post('/api/user/:userId/custom-board', (req, res) => {
  const { userId } = req.params;
  const { customBoard } = req.body;
  const user = users.get(userId);
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  user.customBoard = customBoard;
  users.set(userId, user);
  
  res.json({ success: true });
});

app.post('/api/user/:userId/game-result', (req, res) => {
  const { userId } = req.params;
  const { result, opponent, duration, mode } = req.body; // result: 'win', 'loss', 'draw'
  const user = users.get(userId);
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  // Update stats
  user.stats.gamesPlayed++;
  if (result === 'win') {
    user.stats.wins++;
    user.stats.rating = Math.min(2800, user.stats.rating + 15);
  } else if (result === 'loss') {
    user.stats.losses++;
    user.stats.rating = Math.max(400, user.stats.rating - 15);
  } else {
    user.stats.draws++;
  }
  
  // Add to recent games
  const gameEntry = {
    opponent,
    result,
    duration,
    mode,
    date: new Date().toISOString()
  };
  
  user.recentGames.unshift(gameEntry);
  if (user.recentGames.length > 10) {
    user.recentGames = user.recentGames.slice(0, 10);
  }
  
  users.set(userId, user);
  
  res.json({ success: true, stats: user.stats });
});

// Friends API endpoints
app.get('/api/user/:userId/friends', (req, res) => {
  const { userId } = req.params;
  const user = users.get(userId);
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  // Get friend details
  const friendsList = user.friends.map(friendId => {
    const friend = users.get(friendId);
    return friend ? {
      id: friend.id,
      username: friend.username,
      stats: friend.stats
    } : null;
  }).filter(Boolean);
  
  res.json({ success: true, friends: friendsList });
});

app.post('/api/user/:userId/friends/add', (req, res) => {
  const { userId } = req.params;
  const { friendUsername } = req.body;
  const user = users.get(userId);
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  // Find friend by username
  let friend = null;
  for (const [_, u] of users.entries()) {
    if (u.username === friendUsername) {
      friend = u;
      break;
    }
  }
  
  if (!friend) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  if (friend.id === userId) {
    return res.status(400).json({ success: false, error: 'Cannot add yourself as a friend' });
  }
  
  if (user.friends.includes(friend.id)) {
    return res.status(400).json({ success: false, error: 'Already friends with this user' });
  }
  
  // Add to friends list
  user.friends.push(friend.id);
  friend.friends.push(user.id);
  
  users.set(userId, user);
  users.set(friend.id, friend);
  
  res.json({ success: true });
});

app.post('/api/user/:userId/friends/remove', (req, res) => {
  const { userId } = req.params;
  const { friendId } = req.body;
  const user = users.get(userId);
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  if (!user.friends.includes(friendId)) {
    return res.status(400).json({ success: false, error: 'Not friends with this user' });
  }
  
  user.friends = user.friends.filter(id => id !== friendId);
  const friend = users.get(friendId);
  if (friend) {
    friend.friends = friend.friends.filter(id => id !== userId);
    users.set(friendId, friend);
  }
  
  users.set(userId, user);
  
  res.json({ success: true });
});

app.get('/api/search/users/:username', (req, res) => {
  const { username } = req.params;
  
  // Search for users by username
  const results = [];
  for (const [_, user] of users.entries()) {
    if (user.username.toLowerCase().includes(username.toLowerCase())) {
      results.push({
        id: user.id,
        username: user.username,
        stats: user.stats
      });
    }
  }
  
  res.json({ success: true, results });
});

// Matchmaking queue
const matchmakingQueue = []; // Array of { userId, rating, timestamp }

app.post('/api/user/:userId/matchmaking/queue', (req, res) => {
  const { userId } = req.params;
  const user = users.get(userId);
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  // Check if already in queue
  const alreadyInQueue = matchmakingQueue.find(entry => entry.userId === userId);
  if (alreadyInQueue) {
    return res.json({ success: true, message: 'Already in queue' });
  }
  
  // Add to queue
  matchmakingQueue.push({
    userId,
    rating: user.stats.rating,
    timestamp: Date.now()
  });
  
  // Try to find a match (within 200 ELO rating difference)
  const match = matchmakingQueue.find(entry => 
    entry.userId !== userId && 
    Math.abs(entry.rating - user.stats.rating) <= 200
  );
  
  if (match) {
    // Remove both from queue
    const userIndex = matchmakingQueue.findIndex(e => e.userId === userId);
    const matchIndex = matchmakingQueue.findIndex(e => e.userId === match.userId);
    matchmakingQueue.splice(userIndex, 1);
    matchmakingQueue.splice(matchIndex, 1);
    
    res.json({ 
      success: true, 
      matched: true,
      opponent: {
        id: match.userId,
        username: users.get(match.userId).username
      }
    });
  } else {
    res.json({ success: true, matched: false, message: 'Searching for opponent...' });
  }
});

app.post('/api/user/:userId/matchmaking/leave', (req, res) => {
  const { userId } = req.params;
  const index = matchmakingQueue.findIndex(entry => entry.userId === userId);
  
  if (index !== -1) {
    matchmakingQueue.splice(index, 1);
  }
  
  res.json({ success: true });
});

// Game state management
class GameRoom {
  constructor(roomId, hostPlayer, customBoard = null, isRated = true) {
    this.roomId = roomId;
    this.players = new Map();
    this.gameState = {
      board: customBoard || this.initializeBoard(),
      currentPlayer: 'white',
      gameStatus: 'waiting', // 'waiting', 'playing', 'finished'
      moveHistory: [],
      gameTime: 0,
      winner: null
    };
    this.isRated = isRated; // Whether rating changes for this game
    this.addPlayer(hostPlayer);
  }

  initializeBoard() {
    const initialBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Define cooldown times (you can move this to a shared config)
    const cooldownTimes = {
      pawn: 1000,
      knight: 2000,
      bishop: 2000,
      rook: 3000,
      queen: 4000,
      king: 1000
    };
    
    // Set up pawns
    for (let i = 0; i < 8; i++) {
      initialBoard[1][i] = { type: 'pawn', color: 'black', cooldown: 0, cooldownTime: cooldownTimes.pawn };
      initialBoard[6][i] = { type: 'pawn', color: 'white', cooldown: 0, cooldownTime: cooldownTimes.pawn };
    }
    
    // Set up back row pieces
    const backRowPieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    backRowPieces.forEach((pieceType, i) => {
      initialBoard[0][i] = { 
        type: pieceType, 
        color: 'black', 
        cooldown: 0, 
        cooldownTime: cooldownTimes[pieceType] 
      };
      initialBoard[7][i] = { 
        type: pieceType, 
        color: 'white', 
        cooldown: 0, 
        cooldownTime: cooldownTimes[pieceType] 
      };
    });
    
    return initialBoard;
  }

  addPlayer(player) {
    this.players.set(player.id, player);
    
    // Assign colors if this is the second player
    if (this.players.size === 2) {
      const playerList = Array.from(this.players.values());
      playerList[0].color = 'white';
      playerList[1].color = 'black';
      this.gameState.gameStatus = 'playing';
    }
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    if (this.players.size === 0) {
      games.delete(this.roomId);
    } else if (this.gameState.gameStatus === 'playing') {
      // Pause game if a player disconnects
      this.gameState.gameStatus = 'paused';
    }
  }

  getPlayerColor(playerId) {
    const player = this.players.get(playerId);
    return player ? player.color : null;
  }

  makeMove(playerId, fromRow, fromCol, toRow, toCol) {
    const playerColor = this.getPlayerColor(playerId);
    const piece = this.gameState.board[fromRow][fromCol];
    
    if (!piece || piece.color !== playerColor) {
      return { success: false, error: 'Invalid piece' };
    }

    // Check if piece is on cooldown
    if (piece.cooldown > 0) {
      return { success: false, error: 'Piece is on cooldown' };
    }

    // Basic move validation (you can enhance this with your ChessRules)
    const targetPiece = this.gameState.board[toRow][toCol];
    
    // Check for king capture
    if (targetPiece && targetPiece.type === 'king') {
      this.gameState.winner = playerColor;
      this.gameState.gameStatus = 'finished';
    }

    // Record move
    const algebraicMove = this.toAlgebraicNotation(fromRow, fromCol, toRow, toCol, piece.type);
    this.gameState.moveHistory.push({ 
      move: algebraicMove, 
      time: (this.gameState.gameTime / 1000).toFixed(1),
      player: playerColor
    });

    // Update board
    this.gameState.board[toRow][toCol] = { ...piece, cooldown: piece.cooldownTime };
    this.gameState.board[fromRow][fromCol] = null;

    // Apply piece special effects
    if (piece.type === 'ice-bishop') {
      this.applyIceBishopEffect(toRow, toCol, piece);
    } else if (piece.type === 'pawn-general') {
      this.applyPawnGeneralEffect(toRow, toCol, piece);
    }

    return { success: true };
  }

  applyIceBishopEffect(toRow, toCol, piece) {
    // Increase cooldown of all adjacent enemy pieces by 3 seconds
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    directions.forEach(([dRow, dCol]) => {
      const newRow = toRow + dRow;
      const newCol = toCol + dCol;
      
      // Check if position is valid
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const adjacentPiece = this.gameState.board[newRow][newCol];
        // If there's an enemy piece, increase its cooldown
        if (adjacentPiece && adjacentPiece.color !== piece.color) {
          adjacentPiece.cooldown += 3000; // Add 3 seconds
        }
      }
    });
  }

  applyPawnGeneralEffect(toRow, toCol, piece) {
    // Reduce cooldown of all adjacent friendly pieces by 2 seconds
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    directions.forEach(([dRow, dCol]) => {
      const newRow = toRow + dRow;
      const newCol = toCol + dCol;
      
      // Check if position is valid
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const adjacentPiece = this.gameState.board[newRow][newCol];
        // If there's a friendly piece, reduce its cooldown
        if (adjacentPiece && adjacentPiece.color === piece.color) {
          adjacentPiece.cooldown = Math.max(0, adjacentPiece.cooldown - 2000); // Reduce by 2 seconds
        }
      }
    });
  }

  toAlgebraicNotation(fromR, fromC, toR, toC, pieceType) {
    const colToChar = c => String.fromCharCode(97 + c);
    const rowToNum = r => 8 - r;

    let notation = '';
    if (pieceType !== 'pawn') {
      notation += pieceType.charAt(0).toUpperCase();
    }
    notation += colToChar(fromC) + rowToNum(fromR);
    notation += '-';
    notation += colToChar(toC) + rowToNum(toR);
    return notation;
  }

  updateCooldowns() {
    this.gameState.gameTime += 100;
    this.gameState.board = this.gameState.board.map(row => 
      row.map(cell => 
        cell && cell.cooldown > 0 
          ? { ...cell, cooldown: Math.max(0, cell.cooldown - 100) }
          : cell
      )
    );
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Create a new game room
  socket.on('create-room', (data) => {
    const { playerName, customBoard } = data;
    const roomId = uuidv4().substring(0, 6).toUpperCase();
    const player = { id: socket.id, name: playerName, socket: socket, color: 'white' };
    
    const game = new GameRoom(roomId, player, customBoard);
    games.set(roomId, game);
    
    socket.join(roomId);
    socket.emit('room-created', { roomId, playerColor: 'white', playerName, customBoard });
    socket.emit('game-state', game.gameState);
    
    console.log(`Room ${roomId} created by ${playerName}${customBoard ? ' with custom board' : ''}`);
  });

  // Join an existing room
  socket.on('join-room', ({ roomId, playerName }) => {
    console.log(`join-room request: roomId=${roomId}, playerName=${playerName}, socketId=${socket.id}`);
    console.log(`Available rooms:`, Array.from(games.keys()));
    const game = games.get(roomId);
    
    if (!game) {
      console.error(`Room ${roomId} not found!`);
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    // Check if this socket is already in the room
    if (game.players.has(socket.id)) {
      console.log(`Socket ${socket.id} is already in room ${roomId}, sending current state`);
      const player = game.players.get(socket.id);
      socket.join(roomId);
      socket.emit('room-joined', { roomId, playerColor: player.color, playerName: player.name });
      socket.emit('game-state', game.gameState);
      return;
    }
    
    if (game.players.size >= 2) {
      console.log(`Room ${roomId} is full`);
      socket.emit('error', { message: 'Room is full' });
      return;
    }
    
    const playerColor = game.players.size === 0 ? 'white' : 'black';
    const player = { id: socket.id, name: playerName, socket: socket, color: playerColor };
    game.addPlayer(player);
    
    socket.join(roomId);
    socket.emit('room-joined', { roomId, playerColor: player.color, playerName });
    socket.emit('game-state', game.gameState);
    
    // Notify all players in the room
    io.to(roomId).emit('player-joined', { playerName, playerColor: player.color });
    io.to(roomId).emit('game-state', game.gameState);
    
    console.log(`${playerName} joined room ${roomId}`);
  });

  // Make a move
  socket.on('make-move', ({ fromRow, fromCol, toRow, toCol }) => {
    const roomId = Array.from(socket.rooms)[1]; // Get the room ID (first room after socket's own room)
    const game = games.get(roomId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    const result = game.makeMove(socket.id, fromRow, fromCol, toRow, toCol);
    
    if (result.success) {
      // Broadcast the updated game state to all players in the room
      io.to(roomId).emit('game-state', game.gameState);
      io.to(roomId).emit('move-made', { fromRow, fromCol, toRow, toCol });
    } else {
      socket.emit('error', { message: result.error });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    // Find and remove player from their game
    for (const [roomId, game] of games.entries()) {
      if (game.players.has(socket.id)) {
        const player = game.players.get(socket.id);
        game.removePlayer(socket.id);
        
        // Notify remaining players
        io.to(roomId).emit('player-left', { playerName: player.name });
        if (game.players.size > 0) {
          io.to(roomId).emit('game-state', game.gameState);
        }
        
        console.log(`Player ${player.name} left room ${roomId}`);
        break;
      }
    }
  });
});

// Game timer - update cooldowns every 100ms
setInterval(() => {
  for (const game of games.values()) {
    if (game.gameState.gameStatus === 'playing') {
      game.updateCooldowns();
      io.to(game.roomId).emit('game-state', game.gameState);
    }
  }
}, 100);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
