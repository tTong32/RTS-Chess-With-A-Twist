// GameSetup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

function Dropdown({ label, options, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(label);

    const handleSelect = (option) => {
        setSelected(option);
        setIsOpen(false);
        onSelect?.(option);
    };

    return (
        <>
            <div className="border-2 border-gray-800 rounded-xl w-64 my-1 flex flex-col items-center justify-center bg-white">
                <div 
                    className="cursor-pointer w-full flex justify-center items-center p-3 relative"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <p className="m-0">{selected}</p>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                </div>
            </div>
            {isOpen && (
                <div className="w-64 flex flex-row gap-1 mx-1 mb-1 justify-center">
                    {options.map((option, idx) => (
                        <div
                            key={idx}
                            className="border-2 border-gray-800 rounded-xl p-3 bg-white cursor-pointer transition-colors duration-200 text-center hover:bg-gray-100"
                            onClick={() => handleSelect(option)}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

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

const GameSetup = ({ customBoard }) => {
    const navigate = useNavigate();
    const boardSize = 540;

    const handleEditBoard = () => {
        navigate('/board');
    };

    const handleStartGame = () => {
        navigate('/game');
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
                    {customBoard.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex">
                            {row.map((cell, colIndex) => (
                                <div 
                                    key={colIndex} 
                                    className={`flex items-center justify-center ${
                                        (rowIndex + colIndex) % 2 === 0 ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'
                                    }`}
                                    style={{
                                        width: boardSize/8,
                                        height: boardSize/8,
                                    }}
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
                <Dropdown 
                    label="play AI" 
                    options={["AI", "Human"]} 
                    onSelect={(val) => console.log("Opponent:", val)} 
                />

                <Dropdown 
                    label="difficulty" 
                    options={["Easy", "Medium", "Hard"]} 
                    onSelect={(val) => console.log("Difficulty:", val)} 
                />

                <Dropdown 
                    label="type" 
                    options={["Classic", "Blitz", "Custom"]} 
                    onSelect={(val) => console.log("Type:", val)} 
                />

                <button 
                    className="border-2 border-gray-800 rounded-xl w-64 my-1 p-3 bg-white cursor-pointer text-base transition-colors duration-200 hover:bg-gray-100 active:bg-gray-200"
                    onClick={handleEditBoard}
                >
                    edit board
                </button>

                <button 
                    className="border-2 border-gray-800 rounded-xl w-64 my-1 p-3 bg-white cursor-pointer text-base transition-colors duration-200 hover:bg-gray-100 active:bg-gray-200"
                    onClick={handleStartGame}
                >
                    start game
                </button>
            </div>
        </div>
    );
}

export default GameSetup;