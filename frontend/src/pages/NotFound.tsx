import React from 'react';
import { Link } from 'react-router-dom';
import { ThemedBackground } from '../components/ThemedBackground';
import { Swords, Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <ThemedBackground variant="error">
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
        <div className="card-shin max-w-md w-full text-center space-y-6 bg-shin-card">
          {/* Action Kamen Mask Illustration */}
          <div className="w-24 h-24 mx-auto animate-shin-bounce">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
              <circle cx="50" cy="50" r="35" fill="#219EBC" stroke="#2B2D42" strokeWidth="4" />
              <polygon points="50,12 43,30 57,30" fill="#FFD93D" stroke="#2B2D42" strokeWidth="3" />
              <polygon points="30,42 45,46 32,56" fill="#FFEAA7" stroke="#2B2D42" strokeWidth="3" />
              <polygon points="70,42 55,46 68,56" fill="#FFEAA7" stroke="#2B2D42" strokeWidth="3" />
              <path d="M 38 68 Q 50 78 62 68" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-shin-red/20 border-2 border-shin-red text-shin-red font-black text-xs uppercase tracking-wider mb-2">
              Error 404 • Lost in Kasukabe
            </div>
            <h1 className="text-4xl sm:text-5xl font-bangers text-shin-yellow tracking-wide">
              Wah! Page Not Found!
            </h1>
            <p className="text-shin-muted text-sm font-bold mt-2 font-comic">
              "Action Kamen searched the entire universe, but couldn't find this page! Ohohoho!"
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/dashboard"
              className="btn-shin-yellow w-full sm:w-auto"
            >
              <Swords className="w-4 h-4" />
              <span>Back to Arena</span>
            </Link>
            <Link
              to="/"
              className="btn-shin-outline w-full sm:w-auto"
            >
              <Home className="w-4 h-4" />
              <span>Go Home</span>
            </Link>
          </div>
        </div>
      </div>
    </ThemedBackground>
  );
};
