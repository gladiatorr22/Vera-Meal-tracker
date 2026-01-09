"use client";

import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface TextInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function TextInput({
    value,
    onChange,
    placeholder = "Describe your meal...",
}: TextInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    const adjustHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, []);

    useEffect(() => {
        adjustHeight();
    }, [value, adjustHeight]);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange(e.target.value);
        },
        [onChange]
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
        >
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                rows={1}
                className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-vera/50 focus:border-vera transition-all"
                style={{ minHeight: "48px" }}
            />
        </motion.div>
    );
}
