import { useMemo, useRef, useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import { useBentoStore } from '../../stores/bentoStore';

interface RichTextEditorProps {
  noteId: string;
}

export function RichTextEditor({ noteId }: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  const content = useBentoStore((state) =>
    state.notes.find(n => n.id === noteId)?.content ?? ''
  );
  const updateNoteContent = useBentoStore((state) => state.updateNoteContent);

  const [localContent, setLocalContent] = useState(content);
  const isInternalChange = useRef(false);

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
    isInternalChange.current = true;
    setLocalContent(value);
    updateNoteContent(noteId, value);
  };

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

