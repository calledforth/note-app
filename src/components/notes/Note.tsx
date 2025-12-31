import { useEffect, useMemo, useRef, useState } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { useNotesStore } from '../../stores/notesStore';
import type { Note as NoteType } from '../../types';

interface NoteProps {
  note: NoteType;
  mode: 'freeform' | 'grid';
  style?: React.CSSProperties;
}

export function Note({ note, style }: NoteProps) {
  const theme = useNotesStore((state) => state.theme);
  const updateNote = useNotesStore((state) => state.updateNote);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(note.title || 'untitled');
  const menuRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const noteStyle = useMemo(() => {
    return {
      fontFamily: theme.fontFamily,
      ...style,
    };
  }, [theme.fontFamily, style]);

  const handleContentChange = (content: string) => {
    updateNote(note.id, { content });
  };

  const getPlainTextFromHtml = (html: string) => {
    const el = document.createElement('div');
    el.innerHTML = html || '';
    return (el.textContent || el.innerText || '').trim();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fallback for environments where clipboard API is not available
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag when clicking delete
    if (confirm('Delete this note?')) {
      deleteNote(note.id);
    }
  };

  const commitTitle = () => {
    const next = draftTitle.trim() || 'untitled';
    setDraftTitle(next);
    updateNote(note.id, { title: next });
    setIsEditingTitle(false);
  };

  useEffect(() => {
    setDraftTitle(note.title || 'untitled');
  }, [note.title]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!menuOpen) return;
      const target = e.target as Node | null;
      if (target && menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [menuOpen]);

  return (
    <div
      className="group overflow-hidden flex flex-col w-full h-full bg-black border border-white/10 rounded-2xl shadow-[0_18px_50px_rgba(0,0,0,0.65)]"
      style={noteStyle}
    >
      <div className="note-header flex items-center justify-between px-4 pt-4 pb-3 select-none">
        <div className="min-w-0 flex-1 pr-2">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') {
                  setDraftTitle(note.title || 'untitled');
                  setIsEditingTitle(false);
                }
              }}
              onBlur={commitTitle}
              className="w-full bg-transparent border-none outline-none text-white text-xl font-semibold tracking-tight"
              aria-label="Note title"
            />
          ) : (
            <div
              className="text-white text-xl font-semibold tracking-tight truncate cursor-text"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              title={note.title || 'untitled'}
            >
              {note.title || 'untitled'}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0" style={{ pointerEvents: 'auto' }}>
          <button
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/85 flex items-center justify-center"
            onClick={async (e) => {
              e.stopPropagation();
              const text = getPlainTextFromHtml(note.content || '');
              await copyToClipboard(text || (note.title || 'untitled'));
            }}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Copy note"
            title="Copy"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                d="M8 8h10v12H8V8Zm-2 8H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/85 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="More actions"
              title="More"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  d="M6 12h.01M12 12h.01M18 12h.01"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[42px] w-44 bg-black border border-white/10 rounded-xl shadow-[0_18px_50px_rgba(0,0,0,0.7)] overflow-hidden z-50">
                <button
                  className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const text = getPlainTextFromHtml(note.content || '');
                    await copyToClipboard(text || (note.title || 'untitled'));
                    setMenuOpen(false);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  Copy content
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                  onClick={(e) => {
                    setMenuOpen(false);
                    handleDelete(e);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  Delete note
                </button>
              </div>
            )}
          </div>

          <button
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/85 flex items-center justify-center"
            onClick={handleDelete}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Close note"
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 12 12">
              <path
                d="M1 1l10 10M11 1L1 11"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="h-px bg-white/10 mx-4" />

      <div className="note-body flex-1 overflow-auto flex flex-col min-h-0 px-4 pt-4 pb-4">
        <RichTextEditor
          noteId={note.id}
          content={note.content || ''}
          onContentChange={handleContentChange}
        />
      </div>
    </div>
  );
}

