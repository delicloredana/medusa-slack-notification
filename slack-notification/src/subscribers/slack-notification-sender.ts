import {
  ProductService,
  type SubscriberConfig,
  type SubscriberArgs,
  NotificationService,
} from "@medusajs/medusa";
import SlackNotificationSenderService from "../services/slack-notification-sender";


export default async function slackEventHandler({
  data,
  eventName,
  container,
  pluginOptions,
}: SubscriberArgs<Record<string, any>>) {
  // const slackNotificationSenderService: SlackNotificationSenderService =
  //   container.resolve("slackNotificationSenderService");

  const notificationService: NotificationService = container.resolve(
    "notificationService"
  );
  const slackNotificationSender = container.resolve("s")
  const notificationRepo = container.resolve("notificationRepo")

  // notificationRepo.save(notification)

}

export const config: SubscriberConfig = {
  event: ["slack.event.added"],
  context: {
    subscriberId: "slack-event-handler",
  },
};
