import { KnownBlock } from "@slack/web-api";
import { Block } from "typescript";

export interface SlackMessage {
  /**
   * @description Text of the message. If used in conjunction with `blocks` or `attachments`, `text` will be used
   * as fallback text for notifications only.
   */
  text: string;

  /**
   * @description An array of structured Blocks.
   * @see {@link https://api.slack.com/reference/block-kit/blocks Blocks reference}.
   */
  blocks: (KnownBlock | Block)[];
}

export interface TemplateRes {
  message: SlackMessage;
  id: string;
}

