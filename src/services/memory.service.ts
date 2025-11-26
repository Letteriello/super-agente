import { AppDataSource } from "../database";
import { Memory } from "../database/entities/Memory";
import { User } from "../database/entities/User";
import { aiService } from "./ai.service";

export class MemoryService {

    // Salvar um novo fato/memória
    static async addMemory(user: User, content: string) {
        const memoryRepo = AppDataSource.getRepository(Memory);
        const embedding = await aiService.generateEmbedding(content);

        const memory = memoryRepo.create({
            user: user,
            content: content,
            embedding: embedding
        });

        await memoryRepo.save(memory);
        console.log(`🧠 Memória salva para ${user.name}: "${content}"`);
    }

    // Buscar contexto relevante
    static async getContext(user: User, query: string, limit: number = 3): Promise<string> {
        const embedding = await aiService.generateEmbedding(query);
        const embeddingString = `[${embedding.join(",")}]`;

        const memoryRepo = AppDataSource.getRepository(Memory);

        // Busca vetorial por similaridade (Cosine Distance)
        const results = await memoryRepo
            .createQueryBuilder("memory")
            .select("memory.content")
            .addSelect(`1 - (memory.embedding <=> '${embeddingString}')`, "similarity")
            .where("memory.user_id = :userId", { userId: user.id })
            .andWhere(`1 - (memory.embedding <=> '${embeddingString}') > 0.6`) // Limiar de relevância
            .orderBy("similarity", "DESC")
            .limit(limit)
            .getRawMany();

        if (results.length === 0) return "";

        const context = results.map(r => `- ${r.memory_content}`).join("\n");
        return `\nMemórias Relevantes:\n${context}\n`;
    }
}
