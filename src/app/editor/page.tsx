"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext, Post } from "@/context/AppContext";

export default function EditorPage() {
  const router = useRouter();
  const { activeThread, setActiveThread, saveThread } = useAppContext();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!activeThread) {
      router.push("/");
    }
  }, [activeThread, router]);

  if (!activeThread) {
    return <div className="text-center py-20">Memuat...</div>;
  }

  const handleTextChange = (index: number, newText: string) => {
    const newPosts = [...activeThread.posts];
    newPosts[index].text = newText;
    setActiveThread({ ...activeThread, posts: newPosts });
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    const allText = activeThread.posts.map(p => p.text).join("\n\n");
    navigator.clipboard.writeText(allText);
    alert("Berhasil copy semua thread!");
  };

  const handleRegenerate = async (index: number) => {
    setRegeneratingIndex(index);
    const postToRegenerate = activeThread.posts[index];
    
    try {
      const response = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingThread: activeThread.posts,
          targetSection: postToRegenerate.section,
        }),
      });

      if (!response.ok) throw new Error("Gagal regenerate");

      const newPost = await response.json();
      const newPosts = [...activeThread.posts];
      newPosts[index] = newPost;
      setActiveThread({ ...activeThread, posts: newPosts });
    } catch (e) {
      console.error(e);
      alert("Gagal me-regenerate bagian ini.");
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleSave = () => {
    saveThread(activeThread);
    alert("Tersimpan di history!");
  };

  return (
    <>
      {/* Header Info */}
      <div className="mb-stack-lg text-center mt-4">
        <span className="font-label-md text-xs text-on-secondary-container uppercase tracking-widest font-semibold">Editor Mode</span>
        <h2 className="font-headline-lg text-[24px] font-bold mt-2">Thread Sequence</h2>
        <p className="text-on-secondary-container text-sm mt-1">Review and edit your generated thread before posting.</p>
      </div>

      {/* Thread Feed */}
      <div className="space-y-stack-md relative pb-32">
        {activeThread.posts.map((post, index) => {
          const isOverLimit = post.text.length > 200;
          return (
            <div key={index} className="thread-card relative group">
              <div className="thread-line"></div>
              <div className={`bg-surface-container-lowest border border-border-subtle p-5 rounded-xl transition-all duration-200 focus-within:border-primary ${regeneratingIndex === index ? 'regenerate-pulse' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-on-primary font-label-md text-xs font-bold z-10">
                      {index + 1}
                    </span>
                    <span className="font-label-lg text-sm font-semibold text-primary capitalize">{post.section}</span>
                  </div>
                  <span className="font-label-md text-xs font-semibold text-on-secondary-container">{index + 1}/{activeThread.posts.length}</span>
                </div>
                
                <textarea
                  className="w-full bg-transparent border-none p-0 focus:ring-0 font-body-lg text-base min-h-[100px] outline-none"
                  value={post.text}
                  onChange={(e) => handleTextChange(index, e.target.value)}
                />
                
                <div className="mt-4 pt-4 border-t border-border-subtle flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleCopy(post.text, index)} className="p-2 hover:bg-surface-container rounded-lg transition-colors group/icon active:scale-90">
                      {copiedIndex === index ? (
                        <span className="material-symbols-outlined text-green-600">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-on-secondary-container group-hover/icon:text-action-blue">content_copy</span>
                      )}
                    </button>
                    <button onClick={() => handleRegenerate(index)} disabled={regeneratingIndex === index} className="p-2 hover:bg-surface-container rounded-lg transition-colors group/icon active:scale-90 disabled:opacity-50">
                      <span className="material-symbols-outlined text-on-secondary-container group-hover/icon:text-primary">refresh</span>
                    </button>
                  </div>
                  <span className={`font-label-md text-xs font-semibold ${isOverLimit ? 'text-error' : 'text-on-secondary-container'}`}>
                    {post.text.length}/200
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Copy All Floating Action Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-[640px] px-margin-mobile pointer-events-none">
        <div className="flex justify-center pointer-events-auto gap-4">
          <button onClick={handleSave} className="flex items-center gap-2 bg-secondary text-on-primary px-6 py-3 rounded-full shadow-lg active:scale-95 transition-all hover:bg-neutral-600 font-label-lg text-sm font-semibold">
            <span className="material-symbols-outlined">save</span>
            Save
          </button>
          <button onClick={handleCopyAll} className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full shadow-lg active:scale-95 transition-all hover:bg-neutral-800 font-label-lg text-sm font-semibold">
            <span className="material-symbols-outlined">content_copy</span>
            Copy All
          </button>
        </div>
      </div>
    </>
  );
}
