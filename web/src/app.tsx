import { Check, Loader, RotateCw } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

import { useData } from './websocket-context';
import Message from './message';

function App() {
	const data = useData();
	const [tapped, setTapped] = useState(false);

	return <div className='flex gap-4 flex-col p-6'>
		<div className='flex flex-col bg-neutral-200 rounded-lg p-2 items-center'>
			<h1 className='font-bold text-lg'>Telegram Connection</h1>
			{data.telegram.wait != null && <span className='flex items-center gap-2 text-base'>
				<RotateCw size={18} className='animate-spin' />
				<p>Retrying at {format(new Date(data.telegram.wait), 'hh:mm:ss')}...</p>
			</span>}
			{data.telegram.isLoading && <span className='flex items-center gap-2 text-base'>
				<Loader size={18} className='animate-spin' />
				<p>Attempting to connect...</p>
			</span>}
			{data.telegram.connected && <span className='flex items-center gap-2 text-base'>
				<Check className='text-green-500' />
				<p>Connected.</p>
			</span>}
		</div>
		<div className='flex flex-col bg-neutral-200 rounded-lg p-2 items-center'>
			<h1 className='font-bold text-lg'>Discord Connection</h1>
			{data.discord.isLoading && <span className='flex items-center gap-2 text-base'>
				<Loader size={18} className='animate-spin' />
				<p>Attempting to connect...</p>
			</span>}
			{data.discord.wait && <span className='flex items-center gap-2 text-base'>
				<RotateCw size={18} className='animate-spin' />
				<p>Retrying at {format(new Date(data.discord.wait), 'HH:mm:ss')}...</p>
			</span>}
			{data.discord.connected && <span className='flex items-center gap-2 text-base'>
				<Check className='text-green-500' />
				<p>Connected.</p>
			</span>}
		</div>
		<div className='h-0.5 bg-neutral-200' />
		{!tapped ? <button className='bg-neutral-200 border-neutral-500 border rounded-md' onClick={() => setTapped(true)}>
			Tap me to activate
		</button> : null}
		{[...data.messages.discord, ...data.messages.telegram].sort((a, b) => b.date - a.date).map(({ content, date, origin }) => <Message
			content={content}
			date={date}
			origin={origin}
		/>)}
	</div>;
}

export default App;
