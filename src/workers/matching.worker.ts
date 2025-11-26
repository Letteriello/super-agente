import { Worker, Job } from "bullmq";
import { redisConnection } from "../utils/redis";
import { Matcher } from "../engine/matcher";
import { evolutionService } from "../services/evolution.service";
import { AppDataSource } from "../database";
import { Match } from "../database/entities/Match";
import { User } from "../database/entities/User";

export const matchingWorker = new Worker("matching", async (job: Job) => {
    console.log(`🔍 Buscando Match para Job: ${job.name}`);

    try {
        if (job.name === "find-match") {
            const { requestId } = job.data;
            const matches = await Matcher.findMatchesForRequest(requestId);

            if (matches.length > 0) {
                // Pegar o melhor match
                const bestMatch = matches[0]; // Já ordenado ou filtrar pelo score

                // Carregar dados completos
                const matchRepo = AppDataSource.getRepository(Match);
                const fullMatch = await matchRepo.findOne({
                    where: { id: bestMatch.id },
                    relations: ["request", "request.user", "offer", "offer.user"]
                });

                if (!fullMatch) return;

                const client = fullMatch.request.user;
                const provider = fullMatch.offer.user;

                // Notificar Cliente
                await evolutionService.sendText(
                    client.phone,
                    `🎉 Encontrei um Match!\n\nPrestador: ${provider.name}\nNota: ${provider.rating_average || "Novo"}\nOferta: ${fullMatch.offer.description}\n\nPara liberar o contato, realize o pagamento.`
                );

                // Notificar Prestador
                await evolutionService.sendText(
                    provider.phone,
                    `💼 Nova Oportunidade!\n\nCliente precisa de: ${fullMatch.request.description}\n\nVocê tem interesse? Responda SIM para aceitar.`
                );
            } else {
                // Ninguém encontrado -> Lista de Espera
                // (Lógica já implícita: o request fica PENDING no banco)
            }
        }
    } catch (error) {
        console.error("❌ Erro no Matching Worker:", error);
    }

}, { connection: redisConnection });

console.log("💘 Matching Worker Iniciado!");
