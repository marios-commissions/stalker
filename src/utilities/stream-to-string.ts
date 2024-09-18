import ElevenLabs from '~/structures/elevenlabs';

async function streamToString(readable: Awaited<ReturnType<typeof ElevenLabs.textToSpeech.convert>>): Promise<Buffer> {
	const bufs = [];

	for await (const data of readable) {
		bufs.push(data);
	}

	return Buffer.concat(bufs);
}

export default streamToString;