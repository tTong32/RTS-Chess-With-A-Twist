import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Vite dev server
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active games
const games = new Map();

// Game state management
class GameRoom {
  constructor(roomId, hostPlayer) {
    this.roomId = roomId;
    this.players = new Map();
    this.gameState = {
      board: this.initializeBoard(),
      currentPlayer: 'white',
      gameStatus: 'waiting', // 'waiting', 'playing', 'finished'
      moveHistory: [],
      gameTime: 0,
      winner: null
    };
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

    return { success: true };
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
    const player = { id: socket.id, name: playerName, socket: socket };
    
    const game = new GameRoom(roomId, player);
    games.set(roomId, game);
    
    socket.join(roomId);
    socket.emit('room-created', { roomId, playerColor: 'white' });
    socket.emit('game-state', game.gameState);
    
    console.log(`Room ${roomId} created by ${playerName}`);
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
    
    if (game.players.size >= 2) {
      console.log(`Room ${roomId} is full`);
      socket.emit('error', { message: 'Room is full' });
      return;
    }
    
    const player = { id: socket.id, name: playerName, socket: socket };
    game.addPlayer(player);
    
    socket.join(roomId);
    socket.emit('room-joined', { roomId, playerColor: player.color });
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
