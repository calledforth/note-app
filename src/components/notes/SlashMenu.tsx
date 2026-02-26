import React, { useEffect, useRef } from 'react';
import { Type, List, ListOrdered, Heading1, Heading2, Heading3, Minus } from 'lucide-react';
import clsx from 'clsx';

export type SlashMenuItemType =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bold'
  | 'italic'
  | 'bullet'
  | 'ordered'
  | 'horizontalRule'
  | 'divider';

interface SlashMenuItem {
  type: SlashMenuItemType;
  label: string;
  icon?: React.ReactNode;
}

export const SLASH_ITEMS: SlashMenuItem[] = [
  { type: 'heading1', label: 'Heading 1', icon: <Heading1 className="w-4 h-4" /> },
  { type: 'heading2', label: 'Heading 2', icon: <Heading2 className="w-4 h-4" /> },
  { type: 'heading3', label: 'Heading 3', icon: <Heading3 className="w-4 h-4" /> },
  { type: 'divider', label: '' },
  { type: 'bold', label: 'Bold', icon: <Type className="w-4 h-4 font-bold" /> },
  { type: 'italic', label: 'Italic', icon: <Type className="w-4 h-4 italic" /> },
  { type: 'divider', label: '' },
  { type: 'bullet', label: 'Bullet list', icon: <List className="w-4 h-4" /> },
  { type: 'ordered', label: 'Numbered list', icon: <ListOrdered className="w-4 h-4" /> },
  { type: 'horizontalRule', label: 'Divider', icon: <Minus className="w-4 h-4" /> },
];

export function filterSlashItems(items: SlashMenuItem[], query: string): SlashMenuItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) => item.type !== 'divider' && item.label.toLowerCase().includes(q)
  );
}

export function getFilteredTypes(items: SlashMenuItem[]): SlashMenuItemType[] {
  return items.filter((i) => i.type !== 'divider').map((i) => i.type);
}

interface SlashMenuProps {
  position: { top: number; left: number } | null;
  selectedIndex: number;
  onSelect: (type: SlashMenuItemType) => void;
  onClose: () => void;
  onHoverIndex?: (index: number) => void;
  fontFamily: string;
  searchQuery?: string;
}

export function SlashMenu({
  position,
  selectedIndex,
  onSelect,
  onClose,
  onHoverIndex,
  fontFamily,
  searchQuery = '',
}: SlashMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const filteredItems = filterSlashItems(SLASH_ITEMS, searchQuery);

  useEffect(() => {
    if (!menuRef.current || position === null) return;
    menuRef.current.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`)?.scrollIntoView({
      block: 'nearest',
      behavior: 'auto',
    });
  }, [selectedIndex, position]);

  if (position === null) return null;

  const selectableItems = filteredItems.filter((i) => i.type !== 'divider');
  const hasResults = selectableItems.length > 0;

  let flatIndex = 0;
  return (
    <div
      ref={menuRef}
      className="slash-menu fixed z-200 min-w-[230px] max-h-[260px] overflow-y-auto rounded-lg border shadow-lg py-1 animate-fade-in"
      style={{
        top: position.top,
        left: position.left,
        background: 'var(--note-bg)',
        borderColor: 'var(--note-border)',
        fontFamily,
      }}
    >
      {!hasResults ? (
        <div
          className="px-2.5 py-3 text-center text-sm"
          style={{ color: 'var(--note-text-muted)' }}
        >
          No results
        </div>
      ) : null}
      {filteredItems.map((item, idx) => {
        if (item.type === 'divider') {
          return (
            <div
              key={idx}
              className="my-0.5 h-px"
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
              'w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-sm transition-colors',
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
