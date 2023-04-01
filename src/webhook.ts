import { RESTPostAPIWebhookWithTokenJSONBody } from 'discord-api-types/v10';

class Webhook {
  constructor(
    public url: string
  ) { }

  async send(payload: RESTPostAPIWebhookWithTokenJSONBody) {
    try {
      await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.log(`!! Webhook failed to send: ${e.message} !!`);
    }
  }
};

export default Webhook;