import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import database from './database/db.js';
import emailService from './services/emailService.js';

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

// Initialize database on server start
database.init().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// API Routes for authentication and user data
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email format' });
  }
  
  // Check if user already exists
  const existingUser = await database.get(
    'SELECT * FROM users WHERE email = ? OR username = ?',
    [email, username]
  );
  
  if (existingUser) {
    return res.status(400).json({ success: false, error: 'User already exists' });
  }
  
  // Hash password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  const userId = uuidv4();
  const verificationToken = uuidv4();
  const tokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  // Insert user into database
  await database.run(
    `INSERT INTO users (id, username, email, password_hash, verification_token, verification_token_expires, created_at, email_verified) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, username, email, passwordHash, verificationToken, tokenExpires, new Date().toISOString(), 0]
  );
  
  // Send verification email
  emailService.sendVerificationEmail(email, username, verificationToken);
  
  res.json({ 
    success: true, 
    user: {
      id: userId,
      username,
      email,
      stats: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        rating: 1000
      },
      emailVerified: false
    },
    token: userId,
    message: 'Account created. Please check your email to verify your account.'
  });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Missing email or password' });
  }
  
  // Find user by email
  const user = await database.get(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
  
  // Verify password
  const passwordValid = await bcrypt.compare(password, user.password_hash);
  
  if (!passwordValid) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
  
  res.json({ 
    success: true, 
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      stats: {
        gamesPlayed: user.stats_games_played,
        wins: user.stats_wins,
        losses: user.stats_losses,
        draws: user.stats_draws,
        rating: user.stats_rating
      },
      emailVerified: user.email_verified === 1
    },
    token: user.id
  });
});

app.get('/api/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const user = await database.get(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  // Get recent games
  const recentGames = await database.all(
    'SELECT * FROM game_results WHERE user_id = ? ORDER BY game_date DESC LIMIT 10',
    [userId]
  );
  
  res.json({ 
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      stats: {
        gamesPlayed: user.stats_games_played,
        wins: user.stats_wins,
        losses: user.stats_losses,
        draws: user.stats_draws,
        rating: user.stats_rating
      },
      recentGames: recentGames.map(game => ({
        opponent: game.opponent_name,
        result: game.result,
        duration: game.duration,
        mode: game.mode,
        date: game.game_date
      }))
    }
  });
});

app.get('/api/user/:userId/custom-board', async (req, res) => {
  const { userId } = req.params;
  const user = await database.get(
    'SELECT custom_board FROM users WHERE id = ?',
    [userId]
  );
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  res.json({ 
    success: true,
    customBoard: user.custom_board ? JSON.parse(user.custom_board) : null
  });
});

app.post('/api/user/:userId/custom-board', async (req, res) => {
  const { userId } = req.params;
  const { customBoard } = req.body;
  
  // Check if user exists
  const user = await database.get('SELECT id FROM users WHERE id = ?', [userId]);
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  // Update custom board
  await database.run(
    'UPDATE users SET custom_board = ? WHERE id = ?',
    [JSON.stringify(customBoard), userId]
  );
  
  res.json({ success: true });
});

app.post('/api/user/:userId/game-result', async (req, res) => {
  const { userId } = req.params;
  const { result, opponent, opponentId, duration, mode } = req.body; // result: 'win', 'loss', 'draw'
  
  // Get current user stats
  const user = await database.get(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  // Calculate new stats
  let newGamesPlayed = user.stats_games_played + 1;
  let newWins = user.stats_wins;
  let newLosses = user.stats_losses;
  let newDraws = user.stats_draws;
  let newRating = user.stats_rating;
  
  if (result === 'win') {
    newWins++;
    newRating = Math.min(2800, newRating + 15);
  } else if (result === 'loss') {
    newLosses++;
    newRating = Math.max(400, newRating - 15);
  } else {
    newDraws++;
  }
  
  // Update user stats in database
  await database.run(
    `UPDATE users 
     SET stats_games_played = ?, stats_wins = ?, stats_losses = ?, stats_draws = ?, stats_rating = ? 
     WHERE id = ?`,
    [newGamesPlayed, newWins, newLosses, newDraws, newRating, userId]
  );
  
  // Add to game results
  const gameId = uuidv4();
  await database.run(
    `INSERT INTO game_results (id, user_id, opponent_id, opponent_name, result, duration, mode, game_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [gameId, userId, opponentId || null, opponent || 'Unknown', result, duration || null, mode || 'multiplayer', new Date().toISOString()]
  );
  
  res.json({ 
    success: true, 
    stats: {
      gamesPlayed: newGamesPlayed,
      wins: newWins,
      losses: newLosses,
      draws: newDraws,
      rating: newRating
    }
  });
});

// Friends API endpoints
app.get('/api/user/:userId/friends', async (req, res) => {
  const { userId } = req.params;
  
  // Verify user exists
  const user = await database.get('SELECT id FROM users WHERE id = ?', [userId]);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  // Get friends list
  const friendsList = await database.all(
    `SELECT u.id, u.username, u.stats_games_played, u.stats_wins, u.stats_losses, u.stats_draws, u.stats_rating
     FROM friends f
     JOIN users u ON f.friend_id = u.id
     WHERE f.user_id = ?`,
    [userId]
  );
  
  res.json({ 
    success: true, 
    friends: friendsList.map(f => ({
      id: f.id,
      username: f.username,
      stats: {
        gamesPlayed: f.stats_games_played,
        wins: f.stats_wins,
        losses: f.stats_losses,
        draws: f.stats_draws,
        rating: f.stats_rating
      }
    }))
  });
});

