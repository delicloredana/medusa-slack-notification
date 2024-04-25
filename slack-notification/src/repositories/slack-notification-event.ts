import { dataSource } from "@medusajs/medusa/dist/loaders/database";
import { SlackNotificationEvent } from "../models/slack-notification-event";

const SlackNotificationEventRepository = dataSource.getRepository(
  SlackNotificationEvent
);

export default SlackNotificationEventRepository;
