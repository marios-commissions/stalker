import { createLogger } from '~/structures/logger';
import client from '~/structures/client';
import { WebSocketServer } from 'ws';

const Logger = createLogger('Server');

export const ws = new WebSocketServer({ port: 8099 });

ws.on('connection', (socket) => {
	Logger.info('Client connected to WebSocket server.');

	function callback(file: ArrayBufferLike) {
		// const data = JSON.stringify({ type: 'tts', file });
		socket.send(file);
	}

	client.on('tts', callback);

	socket.on('error', console.error);
	socket.on('close', () => {
		Logger.info('Client disconnected from WebSocket server.');
		client.off('tts', callback);
	});
});

ws.on('listening', () => {
	Logger.info('WebSocket server listening on port 8098');
});