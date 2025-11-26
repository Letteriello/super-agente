import { AppDataSource } from "../database";
import { Transaction } from "../database/entities/Transaction";
import { Match } from "../database/entities/Match";
import { evolutionService } from "../services/evolution.service";

export class PaymentService {

    // Gerar Cobrança PIX (Match-First)
    static async createPaymentForMatch(matchId: string): Promise<Transaction | null> {
        const matchRepo = AppDataSource.getRepository(Match);
        const match = await matchRepo.findOne({
            where: { id: matchId },
            relations: ["request", "request.user", "offer", "offer.user"]
        });

        if (!match) return null;

        const amount = match.offer.price_range || match.request.budget || 0;
        if (amount <= 0) return null;

        const fee = amount * 0.10; // 10% de taxa

        // TODO: Integrar com API Real (EFI/MercadoPago)
        // Por enquanto, vamos simular um PIX Copia e Cola
        const mockPixCode = `00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540${amount.toFixed(2).replace('.', '')}5802BR5913Super Agente6008Brasilia62070503***6304`;

        const transactionRepo = AppDataSource.getRepository(Transaction);
        const transaction = transactionRepo.create({
            match: match,
            payer: match.request.user,
            payee: match.offer.user,
            amount: amount,
            fee: fee,
            status: "PENDING",
            pix_code: mockPixCode,
            external_id: `pix_${Date.now()}`
        });

        await transactionRepo.save(transaction);

        // Enviar PIX para o Cliente
        await evolutionService.sendText(
            match.request.user.phone,
            `💰 Pagamento Seguro\n\nValor: R$ ${amount.toFixed(2)}\n\nCopie o código abaixo para pagar e liberar o contato:`
        );
        await evolutionService.sendText(match.request.user.phone, mockPixCode);

        return transaction;
    }

    // Webhook de Confirmação de Pagamento
    static async handlePaymentWebhook(externalId: string) {
        const transactionRepo = AppDataSource.getRepository(Transaction);
        const transaction = await transactionRepo.findOne({
            where: { external_id: externalId },
            relations: ["match", "match.request.user", "match.offer.user"]
        });

        if (!transaction || transaction.status === "PAID") return;

        // Atualizar Status
        transaction.status = "PAID";
        await transactionRepo.save(transaction);

        // Liberar Contatos
        const client = transaction.match.request.user;
        const provider = transaction.match.offer.user;

        await evolutionService.sendText(
            client.phone,
            `✅ Pagamento Confirmado!\n\nContato do Prestador: ${provider.name}\nTelefone: ${provider.phone.split('@')[0]}\n\nBoa sorte!`
        );

        await evolutionService.sendText(
            provider.phone,
            `✅ Serviço Confirmado!\n\nCliente: ${client.name}\nTelefone: ${client.phone.split('@')[0]}\n\nCombine os detalhes!`
        );
    }
}
