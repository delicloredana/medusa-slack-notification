import {
  ConfigModule,
  MedusaContainer,
  NotificationService,
} from "@medusajs/medusa";

export default async (container: MedusaContainer): Promise<void> => {
  const notificationService = container.resolve<NotificationService>(
    "notificationService"
  );
  const config = container.resolve<ConfigModule>("configModule");
  const slackPlugin = config.plugins.find(
    (plugin) =>
      typeof plugin === "object" &&
      plugin.resolve === "medusa-plugin-slack-notification"
  );
  if (slackPlugin) {
    if (typeof slackPlugin === "object" && slackPlugin.options.events) {
      (slackPlugin.options.events as string[]).map((event) =>
        notificationService.subscribe(event, "slack-notification-sender")
      );
      return;
    }
  }
  const events = [
    "order.shipment_created",
    "order.placed",
    "order.canceled",
    "order.return_requested",
    "order.items_returned",
    "order.return_action_required",
    "order.refund_created",
    "order.refund_failed",
    "claim.created",
    "claim.canceled",
    "claim.shipment_created",
    "swap.created",
    "swap.received",
    "swap.shipment_created",
    "swap.payment_completed",
    "swap.process_refund_failed",
    "swap.refund_processed",
  ];
  events.map((event) =>
    notificationService.subscribe(event, "slack-notification-sender")
  );
};
