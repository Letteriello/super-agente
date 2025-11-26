import { User } from "../database/entities/User";
import { IAgent, AgentResponse } from "../agents/base.agent";
import { MarketAgent } from "../agents/market.agent";
import { FinderAgent } from "../agents/finder.agent";
import { MCPAgent } from "../agents/mcp.agent";
import { MemoryService } from "../services/memory.service";

export class Orchestrator {
    private agents: IAgent[];

    constructor() {
        this.agents = [
            new MarketAgent(),
            new FinderAgent(),
            new MCPAgent()
        ];
    }

    async route(user: User, message: string, analysis: any): Promise<AgentResponse> {
        console.log(`🧭 Orchestrator roteando intenção: ${analysis.intent}`);

        // 1. Buscar Contexto (Memória Episódica)
        const context = await MemoryService.getContext(user, message);
        if (context) console.log("🧠 Contexto Recuperado:", context);

        // Roteamento Simples (Pode ser substituído por IA Router no futuro)
        let selectedAgent: IAgent | null = null;

        switch (analysis.intent) {
            case "REQUEST_SERVICE":
            case "OFFER_SERVICE":
            case "GIVE_FEEDBACK":
                selectedAgent = this.agents.find(a => a.name === "Market Agent") || null;
                break;

            case "REPORT_LOST_ITEM":
            case "REPORT_FOUND_ITEM":
                selectedAgent = this.agents.find(a => a.name === "Finder Agent") || null;
                break;

            default:
                // Fallback: Tenta achar um agente padrão ou responde genérico
                return { text: analysis.reply_suggestion || "Olá! Sou o Super Agente. Posso ajudar com serviços ou achados e perdidos." };
        }

        if (selectedAgent) {
            console.log(`✅ Agente Selecionado: ${selectedAgent.name}`);
            return await selectedAgent.execute(user, message, analysis, context);
        }

        return { text: "Desculpe, não sei lidar com isso ainda." };
    }
}
