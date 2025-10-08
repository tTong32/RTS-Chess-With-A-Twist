// ChessAI.js - AI Engine for Real-time Chess
import { CustomPieces } from './CustomPieces.js';

export class ChessAI {
  constructor(elo = 1200) {
    this.elo = elo;
    this.color = 'black'; // AI plays as black by default
    this.isThinking = false;
    this.lastMoveTime = 0;
    this.moveHistory = [];
    this.customPieces = new CustomPieces(); // Create CustomPieces instance
    this.energySystem = null; // Will be set by the game
    
    // ELO-based difficulty parameters
    this.difficultySettings = this.calculateDifficultySettings(elo);
  }

  calculateDifficultySettings(elo) {
    // Convert ELO to difficulty parameters
    const normalizedElo = Math.max(400, Math.min(2800, elo));
    
    return {
      // Reaction time (ms) - higher ELO = faster reactions
      reactionTime: Math.max(200, 2000 - (normalizedElo - 400) * 0.7),
      
      // Move evaluation depth - higher ELO = deeper analysis
      searchDepth: Math.max(1, Math.floor((normalizedElo - 400) / 400) + 1),
      
      // Position evaluation accuracy - higher ELO = better evaluation
      evaluationAccuracy: Math.max(0.3, Math.min(1.0, (normalizedElo - 400) / 2000)),
      
      // Aggressiveness - higher ELO = more aggressive
      aggressiveness: Math.max(0.2, Math.min(1.0, (normalizedElo - 400) / 1500)),
      
      // Defensive awareness - higher ELO = better defense
      defensiveAwareness: Math.max(0.3, Math.min(1.0, (normalizedElo - 400) / 1800)),
      
      // Cooldown management - higher ELO = better timing
      cooldownManagement: Math.max(0.4, Math.min(1.0, (normalizedElo - 400) / 1600))
    };
  }

  setElo(newElo) {
    this.elo = newElo;
    this.difficultySettings = this.calculateDifficultySettings(newElo);
  }

  // Main AI decision function
  async makeMove(board, gameTime, currentEnergy = 0) {
    if (this.isThinking) return null;
    
    this.isThinking = true;
    
    try {
      // Add reaction time delay based on difficulty
      await this.delay(this.difficultySettings.reactionTime);
      
      const availableMoves = this.getAllAvailableMoves(board, currentEnergy);
      if (availableMoves.length === 0) {
        this.isThinking = false;
        return null;
      }

      // Evaluate and select best move
      const bestMove = this.selectBestMove(board, availableMoves, gameTime);
      
      if (bestMove) {
        this.lastMoveTime = gameTime;
        this.moveHistory.push(bestMove);
        this.isThinking = false;
        return bestMove;
      }
    } catch (error) {
      console.error('AI Error:', error);
    }
    
    this.isThinking = false;
    return null;
  }

