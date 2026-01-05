import type { MantraLine } from '../types/mantra';

/* 
  Formatting Guide:
  *bold* -> Bold White
  _italic_ -> Italic Serif (Cormorant Garamond)
  ^glow^ -> Glowing Text with drop-shadow
*/

export const MANTRA_CONTENT: MantraLine[] = [
  // PHASE 0 - ENTRY
  { id: 'p0-1', type: 'text', text: "Well done, you're up.", textClassName: "text-neutral-500" },
  { id: 'p0-2', type: 'text', text: "Most people never do.", className: "mb-4", textClassName: "text-neutral-300" },
  { id: 'p0-3', type: 'text', text: "*That* already puts you *ahead*.", className: "mb-8", textClassName: "text-neutral-200" },
  { id: 'p0-4', type: 'header', text: "Dope.." },
  { id: 'br-1', type: 'break', text: "" },

  // PHASE 1 - REALITY
  { id: 'p1-1', type: 'text', text: "It's dark. No one is watching.", className: "mb-6", textClassName: "text-sm tracking-[0.2em] uppercase text-neutral-600" },
  { id: 'p1-3', type: 'text', text: "This is where most people *quit*.", className: "mb-4", textClassName: "text-neutral-100" },
  { id: 'p1-4', type: 'text', text: "Life is not fair and it ain't soft.", className: "mb-2", textClassName: "text-neutral-400" },
  { id: 'p1-5', type: 'text', text: "*Comfort* is a _lie_ and a _trap_.", className: "mb-8" },
  { id: 'p1-6', type: 'quote', text: "No one is coming to save you.", meta: "Reality" },
  { id: 'br-2', type: 'break', text: "" },

  // PHASE 2 - PAIN
  { id: 'p2-1', type: 'text', text: "^Pain^ isn't the problem.", textClassName: "text-white" },
  { id: 'p2-1b', type: 'text', text: "remember it, tap into it.", className: "mb-6", textClassName: "text-neutral-500 italic" },
  { id: 'p2-2', type: 'text', text: "The pain is *fuel*. Use it.", className: "mb-8" },
  { id: 'p2-3', type: 'text', text: "Remember:", className: "mb-4", textClassName: "text-neutral-600 uppercase tracking-widest text-sm" },
  { id: 'p2-4', type: 'checklist', text: "You're not here to feel good." },
  { id: 'p2-5', type: 'checklist', text: "You're here to build something *undeniable*." },
  { id: 'p2-6', type: 'checklist', text: "You're here to get *freedom*." },
  { id: 'br-3', type: 'break', text: "" },

  // PHASE 3 - POWER
  { id: 'p3-0', type: 'header', text: "Power. Money. Freedom." },
  { id: 'p3-1', type: 'text', text: "One life. One chance.", className: "mb-6", textClassName: "italic text-neutral-400" },
  { id: 'p3-2', type: 'text', text: "Even if it gets dark, you ain't giving up.", textClassName: "text-neutral-200" },
  { id: 'br-4', type: 'break', text: "" },

  // PHASE 4 - DISCIPLINE
  { id: 'p4-1', type: 'text', text: "You don't need to feel *happy* today." },
  { id: 'p4-2', type: 'text', text: "You don't need *motivation*.", className: "mb-6", textClassName: "text-neutral-400" },
  { id: 'p4-3', type: 'header', text: "Discipline.", className: "mb-6" },
  { id: 'p4-4', type: 'text', text: "Work doesn't have to feel good.", textClassName: "text-neutral-500" },
  { id: 'p4-5', type: 'text', text: "It just has to be *done*.", textClassName: "text-white" },
  { id: 'br-5', type: 'break', text: "" },

  // PHASE 5 - PEACE
  { id: 'p5-1', type: 'text', text: "Feeling unhappy is okay.", textClassName: "italic text-neutral-400" },
  { id: 'p5-2', type: 'text', text: "Accepting that will give you *peace*.", className: "mb-8", textClassName: "text-neutral-200" },
  { id: 'p5-3', type: 'text', text: "*Peace* and *Satisfaction* come after the work." },
  { id: 'br-6', type: 'break', text: "" },

  // PHASE 6 - UNCERTAINTY
  { id: 'p6-1', type: 'text', text: "You don't have all the answers.", textClassName: "text-neutral-400" },
  { id: 'p6-2', type: 'text', text: "This year is *uncertain*.", className: "mb-6", textClassName: "text-white" },
  { id: 'p6-3', type: 'text', text: "You don't know where your path is going...", textClassName: "text-neutral-500 italic" },
  { id: 'p6-4', type: 'text', text: "*Good.* You'll never know.", className: "mt-6 mb-4" },
  { id: 'p6-5', type: 'text', text: "Trust yourself. Trust your *ability*.", textClassName: "text-neutral-300" },
  { id: 'br-7', type: 'break', text: "" },

  // PHASE 7 - GROWTH
  { id: 'p7-1', type: 'header', text: "Growth happens here." },
  { id: 'p7-2', type: 'text', text: "You figure it out by moving.", textClassName: "text-neutral-400" },
  { id: 'br-8', type: 'break', text: "" },

  // PHASE 8 - FAITH
  { id: 'p8-1', type: 'header', text: "Honor God first." },
  { id: 'p8-2', type: 'text', text: "Proverbs 3:9-10", className: "mt-4", textClassName: "text-sm tracking-[0.2em] uppercase text-neutral-600" },
  { id: 'br-9', type: 'break', text: "" },

  // PHASE 9 - READY
  { id: 'r-header', type: 'header', text: "You're Ready.", className: "mb-8" },
  { id: 'r-1', type: 'text', text: "1. Meditate for 5 min", textClassName: "text-neutral-300" },
  { id: 'r-2', type: 'text', text: "2. Do 25 pushups", textClassName: "text-neutral-300" },
  { id: 'r-3', type: 'text', text: "3. Visualize your goals", textClassName: "text-neutral-300" },
  { id: 'br-10', type: 'break', text: "" },

  // PHASE 10 - QUOTE
  { id: 'q-1', type: 'quote', text: "There is only one success - to be able to spend your life in your own way.", meta: "Christopher Morley" },
];
