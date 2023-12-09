import Event, { EventHandler } from '@structures/event';
import type { Message } from 'discord.js-selfbot-v13';
import type { APIEmbed } from 'discord-api-types/v10';
import type Client from '@structures/client';
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

		const reply = msg.type === 'REPLY' && await msg.fetchReference();

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
			username: msg.channel.name ?? 'Unknown',
			avatar_url: msg.author.avatarURL({ dynamic: true, size: 4096 })
		});
	}

	getContent(msg: Message): string {
		let content: string | string[] = [];

		for (const embed of msg.embeds.values()) {
			content.push(`${embed.title} | ${embed.fields.find(f => f.name.includes('Contract'))?.value}`);
		}

		return Array.isArray(content) ? content.join('\n') : content;
	}
}

export default MessageEvent;
