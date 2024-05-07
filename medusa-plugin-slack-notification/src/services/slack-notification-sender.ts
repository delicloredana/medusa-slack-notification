import {
  AbstractNotificationService,
  ReturnedData,
  Notification,
} from "@medusajs/medusa";
import { WebClient } from "@slack/web-api";
import { TemplateRes } from "../types";
import { readdir } from "fs/promises";
import path from "path";
import fs from "fs";

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

const excludes: RegExp[] = [
  /\.DS_Store/,
  /(\.ts\.map|\.js\.map|\.d\.ts)/,
  /^_[^/\\]*(\.[^/\\]+)?$/,
];

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
    const templatesPath = path.join(rootDir, "/dist/templates");
    const pluginTemplatesPath = path.join(
      rootDir,
      "/node_modules/medusa-plugin-slack-notification/dist/templates"
    );
    const files = fs.existsSync(templatesPath)
      ? await readdir(templatesPath)
      : [];
    const pluginFiles = await readdir(pluginTemplatesPath);
    const pluginTemplatesArray = await Promise.all(
      pluginFiles.map(async (file) => {
        if (excludes.some((exclude) => exclude.test(file))) {
          return;
        }
        const [fileName] = file.split(".");
        const templateData = await import(`${pluginTemplatesPath}/${fileName}`);

        return {
          [fileName]: templateData.default,
        };
      })
    );
    const templatesArray = await Promise.all(
      files.map(async (file) => {
        if (excludes.some((exclude) => exclude.test(file))) {
          return;
        }
        const [fileName] = file.split(".");
        const templateData = await import(`${templatesPath}/${fileName}`);

        return {
          [fileName]: templateData.default,
        };
      })
    );

    const pluginTemplates = Object.assign({}, ...pluginTemplatesArray);
    this.templates = Object.assign(pluginTemplates, ...templatesArray);
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
      to: `slack:#${this.options.channel}`,
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
      to: `slack:#${this.options.channel}`,
      status: slackMessage.ok ? "sent" : "failed",
      data: notification.data,
    };
  }
}

export default SlackNotificationService;
