import { OPCodes, ConnectionState, HELLO_TIMEOUT, HEARTBEAT_MAX_RESUME_THRESHOLD, MAX_CONNECTION_RETRIES } from '~/constants';
import { createLogger } from '~/structures/logger';
import { strip, getMessage } from '~/utilities';
import Webhook from '~/structures/webhook';
import config from '~/config';
import WebSocket from 'ws';

class Client {
	webhooks: Map<number, typeof Webhook> = new Map();
	logger = createLogger('WebSocket', 'Client');
	ws: WebSocket;

	user: User;

	helloTimeout: NodeJS.Timeout;
	heartbeatHandler: NodeJS.Timeout;

	pendingRestart: boolean;
	connectionStartTime: number;
	lastHeartbeatAckTime: number;
	heartbeatInterval: number;
	state: ConnectionState;
	attempts: number = 0;
	sessionId: string;
	sequence: number;

	constructor(
		public token: string,
	) {
		this.createSocket();
	}

	onMessage(data: string) {
		try {
			const payload = JSON.parse(data);

			if (payload.s) {
				this.sequence = payload.s;
			}

			switch (payload.op) {
				case OPCodes.HELLO: {
					this.clearHelloTimeout();
					this.onHello(payload.d);
				} break;

				case OPCodes.HEARTBEAT_ACK: {
					// this.logger.debug('⟶ PONG');
					this.lastHeartbeatAckTime = Date.now();
				} break;

				case OPCodes.INVALID_SESSION: {
					if (payload.d) {
						this.resume();
					} else {
						this.identify();
					}
				} break;

				case OPCodes.RECONNECT: {
					this.reconnect();
				} break;

				case OPCodes.DISPATCH: {
					this.onDispatch(payload);
				} break;
			}
		} catch (e) {
			this.logger.error('Failed to handle message:', e);
		}
	}

	onOpen() {
		this.logger.debug('Socket opened.');
		this.state = ConnectionState.CONNECTED;
		const now = Date.now();

		if (this.canResume) {
			this.resume();
		} else {
			this.identify();
		}

		this.lastHeartbeatAckTime = now;
	}

	async onClose(code: number, reason: Buffer) {
		this.logger.warn(strip(this.token) + ' Closed with code:', code, reason.toString('utf8'));
		this.state = ConnectionState.DISCONNECTED;
		this.stopHeartbeat();

		if (code === 4004) {
			this.logger.error(`Invalid token: ${strip(this.token)}`);
			return;
		}

		if (code === 4444) return;
		if (this.shouldAttempt) {
			if ((this.attempts * 1000) !== 0) {
				this.logger.warn(`Waiting ${this.attempts * 1000}ms to reconnect...`);
			}

			setTimeout(() => {
				if (!this.shouldAttempt) return;
				this.logger.info(`Attempting to reconnect (attempt ${this.attempts}): ${strip(this.token)}`);
				this.createSocket();
			}, this.attempts * 1000);
		} else {
			this.logger.error(`Connected timed out ${this.attempts}, bye.`);
		}
	}

	onError(error: Error) {
		this.logger.error('Encountered error:', error);
	}

