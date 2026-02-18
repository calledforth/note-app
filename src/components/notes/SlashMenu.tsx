import React, { useEffect, useRef } from 'react';
import { Type, List, ListOrdered, Heading1, Heading2, Heading3 } from 'lucide-react';
import clsx from 'clsx';

export type SlashMenuItemType =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bold'
  | 'italic'
  | 'bullet'
  | 'ordered'
  | 'divider';

interface SlashMenuItem {
  type: SlashMenuItemType;
  label: string;
  icon?: React.ReactNode;
}

const SLASH_ITEMS: SlashMenuItem[] = [
  { type: 'heading1', label: 'Heading 1', icon: <Heading1 className="w-4 h-4" /> },
  { type: 'heading2', label: 'Heading 2', icon: <Heading2 className="w-4 h-4" /> },
  { type: 'heading3', label: 'Heading 3', icon: <Heading3 className="w-4 h-4" /> },
  { type: 'divider', label: '' },
  { type: 'bold', label: 'Bold', icon: <Type className="w-4 h-4 font-bold" /> },
  { type: 'italic', label: 'Italic', icon: <Type className="w-4 h-4 italic" /> },
  { type: 'divider', label: '' },
  { type: 'bullet', label: 'Bullet list', icon: <List className="w-4 h-4" /> },
  { type: 'ordered', label: 'Numbered list', icon: <ListOrdered className="w-4 h-4" /> },
];

interface SlashMenuProps {
  position: { top: number; left: number } | null;
  selectedIndex: number;
  onSelect: (type: SlashMenuItemType) => void;
  onClose: () => void;
  onHoverIndex?: (index: number) => void;
  fontFamily: string;
}

export function SlashMenu({
  position,
  selectedIndex,
  onSelect,
  onClose,
  onHoverIndex,
  fontFamily,
}: SlashMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuRef.current || position === null) return;
    menuRef.current.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`)?.scrollIntoView({
      block: 'nearest',
      behavior: 'auto',
    });
  }, [selectedIndex, position]);

  if (position === null) return null;

  let flatIndex = 0;
  return (
    <div
      ref={menuRef}
      className="slash-menu fixed z-200 min-w-[200px] max-h-[280px] overflow-y-auto rounded-lg border shadow-lg py-1.5 animate-fade-in"
      style={{
        top: position.top,
        left: position.left,
        background: 'var(--note-bg)',
        borderColor: 'var(--note-border)',
        fontFamily,
      }}
    >
      {SLASH_ITEMS.map((item, idx) => {
        if (item.type === 'divider') {
          return (
            <div
              key={idx}
              className="my-1 h-px"
              style={{ background: 'var(--note-border)' }}
              role="separator"
            />
          );
        }
        const currentIndex = flatIndex++;
        const isSelected = currentIndex === selectedIndex;
        return (
          <button
            key={item.type}
            data-index={currentIndex}
            type="button"
            className={clsx(
              'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
              isSelected ? 'bg-(--note-control-bg-hover)' : 'hover:bg-(--note-control-bg-hover)'
            )}
            style={{ color: 'var(--note-text)' }}
            onClick={() => onSelect(item.type)}
            onMouseEnter={() => onHoverIndex?.(currentIndex)}
          >
            <span className="text-(--note-text-muted) shrink-0" style={{ color: 'var(--note-text-muted)' }}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
