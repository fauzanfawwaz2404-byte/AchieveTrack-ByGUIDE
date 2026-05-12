import { GoogleGenAI } from "@google/genai";
import { Transaksi, Kategori } from "../types";

export async function getDashboardInsight(transaksi: Transaksi[], kategori: Kategori[]) {
  const dataSummary = {
    totalRevenue: transaksi.reduce((sum, t) => sum + Number(t.nominal), 0),
    totalVisits: transaksi.length,
    petugasPerformance: transaksi.reduce((acc: any, t) => {
      acc[t.petugas] = (acc[t.petugas] || 0) + Number(t.nominal);
      return acc;
    }, {}),
    kategoriPerformance: kategori.map(k => {
      const rev = transaksi.filter(t => t.kategori === k.nama).reduce((s, t) => s + Number(t.nominal), 0);
      return {
        nama: k.nama,
        realisasi: rev,
        target: k.targetRevenue,
        pencapaian: k.targetRevenue > 0 ? (rev / k.targetRevenue) * 100 : 0
      };
    })
  };

  // 1. Try Client-Side First (Recommended by Skill)
  // Check multiple possible locations for the key
  const envKey = typeof process !== 'undefined' ? (process.env?.GEMINI_API || process.env?.GEMINI_API_KEY) : '';
  const viteKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API;
  
  let clientApiKey = (viteKey || envKey || (window as any).__GEMINI_KEY__ || '').trim();
  
  // Clean quotes/spaces
  clientApiKey = clientApiKey.replace(/^["']|["']$/g, "").trim();
                 
  // If we have a valid-looking key, try calling directly
  if (clientApiKey && clientApiKey !== "AI Studio Free Tier" && clientApiKey !== "Select key") {
    try {
      const ai = new GoogleGenAI({ apiKey: clientApiKey });
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

      const text = response.text;
      if (text) {
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
      }
    } catch (clientErr) {
      console.warn("Client-side AI call failed, trying backend proxy...", clientErr);
    }
  }

  // 2. Fallback to Backend Proxy (if client key missing or failed)
  try {
    const backendResponse = await fetch("/api/ai/insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataSummary })
    });

    if (backendResponse.ok) {
      return await backendResponse.json();
    }
    
    // If backend returns error, throw it to be caught by final catch
    const errData = await backendResponse.json();
    throw new Error(errData.recommendation || "Backend error");
  } catch (e: any) {
    console.error("AI Insight Error:", e);
    return {
      insights: [
        "Analisa AI Belum Aktif.", 
        "Silakan pasang GEMINI_API di menu Secrets (Secrets -> Add Secret -> GEMINI_API -> Tempel Kode).", 
        "Pesan: Gunakan format AIzaSy... tanpa tanda petik."
      ],
      recommendation: `Status: ${e.message || 'Cek koneksi'}`
    };
  }
}

export async function getMessageVariations(template: string): Promise<string[]> {
  // 1. Try Client-Side First
  const envKey = typeof process !== 'undefined' ? (process.env?.GEMINI_API || process.env?.GEMINI_API_KEY) : '';
  const viteKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API;
  let clientApiKey = (viteKey || envKey || (window as any).__GEMINI_KEY__ || '').trim();
  clientApiKey = clientApiKey.replace(/^["']|["']$/g, "").trim();

  if (clientApiKey && clientApiKey !== "AI Studio Free Tier" && clientApiKey !== "Select key" && clientApiKey.startsWith("AIzaSy")) {
    try {
      const ai = new GoogleGenAI({ apiKey: clientApiKey });
      const prompt = `Ubah pesan WhatsApp berikut menjadi 5 variasi kalimat yang berbeda namun tetap memiliki makna yang sama. 
      Pertahankan placeholder <TITLE> dan <NAMA>. 
      Pesan harus profesional namun ramah (human-like).
      Ragam variasi: santai, formal, singkat, persuasif, dan mendalam.
      Format respons: Hanya kembalikan 5 variasi pesan tersebut dipisahkan dengan string "###".
      
      Pesan:
      "${template}"`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
      });

      const text = response.text;
      if (text) {
        return text.split('###').map(t => t.trim()).filter(v => v.length > 0).slice(0, 5);
      }
    } catch (clientErr) {
      console.warn("Client-side Variation failed, trying backend...", clientErr);
    }
  }

  // 2. Try Backend Fallback
  try {
    const response = await fetch("/api/ai/variations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: template })
    });

    if (response.ok) {
      const data = await response.json();
      return data.variations || [];
    }
  } catch (e) {
    console.error("Backend Variation Error:", e);
  }

  throw new Error("Gagal memproses AI. Mohon periksa API Key di menu Secrets.");
}
