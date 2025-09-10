import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { User } from "./User";
import { Category } from "./Category";

@Entity("user_preferences")
export class UserPreference {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "uuid" })
  categoryId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.preferences)
  @JoinColumn({ name: "userId" })
  user!: User;

  @ManyToOne(() => Category, (category) => category.userPreferences)
  @JoinColumn({ name: "categoryId" })
  category!: Category;
}
