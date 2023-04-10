import Client from '@structures/client';
import config from '@config';

const client = new Client();

client.init();

if (config.errors.catch) {
  process.on('uncaughtException', (error, origin) => {
    client.errors.send({
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