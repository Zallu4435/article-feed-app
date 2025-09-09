import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("email_verifications")
export class EmailVerification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 10 })
  otp!: string;

  @Column({ type: "timestamptz" })
  expiresAt!: Date;

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @CreateDateColumn()
  createdAt!: Date;
}


