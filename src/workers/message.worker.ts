import { Worker, Job } from "bullmq";
import { redisConnection } from "../utils/redis";
import { aiService } from "../services/ai.service";
import { evolutionService } from "../services/evolution.service";
import { AppDataSource } from "../database";
import { User } from "../database/entities/User";

export const messageWorker = new Worker("messages", async (job: Job) => {
    const { key, message } = job.data;
    const remoteJid = key.remoteJid;
    const text = message.conversation || message.extendedTextMessage?.text;

    if (!text) return;

    console.log(`🤖 Processando mensagem de ${remoteJid}: ${text}`);

    try {
        // 1. Identificar Usuário (ou criar)
        const userRepository = AppDataSource.getRepository(User);
        let user = await userRepository.findOne({ where: { phone: remoteJid } });

        if (!user) {
            user = userRepository.create({
                phone: remoteJid,
                name: job.data.pushName || "Usuário"
            });
            await userRepository.save(user);
        }

        // 2. Analisar Intenção com IA
        const analysis = await aiService.analyzeMessage(text);
        console.log("🧠 Análise da IA:", analysis);

        // 3. Orquestração (Super Agente Architecture)
        const { Orchestrator } = await import("../engine/orchestrator");
        const orchestrator = new Orchestrator();

        const response = await orchestrator.route(user, text, analysis);

        // 4. Enviar Resposta
        if (response && response.text) {
            await evolutionService.sendText(remoteJid, response.text);

            // 5. Salvar Memória (Episodic Memory)
            const { MemoryService } = await import("../services/memory.service");
            // Salva o que o usuário disse e o que o agente respondeu (resumo)
            await MemoryService.addMemory(user, `User: ${text} | Agent: ${response.text}`);
        }

    } catch (error) {
        console.error("❌ Erro no Worker:", error);
    }

}, { connection: redisConnection });

console.log("👷 Message Worker Iniciado!");
