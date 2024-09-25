import { format } from 'date-fns';

interface MessageProps {
	content: string;
	date: number;
	origin: 'telegram' | 'discord';
}

function Message(props: MessageProps) {
	return <div className='bg-neutral-200 rounded-lg p-2 whitespace-pre'>
		<p className='text-center font-bold'>{format(new Date(props.date), 'hh:mm:ss a')} - {props.origin}</p>
		<span>{props.content?.trim() ?? 'No content.'}</span>
	</div>;
}

export default Message;