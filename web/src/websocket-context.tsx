import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import config from '../config.json';

type DataProviderProps = {
	children: React.ReactNode;
};

type DataProviderState = {
	isLoading: boolean;
	connected: boolean;
};

const initial = {
	isLoading: true,
	connected: false
};

const DataProviderContext = createContext<DataProviderState>(initial);

let isUnloading = false;

function DataProvider({ children, ...props }: DataProviderProps) {
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [connected, setConnected] = useState<boolean>(false);
	const ws = useRef<InstanceType<typeof WebSocket>>(null);

	useEffect(() => {
		function onUnload() {
			isUnloading = true;
			ws.current?.close();
		}

		function createSocket() {
			if (ws.current) return;
			setIsLoading(true);

			const socket = new WebSocket(config.server);

			socket.binaryType = "arraybuffer";

			// @ts-ignore
			ws.current = socket;

			socket.addEventListener('close', async () => {
				// @ts-ignore
				ws.current = null;
				setConnected(false);
				setIsLoading(false);

				if (!isUnloading) {
					console.log('Socket closed, waiting 1000ms then retrying...');
					await new Promise(r => setTimeout(r, 1000));

					createSocket();
				}
			});

			socket.addEventListener('open', () => {
				console.info('Socket opened');
				setConnected(true);
				setIsLoading(false);
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
				} catch (e) {
					console.error('!!! Failed parsing WebSocket message !!!');
				}
			});
		}

		createSocket();
		document.addEventListener('beforeunload', onUnload);

		return () => {
			document.removeEventListener('beforeunload', onUnload);
			ws.current!.close();
		};
	}, []);

	const ctx = {
		isLoading,
		connected
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