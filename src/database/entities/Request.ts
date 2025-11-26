import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("requests")
export class Request {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    user_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column("text")
    description: string;

    @Column("vector", { length: 768, nullable: true })
    embedding: number[];

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    budget: number;

    @Column({ nullable: true, type: "float" })
    latitude: number;

    @Column({ nullable: true, type: "float" })
    longitude: number;

    @Column({ default: "PENDING" })
    status: string;

    @CreateDateColumn()
    created_at: Date;
}
