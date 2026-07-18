"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

export default function Home() {
  const router = useRouter();
  const { setActiveThread } = useAppContext();
  
  const [topic, setTopic] = useState("");
  const [shopeeUrl, setShopeeUrl] = useState("");
  const [emotion, setEmotion] = useState("bahagia");
  const [audience, setAudience] = useState("genz");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!topic && !shopeeUrl) {
      setError("Isi topik atau link Shopee dulu ya!");
      return;
    }
    setError("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: topic ? "manual" : "shopee_link",
          topicText: topic,
          shopeeUrl,
          emotion,
          targetAudience: audience,
          charLimit: 200,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal generate thread");
      }

      const generatedThread = await response.json();
      setActiveThread(generatedThread);
      router.push("/editor");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-stack-md">
      {/* Welcome Section */}
      <section className="mb-stack-lg text-center">
        <h2 className="font-headline-lg text-[24px] mb-2 font-bold">Create Viral Threads</h2>
        <p className="font-body-md text-on-secondary-container">Transform your links and ideas into engaging story sequences.</p>
      </section>

      {error && <div className="text-red-500 text-center">{error}</div>}

      {/* Manual Topic Card */}
      <div className="bg-surface-container-lowest border border-border-subtle rounded-3xl p-6 transition-all focus-within:border-primary">
        <div className="flex items-center justify-between mb-4">
          <span className="font-label-lg text-sm uppercase tracking-wider text-on-secondary-container font-semibold">Manual Topic</span>
          <span className="material-symbols-outlined text-secondary opacity-40">edit_note</span>
        </div>
        <textarea
          className="w-full bg-transparent border-none p-0 focus:ring-0 font-body-lg text-base placeholder:text-on-secondary-container/50 resize-none outline-none"
          placeholder="What's the story about? Share your long-form thoughts here..."
          rows={4}
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            if (e.target.value) setShopeeUrl("");
          }}
        />
      </div>

      <div className="text-center text-sm font-bold text-gray-400">ATAU</div>

      {/* Shopee Link Card */}
      <div className="bg-surface-container-lowest border border-border-subtle rounded-3xl p-6 transition-all focus-within:border-primary">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-label-lg text-sm uppercase tracking-wider text-on-secondary-container font-semibold">Shopee Link</span>
            <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></div>
          </div>
          <span className="material-symbols-outlined text-secondary opacity-40">link</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="url"
            className="w-full bg-transparent border-none p-0 focus:ring-0 font-body-lg text-base placeholder:text-on-secondary-container/50 outline-none"
            placeholder="https://shopee.co.id/product/..."
            value={shopeeUrl}
            onChange={(e) => {
              setShopeeUrl(e.target.value);
              if (e.target.value) setTopic("");
            }}
          />
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
        {/* Emotion Dropdown */}
        <div className="bg-surface-container-lowest border border-border-subtle rounded-3xl p-6 flex flex-col gap-3 transition-all focus-within:border-primary hover:border-primary">
          <label className="font-label-lg text-sm uppercase tracking-wider text-on-secondary-container font-semibold">Emotion</label>
          <div className="relative">
            <select
              className="w-full appearance-none bg-transparent border-none p-0 pr-8 focus:ring-0 font-headline-md text-lg font-bold cursor-pointer outline-none"
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
            >
              <option value="sedih">Sedih</option>
              <option value="lucu">Lucu</option>
              <option value="bahagia">Bahagia</option>
              <option value="menyesal">Menyesal</option>
              <option value="haru">Haru</option>
              <option value="marah">Marah</option>
              <option value="bebas">Bebas</option>
            </select>
            <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-on-secondary-container">expand_more</span>
          </div>
        </div>

        {/* Audience Dropdown */}
        <div className="bg-surface-container-lowest border border-border-subtle rounded-3xl p-6 flex flex-col gap-3 transition-all focus-within:border-primary hover:border-primary">
          <label className="font-label-lg text-sm uppercase tracking-wider text-on-secondary-container font-semibold">Target Audience</label>
          <div className="relative">
            <select
              className="w-full appearance-none bg-transparent border-none p-0 pr-8 focus:ring-0 font-headline-md text-lg font-bold cursor-pointer outline-none"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            >
              <option value="genz">Gen Z</option>
              <option value="remaja">Remaja</option>
              <option value="parents">Orang Tua</option>
              <option value="milenial">Milenial</option>
              <option value="pekerja">Pekerja</option>
              <option value="anakmuda">Anak Muda</option>
              <option value="pebisnis">Pebisnis</option>
              <option value="semua">Semua</option>
            </select>
            <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-on-secondary-container">expand_more</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full max-w-[400px] mx-auto h-12 bg-primary text-on-primary rounded-full font-label-lg text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg hover:opacity-90 disabled:opacity-70 disabled:active:scale-100"
        >
          {isGenerating ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
              Crafting your story...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">bolt</span>
              Generate Thread
            </>
          )}
        </button>
      </div>
    </div>
  );
}
