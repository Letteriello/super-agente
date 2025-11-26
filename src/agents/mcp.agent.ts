import { IAgent, AgentResponse } from "./base.agent";
import { User } from "../database/entities/User";
import { MCPClientService } from "../services/mcp.client";

export class MCPAgent implements IAgent {
    name = "MCP Agent";
    description = "Agente capaz de usar ferramentas externas via Protocolo MCP.";
    private mcpClient: MCPClientService;

    constructor() {
        this.mcpClient = new MCPClientService();
        // TODO: Conectar a servidores reais configurados no .env
        // this.mcpClient.connect("npx", ["-y", "@modelcontextprotocol/server-filesystem", "./"]);
    }

    async execute(user: User, message: string, analysis: any, context?: string): Promise<AgentResponse> {
        // 1. Listar Ferramentas Disponíveis
        // const tools = await this.mcpClient.listTools();

        // 2. Usar LLM para decidir qual ferramenta chamar (ReAct pattern)
        // Por enquanto, vamos mockar uma resposta

        return { text: "O módulo MCP está instalado, mas ainda não há servidores conectados." };
    }
}
