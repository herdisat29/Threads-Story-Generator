import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { existingThread, targetSection, emotion = "bebas", audience = "semua" } = body;

    const systemPrompt = `
Kamu adalah penulis storytelling thread untuk platform Threads.
Tulis ULANG HANYA bagian dengan section="${targetSection}".
ATURAN WAJIB:
1. Kasih "nyawa" ke tulisan. JANGAN pakai template AI (seperti "Pernah nggak sih", "Jujurly", "Eh ternyata").
2. Buat spesifik, natural, dan nyambung dengan emosi (${emotion}) serta audiens (${audience}).
3. Jika ini rekomendasi, kasih manfaat spesifik, jangan transisi jualan yang mendadak.
4. Panjang teks MAKSIMAL 200 karakter.
5. PENTING: Balas HANYA dengan objek JSON untuk post yang diminta (bukan array), format: { "section": "${targetSection}", "text": "..." } tanpa blok markdown.
`;

    const userPrompt = `
Ini adalah thread yang sudah ada:
${JSON.stringify(existingThread, null, 2)}
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
    let post = null;
    try {
      const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      post = JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse Gemini output:", responseText);
      throw new Error("Invalid output format from AI");
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Regenerate error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
