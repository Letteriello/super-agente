import { IAgent, AgentResponse } from "./base.agent";
import { User } from "../database/entities/User";
import { aiService } from "../services/ai.service";
import { AlertService } from "../services/alert.service";

export class FinderAgent implements IAgent {
    name = "Finder Agent";
    description = "Gerencia itens perdidos e achados.";

    async execute(user: User, message: string, analysis: any, context?: string): Promise<AgentResponse> {
        if (analysis.intent === "REPORT_LOST_ITEM") {
            return this.handleLost(user, message, analysis);
        } else if (analysis.intent === "REPORT_FOUND_ITEM") {
            return this.handleFound(user, message, analysis);
        }
        return { text: "Não entendi se você perdeu ou achou algo." };
    }

    private async handleLost(user: User, message: string, analysis: any): Promise<AgentResponse> {
        const lostEmbedding = await aiService.generateEmbedding(analysis.entities.item || message);

        await AlertService.createAlert({
            type: "LOST",
            description: message,
            embedding: lostEmbedding,
            reward: analysis.entities.reward,
            radius_meters: 1000,
            latitude: user.latitude,
            longitude: user.longitude,
            active: true
        }, user);

        return { text: analysis.reply_suggestion || "Alerta criado! Vou avisar seus vizinhos." };
    }

    private async handleFound(user: User, message: string, analysis: any): Promise<AgentResponse> {
        const foundEmbedding = await aiService.generateEmbedding(analysis.entities.item || message);

        await AlertService.createAlert({
            type: "FOUND",
            description: message,
            embedding: foundEmbedding,
            latitude: user.latitude,
            longitude: user.longitude,
            active: true
        }, user);

        return { text: analysis.reply_suggestion || "Obrigado! Vou procurar quem perdeu." };
    }
}
