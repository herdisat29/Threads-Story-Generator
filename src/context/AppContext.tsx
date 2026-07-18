"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Post = {
  section: "hook" | "konflik" | "hikmah" | "cta" | "rekomendasi";
  text: string;
};

export type GenerationRequest = {
  id: string;
  sourceType: "manual" | "shopee_link";
  topicText?: string;
  shopeeUrl?: string;
  emotion: string;
  targetAudience: string;
  charLimit: number;
  createdAt: number;
};

export type GeneratedThread = {
  id: string;
  requestId: string;
  posts: Post[];
  status: "draft" | "final";
  createdAt: number;
};

type AppContextType = {
  threads: GeneratedThread[];
  saveThread: (thread: GeneratedThread) => void;
  updateThread: (thread: GeneratedThread) => void;
  deleteThread: (id: string) => void;
  activeThread: GeneratedThread | null;
  setActiveThread: (thread: GeneratedThread | null) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [threads, setThreads] = useState<GeneratedThread[]>([]);
  const [activeThread, setActiveThread] = useState<GeneratedThread | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("threadsgen_history");
    if (saved) {
      try {
        setThreads(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage when threads change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("threadsgen_history", JSON.stringify(threads));
    }
  }, [threads, isLoaded]);

  const saveThread = (thread: GeneratedThread) => {
    setThreads((prev) => [thread, ...prev]);
  };

  const updateThread = (thread: GeneratedThread) => {
    setThreads((prev) => prev.map((t) => (t.id === thread.id ? thread : t)));
    if (activeThread?.id === thread.id) {
      setActiveThread(thread);
    }
  };

  const deleteThread = (id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        threads,
        saveThread,
        updateThread,
        deleteThread,
        activeThread,
        setActiveThread,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
