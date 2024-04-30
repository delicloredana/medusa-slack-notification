import { ClaimService } from "@medusajs/medusa";
import { MedusaContainer } from "@medusajs/types";
import { TemplateRes } from "../types";
import { PluginOptions } from "../services/slack-notification-sender";
import { KnownBlock } from "@slack/web-api";
import { Block } from "typescript";

export const EVENTS = [
  ClaimService.Events.CREATED,
  ClaimService.Events.CANCELED,
];

/**
 * https://docs.medusajs.com/development/events/events-list#claim-events
 */

export interface EventData {
  id: string;
  no_notification?: boolean;
}

export async function prepareTemplateData(
  eventName: string,
  { id, no_notification }: EventData,
  container: MedusaContainer
) {
  if (no_notification) {
    return;
  }

  const claimService = container.resolve<ClaimService>("claimService");

  const claim = await claimService.retrieve(id, {
    select: ["id", "order_id", "refund_amount", "type"],
    relations: [
      "claim_items",
      "claim_items.variant",
      "claim_items.variant.product",
      "additional_items",
      "additional_items.variant",
      "return_order",
      "return_order.items",
      "return_order.shipping_method",
      "return_order.shipping_method.shipping_option",
      "fulfillments",
      "order",
    ],
  });
  return claim;
}

export default function templateData(
  eventName: string,
  data: Awaited<ReturnType<typeof prepareTemplateData>>,
  options: PluginOptions
): TemplateRes {
  const blocks: (KnownBlock | Block)[] = [];
  blocks.push({
    type: "divider",
  });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `_Items to return_`,
    },
  });
  for (const item of data.claim_items) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*<${options.backend_url}/products/${item.variant.product_id}|#${
          item.variant.product.title
        }>*\n Description: \t${item.variant.title}\n Requested quantity: \t${
          item.quantity
        } \n Reason : \t${item.reason} ${
          item.note ? `\n Note: \t ${item.note}` : ``
        }`,
      },
      accessory: {
        type: "image",
        image_url: `${item.variant.product.thumbnail}`,
        alt_text: "Product image",
      },
    });
  }
  blocks.push({
    type: "divider",
  });
  if (data.type === "refund") {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: ` Refund amount: \t${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: data.order.currency_code.toUpperCase(),
          }).format(+(data.refund_amount / 100).toFixed(2))}`,
        },
      ],
    });
  } else {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `_Items to send_`,
      },
    });
    for (const item of data.additional_items) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*<${options.backend_url}/products/${item.variant.product_id}|#${item.title}>*\n Description: \t${item.description}\n Requested quantity: \t${item.quantity} \n Received quantity: \t${item.fulfilled_quantity}\n`,
        },
        accessory: {
          type: "image",
          image_url: `${item.thumbnail}`,
          alt_text: "Product image",
        },
      });
    }
    blocks.push({
      type: "divider",
    });

    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: ` Refund amount: \t${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: data.order.currency_code.toUpperCase(),
          }).format(+(data.return_order.refund_amount / 100).toFixed(2))}`,
        },
      ],
    });
  }
  return {
    message: {
      text: eventName.toUpperCase(),
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${eventName.toUpperCase()} *<${options.backend_url}/orders/${
              data.order_id
            }|#${data.order.display_id}>*`,
          },
        },
        ...blocks,
        {
          type: "divider",
        },
      ],
    },
    id: data.id,
  };
}
