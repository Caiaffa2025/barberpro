import { GoogleGenAI, Type } from "@google/genai";

export const generateServiceDescription = async (serviceName: string, category: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere uma descrição curta e atraente para um serviço chamado "${serviceName}" na categoria "${category}". Foque nos benefícios para o cliente. Máximo 150 caracteres.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "Descrição premium para um visual impecável.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Um serviço de excelência focado no seu estilo e bem-estar.";
  }
};

export const suggestPricing = async (serviceName: string, duration: number) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Dê uma sugestão de preço (em Reais R$) para um serviço de "${serviceName}" que dura ${duration} minutos no mercado brasileiro. Retorne apenas JSON: {"suggestedPrice": 00.00}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedPrice: { type: Type.NUMBER }
          },
          required: ["suggestedPrice"]
        }
      }
    });
    
    let text = response.text || '{"suggestedPrice": 50}';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const data = JSON.parse(text);
    return data.suggestedPrice;
  } catch (error) {
    console.error("Error suggesting price:", error);
    return 50.00;
  }
};

export const askExpertAssistant = async (prompt: string, serviceNames: string[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Atue como um especialista em gestão de barbearias de alto padrão. Catálogo atual: (${serviceNames.join(", ")}). Pergunta: "${prompt}". Responda de forma executiva e prática.`
    });
    return response.text || "Desculpe, não consegui processar sua dúvida agora.";
  } catch (error) {
    console.error("Error consulting AI assistant:", error);
    return "O assistente de IA está temporariamente offline. Tente novamente em instantes.";
  }
};