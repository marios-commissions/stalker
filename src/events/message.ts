import type { Message } from 'discord.js-selfbot-v13';
import type { APIEmbed } from 'discord-api-types/v10';
import type Client from '@structures/client';

import Event, { EventHandler } from '@structures/event';
import Webhook from '@structures/webhook';
import { bind } from '@utilities';
import config from '@config';

class MessageEvent extends Event implements EventHandler<'messageCreate'> {
  public webhooks: Map<number, typeof Webhook> = new Map();

  constructor(
    public client: InstanceType<typeof Client>
  ) {
    super({ name: 'messageCreate' });
  }

  @bind
  handler(msg: Message) {
    const listener = config.listeners.find(listener => {
      if (listener.channel && listener.channel !== msg.channel.id) {
        return false;
      }

      if (listener.channel && listener.channel === msg.channel.id && !listener.users?.length) {
        return true;
      }

      if (listener.users?.length && listener.users.includes(msg.author.id)) {
        return true;
      }

      return false;
    });

    if (!listener) return;

    const idx = config.listeners.indexOf(listener);
    this.webhooks[idx] ??= new Webhook(this.client, listener.webhook ?? config.webhook);

    this.webhooks[idx].send({
      content: [
        `${msg.content} [\`↖\`](${msg.url})`,
        ' ',
        msg.attachments.size && '\`Attachments:\`',
        ...msg.attachments?.map(e => e.url)
      ].filter(Boolean).join('\n') ?? '',
      username: msg.author.tag,
      avatar_url: msg.author.avatarURL({ dynamic: true, size: 4096 }),
      embeds: [...msg.embeds.values()] as any as APIEmbed[]
    });
  }
}

export default MessageEvent;
