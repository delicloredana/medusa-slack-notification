import {
  Fulfillment,
  Order,
  OrderService,
  Refund,
  Return,
  ReturnService,
} from "@medusajs/medusa";
import { MedusaContainer } from "@medusajs/types";
import { TemplateRes } from "../types";
import { PluginOptions } from "../services/slack-notification-sender";
import { KnownBlock } from "@slack/web-api";
import { Block } from "typescript";

export const EVENTS = [
  OrderService.Events.PLACED,
  OrderService.Events.CANCELED,
  OrderService.Events.RETURN_REQUESTED,
  OrderService.Events.ITEMS_RETURNED,
  OrderService.Events.RETURN_ACTION_REQUIRED,
  OrderService.Events.REFUND_CREATED,
  OrderService.Events.REFUND_FAILED,
  OrderService.Events.SHIPMENT_CREATED,
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
  { id, no_notification, return_id, refund_id, fulfillment_id }: EventData,
  container: MedusaContainer
) {
  if (no_notification) {
    return;
  }
  const orderService = container.resolve<OrderService>("orderService");
  const returnService = container.resolve<ReturnService>("returnService");
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
  switch (eventName) {
    case "order.placed":
    case "order.canceled":
      return order;
    case "order.shipment_created":
      const fulfillment = order.fulfillments.find(
        (f) => f.id === fulfillment_id
      );
      return { ...order, fulfillment: fulfillment };

    case "order.refund_created":
    case "order.refund_failed":
      const refund = order.refunds.find((o) => o.id === refund_id);
      return { ...order, refund: refund };
    case "order.return_requested":
    case "order.items_returned":
    case "order.return_action_required":
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
}

export default function templateData(
  eventName: string,
  data: Awaited<ReturnType<typeof prepareTemplateData>>,
  options: PluginOptions
): TemplateRes {
  const blocks: (KnownBlock | Block)[] = [];
  switch (eventName) {
    case "order.refund_created":
    case "order.refund_failed":
      const refundData = data as Order & { refund: Refund };
      blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: ` Refund amount: \t${new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: refundData.currency_code.toUpperCase(),
            }).format(
              +(refundData.refund.amount / 100).toFixed(2)
            )} \n Reason : \t${refundData.refund.reason} ${
              refundData.refund.note && ` \n Note : \t${refundData.refund.note}`
            }`,
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
                  options.backend_url || "http://localhost:9000/app/a"
                }/orders/${data.id}|#${refundData.display_id}>*`,
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
    case "order.shipment_created":
      const fulfillmentData = data as Order & { fulfillment: Fulfillment };
      const itemIds = fulfillmentData.fulfillment.items.map(
        (item) => item.item_id
      );
      data.items.forEach((item) => {
        if (itemIds.includes(item.id)) {
          blocks.push({
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*<${options.backend_url}/products/${
                item.variant.product_id
              }|#${item.title}>*\n Description: \t${
                item.description
              }\n Quantity: \t${
                item.quantity
              } \n Total: \t${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: fulfillmentData.currency_code.toUpperCase(),
              }).format(+(item.total / 100).toFixed(2))}`,
            },
            accessory: {
              type: "image",
              image_url: `${item.thumbnail}`,
              alt_text: "Product image",
            },
          });
        }
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
                  options.backend_url || "http://localhost:9000/app/a"
                }/orders/${fulfillmentData.id}|#${
                  fulfillmentData.display_id
                }>*`,
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
                    currency: fulfillmentData.currency_code.toUpperCase(),
                  }).format(
                    +(fulfillmentData.subtotal / 100).toFixed(2)
                  )} \n Shipping: \t ${new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: fulfillmentData.currency_code.toUpperCase(),
                  }).format(
                    +(fulfillmentData.shipping_total / 100).toFixed(2)
                  )}\n Discount: \t ${new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: fulfillmentData.currency_code.toUpperCase(),
                  }).format(
                    +(fulfillmentData.discount_total / 100).toFixed(2)
                  )}\n Total: \t ${new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: fulfillmentData.currency_code.toUpperCase(),
                  }).format(+(fulfillmentData.total / 100).toFixed(2))}`,
                },
              ],
            },
            {
              type: "divider",
            },
          ],
        },
        id: fulfillmentData.id,
      };
    case "order.placed":
    case "order.canceled":
      const orderData = data as Order;
      orderData.items.forEach((item) => {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*<${options.backend_url}/products/${
              item.variant.product_id
            }|#${item.title}>*\n Description: \t${
              item.description
            }\n Quantity: \t${
              item.quantity
            } \n Total: \t${new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: orderData.currency_code.toUpperCase(),
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
        id: orderData.id,
        message: {
          text: eventName,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `${eventName.toUpperCase()} *<${
                  options.backend_url
                }/orders/${orderData.id}|#${orderData.display_id}>*`,
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
                    currency: orderData.currency_code.toUpperCase(),
                  }).format(
                    +(orderData.subtotal / 100).toFixed(2)
                  )} \n Shipping: \t ${new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: orderData.currency_code.toUpperCase(),
                  }).format(
                    +(orderData.shipping_total / 100).toFixed(2)
                  )}\n Discount: \t ${new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: orderData.currency_code.toUpperCase(),
                  }).format(
                    +(orderData.discount_total / 100).toFixed(2)
                  )}\n Total: \t ${new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: orderData.currency_code.toUpperCase(),
                  }).format(+(orderData.total / 100).toFixed(2))}`,
                },
              ],
            },
            {
              type: "divider",
            },
          ],
        },
      };
    case "order.return_requested":
    case "order.items_returned":
    case "order.return_action_required":
      const returnedData = data as Return;
      returnedData.items.forEach((i) => {
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
              currency: returnedData.order.currency_code.toUpperCase(),
            }).format(+(returnedData.refund_amount / 100).toFixed(2))}`,
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
                }/orders/${returnedData.order.id}|#${
                  returnedData.order.display_id
                }>*`,
              },
            },
            ...blocks,
            {
              type: "divider",
            },
          ],
        },
        id: returnedData.id,
      };
  }
}
