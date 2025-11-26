import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("offers")
export class Offer {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    user_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column({ nullable: true })
    category: string;

    @Column("text")
    description: string;

    @Column("vector", { length: 768, nullable: true })
    embedding: number[];

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    price_range: number;

    @Column({ default: true })
    active: boolean;

    @CreateDateColumn()
    created_at: Date;
}
