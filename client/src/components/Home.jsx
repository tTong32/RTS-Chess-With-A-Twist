// Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="mb-8">
                <h1 className="text-6xl font-bold text-gray-800">RTS Chess</h1>
            </div>
            
            <div className="flex gap-8">
                <Link 
                    to="/multiplayer" 
                    className="bg-blue-100 rounded-xl shadow-md px-12 py-8 text-center cursor-pointer transition-all duration-200 hover:bg-blue-200 hover:shadow-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <h2 className="text-2xl font-semibold text-blue-800">Play Online</h2>
                    <p className="text-sm text-blue-600 mt-2">Multiplayer with friends</p>
                </Link>
                
                <Link 
                    to="/setup" 
                    className="bg-gray-100 rounded-xl shadow-md px-12 py-8 text-center cursor-pointer transition-all duration-200 hover:bg-gray-200 hover:shadow-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <h2 className="text-2xl font-semibold text-gray-800">Local Game</h2>
                    <p className="text-sm text-gray-600 mt-2">Play locally</p>
                </Link>
                
                <Link 
                    to="/ai-setup" 
                    className="bg-purple-100 rounded-xl shadow-md px-12 py-8 text-center cursor-pointer transition-all duration-200 hover:bg-purple-200 hover:shadow-lg outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <h2 className="text-2xl font-semibold text-purple-800">Play Against AI</h2>
                    <p className="text-sm text-purple-600 mt-2">Adjustable difficulty</p>
                </Link>
                
                <div className="bg-gray-100 rounded-xl shadow-md px-12 py-8 text-center cursor-pointer transition-all duration-200 hover:bg-gray-200 hover:shadow-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <h2 className="text-2xl font-semibold text-gray-800">Tutorial</h2>
                    <p className="text-sm text-gray-600 mt-2">Learn to play</p>
                </div>
            </div>
        </div>
    );
}

export default Home;