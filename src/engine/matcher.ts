import { AppDataSource } from "../database";
import { Request } from "../database/entities/Request";
import { Offer } from "../database/entities/Offer";
import { Match } from "../database/entities/Match";
import { User } from "../database/entities/User";

export class Matcher {

    // Encontrar ofertas que combinam com uma solicitação
    static async findMatchesForRequest(requestId: string): Promise<Match[]> {
        const requestRepo = AppDataSource.getRepository(Request);
        const request = await requestRepo.findOne({
            where: { id: requestId },
            relations: ["user"]
        });

        if (!request || !request.embedding) return [];

        // Query Híbrida: Vetor (Semântica) + Geo (Localização) + Reputação
        // Nota: TypeORM não suporta nativamente queries complexas de vetor facilmente, vamos de Raw Query

        const embeddingString = `[${request.embedding.join(",")}]`;

        // Parâmetros de Peso
        const WEIGHT_SEMANTIC = 0.3;
        const WEIGHT_DISTANCE = 0.3;
        const WEIGHT_REPUTATION = 0.4;

        const rawQuery = `
            SELECT 
                o.id as offer_id,
                o.user_id as provider_id,
                u.phone as provider_phone,
                u.name as provider_name,
                u.rating_average as provider_rating,
                1 - (o.embedding <=> $1) as semantic_score, -- Cosine Similarity
                ST_Distance(u.location, $2) as distance_meters
            FROM offers o
            JOIN users u ON o.user_id = u.id
            WHERE 
                o.active = true 
                AND o.user_id != $3 -- Não dar match consigo mesmo
                AND 1 - (o.embedding <=> $1) > 0.7 -- Mínimo de similaridade semântica
            ORDER BY semantic_score DESC
            LIMIT 5;
        `;

        // TODO: Adicionar filtro de distância no WHERE se location estiver disponível
        // Por enquanto, vamos simplificar focando na semântica para o MVP

        const results = await AppDataSource.query(rawQuery, [
            embeddingString,
            request.location || request.user.location, // Fallback para location do user
            request.user.id
        ]);

        const matches: Match[] = [];
        const matchRepo = AppDataSource.getRepository(Match);

        for (const res of results) {
            // Calcular Score Final
            // Normalizar Distância (ex: 0 a 10km -> 1 a 0) - Simplificado aqui
            const distanceScore = 1; // Placeholder

            // Boost para Novos Usuários (sem rating)
            let reputationScore = 0;
            if (res.provider_rating === null || res.provider_rating === undefined) {
                reputationScore = 0.7; // Começa com uma nota "boa" para ter chance
            } else {
                reputationScore = Number(res.provider_rating) / 5; // Normalizar 0-5 para 0-1
            }

            const finalScore = (
                (res.semantic_score * WEIGHT_SEMANTIC) +
                (distanceScore * WEIGHT_DISTANCE) +
                (reputationScore * WEIGHT_REPUTATION)
            );

            // Criar Match
            const match = matchRepo.create({
                request_id: request.id,
                offer_id: res.offer_id,
                score: finalScore,
                status: "PROPOSED"
            });

            await matchRepo.save(match);
            matches.push(match);
        }

        return matches;
    }
}
