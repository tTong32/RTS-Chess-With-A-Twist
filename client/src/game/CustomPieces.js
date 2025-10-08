// CustomPieces.js - Support for custom pieces like twisted pawn
export class CustomPieces {
  constructor() {
    this.pieceTypes = {
      // Standard pieces
      pawn: {
        name: 'Pawn',
        symbol: '♙',
        description: 'Basic infantry unit',
        energyCost: 2,
        cooldownTime: 3000,
        isValidMove: this.isValidPawnMove.bind(this)
      },
      knight: {
        name: 'Knight',
        symbol: '♘',
        description: 'Cavalry unit with L-shaped movement',
        energyCost: 4,
        cooldownTime: 4000,
        isValidMove: this.isValidKnightMove.bind(this)
      },
      bishop: {
        name: 'Bishop',
        symbol: '♗',
        description: 'Diagonally moving unit',
        energyCost: 5,
        cooldownTime: 5000,
        isValidMove: this.isValidBishopMove.bind(this)
      },
      rook: {
        name: 'Rook',
        symbol: '♖',
        description: 'Horizontally and vertically moving unit',
        energyCost: 6,
        cooldownTime: 6000,
        isValidMove: this.isValidRookMove.bind(this)
      },
      queen: {
        name: 'Queen',
        symbol: '♕',
        description: 'Most powerful unit, combines rook and bishop',
        energyCost: 8,
        cooldownTime: 8000,
        isValidMove: this.isValidQueenMove.bind(this)
      },
      king: {
        name: 'King',
        symbol: '♔',
        description: 'Most important unit, moves one square in any direction',
        energyCost: 10,
        cooldownTime: 10000,
        isValidMove: this.isValidKingMove.bind(this)
      },
      
      // Custom pieces
      'twisted-pawn': {
        name: 'Twisted Pawn',
        symbol: '♟',
        description: 'Pawn that can move diagonally forward and capture straight',
        energyCost: 3,
        cooldownTime: 3500,
        isValidMove: this.isValidTwistedPawnMove.bind(this)
      },
      'flying-castle': {
        name: 'Flying Castle',
        symbol: '🏰',
        description: 'Rook that can jump over pieces',
        energyCost: 7,
        cooldownTime: 7000,
        isValidMove: this.isValidFlyingCastleMove.bind(this)
      },
      'shadow-knight': {
        name: 'Shadow Knight',
        symbol: '♞',
        description: 'Knight that can move through pieces',
        energyCost: 5,
        cooldownTime: 4500,
        isValidMove: this.isValidShadowKnightMove.bind(this)
      },
      'ice-bishop': {
        name: 'Ice Bishop',
        symbol: '❄',
        description: 'Bishop that freezes pieces it passes over',
        energyCost: 6,
        cooldownTime: 5500,
        isValidMove: this.isValidIceBishopMove.bind(this)
      }
    };
  }

  // Get piece information
  getPieceInfo(pieceType) {
    return this.pieceTypes[pieceType] || this.pieceTypes.pawn;
  }

  // Get all available piece types
  getAllPieceTypes() {
    return Object.keys(this.pieceTypes);
  }

  // Get custom pieces only
  getCustomPieceTypes() {
    return Object.keys(this.pieceTypes).filter(type => 
      !['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'].includes(type)
    );
  }

  // Standard piece move validations (imported from ChessRules)
  isValidPawnMove(board, fromRow, fromCol, toRow, toCol, piece) {
    const direction = piece.color === 'white' ? -1 : 1;
    const startRow = piece.color === 'white' ? 6 : 1;

    if (fromCol === toCol) {
      if (toRow === fromRow + direction) return !board[toRow][toCol];
      if (fromRow === startRow && toRow === fromRow + 2 * direction)
        return !board[fromRow + direction][toCol] && !board[toRow][toCol];
    }

    if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction) 
      return board[toRow][toCol] && board[toRow][toCol].color !== piece.color;

