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
	async handler(msg: Message) {
		const listeners = config.listeners.filter(listener => {
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

		if (!listeners?.length) return;
		
		const reply = msg.type === 'REPLY' && await msg.fetchReference();

		for (const listener of listeners) {
			const idx = config.listeners.indexOf(listener);
			this.webhooks[idx] ??= new Webhook(this.client, listener.webhook ?? config.webhook);

			this.webhooks[idx].send({
				content: [
					reply && `**Replying to ${reply.author.username}**`,
					...(reply ? reply.content.split('\n').map(e => '> ' + e) : []),
					reply && ' ',
					`${this.getContent(msg)} [\`↖\`](${msg.url})`,
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

	getContent(msg: Message): string {
		let content = msg.content;

		if (config.replacements) {
			for (const [subject, replacement] of Object.entries(config.replacements)) {
				content = content.replaceAll(subject, replacement);
			}
		}

		return content;
	}
}

export default MessageEvent;
