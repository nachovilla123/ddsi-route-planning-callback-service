import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoutingStatus } from './routing-status.enum';

@Entity('routing_requests')
export class RoutingRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'api_key', type: 'uuid' })
  apiKey: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: RoutingStatus,
    default: RoutingStatus.PENDING,
  })
  status: RoutingStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
