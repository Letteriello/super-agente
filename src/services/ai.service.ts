import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export class AIService {
    private model: any;
    private embeddingModel: any;

    constructor() {
        // Usando Gemini 1.5 Flash para velocidade e baixo custo
        this.model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json"
            } as any,
            systemInstruction: `
            Você é o cérebro de um Agente de Economia Compartilhada no WhatsApp.
            Sua função é analisar mensagens e extrair intenções e entidades estruturadas.

            Intenções Possíveis:
            - REQUEST_SERVICE: Usuário quer contratar algo ou precisa de ajuda.
            - OFFER_SERVICE: Usuário quer oferecer um serviço ou produto.
            - REPORT_LOST_ITEM: Usuário perdeu algo (animal, objeto, documento).
            - REPORT_FOUND_ITEM: Usuário achou algo perdido.
            - GIVE_FEEDBACK: Usuário quer avaliar um serviço ou pessoa.
            - UNKNOWN: Não ficou claro.

            Saída JSON esperada:
            {
                "intent": "REQUEST_SERVICE" | "OFFER_SERVICE" | "REPORT_LOST_ITEM" | "REPORT_FOUND_ITEM" | "GIVE_FEEDBACK" | "UNKNOWN",
                "entities": {
                    "item": "nome do serviço/produto/objeto",
                    "price": "valor ou orçamento (se houver)",
                    "location": "localização citada (se houver)",
                    "description": "resumo do que foi falado",
                    "reward": "valor da recompensa (apenas para LOST_ITEM)",
                    "rating": "nota de 1 a 5 (apenas para FEEDBACK)"
                },
                "reply_suggestion": "Uma resposta curta e amigável para o usuário (max 1 frase)"
            }
            }
            `
        } as any);
        this.embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    }

    async analyzeMessage(text: string): Promise<any> {
        const prompt = `Mensagem Atual: "${text}"`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            return JSON.parse(response.text());
        } catch (error) {
            console.error("❌ Erro na IA:", error);
            return { intent: "UNKNOWN", reply_suggestion: "Desculpe, tive um erro interno. Pode repetir?" };
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const result = await this.embeddingModel.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            console.error("❌ Erro ao gerar embedding:", error);
            return [];
        }
    }
}

export const aiService = new AIService();
