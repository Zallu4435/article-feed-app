import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";

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

  @ManyToOne(() => require("./User").User, (user: any) => user.preferences)
  @JoinColumn({ name: "userId" })
  user!: any;

  @ManyToOne(() => require("./Category").Category, (category: any) => category.userPreferences)
  @JoinColumn({ name: "categoryId" })
  category!: any;
}
