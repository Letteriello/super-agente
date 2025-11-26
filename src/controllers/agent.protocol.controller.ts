import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { User } from "../database/entities/User";
import { Orchestrator } from "../engine/orchestrator";

// Implementação Simplificada do Agent Protocol (https://agentprotocol.ai/)
export class AgentProtocolController {

    // POST /agent/tasks
    // Outro agente envia uma tarefa para nós
    static async createTask(req: Request, res: Response) {
        try {
            const { input, additional_input } = req.body;

            // 1. Identificar o "Agente Cliente" (Autenticação simplificada)
            const agentId = req.headers["x-agent-id"] as string || "external-agent";

            console.log(`🤖 Recebendo tarefa de Agente Externo (${agentId}): ${input}`);

            // 2. Criar um Usuário "Virtual" para representar esse Agente Externo
            const userRepo = AppDataSource.getRepository(User);
            let agentUser = await userRepo.findOne({ where: { phone: `agent:${agentId}` } });

            if (!agentUser) {
                agentUser = userRepo.create({
                    phone: `agent:${agentId}`,
                    name: `Agent ${agentId}`,
                    latitude: 0,
                    longitude: 0
                });
                await userRepo.save(agentUser);
            }

            // 3. Processar via Orquestrador
            // Simulamos uma análise de IA já que o input vem de outro agente (geralmente texto claro)
            // Mas para garantir, passamos pelo fluxo normal
            const { aiService } = await import("../services/ai.service");
            const analysis = await aiService.analyzeMessage(input);

            const orchestrator = new Orchestrator();
            const response = await orchestrator.route(agentUser, input, analysis);

            // 4. Retornar no formato Agent Protocol
            res.json({
                task_id: `task_${Date.now()}`,
                input: input,
                artifacts: [],
                output: response.text
            });

        } catch (error) {
            console.error("❌ Erro no Agent Protocol:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    // GET /agent/health
    static async health(req: Request, res: Response) {
        res.json({ status: "ok", agent: "Super Agente", version: "1.0.0" });
    }
}
