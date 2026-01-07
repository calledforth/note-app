import type { MantraLine } from '../types/mantra';

/* 
  Formatting Guide:
  *bold* -> Bold White
  _italic_ -> Italic Serif (Cormorant Garamond)
  ^glow^ -> Glowing Text with drop-shadow
*/

export const MANTRA_CONTENT: MantraLine[] = [
  // SECTION 1 - WAKE UP
  { id: 's1-1', type: 'text', text: "Damn... ^well^ ^done^.", textClassName: "text-neutral-300" },
  { id: 's1-2', type: 'text', text: "You're *up*.", className: "mb-4", textClassName: "text-white" },
  { id: 's1-3', type: 'text', text: "Most people never get up", textClassName: "text-neutral-500" },
  { id: 's1-4', type: 'text', text: "and that already puts you *ahead*.", className: "mb-6", textClassName: "text-neutral-300" },
  { id: 's1-5', type: 'header', text: "Dope af." },
  { id: 's1-6', type: 'text', text: "Put on some music.", className: "mt-6", textClassName: "text-neutral-500 italic" },
  { id: 's1-7', type: 'text', text: "Let it _wake_ you up.", textClassName: "text-neutral-400" },
  { id: 'br-1', type: 'break', text: "" },

  // SECTION 2 - REALITY CHECK
  { id: 's2-1', type: 'text', text: "It's dark.", textClassName: "text-neutral-600" },
  { id: 's2-2', type: 'text', text: "No one's watching.", className: "mb-6", textClassName: "text-neutral-500" },
  { id: 's2-3', type: 'text', text: "This is where most people *quit*.", textClassName: "text-neutral-200" },
  { id: 's2-4', type: 'text', text: "This is where nobody takes the extra step.", className: "mb-6", textClassName: "text-neutral-400" },
  { id: 's2-5', type: 'text', text: "Life ain't fair, and it sure as hell ain't *soft*.", className: "mb-4", textClassName: "text-neutral-300" },
  { id: 's2-6', type: 'text', text: "^Comfort^ is a *lie*. ^Comfort^ is a *trap*.", className: "mb-6" },
  { id: 's2-7', type: 'quote', text: "No one is coming to save you.", meta: "Reality" },
  { id: 's2-8', type: 'text', text: "So *move*.", className: "mt-6", textClassName: "text-white" },
  { id: 'br-2', type: 'break', text: "" },

  // SECTION 3 - PAIN AS FUEL
  { id: 's3-1', type: 'text', text: "^Pain^ isn't the problem.", textClassName: "text-white" },
  { id: 's3-2', type: 'text', text: "Remember that. Tap into it.", className: "mb-6", textClassName: "text-neutral-500 italic" },
  { id: 's3-3', type: 'text', text: "Remember *why* you're working this hard.", textClassName: "text-neutral-300" },
  { id: 's3-4', type: 'text', text: "Remember what you went through.", className: "mb-6", textClassName: "text-neutral-400" },
  { id: 's3-5', type: 'text', text: "Right now it might feel like it wasn't that deep.", textClassName: "text-neutral-500" },
  { id: 's3-6', type: 'text', text: "Like you were *dramatic*. Like you _overreacted_.", className: "mb-4", textClassName: "text-neutral-500" },
  { id: 's3-7', type: 'header', text: "Nah." },
  { id: 's3-8', type: 'text', text: "You just forgot what it really felt like.", className: "mt-4 mb-6", textClassName: "text-neutral-400" },
  { id: 's3-9', type: 'text', text: "That pain is *fuel*. ^Use^ it.", textClassName: "text-white" },
  { id: 'br-3', type: 'break', text: "" },

  // SECTION 4 - PURPOSE
  { id: 's4-1', type: 'text', text: "You're not here to feel good.", textClassName: "text-neutral-400" },
  { id: 's4-2', type: 'text', text: "You're here to build something *undeniable*.", className: "mb-6", textClassName: "text-neutral-200" },
  { id: 's4-3', type: 'text', text: "You're not here to be average.", textClassName: "text-neutral-400" },
  { id: 's4-4', type: 'text', text: "You're here to build an *empire*.", className: "mb-6", textClassName: "text-neutral-200" },
  { id: 's4-5', type: 'text', text: "You want ^power^ and ^money^.", textClassName: "text-white" },
  { id: 's4-6', type: 'text', text: "You're here to earn *freedom*.", textClassName: "text-neutral-200" },
  { id: 'br-4', type: 'break', text: "" },

  // SECTION 5 - POWER MONEY FREEDOM
  { id: 's5-1', type: 'header', text: "Power. Money. Freedom." },
  { id: 's5-2', type: 'text', text: "One life. One shot.", className: "mt-6 mb-6", textClassName: "italic text-neutral-400" },
  { id: 's5-3', type: 'text', text: "Give it your *fucking* all.", textClassName: "text-white" },
  { id: 's5-4', type: 'text', text: "Don't stop.", className: "mb-6", textClassName: "text-neutral-300" },
  { id: 's5-5', type: 'text', text: "Feed that ^ego^", textClassName: "text-neutral-300" },
  { id: 's5-6', type: 'text', text: "the part of you that *refuses* to lose.", textClassName: "text-neutral-400" },
  { id: 'br-5', type: 'break', text: "" },

  // SECTION 6 - DISCIPLINE
  { id: 's6-1', type: 'text', text: "You don't need to feel *happy* today.", textClassName: "text-neutral-300" },
  { id: 's6-2', type: 'text', text: "You don't need *motivation*.", className: "mb-6", textClassName: "text-neutral-400" },
  { id: 's6-3', type: 'header', text: "You need discipline.", className: "mb-6" },
  { id: 's6-4', type: 'text', text: "Work doesn't have to feel good.", textClassName: "text-neutral-500" },
  { id: 's6-5', type: 'text', text: "It just has to get *done*.", className: "mb-6", textClassName: "text-white" },
  { id: 's6-6', type: 'text', text: "Feeling unhappy is okay. Feeling heavy is okay.", textClassName: "text-neutral-500 italic" },
  { id: 's6-7', type: 'text', text: "Accept it, and you'll get ^peace^.", className: "mb-6", textClassName: "text-neutral-300" },
  { id: 's6-8', type: 'text', text: "Peace comes *after* the work.", textClassName: "text-neutral-400" },
  { id: 's6-9', type: 'text', text: "Peace comes from knowing you did what you were supposed to do.", textClassName: "text-neutral-500" },
  { id: 's6-10', type: 'text', text: "*Satisfaction* comes after the work.", textClassName: "text-neutral-200" },
  { id: 'br-6', type: 'break', text: "" },

  // SECTION 7 - UNCERTAINTY
  { id: 's7-2', type: 'text', text: "Right now, you don't have all the answers.", className: "mt-6", textClassName: "text-neutral-400" },
  { id: 's7-3', type: 'text', text: "You've got doubts. You're second-guessing yourself—", textClassName: "text-neutral-500" },
  { id: 's7-4', type: 'text', text: "your choices, your path.", className: "mb-4", textClassName: "text-neutral-500" },
  { id: 's7-5', type: 'text', text: "You don't know where this leads.", textClassName: "text-neutral-500" },
  { id: 's7-6', type: 'text', text: "You don't know if what you're doing right now is _\"right.\"_", className: "mb-4", textClassName: "text-neutral-400" },
  { id: 's7-7', type: 'text', text: "This year especially? ^Uncertainty^.", className: "mb-6", textClassName: "text-neutral-200" },
  { id: 's7-8', type: 'quote', text: "Uncertainty is the very condition to impel man to unfold his powers.", meta: "Erich Fromm" },
  { id: 'br-7', type: 'break', text: "" },

  // SECTION 8 - TRUST & FAITH
  { id: 's8-1', type: 'text', text: "Trust yourself though.", textClassName: "text-neutral-300" },
  { id: 's8-2', type: 'text', text: "Trust that *God* is guiding you.", className: "mb-4", textClassName: "text-neutral-200" },
  { id: 's8-3', type: 'text', text: "And trust your *ability* to do what's best for you.", className: "mb-6", textClassName: "text-neutral-300" },
  { id: 's8-4', type: 'text', text: "That's where ^growth^ happens.", className: "mb-4", textClassName: "text-white" },
  { id: 's8-5', type: 'text', text: "You move anyway.", textClassName: "text-neutral-400" },
  { id: 's8-6', type: 'text', text: "You figure it out by *moving*.", textClassName: "text-neutral-300" },
  { id: 'br-8', type: 'break', text: "" },

  // SECTION 9 - PROVERBS
  { id: 's9-1', type: 'text', text: "Proverbs 3:9–10", textClassName: "text-sm tracking-[0.2em] uppercase text-neutral-600" },
  { id: 's9-2', type: 'quote', text: "Honor the LORD with your wealth and with the firstfruits of all your produce; then your barns will be filled with plenty, and your vats will be bursting with wine.", meta: "Proverbs 3:9–10" },
  { id: 's9-3', type: 'text', text: "Never forget this again...", className: "mt-6", textClassName: "text-neutral-400 italic" },
  { id: 'br-9', type: 'break', text: "" },

  // SECTION 10 - YOU'RE READY
  { id: 's10-1', type: 'header', text: "You're Ready.", className: "mb-8" },
  { id: 's10-2', type: 'checklist', text: "meditate for 5 mins, get bored, calm your mind" },
  { id: 's10-3', type: 'checklist', text: "do 25 pushups" },
  { id: 's10-4', type: 'checklist', text: "think about your goals for today" },
  { id: 'br-10', type: 'break', text: "" },

  // SECTION 11 - CLOSING QUOTE
  { id: 's11-1', type: 'quote', text: "There is only one success — to be able to spend your life in your own way.", meta: "Christopher Morley" },
];
