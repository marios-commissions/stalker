import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import config from '../config.json';

interface Message {
	content: string;
	date: number;
	origin: 'telegram' | 'discord';
}

type DataProviderProps = {
	children: React.ReactNode;
};

type DataProviderState = {
	messages: {
		telegram: Message[];
		discord: Message[];
	},
	setMessages: React.Dispatch<React.SetStateAction<{
		telegram: Message[];
		discord: Message[];
	}>>;
	telegram: {
		isLoading: boolean;
		connected: boolean;
		wait: number | null;
	},
	discord: {
		isLoading: boolean;
		connected: boolean;
		wait: number | null;
	};
};

const initial = {
	messages: {
		telegram: [],
		discord: []
	},
	setMessages: ((messages: Message[]) => null) as unknown as React.Dispatch<React.SetStateAction<{
		telegram: Message[];
		discord: Message[];
	}>>,
	telegram: {
		isLoading: true,
		connected: false,
		wait: null
	},
	discord: {
		isLoading: true,
		connected: false,
		wait: null
	},
};

const DataProviderContext = createContext<DataProviderState>(initial);

let isUnloading = false;

function DataProvider({ children, ...props }: DataProviderProps) {
	const [messages, setMessages] = useState<{ telegram: Message[]; discord: Message[]; }>({ telegram: [], discord: [] });
	const [discordIsLoading, setDiscordIsLoading] = useState<boolean>(true);
	const [discordConnected, setDiscordConnected] = useState<boolean>(false);
	const [discordWait, setDiscordWait] = useState<number | null>(null);
	const [telegramIsLoading, setTelegramIsLoading] = useState<boolean>(true);
	const [telegramConnected, setTelegramConnected] = useState<boolean>(false);
	const [telegramWait, setTelegramWait] = useState<number | null>(null);

	const discordWs = useRef<InstanceType<typeof WebSocket>>(null);
	const telegramWs = useRef<InstanceType<typeof WebSocket>>(null);

	useEffect(() => {
		function onUnload() {
			isUnloading = true;
			discordWs.current?.close();
			telegramWs.current?.close();
		}

		function createSocket(ref: React.RefObject<WebSocket>) {
			if (ref.current) return;

			if (ref === telegramWs) {
				setTelegramIsLoading(true);
			} else {
				setDiscordIsLoading(true);
			}

			const socket = new WebSocket(ref === telegramWs ? config.telegramWebSocket : config.discordWebSocket);

			socket.binaryType = 'arraybuffer';

			// @ts-ignore
			ref.current = socket;

			socket.addEventListener('close', async () => {
				// @ts-ignore
				ref.current = null;

				if (ref === telegramWs) {
					setTelegramConnected(false);
					setTelegramIsLoading(false);
				} else {
					setDiscordConnected(false);
					setDiscordIsLoading(false);
				}

				if (!isUnloading) {
					console.log('Socket closed, waiting 5 minutes then retrying...');


					if (ref === telegramWs) {
						setTelegramWait(Date.now() + 300000);
					} else {
						setDiscordWait(Date.now() + 300000);
					}

					await new Promise(r => setTimeout(r, 300000));

					if (ref === telegramWs) {
						setTelegramWait(null);
					} else {
						setDiscordWait(null);
					}

					createSocket(ref);
				}
			});

			socket.addEventListener('open', () => {
				console.info('Socket opened');

				if (ref === telegramWs) {
					setTelegramConnected(true);
					setTelegramIsLoading(false);
				} else {
					setDiscordConnected(true);
					setDiscordIsLoading(false);
				}
			});

			socket.addEventListener('message', (event) => {
				try {
					if (event.data instanceof ArrayBuffer) {
						const blob = new Blob([event.data]);
						const src = URL.createObjectURL(blob);
						const audio = new Audio(src);
						audio.play();

						return;
					}


					try {
						const payload = JSON.parse(event.data);

						switch (payload.type) {
							case 'MESSAGES_UPDATE': {
								for (const message of payload.data as Message[]) {
									if (message.origin === 'telegram') {
										setMessages(prev => ({ ...prev, telegram: payload.data }));
									} else if (message.origin === 'discord') {
										setMessages(prev => ({ ...prev, discord: payload.data }));
									}
								}
							} break;
						}
					} catch (error) {
						console.error('Failed to parse WebSocket message:', error);
					}
				} catch (e) {
					console.error('!!! Failed parsing WebSocket message !!!');
				}
			});
		}

		createSocket(discordWs);
		createSocket(telegramWs);

		document.addEventListener('beforeunload', onUnload);
	}, []);

	const ctx = {
		messages,
		discord: {
			isLoading: discordIsLoading,
			connected: discordConnected,
			wait: discordWait
		},
		telegram: {
			isLoading: telegramIsLoading,
			connected: telegramConnected,
			wait: telegramWait
		},
		setMessages
	};

	return (
		<DataProviderContext.Provider key='data' {...props} value={ctx}>
			{children}
		</DataProviderContext.Provider>
	);
}

export function useData() {
	const context = useContext(DataProviderContext);

	if (context === undefined) {
		throw new Error('useData must be used within an DataProvider');
	}

	return context;
};

export default DataProvider;