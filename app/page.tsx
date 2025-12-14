"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Moon,
  Sun,
  Terminal,
} from "lucide-react";
import { useTheme } from "next-themes";
import { db, type Note } from "@/lib/db";
import { useDebounce } from "use-debounce";

const FONTS = ["Lato", "Arial", "System", "Serif", "Random"];

type VimMode = "normal" | "insert" | "visual" | "command";

interface HistoryState {
  content: string;
  cursorPos: number;
}

export default function BetterWriteDB() {
  const [fontSize, setFontSize] = useState(18);
  const [selectedFont, setSelectedFont] = useState("Lato");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteId, setNoteId] = useState<number | null>(null);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });

  const { theme, setTheme } = useTheme();

  const [vimModeEnabled, setVimModeEnabled] = useState(false);
  const [vimMode, setVimMode] = useState<VimMode>("normal");
  const [yankBuffer, setYankBuffer] = useState("");
  const [commandBuffer, setCommandBuffer] = useState("");
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [pendingKey, setPendingKey] = useState("");

  const [debouncedTitle] = useDebounce(title, 500);
  const [debouncedContent] = useDebounce(content, 500);
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const placeholders = [
    "Write your thoughts...",
    "What's on your mind?",
    "Start typing...",
    "Express yourself...",
    "Share your idea...",
    "Let it out...",
  ];

  const placeholder = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * placeholders.length);
    return placeholders[randomIndex];
  }, []);

  const filteredNotes = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return allNotes;
    const query = debouncedSearchQuery.toLowerCase().trim();
    return allNotes.filter((note) => {
      const titleMatch = note.title.toLowerCase().includes(query);
      const contentMatch = note.content.toLowerCase().includes(query);
      return titleMatch || contentMatch;
    });
  }, [allNotes, debouncedSearchQuery]);

  useEffect(() => {
    const savedVimMode =
      localStorage.getItem("betterwrite-vim-mode") === "true";
    setVimModeEnabled(savedVimMode);
  }, []);

  useEffect(() => {
    localStorage.setItem("betterwrite-vim-mode", vimModeEnabled.toString());
    if (vimModeEnabled) {
      setVimMode("normal");
    }
  }, [vimModeEnabled]);

  useEffect(() => {
    if (!vimModeEnabled || vimMode !== "insert") return;

    const timer = setTimeout(() => {
      const textarea = textAreaRef.current;
      if (!textarea) return;

      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push({
          content,
          cursorPos: textarea.selectionStart,
        });
        // Keep history limited to 100 states
        if (newHistory.length > 100) newHistory.shift();
        return newHistory;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 99));
    }, 500);

    return () => clearTimeout(timer);
  }, [content, vimModeEnabled, vimMode]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        setFontSize((prev) => Math.min(prev + 2, 48));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        setFontSize((prev) => Math.max(prev - 2, 12));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!vimModeEnabled) return;

    const handleVimKeyDown = (e: KeyboardEvent) => {
      const textarea = textAreaRef.current;
      if (!textarea) return;

      // Command mode input
      if (vimMode === "command") {
        if (e.key === "Escape") {
          e.preventDefault();
          setVimMode("normal");
          setCommandBuffer("");
        } else if (e.key === "Enter") {
          e.preventDefault();
          executeCommand(commandBuffer);
          setCommandBuffer("");
          setVimMode("normal");
        } else if (e.key === "Backspace") {
          e.preventDefault();
          setCommandBuffer((prev) => prev.slice(0, -1));
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setCommandBuffer((prev) => prev + e.key);
        }
        return;
      }

      // ESC to normal mode
      if (e.key === "Escape") {
        e.preventDefault();
        setVimMode("normal");
        textarea.blur();
        setPendingKey("");
        return;
      }

      // Ctrl+r for redo in normal mode
      if (vimMode === "normal" && e.ctrlKey && e.key === "r") {
        e.preventDefault();
        redo();
        return;
      }

      if (vimMode === "normal") {
        // Prevent default typing in normal mode
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
        }

        // Handle pending keys (dd, yy, cc, gg, etc.)
        if (pendingKey) {
          handlePendingKey(e.key, textarea);
          return;
        }

        switch (e.key) {
          // Mode switches
          case "i":
            setVimMode("insert");
            textarea.focus();
            break;
          case "a":
            setVimMode("insert");
            textarea.focus();
            moveCursor(textarea, 1);
            break;
          case "I":
            setVimMode("insert");
            textarea.focus();
            moveToLineStart(textarea, true);
            break;
          case "A":
            setVimMode("insert");
            textarea.focus();
            moveToLineEnd(textarea);
            break;
          case "o":
            setVimMode("insert");
            textarea.focus();
            insertNewLineBelow(textarea);
            break;
          case "O":
            setVimMode("insert");
            textarea.focus();
            insertNewLineAbove(textarea);
            break;
          case "v":
            setVimMode("visual");
            textarea.focus();
            break;
          case ":":
            setVimMode("command");
            setCommandBuffer("");
            break;

          // Motion
          case "h":
            moveCursor(textarea, -1);
            break;
          case "j":
            moveCursorVertical(textarea, 1);
            break;
          case "k":
            moveCursorVertical(textarea, -1);
            break;
          case "l":
            moveCursor(textarea, 1);
            break;
          case "w":
            moveToNextWord(textarea);
            break;
          case "b":
            moveToPrevWord(textarea);
            break;
          case "e":
            moveToEndOfWord(textarea);
            break;
          case "0":
            moveToLineStart(textarea);
            break;
          case "^":
            moveToLineStart(textarea, true);
            break;
          case "$":
            moveToLineEnd(textarea);
            break;
          case "g":
            setPendingKey("g");
            break;
          case "G":
            moveToBottom(textarea);
            break;

          // Delete/Change/Yank operations
          case "x":
            deleteChar(textarea);
            break;
          case "d":
            setPendingKey("d");
            break;
          case "c":
            setPendingKey("c");
            break;
          case "y":
            setPendingKey("y");
            break;
          case "D":
            deleteToLineEnd(textarea);
            break;
          case "C":
            changeToLineEnd(textarea);
            break;

          // Paste
          case "p":
            pasteAfter(textarea);
            break;
          case "P":
            pasteBefore(textarea);
            break;

          // Undo/Redo
          case "u":
            undo();
            break;

          // Replace
          case "r":
            setPendingKey("r");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleVimKeyDown);
    return () => window.removeEventListener("keydown", handleVimKeyDown);
  }, [
    vimModeEnabled,
    vimMode,
    content,
    yankBuffer,
    commandBuffer,
    pendingKey,
    history,
    historyIndex,
  ]);

  const handlePendingKey = useCallback(
    (key: string, textarea: HTMLTextAreaElement) => {
      if (pendingKey === "d") {
        if (key === "d") {
          deleteLine(textarea);
        } else if (key === "w") {
          deleteWord(textarea);
        }
      } else if (pendingKey === "y") {
        if (key === "y") {
          yankLine(textarea);
        }
      } else if (pendingKey === "c") {
        if (key === "c") {
          changeLine(textarea);
        } else if (key === "w") {
          changeWord(textarea);
        }
      } else if (pendingKey === "g") {
        if (key === "g") {
          moveToTop(textarea);
        }
      } else if (pendingKey === "r") {
        replaceChar(textarea, key);
      }
      setPendingKey("");
    },
    [pendingKey]
  );

  const executeCommand = useCallback((cmd: string) => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const lineNum = Number.parseInt(cmd, 10);
    if (!isNaN(lineNum)) {
      goToLine(textarea, lineNum);
    }
  }, []);

  const moveCursor = useCallback(
    (textarea: HTMLTextAreaElement, offset: number) => {
      const newPos = Math.max(
        0,
        Math.min(content.length, textarea.selectionStart + offset)
      );
      textarea.setSelectionRange(newPos, newPos);
    },
    [content.length]
  );

  const moveCursorVertical = useCallback(
    (textarea: HTMLTextAreaElement, lines: number) => {
      const lines_array = content.split("\n");
      const currentPos = textarea.selectionStart;
      let lineNum = 0;
      let charCount = 0;

      for (let i = 0; i < lines_array.length; i++) {
        if (charCount + lines_array[i].length >= currentPos) {
          lineNum = i;
          break;
        }
        charCount += lines_array[i].length + 1;
      }

      const colNum = currentPos - charCount;
      const targetLine = Math.max(
        0,
        Math.min(lines_array.length - 1, lineNum + lines)
      );

      let newPos = 0;
      for (let i = 0; i < targetLine; i++) {
        newPos += lines_array[i].length + 1;
      }
      newPos += Math.min(colNum, lines_array[targetLine].length);

      textarea.setSelectionRange(newPos, newPos);
    },
    [content]
  );

  const moveToNextWord = useCallback(
    (textarea: HTMLTextAreaElement) => {
      const pos = textarea.selectionStart;
      const match = content.slice(pos).match(/\s*\S+/);
      if (match) {
        const newPos = Math.min(content.length, pos + match[0].length);
        textarea.setSelectionRange(newPos, newPos);
      }
    },
    [content]
  );

  const moveToPrevWord = useCallback(
    (textarea: HTMLTextAreaElement) => {
      const pos = textarea.selectionStart;
      if (pos === 0) return;

      let newPos = pos - 1;
      // Skip whitespace
      while (newPos > 0 && /\s/.test(content[newPos])) {
        newPos--;
      }
      // Move to start of word
      while (newPos > 0 && /\S/.test(content[newPos - 1])) {
        newPos--;
      }
      textarea.setSelectionRange(newPos, newPos);
    },
    [content]
  );

  const moveToEndOfWord = useCallback(
    (textarea: HTMLTextAreaElement) => {
      const pos = textarea.selectionStart;
      let newPos = pos;

      // If at end of word, move to next word
      if (newPos < content.length && /\s/.test(content[newPos])) {
        while (newPos < content.length && /\s/.test(content[newPos])) {
          newPos++;
        }
      }

      // Move to end of current word
      while (newPos < content.length - 1 && /\S/.test(content[newPos + 1])) {
        newPos++;
      }

      textarea.setSelectionRange(newPos, newPos);
    },
    [content]
  );

  const moveToLineStart = useCallback(
    (textarea: HTMLTextAreaElement, firstNonSpace = false) => {
      const pos = textarea.selectionStart;
      const lineStart = content.lastIndexOf("\n", pos - 1) + 1;

      if (firstNonSpace) {
        let newPos = lineStart;
        while (
          newPos < content.length &&
          /\s/.test(content[newPos]) &&
          content[newPos] !== "\n"
        ) {
          newPos++;
        }
        textarea.setSelectionRange(newPos, newPos);
      } else {
        textarea.setSelectionRange(lineStart, lineStart);
      }
    },
    [content]
  );

  const moveToLineEnd = useCallback(
    (textarea: HTMLTextAreaElement) => {
      const pos = textarea.selectionStart;
      const lineEnd = content.indexOf("\n", pos);
      const endPos = lineEnd === -1 ? content.length : lineEnd;
      textarea.setSelectionRange(endPos, endPos);
    },
    [content]
  );

  const moveToTop = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.setSelectionRange(0, 0);
    textarea.scrollTop = 0;
  }, []);

  const moveToBottom = useCallback(
    (textarea: HTMLTextAreaElement) => {
      const endPos = content.length;
      textarea.setSelectionRange(endPos, endPos);
      textarea.scrollTop = textarea.scrollHeight;
    },
    [content.length]
  );

  const goToLine = useCallback(
    (textarea: HTMLTextAreaElement, lineNum: number) => {
      const lines = content.split("\n");
      const targetLine = Math.max(1, Math.min(lineNum, lines.length)) - 1;

      let pos = 0;
      for (let i = 0; i < targetLine; i++) {
        pos += lines[i].length + 1;
      }

      textarea.setSelectionRange(pos, pos);
      textarea.focus();
    },
    [content]
  );

  const deleteChar = useCallback(
    (textarea: HTMLTextAreaElement) => {
      const pos = textarea.selectionStart;
      if (pos < content.length) {
        const newContent = content.slice(0, pos) + content.slice(pos + 1);
        setContent(newContent);
        setTimeout(() => textarea.setSelectionRange(pos, pos), 0);
      }
    },
    [content]
  );

  const deleteLine = useCallback(
    (textarea: HTMLTextAreaElement) => {
      const pos = textarea.selectionStart;
      const lineStart = content.lastIndexOf("\n", pos - 1) + 1;
      const lineEnd = content.indexOf("\n", pos);
      const endPos = lineEnd === -1 ? content.length : lineEnd + 1;

      const line = content.slice(lineStart, endPos);
      setYankBuffer(line);

      const newContent = content.slice(0, lineStart) + content.slice(endPos);
      setContent(newContent);
      setTimeout(() => textarea.setSelectionRange(lineStart, lineStart), 0);
    },
    [content]
  );

  const deleteWord = useCallback(
    (textarea: HTMLTextAreaElement) => {
      const pos = textarea.selectionStart;
      const match = content.slice(pos).match(/\s*\S+/);
      if (match) {
        const endPos = pos + match[0].length;
        const deleted = content.slice(pos, endPos);
        setYankBuffer(deleted);
        const newContent = content.slice(0, pos) + content.slice(endPos);
        setContent(newContent);
        setTimeout(() => textarea.setSelectionRange(pos, pos), 0);
      }
    },
    [content]
  );

  const deleteToLineEnd = useCallback(
    (textarea: HTMLTextAreaElement) => {
      const pos = textarea.selectionStart;
      const lineEnd = content.indexOf("\n", pos);
      const endPos = lineEnd === -1 ? content.length : lineEnd;

      const deleted = content.slice(pos, endPos);
      setYankBuffer(deleted);
      const newContent = content.slice(0, pos) + content.slice(endPos);
      setContent(newContent);
      setTimeout(() => textarea.setSelectionRange(pos, pos), 0);
    },
    [content]
  );

  const changeLine = useCallback(
    (textarea: HTMLTextAreaElement) => {
      const pos = textarea.selectionStart;
      const lineStart = content.lastIndexOf("\n", pos - 1) + 1;
      const lineEnd = content.indexOf("\n", pos);
      const endPos = lineEnd === -1 ? content.length : lineEnd;

      const line = content.slice(lineStart, endPos);
      setYankBuffer(line);

      const newContent = content.slice(0, lineStart) + content.slice(endPos);
      setContent(newContent);
      setVimMode("insert");
      setTimeout(() => {
        textarea.setSelectionRange(lineStart, lineStart);
        textarea.focus();
      }, 0);
    },
    [content]
  );

  const changeWord = useCallback(
    (textarea: HTMLTextAreaElement) => {
      const pos = textarea.selectionStart;
      const match = content.slice(pos).match(/\s*\S+/);
      if (match) {
        const endPos = pos + match[0].length;
        const deleted = content.slice(pos, endPos);
        setYankBuffer(deleted);
        const newContent = content.slice(0, pos) + content.slice(endPos);
        setContent(newContent);
        setVimMode("insert");
        setTimeout(() => {
          textarea.setSelectionRange(pos, pos);
          textarea.focus();
        }, 0);
      }
    },
    [content]
  );

  const changeToLineEnd = useCallback(
    (textarea: HTMLTextAreaElement) => {
      const pos = textarea.selectionStart;
      const lineEnd = content.indexOf("\n", pos);
      const endPos = lineEnd === -1 ? content.length : lineEnd;

      const deleted = content.slice(pos, endPos);
      setYankBuffer(deleted);
      const newContent = content.slice(0, pos) + content.slice(endPos);
      setContent(newContent);
      setVimMode("insert");
      setTimeout(() => {
        textarea.setSelectionRange(pos, pos);
        textarea.focus();
      }, 0);
    },
    [content]
  );

  const yankLine = useCallback(
    (textarea: HTMLTextAreaElement) => {
      const pos = textarea.selectionStart;
      const lineStart = content.lastIndexOf("\n", pos - 1) + 1;
      const lineEnd = content.indexOf("\n", pos);
      const endPos = lineEnd === -1 ? content.length : lineEnd + 1;
      const line = content.slice(lineStart, endPos);
      setYankBuffer(line);
    },
    [content]
  );

  const pasteAfter = useCallback(
    (textarea: HTMLTextAreaElement) => {
      if (!yankBuffer) return;

      const pos = textarea.selectionStart;
      const isLinePaste = yankBuffer.includes("\n");

      if (isLinePaste) {
        const lineEnd = content.indexOf("\n", pos);
        const insertPos = lineEnd === -1 ? content.length : lineEnd + 1;
        const newContent =
          content.slice(0, insertPos) + yankBuffer + content.slice(insertPos);
        setContent(newContent);
        setTimeout(() => {
          textarea.setSelectionRange(insertPos, insertPos);
        }, 0);
      } else {
        const newContent =
          content.slice(0, pos) + yankBuffer + content.slice(pos);
        setContent(newContent);
        setTimeout(() => {
          const newPos = pos + yankBuffer.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      }
    },
    [content, yankBuffer]
  );

  const pasteBefore = useCallback(
    (textarea: HTMLTextAreaElement) => {
      if (!yankBuffer) return;

      const pos = textarea.selectionStart;
      const isLinePaste = yankBuffer.includes("\n");

      if (isLinePaste) {
        const lineStart = content.lastIndexOf("\n", pos - 1) + 1;
        const newContent =
          content.slice(0, lineStart) + yankBuffer + content.slice(lineStart);
        setContent(newContent);
        setTimeout(() => {
          textarea.setSelectionRange(lineStart, lineStart);
        }, 0);
      } else {
        const newContent =
          content.slice(0, pos) + yankBuffer + content.slice(pos);
        setContent(newContent);
        setTimeout(() => {
          textarea.setSelectionRange(pos, pos);
        }, 0);
      }
    },
    [content, yankBuffer]
  );

  const replaceChar = useCallback(
    (textarea: HTMLTextAreaElement, char: string) => {
      if (char.length !== 1) return;

      const pos = textarea.selectionStart;
      if (pos < content.length) {
        const newContent =
          content.slice(0, pos) + char + content.slice(pos + 1);
        setContent(newContent);
        setTimeout(() => textarea.setSelectionRange(pos, pos), 0);
      }
    },
    [content]
  );

  const insertNewLineBelow = useCallback(
    (textarea: HTMLTextAreaElement) => {
      const pos = textarea.selectionStart;
      const lineEnd = content.indexOf("\n", pos);
      const insertPos = lineEnd === -1 ? content.length : lineEnd;
      const newContent =
        content.slice(0, insertPos) + "\n" + content.slice(insertPos);
      setContent(newContent);
      setTimeout(() => {
        const newPos = insertPos + 1;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    },
    [content]
  );

  const insertNewLineAbove = useCallback(
    (textarea: HTMLTextAreaElement) => {
      const pos = textarea.selectionStart;
      const lineStart = content.lastIndexOf("\n", pos - 1) + 1;
      const newContent =
        content.slice(0, lineStart) + "\n" + content.slice(lineStart);
      setContent(newContent);
      setTimeout(() => {
        textarea.setSelectionRange(lineStart, lineStart);
      }, 0);
    },
    [content]
  );

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;

    const textarea = textAreaRef.current;
    if (!textarea) return;

    const newIndex = historyIndex - 1;
    const state = history[newIndex];
    setContent(state.content);
    setHistoryIndex(newIndex);

    setTimeout(() => {
      textarea.setSelectionRange(state.cursorPos, state.cursorPos);
    }, 0);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    const textarea = textAreaRef.current;
    if (!textarea) return;

    const newIndex = historyIndex + 1;
    const state = history[newIndex];
    setContent(state.content);
    setHistoryIndex(newIndex);

    setTimeout(() => {
      textarea.setSelectionRange(state.cursorPos, state.cursorPos);
    }, 0);
  }, [history, historyIndex]);

  useEffect(() => {
    const loadNotes = async () => {
      const notes = await db.notes.orderBy("createdAt").reverse().toArray();
      setAllNotes(notes);
    };
    loadNotes();
  }, []);

  useEffect(() => {
    const saveNote = async () => {
      if (!debouncedTitle.trim() && !debouncedContent.trim()) return;

      const now = new Date();

      if (noteId !== null) {
        await db.notes.update(noteId, {
          title: debouncedTitle,
          content: debouncedContent,
          updatedAt: now,
        });
      } else {
        const id = await db.notes.add({
          title: debouncedTitle,
          content: debouncedContent,
          createdAt: now,
          updatedAt: now,
        });
        setNoteId(id);
      }

      const notes = await db.notes.orderBy("createdAt").reverse().toArray();
      setAllNotes(notes);
    };

    saveNote();
  }, [debouncedTitle, debouncedContent]);

  const formatTime = () => {
    const hours = currentTime.getHours().toString().padStart(2, "0");
    const minutes = currentTime.getMinutes().toString().padStart(2, "0");
    const seconds = currentTime.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (date: Date) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const getFontFamily = () => {
    switch (selectedFont) {
      case "Lato":
        return "Lato, sans-serif";
      case "Arial":
        return "Arial, sans-serif";
      case "System":
        return "system-ui, -apple-system, sans-serif";
      case "Serif":
        return "Georgia, serif";
      case "Random":
        return "Comic Sans MS, cursive";
      default:
        return "Lato, sans-serif";
    }
  };

  const handleNewEntry = () => {
    setTitle("");
    setContent("");
    setNoteId(null);
    if (textAreaRef.current) textAreaRef.current.value = "";
  };

  const loadNote = (note: Note) => {
    setTitle(note.title);
    setContent(note.content);
    setNoteId(note.id || null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const toggleVimMode = () => {
    setVimModeEnabled((prev) => !prev);
  };

  const updateCursorPosition = useCallback(() => {
    const textarea = textAreaRef.current;
    if (!textarea || !vimModeEnabled || vimMode === "insert") return;

    const position = textarea.selectionStart;
    const textBeforeCursor = content.substring(0, position);
    const lines = textBeforeCursor.split("\n");
    const currentLineIndex = lines.length - 1;
    const currentLineText = lines[currentLineIndex];

    const lineHeight = fontSize * 1.8;
    const top = currentLineIndex * lineHeight;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = `${fontSize}px ${getFontFamily()}`;
      const left = ctx.measureText(currentLineText).width;
      setCursorPosition({ top, left });
    }
  }, [content, vimModeEnabled, vimMode, fontSize, getFontFamily]);

  useEffect(() => {
    updateCursorPosition();
  }, [updateCursorPosition]);

  const bgColor = "bg-background";
  const textColor = "text-foreground";
  const mutedTextColor = "text-muted-foreground";
  const borderColor = "border-border";
  const sidebarBg = "bg-muted";
  const sidebarBorder = "border-border";
  const inputBg = "bg-background";
  const hoverBg = "hover:bg-accent";
  const activeBg = "bg-accent";
  const buttonHover = "hover:text-foreground";

  return (
    <div className={`flex min-h-screen ${bgColor}`}>
      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-8 py-12">
          <div className="mx-auto max-w-3xl">
            <input
              type="text"
              className={`mb-8 w-full resize-none border-none bg-transparent font-semibold ${textColor} outline-none placeholder:${mutedTextColor}`}
              style={{
                fontSize: `${Math.round(fontSize * 1.5)}px`,
                fontFamily: getFontFamily(),
                lineHeight: "1.4",
              }}
              placeholder="Untitled"
              spellCheck={false}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="relative">
              <textarea
                ref={textAreaRef}
                className={`min-h-[calc(100vh-240px)] w-full resize-none border-none bg-transparent ${textColor} outline-none placeholder:${mutedTextColor}`}
                style={{
                  fontSize: `${fontSize}px`,
                  fontFamily: getFontFamily(),
                  lineHeight: "1.8",
                  caretColor:
                    vimModeEnabled && vimMode !== "insert"
                      ? "transparent"
                      : "auto",
                }}
                placeholder={placeholder}
                spellCheck={false}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyUp={updateCursorPosition}
                onClick={updateCursorPosition}
                readOnly={vimModeEnabled && vimMode !== "insert"}
              />

              {/* Block cursor for Vim normal mode */}
              {vimModeEnabled && vimMode !== "insert" && (
                <div
                  className="pointer-events-none absolute"
                  style={{
                    top: `${cursorPosition.top}px`,
                    left: `${cursorPosition.left}px`,
                    width: `${fontSize * 0.6}px`,
                    height: `${fontSize * 1.8}px`,
                    backgroundColor:
                      vimMode === "normal"
                        ? "rgba(59, 130, 246, 0.5)"
                        : vimMode === "visual"
                        ? "rgba(234, 179, 8, 0.5)"
                        : "rgba(168, 85, 247, 0.5)",
                    border: `2px solid ${
                      vimMode === "normal"
                        ? "rgb(59, 130, 246)"
                        : vimMode === "visual"
                        ? "rgb(234, 179, 8)"
                        : "rgb(168, 85, 247)"
                    }`,
                    animation: "vim-cursor-blink 1s step-end infinite",
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {vimModeEnabled && (
          <div className="fixed bottom-20 left-8 flex items-center gap-2">
            <div
              className={`rounded-md px-3 py-1 text-sm font-mono ${
                vimMode === "normal"
                  ? "bg-blue-500 text-white"
                  : vimMode === "insert"
                  ? "bg-green-500 text-white"
                  : vimMode === "visual"
                  ? "bg-yellow-500 text-black"
                  : "bg-purple-500 text-white"
              }`}
            >
              {vimMode.toUpperCase()}
            </div>
            {vimMode === "command" && (
              <div className="rounded-md bg-gray-800 px-3 py-1 text-sm font-mono text-white">
                :{commandBuffer}
              </div>
            )}
            {pendingKey && (
              <div className="rounded-md bg-gray-600 px-2 py-1 text-xs font-mono text-white">
                {pendingKey}
              </div>
            )}
          </div>
        )}

        <footer className={`border-t ${borderColor} ${bgColor} px-8 py-4`}>
          <div className="mx-auto flex max-w-7xl items-center justify-between text-sm">
            <div className={`flex items-center gap-3 ${mutedTextColor}`}>
              <button
                onClick={() => setFontSize((prev) => Math.max(prev - 2, 12))}
                className={buttonHover}
              >
                {fontSize}px
              </button>
              {FONTS.map((font) => (
                <button
                  key={font}
                  onClick={() => setSelectedFont(font)}
                  className={`${buttonHover} ${
                    selectedFont === font ? "text-foreground font-semibold" : ""
                  }`}
                >
                  {font}
                </button>
              ))}
            </div>

            <div className={`flex items-center gap-4 ${mutedTextColor}`}>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatTime()}</span>
              </div>
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className={buttonHover}
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={toggleVimMode}
                className={`${buttonHover} ${
                  vimModeEnabled ? "text-foreground font-semibold" : ""
                }`}
                title="Toggle Vim mode"
              >
                <Terminal className="h-4 w-4" />
              </button>
              <button className={buttonHover}>Chat</button>
              <button onClick={toggleFullscreen} className={buttonHover}>
                Fullscreen
              </button>
              <button onClick={handleNewEntry} className={buttonHover}>
                New Entry
              </button>
            </div>
          </div>
        </footer>
      </div>

      <div
        className={`relative flex h-screen border-l ${sidebarBorder} ${sidebarBg} transition-all duration-300 ${
          isSidebarOpen ? "w-80" : "w-0"
        }`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-4 -left-8 flex h-8 w-8 items-center justify-center rounded-l-lg border border-r-0 ${borderColor} ${sidebarBg} ${buttonHover}`}
        >
          {isSidebarOpen ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {isSidebarOpen && (
          <div className="flex w-full flex-col">
            <div className={`border-b ${sidebarBorder} p-4`}>
              <div className="relative">
                <Search
                  className={`absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 ${mutedTextColor}`}
                />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded-lg border ${sidebarBorder} ${inputBg} py-2 pr-4 pl-10 text-sm ${textColor} outline-none placeholder:${mutedTextColor} focus:border-ring`}
                />
              </div>
            </div>

            <div className="scrollbar-hide flex-1 overflow-y-auto">
              {filteredNotes.length === 0 ? (
                <div className={`p-4 text-center text-sm ${mutedTextColor}`}>
                  {searchQuery ? "No notes found" : "No notes yet"}
                </div>
              ) : (
                <div className={`divide-y ${sidebarBorder}`}>
                  {filteredNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => loadNote(note)}
                      className={`w-full px-4 py-3 text-left transition-colors ${hoverBg} ${
                        noteId === note.id ? activeBg : ""
                      }`}
                    >
                      <div
                        className={`mb-1 truncate text-sm font-medium ${textColor}`}
                      >
                        {note.title || "Untitled"}
                      </div>
                      <div className={`text-xs ${mutedTextColor}`}>
                        {formatDate(new Date(note.createdAt))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
