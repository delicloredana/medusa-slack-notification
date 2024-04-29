import { Order, OrderService, ReturnService } from "@medusajs/medusa";
import { MedusaContainer } from "@medusajs/types";
import { TemplateRes } from "../types";
import { PluginOptions } from "../services/slack-notification-sender";

export const EVENTS = [
  OrderService.Events.PLACED,
  OrderService.Events.CANCELED,
  OrderService.Events.RETURN_REQUESTED,
  OrderService.Events.ITEMS_RETURNED,
  OrderService.Events.RETURN_ACTION_REQUIRED,
];

/**
 * https://docs.medusajs.com/development/events/events-list#order-events
 */

export interface EventData {
  id: string;
  no_notification?: boolean;
  return_id?: string;
  fulfillment_id?: string;
  refund_id?: string;
}

export async function prepareTemplateData(
  eventName: string,
  { id, no_notification, return_id }: EventData,
  container: MedusaContainer
) {
  if (no_notification) {
    return;
  }
  switch (eventName) {
    case "order.placed":
    case "order.canceled":
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
    case "order.return_requested":
    case "order.items_returned":
    case "order.return_action_required":
      const returnService = container.resolve<ReturnService>("returnService");

      const returnData = await returnService.retrieve(return_id, {
        relations: [
          "order",
          "items",
          "order",
          "items.item",
          "items.item.variant",
          "items.item.variant.product",
          "shipping_method",
          "shipping_method.shipping_option",
        ],
      });
      return returnData;
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
  data: Awaited<ReturnType<typeof prepareTemplateData>>,
  options: PluginOptions
): TemplateRes {
  if ("display_id" in data) {
    const blocks: any[] = [];
    data.items.forEach((item) => {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*<${options.backend_url}/products/${
            item.variant.product_id
          }|#${item.title}>*\n Description: \t${
            item.description
          }\n Quantity: \t${item.quantity} \n Total: \t${new Intl.NumberFormat(
            "en-US",
            {
              style: "currency",
              currency: data.currency_code.toUpperCase(),
            }
          ).format(+(item.total / 100).toFixed(2))}`,
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
              text: `${eventName.toUpperCase()} *<${
                options.backend_url
              }/orders/${data.id}|#${data.display_id}>*`,
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
  } else {
    const blocks: any[] = [];
    data.items.forEach((i) => {
      blocks.push({
        type: "divider",
      });
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*<${options.backend_url}/products/${i.item.variant.product_id}|#${i.item.variant.product.title}>*\n Description: \t${i.item.description}\n Requested quantity: \t${i.requested_quantity} \n Received quantity: \t${i.received_quantity}`,
        },
        accessory: {
          type: "image",
          image_url: `${i.item.thumbnail}`,
          alt_text: "Product image",
        },
      });
    });
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
          }).format(+(data.refund_amount / 100).toFixed(2))}`,
        },
      ],
    });

    return {
      message: {
        text: eventName.toUpperCase(),
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${eventName.toUpperCase()} *<${
                options.backend_url
              }/orders/${data.order.id}|#${data.order.display_id}>*`,
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
}
