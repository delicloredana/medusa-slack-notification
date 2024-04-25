import {
  ConfigModule,
  EventBusService,
  MedusaContainer,
  NotificationService,
} from "@medusajs/medusa";
import SlackNotificationSenderService from "../services/slack-notification-sender";

export default async (container: MedusaContainer): Promise<void> => {
  const notificationService = container.resolve<NotificationService>(
    "notificationService"
  );
  const config = container.resolve<ConfigModule>("configModule");
  const slackNotificationSenderService =
    container.resolve<SlackNotificationSenderService>(
      "slackNotificationSenderService"
    );
  const eventBusService: EventBusService = container.resolve("eventBusService");
  // const slackPlugin = config.plugins.find(
  //   (plugin) =>
  //     typeof plugin === "object" &&
  //     plugin.resolve === "medusa-plugin-slack-notification"
  // );
  // if (slackPlugin) {
  //   if (typeof slackPlugin === "object" && slackPlugin.options.events) {
  //     (slackPlugin.options.events as string[]).map((event) =>
  //       notificationService.subscribe(event, "slack-notification-sender")
  //     );
  //     return;
  //   }
  // }
  // const events = [
  //   "order.shipment_created",
  //   "order.placed",
  //   "order.canceled",
  //   "order.return_requested",
  //   "order.items_returned",
  //   "order.return_action_required",
  //   "order.refund_created",
  //   "order.refund_failed",
  //   "claim.created",
  //   "claim.canceled",
  //   "claim.shipment_created",
  //   "swap.created",
  //   "swap.received",
  //   "swap.shipment_created",
  //   "swap.payment_completed",
  // ];
  const events = await slackNotificationSenderService.retrieveEvents();
  events.map((event) => {
    // notificationService.subscribe(
    //   event.event_name,
    //   "slack-notification-sender"
    // );
   
    eventBusService.emit(`slack.event.added`, { event :  event.event_name});
  });
};
