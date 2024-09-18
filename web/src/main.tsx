import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import './index.css';

import DataProvider from './websocket-context.js';
import App from './app.js';

const root = document.getElementById('root');

createRoot(root!).render(
	<StrictMode>
		<DataProvider>
			<App />
		</DataProvider>
	</StrictMode>,
);
