import { Queue } from "bullmq";
import { redisConnection } from "../utils/redis";

// Fila para processar mensagens recebidas do WhatsApp (Webhook)
export const messageQueue = new Queue("messages", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
        removeOnComplete: true,
    },
});

// Fila para processar o algoritmo de Match (Pesada)
export const matchingQueue = new Queue("matching", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
    },
});

// Fila para enviar notificações/mensagens (Rate Limit safe)
export const notificationQueue = new Queue("notifications", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: "fixed",
            delay: 5000, // Espera 5s se falhar (ex: WhatsApp fora)
        },
        removeOnComplete: true,
    },
});

export const initQueues = async () => {
    console.log("🚀 Filas Inicializadas: messages, matching, notifications");
};
