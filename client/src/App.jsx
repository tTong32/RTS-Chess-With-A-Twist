// App.jsx
import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home.jsx';
import GameSetup from './components/GameSetup.jsx';
import BoardEditor from './components/BoardEditor.jsx';
import GameBoard from './components/gameboard.jsx';
import MultiplayerLobby from './components/MultiplayerLobby.jsx';
import MultiplayerGame from './components/MultiplayerGame.jsx';
import AIGameSetup from './components/AIGameSetup.jsx';
import AIGame from './components/AIGame.jsx';
import { ChessRules } from './game/ChessRules.js';

function initializeDefaultBoard() {
    const initialBoard = Array(8).fill().map(() => Array(8).fill(null));

    // Define cooldown times for different piece types
    const cooldownTimes = ChessRules.getCooldownTimes();

    for (let i = 0; i < 8; i++){
        initialBoard[6][i] = { type: 'pawn', color: 'white', cooldown: 0, cooldownTime: cooldownTimes.pawn };
        initialBoard[1][i] = { type: 'pawn', color: 'black', cooldown: 0, cooldownTime: cooldownTimes.pawn };
    }

    const backRowPieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    backRowPieces.forEach((pieceType, i) => { // Renamed 'piece' to 'pieceType' to avoid confusion with the object
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

function App() {
    const [customBoard, setCustomBoard] = useState(initializeDefaultBoard());

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route 
                    path="/game" 
                    element={<GameBoard customBoard={customBoard} />} 
                />
                <Route 
                    path="/setup" 
                    element={<GameSetup customBoard={customBoard} />} 
                />
                <Route 
                    path="/board" 
                    element={
                        <BoardEditor 
                            initialBoard={customBoard}
                            onSaveBoard={setCustomBoard}
                        />
                    } 
                />
                <Route path="/multiplayer" element={<MultiplayerLobby />} />
                <Route path="/multiplayer-game" element={<MultiplayerGame />} />
                <Route path="/ai-setup" element={<AIGameSetup />} />
                <Route path="/ai-game" element={<AIGame />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;