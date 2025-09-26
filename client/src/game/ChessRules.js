// src/game/chessRules.js

export class ChessRules {
    static isValidMove(board, fromRow, fromCol, toRow, toCol, piece) {
        if (!piece) return false;

        if (fromRow == toRow && fromCol == toCol) return false;

        const targetPiece = board[toRow][toCol];
        if (targetPiece && targetPiece.color == piece.color) return false;

        switch(piece.type){
            case 'pawn': return this.isValidPawnMove(board, fromRow, fromCol, toRow, toCol, piece);
            case 'knight': return this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
            case 'bishop': return this.isValidBishopMove(board, fromRow, fromCol, toRow, toCol);
            case 'rook': return this.isValidRookMove(board, fromRow, fromCol, toRow, toCol);
            case 'queen': return this.isValidQueenMove(board, fromRow, fromCol, toRow, toCol);
            case 'king': return this.isValidKingMove(board, fromRow, fromCol, toRow, toCol);

            // for future implementation 
            //case 'twisted pawn': return this.isValidTwistedPawnMove(board, fromRow, fromCol, toRow, toCol, piece);
            //case 'flying castle': return this.isValidFlyingCastleMove(board, fromRow, fromCol, toRow, toCol, piece);
        }
    }

    static isValidPawnMove(board, fromRow, fromCol, toRow, toCol, piece) {
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ?  6 : 1;

        if (fromCol === toCol){
            if (toRow === fromRow + direction) return !board[toRow][toCol]; // normal forward move
            if (fromRow === startRow && toRow === fromRow + 2 * direction)
                return !board[fromRow + direction][toCol] && !board[toRow][toCol] // double move from starting position
        }

        if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction) 
            return board[toRow][toCol] && board[toRow][toCol].color !== piece.color; // capture move

        return false;
    }

    static isValidKnightMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }
    
    static isValidBishopMove(board, fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        if (rowDiff != colDiff) return false;

        const rowStep = toRow > fromRow ? 1 : -1;
        const colStep = toCol > fromCol ? 1 : -1;
        
        for (let i = 1; i < rowDiff; i++){
            const checkRow = fromRow + i * rowStep;
            const checkCol = fromCol + i * colStep;
            if (board[checkRow][checkCol]) return false;
        }
        return true;
    }

    static isValidRookMove(board, fromRow, fromCol, toRow, toCol){
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

    static isValidQueenMove(board, fromRow, fromCol, toRow, toCol){
        return this.isValidBishopMove(board, fromRow, fromCol, toRow, toCol) || this.isValidRookMove(board, fromRow, fromCol, toRow, toCol);
    }

    static isValidKingMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        return rowDiff <= 1 && colDiff <= 1;
    }
}