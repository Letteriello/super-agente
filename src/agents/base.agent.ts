import { User } from "../database/entities/User";

export interface AgentResponse {
    text: string;
    metadata?: any;
}

export interface IAgent {
    name: string;
    description: string;
    execute(user: User, message: string, analysis: any, context?: string): Promise<AgentResponse>;
}
