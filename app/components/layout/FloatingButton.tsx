"use client";
import React from 'react';

const FloatingButton: React.FC = () => {
    return (
        <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40 hidden md:block">
            <button className="bg-white dark:bg-surface-dark p-3 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 text-primary hover:scale-110 transition group">
                <span className="material-icons text-2xl group-hover:animate-pulse">
                    stars
                </span>
            </button>
        </div>
    );
};

export default FloatingButton;