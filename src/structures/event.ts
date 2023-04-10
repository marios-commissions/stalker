import { Awaitable, ClientEvents } from 'discord.js-selfbot-v13';

export interface EventHandler<T extends keyof ClientEvents> {
  handler(...args: ClientEvents[T]): Awaitable<void>;
}

interface EventOptions {
  name: keyof ClientEvents;
}

class Event {
  public name: keyof ClientEvents;

  constructor(
    public options: EventOptions
  ) {
    this.name = options.name;
  }
}

export default Event;