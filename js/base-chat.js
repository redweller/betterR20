function baseChat () {
	d20plus.chat = d20plus.chat || {};

	d20plus.chat.localHistory = [];
	d20plus.chat.lastRespondent = "";
	const languages = d20plus.chat.languages;

	function buildLanguageIndex () {
		d20plus.chat.languageIndex = {};
		d20plus.chat.languageAdditions = {};
		Object.keys(languages).forEach(id => {
			const language = languages[id];
			d20plus.chat.languageIndex[id] = id;
			d20plus.chat.languageIndex[language.title.toLowerCase()] = id;
			language.alias.forEach(name => {
				d20plus.chat.languageIndex[name] = id;
			})
		});
	}

	function gibberish (string, langId, incompetent) {
		if (!languages[langId]) langId = d20plus.chat.languageAdditions[langId];
		if (!languages[langId]) return string;

		const paragraphs = string.split("\n");
		if (paragraphs.length > 1) return paragraphs.map(str => gibberish(str, langId, incompetent)).join("\n");

		// The code below generates pseudo-random text "in selected language".
		// Each separate word replacement is different in each case, yet chunks of 3 and more
		// words are always replaced with the same "words" to create an illusion of real translation.
		// This is done by calculating numerical value for each 3 words, and then using its last 2 digits
		// as an index to select "translated word" from the dictionary of 100 fake words.

		const particle = { left: false };
		const words = string.toLowerCase().match(/(--\p{L}+|\p{L}+)/gu);
		if (words === null) return "";
		if (incompetent) words.sort(() => Math.random() - 0.5);

		const calcIndex = (word) => {
			return Array.from(`${word}`).reduce((index, letter) =>
				index + letter.charCodeAt(0)
			, 0);
		};
		const indexes = words.map((word, i) => {
			const left = i ? calcIndex(words[i - 1]) : 0;
			const right = 2 * calcIndex(words[i + 1]);
			return left + calcIndex(word) + right;
		});

		const translations = indexes.map((index, i) => {
			particle.left = particle.this && particle.left;
			particle.this = (index - 1) % 9 + 1 < languages[langId].factor;
			const spacing = i < words.length - 1 ? " " : "";
			if (incompetent && Math.random() > 0.5) {
				return words[i] + spacing;
			} else if (words[i].indexOf("--") === 0) {
				return words[i].replace(/--/gu, "").uppercaseFirst() + spacing;
			} else if (particle.this && !particle.left && i < words.length - 1) {
				particle.left = true;
				const transId = (index.toString().charAt(0) + index - 1) % 9;
				const spacing = /['-]$/.test(languages[langId].particles[transId]) ? "" : " ";
				return languages[langId].particles[transId] + spacing;
			} else {
				const transId = index.toString().slice(-2);
				return languages[langId].lexis[parseInt(transId)] + spacing;
			}
		});

		translations[0] = translations[0].uppercaseFirst();
		return translations.join("");
	}

	function availableLanguages (charId) {
		const char = d20.Campaign.characters.get(charId);
		const langId = d20.journal.customSheets.availableAttributes.repeating_proficiencies_prof_type;
		if (d20plus.ut.charFetchAndRetry({char, callback: d20plus.chat.refreshLanguages})) return [];
		// roll20 OGL sheet stores languages differently compared to other traits
		// by default, they don't have corresponging "proficiency type" attribute
		// however, if you create a trait and THEN change it to be language, it will have LOCALIZED "language" proficiency type
		// so to find all languages, we must filter out other named traits, except for the traits named "language" or "(localized word for LANGUAGE)"
		const traits = char.attribs.models
			.filter(prop => {
				return prop.attributes.name.match(/repeating_proficiencies_(.*?)_prof_type/)
				&& ![langId, "LANGUAGE"].includes(prop.attributes.current);
			})
			.map(trait => trait.attributes.name.replace(/repeating_proficiencies_(.*?)_prof_type/, "$1"));
		// now that we have a list of named non-language traits we can just find what we need
		const charspeaks = char.attribs.models.map(prop => {
			const filter = /repeating_proficiencies_(.*?)_name/;
			if (prop.attributes.name.match(filter)) {
				const exp = new RegExp(filter);
				if (!traits.includes(exp.exec(prop.attributes.name)[1])) return prop.attributes.current;
			} else if (prop.attributes.name === "npc_languages") {
				return prop.attributes.current.split(", ");
			}
		}).filter(lang => lang !== undefined);
		return charspeaks.flatten().map(lan => lan.normalize());
	}

	function availableLanguagesPlayer (playerId) {
		const characters = d20.Campaign.characters.models
			.filter(char => {
				const actors = char.attributes.controlledby.split(",");
				return actors.includes(playerId);
			})
			.map(char => char.id);
		return characters.map(char => availableLanguages(char)).flatten();
	}

	function hasLanguageProfeciency (langid) {
		const profecientIn = availableLanguagesPlayer(d20_player_id).map(lan => d20plus.chat.getLanguageId(lan));
		return profecientIn.includes(d20plus.chat.getLanguageId(langid));
	}

	d20plus.chat.getSpeakingIn = (available) => {
		$("#speakingin").html(available
			.map(lan => lan.toSentenceCase())
			.reduce((html, lan) => `${html}<option>${lan}</option>`, "<option></option>"),
		);
	}

	d20plus.chat.getLanguageId = (lan) => {
		if (Array.isArray(lan)) return lan.map(language => d20plus.chat.getLanguageId(language));
		else return d20plus.chat.languageIndex[lan.normalize().toLowerCase()] || lan.normalize().toLowerCase();
	}

	d20plus.chat.refreshLanguages = () => {
		const speakingAs = $("#speakingas").val().split("|");
		const actorId = speakingAs[1];
		const actorIsPlayer = speakingAs[0] === "player";
		if (actorIsPlayer) {
			if (window.is_gm) {
				const prev = $("#speakingin").val();
				d20plus.chat.getSpeakingIn(Object.keys(languages)
					.filter(lan => !lan.includes("fake"))
					.map(lan => languages[lan].title));
				$("#speakingin").val(prev);
			} else {
				d20plus.chat.getSpeakingIn([]);
				$("#speakingin").val("<option></option>");
			}
		} else {
			const prev = $("#speakingin").val();
			d20plus.chat.getSpeakingIn(availableLanguages(actorId));
			$("#speakingin").val(prev);
		}
	}

	d20plus.chat.availableAddressees = () => {
		const players = d20.Campaign.players.models
			.filter(player => { return player.attributes.online && player.attributes.id !== d20_player_id; })
			.map(player => ({name: player.attributes.displayname, id: player.attributes.id}));
		const characters = d20.Campaign.characters.models
			.filter(char => {
				const actors = char.attributes.controlledby.split(",");
				return actors.some(actor => { return actor && players.map(player => player.id).includes(actor); })
			})
			.map(char => ({name: char.attributes.name}));
		return players.concat(characters);
	}

	d20plus.chat.setLanguagePreset = (message, language) => {
		if ($("#soundslike").length) return;
		const dialog = $(languageDialogTemplate(message, language));
		const src = d20.textchat.$textarea.val();
		const msg = {};
		setTimeout(() => {
			d20.textchat.$textarea.val(src);
			dialog.find("#soundslike").focus();
		}, 200);
		dialog.dialog({
			title: "Choose transcription",
			modal: true,
			width: 365,
			open: () => {
				msg.selected = dialog.find("#soundslike");
				msg.sample = dialog.find("#languageeg");
				$("#soundslike").change(() => {
					msg.sample.html(gibberish(message, msg.selected.val()));
				});
				msg.selected.focus();
			},
			close: () => {
				dialog.off();
				dialog.dialog("destroy").remove();
			},
			buttons: {
				[`Submit`]: function () {
					const val = msg.selected.val();
					const langId = language.normalize().toLowerCase();
					d20plus.ut.log(`Select language style ${language} to ${val}`);

					dialog.off();
					dialog.dialog("destroy").remove();
					d20.textchat.$textarea.focus();

					d20plus.chat.languageAdditions[langId] = val;
					$("#textchat-input button.btn").get(0).click();
				},
				[`Cancel`]: function () {
					dialog.off();
					dialog.dialog("destroy").remove();
				},
			},
		});
	}

	const languageTemplate = () => `
		<script id="sheet-rolltemplate-inlanguage" type="text/html">{{displaymessage}}<br>
			<span style="font-style:italic" title="You understand this because one of your characters speaks {{titlelanguage}}">
			<span style="font-weight:bold">{{displaylanguage}}</span> {{translated}}
			</span>
		</script>
	`;

	const languageDialogTemplate = (msg, language) => `
			<div>
				<p><strong>What does ${language} language sound like?</strong></p>
				<p>It seems you're trying to speak language not included in the standard list of D&D 5e PHB.</p>
				<p>That's not a problem. Please select one of the languages from the dropdown below, and it will be used for the imitated message.</p>
				<p>Your choice is purely cosmetic and will not affect who can or can not understand it. This will be remembered until you refresh the page.</p>
				<span style="display:block; height: 40px;">
					<label style="display: inline-block;" for="soundslike">Transcribe as:</label>
					<select id="soundslike" style="float: right; width: 60%;">
						${Object.keys(languages).reduce((options, lang) => `${options}<option value="${lang}">${lang}</option>`, "")}
					</select>
				</span>
				<p>This is what your message will look like with the current selection to those who don't speak ${language}:</p>
				<p><textarea id="languageeg" disabled="" style="width: 100%; box-sizing: border-box; height: 50px;cursor: default;resize: none; background: rgba(100, 100, 150, 0.2);"
					>${gibberish(msg, "common")}</textarea>
				</p>
			</div>
	`;

	const playerVersionsTemplate = (id) => `
			<input type="checkbox" class="connects-state" id="connects${id}-state"/>
			<label for="connects${id}-state">
				<span id="connects${id}-info" class="connects-info" title="Show player details">0</span>
				<span id="connects${id}" class="connects-log">
				B20 not responding...
				</span>
			</label>
	`;

	const chatHelp = [
		["/w (name)", "private message (whisper)"],
		["/w gm", "private message to your GM"],
		["/wb", "reply or whisper to last contact", "b20"],
		["/ws", "whisper to selected tokens", "b20"],
		["/em, /me", "emote (action from your POV)"],
		["/in (language)", "speak in a language", "b20"],
		["--(word)", "skip word (for in-language)", "b20"],
		// ["/cl on|off", "comprehend language switch", "b20"],
		["/talktomyself", "silent mode on/off"],
		["/ttms", "shortcut to /talktomyself", "b20"],
		["/mtms (text)", "simple message to self", "b20"],
		["/ooc, /o", "out of character (as player)"],
		["/roll, /r (XdY)", "roll dice, e.g. /r 2d6"],
		["/gmroll, /gr (XdY)", "roll only for GM"],
		["/desc", "GM-only describe events", null, "gm"],
		["/as (name)", "GM-only speak as Name", null, "gm"],
		["/emas (name)", "GM-only emote as Name", null, "gm"],
		["/v (name)", "GM-only get script versions", "b20", "gm"],
		["&#42;(text)&#42;", "format text: italic"],
		["&#42;&#42;(text)&#42;&#42;", "format text: bold"],
		["&#96;&#96;(text)&#96;&#96;", "format text: code"],
		["&#126;&#126;(text)&#126;&#126;", "format text: strikethrough"],
		["/fx (params)", "show visual effect"],
		["#(macro)", "run specified macro"],
		["/help", "show this list of chat commands", "b20"],
		["", "<a style=\"font-variant: diagonal-fractions; font-size: smaller; font-variant-caps: small-caps;\" href=\"https://wiki.roll20.net/Text_Chat\">roll20 wiki</a>"],
	];

	d20plus.chat.help = (text, msg) => {
		d20plus.ut.sendHackerChat(chatHelp.reduce((html, string) => {
			const isb20 = string[2] === "b20" ? "&#42;" : "";
			const code = string[0] ? `<code>${string[0]}</code>${isb20}` : "&nbsp;";
			const gmcheck = string[3] !== "gm" || window.is_gm;
			const langcheck = d20plus.cfg.getOrDefault("chat", "languages") || string[0].search(/(in \(language\))|(-\(word\))/) === -1;
			if (gmcheck && langcheck) return `${html}<br>${code}<span style="float:right"> ${string[1]}</span>`;
			return html;
		}, "<strong>List of chat commands:</strong><br>betteR20 commands marked with &#42;"));
		return "";
	}

	const msgActionButtonTemplate = (data) => {
		const id = d20plus.ut.generateRowId();
		const actions = {
			spell: {title: "Revert action", icon: "r"},
			request: {title: "Request script info", icon: "?"},
		};
		Object.assign(data, actions[data.type]);
		return `<span id="action${id}-button"
			class="msg-action-button"
			data-action="${data.type}|${data.action}" title="${data.title}">${data.icon}
		</span>`;
	};

	d20plus.chat.actions = { run: (id) => {
		d20plus.chat.actions[id]?.callback(d20plus.chat.actions[id]?.params);
		delete d20plus.chat.actions[id];
	}};

	d20plus.chat.smallActionBtnAdd = (msg, action) => {
		const id = d20plus.ut.generateRowId();
		const actions = {
			request: {title: "Request script info", icon: "?", callback: d20plus.chat.requestScriptVersions},
		}[action.type];
		d20plus.chat.actions[id] = Object.assign({params: action}, actions);
		msg.append(`<span class="msg-action-button showtip tipsy-n-right"
			data-action="${id}" title="${actions.title}">${actions.icon}
		</span>`);
	}

	d20plus.chat.smallActionBtnPress = (event) => {
		const $el = $(event.target);
		const id = $el.attr("data-action");
		d20plus.chat.actions.run(id);
	}

	d20plus.chat.requestScriptVersions = (params, msg) => {
		const id = d20plus.ut.generateRowId();
		msg = msg || `"${params.name}"`;
		msg.replace(/^("?)(?<name>[^ ]+|[^"]+)\1.*$/u, (...str) => {
			const name = str.last().name;
			const transport = {type: "handshake", id};
			d20.textchat.doChatInput(`/w "${name}" &nbsp;`, undefined, transport);
		});
		return "";
	}

	d20plus.chat.modifyMsg = (id, mod) => {
		d20plus.chat.modify = d20plus.chat.modify || {};
		d20plus.chat.modify[id] = d20plus.chat.modify[id] || {};
		Object.assign(d20plus.chat.modify[id], mod);
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

	d20plus.chat.resetSendMyself = () => {
		if (d20plus.chat.mtms?.await) {
			d20.textchat.talktomyself = false;
			delete d20plus.chat.mtms;
		}
	}

	d20plus.chat.sendMyself = (text, msg) => {
		// This enables talktomyself mode only for the block of commands in the textarea
		// and then a hook in d20plus.chat.r20outgoing (doChatInput injection) disables it
		d20.textchat.talktomyself = true;
		setTimeout(() => {
			d20.textchat.doChatInput(msg);
			d20plus.chat.mtms = {await: true};
		}, 20);
		return "";
	}

	d20plus.chat.sendReply = (text, msg) => {
		const lastRespondent = d20plus.chat.lastRespondent;
		if (lastRespondent) return `/w "${lastRespondent}"${msg}`;
		else d20plus.ut.sendHackerChat("You have to start a private chat with someone first", true);
		return "";
	}

	d20plus.chat.sendToSelected = (text, msg) => {
		const canSpeakTo = d20plus.chat.availableAddressees().map(char => char.name);
		const addressees = d20.engine.selected()
			.map(token => token._model.character.attributes?.name)
			.filter(name => canSpeakTo.includes(name));
		if (addressees.length) return addressees.reduce((result, name) => { return `${result}/w "${name}"${msg}\n` }, "");
		else d20plus.ut.sendHackerChat("You have to select tokens belonging to actual players", true);
		return "";
	}

	d20plus.chat.sendInLanguage = (message, language) => {
		let langId = d20plus.chat.getLanguageId(language);
		if (!languages[langId] && !d20plus.chat.languageAdditions[langId]) {
			d20plus.chat.setLanguagePreset(message, language);
			return "";
		}
		const knows = window.is_gm || hasLanguageProfeciency(langId);
		message = knows ? message : gibberish(message, langId, true);
		return `${gibberish(message, langId)}|&inlang|${language}|&meta|${langId}|&meta|${message}`;
	}

	d20plus.chat.sendParsedInLanguage = (text, msg) => {
		return msg.replace(/^("?)(?<lang>[^ ]+|[^"]+)\1 (?<msg>.+)$/u, (...str) => {
			const inlang = str.last();
			return d20plus.chat.sendInLanguage(inlang.msg, inlang.lang);
		});
	}

	d20plus.chat.getSpeakingTo = () => {
		const prev = $("#speakingto").val();
		$("#speakingto").html((() => {
			return d20plus.chat.availableAddressees().reduce((result, addressee) => {
				const icon = addressee.id ? "🗣" : "⚑";
				const option = `${icon} ${addressee.name}`;
				const value = `value="${addressee.name}"`;
				result += `<option ${value}>${option}</option>`;
				return result;
			}, `<option value="">All</option><option value="ttms">None</option>`);
		})());
		$("#speakingto").val(prev);
	}

	addConfigOptions(
		"chat", {
			"social": {
				"name": "Enable chat social panel (requires restart)",
				"default": true,
				"_type": "boolean",
				"_player": true,
			},
			"showPlayerConnects": {
				"name": "Show player connects messages",
				"default": true,
				"_type": "boolean",
			},
			"commands": {
				"name": "Additional text chat commands (/help for full list)",
				"default": true,
				"_type": "boolean",
				"_player": true,
			},
			"highlightttms": {
				"name": "Highlight text box when in TTMS mode",
				"default": true,
				"_type": "boolean",
				"_player": true,
			},
		},
	);

	d20plus.chat.onsocial = () => {
		const $input_container = $("#textchat-input");
		if (!d20plus.chat.social) {
			const resized = $input_container.attr("style").includes("height")
			if (resized) $input_container.addClass("social-resized");
			else $input_container.addClass("social-default");
			d20plus.chat.refreshLanguages();
			d20plus.chat.getSpeakingTo();
			d20plus.chat.social = true;
		} else {
			d20plus.chat.closeSocial();
		}
	}

	d20plus.chat.onspeakingas = () => {
		d20plus.chat.refreshLanguages();
	}

	d20plus.chat.onspeakingto = () => {
		const speakingto = $("#speakingto").val();
		const ttms = speakingto === "ttms";
		if (d20.textchat.talktomyself && !ttms) {
			d20.textchat.doChatInput(`/talktomyself off`);
			d20plus.chat.localHistory.push(false);
			setTimeout(() => d20plus.chat.checkTTMSStatus(), 10);
		} else if (!d20.textchat.talktomyself && ttms) {
			d20.textchat.doChatInput(`/talktomyself on`);
			d20plus.chat.localHistory.push(false);
			setTimeout(() => d20plus.chat.checkTTMSStatus(), 10);
		}
		if (speakingto && !ttms) {
			$("#textchat-social-notifier").addClass("b20-to");
			$("#textchat-social-notifier-to").text(speakingto);
		} else {
			$("#textchat-social-notifier").removeClass("b20-to");
		}
	}

	d20plus.chat.onspeakingin = () => {
		const speakingin = $("#speakingin").val();
		if (speakingin) {
			$("#textchat-social-notifier").addClass("b20-in");
			$("#textchat-social-notifier-in").text(speakingin);
		} else {
			$("#textchat-social-notifier").removeClass("b20-in");
		}
	}

	d20plus.chat.resetSocial = () => {
		if (!d20.textchat.talktomyself) $("#speakingto").val("");
		$("#speakingin").val("");
		$("#textchat-social-notifier").removeClass("b20-in");
		$("#textchat-social-notifier").removeClass("b20-to");
	}

	d20plus.chat.resetTTMS = () => {
		$("#speakingto").val("");
		d20plus.chat.onspeakingto();
	}

	d20plus.chat.closeSocial = () => {
		const $input_container = $("#textchat-input");
		d20plus.chat.social = false;
		$input_container.removeClass("social-resized");
		$input_container.removeClass("social-default");
	}

	d20plus.chat.processPlayersList = (changelist) => {
		if (!d20plus.chat.players) d20plus.chat.players = {};
		d20.Campaign.players.models.forEach(current => {
			const player = {
				on: current.attributes.online,
				name: current.attributes.displayname,
			};
			let notification = false;
			player.name = player.name.length > 17 ? `${player.name.slice(0, 15)}...` : player.name;
			if (!d20plus.chat.players[current.id]) {
				d20plus.chat.players[current.id] = { online: player.on };
				notification = "joined";
			} else {
				if (d20plus.chat.players[current.id].online && !player.on) {
					notification = "disconnected";
					d20plus.chat.players[current.id].online = false;
				} else if (!d20plus.chat.players[current.id].online && player.on) {
					notification = "connected";
					d20plus.chat.players[current.id].online = true;
				}
			}
			if (changelist && notification && d20plus.cfg.getOrDefault("chat", "showPlayerConnects")) {
				const id = d20plus.ut.generateRowId();
				d20plus.chat.modifyMsg(id, {class: "system connect", decolon: true});
				if (!player.on) d20plus.chat.modifyMsg(id, {class: "system disconnect"});
				if (player.on) d20plus.chat.modifyMsg(id, {action: {type: "request", name: player.name}});
				d20.textchat.incoming(false, { id,
					type: "general",
					who: `${player.on ? "" : "&nbsp;"}${player.name}`,
					avatar: `/users/avatar/${current.attributes.d20userid}/30`,
					content: `${notification}`,
				});
			}
		})
	}

	d20plus.chat.r20outgoing = (params) => {
		d20plus.chat.resetSendMyself();
	}

	d20plus.chat.r20incoming = (params) => {
		const msg = params[1];
		msg.from_me = msg.playerid === d20_player_id;
		msg.to_me = msg.target?.indexOf(d20_player_id) > -1;

		// For rolls &  r20 generates duplicate messages that don't show on the log with
		// params [sound, msg, true, true]. Hence check params[2]&[3] !== true to avoid double processing
		if (params[2] === true && params[3] === true) return;
		if (d20.textchat.chatstartingup) return;

		if (msg.from_me || msg.type === "system") {
			const stash = [];
			while (d20plus.chat.localHistory.length) {
				const record = d20plus.chat.localHistory.pop();
				if (record) {
					stash.push(record);
					d20.textchat.commandhistory.pop();
				}
			}
			d20.textchat.commandhistory = d20.textchat.commandhistory.concat(stash);
		}
		if (msg.type === "whisper") {
			if (msg.from_me) {
				d20plus.chat.lastRespondent = msg.target_name;
			} else if (msg.to_me) {
				d20plus.chat.lastRespondent = d20plus.ut.getPlayerNameById(msg.playerid);
			}
		}
		if (msg.listenerid?.language && d20plus.cfg.getOrDefault("chat", "languages")) {
			const speech = msg.listenerid;
			const know_language = hasLanguageProfeciency(speech.languageid);
			if (window.is_gm || msg.from_me || know_language) {
				const translated = speech.message.replace(/\n/g, "<br>").replace(/ --([^ ^-])/g, " $1");
				msg.content += `<br><i title="You understand this because one of your characters speaks ${speech.language}">
					<strong>(${speech.language})</strong> ${translated}</i>`;
				d20plus.chat.modifyMsg(msg.id, {class: "inlang"});
			}
		} else if (msg.listenerid?.type === "handshake") {
			if (msg.from_me && !msg.listenerid.data) {
				msg.content = `script versions info`;
				msg.avatar = `/users/avatar/${d20plus.ut.getAccountById(msg.target)}/30`;
				d20plus.chat.modifyMsg(msg.id, {class: "system connects", decolon: true, versions: msg.listenerid.id});
			} else if (msg.from_me && msg.listenerid.data) {
				return false;
			} else if (msg.to_me && !msg.listenerid.data) {
				const name = d20plus.ut.getPlayerNameById(msg.playerid);
				msg.listenerid.data = d20plus.ut.generateVersionInfo();
				d20.textchat.doChatInput(`/w "${name}" &nbsp;`, undefined, msg.listenerid);
				return false;
			} else if (msg.to_me && msg.listenerid.data) {
				$(`#connects${msg.listenerid.id}`).html(d20plus.ut.parseVersionInfo(msg.listenerid.data));
				$(`#connects${msg.listenerid.id}-state`).attr("checked", "true");
				$(`#connects${msg.listenerid.id}-info`).text("3");
				return false;
			}
		}
		if (d20.textchat.talktomyself && msg.from_me) {
			if (d20plus.cfg.getOrDefault("chat", "highlightttms")) d20plus.chat.modifyMsg(msg.id, {class: "talktomyself"});
		}
		return params;
	}

	d20plus.chat.displaying = (params) => {
		Object.entries({...d20plus.chat.modify}).forEach(([id, mods]) => {
			const msg = $(`[data-messageid=${id}]`);
			if (!msg.get(0)) return;
			if (mods.declass) msg.removeClass(mods.declass);
			if (mods.class) msg.addClass(mods.class);
			if (mods.versions) msg.append(playerVersionsTemplate(mods.versions));
			if (mods.decolon) msg.find(".by").text((i, txt) => txt.replace(/(?:\(To |)(.+?)\)?:/, "$1"));
			if (mods.action) d20plus.chat.smallActionBtnAdd(msg, mods.action);
			delete d20plus.chat.modify[id];
		});
		/* $(`.message .userscript-modify-message`).each((i, el) => {
			const msg = { $el: $(el) };
			msg.body = msg.$el.closest(".message");
			msg.by = msg.body.find(".by");
			msg.$el.text().split("|").forEach(p => {
				const params = p.split(":");
				if (params.length === 2) msg[params[0]] = params[1];
			});
			if (msg.declass) msg.body.removeClass(msg.class);
			if (msg.class) msg.body.addClass(msg.class);
			if (msg.undo) msg.body.append(msgActionButtonTemplate({type: "undo"}));
			if (msg.request) msg.body.append(msgActionButtonTemplate({type: "request", action: msg.request}));
			if (msg.versions) msg.body.append(playerVersionsTemplate(msg.versions));
			if (msg.decolon) msg.by.text(msg.by.text().replace(/(?:\(To |)(.+?)\)?:/, "$1"));
			msg.$el.remove();
		}); */
	}

	d20plus.chat.sending = () => {
		d20plus.chat.resetSendMyself();
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
			text = text.replace(/^\/wb (.*?)$/gm, d20plus.chat.sendReply);
			text = text.replace(/^\/ws (.*?)$/gm, d20plus.chat.sendToSelected);
			text = text.replace(/^\/ttms( |$)/s, "/talktomyself$1");
			text = text.replace(/^\/help(.*?)$/s, d20plus.chat.help);
			if (!d20.textchat.talktomyself) text = text.replace(/^\/mtms ?(.*?)$/s, d20plus.chat.sendMyself);
			if (is_gm) text = text.replace(/^\/v (.*?)$/s, d20plus.chat.requestScriptVersions);
			if (d20plus.cfg.getOrDefault("chat", "languages")) text = text.replace(/\/in (.*?)$/gm, d20plus.chat.sendParsedInLanguage);
			// text = text.replace(/^\/cl (on|off)$/sm, comprehendLanguages);
		}

		if (d20plus.cfg.getOrDefault("chat", "social")) {
			const speakingto = $("#speakingto").val();
			const speakingin = $("#speakingin").val();

			if (speakingin) {
				text = text.replace(/^[^/][^{^}]*?$/gm, msg => {
					return d20plus.chat.sendInLanguage(msg, speakingin);
				});
			}

			if (speakingto && speakingto !== "ttms") {
				text = text.replace(/^([^/]*?)$/mgu, (...str) => {
					const prepared = str[1].replace(/\/(r|roll) (?<dice>[ \dd+-]*)$/umg, "[[$<dice>]]");
					return `/w "${speakingto}" ${prepared}`;
				});
			}
		}

		let toSend = $.trim(text);
		if (text !== srcText && text) d20plus.chat.localHistory.push($.trim(srcText));
		if ($("#soundslike").get(0)) toSend = "";

		if (toSend.indexOf("|&inlang|") >= 0) {
			toSend.split("\n").forEach((str, i) => {
				const data = str.split("|&inlang|");
				if (data.length === 2) {
					const msg = data[0];
					const meta = data[1].split("|&meta|");
					const transport = {language: meta[0], languageid: meta[1], message: meta[2]};
					d20.textchat.doChatInput(msg, undefined, transport);
				} else {
					d20.textchat.doChatInput(str);
				}
			})
			tc.val("").focus();
		} else {
			d20.textchat.doChatInput(toSend);
			tc.val("").focus();
		}

		if (d20plus.cfg.getOrDefault("chat", "highlightttms")) {
			if (toSend.includes("/talktomyself")) {
				setTimeout(() => d20plus.chat.checkTTMSStatus(), 20);
			}
		}
	}

	d20plus.chat.enhanceChat = () => {
		d20plus.ut.log("Enhancing chat");
		d20plus.ut.injectCode(d20.textchat, "incoming", d20plus.chat.r20incoming);
		d20plus.ut.injectCode(d20.textchat, "doChatInput", d20plus.chat.r20outgoing);

		$("body").append(languageTemplate());
		buildLanguageIndex();

		const obsconfig = { childList: true, subtree: false };
		d20plus.cfg.chatWatcher = new MutationObserver(d20plus.chat.displaying);
		d20plus.cfg.chatWatcher.observe($("#textchat .content").get(0), obsconfig);

		if (window.is_gm) {
			d20plus.chat.processPlayersList();
			const obsconfig = { childList: true, subtree: false };
			d20plus.cfg.playerWatcher = new MutationObserver(d20plus.chat.processPlayersList);
			d20plus.cfg.playerWatcher.observe($("#avatarContainer").get(0), obsconfig);
		}

		if (d20plus.cfg.getOrDefault("chat", "social")) {
			const $input_container = $("#textchat-input");
			const $chat_notifier = $("#textchat-notifier");
			const $chat_textarea = d20.textchat.$textarea;

			$input_container.append(d20plus.html.chatSocial);
			$input_container.prepend(d20plus.html.chatSocialNotifier);
			$("#chatSendBtn").after($("#socialswitch"));
			$("#textchat-note-container").append($chat_notifier);

			$chat_textarea.on("focus", d20plus.chat.closeSocial);
			$chat_notifier.on("click", d20plus.chat.resetTTMS);
			$("#textchat-social-notifier").on("click", d20plus.chat.resetSocial);

			$("#socialswitch").on("click", d20plus.chat.onsocial);
			$("#speakingas").on("change", d20plus.chat.onspeakingas);
			$("#speakingto").on("change", d20plus.chat.onspeakingto);
			$("#speakingin").on("change", d20plus.chat.onspeakingin);

			d20plus.chat.getSpeakingTo();
		}

		if (d20plus.cfg.getOrDefault("chat", "commands")) {
			const code = "<code style='cursor:pointer'>/help</code>";
			const wiki = "https://wiki.roll20.net/Text_Chat#Chat";
			$(".userscript-commandintro ul").append(`<li>Full list of chat commands<br>type or press ${code}<br>or visit <a target='blank' href='${wiki}'>roll20 wiki</a></li>`);
			d20.textchat.$textchat
				.on("click", ".userscript-commandintro ul code", d20plus.chat.help)
				.on("click", ".msg-action-button", d20plus.chat.smallActionBtnPress);
		}

		$("#textchat-input").off("click", "button");
		$("#textchat-input").on("click", "button", d20plus.chat.sending);
	};
}

SCRIPT_EXTENSIONS.push(baseChat);
