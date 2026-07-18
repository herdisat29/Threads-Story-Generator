"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

export default function HistoryPage() {
  const router = useRouter();
  const { threads, setActiveThread, deleteThread } = useAppContext();

  const handleOpenThread = (thread: any) => {
    setActiveThread(thread);
    router.push("/editor");
  };

  return (
    <>
      <header className="py-8 flex items-end justify-between">
        <h2 className="font-headline-lg text-[24px] font-bold">History</h2>
        <span className="font-label-md text-xs font-semibold text-on-secondary-container">
          {threads.length} Threads Generated
        </span>
      </header>

      {threads.length === 0 ? (
        <div className="text-center py-20 text-on-secondary-container">
          Belum ada history thread. Buat thread pertamamu sekarang!
        </div>
      ) : (
        <div className="space-y-0 relative">
          {threads.map((thread, index) => {
            const date = new Date(thread.createdAt).toLocaleDateString("id-ID", {
              month: "short",
              day: "numeric",
            });
            const firstPostSnippet = thread.posts[0]?.text || "No content";
            
            return (
              <article
                key={thread.id}
                onClick={() => handleOpenThread(thread)}
                className="thread-item relative group flex gap-4 py-6 cursor-pointer active:bg-surface-container-low transition-colors px-2 -mx-2 rounded-xl"
              >
                {/* Connector line for all except last item */}
                {index !== threads.length - 1 && (
                  <div className="absolute w-[1px] bg-border-subtle top-10 bottom-[-1rem] left-5 z-0 group-hover:bg-primary transition-colors"></div>
                )}
                
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-label-lg text-sm font-semibold text-primary">Generated Thread</h3>
                    <span className="font-label-md text-xs font-semibold text-on-secondary-container">{date}</span>
                  </div>
                  <p className="font-body-md text-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                    {firstPostSnippet}
                  </p>
                  <div className="flex gap-4 pt-2">
                    <div className="flex items-center gap-1 text-on-secondary-container group-hover:text-action-blue transition-colors">
                      <span className="material-symbols-outlined text-[18px]">notes</span>
                      <span className="text-[12px] font-semibold">{thread.posts.length} Posts</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteThread(thread.id);
                      }}
                      className="flex items-center gap-1 text-on-secondary-container hover:text-red-500 transition-colors z-20"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      <span className="text-[12px] font-semibold">Delete</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-secondary">chevron_right</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
