import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import {
  VALID_SECTIONS,
  REQUIRED_SECTION_ORDER,
  MAX_RETRY,
  type SectionType,
} from "@/lib/thread-config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

interface BuildPromptOptions {
  sourceType: string;
  topicText?: string;
  shopeeUrl?: string;
  emotion?: string;
  targetAudience?: string;
  charLimit: number;
}

function buildProductContext(opts: BuildPromptOptions): string {
  if (opts.sourceType === "shopee_link" && opts.shopeeUrl) {
    let productName = "Produk";
    try {
      const urlObj = new URL(opts.shopeeUrl);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        let slug = pathParts[0];
        slug = slug.replace(/-i\.\d+\.\d+$/, "");
        productName = slug.replace(/-/g, " ");
      }
    } catch {
      // ignore invalid URL — pakai fallback "Produk"
    }

    // Nama produk dari slug bisa tidak representatif.
    // AI dikunci untuk TIDAK mengarang spesifikasi yang tidak tersedia.
    return `Produk dari Shopee: "${productName}" (URL: ${opts.shopeeUrl}).

PENTING: Informasi produk di atas hanya berasal dari nama slug URL, BUKAN metadata produk asli.
Jangan mengarang spesifikasi teknis, fitur, harga, rating, review, atau klaim produk yang tidak diberikan.
Jika informasi produk terbatas, buat cerita berbasis masalah umum dan gunakan rekomendasi secara general.`;
  }

  return `Topik: ${opts.topicText || ""}`;
}

function buildPrompt(opts: BuildPromptOptions): string {
  const { emotion, targetAudience, charLimit } = opts;
  const productContext = buildProductContext(opts);

  const systemPrompt = `Kamu adalah penulis storytelling affiliate marketing untuk platform Threads berbahasa Indonesia.

TUJUAN:
Buat thread yang terasa seperti cerita atau observasi nyata, bukan iklan langsung.

ATURAN PENULISAN:
1. Tulis dengan bahasa Indonesia yang natural, santai, spesifik, dan punya sudut pandang.
2. Jangan terdengar seperti AI, template, atau copywriting generik.
3. Jangan menggunakan hook: "Pernah nggak sih", "Siapa yang relate", "Jujurly", "Aku banget", "Eh ternyata".
4. Hook harus langsung masuk ke opini spesifik, masalah nyata, observasi menarik, atau situasi yang relatable.
5. Jangan membuat klaim produk yang tidak diberikan dalam input. Jika informasi produk terbatas, gunakan bahasa aman dan jangan mengarang spesifikasi teknis, harga, fitur, atau pengalaman penggunaan.
6. Produk harus masuk sebagai konsekuensi logis dari masalah yang diceritakan, BUKAN tiba-tiba.
7. Jangan tiba-tiba berkata "link ada di bio" tanpa konteks.
8. Setiap post maksimal ${charLimit} karakter (HARD LIMIT, JANGAN DILANGGAR — hitung karakter sebelum menulis, jangan mepet limit).
9. Buat TEPAT 6 post, satu post untuk masing-masing section di bawah, TIDAK LEBIH TIDAK KURANG.
10. Setiap post harus memiliki field "section" dan "text".

STRUKTUR WAJIB (urutan HARUS PERSIS seperti ini, masing-masing tepat 1 post):
1. hook         - pembuka yang langsung menarik perhatian, bukan pertanyaan generik
2. problem      - masalah spesifik yang relatable
3. consequence  - dampak nyata dari masalah tersebut
4. realization  - perubahan sudut pandang atau solusi mulai ditemukan
5. recommendation - produk masuk secara natural sebagai solusi konkret
6. cta          - ajakan yang natural, bukan hard selling

OUTPUT: HANYA JSON ARRAY berisi TEPAT 6 objek. Tanpa markdown, tanpa penjelasan.`;

  const userPrompt = `${productContext}
Emosi: ${emotion || "bebas"}
Target Audiens: ${targetAudience || "umum"}

Tuliskan thread sesuai aturan. HANYA OUTPUT ARRAY JSON.`;

  return `${systemPrompt}\n\n${userPrompt}`;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

type ValidPost = { section: SectionType; text: string };

function validatePosts(
  posts: unknown,
  charLimit: number
): asserts posts is ValidPost[] {
  if (!Array.isArray(posts)) {
    throw new Error("AI output harus berupa array");
  }
  if (posts.length !== REQUIRED_SECTION_ORDER.length) {
    throw new Error(
      `Jumlah post salah: dapat ${posts.length}, harus ${REQUIRED_SECTION_ORDER.length}`
    );
  }

  posts.forEach((post, i) => {
    if (typeof post?.section !== "string" || typeof post?.text !== "string") {
      throw new Error(
        `Post index ${i} tidak valid: harus memiliki section dan text bertipe string`
      );
    }
    if (!(VALID_SECTIONS as readonly string[]).includes(post.section)) {
      throw new Error(
        `Section tidak dikenal di index ${i}: "${post.section}"`
      );
    }
    if (post.section !== REQUIRED_SECTION_ORDER[i]) {
      throw new Error(
        `Urutan section salah di index ${i}: dapat "${post.section}", seharusnya "${REQUIRED_SECTION_ORDER[i]}"`
      );
    }
    if (post.text.trim().length === 0) {
      throw new Error(`Post "${post.section}" kosong`);
    }
    if (post.text.length > charLimit) {
      throw new Error(
        `Post "${post.section}" melebihi batas karakter (${post.text.length}/${charLimit})`
      );
    }
  });
}

// ---------------------------------------------------------------------------
// Retry loop
// ---------------------------------------------------------------------------

async function generateWithRetry(
  model: GenerativeModel,
  basePrompt: string,
  charLimit: number,
  maxRetry = MAX_RETRY
): Promise<ValidPost[]> {
  let lastError: Error | null = null;
  let prompt = basePrompt;

  for (let attempt = 0; attempt <= maxRetry; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const posts = JSON.parse(raw);
      validatePosts(posts, charLimit);
      return posts; // sukses
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Re-prompt lebih spesifik untuk attempt berikutnya
      prompt = `${basePrompt}

PERHATIAN: Percobaan sebelumnya GAGAL karena: "${lastError.message}".
Perbaiki kesalahan ini secara spesifik. Pastikan output tepat 6 post, urutan section benar (hook, problem, consequence, realization, recommendation, cta), dan setiap post di bawah ${charLimit} karakter.`;
    }
  }

  throw new Error(
    `Generate gagal setelah ${maxRetry + 1} percobaan. Error terakhir: ${lastError?.message}`
  );
}