	async onDispatch(payload: any) {
		switch (payload.t) {
			case 'READY': {
				this.sessionId = payload.d.session_id;
				this.user = payload.d.user;


				this.state = ConnectionState.CONNECTED;
				this.logger.success(`Logged in as ${this.user.username}.`, `Token: ${strip(this.token)}`);
				this.attempts = 0;
			} break;

			case 'RESUMED': {
				this.state = ConnectionState.CONNECTED;
				this.logger.success(`Logged in by resuming old session.`, `Token: ${strip(this.token)}`);
				this.attempts = 0;
			} break;

			case 'MESSAGE_CREATE':
			case 'MESSAGE_UPDATE': {
				const msg = payload.d;

				if (!msg.content && !msg.embeds?.length && !msg.attachments?.length) return;

				const listeners = config.listeners?.filter(listener => {
					if (listener.channel && listener.channel !== msg.channel_id) {
						return false;
					}

					if (listener.channel && listener.channel === msg.channel_id && !listener.users?.length) {
						return true;
					}

					if (listener.users?.length && listener.users.includes(msg.author?.id)) {
						return true;
					}

					return false;
				});

				if (!listeners?.length) return;

				const reply = msg.message_reference && (await getMessage(msg.message_reference.channel_id, msg.message_reference.message_id));

				for (const listener of listeners) {
					const idx = config.listeners.indexOf(listener);
					this.webhooks[idx] ??= new Webhook(listener.webhook ?? config.webhook);

					this.webhooks[idx].send({
						content: [
							payload.t === 'MESSAGE_UPDATE' ? '__**Message Updated**__' : '',
							reply.content && `**Replying to ${reply.author.username}**`,
							...(reply.content ? reply.content.split('\n').map(e => '> ' + e) : []),
							reply.content && ' ',
							`${this.getContent(msg, listener)} [\`↖\`](https://discord.com/channels/${msg.guild_id ?? '@me'}/${msg.channel_id}/${msg.id})`,
							' ',
							msg.attachments?.length && '\`Attachments:\`',
							...msg.attachments?.map(e => e.url)
						].filter(Boolean).join('\n') ?? '',
						username: msg.author?.username ?? listener.name ?? 'Unknown',
						avatar_url: msg.author?.avatar ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.${msg.author.avatar.startsWith('a_') ? 'gif' : 'png'}?size=4096` : null,
						embeds: msg.embeds ?? []
					});
				}
			} break;
		}
	}

	getContent(msg: Message, listener: any) {
		let content: string | string[] = [];

		if (config.replacements) {
			for (const [subject, replacement] of Object.entries(config.replacements)) {
				content = content.map(c => c?.replaceAll(subject, replacement)).filter(Boolean);
			}
		}

		for (const embed of msg.embeds) {
			content.push(`${embed.title} | ${[
				embed.fields.find(f => f.name.includes('FDV'))?.value,
				embed.fields.find(f => f.name.includes('Contract'))?.value,
			].join(' | ')}`);
		}

		content = Array.isArray(content) ? content.join('\n') : content;

		const shouldAllowEmbeds = config.embeds || listener.embeds;
		if (!shouldAllowEmbeds) {
			const links = content?.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gmi);
			if (!links?.length) return content;

			for (const link of links) {
				const areEmbedsAllowedForCurrentEntity = (config?.allowedEmbeds ?? []).some(allowed => ~link.indexOf(allowed));

				if (!areEmbedsAllowedForCurrentEntity) {
					content = content.replaceAll(link, `<${link}>`);
				}
			}
		}

		return content;
	}

	onHello(payload: { heartbeat_interval: number; }) {
		this.logger.debug('Received HELLO.');
		this.heartbeatInterval = payload.heartbeat_interval;
		this.startHeartbeat();
	}

	clearHelloTimeout() {
		if (!this.helloTimeout) return;

		clearTimeout(this.helloTimeout);
		this.helloTimeout = null;
	}

	createSocket() {
		const states = [ConnectionState.CONNECTED, ConnectionState.CONNECTING];
		if (~states.indexOf(this.state)) return;
		if (this.ws?.readyState === WebSocket.OPEN) this.ws.close(1000);


		this.attempts++;
		this.connectionStartTime = Date.now();

		this.helloTimeout = setTimeout(() => {
			const delay = Date.now() - this.connectionStartTime;
			this.ws.close(1000, `The connection timed out after ${delay}ms.`);
		}, HELLO_TIMEOUT);

		this.ws = new WebSocket(`wss://gateway.discord.gg/?v=${config.apiVersion}&encoding=json`);

		this.ws.on('message', this.onMessage.bind(this));
		this.ws.on('close', this.onClose.bind(this));
		this.ws.on('error', this.onError.bind(this));
		this.ws.on('open', this.onOpen.bind(this));
	}

	identify() {
		this.logger.debug('Sending IDENTIFY.');

		this.sequence = 0;
		this.sessionId = null;
		this.state = ConnectionState.IDENTIFYING;

		this.broadcast(OPCodes.IDENTIFY, {
			token: this.token,
			properties: config.properties
		});
	}

	resume() {
		this.logger.info('Attempting to resume old session...');
		this.state = ConnectionState.RESUMING;

		this.broadcast(OPCodes.RESUME, {
			token: this.token,
			session_id: this.sessionId,
			seq: this.sequence
		});
	}

	destroy(code: number = 1000) {
		this.ws.close(code);
		this.ws = null;
		this.sessionId = null;
	}

	reconnect() {
		this.logger.info('Reconnecting socket...');
		this.destroy(4444);

		this.state = ConnectionState.DISCOVERING;
		this.createSocket();
	}

	async heartbeat() {
		if (this.state === ConnectionState.CONNECTING) return;

		this.broadcast(OPCodes.HEARTBEAT, this.sequence ?? 0);
		// this.logger.debug('⟵ PING');
	}

	startHeartbeat() {
		this.logger.debug('Starting heartbeat.');
		if (this.heartbeatHandler) this.stopHeartbeat();

		this.heartbeatHandler = setInterval(this.heartbeat.bind(this), this.heartbeatInterval);
	}

	stopHeartbeat() {
		clearInterval(this.heartbeatHandler);
		this.heartbeatHandler = null;
	}

	broadcast(op: OPCodes, data: any = {}) {
		if (this.ws.readyState !== WebSocket.OPEN) return;

		try {
			const stringified = JSON.stringify({ op, d: data });
			this.ws.send(stringified);
		} catch (error) {
			this.logger.error('Failed to send payload:', { data, error });
		}
	}

	get shouldAttempt() {
		const states = [ConnectionState.CONNECTED, ConnectionState.CONNECTING];

		if (~states.indexOf(this.state) || this.attempts === MAX_CONNECTION_RETRIES) {
			return false;
		}

		return true;
	}

	get canResume() {
		const threshold = (!this.lastHeartbeatAckTime || Date.now() - this.lastHeartbeatAckTime <= HEARTBEAT_MAX_RESUME_THRESHOLD);
		return this.sessionId != null && threshold;
	}
}

export default Client;