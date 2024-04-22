import { ClaimOrder, Order, Return, ReturnItem, Swap } from "@medusajs/medusa";
import { PluginOptions } from "../services/slack-notification-sender";

const messages = {
  "order.placed": (data: Order, text: string, options: PluginOptions) => {
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
      text: text.toUpperCase(),
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${text.toUpperCase()} *<${
              options.backend_url || "http://localhost:9000/app/a"
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
    };
  },
  "order.canceled": (data: Order, text: string, options: PluginOptions) =>
    messages["order.placed"](data, text, options),
  "order.shipment_created": (
    data: Order & { data: { fulfillment_id: string } },
    text: string,
    options: PluginOptions
  ) => {
    const blocks: any[] = [];
    const fulfillment = data.fulfillments.find(
      (f) => f.id === data.data.fulfillment_id
    );
    const itemIds = fulfillment.items.map((item) => item.item_id);
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
              currency: data.currency_code.toUpperCase(),
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
      text: text.toUpperCase(),
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${text.toUpperCase()} *<${
              options.backend_url || "http://localhost:9000/app/a"
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
    };
  },

  "order.return_requested": (
    data: Return,
    text: string,
    options: PluginOptions
  ) => {
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
      text: text.toUpperCase(),
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${text.toUpperCase()} *<${
              options.backend_url || "http://localhost:9000/app/a"
            }/orders/${data.order.id}|#${data.order.display_id}>*`,
          },
        },
        ...blocks,
        {
          type: "divider",
        },
      ],
    };
  },
  "order.items_returned": (
    data: Return,
    text: string,
    options: PluginOptions
  ) => messages["order.return_requested"](data, text, options),
  "order.return_action_required": (
    data: Return,
    text: string,
    options: PluginOptions
  ) => messages["order.return_requested"](data, text, options),
  "order.refund_created": (
    data: Order & { data: { refund_id: string } },
    text: string,
    options: PluginOptions
  ) => {
    const blocks: any[] = [];
    for (const refund of data.refunds) {
      if (refund.id === data.data.refund_id) {
        blocks.push({
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: ` Refund amount: \t${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: data.currency_code.toUpperCase(),
              }).format(+(refund.amount / 100).toFixed(2))} \n Reason : \t${
                refund.reason
              } ${refund.note && ` \n Note : \t${refund.note}`}`,
            },
          ],
        });
      }
    }
    return {
      text: text.toUpperCase(),
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${text.toUpperCase()} *<${
              options.backend_url || "http://localhost:9000/app/a"
            }/orders/${data.id}|#${data.display_id}>*`,
          },
        },
        ...blocks,
        {
          type: "divider",
        },
      ],
    };
  },
  "order.refund_failed": (
    data: Order & { data: { refund_id: string } },
    text: string,
    options: PluginOptions
  ) => messages["refund_created"](data, text, options),

  "swap.created": (data: Swap, text: string, options: PluginOptions) => {
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
          text: `*<${options.backend_url}/products/${item.item.variant.product_id}|#${item.item.title}>*\n Description: \t${item.item.description}\n Requested quantity: \t${item.requested_quantity} \n Received quantity: \t${item.received_quantity}`,
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
          text: `*<${options.backend_url}/products/${item.variant.product_id}|#${item.title}>*\n Description: \t${item.description}\n Requested quantity: \t${item.quantity} \n Received quantity: \t${item.fulfilled_quantity}`,
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
      text: text.toUpperCase(),
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${text.toUpperCase()} *<${
              options.backend_url || "http://localhost:9000/app/a"
            }/orders/${data.order_id}|#${data.order.display_id}>*`,
          },
        },
        ...blocks,
        {
          type: "divider",
        },
      ],
    };
  },
  "swap.received": (data: Swap, text: string, options: PluginOptions) => {
    const blocks: any[] = [];
    blocks.push({
      type: "divider",
    });
    for (const item of data.return_order.items) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*<${options.backend_url}/products/${item.item.variant.product_id}|#${item.item.title}>*\n Description: \t${item.item.description}\n Requested quantity: \t${item.requested_quantity} \n Received quantity: \t${item.received_quantity}`,
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
    return {
      text: text.toUpperCase(),
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${text.toUpperCase()} *<${
              options.backend_url || "http://localhost:9000/app/a"
            }/orders/${data.order_id}|#${data.order.display_id}>*`,
          },
        },
        ...blocks,
        {
          type: "divider",
        },
      ],
    };
  },
  "swap.shipment_created": (
    data: Swap,
    text: string,
    options: PluginOptions
  ) => {
    const blocks: any[] = [];
    blocks.push({
      type: "divider",
    });
    for (const item of data.additional_items) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*<${options.backend_url}/products/${item.variant.product_id}|#${item.title}>*\n Description: \t${item.description}\n Requested quantity: \t${item.quantity} \n Received quantity: \t${item.fulfilled_quantity}`,
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
    return {
      text: text.toUpperCase(),
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${text.toUpperCase()} *<${
              options.backend_url || "http://localhost:9000/app/a"
            }/orders/${data.order_id}|#${data.order.display_id}>*`,
          },
        },
        ...blocks,
        {
          type: "divider",
        },
      ],
    };
  },
  "swap.payment_completed": (
    data: Swap,
    text: string,
    options: PluginOptions
  ) => {
    return {
      text: text.toUpperCase(),
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${text.toUpperCase()} *<${
              options.backend_url || "http://localhost:9000/app/a"
            }/orders/${data.order_id}|#${data.order.display_id}>*`,
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Difference due : \t ${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: data.order.currency_code.toUpperCase(),
              }).format(+(data.difference_due / 100).toFixed(2))}`,
            },
          ],
        },
        {
          type: "divider",
        },
      ],
    };
  },
  "claim.created": (data: ClaimOrder, text: string, options: PluginOptions) => {
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
    for (const item of data.claim_items) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*<${options.backend_url}/products/${
            item.variant.product_id
          }|#${item.variant.product.title}>*\n Description: \t${
            item.variant.title
          }\n Requested quantity: \t${item.quantity} \n Reason : \t${
            item.reason
          } ${item.note ? `\n Note: \t ${item.note}` : ``}`,
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
      text: text.toUpperCase(),
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${text.toUpperCase()} *<${
              options.backend_url || "http://localhost:9000/app/a"
            }/orders/${data.order_id}|#${data.order.display_id}>*`,
          },
        },
        ...blocks,
        {
          type: "divider",
        },
      ],
    };
  },
  "claim.canceled": (data: ClaimOrder, text: string, options: PluginOptions) =>
    messages["claim.created"](data, text, options),
  "claim.shipment_created": (
    data: ClaimOrder & { data: { fulfillment_id: string } },
    text: string,
    options: PluginOptions
  ) => {
    const blocks: any[] = [];
    const fulfillment = data.fulfillments.find(
      (f) => f.id === data.data.fulfillment_id
    );
    const itemIds = fulfillment.items.map((item) => item.item_id);
    blocks.push({
      type: "divider",
    });
    data.additional_items.forEach((item) => {
      if (itemIds.includes(item.id)) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*<${options.backend_url}/products/${item.variant.product_id}|#${item.title}>*\n Description: \t${item.description}\n Requested: \t${item.quantity}\n Received: \t${item.shipped_quantity}`,
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
      text: text.toUpperCase(),
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${text.toUpperCase()} *<${
              options.backend_url || "http://localhost:9000/app/a"
            }/orders/${data.order_id}|#${data.order.display_id}>*`,
          },
        },
        ...blocks,
        {
          type: "divider",
        },
      ],
    };
  },
};

export default messages;