// ---------------------------------------------------------------------------
// Model (singleton per cold start)
// ---------------------------------------------------------------------------

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "ARRAY",
      minItems: 6,
      maxItems: 6,
      items: {
        type: "OBJECT",
        properties: {
          section: {
            type: "STRING",
            enum: VALID_SECTIONS as unknown as string[],
          },
          text: { type: "STRING" },
        },
        required: ["section", "text"],
      },
    } as never, // SDK type masih longgar — cast aman karena struktur benar
  },
});

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sourceType,
      topicText,
      shopeeUrl,
      emotion,
      targetAudience,
      charLimit = 200,
    } = body;

    const basePrompt = buildPrompt({
      sourceType,
      topicText,
      shopeeUrl,
      emotion,
      targetAudience,
      charLimit,
    });

    const posts = await generateWithRetry(model, basePrompt, charLimit);

    const generatedThread = {
      id: Date.now().toString(),
      requestId: Date.now().toString(),
      posts,
      status: "draft",
      createdAt: Date.now(),
    };

    return NextResponse.json(generatedThread);
  } catch (error) {
    console.error("Generate error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    // 422 = AI gagal hasilkan output yang memenuhi kontrak (bukan error server)
    const isContractViolation =
      message.includes("gagal setelah") ||
      message.includes("section") ||
      message.includes("karakter") ||
      message.includes("array") ||
      message.includes("post");

    return NextResponse.json(
      { error: message },
      { status: isContractViolation ? 422 : 500 }
    );
  }
}
