import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
});

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export async function generateWallpapers(vibe: string, referenceImage?: string, aspectRatio: string = "9:16", style: string = "Artistic"): Promise<GeneratedImage[]> {
  const model = "gemini-2.5-flash-image"; // Default image generation model
  
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
    const contents: any = {
      parts: [
        { text: prompt }
      ]
    };

    if (referenceImage) {
      // For remix, add the image as context. Extract base64 if it's a data URL.
      const base64Data = referenceImage.split(',')[1] || referenceImage;
      contents.parts.unshift({ 
        inlineData: { 
          data: base64Data, 
          mimeType: 'image/png' 
        } 
      });
    }

    // We want 4 variations. Nano banana usually returns 1. 
    // We can run in parallel or loop. Let's do parallel for speed.
    const tasks = Array(4).fill(null).map(async () => {
      const response = await ai.models.generateContent({
        model,
        contents,
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
