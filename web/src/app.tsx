import { useState } from 'react';

import { useData } from './websocket-context';

function App() {
	const data = useData();
	const [tapped, setTapped] = useState(false);

	return <div style={{ display: 'flex', flexDirection: 'column', gap: '4' }}>
		<p>
			WebSocket is {data.connected ? 'connected' : 'not connected'}.
		</p>
		{!tapped ? <button onClick={() => setTapped(true)}>
			Tap me to activate
		</button> : 'Activated.'}
	</div>;
}

export default App;