  // Get all possible moves for AI pieces
  getAllAvailableMoves(board, currentEnergy = 0) {
    const moves = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        
        if (piece && piece.color === this.color && piece.cooldown === 0) {
          // Check if AI has enough energy for this piece
          const moveCost = this.energySystem ? this.energySystem.getEnergyCost(piece.type) : 0;
          if (currentEnergy >= moveCost) {
            // Get all valid moves for this piece
            for (let toRow = 0; toRow < 8; toRow++) {
              for (let toCol = 0; toCol < 8; toCol++) {
                if (this.customPieces.isValidMove(board, row, col, toRow, toCol, piece)) {
                  moves.push({
                    fromRow: row,
                    fromCol: col,
                    toRow: toRow,
                    toCol: toCol,
                    piece: piece,
                    targetPiece: board[toRow][toCol],
                    energyCost: moveCost
                  });
                }
              }
            }
          }
        }
      }
    }
    
    return moves;
  }

  // Select the best move using minimax with difficulty-based parameters
  selectBestMove(board, moves, gameTime) {
    if (moves.length === 0) return null;
    
    // Quick win check - capture king if possible
    const kingCapture = moves.find(move => 
      move.targetPiece && move.targetPiece.type === 'king'
    );
    if (kingCapture) return kingCapture;

    // Evaluate all moves
    const evaluatedMoves = moves.map(move => ({
      ...move,
      score: this.evaluateMove(board, move, gameTime)
    }));

    // Sort by score (higher is better)
    evaluatedMoves.sort((a, b) => b.score - a.score);

    // Apply difficulty-based selection
    return this.selectMoveByDifficulty(evaluatedMoves);
  }

  // Evaluate a single move
  evaluateMove(board, move, gameTime) {
    let score = 0;
    
    // Material value
    score += this.getMaterialValue(move.targetPiece);
    
    // Position value
    score += this.getPositionValue(move);
    
    // Tactical value
    score += this.getTacticalValue(board, move);
    
    // Cooldown management
    score += this.getCooldownValue(move.piece, gameTime);
    
    // Aggressiveness factor
    if (move.targetPiece) {
      score += this.difficultySettings.aggressiveness * 50;
    }
    
    // Defensive value
    score += this.getDefensiveValue(board, move);
    
    // Add some randomness based on difficulty
    const randomness = (1 - this.difficultySettings.evaluationAccuracy) * 100;
    score += (Math.random() - 0.5) * randomness;
    
    return score;
  }

  // Get material value of captured piece
  getMaterialValue(piece) {
    if (!piece) return 0;
    
    const values = {
      pawn: 100,
      knight: 320,
      bishop: 330,
      rook: 500,
      queen: 900,
      king: 10000
    };
    
    return values[piece.type] || 0;
  }

  // Get position value based on piece placement
  getPositionValue(move) {
    const piece = move.piece;
    const toRow = move.toRow;
    const toCol = move.toCol;
    
    // Basic positional bonuses
    let score = 0;
    
    // Center control
    if ((toRow >= 3 && toRow <= 4) && (toCol >= 3 && toCol <= 4)) {
      score += 20;
    }
    
    // Piece-specific positioning
    switch (piece.type) {
      case 'pawn':
        // Pawns should advance
        score += (this.color === 'black' ? toRow : 7 - toRow) * 5;
        break;
      case 'knight':
        // Knights prefer central positions
        const centerDistance = Math.abs(toRow - 3.5) + Math.abs(toCol - 3.5);
        score += (7 - centerDistance) * 10;
        break;
      case 'bishop':
        // Bishops prefer long diagonals
        score += 15;
        break;
      case 'rook':
        // Rooks prefer open files
        score += 10;
        break;
      case 'queen':
        // Queen mobility
        score += 25;
        break;
      case 'king':
        // King safety (simplified)
        score += 30;
        break;
    }
    
    return score * this.difficultySettings.evaluationAccuracy;
  }

  // Get tactical value (threats, pins, etc.)
  getTacticalValue(board, move) {
    let score = 0;
    
    // Check if this move creates threats
    const newBoard = this.simulateMove(board, move);
    const threats = this.findThreats(newBoard, this.color);
    score += threats * 30;
    
    // Check if this move defends against threats
    const currentThreats = this.findThreats(board, this.color);
    const newThreats = this.findThreats(newBoard, this.color);
    if (newThreats < currentThreats) {
      score += (currentThreats - newThreats) * 40;
    }
    
    return score * this.difficultySettings.defensiveAwareness;
  }

  // Get cooldown management value
  getCooldownValue(piece, gameTime) {
    const cooldownTime = piece.cooldownTime;
    const timeSinceLastMove = gameTime - this.lastMoveTime;
    
    // Prefer pieces with longer cooldowns if we haven't moved recently
    if (timeSinceLastMove > 2000) {
      return cooldownTime * 0.1 * this.difficultySettings.cooldownManagement;
    }
    
    // Prefer pieces with shorter cooldowns for quick follow-ups
    return (15000 - cooldownTime) * 0.05 * this.difficultySettings.cooldownManagement;
  }

  // Get defensive value
  getDefensiveValue(board, move) {
    let score = 0;
    
    // Check if this move protects important pieces
    const newBoard = this.simulateMove(board, move);
    const protectedPieces = this.countProtectedPieces(newBoard, this.color);
    const currentProtected = this.countProtectedPieces(board, this.color);
    
    score += (protectedPieces - currentProtected) * 20;
    
    return score * this.difficultySettings.defensiveAwareness;
  }

  // Select move based on difficulty (higher difficulty = more likely to pick best move)
  selectMoveByDifficulty(evaluatedMoves) {
    if (evaluatedMoves.length === 0) return null;
    
    const accuracy = this.difficultySettings.evaluationAccuracy;
    
    // Higher accuracy = more likely to pick the best move
    if (Math.random() < accuracy) {
      return evaluatedMoves[0];
    }
    
    // Otherwise, pick from top moves with some randomness
    const topMoves = evaluatedMoves.slice(0, Math.max(1, Math.floor(evaluatedMoves.length * 0.3)));
    return topMoves[Math.floor(Math.random() * topMoves.length)];
  }

  // Helper functions
  simulateMove(board, move) {
    const newBoard = board.map(row => row.map(cell => cell ? { ...cell } : null));
    newBoard[move.toRow][move.toCol] = { ...move.piece, cooldown: move.piece.cooldownTime };
    newBoard[move.fromRow][move.fromCol] = null;
    return newBoard;
  }

  findThreats(board, color) {
    let threats = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          // Count how many enemy pieces can attack this piece
          for (let enemyRow = 0; enemyRow < 8; enemyRow++) {
            for (let enemyCol = 0; enemyCol < 8; enemyCol++) {
              const enemyPiece = board[enemyRow][enemyCol];
              if (enemyPiece && enemyPiece.color !== color) {
                if (this.customPieces.isValidMove(board, enemyRow, enemyCol, row, col, enemyPiece)) {
                  threats++;
                }
              }
            }
          }
        }
      }
    }
    
    return threats;
  }

  countProtectedPieces(board, color) {
    let protectedCount = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          // Check if this piece is protected by friendly pieces
          for (let friendlyRow = 0; friendlyRow < 8; friendlyRow++) {
            for (let friendlyCol = 0; friendlyCol < 8; friendlyCol++) {
              const friendlyPiece = board[friendlyRow][friendlyCol];
              if (friendlyPiece && friendlyPiece.color === color && 
                  !(friendlyRow === row && friendlyCol === col)) {
                if (this.customPieces.isValidMove(board, friendlyRow, friendlyCol, row, col, friendlyPiece)) {
                  protectedCount++;
                  break;
                }
              }
            }
          }
        }
      }
    }
    
    return protectedCount;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get AI status for debugging
  getStatus() {
    return {
      elo: this.elo,
      isThinking: this.isThinking,
      difficultySettings: this.difficultySettings,
      moveCount: this.moveHistory.length
    };
  }
}
