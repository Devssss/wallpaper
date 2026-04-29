import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
});

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export async function generateWallpapers(vibe: string, referenceImage?: string): Promise<GeneratedImage[]> {
  const model = "gemini-2.5-flash-image"; // Default image generation model
  
  const prompt = `Create a striking mobile phone wallpaper (9:16 aspect ratio). 
  Vibe: ${vibe}. 
  Style: Artistic, high-quality, professional digital art, aesthetic, trending on Pinterest. 
  Resolution: High resolution, sharp details.
  No text, no watermarks.`;

  try {
    const contents: any = {
      parts: [
        { text: prompt }
      ]
    };

    if (referenceImage) {
      // For remix, we could add the image as context, but gemini-2.5-flash-image 
      // primarily generates from text. We'll use the prompt for now 
      // or try to incorporate the image if supported.
      // contents.parts.unshift({ inlineData: { data: referenceImage.split(',')[1], mimeType: 'image/png' } });
    }

    // We want 4 variations. Nano banana usually returns 1. 
    // We can run in parallel or loop. Let's do parallel for speed.
    const tasks = Array(4).fill(null).map(async () => {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          imageConfig: {
            aspectRatio: "9:16",
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
