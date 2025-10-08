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
                    to="/setup" 
                    className="bg-gray-100 rounded-xl shadow-md px-12 py-8 text-center cursor-pointer transition-all duration-200 hover:bg-gray-200 hover:shadow-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <h2 className="text-2xl font-semibold text-gray-800">Play with Friends</h2>
                </Link>
                
                <div className="bg-gray-100 rounded-xl shadow-md px-12 py-8 text-center cursor-pointer transition-all duration-200 hover:bg-gray-200 hover:shadow-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <h2 className="text-2xl font-semibold text-gray-800">Play Against Bot</h2>
                </div>
                
                <div className="bg-gray-100 rounded-xl shadow-md px-12 py-8 text-center cursor-pointer transition-all duration-200 hover:bg-gray-200 hover:shadow-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <h2 className="text-2xl font-semibold text-gray-800">Tutorial</h2>
                </div>
            </div>
        </div>
    );
}

export default Home;