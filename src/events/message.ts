import type { Message } from 'discord.js-selfbot-v13';
import type { APIEmbed } from 'discord-api-types/v10';
import type Client from '@structures/client';

import Event, { EventHandler } from '@structures/event';
import { bind } from '@utilities';
import config from '@config';

class MessageEvent extends Event implements EventHandler<'messageCreate'> {
	constructor(
		public client: InstanceType<typeof Client>
	) {
		super({ name: 'messageCreate' });
	}

	@bind
	async handler(msg: Message) {
		if (!config.channels.includes(msg.channelId)) return;

		const reply = msg.type === 'REPLY' && await msg.fetchReference();

		this.client.webhook.send({
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
