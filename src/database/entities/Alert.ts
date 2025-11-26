import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { User } from "./User";

@Entity("alerts")
export class Alert {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "user_id" })
    user_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column()
    type: string; // 'LOST' | 'FOUND'

    @Column("text")
    description: string;

    @Column("vector", { length: 768, nullable: true })
    embedding: number[];

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    reward: number;

    @Column({ nullable: true, type: "float" })
    latitude: number;

    @Column({ nullable: true, type: "float" })
    longitude: number;

    @Column({ default: 1000 })
    radius_meters: number;

    @Column({ default: true })
    active: boolean;

    @CreateDateColumn()
    created_at: Date;
}
