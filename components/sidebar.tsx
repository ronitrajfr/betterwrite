"use client";

import React from "react";
import Image from "next/image";
import {
  Search,
  X,
  FileText,
  Trash2,
  ListChecks,
  Check,
  Github,
  Coffee,
} from "lucide-react";
import type { Note } from "@/lib/db";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredNotes: Note[];
  noteId: number | null;
  selectedNotes: Set<number>;
  isSelectionMode: boolean;
  setIsSelectionMode: (mode: boolean) => void;
  toggleNoteSelection: (id: number) => void;
  toggleSelectAll: () => void;
  loadNote: (note: Note) => void;
  deleteNote: (id: number, e: React.MouseEvent) => void;
  setNoteToDelete: (id: number | null) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setSelectedNotes: (notes: Set<number>) => void;
  githubStars: number | null;
  theme: string;
  // Color classes
  bgColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  sidebarBg: string;
  sidebarBorder: string;
  hoverBg: string;
  getRelativeTime: (date: Date) => string;
}

const Sidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  searchQuery,
  setSearchQuery,
  filteredNotes,
  noteId,
  selectedNotes,
  isSelectionMode,
  setIsSelectionMode,
  toggleNoteSelection,
  toggleSelectAll,
  loadNote,
  deleteNote,
  setNoteToDelete,
  setDeleteDialogOpen,
  setSelectedNotes,
  githubStars,
  theme,
  bgColor,
  textColor,
  mutedTextColor,
  borderColor,
  sidebarBg,
  sidebarBorder,
  hoverBg,
  getRelativeTime,
}: SidebarProps) => {
  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`relative flex h-full border-l ${sidebarBorder} ${sidebarBg} transition-all duration-300 ease-in-out overflow-hidden z-50 ${
          isSidebarOpen
            ? "fixed md:relative inset-y-0 right-0 w-full sm:w-96 md:w-80 shadow-2xl md:shadow-none"
            : "w-0"
        }`}
      >
        {isSidebarOpen && (
          <div className="flex w-full flex-col h-full animate-slideIn">
            <div className={`p-4 sm:p-6 pb-4 ${bgColor}`}>
              <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <Image
                    src={
                      theme === "dark" ? "/dark_logo.png" : "/light_logo.png"
                    }
                    alt="BetterWrite Logo"
                    width={24}
                    height={24}
                    className="shrink-0 sm:w-7 sm:h-7"
                  />
                  <h2
                    className={`text-base sm:text-lg font-semibold tracking-tight ${textColor}`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    BetterWrite
                  </h2>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className={`md:hidden rounded-md p-1 transition-colors ${mutedTextColor} hover:${textColor}`}
                    title="Close sidebar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {isSelectionMode && (
                <div className="flex items-center justify-between gap-2 mb-3 p-2 rounded-md bg-accent/50">
                  <button
                    onClick={toggleSelectAll}
                    className={`flex items-center gap-1.5 text-xs ${textColor} hover:opacity-80`}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        selectedNotes.size === filteredNotes.length
                          ? "bg-primary border-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {selectedNotes.size === filteredNotes.length && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    Select All ({selectedNotes.size})
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setNoteToDelete(null);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={selectedNotes.size === 0}
                      className={`rounded-md p-1.5 transition-colors ${
                        selectedNotes.size > 0
                          ? "text-red-500 hover:bg-red-500/10"
                          : "text-muted-foreground opacity-50"
                      }`}
                      title="Delete selected"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setIsSelectionMode(false);
                        setSelectedNotes(new Set());
                      }}
                      className={`rounded-md p-1.5 transition-colors ${mutedTextColor} hover:${textColor}`}
                      title="Cancel selection"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
              <div className="relative flex items-center gap-2">
                <div className="flex-1 relative">
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
                {filteredNotes.length > 0 && (
                  <button
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className={`rounded-md p-1.5 transition-colors ${
                      isSelectionMode
                        ? "bg-accent text-foreground"
                        : `${mutedTextColor} hover:${textColor}`
                    }`}
                    title={
                      isSelectionMode
                        ? "Exit selection mode"
                        : "Select multiple notes"
                    }
                  >
                    <ListChecks className="h-3.5 w-3.5" />
                  </button>
                )}
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
                    const isSelected = selectedNotes.has(note.id!);
                    return (
                      <div
                        key={note.id}
                        className={`group relative transition-all duration-200 animate-fadeIn rounded-md mb-1 ${
                          isActive
                            ? "bg-accent/50"
                            : isSelected
                            ? "bg-accent/30"
                            : ""
                        }`}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div
                          className={`flex items-start gap-2 w-full px-3 py-2.5 transition-colors rounded-md ${
                            isActive || isSelected ? "" : hoverBg
                          }`}
                        >
                          {isSelectionMode && (
                            <button
                              onClick={() => toggleNoteSelection(note.id!)}
                              className="shrink-0 my-auto mr-2"
                            >
                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "bg-primary border-primary"
                                    : "border-muted-foreground"
                                }`}
                              >
                                {isSelected && (
                                  <Check className="h-4 w-4 text-primary-foreground" />
                                )}
                              </div>
                            </button>
                          )}
                          <button
                            onClick={() => !isSelectionMode && loadNote(note)}
                            className="flex-1 min-w-0 text-left"
                            disabled={isSelectionMode}
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
                          {!isSelectionMode && (
                            <button
                              onClick={(e) => deleteNote(note.id!, e)}
                              className={`rounded-md p-1 my-auto opacity-0 transition-all group-hover:opacity-100 ${mutedTextColor} hover:text-red-500`}
                              title="Delete note"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div
              className={`border-t ${borderColor} ${bgColor}/80 backdrop-blur-md px-3 md:px-6 py-2 sm:py-3 sticky bottom-0 w-full`}
            >
              <div className="flex items-center justify-between gap-2">
                {/* GitHub Stars */}
                <a
                  href="https://github.com/ronitrajfr/betterwrite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-1.5 flex-1 rounded-md px-2 py-1.5 transition-all ${mutedTextColor} hover:${textColor} hover:bg-accent`}
                  title="Star on GitHub"
                >
                  <Github className="h-4 w-4" strokeWidth={2} />
                  <span className="text-sm font-medium hidden sm:inline">
                    Star
                  </span>
                  {githubStars !== null && (
                    <span
                      className={`rounded-full bg-accent px-2 py-0.5 text-xs font-medium ${textColor}`}
                    >
                      {githubStars.toLocaleString()}
                    </span>
                  )}
                </a>
                {/* Divider */}
                <div className={`h-6 w-px ${borderColor}`} />
                {/* Buy me a coffee */}
                <a
                  href="https://www.buymeacoffee.com/lirena00"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-1.5 flex-1 rounded-md px-2 py-1.5 transition-all ${mutedTextColor} hover:${textColor} hover:bg-accent`}
                  title="Support this project"
                >
                  <Coffee className="h-4 w-4" strokeWidth={2} />
                  <span className="text-sm font-medium hidden sm:inline">
                    Sponsor
                  </span>
                  <span
                    className={`rounded-full bg-accent px-2 py-0.5 text-xs font-medium ${textColor}`}
                  >
                    $5
                  </span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
