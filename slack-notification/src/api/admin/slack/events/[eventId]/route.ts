import { type MedusaRequest, type MedusaResponse } from "@medusajs/medusa";
import { MedusaError } from "@medusajs/utils";
import SlackNotificationSenderService from "../../../../../services/slack-notification-sender";

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const slackNotificationSenderService: SlackNotificationSenderService =
    req.scope.resolve("slackNotificationSenderService");
  const eventId = req.params.eventId;
  const result = await slackNotificationSenderService.deleteEvent(eventId);
  res.json({
    event: result,
  });
};
