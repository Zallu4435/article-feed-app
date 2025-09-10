import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { User } from "./User";
import { Category } from "./Category";

@Entity("articles")
export class Article {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ type: "simple-array", nullable: true })
  tags!: string[];

  @Column({ type: "boolean", default: false })
  isBlocked!: boolean;

  @Column({ type: "integer", default: 0 })
  viewsCount!: number;

  @Column({ type: "integer", default: 0 })
  likesCount!: number;

  @Column({ type: "simple-array", nullable: true })
  viewers!: string[];

  @Column({ type: "simple-array", nullable: true })
  likers!: string[];

  @Column({ type: "simple-array", nullable: true })
  bookmarkers!: string[];

  @Column({ type: "integer", default: 0 })
  bookmarksCount!: number;

  @Column({ type: "uuid" })
  authorId!: string;

  @Column({ type: "uuid" })
  categoryId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => require("./User").User)
  @JoinColumn({ name: "authorId" })
  author!: User;

  @ManyToOne(() => require("./Category").Category)
  @JoinColumn({ name: "categoryId" })
  category!: Category;
}
