"use strict";
Object.defineProperty(exports, "__esModule", {
    value: !0
});
const e = require("discord.js-selfbot-v13"), t = function(e) {
    return e && e.__esModule ? e : {
        default: e
    };
}(require("../config.json")), n = new e.Client({
    DMSync: !0,
    autoRedeemNitro: !1,
    checkUpdate: !1,
    intents: [
        e.Intents.FLAGS.DIRECT_MESSAGES,
        e.Intents.FLAGS.GUILD_MESSAGES,
        e.Intents.FLAGS.GUILDS,
        e.Intents.FLAGS.MESSAGE_CONTENT
    ]
});
n.on('ready', ()=>{
    console.log(`Logged in as ${n.user.tag}.`);
}), n.on('messageCreate', async (e)=>{
    if (t.default.users.includes(e.author.id)) try {
        await fetch(t.default.webhook, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: [
                    `\`URL:\` ${e.url}`,
                    ' ',
                    e.content,
                    ' ',
                    e.attachments.size && '\`Attachments:\`',
                    ...e.attachments?.map((e)=>e.url)
                ].filter(Boolean).join('\n') ?? '',
                username: e.author.tag,
                avatar_url: e.author.avatarURL({
                    dynamic: !0,
                    size: 4096
                }),
                embeds: [
                    ...e.embeds.values()
                ]
            })
        });
    } catch (n) {
        console.log('Failed to send message:', n);
    }
}), n.login(t.default.token);
