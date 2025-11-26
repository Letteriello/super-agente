import "reflect-metadata";
import { AppDataSource, initDatabase } from "../database";
import { Orchestrator } from "../engine/orchestrator";
import { User } from "../database/entities/User";
import { aiService } from "../services/ai.service";

async function runSimulation() {
    console.log("🚀 Iniciando Simulação do Super Agente...");

    // 1. Inicializar Banco de Dados
    await initDatabase();

    // 2. Criar Usuário Mock
    const userRepo = AppDataSource.getRepository(User);
    let user = await userRepo.findOne({ where: { phone: "554799999999" } });
    if (!user) {
        user = userRepo.create({
            phone: "554799999999",
            name: "Tester Silva",
            latitude: -26.76,
            longitude: -48.63
        });
        await userRepo.save(user);
    }
    console.log(`👤 Usuário de Teste: ${user.name}`);

    // 3. Simular Mensagens
    const scenarios = [
        "Preciso de uma diarista para amanhã",
        "Perdi meu cachorro na praia",
        "Sou encanador e quero oferecer serviços",
        "Nota 5 para o serviço anterior"
    ];

    const orchestrator = new Orchestrator();

    for (const text of scenarios) {
        console.log(`\n💬 Mensagem: "${text}"`);

        // Analisar (Simulando o que o Worker faria)
        const analysis = await aiService.analyzeMessage(text);
        console.log(`🧠 Intenção Detectada: ${analysis.intent}`);

        // Roteamento
        const response = await orchestrator.route(user, text, analysis);
        console.log(`🤖 Resposta do Agente: "${response.text}"`);
    }

    console.log("\n✅ Simulação Concluída!");
    process.exit(0);
}

runSimulation().catch(console.error);
