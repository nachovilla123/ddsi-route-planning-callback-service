import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { WebhookStatus } from './webhook-status.enum';

//? DOCS: webhookOutBox nos permite almacenar los webhooks que tenemos que enviar a los clientes,
//?  con su status de entrega, para luego tener un proceso que se encargue de reintentar
//?  los que hayan fallado. Esto es necesario porque el envío de webhooks no es parte del
//? request-response cycle del endpoint de planificación de rutas, y puede fallar por diversos motivos
//? (problemas de red, el cliente tiene su servidor caído, etc). Almacenando los webhooks en esta
//? tabla podemos asegurarnos de que eventualmente serán entregados, incluso si hay fallos temporales.
@Entity('webhook_outbox')
export class WebhookOutbox {
  @PrimaryColumn('uuid')
  id: string;

  //TODO: cambiar a many to one??
  @Column({ name: 'request_id', type: 'uuid' })
  requestId: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

 @Column({
    type: 'enum',
    enum: WebhookStatus,
    default: WebhookStatus.PENDING,
  })
  status: WebhookStatus;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ name: 'last_attempt_at', type: 'timestamptz', nullable: true })
  lastAttemptAt: Date | null;

  @Column({ name: 'next_attempt_at', type: 'timestamptz' })
  nextAttemptAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
