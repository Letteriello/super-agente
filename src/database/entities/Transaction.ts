import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Match } from "./Match";
import { User } from "./User";

@Entity("transactions")
export class Transaction {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    match_id: string;

    @ManyToOne(() => Match)
    @JoinColumn({ name: "match_id" })
    match: Match;

    @Column()
    payer_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "payer_id" })
    payer: User;

    @Column()
    payee_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "payee_id" })
    payee: User;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    fee: number;

    @Column({ default: "PENDING" })
    status: string;

    @Column({ type: "text", nullable: true })
    pix_code: string;

    @Column({ nullable: true })
    external_id: string;

    @CreateDateColumn()
    created_at: Date;
}
