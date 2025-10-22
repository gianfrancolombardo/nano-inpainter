
import { GoogleGenAI, Modality } from "@google/genai";

const dataUrlToBase64 = (dataUrl: string) => dataUrl.split(',')[1];

export const editImageWithMask = async (
    imageWithMaskDataUrl: string,
    prompt: string
): Promise<string> => {
    // A race condition can occur if the user selects a key via window.aistudio.openSelectKey()
    // and this function is called before the new key is available.
    // Creating the GoogleGenAI instance here ensures it uses the most up-to-date key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const imageWithTransparencyBase64 = dataUrlToBase64(imageWithMaskDataUrl);

    const imagePart = {
        inlineData: {
            mimeType: 'image/png', // Must be PNG to support transparency
            data: imageWithTransparencyBase64,
        },
    };

    const textPrompt = `Eres un modelo profesional de inpainting (relleno de imágenes).
El usuario ha proporcionado una imagen con un área transparente que necesita ser rellenada.
Rellena el área transparente basándote en la siguiente instrucción: "${prompt}".
Es crucial que no alteres ninguno de los píxeles no transparentes de la imagen original.
Devuelve únicamente la imagen completa, sin transparencias.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: textPrompt },
                    imagePart,
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }

        throw new Error("La API no generó ninguna imagen.");
    } catch (error) {
        console.error("Error al llamar a la API de Gemini:", error);
        // Provide a more user-friendly error message
        if (error instanceof Error && error.message.includes('API key not valid')) {
             throw new Error("La clave de API no es válida. Por favor, revisa tu configuración.");
        }
        throw new Error("No se pudo procesar la imagen con Gemini. Inténtalo de nuevo.");
    }
};
