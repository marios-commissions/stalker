import { Client, Intents } from 'discord.js-selfbot-v13';
import config from '../config.json';

const client = new Client({
  DMSync: true,
  autoRedeemNitro: false,
  checkUpdate: false,
  intents: [
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.MESSAGE_CONTENT
  ]
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user!.tag}.`);
});

client.on('messageCreate', async (msg) => {
  if (!config.users.includes(msg.author.id)) return;

  try {
    await fetch(config.webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: [
          `\`URL:\` ${msg.url}`,
          ' ',
          msg.content,
          ' ',
          msg.attachments.size && '\`Attachments:\`',
          ...msg.attachments?.map(e => e.url)
        ].filter(Boolean).join('\n') ?? '',
        username: msg.author.tag,
        avatar_url: msg.author.avatarURL({ dynamic: true, size: 4096 }),
        embeds: [...msg.embeds.values()]
      })
    });
  } catch (e) {
    console.log('Failed to send message:', e);
  }
});

client.login(config.token);