"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Play, Square, Trash2 } from "lucide-react";

interface AudioRecorderProps {
    onAudioRecord: (blob: Blob | null) => void;
    recordedAudio: Blob | null;
}

export function AudioRecorder({
    onAudioRecord,
    recordedAudio,
}: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Generate audio URL when recorded audio changes
    useEffect(() => {
        if (recordedAudio) {
            const url = URL.createObjectURL(recordedAudio);
            setAudioUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setAudioUrl(null);
        }
    }, [recordedAudio]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                onAudioRecord(blob);
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Failed to start recording:", err);
        }
    }, [onAudioRecord]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    const handlePlayPause = useCallback(async () => {
        if (!audioRef.current || !audioUrl) return;

        if (isPlaying) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        } else {
            try {
                await audioRef.current.play();
                setIsPlaying(true);
            } catch (err) {
                console.error("Failed to play audio:", err);
            }
        }
    }, [audioUrl, isPlaying]);

    const handleDelete = useCallback(() => {
        onAudioRecord(null);
        setIsPlaying(false);
    }, [onAudioRecord]);

    // Handle audio ended
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            const handleEnded = () => setIsPlaying(false);
            audio.addEventListener("ended", handleEnded);
            return () => audio.removeEventListener("ended", handleEnded);
        }
    }, [audioUrl]);

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Only render audio element when we have a valid URL */}
            {recordedAudio && audioUrl && (
                <audio ref={audioRef} src={audioUrl} preload="metadata" />
            )}

            <AnimatePresence mode="wait">
                {recordedAudio && audioUrl ? (
                    // Playback controls
                    <motion.div
                        key="playback"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/50 border border-border"
                    >
                        {/* Play/Stop button */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handlePlayPause}
                            className="w-10 h-10 rounded-full bg-vera text-background flex items-center justify-center"
                            aria-label={isPlaying ? "Stop playback" : "Play recording"}
                        >
                            {isPlaying ? (
                                <Square className="w-4 h-4" />
                            ) : (
                                <Play className="w-4 h-4 ml-0.5" />
                            )}
                        </motion.button>

                        {/* Waveform placeholder */}
                        <div className="flex items-center gap-1 h-8">
                            {[...Array(12)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="w-1 bg-vera/60 rounded-full"
                                    initial={{ height: 8 }}
                                    animate={{
                                        height: isPlaying
                                            ? [8, 16 + Math.random() * 16, 8]
                                            : 8 + Math.sin(i * 0.5) * 8,
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        repeat: isPlaying ? Infinity : 0,
                                        delay: i * 0.05,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Delete button */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDelete}
                            className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors"
                            aria-label="Delete recording"
                        >
                            <Trash2 className="w-4 h-4" />
                        </motion.button>
                    </motion.div>
                ) : (
                    // Record button
                    <motion.button
                        key="record"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onMouseLeave={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        className="relative flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 border-2 border-muted-foreground/30 transition-colors touch-none select-none"
                        aria-label="Hold to record"
                    >
                        {/* Pulsing ring while recording */}
                        <AnimatePresence>
                            {isRecording && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 1 }}
                                    animate={{ opacity: [0.5, 0], scale: [1, 1.5] }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="absolute inset-0 rounded-full border-4 border-red-500"
                                />
                            )}
                        </AnimatePresence>

                        {/* Inner recording indicator */}
                        <motion.div
                            animate={{
                                scale: isRecording ? 1.1 : 1,
                                backgroundColor: isRecording
                                    ? "rgb(239 68 68)"
                                    : "hsl(var(--muted-foreground))",
                            }}
                            transition={{ duration: 0.2 }}
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                        >
                            <Mic className="w-6 h-6 text-background" />
                        </motion.div>
                    </motion.button>
                )}
            </AnimatePresence>

            <span className="text-xs text-muted-foreground">
                {isRecording
                    ? "Release to stop"
                    : recordedAudio
                        ? "Tap play to review"
                        : "Hold to record"}
            </span>
        </div>
    );
}
