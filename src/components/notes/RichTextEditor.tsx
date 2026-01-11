import { useMemo, useRef, useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import { useNotesStore } from '../../stores/notesStore';

interface RichTextEditorProps {
  noteId: string;
  content: string;
  onContentChange?: (content: string) => void;
}

export function RichTextEditor({ noteId, content, onContentChange }: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);
  const theme = useNotesStore((state) => state.theme);

  // Local state buffer to prevent stale props from resetting the editor
  const [localContent, setLocalContent] = useState(content);
  const isInternalChange = useRef(false);

  // Sync local state with props ONLY when props change externally (not from our own edits)
  useEffect(() => {
    if (!isInternalChange.current && content !== localContent) {
      setLocalContent(content);
    }
    isInternalChange.current = false;
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

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
  ];

  const handleChange = (value: string) => {
    // Mark this as an internal change so the useEffect doesn't reset our state
    isInternalChange.current = true;
    setLocalContent(value); // Update local state immediately

    // Then propagate to parent (which will trigger async store update)
    if (onContentChange) {
      onContentChange(value);
    } else {
      useNotesStore.getState().updateNote(noteId, { content: value });
    }
  };

  // Apply theme font to editor
  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      const editorElement = editor.root;
      if (editorElement) {
        editorElement.style.fontFamily = theme.fontFamily;
      }
    }
  }, [theme.fontFamily]);

  return (
    <div className="w-full h-full flex flex-col min-h-0 [&_.ql-container]:border-none [&_.ql-container]:bg-transparent [&_.ql-editor]:text-white [&_.ql-editor]:p-0 [&_.ql-editor.ql-blank::before]:text-neutral-400 [&_.ql-editor.ql-blank::before]:not-italic [&_.ql-toolbar]:hidden">
      <ReactQuill
        ref={quillRef}
        theme="bubble"
        value={localContent}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder="Start typing..."
      />
    </div>
  );
}

