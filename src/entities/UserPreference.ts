import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import type { User } from "./User";
import type { Category } from "./Category";

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

  @ManyToOne(() => require("./User").User, (user: User) => user.preferences)
  @JoinColumn({ name: "userId" })
  user!: User;

  @ManyToOne(() => require("./Category").Category, (category: Category) => category.userPreferences)
  @JoinColumn({ name: "categoryId" })
  category!: Category;
}
