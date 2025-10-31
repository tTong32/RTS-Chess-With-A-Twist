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
        cooldownTime: 4000,
        isValidMove: this.isValidPawnMove.bind(this),
        maxCount: 8
      },
      knight: {
        name: 'Knight',
        symbol: '♘',
        description: 'Cavalry unit with L-shaped movement',
        energyCost: 4,
        cooldownTime: 5000,
        isValidMove: this.isValidKnightMove.bind(this),
        maxCount: 2
      },
      bishop: {
        name: 'Bishop',
        symbol: '♗',
        description: 'Diagonally moving unit',
        energyCost: 5,
        cooldownTime: 6000,
        isValidMove: this.isValidBishopMove.bind(this),
        maxCount: 2
      },
      rook: {
        name: 'Rook',
        symbol: '♖',
        description: 'Horizontally and vertically moving unit',
        energyCost: 6,
        cooldownTime: 7000,
        isValidMove: this.isValidRookMove.bind(this),
        maxCount: 2
      },
      queen: {
        name: 'Queen',
        symbol: '♕',
        description: 'Most powerful unit, combines rook and bishop',
        energyCost: 8,
        cooldownTime: 9000,
        isValidMove: this.isValidQueenMove.bind(this),
        maxCount: 1
      },
      king: {
        name: 'King',
        symbol: '♔',
        description: 'Most important unit, moves one square in any direction',
        energyCost: 10,
        cooldownTime: 11000,
        isValidMove: this.isValidKingMove.bind(this),
        maxCount: 1
      },
      
      // Custom pieces
      'twisted-pawn': {
        name: 'Twisted Pawn',
        symbol: '♟',
        description: 'Pawn that can move diagonally forward and capture straight',
        energyCost: 3,
        cooldownTime: 3500,
        isValidMove: this.isValidTwistedPawnMove.bind(this),
        maxCount: 8
      },
      'pawn-general': {
        name: 'Pawn General',
        symbol: '🇬',
        description: 'A pawn that reduces the cooldown of all friendly adjacent pieces by 1.5 seconds. Can only have 2 on the board at a time.',
        energyCost: 4,
        cooldownTime: 5000,
        isValidMove: this.isValidPawnMove.bind(this),
        onMove: this.onPawnGeneralMove.bind(this),
        maxCount: 2
      },
      'flying-castle': {
        name: 'Flying Castle',
        symbol: '🏰',
        description: 'Rook that can jump over a piece only if it directly blocks its path',
        energyCost: 8,
        cooldownTime: 6500,
        isValidMove: this.isValidFlyingCastleMove.bind(this),
        maxCount: 2
      },
      'shadow-knight': {
        name: 'Shadow Knight',
        symbol: '♞',
        description: 'Knight that can move through pieces',
        energyCost: 5,
        cooldownTime: 4500,
        isValidMove: this.isValidShadowKnightMove.bind(this),
        maxCount: 2
      },
      'ice-bishop': {
        name: 'Ice Bishop',
        symbol: '❄',
        description: 'Bishop that increases cooldown of adjacent enemy pieces by 3 seconds',
        energyCost: 6,
        cooldownTime: 5500,
        isValidMove: this.isValidIceBishopMove.bind(this),
        onMove: this.onIceBishopMove.bind(this),
        maxCount: 2
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

    return false;
  }

  isValidFlyingCastleMove(board, fromRow, fromCol, toRow, toCol) {
    // Like a rook but can only jump over ONE piece if it's directly blocking the destination
    if (fromRow !== toRow && fromCol !== toCol) return false;

    if (fromRow === toRow) {
      // Horizontal movement
      const step = toCol > fromCol ? 1 : -1;
      let piecesInPath = [];
      
      // Collect all pieces in the path (excluding destination)
      for (let col = fromCol + step; col !== toCol; col += step) {
        if (board[fromRow][col]) {
          piecesInPath.push({ row: fromRow, col });
        }
      }
      
      // Can only jump over one piece, and it must be directly adjacent to the destination
      if (piecesInPath.length === 0) {
        return true; // Clear path
      } else if (piecesInPath.length === 1) {
        const blockingPiece = piecesInPath[0];
        // Check if the blocking piece is directly next to the destination
        return Math.abs(blockingPiece.col - toCol) === 1;
      } else {
        return false; // More than one piece in the way
      }
    } else {
      // Vertical movement
      const step = toRow > fromRow ? 1 : -1;
      let piecesInPath = [];
      
      // Collect all pieces in the path (excluding destination)
      for (let row = fromRow + step; row !== toRow; row += step) {
        if (board[row][fromCol]) {
          piecesInPath.push({ row, col: fromCol });
        }
      }
      
      // Can only jump over one piece, and it must be directly adjacent to the destination
      if (piecesInPath.length === 0) {
        return true; // Clear path
      } else if (piecesInPath.length === 1) {
        const blockingPiece = piecesInPath[0];
        // Check if the blocking piece is directly next to the destination
        return Math.abs(blockingPiece.row - toRow) === 1;
      } else {
        return false; // More than one piece in the way
      }
    }
  }

  isValidShadowKnightMove(board, fromRow, fromCol, toRow, toCol, piece) {
    // Like a knight but can move through pieces
    return this.isValidKnightMove(board, fromRow, fromCol, toRow, toCol, piece);
  }

  isValidIceBishopMove(board, fromRow, fromCol, toRow, toCol) {
    // Moves like a normal bishop (cannot pass through pieces)
    return this.isValidBishopMove(board, fromRow, fromCol, toRow, toCol);
  }

  onIceBishopMove(board, toRow, toCol, piece) {
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
        const adjacentPiece = board[newRow][newCol];
        // If there's an enemy piece, increase its cooldown
        if (adjacentPiece && adjacentPiece.color !== piece.color) {
          adjacentPiece.cooldown += 3000; // Add 3 seconds
        }
      }
    });
  }

  onPawnGeneralMove(board, toRow, toCol, piece) {
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
        const adjacentPiece = board[newRow][newCol];
        // If there's a friendly piece, reduce its cooldown
        if (adjacentPiece && adjacentPiece.color === piece.color) {
          adjacentPiece.cooldown = Math.max(0, adjacentPiece.cooldown - 1500); // Reduce by 1.5 seconds
        }
      }
    });
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
