"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  Clock,
  Search,
  Moon,
  Sun,
  Terminal,
  Plus,
  Maximize2,
  FileText,
  Trash2,
  ZoomIn,
  ZoomOut,
  Type,
  Command as CommandIcon,
  PanelRight,
  Github,
} from "lucide-react";
import { useTheme } from "next-themes";
import { db, type Note } from "@/lib/db";
import { useDebounce } from "use-debounce";
import { Command } from "cmdk";

const FONTS = ["Lato", "Inter", "System", "Georgia", "JetBrains Mono"];

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
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [githubStars, setGithubStars] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const { theme, setTheme } = useTheme();

  const [vimModeEnabled, setVimModeEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("betterwrite-vim-mode") === "true";
    }
    return false;
  });
  const [vimMode, setVimMode] = useState<VimMode>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("betterwrite-vim-mode") === "true"
        ? "normal"
        : "insert";
    }
    return "normal";
  });
  const [yankBuffer, setYankBuffer] = useState("");
  const [commandBuffer, setCommandBuffer] = useState("");
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [pendingKey, setPendingKey] = useState("");

  const [debouncedTitle] = useDebounce(title, 500);
  const [debouncedContent] = useDebounce(content, 500);
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const placeholders = useMemo(
    () => [
      "Write your thoughts...",
      "What's on your mind?",
      "Start typing...",
      "Express yourself...",
      "Share your idea...",
      "Let it out...",
    ],
    []
  );

  const [placeholder] = useState(() => {
    const randomIndex = Math.floor(Math.random() * placeholders.length);
    return placeholders[randomIndex];
  });

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
    localStorage.setItem("betterwrite-vim-mode", vimModeEnabled.toString());
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
  }, [content, vimModeEnabled, vimMode, historyIndex]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchGitHubStars = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/repos/ronitrajfr/betterwrite"
        );
        const data = await response.json();
        setGithubStars(data.stargazers_count);
      } catch (error) {
        console.error("Failed to fetch GitHub stars:", error);
      }
    };
    fetchGitHubStars();
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

  // Vim operation functions - declared before useEffect that uses them
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
      while (newPos > 0 && /\s/.test(content[newPos])) {
        newPos--;
      }
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

      if (newPos < content.length && /\s/.test(content[newPos])) {
        while (newPos < content.length && /\s/.test(content[newPos])) {
          newPos++;
        }
      }

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
      const fontFamily = (() => {
        switch (selectedFont) {
          case "Lato":
            return "Lato, sans-serif";
          case "Inter":
            return "Inter, system-ui, sans-serif";
          case "System":
            return "system-ui, -apple-system, sans-serif";
          case "Georgia":
            return "Georgia, serif";
          case "JetBrains Mono":
            return "'JetBrains Mono', 'Courier New', monospace";
          default:
            return "Lato, sans-serif";
        }
      })();
      ctx.font = `${fontSize}px ${fontFamily}`;
      const left = ctx.measureText(currentLineText).width;
      setCursorPosition({ top, left });
    }
  }, [content, vimModeEnabled, vimMode, fontSize, selectedFont]);

  const handlePendingKey = useCallback(
    (key: string, textarea: HTMLTextAreaElement) => {
      if (pendingKey === "d") {
        if (key === "d") {
          deleteLine(textarea);
          updateCursorPosition();
        } else if (key === "w") {
          deleteWord(textarea);
          updateCursorPosition();
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
          updateCursorPosition();
        }
      } else if (pendingKey === "r") {
        replaceChar(textarea, key);
        updateCursorPosition();
      }
      setPendingKey("");
    },
    [
      pendingKey,
      deleteLine,
      deleteWord,
      yankLine,
      changeLine,
      changeWord,
      moveToTop,
      replaceChar,
      updateCursorPosition,
    ]
  );

  const executeCommand = useCallback(
    (cmd: string) => {
      const textarea = textAreaRef.current;
      if (!textarea) return;

      const lineNum = Number.parseInt(cmd, 10);
      if (!isNaN(lineNum)) {
        goToLine(textarea, lineNum);
        updateCursorPosition();
      }
    },
    [goToLine, updateCursorPosition]
  );

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
            updateCursorPosition();
            break;
          case "j":
            moveCursorVertical(textarea, 1);
            updateCursorPosition();
            break;
          case "k":
            moveCursorVertical(textarea, -1);
            updateCursorPosition();
            break;
          case "l":
            moveCursor(textarea, 1);
            updateCursorPosition();
            break;
          case "w":
            moveToNextWord(textarea);
            updateCursorPosition();
            break;
          case "b":
            moveToPrevWord(textarea);
            updateCursorPosition();
            break;
          case "e":
            moveToEndOfWord(textarea);
            updateCursorPosition();
            break;
          case "0":
            moveToLineStart(textarea);
            updateCursorPosition();
            break;
          case "^":
            moveToLineStart(textarea, true);
            updateCursorPosition();
            break;
          case "$":
            moveToLineEnd(textarea);
            updateCursorPosition();
            break;
          case "g":
            setPendingKey("g");
            break;
          case "G":
            moveToBottom(textarea);
            updateCursorPosition();
            break;

          // Delete/Change/Yank operations
          case "x":
            deleteChar(textarea);
            updateCursorPosition();
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
            updateCursorPosition();
            break;
          case "C":
            changeToLineEnd(textarea);
            break;

          // Paste
          case "p":
            pasteAfter(textarea);
            updateCursorPosition();
            break;
          case "P":
            pasteBefore(textarea);
            updateCursorPosition();
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
    executeCommand,
    handlePendingKey,
    moveCursor,
    moveCursorVertical,
    moveToNextWord,
    moveToPrevWord,
    moveToEndOfWord,
    moveToLineStart,
    moveToLineEnd,
    moveToBottom,
    deleteChar,
    deleteToLineEnd,
    changeToLineEnd,
    pasteAfter,
    pasteBefore,
    undo,
    redo,
    insertNewLineBelow,
    insertNewLineAbove,
    updateCursorPosition,
  ]);

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
  }, [debouncedTitle, debouncedContent, noteId]);

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

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

  const getFontFamily = useCallback(() => {
    switch (selectedFont) {
      case "Lato":
        return "Lato, sans-serif";
      case "Inter":
        return "Inter, system-ui, sans-serif";
      case "System":
        return "system-ui, -apple-system, sans-serif";
      case "Georgia":
        return "Georgia, serif";
      case "JetBrains Mono":
        return "'JetBrains Mono', 'Courier New', monospace";
      default:
        return "Lato, sans-serif";
    }
  }, [selectedFont]);

  const handleNewEntry = useCallback(() => {
    setTitle("");
    setContent("");
    setNoteId(null);
    if (textAreaRef.current) textAreaRef.current.value = "";
  }, []);

  const loadNote = (note: Note) => {
    setTitle(note.title);
    setContent(note.content);
    setNoteId(note.id || null);
  };

  const deleteNote = async (noteIdToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this note?")) {
      await db.notes.delete(noteIdToDelete);
      const notes = await db.notes.orderBy("createdAt").reverse().toArray();
      setAllNotes(notes);
      if (noteId === noteIdToDelete) {
        handleNewEntry();
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const toggleVimMode = useCallback(() => {
    setVimModeEnabled((prev) => {
      if (!prev) {
        setVimMode("normal");
      } else {
        setVimMode("insert");
      }
      return !prev;
    });
  }, []);

  useEffect(() => {
    updateCursorPosition();
  }, [updateCursorPosition]);

  // Command menu keybinding - only active when vim mode is disabled or in insert mode
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Ctrl/Cmd+K - Open command menu
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandMenuOpen((open) => !open);
      }

      // Ctrl+Shift+A - New note (Add note)
      if (e.key === "A" && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        handleNewEntry();
      }

      // Ctrl+B - Toggle sidebar
      if (e.key === "b" && e.ctrlKey && !e.shiftKey && !e.metaKey) {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }

      // Ctrl+Shift+V - Toggle vim mode
      if (e.key === "V" && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        toggleVimMode();
      }

      // Ctrl+D - Toggle theme (avoiding browser's Ctrl+Shift+T for reopening closed tab)
      if (e.key === "d" && e.ctrlKey && !e.shiftKey && !e.metaKey) {
        e.preventDefault();
        setTheme(theme === "light" ? "dark" : "light");
      }

      // Ctrl+Shift+- - Decrease font size (avoiding browser's Ctrl+- for zoom)
      if (e.key === "_" && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        setFontSize((prev) => Math.max(prev - 2, 12));
      }

      // Ctrl+Shift+= (Ctrl+Shift++) - Increase font size (avoiding browser's Ctrl+= for zoom)
      if (e.key === "+" && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        setFontSize((prev) => Math.min(prev + 2, 48));
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [vimModeEnabled, vimMode, theme, handleNewEntry, toggleVimMode, setTheme]);

  const bgColor = "bg-background";
  const textColor = "text-foreground";
  const mutedTextColor = "text-muted-foreground";
  const borderColor = "border-border";
  const sidebarBg = "bg-background";
  const sidebarBorder = "border-border";
  const hoverBg = "hover:bg-accent";
  const buttonHover = "hover:text-foreground";

  return (
    <div
      className={`flex h-screen overflow-hidden ${bgColor} transition-colors duration-200`}
    >
      <div className="flex flex-1 flex-col h-full">
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-12 scrollbar-hide">
          <div className="mx-auto max-w-4xl">
            <input
              type="text"
              className={`mb-12 w-full resize-none border-none bg-transparent font-bold ${textColor} outline-none placeholder:${mutedTextColor} transition-all`}
              style={{
                fontSize: `${Math.round(fontSize * 2)}px`,
                fontFamily: getFontFamily(),
                lineHeight: "1.2",
              }}
              placeholder="Untitled"
              spellCheck={false}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="relative">
              <textarea
                ref={textAreaRef}
                className={`min-h-[calc(100vh-240px)] w-full resize-none border-none bg-transparent ${textColor} outline-none placeholder:${mutedTextColor} transition-all`}
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
                suppressHydrationWarning
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
          <div className="fixed bottom-16 left-8 flex items-center gap-2 animate-fadeIn">
            <div
              className={`rounded-lg px-4 py-1.5 text-xs font-mono font-semibold shadow-lg backdrop-blur-sm ${
                vimMode === "normal"
                  ? "bg-blue-500/90 text-white"
                  : vimMode === "insert"
                  ? "bg-green-500/90 text-white"
                  : vimMode === "visual"
                  ? "bg-yellow-500/90 text-black"
                  : "bg-purple-500/90 text-white"
              }`}
            >
              <Terminal className="inline h-3 w-3 mr-1.5" />
              {vimMode.toUpperCase()}
            </div>
            {vimMode === "command" && (
              <div className="rounded-lg bg-gray-800/90 px-4 py-1.5 text-xs font-mono text-white shadow-lg backdrop-blur-sm">
                :{commandBuffer}
              </div>
            )}
            {pendingKey && (
              <div className="rounded-lg bg-gray-600/90 px-3 py-1 text-xs font-mono text-white shadow-lg backdrop-blur-sm">
                {pendingKey}
              </div>
            )}
          </div>
        )}

        <footer
          className={`border-t ${borderColor} ${bgColor}/80 backdrop-blur-md px-6 py-3`}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className={`flex items-center gap-2 ${mutedTextColor}`}>
              <button
                onClick={() => setFontSize((prev) => Math.max(prev - 2, 12))}
                className={`rounded-lg p-2 transition-colors ${hoverBg} ${buttonHover}`}
                title="Decrease font size"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs font-medium min-w-12 text-center">
                {fontSize}px
              </span>
              <button
                onClick={() => setFontSize((prev) => Math.min(prev + 2, 48))}
                className={`rounded-lg p-2 transition-colors ${hoverBg} ${buttonHover}`}
                title="Increase font size"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <div className="mx-2 h-4 w-px bg-border" />
              <div className="flex items-center gap-1">
                <Type className="h-4 w-4 mr-1" />
                {FONTS.map((font) => (
                  <button
                    key={font}
                    onClick={() => setSelectedFont(font)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs transition-colors ${hoverBg} ${
                      selectedFont === font
                        ? "bg-accent text-foreground font-semibold"
                        : `${buttonHover}`
                    }`}
                    title={`${font} font`}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>

            <div className={`flex items-center gap-2 ${mutedTextColor}`}>
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${mutedTextColor}`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span className="font-medium" suppressHydrationWarning>
                  {formatTime()}
                </span>
              </div>
              <div className="mx-1 h-4 w-px bg-border" />
              <button
                onClick={() => setCommandMenuOpen(true)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${hoverBg} ${buttonHover}`}
                title="Open command palette"
              >
                <CommandIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className={`rounded-lg p-2 transition-colors ${hoverBg} ${buttonHover}`}
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                suppressHydrationWarning
              >
                {!mounted ? (
                  <Sun className="h-4 w-4" />
                ) : theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={toggleVimMode}
                className={`rounded-lg p-2 transition-colors ${hoverBg} ${
                  vimModeEnabled
                    ? "bg-accent text-foreground"
                    : `${buttonHover}`
                }`}
                title="Toggle Vim mode"
              >
                <Terminal className="h-4 w-4" />
              </button>
              <button
                onClick={handleNewEntry}
                className={`rounded-lg p-2 transition-colors ${hoverBg} ${buttonHover}`}
                title="New note"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                className={`rounded-lg p-2 transition-colors ${hoverBg} ${buttonHover}`}
                title="Toggle fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`rounded-lg p-2 transition-colors ${hoverBg} ${
                  isSidebarOpen ? "bg-accent text-foreground" : `${buttonHover}`
                }`}
                title="Toggle notes sidebar"
              >
                <PanelRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </footer>
      </div>

      <div
        className={`relative flex h-full border-l ${sidebarBorder} ${sidebarBg} transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarOpen ? "w-80" : "w-0"
        }`}
      >
        {isSidebarOpen && (
          <div className="flex w-full flex-col h-full animate-slideIn">
            <div className={`p-6 pb-4 ${bgColor}`}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <Image
                    src={
                      theme === "dark" ? "/dark_logo.png" : "/light_logo.png"
                    }
                    alt="BetterWrite Logo"
                    width={28}
                    height={28}
                    className="flex-shrink-0"
                  />
                  <h2
                    className={`text-lg font-semibold tracking-tight ${textColor}`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    BetterWrite
                  </h2>
                </div>
                <a
                  href="https://github.com/ronitrajfr/betterwrite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1 transition-all ${mutedTextColor} hover:${textColor} hover:bg-accent`}
                  title="Star on GitHub"
                >
                  <Github className="h-3.5 w-3.5" />
                  {githubStars !== null && (
                    <span className="text-xs font-medium">
                      {githubStars.toLocaleString()}
                    </span>
                  )}
                </a>
              </div>
              <div className="relative">
                <Search
                  className={`absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 ${mutedTextColor}`}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded-md border ${sidebarBorder} ${bgColor} py-1.5 pr-3 pl-9 text-sm ${textColor} outline-none placeholder:${mutedTextColor} transition-all focus:border-border`}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {filteredNotes.length === 0 ? (
                <div
                  className={`p-8 text-center ${mutedTextColor} animate-fadeIn`}
                >
                  <FileText className="mx-auto h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">
                    {searchQuery ? "No notes found" : "No notes yet"}
                  </p>
                  <p className="text-xs mt-1">
                    {searchQuery
                      ? "Try a different search"
                      : "Create your first note to get started"}
                  </p>
                </div>
              ) : (
                <div className="px-3">
                  {filteredNotes.map((note, index) => {
                    const isActive = noteId === note.id;
                    return (
                      <div
                        key={note.id}
                        className={`group relative transition-all duration-200 animate-fadeIn rounded-md mb-1 ${
                          isActive ? "bg-accent/50" : ""
                        }`}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div
                          className={`flex items-start justify-between gap-2 w-full px-3 py-2.5 transition-colors rounded-md ${
                            isActive ? "" : hoverBg
                          }`}
                        >
                          <button
                            onClick={() => loadNote(note)}
                            className="flex-1 min-w-0 text-left"
                          >
                            <div
                              className={`text-sm truncate mb-0.5 ${
                                isActive ? textColor : textColor
                              }`}
                            >
                              {note.title || "Untitled"}
                            </div>
                            <div className={`text-xs ${mutedTextColor}`}>
                              {getRelativeTime(new Date(note.updatedAt))}
                            </div>
                          </button>
                          <button
                            onClick={(e) => deleteNote(note.id!, e)}
                            className={`rounded-md p-1 opacity-0 transition-all group-hover:opacity-100 ${mutedTextColor} hover:text-red-500`}
                            title="Delete note"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Command Menu */}
      <Command.Dialog
        open={commandMenuOpen}
        onOpenChange={setCommandMenuOpen}
        label="Global Command Menu"
      >
        <Command.Input placeholder="Type a command or search..." />
        <Command.List>
          <Command.Empty>No results found.</Command.Empty>

          <Command.Group heading="Actions">
            <Command.Item
              onSelect={() => {
                handleNewEntry();
                setCommandMenuOpen(false);
              }}
            >
              <Plus className="h-4 w-4" />
              <span>New Note</span>
              <kbd>Ctrl+Shift+A</kbd>
            </Command.Item>

            <Command.Item
              onSelect={() => {
                setIsSidebarOpen(!isSidebarOpen);
                setCommandMenuOpen(false);
              }}
            >
              <PanelRight className="h-4 w-4" />
              <span>Toggle Sidebar</span>
              <kbd>Ctrl+B</kbd>
            </Command.Item>

            <Command.Item
              onSelect={() => {
                toggleFullscreen();
                setCommandMenuOpen(false);
              }}
            >
              <Maximize2 className="h-4 w-4" />
              <span>Toggle Fullscreen</span>
              <kbd>F11</kbd>
            </Command.Item>

            <Command.Item
              onSelect={() => {
                toggleVimMode();
                setCommandMenuOpen(false);
              }}
            >
              <Terminal className="h-4 w-4" />
              <span>Toggle Vim Mode</span>
              <kbd>Ctrl+Shift+V</kbd>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Font Size">
            <Command.Item
              onSelect={() => {
                setFontSize((prev) => Math.max(prev - 2, 12));
                setCommandMenuOpen(false);
              }}
            >
              <ZoomOut className="h-4 w-4" />
              <span>Decrease Font Size</span>
              <kbd>Ctrl+Shift+-</kbd>
            </Command.Item>

            <Command.Item
              onSelect={() => {
                setFontSize((prev) => Math.min(prev + 2, 48));
                setCommandMenuOpen(false);
              }}
            >
              <ZoomIn className="h-4 w-4" />
              <span>Increase Font Size</span>
              <kbd>Ctrl+Shift++</kbd>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Theme">
            <Command.Item
              onSelect={() => {
                setTheme("light");
                setCommandMenuOpen(false);
              }}
            >
              <Sun className="h-4 w-4" />
              <span>Light Mode</span>
            </Command.Item>

            <Command.Item
              onSelect={() => {
                setTheme("dark");
                setCommandMenuOpen(false);
              }}
            >
              <Moon className="h-4 w-4" />
              <span>Dark Mode</span>
            </Command.Item>

            <Command.Item
              onSelect={() => {
                setTheme(theme === "light" ? "dark" : "light");
                setCommandMenuOpen(false);
              }}
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span>Toggle Theme</span>
              <kbd>Ctrl+D</kbd>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Fonts">
            {FONTS.map((font) => (
              <Command.Item
                key={font}
                onSelect={() => {
                  setSelectedFont(font);
                  setCommandMenuOpen(false);
                }}
              >
                <Type className="h-4 w-4" />
                <span>{font}</span>
                {selectedFont === font && <span className="ml-auto">✓</span>}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </div>
  );
}