    return false;
  }

  isValidKnightMove(board, fromRow, fromCol, toRow, toCol, piece) {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  }

  isValidBishopMove(board, fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    if (rowDiff !== colDiff) return false;

    const rowStep = toRow > fromRow ? 1 : -1;
    const colStep = toCol > fromCol ? 1 : -1;
    
    for (let i = 1; i < rowDiff; i++) {
      const checkRow = fromRow + i * rowStep;
      const checkCol = fromCol + i * colStep;
      if (board[checkRow][checkCol]) return false;
    }
    return true;
  }

  isValidRookMove(board, fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) return false;

    if (fromRow === toRow) {
      const step = toCol > fromCol ? 1 : -1;
      for (let col = fromCol + step; col !== toCol; col += step) {
        if (board[fromRow][col]) return false;
      } 
    } else {
      const step = toRow > fromRow ? 1 : -1;
      for (let row = fromRow + step; row !== toRow; row += step) {
        if (board[row][fromCol]) return false;
      }
    }
    return true;
  }

  isValidQueenMove(board, fromRow, fromCol, toRow, toCol) {
    return this.isValidBishopMove(board, fromRow, fromCol, toRow, toCol) || 
           this.isValidRookMove(board, fromRow, fromCol, toRow, toCol);
  }

  isValidKingMove(board, fromRow, fromCol, toRow, toCol, piece) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return rowDiff <= 1 && colDiff <= 1;
  }

  // Custom piece move validations
  isValidTwistedPawnMove(board, fromRow, fromCol, toRow, toCol, piece) {
    const direction = piece.color === 'white' ? -1 : 1;
    const startRow = piece.color === 'white' ? 6 : 1;

    // Can move diagonally forward (like capturing)
    if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction) {
      return !board[toRow][toCol]; // Can move to empty square diagonally
    }

    // Can capture straight forward
    if (fromCol === toCol && toRow === fromRow + direction) {
      return board[toRow][toCol] && board[toRow][toCol].color !== piece.color;
    }

    // Double move from starting position
    if (fromCol === toCol && fromRow === startRow && toRow === fromRow + 2 * direction) {
      return !board[fromRow + direction][toCol] && !board[toRow][toCol];
    }

    return false;
  }

  isValidFlyingCastleMove(board, fromRow, fromCol, toRow, toCol) {
    // Like a rook but can jump over pieces
    if (fromRow !== toRow && fromCol !== toCol) return false;

    // Check if path is clear (but allow jumping over pieces)
    if (fromRow === toRow) {
      const step = toCol > fromCol ? 1 : -1;
      for (let col = fromCol + step; col !== toCol; col += step) {
        // Allow jumping over pieces, but not landing on friendly pieces
        if (board[fromRow][col] && col === toCol - step) {
          return board[fromRow][col].color !== board[fromRow][fromCol].color;
        }
      } 
    } else {
      const step = toRow > fromRow ? 1 : -1;
      for (let row = fromRow + step; row !== toRow; row += step) {
        if (board[row][fromCol] && row === toRow - step) {
          return board[row][fromCol].color !== board[fromRow][fromCol].color;
        }
      }
    }
    return true;
  }

  isValidShadowKnightMove(board, fromRow, fromCol, toRow, toCol, piece) {
    // Like a knight but can move through pieces
    return this.isValidKnightMove(board, fromRow, fromCol, toRow, toCol, piece);
  }

  isValidIceBishopMove(board, fromRow, fromCol, toRow, toCol) {
    // Like a bishop but can move through pieces
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    return rowDiff === colDiff;
  }

  // Validate any piece move
  isValidMove(board, fromRow, fromCol, toRow, toCol, piece) {
    if (!piece) return false;
    if (fromRow === toRow && fromCol === toCol) return false;

    const targetPiece = board[toRow][toCol];
    if (targetPiece && targetPiece.color === piece.color) return false;

    const pieceInfo = this.getPieceInfo(piece.type);
    return pieceInfo.isValidMove(board, fromRow, fromCol, toRow, toCol, piece);
  }
}
