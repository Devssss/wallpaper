import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" 
});

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export async function generateWallpapers(vibe: string, referenceImage?: string, aspectRatio: string = "9:16", style: string = "Artistic"): Promise<GeneratedImage[]> {
  const model = "gemini-2.5-flash-image"; 
  
  const stylePrompts: Record<string, string> = {
    "Artistic": "high-quality, professional digital art, aesthetic, trending on Pinterest",
    "Photorealistic": "highly detailed, 8k resolution, cinematic lighting, realistic textures, sharp focus",
    "Anime": "vibrant colors, stylized characters, studio ghibli or makoto shinkai style, expressive, clean lines",
    "Abstract": "geometric shapes, fluid motion, experimental patterns, bold colors, conceptual",
    "Minimalist": "simple, clean, negative space, soft tones, uncluttered, Zen-like",
    "Cyberpunk": "neon lights, rainy nights, high-tech, futuristic, purple and cyan color palette, gritty"
  };

  const styleDescription = stylePrompts[style] || stylePrompts["Artistic"];

  const prompt = `Create a striking image (${aspectRatio} aspect ratio). 
  Vibe: ${vibe}. 
  Style: ${styleDescription}. 
  Resolution: High resolution, sharp details.
  No text, no watermarks, no distortions.`;

  try {
    const parts: any[] = [{ text: prompt }];

    if (referenceImage) {
      const base64Data = referenceImage.split(',')[1] || referenceImage;
      parts.unshift({ 
        inlineData: { 
          data: base64Data, 
          mimeType: 'image/png' 
        } 
      });
    }

    const tasks = Array(4).fill(null).map(async () => {
      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          }
        }
      });

      let imageUrl = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
      
      return { url: imageUrl, prompt: vibe };
    });

    return await Promise.all(tasks);
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
}

export async function getVibeSuggestions(history: string[] = []): Promise<string[]> {
  const model = "gemini-3-flash-preview";
  
  const historyContext = history.length > 0 
    ? `The user's recent themes were: ${history.join(", ")}.`
    : "The user hasn't created any wallpapers yet.";

  const prompt = `You are a creative director for a mobile wallpaper app called VibeWall. 
  Suggest 5 short, evocative, and visually descriptive 'vibe' prompts for image generation.
  ${historyContext}
  Focus on trending aesthetics like ethereal, vaporwave, brutalist, cottagecore, or cosmic horror.
  Output ONLY a JSON array of strings. 
  Example: ["Ethereal floating islands in a golden hour mist", "Neon brutalist architecture in a rain-slicked city"]`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text || "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [
      "Ethereal mountain peaks in sunset glow",
      "Vaporwave grid with palm tree silhouettes",
      "Minimalist zen garden with soft shadows",
      "Cyberpunk street in rain",
      "Dreamy underwater kingdom"
    ];
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [
      "Ethereal mountain peaks in sunset glow",
      "Vaporwave grid with palm tree silhouettes",
      "Minimalist zen garden with soft shadows",
      "Cyberpunk street in rain"
    ];
  }
}
