"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Upload, ImageIcon } from "lucide-react";

// ============================================================
// UNIQUE FEATURE: Dual-Mode Image Capture
// ============================================================
// Unlike basic image inputs, Vera provides:
// 1. Separate Camera and Gallery buttons for clarity
// 2. Smart mobile detection for optimal UX
// 3. Visual feedback with smooth animations
// 4. Preview with easy removal
// ============================================================

interface ImageInputProps {
    onImageSelect: (file: File | null) => void;
    selectedImage: File | null;
}

export function ImageInput({ onImageSelect, selectedImage }: ImageInputProps) {
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Desktop Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    }, []);

    // Start camera (Desktop only)
    useEffect(() => {
        if (isCameraOpen && !isMobile) {
            const startStream = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
                    });
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    console.error("Camera access error:", err);
                    alert("Unable to access camera. Please check permissions.");
                    setIsCameraOpen(false);
                }
            };
            startStream();
        }
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [isCameraOpen, isMobile]);

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

    const handleCameraClick = useCallback(() => {
        if (isMobile) {
            cameraInputRef.current?.click();
        } else {
            setIsCameraOpen(true);
        }
    }, [isMobile]);

    const capturePhoto = useCallback(() => {
        if (videoRef.current) {
            const video = videoRef.current;
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
                        onImageSelect(file);
                        stopCamera();
                    }
                }, "image/jpeg", 0.9);
            }
        }
    }, [onImageSelect, stopCamera]);

    const handleFileClick = useCallback(() => {
        fileInputRef.current?.click();
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
            {/* Hidden camera input - uses device camera on mobile */}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleChange}
                className="hidden"
            />

            {/* Hidden file input - opens gallery/file picker */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
            />

            {/* Desktop Camera Overlay */}
            <AnimatePresence>
                {isCameraOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                    >
                        <div className="relative w-full max-w-2xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                            {/* Video Feed */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-auto aspect-video object-cover bg-[#1C1C1E]"
                            />

                            {/* Controls Overlay */}
                            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                                <button
                                    onClick={stopCamera}
                                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md"
                                >
                                    <X className="w-6 h-6 text-white" />
                                </button>

                                <button
                                    onClick={capturePhoto}
                                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white" />
                                </button>

                                <div className="w-12" /> {/* Spacer for centering */}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        <div className="relative w-40 h-40 rounded-2xl overflow-hidden border-2 border-vera/30 shadow-lg">
                            <img
                                src={preview}
                                alt="Selected meal"
                                className="w-full h-full object-cover"
                            />
                            {/* Gradient overlay for better contrast */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
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
                    // Dual-Mode Capture Buttons
                    <motion.div
                        key="buttons"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-3"
                    >
                        {/* Camera Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCameraClick}
                            className="group flex flex-col items-center justify-center w-28 h-28 rounded-2xl border-2 border-dashed border-vera/30 hover:border-vera bg-vera/5 hover:bg-vera/10 transition-all duration-200"
                        >
                            <div className="w-12 h-12 rounded-full bg-vera/10 group-hover:bg-vera/20 flex items-center justify-center mb-2 transition-colors">
                                <Camera className="w-6 h-6 text-vera" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-vera transition-colors">
                                Camera
                            </span>
                        </motion.button>

                        {/* Gallery/Upload Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleFileClick}
                            className="group flex flex-col items-center justify-center w-28 h-28 rounded-2xl border-2 border-dashed border-muted-foreground/30 hover:border-vera bg-muted/30 hover:bg-vera/10 transition-all duration-200"
                        >
                            <div className="w-12 h-12 rounded-full bg-muted group-hover:bg-vera/20 flex items-center justify-center mb-2 transition-colors">
                                {isMobile ? (
                                    <ImageIcon className="w-6 h-6 text-muted-foreground group-hover:text-vera transition-colors" />
                                ) : (
                                    <Upload className="w-6 h-6 text-muted-foreground group-hover:text-vera transition-colors" />
                                )}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-vera transition-colors">
                                {isMobile ? "Gallery" : "Upload"}
                            </span>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Helper text */}
            {!preview && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-muted-foreground text-center"
                >
                    Take a photo or choose from {isMobile ? "gallery" : "your files"}
                </motion.p>
            )}
        </div>
    );
}
