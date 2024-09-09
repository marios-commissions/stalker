import sleep from '~/utilities/sleep';
import config from '~/config';

async function getMessage(channel: string, message: string, retriesRemaining: number = 3): Promise<Message | null> {
	if (retriesRemaining === 0) return null;

	const res = await fetch(`https://discord.com/api/v10/channels/${channel}/messages?around=${message}&limit=1`, {
		headers: {
			'Authorization': config.token,
			'X-Super-Properties': btoa(JSON.stringify(config.properties))
		}
	});

	const json = await res.json();

	if (res.status !== 200) {
		await sleep((json?.retry_after ?? 1) * 1000);
		retriesRemaining--;
		console.warn(`Got unexpected response while fetching message ${message} in channel ${channel}: ${json} (Status: ${res.status}, Retries Remaining: ${retriesRemaining})`);
		return await getMessage(channel, message, retriesRemaining);
	}

	if (!Array.isArray(json)) {
		return null;
	}

	return json?.[0] as Message;
}

export default getMessage;