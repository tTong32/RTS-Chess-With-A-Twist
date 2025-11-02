# Database Documentation

## Overview
The RTS Chess application now uses SQLite for persistent data storage instead of in-memory data structures. This provides data persistence across server restarts and proper data integrity.

## Database File
- **Location**: `server/src/chess.db` (configurable via `DB_PATH` environment variable)
- **Type**: SQLite3
- **Created**: Automatically on first server start

## Schema

### Users Table
Stores user account information including authentication credentials and game statistics.

**Columns:**
- `id` (TEXT PRIMARY KEY): Unique user identifier (UUID)
- `username` (TEXT UNIQUE): Display name
- `email` (TEXT UNIQUE): Email address
- `password_hash` (TEXT): Bcrypt hashed password (10 salt rounds)
- `email_verified` (INTEGER): 0 or 1 indicating verification status
- `verification_token` (TEXT): Email verification token
- `verification_token_expires` (INTEGER): Expiration timestamp
- `created_at` (TEXT): ISO8601 timestamp
- `stats_games_played` (INTEGER): Total games played
- `stats_wins` (INTEGER): Wins count
- `stats_losses` (INTEGER): Losses count
- `stats_draws` (INTEGER): Draws count
- `stats_rating` (INTEGER): ELO rating (default 1000)
- `custom_board` (TEXT): JSON-encoded custom board configuration
- `reset_password_token` (TEXT): Password reset token (future use)
- `reset_password_expires` (INTEGER): Reset token expiration

### Friends Table
Many-to-many relationship table for user friendships.

**Columns:**
- `user_id` (TEXT): Foreign key to users.id
- `friend_id` (TEXT): Foreign key to users.id
- `created_at` (TEXT): Friendship creation timestamp
- **Primary Key**: (user_id, friend_id)

### Game Results Table
Historical game results for user profiles.

**Columns:**
- `id` (TEXT PRIMARY KEY): Unique game record ID (UUID)
- `user_id` (TEXT): Foreign key to users.id
- `opponent_id` (TEXT): Foreign key to users.id (nullable)
- `opponent_name` (TEXT): Opponent display name
- `result` (TEXT): 'win', 'loss', or 'draw'
- `duration` (TEXT): Game duration
- `mode` (TEXT): Game mode (e.g., 'multiplayer', 'ai')
- `game_date` (TEXT): ISO8601 timestamp

### Game Sessions Table
Active multiplayer game sessions (future use for session persistence).

**Columns:**
- `id` (TEXT PRIMARY KEY): Unique session ID
- `room_id` (TEXT UNIQUE): Room identifier
- `player1_id` (TEXT): Foreign key to users.id
- `player2_id` (TEXT): Foreign key to users.id (nullable)
- `is_rated` (INTEGER): 0 or 1 for rated/unrated
- `status` (TEXT): Session status
- `started_at` (TEXT): Session start timestamp

## Security Features

### Password Hashing
All passwords are hashed using bcrypt with 10 salt rounds before storage. Passwords are never stored in plain text.

### Email Verification
New accounts require email verification via unique tokens that expire after 24 hours. Tokens are UUIDs and are cleared after successful verification.

### SQL Injection Prevention
All database queries use parameterized statements to prevent SQL injection attacks.

### Data Validation
- Email format validation on signup
- Username and email uniqueness enforced at database level
- Foreign key constraints ensure data integrity

## Backup and Migration

### Backup
```bash
# Backup database
cp server/src/chess.db chess.db.backup
```

### Restore
```bash
# Restore from backup
cp chess.db.backup server/src/chess.db
```

### Migration Notes
- The database is created automatically on first run
- No manual migration required for new installations
- For existing in-memory deployments, data will not persist (by design - this is a migration path)

## Indexes
For optimal query performance:
- `idx_users_email`: Email lookups
- `idx_users_username`: Username lookups
- `idx_users_verification_token`: Email verification
- `idx_friends_user_id`: Friend list queries
- `idx_friends_friend_id`: Friend list queries
- `idx_game_results_user_id`: Game history queries
- `idx_game_sessions_room_id`: Session lookups

## Development vs Production

### Development
- Database file stored locally in `server/src/`
- No need for separate database server
- Email service logs verification links to console

### Production
- Consider using PostgreSQL or MySQL for better performance
- Configure real SMTP credentials for email service
- Set up database backups and replication
- Use environment variables for sensitive configuration

