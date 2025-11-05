// App.jsx
import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import Home from './components/Home.jsx';
import GameSetup from './components/GameSetup.jsx';
import BoardEditor from './components/BoardEditor.jsx';
import GameBoard from './components/GameBoard.jsx';
import MultiplayerLobby from './components/MultiplayerLobby.jsx';
import MultiplayerGame from './components/MultiplayerGame.jsx';
import AIGameSetup from './components/AIGameSetup.jsx';
import AIGame from './components/AIGame.jsx';
import Friends from './components/Friends.jsx';
import Spectate from './components/Spectate.jsx';
import VerifyEmail from './components/VerifyEmail.jsx';
import { CustomPieces } from './game/CustomPieces.js';

export function initializeDefaultBoard() {
    const initialBoard = Array(8).fill().map(() => Array(8).fill(null));
    const customPieces = new CustomPieces();

    for (let i = 0; i < 8; i++){
        const pawnInfo = customPieces.getPieceInfo('pawn');
        initialBoard[6][i] = { type: 'pawn', color: 'white', cooldown: 0, cooldownTime: pawnInfo.cooldownTime };
        initialBoard[1][i] = { type: 'pawn', color: 'black', cooldown: 0, cooldownTime: pawnInfo.cooldownTime };
    }

    const backRowPieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    backRowPieces.forEach((pieceType, i) => {
        const pieceInfo = customPieces.getPieceInfo(pieceType);
        initialBoard[0][i] = {
            type: pieceType,
            color: 'black',
            cooldown: 0,
            cooldownTime: pieceInfo.cooldownTime
        };
        initialBoard[7][i] = {
            type: pieceType,
            color: 'white',
            cooldown: 0,
            cooldownTime: pieceInfo.cooldownTime
        };
    });

    return initialBoard;
}

function App() {
    const [customBoard, setCustomBoard] = useState(initializeDefaultBoard());

    return (
        <AuthProvider>
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
                    <Route path="/board-editor" element={<BoardEditor />} />
                    <Route path="/multiplayer" element={<MultiplayerLobby />} />
                    <Route path="/multiplayer-game" element={<MultiplayerGame />} />
                    <Route path="/ai-setup" element={<AIGameSetup />} />
                    <Route path="/ai-game" element={<AIGame />} />
                    <Route path="/friends" element={<Friends />} />
                    <Route path="/spectate" element={<Spectate />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
