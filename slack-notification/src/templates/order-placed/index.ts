import { type Order } from "@medusajs/medusa";
import { ContextBlock, SectionBlock, DividerBlock } from "@slack/web-api";

export interface TemplateRes {
  title: string;
  blocks: (SectionBlock | ContextBlock | DividerBlock)[];
}

/*
 * Used for displaying admin preview.
 */
const ADMIN_SEED_DATA: Pick<Order, "items" | "refunded_total"> = {
};

export default function templateData(
  eventName: string,
  order?: Order
): TemplateRes {
  const orderData = order ? order : ADMIN_SEED_DATA

  return {
    title: eventName,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Total: ${order.total}`,
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Tax total: ${order.tax_total}`,
        },
      },
      {
        type: "divider",
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Test text",
          },
        ],
      },
    ],
  };
}
