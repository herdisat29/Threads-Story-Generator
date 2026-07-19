import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  VALID_SECTIONS,
  MAX_RETRY,
  type SectionType,
} from "@/lib/thread-config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

interface BuildRegeneratePromptOptions {
  existingThread: unknown;
  targetSection: SectionType;
  emotion?: string;
  audience?: string;
  charLimit: number;
}

function buildRegeneratePrompt(opts: BuildRegeneratePromptOptions): string {
  const { existingThread, targetSection, emotion, audience, charLimit } = opts;

  const systemPrompt = `Kamu adalah penulis storytelling thread untuk platform Threads berbahasa Indonesia.
Tulis ULANG HANYA bagian dengan section="${targetSection}".

ATURAN WAJIB:
1. Jangan pakai template AI ("Pernah nggak sih", "Jujurly", "Eh ternyata", "Aku banget").
2. Buat spesifik, natural, dan nyambung dengan emosi (${emotion || "bebas"}) serta audiens (${audience || "umum"}).
3. Jika ini section "recommendation", masukkan produk secara natural — jangan tiba-tiba dan jangan mengarang spesifikasi yang tidak ada dalam thread.
4. Jika ini section "cta", jangan langsung "link ada di bio" tanpa konteks — ajakan harus natural.
5. Panjang teks MAKSIMAL ${charLimit} karakter (HARD LIMIT).
6. Balas HANYA dengan JSON objek tunggal: { "section": "${targetSection}", "text": "..." } tanpa markdown.`;

  const userPrompt = `Thread yang sudah ada (untuk konteks):
${JSON.stringify(existingThread, null, 2)}

Tulis ulang HANYA section "${targetSection}". HANYA OUTPUT JSON OBJEK.`;

  return `${systemPrompt}\n\n${userPrompt}`;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

type ValidPost = { section: SectionType; text: string };

function validateSinglePost(
  post: unknown,
  expectedSection: SectionType,
  charLimit: number
): asserts post is ValidPost {
  if (
    typeof (post as Record<string, unknown>)?.section !== "string" ||
    typeof (post as Record<string, unknown>)?.text !== "string"
  ) {
    throw new Error(
      "Struktur post tidak valid: harus memiliki section dan text bertipe string"
    );
  }

  const p = post as { section: string; text: string };

  if (!(VALID_SECTIONS as readonly string[]).includes(p.section)) {
    throw new Error(`Section tidak dikenal: "${p.section}"`);
  }
  if (p.section !== expectedSection) {
    throw new Error(
      `Section tidak sesuai: dapat "${p.section}", seharusnya "${expectedSection}"`
    );
  }
  if (p.text.trim().length === 0) {
    throw new Error(`Post "${p.section}" kosong`);
  }
  if (p.text.length > charLimit) {
    throw new Error(
      `Post melebihi batas karakter (${p.text.length}/${charLimit})`
    );
  }
}

// ---------------------------------------------------------------------------
// Model (singleton per cold start)
// ---------------------------------------------------------------------------

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "OBJECT",
      properties: {
        section: {
          type: "STRING",
          enum: VALID_SECTIONS as unknown as string[],
        },
        text: { type: "STRING" },
      },
      required: ["section", "text"],
    } as never,
  },
});

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { existingThread, targetSection, emotion, audience, charLimit } =
      body;

    // --- Input validation ---
    if (typeof charLimit !== "number" || charLimit <= 0) {
      return NextResponse.json(
        { error: "charLimit wajib dikirim dan harus berupa angka > 0" },
        { status: 400 }
      );
    }
    if (!VALID_SECTIONS.includes(targetSection as SectionType)) {
      return NextResponse.json(
        { error: `targetSection tidak valid: "${targetSection}"` },
        { status: 400 }
      );
    }

    const basePrompt = buildRegeneratePrompt({
      existingThread,
      targetSection: targetSection as SectionType,
      emotion,
      audience,
      charLimit,
    });

    // --- Retry loop ---
    let lastError: Error | null = null;
    let prompt = basePrompt;

    for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const raw = result.response.text();
        const post = JSON.parse(raw);
        validateSinglePost(post, targetSection as SectionType, charLimit);
        return NextResponse.json({ post }, { status: 200 });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        prompt = `${basePrompt}

PERHATIAN: Percobaan sebelumnya gagal karena: "${lastError.message}".
Perbaiki hal ini secara spesifik. Pastikan section="${targetSection}" dan panjang teks di bawah ${charLimit} karakter.`;
      }
    }

    return NextResponse.json(
      {
        error: `Regenerate gagal setelah ${MAX_RETRY + 1} percobaan: ${lastError?.message}`,
      },
      { status: 422 }
    );
  } catch (error) {
    console.error("Regenerate error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
