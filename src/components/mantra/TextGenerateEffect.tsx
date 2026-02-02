import React, { useEffect, useMemo } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import clsx from "clsx";
import type { MantraLine } from "../../types/mantra";

interface TextGenerateEffectProps {
    content: MantraLine[];
    className?: string;
    filter?: boolean;
    duration?: number;
    onComplete?: () => void;
}

// MINIMAL style configuration - compact sizes
const styles = {
    container: "font-sans text-left font-light",
    baseText: "text-(--text-secondary) font-light text-lg sm:text-xl leading-relaxed",
    bold: "text-(--text-primary) font-normal",
    italic: "text-(--text-secondary) font-light italic font-serif",
    glow: "text-(--text-primary) drop-shadow-[0_0_8px_var(--text-primary)]",
    header: "text-2xl font-light tracking-[0.15em] uppercase text-(--text-primary)",
    quoteText: "text-xl sm:text-2xl font-light text-(--text-primary) leading-relaxed italic font-serif",
    quoteMeta: "text-(--text-secondary) text-sm mt-6 tracking-wide",
    checklistMarker: "w-1 h-1 bg-(--text-primary) rounded-full",
};

export const TextGenerateEffect: React.FC<TextGenerateEffectProps> = ({
    content,
    className,
    filter = true,
    duration = 0.5,
    onComplete,
}) => {
    const [scope, animate] = useAnimate();

    const lines = useMemo(() => {
        if (!content || !Array.isArray(content)) return [];
        return content;
    }, [content]);

    useEffect(() => {
        if (scope.current && lines.length > 0) {
            const animation = animate(
                "span.word-span",
                {
                    opacity: 1,
                    filter: filter ? "blur(0px)" : "none",
                },
                {
                    duration: duration,
                    delay: stagger(0.06),
                }
            );

            animation.then(() => {
                if (onComplete) onComplete();
            });
        }
    }, [scope, lines, filter, duration, animate, onComplete]);

    let checklistCount = 0;

    // Render a single word with formatting
    const renderFormattedWord = (word: string, idx: string | number) => {
        const regex = /^([*_^])(.+?)\1([.,!?;:]*)$/;
        const match = word.match(regex);

        let cleanWord = word;
        let punct = "";
        let styleClasses = styles.baseText;

        if (match) {
            const marker = match[1];
            cleanWord = match[2];
            punct = match[3];

            if (marker === "*") styleClasses = `${styles.baseText} ${styles.bold}`;
            if (marker === "_") styleClasses = `${styles.baseText} ${styles.italic}`;
            if (marker === "^") styleClasses = `${styles.baseText} ${styles.glow}`;
        }

        return (
            <motion.span
                key={idx}
                className="opacity-0 inline-block mr-1.5 sm:mr-2 word-span whitespace-nowrap"
                style={{ filter: filter ? "blur(10px)" : "none" }}
            >
                <span className={styleClasses}>{cleanWord}</span>
                {punct && <span className={styles.baseText}>{punct}</span>}
            </motion.span>
        );
    };

    const renderContent = () => {
        if (!lines || !Array.isArray(lines)) return null;

        return (
            <motion.div
                ref={scope}
                className={clsx("flex flex-col gap-1", styles.container)}
            >
                {lines.map((line) => {
                    // Break - spacer between phases (shouldn't render in single phase)
                    if (line.type === "break") {
                        return <div key={line.id} className="h-8" />;
                    }

                    // Quote
                    if (line.type === "quote") {
                        return (
                            <div
                                key={line.id}
                                className={clsx(
                                    "flex flex-col items-start",
                                    line.className
                                )}
                            >
                                <div className={clsx("block", styles.quoteText)}>
                                    {line.text.split(" ").map((word, wordIdx) =>
                                        renderFormattedWord(word, `${line.id}-${wordIdx}`)
                                    )}
                                </div>
                                {line.meta && (
                                    <motion.span
                                        className={clsx("opacity-0 word-span block", styles.quoteMeta)}
                                        style={{ filter: filter ? "blur(10px)" : "none" }}
                                    >
                                        — {line.meta}
                                    </motion.span>
                                )}
                            </div>
                        );
                    }

                    // Checklist
                    if (line.type === "checklist") {
                        checklistCount++;
                        return (
                            <div
                                key={line.id}
                                className={clsx("flex items-baseline gap-4 my-4", line.className)}
                            >
                                {/* Minimal style: small white dot */}
                                <motion.div
                                    className={clsx(
                                        "opacity-0 word-span mt-3.5 shrink-0",
                                        styles.checklistMarker
                                    )}
                                    style={{ filter: filter ? "blur(10px)" : "none" }}
                                />
                                <div className={clsx("block leading-relaxed", styles.container)}>
                                    {line.text.split(" ").map((word, wordIdx) =>
                                        renderFormattedWord(word, `${line.id}-${wordIdx}`)
                                    )}
                                </div>
                            </div>
                        );
                    }

                    // Header
                    if (line.type === "header") {
                        return (
                            <div key={line.id} className={clsx("block mb-8 mt-8", line.className)}>
                                <div className={clsx("leading-none", styles.header)}>
                                    {line.text.split(" ").map((word, wordIdx) => {
                                        const clean = word.replace(/[*_^]/g, "");
                                        return (
                                            <motion.span
                                                key={`${line.id}-${wordIdx}`}
                                                className="opacity-0 inline-block mr-3 word-span"
                                                style={{ filter: filter ? "blur(10px)" : "none" }}
                                            >
                                                {clean}
                                            </motion.span>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    }

                    // Default text
                    return (
                        <div key={line.id} className={clsx("block", line.className)}>
                            <div className={clsx(styles.baseText, line.textClassName)}>
                                {line.text.split(" ").map((word, wordIdx) =>
                                    renderFormattedWord(word, `${line.id}-${wordIdx}`)
                                )}
                            </div>
                        </div>
                    );
                })}
            </motion.div>
        );
    };

    return (
        <div className={clsx("w-full transition-all duration-700", className)}>
            {renderContent()}
        </div>
    );
};

export default TextGenerateEffect;
