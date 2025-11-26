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

        // Query Raw para buscar candidatos baseados em similaridade semântica
        // Retornamos também lat/long para calcular distância na aplicação (já que removemos PostGIS)
        const rawQuery = `
            SELECT 
                o.id as offer_id,
                o.user_id as provider_id,
                u.phone as provider_phone,
                u.name as provider_name,
                u.rating_average as provider_rating,
                u.latitude as provider_lat,
                u.longitude as provider_long,
                1 - (o.embedding <=> $1) as semantic_score
            FROM offers o
            JOIN users u ON o.user_id = u.id
            WHERE 
                o.active = true 
                AND o.user_id != $2 -- Não dar match consigo mesmo
                AND 1 - (o.embedding <=> $1) > 0.7 -- Mínimo de similaridade semântica
            ORDER BY semantic_score DESC
            LIMIT 10;
        `;

        const results = await AppDataSource.query(rawQuery, [
            embeddingString,
            request.user.id
        ]);

        const matches: Match[] = [];
        const matchRepo = AppDataSource.getRepository(Match);

        for (const res of results) {
            // Calcular Score Final

            // 1. Score de Distância (Haversine)
            let distanceScore = 0.5; // Neutro por padrão
            if (request.latitude && request.longitude && res.provider_lat && res.provider_long) {
                const dist = this.calculateDistance(
                    request.latitude,
                    request.longitude,
                    res.provider_lat,
                    res.provider_long
                );
                // Score: 1.0 se < 1km, decai até 0 em 50km
                distanceScore = Math.max(0, 1 - (dist / 50000));
            }

            // 2. Score de Reputação (Boost para Novos)
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

    private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371e3; // Raio da Terra em metros
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
}
