import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI API Route (Server Side - Key is safe here)
  app.post("/api/ai/insight", async (req, res) => {
    const { dataSummary } = req.body;
    
    // Prioritize user's GEMINI_API over reserved GEMINI_API_KEY
    let manualKey = (process.env.GEMINI_API || "").trim();
    let reservedKey = (process.env.GEMINI_API_KEY || "").trim();
    
    // Pick the one that looks like a real key (starts with AIzaSy)
    let apiKey = "";
    if (manualKey.startsWith("AIzaSy")) {
      apiKey = manualKey;
    } else if (reservedKey.startsWith("AIzaSy")) {
      apiKey = reservedKey;
    } else {
      apiKey = manualKey || reservedKey; // Fallback to whatever exists
    }
    
    // Clean key (remove quotes if user pasted with quotes)
    apiKey = apiKey.replace(/^["']|["']$/g, "").trim();

    if (!apiKey || apiKey === "AI Studio Free Tier" || apiKey === "Select key" || !apiKey.startsWith("AIzaSy")) {
      return res.status(500).json({
        insights: ["API Key Prodia belum terdeteksi aktif di server.", "Harap tempel kode AIzaSy Anda di Secrets (GEMINI_API).", "PASTIKAN KLIK 'APPLY CHANGES' DI POJOK BAWAH."],
        recommendation: "Konfigurasi Secrets Diperlukan (Server)."
      });
    }

    // Server-side validation check
    if (apiKey.length < 30) {
      return res.status(500).json({
        insights: ["Kode API yang terpasang terlalu pendek.", "Mohon salin seluruh kode dari Google AI Studio.", "Panjang kode seharusnya sekitar 39 karakter."],
        recommendation: "Periksa kembali API Key Anda."
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        Anda adalah analis bisnis senior di Prodia Depok. Analisis data performa berikut dan berikan 3 poin insight yang tajam, profesional, dan memotivasi dalam bahasa Indonesia yang ringkas. 
        Gunakan gaya bahasa korporat yang elegan.
        
        Data Summary:
        ${JSON.stringify(dataSummary, null, 2)}
        
        Hasil HARUS dalam format JSON murni:
        {
          "insights": ["insight 1", "insight 2", "insight 3"],
          "recommendation": "saran strategis singkat"
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text;
                           
      if (!responseText) throw new Error("AI Server: No text response");

      // Basic cleaning in case model adds markdown blocks
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      res.json(JSON.parse(cleaned));

    } catch (error) {
      console.error("AI Server Error:", error)
      res.status(500).json({
        insights: ["Koneksi AI sedang padat.", "Data transaksi tetap aman.", "Coba lagi beberapa saat lagi."],
        recommendation: "Analisa gagal dijalankan (Server Error)."
      });
    }
  });

  // AI Variation Route (Server Side - Key is safe here)
  app.post("/api/ai/variations", async (req, res) => {
    const { content } = req.body;
    
    // Prioritize user's GEMINI_API over reserved GEMINI_API_KEY
    let manualKey = (process.env.GEMINI_API || "").trim();
    let reservedKey = (process.env.GEMINI_API_KEY || "").trim();
    
    // Pick the one that looks like a real key (starts with AIzaSy)
    let apiKey = "";
    if (manualKey.startsWith("AIzaSy")) {
      apiKey = manualKey;
    } else if (reservedKey.startsWith("AIzaSy")) {
      apiKey = reservedKey;
    } else {
      apiKey = manualKey || reservedKey; // Fallback to whatever exists
    }
    
    // Clean key (remove quotes if user pasted with quotes)
    apiKey = apiKey.replace(/^["']|["']$/g, "").trim();

    // Log key status for debugging (SAFE: only logging prefix and length)
    console.log(`[AI Auth] Key check: prefix=${apiKey.substring(0, 7)}, length=${apiKey.length}`);

    if (!apiKey || apiKey === "AI Studio Free Tier" || apiKey === "Select key" || !apiKey.startsWith("AIzaSy")) {
      return res.status(500).json({ 
        error: `API Key belum terdeteksi di server. Kunci terdeteksi: "${apiKey.substring(0, 10)}...". Harap tempel kode AIzaSy Anda di Secrets (GEMINI_API) dan KLIK 'APPLY CHANGES'.` 
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Ubah pesan WhatsApp berikut menjadi 5 variasi kalimat yang berbeda namun tetap memiliki makna yang sama. 
      Pertahankan placeholder <TITLE> dan <NAMA>. 
      Pesan harus profesional namun ramah (human-like).
      Ragam variasi: santai, formal, singkat, persuasif, dan mendalam.
      Format respons: Hanya kembalikan 5 variasi pesan tersebut dipisahkan dengan string "###".
      
      Pesan:
      "${content}"`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
      });

      const responseText = response.text;
      if (!responseText) throw new Error("AI Server: No text response");
      
      const variations = responseText.split("###").map(v => v.trim()).filter(v => v.length > 0);
      res.json({ variations });

    } catch (err: any) {
      console.error("Server AI Variation Error:", err);
      res.status(500).json({ error: err.message || "Gagal memproses AI di Server." });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
