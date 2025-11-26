import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    phone: string;

    @Column({ nullable: true })
    name: string;

    @Index({ spatial: true })
    @Column({
        type: "geography",
        spatialFeatureType: "Point",
        srid: 4326,
        nullable: true
    })
    location: any; // GeoJSON Point

    @Column({ type: "text", nullable: true })
    address: string;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    rating_sum: number;

    @Column({ default: 0 })
    rating_count: number;

    // rating_average is a generated column, so we might not need to map it for writes, but good for reads
    @Column({ type: "decimal", precision: 3, scale: 2, insert: false, update: false, nullable: true })
    rating_average: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
