import React, { useState } from 'react';

export default function Test({ framework, user, version }) {
    const [clicks, setClicks] = useState(0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white flex flex-col items-center justify-center p-6 text-center">
            
            <div className="max-w-3xl w-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-10 transform hover:scale-105 transition duration-500">
                <div className="flex justify-center mb-6">
                    <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wider uppercase shadow-inner">
                        Success!
                    </span>
                </div>
                
                <h1 className="text-5xl font-extrabold tracking-tight mb-4 drop-shadow-md">
                    {framework} <span className="text-pink-400">&</span> Inertia.js
                </h1>
                
                <p className="text-xl text-gray-300 font-light mb-8 max-w-xl mx-auto">
                    This beautiful React component was rendered entirely natively via LaraNode. No REST API required. 
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                    <div className="bg-black/30 rounded-2xl p-5 border border-white/10 shadow-inner">
                        <p className="text-gray-400 text-sm font-medium mb-1">Authenticated User</p>
                        <p className="text-white text-lg font-mono">{user ? user.name : 'Guest Account'}</p>
                    </div>
                    <div className="bg-black/30 rounded-2xl p-5 border border-white/10 shadow-inner">
                        <p className="text-gray-400 text-sm font-medium mb-1">LaraNode Version</p>
                        <p className="text-white text-lg font-mono">{version || '1.0.0-beta'}</p>
                    </div>
                </div>

                <button 
                    onClick={() => setClicks(c => c + 1)}
                    className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-indigo-600 rounded-full overflow-hidden transition-all duration-300 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] focus:outline-none focus:ring-4 focus:ring-indigo-300"
                >
                    <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
                    <span className="relative flex items-center gap-2">
                        Interactive Counter <span className="bg-white text-indigo-900 px-2 py-0.5 rounded-full text-sm">{clicks}</span>
                    </span>
                </button>
            </div>
            
            <div className="mt-8 text-sm text-gray-400 font-mono opacity-60">
                Running in {process.env.NODE_ENV === 'development' ? 'Development Mode' : 'Production'}
            </div>
        </div>
    );
}
