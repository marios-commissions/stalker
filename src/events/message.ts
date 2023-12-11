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

		switch (msg.channel.id) {
			case '1166791604997206047':
			case '1166792249863049246':
				for (const embed of msg.embeds.values()) {
					const bought = embed.title.includes('💵');

					content.push(`${embed.title} - ${[
						embed.fields.find(f => f.name.includes('Chart'))?.value,
						`💰 ${embed.fields.find(f => f.name.includes('Market cap'))?.value}`,
						`${bought ? 'Bought' : 'Sold'} ${embed.fields.find(f => f.name.includes(bought ? 'bought' : 'sold'))?.value}`,
						`Age: ${embed.fields.find(f => f.name.includes('Token age'))?.value}`,
						`Win rate: ${embed.fields.find(f => f.name.includes('Win rate'))?.value}`,
						`PNL: ${embed.fields.find(f => f.name.includes('PNL'))?.value}`,
					].join(' | ')}`);
				}

				break;
			case '1154757415200366592':
				for (const embed of msg.embeds.values()) {
					const bought = embed.title.includes('💵');

					content.push(`${msg.content.replaceAll('\n', '').replaceAll('#', '')} - ${[
						embed.title,
						embed.fields.find(f => f.name.includes('Chart'))?.value,
						`Market cap: ${embed.fields.find(f => f.name.includes('Market cap'))?.value}`,
						`${bought ? 'Bought' : 'Sold'} ${embed.fields.find(f => f.name.includes(bought ? 'bought' : 'sold'))?.value}`,
						`Age: ${embed.fields.find(f => f.name.includes('Token age'))?.value}`,
						`Win rate: ${embed.fields.find(f => f.name.includes('Win rate'))?.value}`,
						`PNL: ${embed.fields.find(f => f.name.includes('PNL'))?.value}`,
					].join(' | ')}`);
				}

				break;
			default:
				content.push(msg.content);
				break;
		}

		return Array.isArray(content) ? content.join('\n') : content;
	}
}

export default MessageEvent;
