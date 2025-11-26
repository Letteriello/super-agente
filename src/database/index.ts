import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "./entities/User";
import { Offer } from "./entities/Offer";
import { Request } from "./entities/Request";
import { Match } from "./entities/Match";
import { Transaction } from "./entities/Transaction";
import { Review } from "./entities/Review";
import { Alert } from "./entities/Alert";
import { Memory } from "./entities/Memory";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: false, // Usamos schema.sql
    logging: false,
    entities: [User, Offer, Request, Match, Transaction, Review, Alert, Memory],
    subscribers: [],
    migrations: [],
});

export const initDatabase = async () => {
    try {
        await AppDataSource.initialize();
        console.log("📦 Banco de Dados Conectado com Sucesso!");
    } catch (error) {
        console.error("❌ Erro ao conectar no Banco de Dados:", error);
        process.exit(1);
    }
};
