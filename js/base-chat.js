function baseChat () {
	d20plus.chat = d20plus.chat || {};

	d20plus.chat.outgoing = () => {
		const tc = d20.textchat.$textarea;

		if (d20plus.cfg.getOrDefault("chat", "emoji")) {
			tc.val(tc.val().replace(/(:\w*?:)/g, (m0, m1) => {
				const clean = m1.replace(/:/g, "");
				return d20plus.chat.emojiIndex && d20plus.chat.emojiIndex[clean] ? `[${clean}](https://github.com/TheGiddyLimit/emoji-dump/raw/master/out/${clean}.png)` : m1;
			}));
		}
	}

	d20plus.chat.enhanceChat = () => {
		d20plus.ut.log("Enhancing chat");

		$("#textchat-input").off("click", "button")
		$("#textchat-input").on("click", "button", d20plus.chat.outgoing);
	};
}

SCRIPT_EXTENSIONS.push(baseChat);
