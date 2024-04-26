import {
  ReturnItem,
  SwapService,
} from "@medusajs/medusa";
import { MedusaContainer } from "@medusajs/types";
import { TemplateRes } from "../types";

export const EVENTS = [SwapService.Events.CREATED];
export interface EventData {
    id: string;
    no_notification?: boolean;
  }
export async function prepareTemplateData(
  eventName: string,
  { id, no_notification }: EventData,
  container: MedusaContainer,
) {
  if (no_notification) {
    return;
  }

  const swapService = container.resolve<SwapService>("swapService");

  const swap = await swapService.retrieve(id, {
    select: [
      "order.display_id",
      "order.currency_code",
      "id",
      "difference_due",
      "cart.total",
      "order_id",
    ],
    relations: [
      "additional_items",
      "order",
      "return_order",
      "return_order.items",
      "return_order.items.item",
      "return_order.items.item.variant",
      "additional_items.variant",
      "return_order.shipping_method",
      "return_order.shipping_method.shipping_option",
      "fulfillments",
      "cart",
    ],
  });

  return swap;
}
export default function templateData(
  eventName: string,
  data: Awaited<ReturnType<typeof prepareTemplateData>>
): TemplateRes {
  const blocks: any[] = [];
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
  for (const item of data.return_order.items as ReturnItem[]) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*<${"http://localhost:9000/app/a"}/products/${
          item.item.variant.product_id
        }|#${item.item.title}>*\n Description: \t${
          item.item.description
        }\n Requested quantity: \t${
          item.requested_quantity
        } \n Received quantity: \t${item.received_quantity}`,
      },
      accessory: {
        type: "image",
        image_url: `${item.item.thumbnail}`,
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
        text: `Refund amount: \t ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: data.order.currency_code.toUpperCase(),
        }).format(+(data.return_order.refund_amount / 100).toFixed(2))}`,
      },
    ],
  });
  blocks.push({
    type: "divider",
  });
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
        text: `*<${"http://localhost:9000/app/a"}/products/${
          item.variant.product_id
        }|#${item.title}>*\n Description: \t${
          item.description
        }\n Requested quantity: \t${item.quantity} \n Received quantity: \t${
          item.fulfilled_quantity
        }`,
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
        text: `Cart total: \t ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: data.order.currency_code.toUpperCase(),
        }).format(+(data.cart.total / 100).toFixed(2))}`,
      },
    ],
  });
  blocks.push({
    type: "divider",
  });
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Difference due: \t ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: data.order.currency_code.toUpperCase(),
        }).format(+(data.difference_due / 100).toFixed(2))}`,
      },
    ],
  });
  return {
    message: {
      text: eventName,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${eventName.toUpperCase()} *<${"http://localhost:9000/app/a"}/orders/${
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
