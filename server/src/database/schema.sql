-- RTS Chess Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified INTEGER DEFAULT 0,
  verification_token TEXT,
  verification_token_expires INTEGER,
  created_at TEXT NOT NULL,
  stats_games_played INTEGER DEFAULT 0,
  stats_wins INTEGER DEFAULT 0,
  stats_losses INTEGER DEFAULT 0,
  stats_draws INTEGER DEFAULT 0,
  stats_rating INTEGER DEFAULT 1000,
  custom_board TEXT,
  reset_password_token TEXT,
  reset_password_expires INTEGER
);

-- Friends relationships (many-to-many)
CREATE TABLE IF NOT EXISTS friends (
  user_id TEXT NOT NULL,
  friend_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, friend_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Game results history
CREATE TABLE IF NOT EXISTS game_results (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  opponent_id TEXT,
  opponent_name TEXT NOT NULL,
  result TEXT NOT NULL,
  duration TEXT,
  mode TEXT,
  game_date TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Active game sessions (for multiplayer)
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  room_id TEXT UNIQUE NOT NULL,
  player1_id TEXT NOT NULL,
  player2_id TEXT,
  is_rated INTEGER DEFAULT 1,
  status TEXT NOT NULL,
  started_at TEXT,
  FOREIGN KEY (player1_id) REFERENCES users(id),
  FOREIGN KEY (player2_id) REFERENCES users(id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_game_results_user_id ON game_results(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_room_id ON game_sessions(room_id);

