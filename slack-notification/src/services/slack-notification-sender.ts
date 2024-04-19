import {
  AbstractNotificationService,
  ClaimService,
  OrderService,
  SwapService,
  ReturnedData,
  Notification,
  FulfillmentProviderService,
  ReturnService,
  Order,
  Return,
  Swap,
  ClaimOrder,
} from "@medusajs/medusa";
import { WebClient } from "@slack/web-api";
import messages from "../data/messages";

export type PluginOptions = {
  backend_url: string;
  channel: string;
  slack_api: string;
  events?: string[];
  messages?: Record<string, Function>;
};

export type SlackNotificationSenderData = {
  id: string;
  return_id?: string;
  fulfillment_id?: string;
  refund_id?: string;
};

class SlackNotificationSenderService extends AbstractNotificationService {
  static identifier = "slack-notification-sender";

  protected client: WebClient;
  protected orderService: OrderService;
  protected returnService: ReturnService;
  protected claimService: ClaimService;
  protected swapService: SwapService;
  protected fulfillmentProviderService: FulfillmentProviderService;
  protected options: PluginOptions;
  protected messages
  constructor(container, options) {
    super(container);
    this.options = options;
    this.orderService = container.orderService;
    this.returnService = container.returnService;
    this.claimService = container.claimService;
    this.swapService = container.swapService;
    this.fulfillmentProviderService = container.fulfillmentProviderService;
    this.client = new WebClient(this.options?.slack_api);
    this.messages={...messages, ...options.messages}
  }

  async sendNotification(
    event: string,
    data: SlackNotificationSenderData,
    attachmentGenerator: unknown
  ): Promise<ReturnedData> {
    const fetchedData = await this.fetchData(event, data);
    const formattedMessage = this.getFormattedMessage(event, fetchedData);
    const slackMessage = await this.client.chat.postMessage({
      channel: this.options.channel,
      ...formattedMessage,
    });
    return {
      to: "slack",
      status: slackMessage.ok ? "sent" : "failed",
      data: formattedMessage,
    };
  }
  async resendNotification(
    notification: Notification,
    config: unknown,
    attachmentGenerator: unknown
  ): Promise<ReturnedData> {
    const slackMessage = await this.client.chat.postMessage({
      channel: this.options.channel,
      ...notification.data,
      attachments: [],
    });
    return {
      to: "slack",
      status: slackMessage.ok ? "sent" : "failed",
      data: notification.data,
    };
  }

  // async fetchAttachment(event: string, data, attachmentGenerator) {
  //   switch (event) {
  //     case "swap.created":
  //     case "order.return_requested": {
  //       let attachments = [];
  //       const returnOrder =
  //         event === "order.return_requested" ? data : data.return_order;
  //       const { shipping_method, shipping_data } = returnOrder;
  //       if (shipping_method) {
  //         const provider = shipping_method.shipping_option.provider_id;
  //         const lbl = await this.fulfillmentProviderService.retrieveDocuments(
  //           provider,
  //           shipping_data,
  //           "label"
  //         );
  //         attachments = attachments.concat(
  //           lbl.map((d) => ({
  //             name: "return-label",
  //             base64: d.base_64,
  //             type: d.type,
  //           }))
  //         );
  //       }

  //       if (attachmentGenerator && attachmentGenerator.createReturnInvoice) {
  //         const base64 = await attachmentGenerator.createReturnInvoice(
  //           data.order,
  //           data.return_request.items
  //         );
  //         attachments.push({
  //           name: "invoice",
  //           base64,
  //           type: "application/pdf",
  //         });
  //       }

  //       return attachments;
  //     }
  //     default:
  //       return [];
  //   }
  // }

  async fetchData(event: string, data: SlackNotificationSenderData) {
    const eventType = event.split(".")[0];
    let fetchedData;

    switch (eventType) {
      case "order":
        switch (event) {
          case "order.placed":
          case "order.canceled":
          case "order.shipment_created":
          case "order.refund_created":
          case "order.refund_failed":
            fetchedData = await this.orderService.retrieve(data.id, {
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
            break;
          case "order.return_requested":
          case "order.items_returned":
          case "order.return_action_required":
            fetchedData = await this.returnService.retrieve(data.return_id, {
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
            break;
        }

        break;
      case "claim":
        fetchedData = await this.claimService.retrieve(data.id, {
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
        break;
      case "swap":
        fetchedData = await this.swapService.retrieve(data.id, {
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
        break;
    }
    return { ...fetchedData, data };
  }
  getFormattedMessage(
    event: string,
    data:
      | Order
      | Return
      | Swap
      | ClaimOrder
      | (Order & { data: { fulfillment_id?: string; refund_id?: string } })
  ) {

    const text = event.split(/[._]+/).join(" ");
    const message = this.messages[event]
      ? this.messages[event](data, text, this.options)
      : {
          text: text.toUpperCase(),
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `${text.toUpperCase()}`,
              },
            },
            {
              type: "divider",
            },
          ],
        };

    return message;
  }
}

export default SlackNotificationSenderService;
