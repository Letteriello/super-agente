import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Request } from "./Request";
import { Offer } from "./Offer";

@Entity("matches")
export class Match {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    request_id: string;

    @ManyToOne(() => Request)
    @JoinColumn({ name: "request_id" })
    request: Request;

    @Column()
    offer_id: string;

    @ManyToOne(() => Offer)
    @JoinColumn({ name: "offer_id" })
    offer: Offer;

    @Column({ type: "decimal", precision: 5, scale: 4 })
    score: number;

    @Column({ default: "PROPOSED" })
    status: string;

    @CreateDateColumn()
    created_at: Date;
}
