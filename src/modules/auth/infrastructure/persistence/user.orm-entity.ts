import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";
import { UserRole } from "../../domain/user.entity";

@Entity("users")
export class UserOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 255 })
  passwordHash!: string;

  @Column({
    type: "enum",
    enum: UserRole,
    enumName: "user_role_enum",
    default: UserRole.LEARNER,
  })
  role!: UserRole;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
