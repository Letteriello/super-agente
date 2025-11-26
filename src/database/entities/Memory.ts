import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { User } from "./User";

@Entity("memories")
export class Memory {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "user_id" })
    user_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column("text")
    content: string;

    @Column("vector", { length: 768, nullable: true })
    embedding: number[];

    @CreateDateColumn()
    created_at: Date;
}
