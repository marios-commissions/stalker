import EventEmitter from 'events';

class Store extends EventEmitter {
	messages: Array<Message> = [];

	add(message: Omit<Message, 'origin'>) {
		(message as Message).origin ??= 'discord';

		this.messages.push(message as Message);
		this.emit('changed');
	}
}

export default new Store();