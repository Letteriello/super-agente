import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export class EvolutionService {
    private baseUrl: string;
    private apiKey: string;
    private instanceName: string = "super-agente-main"; // Nome da instância no Evolution

    constructor() {
        this.baseUrl = process.env.EVOLUTION_API_URL || "http://localhost:8080";
        this.apiKey = process.env.EVOLUTION_API_KEY || "evolution-api-secret-key";
    }

    // Enviar mensagem de texto simples
    async sendText(phone: string, text: string): Promise<any> {
        try {
            const url = `${this.baseUrl}/message/sendText/${this.instanceName}`;
            const body = {
                number: phone,
                options: {
                    delay: 1200,
                    presence: "composing",
                    linkPreview: false
                },
                textMessage: {
                    text: text
                }
            };

            const response = await axios.post(url, body, {
                headers: {
                    "apikey": this.apiKey,
                    "Content-Type": "application/json"
                }
            });

            return response.data;
        } catch (error: any) {
            console.error(`❌ Erro ao enviar mensagem para ${phone}:`, error.response?.data || error.message);
            throw error;
        }
    }

    // TODO: Implementar envio de mídia, botões, etc. conforme necessidade
}

export const evolutionService = new EvolutionService();
