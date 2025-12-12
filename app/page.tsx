"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Clock, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { db, type Note } from "@/lib/db";
import { useDebounce } from "use-debounce";

const FONTS = ["Lato", "Arial", "System", "Serif", "Random"];

export default function betterwriteDB() {
  const [fontSize, setFontSize] = useState(18);
  const [selectedFont, setSelectedFont] = useState("Lato");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteId, setNoteId] = useState<number | null>(null);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <div className="flex min-h-screen bg-[#f5f3f0]">
      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-8 py-12">
          <div className="mx-auto max-w-3xl">
            <input
              type="text"
              className="mb-8 w-full resize-none border-none bg-transparent font-semibold text-[#333] outline-none placeholder:text-[#bbb]"
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
            <textarea
              ref={textAreaRef}
              className="min-h-[calc(100vh-240px)] w-full resize-none border-none bg-transparent text-[#555] outline-none placeholder:text-[#999]"
              style={{
                fontSize: `${fontSize}px`,
                fontFamily: getFontFamily(),
                lineHeight: "1.8",
              }}
              placeholder={placeholder}
              spellCheck={false}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        <footer className="border-t border-[#e0ddd8] bg-[#f5f3f0] px-8 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between text-sm text-[#999]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFontSize((prev) => Math.max(prev - 2, 12))}
                className="hover:text-[#555]"
              >
                {fontSize}px
              </button>
              {FONTS.map((font) => (
                <button
                  key={font}
                  onClick={() => setSelectedFont(font)}
                  className={`hover:text-[#555] ${
                    selectedFont === font ? "text-[#555]" : ""
                  }`}
                >
                  {font}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatTime()}</span>
              </div>
              <button className="hover:text-[#555]">Chat</button>
              <button onClick={toggleFullscreen} className="hover:text-[#555]">
                Fullscreen
              </button>
              <button onClick={handleNewEntry} className="hover:text-[#555]">
                New Entry
              </button>
            </div>
          </div>
        </footer>
      </div>

      <div
        className={`relative flex h-screen border-l border-[#d4d0c8] bg-[#e8e6e0] transition-all duration-300 ${
          isSidebarOpen ? "w-80" : "w-0"
        }`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 -left-8 flex h-8 w-8 items-center justify-center rounded-l-lg border border-r-0 border-[#e0ddd8] bg-[#fafaf9] text-[#666] hover:bg-[#f0f0ef] hover:text-[#333]"
        >
          {isSidebarOpen ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {isSidebarOpen && (
          <div className="flex w-full flex-col">
            <div className="border-b border-[#d4d0c8] p-4">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#777]" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[#d4d0c8] bg-[#f5f3f0] py-2 pr-4 pl-10 text-sm text-[#333] outline-none placeholder:text-[#999] focus:border-[#b8b4a8]"
                />
              </div>
            </div>

            <div className="scrollbar-hide flex-1 overflow-y-auto">
              {filteredNotes.length === 0 ? (
                <div className="p-4 text-center text-sm text-[#999]">
                  {searchQuery ? "No notes found" : "No notes yet"}
                </div>
              ) : (
                <div className="divide-y divide-[#d4d0c8]">
                  {filteredNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => loadNote(note)}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-[#d8d6d0] ${
                        noteId === note.id ? "bg-[#d8d6d0]" : ""
                      }`}
                    >
                      <div className="mb-1 truncate text-sm font-medium text-[#333]">
                        {note.title || "Untitled"}
                      </div>
                      <div className="text-xs text-[#777]">
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
