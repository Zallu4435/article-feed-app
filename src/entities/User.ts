import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany
} from "typeorm";
import * as bcrypt from "bcryptjs";
import type { UserPreference } from "./UserPreference";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  firstName!: string;

  @Column({ type: "varchar", length: 100 })
  lastName!: string;

  @Column({ type: "varchar", length: 20, unique: true })
  phone!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "date" })
  dateOfBirth!: Date;

  @Column({ type: "varchar", length: 255 })
  password!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  resetToken?: string;

  @Column({ type: "timestamp", nullable: true })
  resetTokenExpiry?: Date;

  @Column({ type: "varchar", length: 6, nullable: true })
  passwordResetOtp?: string;

  @Column({ type: "timestamp", nullable: true })
  passwordResetOtpExpiry?: Date;

  @Column({ type: "varchar", length: 500, nullable: true })
  profilePicture?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships are defined on owning sides (e.g., Article, UserPreference)

  @OneToMany('UserPreference', (preference: UserPreference) => preference.user)
  preferences!: UserPreference[];


  // Hash password before insert/update
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (!this.password) return;
    // Avoid double-hashing: if it already looks like a bcrypt hash, skip
    const looksHashed = this.password.startsWith('$2a$') || this.password.startsWith('$2b$');
    if (looksHashed) return;
    this.password = await bcrypt.hash(this.password, 12);
  }

  // Method to check password
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Method to get full name
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
