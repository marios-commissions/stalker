import Event, { EventHandler } from '@structures/event';
import { Client } from 'discord.js-selfbot-v13';
import { bind } from '@utilities';

class ReadyEvent extends Event implements EventHandler<'ready'> {
  constructor(
    public client: InstanceType<typeof Client>
  ) {
    super({ name: 'ready' });
  }

  @bind
  handler() {
    console.log(`Logged in as ${this.client.user.tag}`);
  }
}

export default ReadyEvent;