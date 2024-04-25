import { BeforeInsert, Column, Entity } from "typeorm";
import { generateEntityId, BaseEntity } from "@medusajs/medusa";

import { IsNotEmpty } from "class-validator";

@Entity()
export class SlackNotificationEvent extends BaseEntity {
  @Column({ type: "varchar" })
  @IsNotEmpty()
  event_name: string;
  @Column({ type: "jsonb", nullable: true, default: null })
  value: unknown;
  @BeforeInsert()
  beforeInsert(): void {
    this.id = generateEntityId(this.id, "slack_event");
  }
}
