"use client";

import { useRef, useEffect } from "react";

const POPULAR_EMOJIS = [
    "😀", "😂", "😍", "🥰", "😘", "😊", "😎", "🤔",
    "😢", "😭", "😡", "🥺", "😱", "🤗", "🤭", "🙄",
    "👍", "👎", "👏", "🙏", "💪", "🤝", "✌️", "🤞",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
    "🔥", "⭐", "✨", "💯", "🎉", "🎊", "🎁", "🏆",
    "😴", "🤤", "😋", "🤪", "😜", "🙃", "😇", "🥳",
];

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={ref}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 w-72 z-50"
        >
            <div className="grid grid-cols-8 gap-1">
                {POPULAR_EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => onSelect(emoji)}
                        className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}
