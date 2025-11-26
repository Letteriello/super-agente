import { Request, Response } from "express";
import { messageQueue } from "../services/queue.service";

export class WebhookController {

    // Recebe o Webhook da Evolution API
    static async handleWebhook(req: Request, res: Response) {
        try {
            const event = req.body;

            // Verifica se é uma mensagem recebida (ignora status, etc. por enquanto)
            if (event.type === "messages.upsert") {
                const messageData = event.data;

                // Ignora mensagens enviadas pelo próprio bot (fromMe)
                if (messageData.key.fromMe) {
                    return res.status(200).send("Ignored fromMe");
                }

                console.log("📩 Mensagem recebida:", messageData.key.remoteJid);

                // Enfileira para processamento assíncrono (não trava o webhook)
                await messageQueue.add("process-message", messageData);
            }

            return res.status(200).send("OK");
        } catch (error) {
            console.error("❌ Erro no Webhook:", error);
            return res.status(500).send("Internal Server Error");
        }
    }
}
