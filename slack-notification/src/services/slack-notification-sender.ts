import {
  AbstractNotificationService,
  ReturnedData,
  Notification,
} from "@medusajs/medusa";
import { WebClient } from "@slack/web-api";
import { TemplateRes } from "../types";
import { readdir } from "fs/promises";
import path from "path";

export type PluginOptions = {
  backend_url: string;
  channel: string;
  slack_api: string;
};

export type SlackNotificationData = {
  templateFileName: string;
  originalEventName: string;
  id: string;
  preparedData: Record<string, unknown>;
};

class SlackNotificationService extends AbstractNotificationService {
  static identifier = "slack-notification";
  protected client: WebClient;
  protected options: PluginOptions;
  private templates: Record<
    string,
    (
      eventName: string,
      preparedData: Record<string, unknown>,
      options: PluginOptions
    ) => TemplateRes
  >;

  constructor(container, options) {
    super(container);
    this.options = options;
    this.client = new WebClient(this.options?.slack_api);
  }

  async loadTemplates() {
    const rootDir = path.resolve(".");
    const templatesPath = path.join(
      rootDir,
      "../../slack-notification/dist/templates"
    );
    const files = await readdir(templatesPath);
    const templatesArray = await Promise.all(
      files.map(async (file) => {
        const [fileName] = file.split(".");
        const templateData = await import(
          `${templatesPath}/${fileName}`
        );

        return {
          [fileName]: templateData.default,
        };
      })
    );
    this.templates = Object.assign({}, ...templatesArray);
  }
  async sendNotification(
    event: string,
    data: SlackNotificationData
  ): Promise<ReturnedData> {
    if (!this.templates) {
      await this.loadTemplates();
    }
    const formattedMessage = this.templates[data.templateFileName](
      data.originalEventName,
      data.preparedData,
      this.options
    ).message;
    const slackMessage = await this.client.chat.postMessage({
      channel: this.options.channel,
      ...formattedMessage,
    });
    return {
      to: "slack",
      status: slackMessage.ok ? "sent" : "failed",
      data: formattedMessage as unknown as Record<string, unknown>,
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
}

export default SlackNotificationService;
