import "reflect-metadata";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { initDatabase } from "./database";
import { WebhookController } from "./controllers/webhook.controller";

dotenv.config();

const app = express();
app.use(express.json());

import { AgentProtocolController } from "./controllers/agent.protocol.controller";

// Rota do Webhook (Evolution API deve apontar para cá)
app.post("/webhook", WebhookController.handleWebhook);

// Rotas do Agent Protocol (Para outros Agentes)
app.post("/agent/tasks", AgentProtocolController.createTask);
app.get("/agent/health", AgentProtocolController.health);

const PORT = process.env.PORT || 3000;

import "./workers/message.worker"; // Inicia o Worker de Mensagens
import "./workers/matching.worker"; // Inicia o Worker de Matches

const startServer = async () => {
    await initDatabase();

    app.get("/health", (req: Request, res: Response) => {
        res.json({ status: "ok", timestamp: new Date() });
    });

    app.listen(PORT, () => {
        console.log(`🚀 Super Agente rodando na porta ${PORT}`);
    });
};

startServer();
