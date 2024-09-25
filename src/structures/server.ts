import { createLogger } from '~/structures/logger';
import client from '~/structures/client';
import store from '~/structures/store';
import { WebSocketServer } from 'ws';

const Logger = createLogger('Server');

export const ws = new WebSocketServer({ port: 4444 });

ws.on('connection', (socket) => {
	Logger.info('Client connected to WebSocket server.');

	function sendTTS(file: ArrayBufferLike) {
		socket.send(file);
	}

	function sendLogs() {
		const payload = JSON.stringify({
			type: 'MESSAGES_UPDATE',
			data: store.messages,
		});

		socket.send(payload);
	}

	client.on('tts', sendTTS);
	store.on('changed', sendLogs);

	socket.on('error', console.error);

	socket.on('close', () => {
		Logger.info('Client disconnected from WebSocket server.');
		store.off('changed', sendLogs);
		client.off('tts', sendTTS);
	});

	sendLogs();
});

ws.on('listening', () => {
	Logger.info('WebSocket server listening on port 8098');
});