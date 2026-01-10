"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, X, Loader2, Package, AlertCircle } from "lucide-react";
import { getProductByBarcode, type ProductNutrition } from "@/app/actions/barcode";

interface BarcodeScannerProps {
    onProductScanned: (product: ProductNutrition) => void;
    onClose: () => void;
}

export function BarcodeScanner({ onProductScanned, onClose }: BarcodeScannerProps) {
    const scannerRef = useRef<HTMLDivElement>(null);
    const html5QrCodeRef = useRef<unknown>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [scannedProduct, setScannedProduct] = useState<ProductNutrition | null>(null);

    // Initialize scanner
    useEffect(() => {
        let mounted = true;

        const initScanner = async () => {
            if (!scannerRef.current) return;

            try {
                // Dynamically import html5-qrcode (client-side only)
                const { Html5Qrcode } = await import("html5-qrcode");

                const scanner = new Html5Qrcode("barcode-reader");
                html5QrCodeRef.current = scanner;

                await scanner.start(
                    { facingMode: "environment" }, // Rear camera
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 150 },
                        aspectRatio: 1.5,
                    },
                    async (decodedText) => {
                        // On successful scan
                        if (!mounted) return;

                        // Stop scanning to prevent multiple reads
                        await scanner.stop();
                        setIsScanning(false);
                        setIsLoading(true);

                        // Fetch product info
                        const product = await getProductByBarcode(decodedText);
                        setIsLoading(false);

                        if (product.isSuccess) {
                            setScannedProduct(product);
                        } else {
                            setError(`Product not found: ${decodedText}`);
                            // Restart scanning after delay
                            setTimeout(() => {
                                if (mounted) {
                                    setError(null);
                                    startScanning();
                                }
                            }, 2000);
                        }
                    },
                    () => {
                        // QR code scanning error (ignore)
                    }
                );

                if (mounted) setIsScanning(true);
            } catch (err) {
                console.error("Scanner init error:", err);
                if (mounted) {
                    setError("Camera access denied or not available");
                }
            }
        };

        const startScanning = () => {
            initScanner();
        };

        startScanning();

        return () => {
            mounted = false;
            // Cleanup scanner
            if (html5QrCodeRef.current) {
                (html5QrCodeRef.current as { stop: () => Promise<void> }).stop().catch(() => { });
            }
        };
    }, []);

    const handleConfirmProduct = useCallback(() => {
        if (scannedProduct) {
            onProductScanned(scannedProduct);
        }
    }, [scannedProduct, onProductScanned]);

    const handleRescan = useCallback(async () => {
        setScannedProduct(null);
        setError(null);

        if (html5QrCodeRef.current) {
            try {
                const scanner = html5QrCodeRef.current as {
                    start: (
                        config: { facingMode: string },
                        settings: { fps: number; qrbox: { width: number; height: number } },
                        onSuccess: (text: string) => void,
                        onError: () => void
                    ) => Promise<void>;
                };

                await scanner.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 150 } },
                    async (decodedText) => {
                        const s = html5QrCodeRef.current as { stop: () => Promise<void> };
                        await s.stop();
                        setIsScanning(false);
                        setIsLoading(true);

                        const product = await getProductByBarcode(decodedText);
                        setIsLoading(false);

                        if (product.isSuccess) {
                            setScannedProduct(product);
                        } else {
                            setError(`Product not found: ${decodedText}`);
                        }
                    },
                    () => { }
                );
                setIsScanning(true);
            } catch (e) {
                console.error("Rescan error:", e);
            }
        }
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col"
        >
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Scan className="w-6 h-6 text-terracotta" />
                    <span className="font-medium">Scan Barcode</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Scanner Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-4">
                <AnimatePresence mode="wait">
                    {scannedProduct ? (
                        // Product Result
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-sm"
                        >
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                {/* Product Image */}
                                {scannedProduct.imageUrl && (
                                    <div className="w-24 h-24 mx-auto mb-4 rounded-xl overflow-hidden bg-white">
                                        <img
                                            src={scannedProduct.imageUrl}
                                            alt={scannedProduct.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                )}

                                {/* Product Name */}
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-medium mb-1">{scannedProduct.name}</h3>
                                    {scannedProduct.brand && (
                                        <p className="text-sm text-white/50">{scannedProduct.brand}</p>
                                    )}
                                    {scannedProduct.servingSize && (
                                        <p className="text-xs text-white/30 mt-1">
                                            Serving: {scannedProduct.servingSize}
                                        </p>
                                    )}
                                </div>

                                {/* Nutrition Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-terracotta/10 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-serif text-terracotta">{scannedProduct.calories}</p>
                                        <p className="text-[10px] uppercase tracking-wider text-white/40">Calories</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-serif">{scannedProduct.protein}g</p>
                                        <p className="text-[10px] uppercase tracking-wider text-white/40">Protein</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-serif">{scannedProduct.carbs}g</p>
                                        <p className="text-[10px] uppercase tracking-wider text-white/40">Carbs</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-serif">{scannedProduct.fats}g</p>
                                        <p className="text-[10px] uppercase tracking-wider text-white/40">Fats</p>
                                    </div>
                                </div>

                                {/* Allergens Warning */}
                                {scannedProduct.allergens && scannedProduct.allergens.length > 0 && (
                                    <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 mb-6">
                                        <div className="flex items-center gap-2 text-destructive text-sm">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>Contains: {scannedProduct.allergens.join(", ")}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleRescan}
                                        className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-sm"
                                    >
                                        Scan Again
                                    </button>
                                    <button
                                        onClick={handleConfirmProduct}
                                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-terracotta to-peach text-black font-medium text-sm"
                                    >
                                        Add to Meal
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        // Scanner View
                        <motion.div
                            key="scanner"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-sm"
                        >
                            {/* Scanner Container */}
                            <div
                                id="barcode-reader"
                                ref={scannerRef}
                                className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black"
                            />

                            {/* Loading Overlay */}
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                                    <div className="text-center">
                                        <Loader2 className="w-8 h-8 text-terracotta animate-spin mx-auto mb-2" />
                                        <p className="text-sm">Looking up product...</p>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-center"
                                >
                                    <AlertCircle className="w-6 h-6 text-destructive mx-auto mb-2" />
                                    <p className="text-sm text-destructive">{error}</p>
                                </motion.div>
                            )}

                            {/* Instructions */}
                            <div className="mt-6 text-center">
                                <Package className="w-8 h-8 text-white/20 mx-auto mb-3" />
                                <p className="text-white/40 text-sm">
                                    {isScanning ? "Point camera at product barcode" : "Initializing camera..."}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
