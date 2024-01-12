import { RESTPostAPIWebhookWithTokenJSONBody } from 'discord-api-types/v10';
import { sleep } from '~/utilities';

class Webhook {
	constructor(
		public url: string
	) { }

	async send(payload: RESTPostAPIWebhookWithTokenJSONBody) {
		try {
			const res = await fetch(this.url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const data = await res.json();
				if (!data.retry_after) return;

				console.log(`Hit ratelimit, waiting ${data.retry_after * 1000}ms.`);
				await sleep(data.retry_after * 1000);
				await this.send(payload);
			}
		} catch (e) {
			console.log(`!! Webhook failed to send: ${e.message} !!`);
		}
	}
}

export default Webhook;