app.post('/api/user/:userId/friends/add', async (req, res) => {
  const { userId } = req.params;
  const { friendUsername } = req.body;
  
  // Verify user exists
  const user = await database.get('SELECT id FROM users WHERE id = ?', [userId]);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  // Find friend by username
  const friend = await database.get('SELECT id FROM users WHERE username = ?', [friendUsername]);
  
  if (!friend) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  if (friend.id === userId) {
    return res.status(400).json({ success: false, error: 'Cannot add yourself as a friend' });
  }
  
  // Check if already friends
  const existingFriendship = await database.get(
    'SELECT * FROM friends WHERE user_id = ? AND friend_id = ?',
    [userId, friend.id]
  );
  
  if (existingFriendship) {
    return res.status(400).json({ success: false, error: 'Already friends with this user' });
  }
  
  // Add bidirectional friendship
  await database.run(
    'INSERT INTO friends (user_id, friend_id, created_at) VALUES (?, ?, ?)',
    [userId, friend.id, new Date().toISOString()]
  );
  await database.run(
    'INSERT INTO friends (user_id, friend_id, created_at) VALUES (?, ?, ?)',
    [friend.id, userId, new Date().toISOString()]
  );
  
  res.json({ success: true });
});

app.post('/api/user/:userId/friends/remove', async (req, res) => {
  const { userId } = req.params;
  const { friendId } = req.body;
  
  // Verify user exists
  const user = await database.get('SELECT id FROM users WHERE id = ?', [userId]);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  // Check if friendship exists
  const friendship = await database.get(
    'SELECT * FROM friends WHERE user_id = ? AND friend_id = ?',
    [userId, friendId]
  );
  
  if (!friendship) {
    return res.status(400).json({ success: false, error: 'Not friends with this user' });
  }
  
  // Remove bidirectional friendship
  await database.run(
    'DELETE FROM friends WHERE user_id = ? AND friend_id = ?',
    [userId, friendId]
  );
  await database.run(
    'DELETE FROM friends WHERE user_id = ? AND friend_id = ?',
    [friendId, userId]
  );
  
  res.json({ success: true });
});

app.get('/api/search/users/:username', async (req, res) => {
  const { username } = req.params;
  
  // Search for users by username
  const results = await database.all(
    `SELECT id, username, stats_games_played, stats_wins, stats_losses, stats_draws, stats_rating
     FROM users 
     WHERE username LIKE ?`,
    [`%${username}%`]
  );
  
  res.json({ 
    success: true, 
    results: results.map(u => ({
      id: u.id,
      username: u.username,
      stats: {
        gamesPlayed: u.stats_games_played,
        wins: u.stats_wins,
        losses: u.stats_losses,
        draws: u.stats_draws,
        rating: u.stats_rating
      }
    }))
  });
});

// Matchmaking queue
const matchmakingQueue = []; // Array of { userId, rating, timestamp }

app.post('/api/user/:userId/matchmaking/queue', async (req, res) => {
  const { userId } = req.params;
  const user = await database.get('SELECT stats_rating FROM users WHERE id = ?', [userId]);
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  // Check if already in queue
  const alreadyInQueue = matchmakingQueue.find(entry => entry.userId === userId);
  if (alreadyInQueue) {
    return res.json({ success: true, message: 'Already in queue' });
  }
  
  const userRating = user.stats_rating;
  
  // Add to queue
  matchmakingQueue.push({
    userId,
    rating: userRating,
    timestamp: Date.now()
  });
  
  // Try to find a match (within 200 ELO rating difference)
  const match = matchmakingQueue.find(entry => 
    entry.userId !== userId && 
    Math.abs(entry.rating - userRating) <= 200
  );
  
  if (match) {
    // Remove both from queue
    const userIndex = matchmakingQueue.findIndex(e => e.userId === userId);
    const matchIndex = matchmakingQueue.findIndex(e => e.userId === match.userId);
    matchmakingQueue.splice(userIndex, 1);
    matchmakingQueue.splice(matchIndex, 1);
    
    // Get opponent username
    const opponent = await database.get('SELECT username FROM users WHERE id = ?', [match.userId]);
    
    res.json({ 
      success: true, 
      matched: true,
      opponent: {
        id: match.userId,
        username: opponent.username
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

// Email verification endpoint
app.get('/api/verify-email', async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({ success: false, error: 'Verification token missing' });
  }
  
  // Find user with this token
  const user = await database.get(
    'SELECT * FROM users WHERE verification_token = ?',
    [token]
  );
  
  if (!user) {
    return res.status(400).json({ success: false, error: 'Invalid verification token' });
  }
  
  // Check if token is expired
  if (user.verification_token_expires < Date.now()) {
    return res.status(400).json({ success: false, error: 'Verification token expired' });
  }
  
  // Mark email as verified and clear tokens
  await database.run(
    `UPDATE users 
     SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL 
     WHERE id = ?`,
    [user.id]
  );
  
  res.json({ success: true, message: 'Email verified successfully' });
});

// Get active games for spectating
app.get('/api/games/active', (req, res) => {
  const activeGames = [];
  
  for (const [roomId, game] of games.entries()) {
    if (game.gameState.gameStatus === 'playing') {
      const players = Array.from(game.players.values());
      activeGames.push({
        roomId,
        player1: players[0]?.name || 'Unknown',
        player2: players[1]?.name || 'Unknown',
        gameTime: game.gameState.gameTime
      });
    }
  }
  
  res.json({ success: true, games: activeGames });
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

  // Spectate a game
  socket.on('spectate-game', ({ roomId }) => {
    const game = games.get(roomId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    socket.join(roomId);
    socket.emit('spectating-started', { roomId });
    socket.emit('game-state', game.gameState);
    
    console.log(`Spectator connected to room ${roomId}`);
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
