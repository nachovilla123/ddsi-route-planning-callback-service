import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE routing_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
            CREATE TYPE webhook_status AS ENUM ('PENDING', 'DELIVERED', 'FAILED');

            CREATE TABLE student_groups (
                id UUID PRIMARY KEY,
                api_key UUID NOT NULL UNIQUE,
                group_name VARCHAR(255) NOT NULL UNIQUE,
                callback_url VARCHAR(2048) NOT NULL,
                client_secret VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE routing_requests (
                id UUID PRIMARY KEY,
                group_id UUID NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
                payload JSONB NOT NULL,
                status routing_status NOT NULL DEFAULT 'PENDING',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE webhook_outbox (
                id UUID PRIMARY KEY,
                request_id UUID NOT NULL REFERENCES routing_requests(id),
                group_id UUID NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
                payload JSONB NOT NULL,
                status webhook_status NOT NULL DEFAULT 'PENDING',
                retry_count INT NOT NULL DEFAULT 0,
                next_attempt_at TIMESTAMPTZ NOT NULL,
                last_attempt_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            
            CREATE INDEX idx_routing_requests_pending ON routing_requests (status, created_at) 
            WHERE status = 'PENDING';

            CREATE INDEX idx_webhook_outbox_pending ON webhook_outbox (status, next_attempt_at) 
            WHERE status = 'PENDING';
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_webhook_outbox_pending;`);
    await queryRunner.query(`DROP INDEX idx_routing_requests_pending;`);
    await queryRunner.query(`DROP TABLE webhook_outbox;`);
    await queryRunner.query(`DROP TABLE routing_requests;`);
    await queryRunner.query(`DROP TABLE student_groups;`);
    await queryRunner.query(`DROP TYPE webhook_status;`);
    await queryRunner.query(`DROP TYPE routing_status;`);
  }
}
