import { IAgent, AgentResponse } from "./base.agent";
import { User } from "../database/entities/User";
import { AppDataSource } from "../database";
import { Request } from "../database/entities/Request";
import { Offer } from "../database/entities/Offer";
import { Match } from "../database/entities/Match";
import { aiService } from "../services/ai.service";
import { ReputationService } from "../services/reputation.service";

export class MarketAgent implements IAgent {
    name = "Market Agent";
    description = "Gerencia ofertas, pedidos e feedback de serviços.";

    async execute(user: User, message: string, analysis: any, context?: string): Promise<AgentResponse> {
        switch (analysis.intent) {
            case "REQUEST_SERVICE":
                return this.handleRequest(user, message, analysis);
            case "OFFER_SERVICE":
                return this.handleOffer(user, message, analysis);
            case "GIVE_FEEDBACK":
                return this.handleFeedback(user, message, analysis);
            default:
                return { text: "Não entendi como posso ajudar com serviços." };
        }
    }

    private async handleRequest(user: User, message: string, analysis: any): Promise<AgentResponse> {
        const requestRepo = AppDataSource.getRepository(Request);
        const embedding = await aiService.generateEmbedding(analysis.entities.item || message);

        const newRequest = requestRepo.create({
            user: user,
            description: message,
            budget: analysis.entities.price,
            embedding: embedding,
            status: "PENDING"
        });
        await requestRepo.save(newRequest);

        // Disparar Job de Match
        const { matchingQueue } = await import("../services/queue.service");
        await matchingQueue.add("find-match", { requestId: newRequest.id });

        return { text: analysis.reply_suggestion || "Entendido! Vou procurar alguém para você." };
    }

    private async handleOffer(user: User, message: string, analysis: any): Promise<AgentResponse> {
        const offerRepo = AppDataSource.getRepository(Offer);
        const offerEmbedding = await aiService.generateEmbedding(analysis.entities.item || message);

        const newOffer = offerRepo.create({
            user: user,
            description: message,
            price_range: analysis.entities.price,
            embedding: offerEmbedding,
            active: true
        });
        await offerRepo.save(newOffer);

        return { text: analysis.reply_suggestion || "Ótimo! Sua oferta foi cadastrada." };
    }

    private async handleFeedback(user: User, message: string, analysis: any): Promise<AgentResponse> {
        const matchRepo = AppDataSource.getRepository(Match);
        const lastMatch = await matchRepo.findOne({
            where: [
                { request: { user: { id: user.id } }, status: "COMPLETED" },
                { offer: { user: { id: user.id } }, status: "COMPLETED" }
            ],
            order: { created_at: "DESC" },
            relations: ["request", "offer", "request.user", "offer.user"]
        });

        if (lastMatch) {
            const rating = analysis.entities.rating || 5;
            await ReputationService.addReview(lastMatch.id, user.id, rating, message);
            return { text: `Obrigado pela avaliação! ⭐ ${rating}/5 registrado.` };
        } else {
            return { text: "Não encontrei nenhum serviço recente para avaliar." };
        }
    }
}
