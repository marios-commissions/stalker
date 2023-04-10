"use strict";
Object.defineProperty(exports, "__esModule", {
    value: !0
});
const e = _interopRequireDefault(require("./structures/client")), r = _interopRequireDefault(require("../config.json"));
function _interopRequireDefault(e) {
    return e && e.__esModule ? e : {
        default: e
    };
}
const t = new e.default();
t.init(), r.default.errors.catch && process.on('uncaughtException', (e, r)=>{
    t.errors.send({
        content: `**An error occured inside discord-twitter-forward**

Origin: \`${r ?? 'Unknown'}\`
Cause: \`${e.cause ?? 'Unknown'}\`
Type: \`${e.name}\`
Stack: \`\`\`\n${e.stack}\n\`\`\``
    });
});
