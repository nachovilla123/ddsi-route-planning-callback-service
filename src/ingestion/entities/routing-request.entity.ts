import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoutingStatus } from './routing-status.enum';
import type { RoutingPayload } from './routing-payload';

@Entity('routing_requests')
export class RoutingRequest {
  @PrimaryColumn('uuid')
  id: string;


  //TODO: cambiar a many to one??
  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @Column({ type: 'jsonb' })
  payload: RoutingPayload;

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
