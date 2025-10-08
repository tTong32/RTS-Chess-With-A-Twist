# RTS Chess With A Twist - Multiplayer

A real-time strategy chess game with cooldown mechanics and multiplayer support.

## Features

- **Real-time Strategy Elements**: Pieces have cooldown timers after moving
- **Multiplayer Support**: Play with friends online using Socket.IO
- **AI Opponent**: Play against an intelligent AI with adjustable difficulty (ELO 400-2800)
- **Room-based System**: Create or join rooms with unique codes
- **Real-time Synchronization**: Game state syncs across all players
- **Real-time Gameplay**: No turns - move any available piece at any time
- **Move History**: Track all moves with timestamps

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start the development servers:**

   **Terminal 1 - Start the server:**
   ```bash
   npm run server:dev
   ```
   The server will run on `http://localhost:3001`

   **Terminal 2 - Start the client:**
   ```bash
   npm run dev
   ```
   The client will run on `http://localhost:5173`

### How to Play

#### Multiplayer Mode
1. **Open the game** in your browser at `http://localhost:5173`
2. **Click "Play Online"** from the home screen
3. **Enter your name** and either:
   - **Create a room**: Click "Create New Room" and share the room code with your friend
   - **Join a room**: Enter a room code and click "Join Room"
4. **Start playing**: Once both players join, the game begins!

#### AI Mode
1. **Click "Play Against AI"** from the home screen
2. **Adjust the ELO slider** to set AI difficulty (400-2800)
3. **Choose your color** (white or black)
4. **Click "Start Game"** to begin playing against the AI

### Game Rules

- **Real-time Gameplay**: No turns - move any available piece at any time
- **Cooldown System**: Each piece has a cooldown timer after moving (7-15 seconds)
- **Real-time Timers**: Cooldowns continue counting down in real-time
- **Win Condition**: First to capture the opponent's king wins
- **Piece Values**: Pawn (7s), Knight/Bishop (9s), Rook (11s), Queen (14s), King (15s)

### Room Codes

- Room codes are 6-character uppercase strings (e.g., "ABC123")
- Share the room code with your friend to let them join
- Rooms are automatically cleaned up when empty

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Game components
│   │   │   ├── MultiplayerLobby.jsx
│   │   │   ├── MultiplayerGame.jsx
│   │   │   └── ...
│   │   └── game/          # Game logic
├── server/                 # Node.js backend
│   ├── src/
│   │   └── server.js      # Socket.IO server
└── package.json
```

## Development

- **Client**: React + Vite + Tailwind CSS
- **Server**: Node.js + Express + Socket.IO
- **AI Engine**: Custom real-time chess AI with ELO-based difficulty
- **Real-time Communication**: Socket.IO for instant updates

### AI Features

- **ELO-based Difficulty**: Adjustable from 400 (Beginner) to 2800 (Master)
- **Real-time Decision Making**: AI reacts to game state changes in real-time
- **Cooldown Management**: AI understands and uses cooldown timers strategically
- **Tactical Awareness**: Evaluates threats, captures, and positional advantages
- **Extensible Design**: Ready for custom pieces and advanced mechanics

## Troubleshooting

- **Connection Issues**: Make sure both client and server are running
- **Room Not Found**: Check that the room code is correct and the room still exists
- **Game Not Starting**: Ensure both players have joined the room

Enjoy playing RTS Chess with your friends!
