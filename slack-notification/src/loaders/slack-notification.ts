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
  config: ConfigModule
): Promise<void> => {
  const notificationService = container.resolve<NotificationService>(
    "notificationService"
  );
  const eventBusService = container.resolve<EventBusService>("eventBusService");

  const subscriberDescriptors_: Map<string, SubscriberModule<any>> = new Map();

  notificationService.subscribe("slack-notification", "slack-notification");

  const rootDir = path.resolve(".");
  const templatesPath = path.join(
    rootDir,
    "../../slack-notification/dist/templates"
  );
  await createMap(templatesPath);

  const map = subscriberDescriptors_;
  for (const [fileName, { config, handler }] of map.entries()) {
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
        pluginOptions: config,
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
        return entries.map(async (entry) => {
          const fullPath = path.join(dirPath, entry.name);
          return await createDescriptor(fullPath, entry.name);
        });
      })
    );
  }
  async function createDescriptor(absolutePath: string, entry: string) {
    return await import(`${templatesPath}/${entry.split(".")[0]}`).then(
      (module_) => {
        subscriberDescriptors_.set(absolutePath, {
          config: {
            event: module_.EVENTS,
            context: {
              subscriberId: `slack-notification-subscriber-${
                entry.split(".")[0]
              }`,
            },
          },
          handler: async ({ data, eventName, container, pluginOptions }) => {
            const preparedData = await module_.prepareTemplateData(
              eventName,
              data,
              container,
              pluginOptions
            );
            eventBusService.emit("slack-notification", {
              templateFileName: entry.split(".")[0],
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

  /**
   * const subscriberId = `slack-notification-subscriber-${templateFileName}`

    for (const e of templateFile.EVENTS) {
      eventBusService.subscribe(e, subscriber as Subscriber<unknown>, {
        ...(config.context ?? {}),
        subscriberId,
      })
    }
   */

  // () => {
  //   const preparedData = templateFile.prepareTemplateData(templateFileName, originalEventName, preparedData)
  //  eventBusService.emit("slack-notification", {
  //    templateFileName,
  //    originalEventName,
  //    preparedData,
  //  })
  // }
};
