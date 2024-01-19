import sourcemaps from 'source-map-support';
sourcemaps.install();

import Webhook from '~/structures/webhook';
import Client from '~/structures/client';
import config from '~/config';

new Client(config.token);

if (config.errors.catch) {
	const webhook = new Webhook(config.errors.webhook);

	process.on('uncaughtException', (error, origin) => {
		console.error(error);
		webhook.send({
			content: [
				'**An error occured inside stalker**',
				'',
				`Origin: \`${origin ?? 'Unknown'}\``,
				`Cause: \`${error.cause ?? 'Unknown'}\``,
				`Type: \`${error.name}\``,
				`Stack: \`\`\`\n${error.stack}\n\`\`\``,
			].join('\n')
		});
	});
}