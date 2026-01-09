"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Upload } from "lucide-react";

interface ImageInputProps {
    onImageSelect: (file: File | null) => void;
    selectedImage: File | null;
}

export function ImageInput({ onImageSelect, selectedImage }: ImageInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                    navigator.userAgent
                ) || window.innerWidth < 768
            );
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Generate preview when image changes
    useEffect(() => {
        if (selectedImage) {
            const url = URL.createObjectURL(selectedImage);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreview(null);
        }
    }, [selectedImage]);

    const handleClick = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0] || null;
            onImageSelect(file);
            // Reset input so same file can be selected again
            e.target.value = "";
        },
        [onImageSelect]
    );

    const handleRemove = useCallback(() => {
        onImageSelect(null);
    }, [onImageSelect]);

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture={isMobile ? "environment" : undefined}
                onChange={handleChange}
                className="hidden"
            />

            <AnimatePresence mode="wait">
                {preview ? (
                    // Image Preview
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="relative"
                    >
                        <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-border">
                            <img
                                src={preview}
                                alt="Selected meal"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Remove button */}
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1 }}
                            onClick={handleRemove}
                            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                            aria-label="Remove image"
                        >
                            <X className="w-4 h-4" />
                        </motion.button>
                    </motion.div>
                ) : (
                    // Camera/Upload Button
                    <motion.button
                        key="button"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleClick}
                        className="group flex flex-col items-center justify-center w-32 h-32 rounded-2xl border-2 border-dashed border-muted-foreground/30 hover:border-vera transition-colors bg-muted/30 hover:bg-muted/50"
                    >
                        {isMobile ? (
                            <Camera className="w-8 h-8 text-muted-foreground group-hover:text-vera transition-colors" />
                        ) : (
                            <Upload className="w-8 h-8 text-muted-foreground group-hover:text-vera transition-colors" />
                        )}
                        <span className="text-xs text-muted-foreground mt-2">
                            {isMobile ? "Take Photo" : "Upload"}
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
