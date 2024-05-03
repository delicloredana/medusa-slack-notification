import {
  EventBusService,
  MedusaContainer,
  NotificationService,
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/medusa";
import { readdir } from "fs/promises";
import path from "path";
import { ConfigModule, Subscriber } from "@medusajs/types";

type SubscriberHandler<T> = (args: SubscriberArgs<T>) => Promise<void>;

type SubscriberModule<T> = {
  config: SubscriberConfig;
  handler: SubscriberHandler<T>;
};
export default async (
  container: MedusaContainer,
  configModule: ConfigModule
): Promise<void> => {
  const notificationService = container.resolve<NotificationService>(
    "notificationService"
  );
  const eventBusService = container.resolve<EventBusService>("eventBusService");

  const excludes: RegExp[] = [
    /\.DS_Store/,
    /(\.ts\.map|\.js\.map|\.d\.ts)/,
    /^_[^/\\]*(\.[^/\\]+)?$/,
  ];

  const subscriberDescriptors: Map<string, SubscriberModule<any>> = new Map();

  notificationService.subscribe("slack-notification", "slack-notification");

  const rootDir = path.resolve(".");
  const templatesPath = path.join(
    rootDir,
    "/node_modules/medusa-plugin-slack-notification/dist/templates"
  );
  await createMap(templatesPath);
  for (const [
    fileName,
    { config, handler },
  ] of subscriberDescriptors.entries()) {
    createSubscriber({
      fileName,
      config,
      handler,
    });
  }
  function createSubscriber<T>({
    fileName,
    config,
    handler,
  }: {
    fileName: string;
    config: SubscriberConfig;
    handler: SubscriberHandler<T>;
  }) {
    const { event } = config;

    const events = Array.isArray(event) ? event : [event];

    const subscriber = async (data: T, eventName: string) => {
      return handler({
        eventName,
        data,
        container: container,
        pluginOptions: configModule,
      });
    };

    const subscriberId = config.context?.subscriberId;

    for (const e of events) {
      eventBusService.subscribe(e, subscriber as Subscriber, {
        ...(config.context ?? {}),
        subscriberId,
      });
    }
  }
  async function createMap(dirPath: string) {
    await Promise.all(
      await readdir(dirPath, { withFileTypes: true }).then(async (entries) => {
        return entries
          .filter((entry) => {
            if (
              excludes.length &&
              excludes.some((exclude) => exclude.test(entry.name))
            ) {
              return false;
            }

            return true;
          })
          .map(async (entry) => {
            const fullPath = path.join(dirPath, entry.name);
            return await createDescriptor(fullPath, entry.name);
          });
      })
    );
  }
  async function createDescriptor(absolutePath: string, entry: string) {
    const [templateFileName] = entry.split(".");
    return await import(`${templatesPath}/${templateFileName}`).then(
      (module) => {
        subscriberDescriptors.set(absolutePath, {
          config: {
            event: module.EVENTS,
            context: {
              subscriberId: `slack-notification-subscriber-${templateFileName}`,
            },
          },
          handler: async ({ data, eventName, container, pluginOptions }) => {
            const preparedData = await module.prepareTemplateData(
              eventName,
              data,
              container,
              pluginOptions
            );
            eventBusService.emit("slack-notification", {
              templateFileName: templateFileName,
              originalEventName: eventName,
              id: preparedData.id,
              preparedData,
            });
            return;
          },
        });
      }
    );
  }
};
