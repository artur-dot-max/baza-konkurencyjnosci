"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  ariaLabel?: string;
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const btnClass = "p-1.5 rounded-md hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:hover:bg-transparent transition-colors";
  const activeBtnClass = "p-1.5 rounded-md bg-gray-200 text-gray-900 transition-colors";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={active ? activeBtnClass : btnClass}
      title={label}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div role="toolbar" aria-label="Formatowanie tekstu" className="flex flex-wrap gap-1 p-2 border-b bg-gray-50/50 rounded-t-md border-gray-200">
      <ToolbarButton
        label="Pogrubienie"
        active={editor.isActive("bold")}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="w-4 h-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Kursywa"
        active={editor.isActive("italic")}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="w-4 h-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Podkreślenie"
        active={editor.isActive("underline")}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="w-4 h-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Przekreślenie"
        active={editor.isActive("strike")}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="w-4 h-4" aria-hidden="true" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" aria-hidden="true" />

      <ToolbarButton
        label="Nagłówek 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="w-4 h-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Nagłówek 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="w-4 h-4" aria-hidden="true" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" aria-hidden="true" />

      <ToolbarButton
        label="Lista punktowa"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="w-4 h-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Lista numerowana"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="w-4 h-4" aria-hidden="true" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" aria-hidden="true" />

      <ToolbarButton
        label="Link"
        active={editor.isActive("link")}
        onClick={setLink}
      >
        <LinkIcon className="w-4 h-4" aria-hidden="true" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" aria-hidden="true" />

      <ToolbarButton
        label="Wyrównaj do lewej"
        active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft className="w-4 h-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Wyrównaj do środka"
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter className="w-4 h-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Wyrównaj do prawej"
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight className="w-4 h-4" aria-hidden="true" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" aria-hidden="true" />

      <ToolbarButton
        label="Cofnij"
        disabled={!editor.can().chain().focus().undo().run()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo className="w-4 h-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Ponów"
        disabled={!editor.can().chain().focus().redo().run()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo className="w-4 h-4" aria-hidden="true" />
      </ToolbarButton>
    </div>
  );
};

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Wprowadź tekst...",
  editable = true,
  ariaLabel = "Edytor tekstu",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4 max-w-none prose-p:my-1 prose-headings:my-2",
        role: "textbox",
        "aria-label": ariaLabel,
        "aria-multiline": "true",
      },
    },
  });

  // Update editor content if it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  return (
    <div className={cn("tiptap-editor border border-gray-200 rounded-md overflow-hidden bg-white flex flex-col", !editable && "opacity-70")}>
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} className="flex-1 cursor-text" />
      <style dangerouslySetInnerHTML={{__html: `
        .is-editor-empty:first-child::before {
          color: #6b7280;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}} />
    </div>
  );
}
