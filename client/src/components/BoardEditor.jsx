// BoardEditor.jsx
// BoardEditor.jsx
import React, { useState, useEffect } from 'react'; // Removed useCallback as it's no longer needed for cooldownTimes
import { useNavigate } from 'react-router-dom';
import { ChessRules } from '../game/ChessRules.js';

function getPieceSymbol(type) {
    const symbols = {
        king: '♔',
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘',
        pawn: '♙'
    };
    return symbols[type] || '?';
}

const BoardEditor = ({ initialBoard, onSaveBoard }) => {
    const navigate = useNavigate();
    const [board, setBoard] = useState(initialBoard);
    const [selectedPiece, setSelectedPiece] = useState({ type: 'pawn', color: 'white', cooldown: 0, cooldownTime: 0 });
    const [mode, setMode] = useState('place');
    const boardSize = 540;

    // --- MODIFIED LINE HERE ---
    // 'cooldownTimes' is now directly the object returned by ChessRules.getCooldownTimes()
    const cooldownTimes = ChessRules.getCooldownTimes(); 
    // --- END MODIFICATION ---

    const pieceTypes = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

    // Effect to update selectedPiece's cooldownTime whenever its type changes
    useEffect(() => {
        // Use 'cooldownTimes' directly, no need to call a function
        setSelectedPiece(prev => ({
            ...prev,
            cooldownTime: cooldownTimes[prev.type] || 0 // Use cooldownTimes directly
        }));
    }, [selectedPiece.type]); // Removed getAllCooldownTimes from dependencies, as cooldownTimes is constant for this component


    const handleSquareClick = (rowIndex, colIndex) => {
        const newBoard = board.map(row => [...row]);
        
        if (mode === 'erase') {
            newBoard[rowIndex][colIndex] = null;
        } else {
            // When placing, ensure the piece has all necessary properties
            newBoard[rowIndex][colIndex] = { 
                type: selectedPiece.type,
                color: selectedPiece.color,
                cooldown: 0, // Always starts with 0 cooldown when placed
                cooldownTime: cooldownTimes[selectedPiece.type] || 0 // Use cooldownTimes directly
            };
        }
        
        setBoard(newBoard);
    };

    const handleSave = () => {
        onSaveBoard(board);
        navigate('/setup');
    };

    const handleCancel = () => {
        navigate('/setup');
    };

    const clearBoard = () => {
        setBoard(Array(8).fill().map(() => Array(8).fill(null)));
    };

    return (
        <div className="flex w-screen h-screen">
            <div className="flex-[2] flex justify-center items-center min-w-0 min-h-0">
                <div 
                    className="relative border-2 border-gray-800 bg-white shadow-md rounded-xl overflow-hidden select-none"
                    style={{
                        width: boardSize,
                        height: boardSize,
                    }}
                >
                    {board.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex">
                            {row.map((cell, colIndex) => (
                                <div 
                                    key={colIndex} 
                                    className={`flex items-center justify-center cursor-pointer ${
                                        (rowIndex + colIndex) % 2 === 0 ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'
                                    }`}
                                    style={{
                                        width: boardSize/8,
                                        height: boardSize/8,
                                    }}
                                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                                > 
                                    {cell && (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <div 
                                                className={`text-4xl relative z-10 ${
                                                    cell.color === 'white' 
                                                        ? 'text-white' 
                                                        : 'text-black'
                                                }`}
                                                style={{
                                                    textShadow: cell.color === 'white' 
                                                        ? '1px 1px 2px black' 
                                                        : '1px 1px 2px white'
                                                }}
                                            >
                                                {getPieceSymbol(cell.type)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 min-w-0 bg-gray-100 p-8 flex flex-col justify-center items-center">
                <h2 className="mb-5 text-2xl font-semibold">Board Editor</h2>
                
                <div className="w-64 my-2">
                    <h3 className="m-0 mb-2 text-sm text-center">Mode</h3>
                    <div className="flex gap-1">
                        <button 
                            className={`flex-1 p-2 border-2 border-gray-800 rounded-xl cursor-pointer text-sm transition-colors duration-200 ${
                                mode === 'place' 
                                    ? 'bg-gray-800 text-white' 
                                    : 'bg-white hover:bg-gray-100'
                            }`}
                            onClick={() => setMode('place')}
                        >
                            Place
                        </button>
                        <button 
                            className={`flex-1 p-2 border-2 border-gray-800 rounded-xl cursor-pointer text-sm transition-colors duration-200 ${
                                mode === 'erase' 
                                    ? 'bg-gray-800 text-white' 
                                    : 'bg-white hover:bg-gray-100'
                            }`}
                            onClick={() => setMode('erase')}
                        >
                            Erase
                        </button>
                    </div>
                </div>

                {mode === 'place' && (
                    <>
                        <div className="w-64 my-2">
                            <h3 className="m-0 mb-2 text-sm text-center">Color</h3>
                            <div className="flex gap-1">
                                <button 
                                    className={`flex-1 p-2 border-2 border-gray-800 rounded-xl cursor-pointer text-sm transition-colors duration-200 ${
                                        selectedPiece.color === 'white' 
                                            ? 'bg-gray-800 text-white' 
                                            : 'bg-white hover:bg-gray-100'
                                    }`}
                                    onClick={() => setSelectedPiece(prev => ({...prev, color: 'white'}))}
                                >
                                    White
                                </button>
                                <button 
                                    className={`flex-1 p-2 border-2 border-gray-800 rounded-xl cursor-pointer text-sm transition-colors duration-200 ${
                                        selectedPiece.color === 'black' 
                                            ? 'bg-gray-800 text-white' 
                                            : 'bg-white hover:bg-gray-100'
                                    }`}
                                    onClick={() => setSelectedPiece(prev => ({...prev, color: 'black'}))}
                                >
                                    Black
                                </button>
                            </div>
                        </div>

                        <div className="w-64 my-2">
                            <h3 className="m-0 mb-2 text-sm text-center">Piece</h3>
                            <div className="grid grid-cols-3 gap-1">
                                {pieceTypes.map(type => (
                                    <button
                                        key={type}
                                        className={`p-4 border-2 rounded-xl cursor-pointer transition-colors duration-200 flex items-center justify-center ${
                                            selectedPiece.type === type 
                                                ? 'bg-gray-200 border-black border-[3px]' 
                                                : 'bg-white border-gray-800 hover:bg-gray-100'
                                        }`}
                                        onClick={() => setSelectedPiece(prev => ({...prev, type, cooldown: 0}))}
                                    >
                                        <div 
                                            className={`text-3xl ${
                                                selectedPiece.color === 'white' 
                                                    ? 'text-white' 
                                                    : 'text-black'
                                            }`}
                                            style={{
                                                textShadow: selectedPiece.color === 'white' 
                                                    ? '1px 1px 2px black' 
                                                    : '1px 1px 2px white'
                                            }}
                                        >
                                            {getPieceSymbol(type)}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <button 
                    className="border-2 border-gray-800 rounded-xl w-64 my-1 p-3 bg-white cursor-pointer text-base transition-colors duration-200 hover:bg-gray-100 active:bg-gray-200"
                    onClick={clearBoard}
                >
                    Clear Board
                </button>

                <button 
                    className="border-2 border-gray-800 rounded-xl w-64 my-1 p-3 bg-white cursor-pointer text-base transition-colors duration-200 hover:bg-gray-100 active:bg-gray-200"
                    onClick={handleSave}
                >
                    Save & Return
                </button>

                <button 
                    className="border-2 border-gray-800 rounded-xl w-64 my-1 p-3 bg-white cursor-pointer text-base transition-colors duration-200 hover:bg-gray-100 active:bg-gray-200"
                    onClick={handleCancel}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default BoardEditor;