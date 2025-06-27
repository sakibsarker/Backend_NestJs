import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Role } from 'src/auth/roles.enum';

@Entity('users') // Table name
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: Role.Customer })
  role: Role;
}
