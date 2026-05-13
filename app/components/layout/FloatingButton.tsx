"use client";

import React from 'react';
import { Sparkles } from 'lucide-react';

const FloatingButton: React.FC = () => {
    return (
        <div className="fixed right-6 bottom-6 z-40 hidden md:block">
            <button 
                className="bg-primary text-white p-4 rounded-2xl shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all duration-300 group"
                title="Khám phá tính năng AI"
            >
                <Sparkles className="w-6 h-6 group-hover:animate-pulse fill-white/20" />
            </button>
        </div>
    );
};

export default FloatingButton;