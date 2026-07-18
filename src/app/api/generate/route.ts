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

ATURAN WAJIB PENULISAN (COPYWRITING BERNYAWA):
1. JANGAN KAKU & JANGAN TERLIHAT SEPERTI AI/TEMPLATE. Kasih "nyawa" ke tulisanmu. Buat cerita spesifik, berikan detail nyata layaknya pengalaman pribadi. Hindari pola umum.
2. JANGAN pakai hook generik seperti "Pernah nggak sih ngerasa...". Langsung tembak dengan opini, keresahan spesifik, atau fakta menarik. 
3. HINDARI kata-kata pengisi (filler) klise seperti "Jujurly", "Rasanya", "Eh ternyata", "Aku banget". Gunakan bahasa santai tapi padat dan natural.
4. Transisi ke jualan (rekomendasi produk) harus SUPER MULUS dan masuk akal. Jangan mendadak. Kaitkan masalah dengan alasan logis kenapa produk tersebut jadi solusi. Berikan alasan/manfaat nyata, bukan cuma klaim "bagus".
5. Panjang tiap "text" MAKSIMAL ${charLimit} karakter. Ini hard limit.
6. Total post: 5-8, urutan logis: hook, konflik (masalah spesifik), hikmah (realisasi/transisi), cta (ajakan diskusi natural, bukan jualan), rekomendasi (solusi produk).
7. Output HARUS pure JSON array (tanpa markdown blok code), tiap elemen punya "section" dan "text".
`;

    const userPrompt = `
Topik atau Produk: ${contextText}
Emosi: ${emotion}
Target Audiens: ${targetAudience}

Tuliskan thread sesuai aturan. HANYA OUTPUT ARRAY JSON.
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
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
