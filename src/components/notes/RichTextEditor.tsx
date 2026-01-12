import { useMemo, useRef, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import { useBentoStore } from '../../stores/bentoStore';

// ============================================================================
// CUSTOM LINK PREVIEW BLOT
// Renders URLs as: [favicon] domain.com (clickable)
// ============================================================================

const Embed = Quill.import('blots/embed');

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

  // Optimized selector: only subscribes to this specific note's content
  // This prevents re-renders when other notes change
  const content = useBentoStore((state) =>
    state.notes.find(n => n.id === noteId)?.content ?? ''
  );
  const updateNoteContent = useBentoStore((state) => state.updateNoteContent);

  // No local buffer needed - Zustand updates are synchronous (optimistic)
  // so the content from the selector is always current

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
  ];

  const handleChange = (value: string) => {
    // Update Zustand directly - it's synchronous (optimistic update)
    // The selector will return the new value immediately on re-render
    updateNoteContent(noteId, value);
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 [&_.ql-container]:border-none [&_.ql-container]:bg-transparent [&_.ql-editor]:text-white [&_.ql-editor]:p-0 [&_.ql-editor.ql-blank::before]:text-neutral-400 [&_.ql-editor.ql-blank::before]:not-italic [&_.ql-toolbar]:hidden [&_.ql-link-preview]:inline-flex [&_.ql-link-preview]:items-baseline [&_.ql-link-preview]:gap-1.5 [&_.ql-link-preview]:text-white/90 [&_.ql-link-preview]:no-underline [&_.ql-link-preview]:transition-colors [&_.ql-link-preview:hover]:text-white [&_.ql-link-preview-favicon]:inline-block [&_.ql-link-preview-favicon]:w-[1em] [&_.ql-link-preview-favicon]:h-[1em] [&_.ql-link-preview-favicon]:rounded-sm [&_.ql-link-preview-favicon]:align-text-bottom [&_.ql-link-preview-domain]:font-medium [&_.ql-link-preview-domain]:leading-none">
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
  );
}

