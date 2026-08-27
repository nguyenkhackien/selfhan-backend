import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { ContentStatus } from "../../domain/level.entity";

@Entity("vocabulary")
export class VocabularyOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 10 })
  hanzi!: string;

  @Column({ type: "varchar", length: 255 })
  pinyin!: string;

  @Column({ type: "varchar", length: 255 })
  meaningVi!: string;

  @Column({ type: "varchar", length: 512, nullable: true })
  audioUrl!: string | null;

  @Column({
    type: "enum",
    enum: ContentStatus,
    enumName: "content_status_enum",
    default: ContentStatus.DRAFT,
  })
  status!: ContentStatus;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
