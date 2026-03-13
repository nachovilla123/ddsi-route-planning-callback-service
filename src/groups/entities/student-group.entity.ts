import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'student_groups' })
export class StudentGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'api_key', unique: true, type: 'uuid' })
  apiKey: string;

  @Column({ name: 'group_name', unique: true, type: 'varchar', length: 255 })
  groupName: string;

  @Column({ name: 'callback_url', length: 2048, type: 'varchar' })
  callbackUrl: string;

  @Column({ name: 'client_secret', type: 'varchar', length: 255 })
  clientSecret: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
