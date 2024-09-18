import { createLogger } from '~/structures/logger';
import { ElevenLabsClient } from 'elevenlabs';
import config from '~/config';

const client = new ElevenLabsClient({ apiKey: config.auth.elevenlabs });
const logger = createLogger('ElevenLabs');

export async function initialize() {
	logger.success('ElevenLabs initialized.');

	try {
		const { voices } = await client.voices.getAll();

		const formatted = voices.map((voice) => [
			'-----',
			`Name: ${voice.name}`,
			`ID: ${voice.voice_id}`,
			`Preview: ${voice.preview_url}`,
			'-----'
		].join('\n'));

		logger.warn(formatted.join('\n\n'));
	} catch (error) {
		logger.error('Failed to get available voices. This is likely due to a way bigger issue.', error);
		process.exit(-1);
	}
}

export default client;