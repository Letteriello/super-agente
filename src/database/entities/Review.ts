import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Match } from "./Match";
import { User } from "./User";

@Entity("reviews")
export class Review {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    match_id: string;

    @ManyToOne(() => Match)
    @JoinColumn({ name: "match_id" })
    match: Match;

    @Column()
    reviewer_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "reviewer_id" })
    reviewer: User;

    @Column()
    reviewed_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "reviewed_id" })
    reviewed: User;

    @Column("int")
    rating: number;

    @Column({ type: "text", nullable: true })
    comment: string;

    @CreateDateColumn()
    created_at: Date;
}
