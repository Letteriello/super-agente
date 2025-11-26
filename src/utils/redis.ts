import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redisConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // Necessário para BullMQ
});

redisConnection.on("connect", () => {
    console.log("🔌 Redis Conectado!");
});

redisConnection.on("error", (err: any) => {
    console.error("❌ Erro no Redis:", err);
});
