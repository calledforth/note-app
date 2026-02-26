import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import { useBentoStore } from '../../stores/bentoStore';
import { useThemeStore, EDITOR_FONTS } from '../../stores/themeStore';
import { SlashMenu, type SlashMenuItemType, SLASH_ITEMS, filterSlashItems, getFilteredTypes } from './SlashMenu';

// ============================================================================
// CUSTOM LINK PREVIEW BLOT
// Renders URLs as: [favicon] domain.com (clickable)
// ============================================================================

const Embed = Quill.import('blots/embed');
const BlockEmbed = Quill.import('blots/block/embed');

class LinkPreviewBlot extends (Embed as any) {
  static blotName = 'linkPreview';
  static tagName = 'a';
  static className = 'ql-link-preview';

  static create(rawValue: string) {
    const node = super.create() as HTMLAnchorElement;

    const value = String(rawValue || '').trim();
    let url: URL | null = null;

    try {
      // Accept both full URLs and domain-like pastes (we normalize in paste handler too)
      url = new URL(value);
    } catch {
      try {
        url = new URL(`https://${value}`);
      } catch {
        url = null;
      }
    }

    const href = url?.toString() ?? value;
    const hostname = url?.hostname ?? value;
    const domain = hostname.replace(/^www\./, '');
    const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      hostname
    )}&sz=16`;

    node.setAttribute('href', href);
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
    node.setAttribute('data-url', href);
    node.setAttribute('contenteditable', 'false');

    // Build children (favicon + domain)
    const faviconImg = document.createElement('img');
    faviconImg.src = favicon;
    faviconImg.className = 'ql-link-preview-favicon';
    faviconImg.setAttribute('alt', '');
    faviconImg.setAttribute('draggable', 'false');

    const domainSpan = document.createElement('span');
    domainSpan.className = 'ql-link-preview-domain';
    domainSpan.textContent = domain || href;

    node.appendChild(faviconImg);
    node.appendChild(domainSpan);

    return node;
  }

  static value(node: HTMLAnchorElement) {
    return node.getAttribute('data-url') || node.getAttribute('href') || '';
  }
}

// Register once (important with HMR / multiple editors)
const quillImports = (Quill as any).imports as Record<string, unknown> | undefined;
const alreadyRegistered =
  !!quillImports?.[`formats/${LinkPreviewBlot.blotName}`] ||
  !!quillImports?.[`blots/${LinkPreviewBlot.blotName}`];
if (!alreadyRegistered) {
  Quill.register(LinkPreviewBlot, true);
}

// Divider (horizontal rule) blot - block-level separator
class DividerBlot extends (BlockEmbed as any) {
  static blotName = 'divider';
  static tagName = 'hr';
  static className = 'ql-divider';
  static create() {
    const node = super.create() as HTMLElement;
    node.setAttribute('style', 'margin: 0.75em 0; border: none; border-top: 1px solid var(--note-border, #e5e7eb);');
    return node;
  }
}

const dividerAlreadyRegistered =
  !!quillImports?.[`formats/${DividerBlot.blotName}`] ||
  !!quillImports?.[`blots/${DividerBlot.blotName}`];
if (!dividerAlreadyRegistered) {
  Quill.register({ 'formats/divider': DividerBlot }, true);
}

// ============================================================================
// URL DETECTION HELPER
// ============================================================================

const looksLikeDomain = (text: string): boolean => {
  const t = text.trim();
  // Very small heuristic: has at least one dot, no spaces, and no leading punctuation
  return /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}([/:?#][^\s]*)?$/i.test(t);
};

const normalizeUrl = (text: string): string | null => {
  const t = text.trim();
  if (!t) return null;
  try {
    return new URL(t).toString();
  } catch {
    // If user pasted a domain without scheme, treat as https://
    if (!looksLikeDomain(t)) return null;
    try {
      return new URL(`https://${t}`).toString();
    } catch {
      return null;
    }
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

interface RichTextEditorProps {
  noteId: string;
}

