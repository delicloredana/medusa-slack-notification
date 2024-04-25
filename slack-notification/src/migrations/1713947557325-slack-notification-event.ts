import { MigrationInterface, QueryRunner } from "typeorm";

export class SlackNotificationEvent1713947557325 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
            CREATE TABLE IF NOT EXISTS "slack_notification_event" 
            (
               "id" character varying NOT NULL,
               "event_name" character varying NOT NULL,
               "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
               "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
               "value" character varying,
               CONSTRAINT "PK_c6fb082a31d2e2f4g5h6i7j8k9c" PRIMARY KEY ("id")
            )
        `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_event_name" ON "slack_notification_event" ("event_name")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "slack_notification_event"`);
  }
}
