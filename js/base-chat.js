function baseChat () {
	d20plus.chat = d20plus.chat || {};

	d20plus.chat.localHistory = [];
	d20plus.chat.lastRespondent = "";

	d20plus.chat.toCamelCase = (string, lowercase) => {
		return string.charAt(0).toUpperCase() + (lowercase ? string.slice(1).toLowerCase() : string.slice(1));
	}

	d20plus.chat.availableAddressees = () => {
		const players = d20.Campaign.players.models
			.filter(player => { return player.attributes.online && player.attributes.id !== d20_player_id; })
			.map(player => [player.attributes.displayname, player.attributes.id]);
		const characters = d20.Campaign.characters.models
			.filter(char => {
				const actors = char.attributes.controlledby.split(",");
				return actors.some(actor => { return actor && players.map(player => player[1]).includes(actor); })
			})
			.map(char => [char.attributes.name, false]);
		return players.concat(characters);
	}

	const playerConnectsTemplate = (id) => `
			<input type="checkbox" class="connects-state" id="connects${id}-state"/>
			<label for="connects${id}-state">
				<span id="connects${id}-info" class="connects-info" title="Show player details">?</span>
				<span id="connects${id}" class="connects-log">
				Updating...
				</span>
			</label>
	`;

	const chatHelp = [
		["/w (name)", "private message (whisper)"],
		["/w gm", "private message to your GM"],
		["/wb", "reply or whisper to last contact", "b20"],
		["/ws", "whisper to selected tokens", "b20"],
		["/em, /me", "emote (action from your POV)"],
		["/talktomyself", "silent mode on/off"],
		["/ttms", "shortcut to /talktomyself", "b20"],
		["/mtms (text)", "simple message to self", "b20"],
		["/ooc, /o", "out of character (as player)"],
		["/roll, /r (XdY)", "roll dice, e.g. /r 2d6"],
		["/gmroll, /gr (XdY)", "roll only for GM"],
		["/desc", "GM-only describe events", "gm"],
		["/as (name)", "GM-only speak as Name", "gm"],
		["/emas (name)", "GM-only emote as Name", "gm"],
		["&#42;(text)&#42;", "format text: italic"],
		["&#42;&#42;(text)&#42;&#42;", "format text: bold"],
		["&#126;&#126;(text)&#126;&#126;", "format text: strikethrough"],
		["&#96;&#96;(text)&#96;&#96;", "format text: code"],
		["/fx (params)", "show visual effect"],
		["#(macro)", "run specified macro"],
		["/help", "show this list of chat commands", "b20"],
		["", "<a style=\"font-variant: diagonal-fractions;font-size: smaller;font-variant-caps: small-caps;\" href=\"https://wiki.roll20.net/Text_Chat\">roll20 wiki</a>"],
	];

	d20plus.chat.help = (text, msg) => {
		d20plus.ut.sendHackerChat(chatHelp.reduce((html, string) => {
			const isb20 = string[2] === "b20" ? "&#42;" : "";
			const code = string[0] ? `<code>${string[0]}</code>${isb20}` : "";
			const gmcheck = string[2] !== "gm" || window.is_gm;
			if (gmcheck) return `${html}<br>${code}<span style="float:right"> ${string[1]}</span>`;
			return html;
		}, "<strong>List of chat commands:</strong><br>betteR20 commands marked with &#42;"));
		return "";
	}

	d20plus.chat.sendReply = (text, msg) => {
		const lastRespondent = d20plus.chat.lastRespondent;
		if (lastRespondent) return `/w "${lastRespondent}" ${msg}`;
		else d20plus.ut.sendHackerChat("You have to start a private chat with someone first", true);
		return "";
	}

	d20plus.chat.sendMyself = (text, msg) => {
		const resetTTMS = (wait) => {
			setTimeout(() => {
				d20.textchat.doChatInput(`/talktomyself off`);
				d20plus.chat.localHistory.push(false);
				delete d20plus.chat.mtms;
				setTimeout(() => d20plus.chat.checkTTMSStatus(), 10);
			}, wait);
		}
		const awaitTTMS = (ts) => {
			if (d20plus.chat.mtms?.success && !d20.textchat.commandInProgress) {
				resetTTMS(50);
			} else if (d20plus.chat.mtms?.dialogInProgress && !$(".ui-dialog button:visible").length) {
				resetTTMS(1000);
			} else {
				d20plus.chat.checkTTMSStatus();
				d20plus.chat.mtms = {await: true};
				if ($(".ui-dialog button:visible").length) {
					d20plus.chat.mtms.dialogInProgress = true;
				}
				setTimeout(() => {
					awaitTTMS(ts);
				}, 20);
			}
		}
		d20.textchat.doChatInput(`/talktomyself on`);
		d20plus.chat.localHistory.push(false);
		setTimeout(() => {
			d20.textchat.doChatInput(msg);
			awaitTTMS(d20.textchat.lastChatBeep);
		}, 20);
		return "";
	}

	d20plus.chat.sendToSelected = (text, msg) => {
		const addressees = d20.engine.selected()
			.map(token => token._model.character.attributes?.name)
			.filter(name => d20plus.chat.availableAddressees().map(char => char[0]).includes(name));
		if (addressees.length) return addressees.reduce((result, name) => { return `${result}/w "${name}" ${msg}\n` }, "");
		else d20plus.ut.sendHackerChat("You have to select tokens belonging to actual players", true);
		return "";
	}

	d20plus.chat.checkTTMSStatus = () => {
		$notifier = $("#textchat-notifier");
		if (d20.textchat.talktomyself) {
			if (d20plus.cfg.getOrDefault("chat", "highlightttms")) $("#textchat-input").addClass("talkingtoself");
			$("#speakingto").val("ttms");
		} else {
			$("#textchat-input").removeClass("talkingtoself");
			if ($("#speakingto").val() === "ttms") $("#speakingto").val("");
		}
	}

	d20plus.chat.checkPlayerVersion = (player, id) => {
		const raw = d20.Campaign.players.get(player).get("script");
		if (raw) {
			const info = JSON.parse(decodeURI(atob(raw)));
			const time = d20plus.ut.timeAgo(info.date);
			let html = `Detected betteR20-${info.b20n} v${info.b20v}<br>Detected VTTES v${info.vtte}<br>Info updated ${time}`;
			if (d20plus.ut.cmpVersions(info.b20v, d20plus.version) < 0) html += `<br>Player's betteR20 may be outdated`;
			if (d20plus.ut.cmpVersions(info.vtte, window.r20es?.hooks?.welcomeScreen?.config?.previousVersion) < 0) html += `<br>Player's betteR20 may be outdated`;
			$(`#connects${id}`).html(html);
			$(`#connects${id}-info`).html("i");
		} else {
			$(`#connects${id}`).html("VTTES/betteR20 not installed or version info sharing is disabled");
		}
	}

	addConfigOptions(
		"chat", {
			"showPlayerConnects": {
				"name": "Show player connects messages",
				"default": true,
				"_type": "boolean",
			},
			"commands": {
				"name": "Additional text chat commands (requires restart)",
				"default": true,
				"_type": "boolean",
				"_player": true,
			},
			"highlightttms": {
				"name": "Highlisht text box when in TTMS mode",
				"default": true,
				"_type": "boolean",
				"_player": true,
			},
			"shareVersions": {
				"name": "Share script version numbers",
				"default": true,
				"_type": "boolean",
				"_player": true,
			},
		},
	);

	d20plus.chat.processPlayersList = (changelist) => {
		if (!d20plus.chat.players) d20plus.chat.players = {};
		d20.Campaign.players.models.forEach(current => {
			const player = {
				on: current.attributes.online,
				name: current.attributes.displayname,
				delay: 0,
			};
			let notification = false;
			player.name = player.name.length > 17 ? `${player.name.slice(0, 15)}...` : player.name;
			if (!d20plus.chat.players[current.id]) {
				d20plus.chat.players[current.id] = { online: player.on };
				notification = `${player.name} joined`;
				player.delay = 8000;
			} else {
				if (d20plus.chat.players[current.id].online && !player.on) {
					notification = `${player.name} disconnected`;
					d20plus.chat.players[current.id].online = false;
				} else if (!d20plus.chat.players[current.id].online && player.on) {
					notification = `${player.name} connected`;
					d20plus.chat.players[current.id].online = true;
					player.delay = 8000;
				}
			}
			if (changelist && notification && d20plus.cfg.getOrDefault("chat", "showPlayerConnects")) {
				const id = d20plus.ut.generateRowId();
				d20plus.chat.drwho = d20plus.chat.drwho ? "" : "꞉꞉" // replace ":" with U+789 to separate messages
				d20.textchat.incoming(false, {
					who: d20plus.chat.drwho || "::",
					type: "general",
					id: id,
					avatar: `/users/avatar/${current.attributes.d20userid}/30`,
					content: notification,
				})
				$(`[data-messageid=${id}]`).append(playerConnectsTemplate(id));
				setTimeout(() => {
					d20plus.chat.checkPlayerVersion(current.id, id);
				}, player.delay)
			}
		})
	}

	d20plus.chat.incoming = (params) => {
		const msg = params[1];
		if (msg.playerid === d20_player_id || msg.type === "system") {
			const stash = [];
			while (d20plus.chat.localHistory.length) {
				const record = d20plus.chat.localHistory.pop();
				d20.textchat.commandhistory.pop();
				if (record) stash.push(record);
			}
			d20.textchat.commandhistory = d20.textchat.commandhistory.concat(stash);
		} else if (msg.type === "error") {
			d20plus.chat.localHistory.pop();
		}
		if (msg.type === "whisper") {
			if (params[1].playerid === d20_player_id) {
				d20plus.chat.lastRespondent = params[1].target_name;
			} else if (params[1].target.includes(d20_player_id)) {
				d20plus.chat.lastRespondent = d20.Campaign.players.get(params[1].playerid)?.attributes.displayname;
			}
		}
		if (d20plus.chat.mtms?.await && params[1]) {
			if (params[1].playerid === d20_player_id
				|| params[1].type === "error") d20plus.chat.mtms.success = true;
		}
		return {through: true, params};
	}

	d20plus.chat.outgoing = () => {
		const tc = d20.textchat.$textarea;

		if (d20plus.cfg.getOrDefault("chat", "emoji")) {
			tc.val(tc.val().replace(/(:\w*?:)/g, (m0, m1) => {
				const clean = m1.replace(/:/g, "");
				return d20plus.chat.emojiIndex && d20plus.chat.emojiIndex[clean] ? `[${clean}](https://github.com/TheGiddyLimit/emoji-dump/raw/master/out/${clean}.png)` : m1;
			}));
		}

		let text = tc.val();
		const srcText = text;

		if (d20plus.cfg.getOrDefault("chat", "commands")) {
			// add custom commands
			text = text.replace(/^\/wb(.*?)$/gm, d20plus.chat.sendReply);
			text = text.replace(/^\/ws(.*?)$/gm, d20plus.chat.sendToSelected);
			text = text.replace(/^\/ttms( |$)/s, "/talktomyself$1");
			text = text.replace(/^\/mtms(.*?)$/s, d20plus.chat.sendMyself);
			text = text.replace(/^\/help(.*?)$/s, d20plus.chat.help);
		}

		const toSend = $.trim(text);
		if (text !== srcText && text) d20plus.chat.localHistory.push($.trim(srcText));
			d20.textchat.doChatInput(toSend);
			tc.val("").focus();

		if (d20plus.cfg.getOrDefault("chat", "highlightttms")) {
			if (toSend.includes("/talktomyself")) {
				setTimeout(() => d20plus.chat.checkTTMSStatus(), 20);
			}
		}
	}

	d20plus.chat.enhanceChat = () => {
		d20plus.ut.log("Enhancing chat");
		d20plus.ut.injectCode(d20.textchat, "incoming", d20plus.chat.incoming);

		if (window.is_gm) {
			d20plus.chat.processPlayersList();
			const obsconfig = { childList: true, subtree: false };
			d20plus.cfg.playerWatcher = new MutationObserver(d20plus.chat.processPlayersList);
			d20plus.cfg.playerWatcher.observe($("#avatarContainer").get(0), obsconfig);
		}

		if (d20plus.cfg.getOrDefault("chat", "commands")) {
			const code = "<code style='cursor:pointer'>/help</code>";
			const wiki = "https://wiki.roll20.net/Text_Chat#Chat";
			$(".userscript-commandintro ul").append(`<li>Full list of chat commands<br>type or press ${code}<br>or visit <a target='blank' href='${wiki}'>roll20 wiki</a></li>`);
			$("#textchat").on("click", ".userscript-commandintro ul code", d20plus.chat.help);
		}

		$("#textchat-input").off("click", "button")
		$("#textchat-input").on("click", "button", d20plus.chat.outgoing);
	};
}

SCRIPT_EXTENSIONS.push(baseChat);
