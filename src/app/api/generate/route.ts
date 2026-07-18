import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceType, topicText, shopeeUrl, emotion, targetAudience, charLimit = 200 } = body;

    let contextText = topicText;

    if (sourceType === "shopee_link") {
      // In a real scenario, we would scrape the shopee URL here.
      // For now, we use a simple mock representation.
      contextText = `Produk dari Shopee: ${shopeeUrl}. Tolong buatkan thread jualan/affiliate menarik tentang produk ini.`;
    }

    const systemPrompt = `
Kamu adalah penulis storytelling thread untuk platform Threads, khusus konten affiliate marketing berbahasa Indonesia.

ATURAN WAJIB:
- Output HARUS berupa JSON array, tiap elemen 1 post.
- Tiap post punya field: "section" (hook|konflik|hikmah|cta|rekomendasi) dan "text".
- Panjang tiap "text" MAKSIMAL ${charLimit} karakter (termasuk spasi & tanda baca). Ini hard limit, jangan dilanggar.
- Total post: 5-8, urutan: 1x hook, 1-3x konflik, 1x hikmah, 1x cta, 1x rekomendasi.
- Gaya bahasa natural, ngobrol, seperti manusia cerita di Threads — BUKAN gaya iklan/copywriting kaku.
- Rekomendasi produk di post terakhir harus terasa nyambung sama cerita, bukan tempelan random.
- Jangan pakai hashtag berlebihan, jangan pakai emoji lebih dari 1-2 per post.
- PENTING: Jangan gunakan markdown code block, output harus pure JSON text. Jangan tambahkan penjelasan lain.
`;

    const userPrompt = `
Topik atau Produk: ${contextText}
Emosi: ${emotion}
Target Audiens: ${targetAudience}

Tuliskan thread sesuai aturan. HANYA OUTPUT ARRAY JSON.
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt + "\n" + userPrompt }] }],
    });

    const responseText = result.response.text();
    let posts = [];
    try {
      const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      posts = JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse Gemini output:", responseText);
      throw new Error("Invalid output format from AI");
    }

    const generatedThread = {
      id: Date.now().toString(),
      requestId: Date.now().toString(),
      posts: posts,
      status: "draft",
      createdAt: Date.now(),
    };

    return NextResponse.json(generatedThread);
  } catch (error) {
    console.error("Generate error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
