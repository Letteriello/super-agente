import { AppDataSource } from "../database";
import { Review } from "../database/entities/Review";
import { User } from "../database/entities/User";
import { Match } from "../database/entities/Match";

export class ReputationService {

    static async addReview(matchId: string, reviewerId: string, rating: number, comment: string) {
        const reviewRepo = AppDataSource.getRepository(Review);
        const matchRepo = AppDataSource.getRepository(Match);
        const userRepo = AppDataSource.getRepository(User);

        // 1. Validar Match
        const match = await matchRepo.findOne({
            where: { id: matchId },
            relations: ["request", "offer", "request.user", "offer.user"]
        });

        if (!match) throw new Error("Match não encontrado.");

        // 2. Identificar quem está sendo avaliado
        let reviewedUser: User;
        if (reviewerId === match.request.user.id) {
            reviewedUser = match.offer.user; // Cliente avaliando Prestador
        } else if (reviewerId === match.offer.user.id) {
            reviewedUser = match.request.user; // Prestador avaliando Cliente
        } else {
            throw new Error("Usuário não pertence a este match.");
        }

        // 3. Salvar Review
        const review = reviewRepo.create({
            match: match,
            reviewer: { id: reviewerId } as User,
            reviewed: reviewedUser,
            rating: rating,
            comment: comment
        });
        await reviewRepo.save(review);

        // 4. Recalcular Reputação do Usuário
        await this.updateUserReputation(reviewedUser.id);

        return review;
    }

    private static async updateUserReputation(userId: string) {
        const userRepo = AppDataSource.getRepository(User);
        const reviewRepo = AppDataSource.getRepository(Review);
        import { AppDataSource } from "../database";
        import { Review } from "../database/entities/Review";
        import { User } from "../database/entities/User";
        import { Match } from "../database/entities/Match";

        export class ReputationService {

            static async addReview(matchId: string, reviewerId: string, rating: number, comment: string) {
                const reviewRepo = AppDataSource.getRepository(Review);
                const matchRepo = AppDataSource.getRepository(Match);
                const userRepo = AppDataSource.getRepository(User);

                // 1. Validar Match
                const match = await matchRepo.findOne({
                    where: { id: matchId },
                    relations: ["request", "offer", "request.user", "offer.user"]
                });

                if (!match) throw new Error("Match não encontrado.");

                // 2. Identificar quem está sendo avaliado
                let reviewedUser: User;
                if (reviewerId === match.request.user.id) {
                    reviewedUser = match.offer.user; // Cliente avaliando Prestador
                } else if (reviewerId === match.offer.user.id) {
                    reviewedUser = match.request.user; // Prestador avaliando Cliente
                } else {
                    throw new Error("Usuário não pertence a este match.");
                }

                // 3. Salvar Review
                const review = reviewRepo.create({
                    match: match,
                    reviewer: { id: reviewerId } as User,
                    reviewed: reviewedUser,
                    rating: rating,
                    comment: comment
                });
                await reviewRepo.save(review);

                // 4. Recalcular Reputação do Usuário
                await this.updateUserReputation(reviewedUser.id);

                return review;
            }

            private static async updateUserReputation(userId: string) {
                const userRepo = AppDataSource.getRepository(User);
                const reviewRepo = AppDataSource.getRepository(Review);

                const reviews = await reviewRepo.find({ where: { reviewed: { id: userId } } });

                if (reviews.length === 0) return;

                const totalStars = reviews.reduce((acc, r) => acc + r.rating, 0);
                const average = totalStars / reviews.length;

                await userRepo.update(userId, {
                    rating_average: parseFloat(average.toFixed(2)),
                    rating_count: reviews.length
                });

                console.log(`⭐ Reputação de ${userId} atualizada para ${average.toFixed(2)} (${reviews.length} reviews)`);
            }
        }
