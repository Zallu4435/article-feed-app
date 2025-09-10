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

  @OneToMany(() => require("./UserPreference").UserPreference, (preference: any) => preference.user)
  preferences!: any[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (!this.password) return;

    const looksHashed = this.password.startsWith('$2a$') || this.password.startsWith('$2b$');
    if (looksHashed) return;
    this.password = await bcrypt.hash(this.password, 12);
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
