import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { z } from "zod";
import SlackNotificationSenderService from "../../../../services/slack-notification-sender";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const slackNotificationSenderService: SlackNotificationSenderService =
    req.scope.resolve("slackNotificationSenderService");
  const events = await slackNotificationSenderService.retrieveEvents();
  res.json({
    events,
  });
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const slackNotificationSenderService: SlackNotificationSenderService =
    req.scope.resolve("slackNotificationSenderService");

  const event = await slackNotificationSenderService.postEvent(req.body);
  res.json({
    event,
  });
};
