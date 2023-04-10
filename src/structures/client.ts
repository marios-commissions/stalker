import { Client, ClientOptions } from 'discord.js-selfbot-v13';

import Webhook from '@structures/webhook';
import * as Events from '@events';
import config from '@config';

class Stalker extends Client {
  public webhook: InstanceType<typeof Webhook>;
  public errors: InstanceType<typeof Webhook>;

  constructor(options?: ClientOptions) {
    super(Object.assign({
      autoRedeemNitro: false,
      checkUpdate: false
    } as ClientOptions, options));

    this.webhook = new Webhook(this, config.webhook);
    this.errors = new Webhook(this, config.errors.webhook);
  }

  async init() {
    await this.login(config.token);

    for (const instance in Events) {
      try {
        const event = new (Events[instance])(this);
        if (!event.handler) return;

        this.on(event.name, function (...args) {
          try {
            event.handler.apply(this, args);
          } catch (error) {
            if (!config.errors.catch) return;

            this.errors.send({
              content: [
                `**An error occured in stalker in the ${instance} event**`,
                '',
                `Cause: \`${error.cause ?? 'Unknown'}\``,
                `Type: \`${error.name}\``,
                `Stack: \`\`\`\n${error.stack}\n\`\`\``,
              ].join('\n')
            });
          }
        });
      } catch (error) {
        console.error(`Failed to initialize event ${instance}:`, error.message);
      }
    }
  }
}


export default Stalker;