// Mantra line types for structured content
export interface MantraLine {
    id: string;
    type: 'text' | 'header' | 'quote' | 'checklist' | 'break';
    text: string;
    meta?: string; // Author for quotes
    className?: string; // Additional container classes
    textClassName?: string; // Additional text classes
}

// Formatting markers used in text:
// *word* -> Bold (white, font-normal)
// _word_ -> Italic (muted, serif)
// ^word^ -> Glow (white with drop-shadow)
