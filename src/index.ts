import { Client, Intents } from 'discord.js-selfbot-v13';
import { APIEmbed } from 'discord-api-types/v10';
import config from '../config.json';
import Webhook from './webhook';

const webhook = new Webhook(config.webhook);
const client = new Client({
  DMSync: false,
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
    webhook.send({
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
  } catch (e) {
    console.log('Failed to send message:', e);
  }
});

client.login(config.token);

if (config.errors.catch) {
  const webhook = new Webhook(config.errors.webhook);

  process.on('uncaughtException', (error, origin) => {
    webhook.send({
      content: [
        '**An error occured inside discord-twitter-forward**',
        '',
        `Origin: \`${origin ?? 'Unknown'}\``,
        `Cause: \`${error.cause ?? 'Unknown'}\``,
        `Type: \`${error.name}\``,
        `Stack: \`\`\`\n${error.stack}\n\`\`\``,
      ].join('\n')
    });
  });
}