export function RichTextEditor({ noteId }: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [slashMenuSelectedIndex, setSlashMenuSelectedIndex] = useState(0);
  const [slashSearchQuery, setSlashSearchQuery] = useState('');

  const currentEditorFont = useThemeStore((state) => state.currentEditorFont);
  const currentFontFamily = useMemo(() => {
    const font = EDITOR_FONTS.find((f) => f.key === currentEditorFont);
    return font?.fontFamily ?? "'Geist', system-ui, sans-serif";
  }, [currentEditorFont]);

  // Optimized selector: only subscribes to this specific note's content
  // This prevents re-renders when other notes change
  const content = useBentoStore((state) =>
    state.notes.find(n => n.id === noteId)?.content ?? ''
  );
  const updateNoteContent = useBentoStore((state) => state.updateNoteContent);

  // No local buffer needed - Zustand updates are synchronous (optimistic)
  // so the content from the selector is always current

  // Slash menu: let "/" insert, then open menu. Search text is typed in editor and read from there.
  useEffect(() => {
    let teardown: (() => void) | null = null;
    let retryId: ReturnType<typeof setInterval> | null = null;
    const tryAttach = () => {
      const quill = quillRef.current?.getEditor();
      if (!quill) return false;
      const root = quill.root as HTMLElement;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== '/') return;
        const range = quill.getSelection();
        if (!range) return;
        const prefix = quill.getText(0, range.index);
        if (prefix.length > 0 && !/[\s\n]$/.test(prefix)) return;
        // Let "/" insert; open menu after insert. User will see and type search text in editor.
        const slashStartIndex = range.index;
        setTimeout(() => {
          const bounds = quill.getBounds(slashStartIndex + 1);
          if (!bounds) return;
          const rootRect = root.getBoundingClientRect();
          slashMenuRangeRef.current = { index: slashStartIndex, length: 0 };
          slashStartIndexRef.current = slashStartIndex;
          setSlashMenuPosition({
            top: rootRect.top + bounds.bottom + 4,
            left: rootRect.left + bounds.left,
          });
          setSlashMenuOpen(true);
          setSlashMenuSelectedIndex(0);
        }, 0);
      };
      root.addEventListener('keydown', handleKeyDown, true);
      teardown = () => root.removeEventListener('keydown', handleKeyDown, true);
      return true;
    };
    const timeoutId = setTimeout(() => {
      if (!tryAttach()) {
        retryId = setInterval(() => {
          if (tryAttach() && retryId) {
            clearInterval(retryId);
            retryId = null;
          }
        }, 50);
      }
    }, 50);
    return () => {
      clearTimeout(timeoutId);
      if (retryId) clearInterval(retryId);
      teardown?.();
    };
  }, []);

  // Sync search query from editor as user types (when slash menu is open)
  useEffect(() => {
    if (!slashMenuOpen) return;
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const syncSearch = () => {
      const start = slashStartIndexRef.current;
      if (start == null) return;
      const sel = quill.getSelection();
      if (!sel || sel.index <= start) {
        setSlashSearchQuery('');
        // Keep slashCursorRef when sel is null (e.g. focus moved to menu) for delete on apply
        if (sel) slashCursorRef.current = null;
        return;
      }
      const full = quill.getText(start, sel.index - start);
      const query = full.startsWith('/') ? full.slice(1) : full;
      setSlashSearchQuery(query);
      slashCursorRef.current = sel.index;
    };
    quill.on('text-change', syncSearch);
    quill.on('selection-change', syncSearch);
    syncSearch();
    return () => {
      quill.off('text-change', syncSearch);
      quill.off('selection-change', syncSearch);
    };
  }, [slashMenuOpen]);

  // Handle paste to detect URLs and convert to link previews
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain')?.trim();

      const normalized = text ? normalizeUrl(text) : null;
      if (normalized) {
        e.preventDefault();
        e.stopPropagation();
        
        const range = quill.getSelection(true);
        if (range) {
          // Insert the link preview blot
          quill.insertEmbed(range.index, LinkPreviewBlot.blotName, normalized, 'user');
          // Move cursor after the embed
          quill.setSelection(range.index + 1, 0, 'silent');
        }
      }
    };

    const editorRoot = quill.root;
    editorRoot.addEventListener('paste', handlePaste, true);

    return () => {
      editorRoot.removeEventListener('paste', handlePaste, true);
    };
  }, []);

  // Configure Quill without toolbar - users type directly
  const modules = useMemo(
    () => ({
      toolbar: false, // No toolbar - clean, minimal interface
      keyboard: {
        bindings: {
          // Ctrl+B for bold
          bold: {
            key: 'b',
            ctrlKey: true,
            handler: () => {
              const quill = quillRef.current?.getEditor();
              if (quill) {
                const range = quill.getSelection();
                if (range) {
                  quill.format('bold', !quill.getFormat(range).bold);
                }
              }
            },
          },
          // Ctrl+I for italic
          italic: {
            key: 'i',
            ctrlKey: true,
            handler: () => {
              const quill = quillRef.current?.getEditor();
              if (quill) {
                const range = quill.getSelection();
                if (range) {
                  quill.format('italic', !quill.getFormat(range).italic);
                }
              }
            },
          },
          // Ctrl+U for underline
          underline: {
            key: 'u',
            ctrlKey: true,
            handler: () => {
              const quill = quillRef.current?.getEditor();
              if (quill) {
                const range = quill.getSelection();
                if (range) {
                  quill.format('underline', !quill.getFormat(range).underline);
                }
              }
            },
          },
          // Ctrl+1 for H1
          header1: {
            key: '1',
            ctrlKey: true,
            handler: () => {
              const quill = quillRef.current?.getEditor();
              if (quill) {
                const range = quill.getSelection();
                if (range) {
                  const format = quill.getFormat(range);
                  quill.format('header', format.header === 1 ? false : 1);
                }
              }
            },
          },
          // Ctrl+2 for H2
          header2: {
            key: '2',
            ctrlKey: true,
            handler: () => {
              const quill = quillRef.current?.getEditor();
              if (quill) {
                const range = quill.getSelection();
                if (range) {
                  const format = quill.getFormat(range);
                  quill.format('header', format.header === 2 ? false : 2);
                }
              }
            },
          },
          // Ctrl+3 for H3
          header3: {
            key: '3',
            ctrlKey: true,
            handler: () => {
              const quill = quillRef.current?.getEditor();
              if (quill) {
                const range = quill.getSelection();
                if (range) {
                  const format = quill.getFormat(range);
                  quill.format('header', format.header === 3 ? false : 3);
                }
              }
            },
          },
        },
      },
    }),
    []
  );

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'link',
    LinkPreviewBlot.blotName,
    DividerBlot.blotName,
  ];

  const handleChange = (value: string) => {
    // Update Zustand directly - it's synchronous (optimistic update)
    // The selector will return the new value immediately on re-render
    updateNoteContent(noteId, value);
  };

  const slashMenuRangeRef = useRef<{ index: number; length: number } | null>(null);
  const slashStartIndexRef = useRef<number | null>(null);
  const slashCursorRef = useRef<number | null>(null);

  const deleteSlashAndSearch = useCallback(() => {
    const quill = quillRef.current?.getEditor();
    const start = slashStartIndexRef.current;
    const end = slashCursorRef.current ?? quill?.getSelection()?.index ?? start;
    if (!quill || start == null || end <= start) return;
    quill.deleteText(start, end - start, 'user');
    quill.setSelection(start, 0, 'silent');
    slashStartIndexRef.current = null;
    slashCursorRef.current = null;
  }, []);

  const applySlashCommand = useCallback(
    (type: SlashMenuItemType) => {
      const quill = quillRef.current?.getEditor();
      const range = slashMenuRangeRef.current;
      if (!quill || !range) return;

      quill.focus();
      deleteSlashAndSearch();
      quill.setSelection(range.index, 0);

      switch (type) {
        case 'heading1':
          quill.format('header', 1);
          break;
        case 'heading2':
          quill.format('header', 2);
          break;
        case 'heading3':
          quill.format('header', 3);
          break;
        case 'bold':
          quill.format('bold', !quill.getFormat(range).bold);
          break;
        case 'italic':
          quill.format('italic', !quill.getFormat(range).italic);
          break;
        case 'bullet':
          quill.format('list', 'bullet');
          break;
        case 'ordered':
          quill.format('list', 'ordered');
          break;
        case 'horizontalRule': {
          const pos = range.index;
          quill.insertEmbed(pos, 'divider', true, 'user');
          quill.setSelection(pos + 1, 0, 'silent');
          break;
        }
        default:
          break;
      }

      setSlashMenuOpen(false);
      setSlashMenuPosition(null);
      slashMenuRangeRef.current = null;
      slashStartIndexRef.current = null;
      slashCursorRef.current = null;
    },
    [deleteSlashAndSearch]
  );

  const closeSlashMenu = useCallback(() => {
    deleteSlashAndSearch();
    setSlashMenuOpen(false);
    setSlashMenuPosition(null);
    setSlashSearchQuery('');
    slashMenuRangeRef.current = null;
    slashStartIndexRef.current = null;
    slashCursorRef.current = null;
  }, [deleteSlashAndSearch]);

  const filteredSlashItems = useMemo(
    () => filterSlashItems(SLASH_ITEMS, slashSearchQuery),
    [slashSearchQuery]
  );
  const filteredTypes = useMemo(() => getFilteredTypes(filteredSlashItems), [filteredSlashItems]);

  useEffect(() => {
    if (slashMenuOpen && slashMenuSelectedIndex >= filteredTypes.length) {
      setSlashMenuSelectedIndex(Math.max(0, filteredTypes.length - 1));
    }
  }, [slashMenuOpen, slashMenuSelectedIndex, filteredTypes.length]);

  useEffect(() => {
    if (!slashMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSlashMenu();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashMenuSelectedIndex((i) => Math.min(i + 1, Math.max(0, filteredTypes.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashMenuSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const type = filteredTypes[slashMenuSelectedIndex];
        if (type) applySlashCommand(type);
      }
      // Printable keys and Backspace: let them through so user sees what they type in editor
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slashMenuOpen, slashMenuSelectedIndex, filteredTypes, applySlashCommand, closeSlashMenu]);

  return (
    <>
      <div className="w-full h-full flex flex-col min-h-0 [&_.ql-container]:border-none [&_.ql-container]:bg-transparent [&_.ql-editor]:text-(--note-text) [&_.ql-editor]:p-0 [&_.ql-editor.ql-blank::before]:text-(--note-text-muted) [&_.ql-editor.ql-blank::before]:not-italic [&_.ql-toolbar]:hidden [&_.ql-link-preview]:inline-flex [&_.ql-link-preview]:items-baseline [&_.ql-link-preview]:gap-1.5 [&_.ql-link-preview]:text-(--note-link) [&_.ql-link-preview]:no-underline [&_.ql-link-preview]:transition-colors [&_.ql-link-preview:hover]:text-(--note-link-hover) [&_.ql-link-preview-favicon]:inline-block [&_.ql-link-preview-favicon]:w-[1em] [&_.ql-link-preview-favicon]:h-[1em] [&_.ql-link-preview-favicon]:rounded-sm [&_.ql-link-preview-favicon]:align-text-bottom [&_.ql-link-preview-domain]:font-medium [&_.ql-link-preview-domain]:leading-none [&_.ql-divider]:block [&_.ql-divider]:my-3 [&_.ql-divider]:border-0 [&_.ql-divider]:border-t [&_.ql-divider]:border-solid [&_.ql-divider]:border-(--note-border,#e5e7eb)">
        <ReactQuill
        ref={quillRef}
        theme="bubble"
        value={content}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder="Start typing..."
      />
      </div>
      {slashMenuOpen && (
        <div
          className="fixed inset-0 z-199"
          aria-hidden
          onClick={closeSlashMenu}
        />
      )}
      <SlashMenu
        position={slashMenuPosition}
        selectedIndex={slashMenuSelectedIndex}
        onSelect={applySlashCommand}
        onClose={closeSlashMenu}
        onHoverIndex={setSlashMenuSelectedIndex}
        fontFamily={currentFontFamily}
        searchQuery={slashSearchQuery}
      />
    </>
  );
}

