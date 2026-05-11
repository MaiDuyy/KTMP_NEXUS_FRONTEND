"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    autoFocus?: boolean;
    className?: string;
}

export function OTPInput({
    length = 6,
    value,
    onChange,
    disabled = false,
    autoFocus = true,
    className,
}: OTPInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [localValue, setLocalValue] = useState<string[]>(
        value.split("").slice(0, length).concat(Array(length).fill("")).slice(0, length)
    );

    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [autoFocus]);

    useEffect(() => {
        const newValue = value.split("").slice(0, length);
        setLocalValue(newValue.concat(Array(length - newValue.length).fill("")));
    }, [value, length]);

    const focusInput = (index: number) => {
        if (inputRefs.current[index]) {
            inputRefs.current[index]?.focus();
            inputRefs.current[index]?.select();
        }
    };

    const handleChange = (index: number, digit: string) => {
        if (!/^\d*$/.test(digit)) return;

        const newValue = [...localValue];
        newValue[index] = digit.slice(-1);
        setLocalValue(newValue);
        onChange(newValue.join(""));

        // Auto focus next input
        if (digit && index < length - 1) {
            focusInput(index + 1);
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            e.preventDefault();
            const newValue = [...localValue];

            if (localValue[index]) {
                newValue[index] = "";
                setLocalValue(newValue);
                onChange(newValue.join(""));
            } else if (index > 0) {
                newValue[index - 1] = "";
                setLocalValue(newValue);
                onChange(newValue.join(""));
                focusInput(index - 1);
            }
        } else if (e.key === "ArrowLeft" && index > 0) {
            focusInput(index - 1);
        } else if (e.key === "ArrowRight" && index < length - 1) {
            focusInput(index + 1);
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);

        if (pastedData) {
            const newValue = pastedData.split("").concat(Array(length).fill("")).slice(0, length);
            setLocalValue(newValue);
            onChange(newValue.join(""));

            // Focus last filled input or first empty
            const focusIndex = Math.min(pastedData.length, length - 1);
            focusInput(focusIndex);
        }
    };

    return (
        <div className={cn("flex gap-2 justify-center", className)}>
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={localValue[index] || ""}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={(e) => e.target.select()}
                    disabled={disabled}
                    className={cn(
                        "w-12 h-14 text-center text-2xl font-bold rounded-lg border-2",
                        "transition-all duration-200 outline-none",
                        "focus:border-primary focus:ring-2 focus:ring-primary/20",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "bg-background text-foreground",
                        localValue[index]
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/30"
                    )}
                />
            ))}
        </div>
    );
}
