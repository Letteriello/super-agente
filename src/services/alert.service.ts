import { AppDataSource } from "../database";
import { Alert } from "../database/entities/Alert";
import { User } from "../database/entities/User";
import { evolutionService } from "./evolution.service";

export class AlertService {

    static async createAlert(data: Partial<Alert>, user: User) {
        const alertRepo = AppDataSource.getRepository(Alert);

        const newAlert = alertRepo.create({
            ...data,
            user: user,
            active: true
        });

        await alertRepo.save(newAlert);

        // Iniciar Broadcast se for um item perdido
        if (newAlert.type === "LOST") {
            this.broadcastAlert(newAlert);
        }
    }

    static async broadcastAlert(alert: Alert) {
        if (!alert.latitude || !alert.longitude) return;

        const userRepo = AppDataSource.getRepository(User);

        // Fórmula de Haversine em SQL Puro (6371km * 1000 = 6371000 metros)
        const users = await userRepo
            .createQueryBuilder("user")
            .where("user.id != :userId", { userId: alert.user.id })
            .andWhere(`
                (
                    6371000 * acos(
                        cos(radians(:lat)) * cos(radians(user.latitude)) *
                        cos(radians(user.longitude) - radians(:lon)) +
                        sin(radians(:lat)) * sin(radians(user.latitude))
                    )
                ) <= :radius
            `, {
                lat: alert.latitude,
                lon: alert.longitude,
                radius: alert.radius_meters
            })
            .getMany();

        console.log(`📢 Broadcast: Encontrados ${users.length} usuários próximos.`);

        for (const user of users) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay anti-spam
            const message = `🚨 *ALERTA DE ${alert.type === 'LOST' ? 'PERDIDO' : 'ACHADO'}*\n\n${alert.description}\n\n📍 Próximo a você!`;
            await evolutionService.sendText(user.phone, message);
        }
    }
}
