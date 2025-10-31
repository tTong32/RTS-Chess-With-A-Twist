import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx';
import './index.css';

// Note: Strict Mode disabled in development to prevent double socket connections
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);