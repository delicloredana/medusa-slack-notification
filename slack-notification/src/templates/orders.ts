import { OrderService } from "@medusajs/medusa";
import { MedusaContainer } from "@medusajs/types";
import { TemplateRes } from "../types";

export const EVENTS = [
  OrderService.Events.PLACED,
  OrderService.Events.CANCELED,
];

/**
 * https://docs.medusajs.com/development/events/events-list#order-events
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

  const orderService = container.resolve<OrderService>("orderService");

  const order = await orderService.retrieve(id, {
    select: [
      "shipping_total",
      "discount_total",
      "tax_total",
      "subtotal",
      "total",
      "refunded_total",
      "paid_total",
    ],
    relations: [
      "customer",
      "billing_address",
      "shipping_address",
      "discounts",
      "discounts.rule",
      "shipping_methods",
      "payments",
      "items",
      "fulfillments",
    ],
  });

  return order;
}

export default function templateData(
  eventName: string,
  data: Awaited<ReturnType<typeof prepareTemplateData>>
): TemplateRes {
  const blocks: any[] = [];
  data.items.forEach((item) => {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*<${"http://localhost:9000/app/a"}/products/${
          item.variant.product_id
        }|#${item.title}>*\n Description: \t${item.description}\n Quantity: \t${
          item.quantity
        } \n Total: \t${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: data.currency_code.toUpperCase(),
        }).format(+(item.total / 100).toFixed(2))}`,
      },
      accessory: {
        type: "image",
        image_url: `${item.thumbnail}`,
        alt_text: "Product image",
      },
    });
  });
  return {
    id: data.id,
    message: {
      text: eventName,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${eventName.toUpperCase()} *<${"http://localhost:9000/app/a"}/orders/${
              data.id
            }|#${data.display_id}>*`,
          },
        },
        {
          type: "divider",
        },
        ...blocks,
        {
          type: "divider",
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Subotal: \t ${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: data.currency_code.toUpperCase(),
              }).format(
                +(data.subtotal / 100).toFixed(2)
              )} \n Shipping: \t ${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: data.currency_code.toUpperCase(),
              }).format(
                +(data.shipping_total / 100).toFixed(2)
              )}\n Discount: \t ${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: data.currency_code.toUpperCase(),
              }).format(
                +(data.discount_total / 100).toFixed(2)
              )}\n Total: \t ${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: data.currency_code.toUpperCase(),
              }).format(+(data.total / 100).toFixed(2))}`,
            },
          ],
        },
        {
          type: "divider",
        },
      ],
    },
  };
}
