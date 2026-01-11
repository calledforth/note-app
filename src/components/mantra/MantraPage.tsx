import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { MANTRA_CONTENT } from "../../constants/mantraContent";
import type { MantraLine } from "../../types/mantra";
import { TextGenerateEffect } from "./TextGenerateEffect";
import { useMantraStore } from "../../stores/mantraStore";

// Helper to group content into phases (split by 'break' type)
const getPhases = (): MantraLine[][] => {
    const phases: MantraLine[][] = [];
    let currentPhase: MantraLine[] = [];

    MANTRA_CONTENT.forEach((line) => {
        if (line.type === "break" && currentPhase.length > 0) {
            phases.push(currentPhase);
            currentPhase = [];
        } else if (line.type !== "break") {
            currentPhase.push(line);
        }
    });

    if (currentPhase.length > 0) {
        phases.push(currentPhase);
    }

    return phases;
};

interface MantraPageProps {
    // If true, this was opened via command palette and can be exited
    canExit?: boolean;
    onComplete: () => void;
    onExit?: () => void;
}

export const MantraPage: React.FC<MantraPageProps> = ({
    canExit = false,
    onComplete,
    onExit,
}) => {
    const [activePhaseIndex, setActivePhaseIndex] = useState(0);
    const [phases, setPhases] = useState<MantraLine[][]>([]);

    const completeMantra = useMantraStore((state) => state.completeMantra);

    // Initialize phases
    useEffect(() => {
        setPhases(getPhases());
    }, []);

    const isLastPhase = activePhaseIndex >= phases.length - 1;

    // Handle next phase
    const handleNext = useCallback(() => {
        if (activePhaseIndex < phases.length - 1) {
            setActivePhaseIndex((prev) => prev + 1);
        } else {
            // Last phase completed - mark as done and exit
            if (!canExit) {
                completeMantra();
            }
            onComplete();
        }
    }, [activePhaseIndex, phases.length, canExit, completeMantra, onComplete]);

    // Handle previous phase
    const handlePrev = useCallback(() => {
        if (activePhaseIndex > 0) {
            setActivePhaseIndex((prev) => prev - 1);
        }
    }, [activePhaseIndex]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleNext();
            }
            if (e.key === "Backspace" || e.key === "ArrowLeft") {
                e.preventDefault();
                handlePrev();
            }
            if (e.key === "Escape" && canExit) {
                e.preventDefault();
                onExit?.();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleNext, handlePrev, canExit, onExit]);

    if (phases.length === 0) {
        return null;
    }

    return (
        <motion.div
            className="fixed inset-0 z-[9999] bg-[var(--app-bg)] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Exit button (only when accessed via command palette) */}
            {canExit && (
                <motion.button
                    className="absolute top-4 right-4 z-10 p-1.5 text-neutral-400 hover:text-white transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        onExit?.();
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                >
                    <X size={16} strokeWidth={1.5} />
                </motion.button>
            )}

            {/* Main content area - click to advance */}
            <div
                className="h-full w-full flex items-center justify-center cursor-pointer px-8 sm:px-12"
                onClick={handleNext}
            >
                <div className="max-w-2xl w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activePhaseIndex}
                            initial={{ opacity: 0, filter: "blur(10px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            exit={{
                                opacity: 0,
                                filter: "blur(10px)",
                                transition: { duration: 0.6, ease: "easeInOut" },
                            }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <TextGenerateEffect
                                content={phases[activePhaseIndex]}
                                duration={0.5}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Subtle hint at bottom */}
            <motion.div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/15 text-[10px] tracking-widest uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
            >
                {isLastPhase ? "click to finish" : "click to continue"}
            </motion.div>
        </motion.div>
    );
};

export default MantraPage;
