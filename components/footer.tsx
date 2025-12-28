"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Moon,
  Sun,
  Terminal,
  Plus,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Download,
  Type,
  CommandIcon,
  PanelRight,
} from "lucide-react";
import { useTheme } from "next-themes";

interface FooterProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  selectedFont: string;
  setSelectedFont: (font: string) => void;
  currentTime: Date;
  vimModeEnabled: boolean;
  vimMode: "normal" | "insert" | "visual" | "command";
  commandBuffer: string;
  pendingKey: string;
  isFullscreen: boolean;
  showFooter: boolean;
  isSidebarOpen: boolean;
  theme: string | undefined;
  mounted: boolean;
  onExportNote: () => void;
  onToggleVimMode: () => void;
  onNewEntry: () => void;
  onToggleFullscreen: () => void;
  onToggleSidebar: () => void;
  onCommandMenuOpen: () => void;
}

const FONTS = ["Lato", "Inter", "System", "Ovo", "JetBrains Mono"];

export default function Footer({
  fontSize,
  setFontSize,
  selectedFont,
  setSelectedFont,
  currentTime,
  vimModeEnabled,
  vimMode,
  commandBuffer,
  pendingKey,
  isFullscreen,
  showFooter,
  isSidebarOpen,
  theme,
  mounted,
  onExportNote,
  onToggleVimMode,
  onNewEntry,
  onToggleFullscreen,
  onToggleSidebar,
  onCommandMenuOpen,
}: FooterProps) {
  const formatTime = () => {
    const hours = currentTime.getHours().toString().padStart(2, "0");
    const minutes = currentTime.getMinutes().toString().padStart(2, "0");
    const seconds = currentTime.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const { setTheme } = useTheme();

  const bgColor = "bg-background";
  const textColor = "text-foreground";
  const mutedTextColor = "text-muted-foreground";
  const borderColor = "border-border";
  const hoverBg = "hover:bg-accent";
  const buttonHover = "hover:text-foreground";

  return (
    <>
      {/* Vim Mode Indicator */}
      {vimModeEnabled && (
        <div className="fixed bottom-14 sm:bottom-16 left-4 sm:left-8 flex items-center gap-2 animate-fadeIn z-40">
          <div
            className={`rounded-lg px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs font-mono font-semibold shadow-lg backdrop-blur-sm ${
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

      {/* Footer */}
      <footer
        className={`border-t ${borderColor} ${bgColor}/80 backdrop-blur-md px-3 sm:px-4 md:px-6 py-2 sm:py-3 transition-transform duration-300 ${
          isFullscreen && !showFooter ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between flex-wrap gap-2">
          <div
            className={`flex items-center gap-1 sm:gap-2 ${mutedTextColor} flex-wrap`}
          >
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFontSize(Math.max(fontSize - 2, 12))}
                className={`rounded-lg p-1.5 sm:p-2 transition-colors ${hoverBg} ${buttonHover}`}
                title="Decrease font size"
              >
                <ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <span className="px-1 sm:px-2 text-xs font-medium min-w-10 sm:min-w-12 text-center">
                {fontSize}px
              </span>
              <button
                onClick={() => setFontSize(Math.min(fontSize + 2, 48))}
                className={`rounded-lg p-1.5 sm:p-2 transition-colors ${hoverBg} ${buttonHover}`}
                title="Increase font size"
              >
                <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
            <div className="hidden md:flex mx-2 h-4 w-px bg-border" />
            <div className="hidden lg:flex items-center gap-1">
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

          <div
            className={`flex items-center gap-1 sm:gap-2 ${mutedTextColor}`}
          >
            <div
              className={`hidden sm:flex items-center gap-2 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs ${mutedTextColor}`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium" suppressHydrationWarning>
                {formatTime()}
              </span>
            </div>
            <div className="hidden sm:block mx-1 h-4 w-px bg-border" />
            <button
              onClick={onExportNote}
              className={`rounded-lg p-1.5 sm:p-2 transition-colors ${hoverBg} ${buttonHover}`}
              title="Export note (Ctrl+E)"
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={onCommandMenuOpen}
              className={`hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${hoverBg} ${buttonHover}`}
              title="Open command palette"
            >
              <CommandIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className={`rounded-lg p-1.5 sm:p-2 transition-colors ${hoverBg} ${buttonHover}`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              suppressHydrationWarning
            >
              {!mounted ? (
                <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : theme === "light" ? (
                <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </button>
            <button
              onClick={onToggleVimMode}
              className={`hidden sm:flex rounded-lg p-1.5 sm:p-2 transition-colors ${hoverBg} ${
                vimModeEnabled
                  ? "bg-accent text-foreground"
                  : `${buttonHover}`
              }`}
              title="Toggle Vim mode"
            >
              <Terminal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={onNewEntry}
              className={`rounded-lg p-1.5 sm:p-2 transition-colors ${hoverBg} ${buttonHover}`}
              title="New note"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={onToggleFullscreen}
              className={`hidden md:flex rounded-lg p-1.5 sm:p-2 transition-colors ${hoverBg} ${buttonHover}`}
              title="Toggle fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </button>
            <button
              onClick={onToggleSidebar}
              className={`rounded-lg p-1.5 sm:p-2 transition-colors ${hoverBg} ${
                isSidebarOpen ? "bg-accent text-foreground" : `${buttonHover}`
              }`}
              title="Toggle notes sidebar"
            >
              <PanelRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}