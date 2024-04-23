import sleep from '~/utilities/sleep';
import config from '~/config';

async function getMessage(channel: string, message: string): Promise<Message | null> {
	const res = await fetch(`https://discord.com/api/channels/${channel}/messages?around=${message}&limit=1`, {
		headers: {
			'Authorization': config.token,
			'X-Super-Properties': btoa(JSON.stringify(config.properties))
		}
	});

	const json = await res.json();

	if (res.status === 429) {
		await sleep(json.retry_after * 1000);
		return await getMessage(channel, message);
	}

	if (res.status !== 200) {
		console.warn(`Got unexpected response while fetching message ${message} in channel ${channel}: ${json} (Status: ${res.status})`);
		return null;
	}

	if (!Array.isArray(json)) {
		return null;
	}

	return json?.[0] as Message;
}

export default getMessage;