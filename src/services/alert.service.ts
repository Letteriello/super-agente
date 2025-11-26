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

        return newAlert;
    }

    static async broadcastAlert(alert: Alert) {
        const userRepo = AppDataSource.getRepository(User);

        // Encontrar usuários num raio de X metros (padrão 1000m)
        // Usando PostGIS: ST_DWithin(location, alert_location, radius)
        const nearbyUsers = await userRepo
            .createQueryBuilder("user")
            .where("ST_DWithin(user.location, ST_SetSRID(ST_MakePoint(:long, :lat), 4326), :radius)")
            .andWhere("user.id != :userId") // Não enviar para o próprio dono
            .setParameters({
                long: alert.location.coordinates[0],
                lat: alert.location.coordinates[1],
                radius: alert.radius_meters,
                userId: alert.user.id
            })
            .getMany();

        console.log(`📢 Enviando Alerta para ${nearbyUsers.length} vizinhos...`);

        const message = `🚨 *ALERTA DE VIZINHANÇA* 🚨\n\n` +
            `O vizinho ${alert.user.name.split(" ")[0]} perdeu: *${alert.description}*\n` +
            `📍 Perto de você.\n` +
            (alert.reward ? `💰 Recompensa: R$ ${alert.reward}\n` : "") +
            `\nSe você encontrar, responda aqui!`;

        // Disparar mensagens (com delay para evitar ban)
        for (const user of nearbyUsers) {
            await evolutionService.sendText(user.phone, message);
            await new Promise(r => setTimeout(r, 1000)); // 1s delay
        }
    }
}
