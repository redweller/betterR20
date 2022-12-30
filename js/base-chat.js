function baseChat () {
	d20plus.chat = d20plus.chat || {};

	d20plus.chat.localHistory = [];
	d20plus.chat.lastRespondent = "";
	const languages = d20plus.chat.languages;
	let comprehendsAll = false;

	function buildLanguageIndex () {
		d20plus.chat.languageIndex = {};
		d20plus.chat.languageAdditions = {};
		Object.keys(languages).forEach(id => {
			const language = languages[id];// RB20 EXCLUDE START

			const alias = `${__(`lang_alias_${id}`)}`
			language.title = `${__(`lang_${id}`)}`;
			if (!language.alias) language.alias = alias;
			else language.alias = "".concat(language.alias, ", ", alias);
			// RB20 EXCLUDE END
			d20plus.chat.languageIndex[id] = id;
			d20plus.chat.languageIndex[language.title.toLowerCase()] = id;
			language.alias.split(", ").forEach(name => {
				d20plus.chat.languageIndex[name] = id;
			})
		});
	}

	function gibberish (string, langId, incompetent) {
		if (!Object.keys(languages).includes(langId)) langId = d20plus.chat.languageAdditions[langId];
		if (!Object.keys(languages).includes(langId)) return string;
		const paragraphs = string.split("\n");
		if (paragraphs.length > 1) return paragraphs.map(str => gibberish(str, langId, incompetent)).join("\n");
		const src_words = string.toLowerCase().match(/\p{L}+/gu);
		if (src_words === null) return "";
		const src_terms = string.toLowerCase().match(/(--\p{L}+|\p{L}+)/gu);
		const src_temp = [...src_words];
		const spacing = " ";
		let prev_particle = false;
		const translation = src_words.map((word, i) => {
			const metaword = (i > 0 ? src_words[i - 1] : "") + word + (i < src_words.length - 1 && src_words.length > 2 ? src_words[i + 1] : "");
			let index = 0;
			Array.from(metaword).forEach((letter) => {
				index += letter.charCodeAt(0);
			});
			if (incompetent && Math.random() > 0.5) {
				prev_particle = false;
				const newid = Math.floor(Math.random() * src_temp.length);
				const newword = src_temp[newid];
				src_temp.splice(newid, 1);
				return newword + spacing;
			} else if (src_terms[i].includes("--")) {
				prev_particle = false;
				return d20plus.ut.toSentenceCase(src_terms[i].replace(/--/gu, "")) + spacing;
			} else if ((index - 1) % 9 + 1 < languages[langId].factor && i < src_words.length - 1 && !prev_particle) {
				prev_particle = true;
				const newid = (index.toString().charAt(0) + index - 1) % 9;
				const spacing = /['-]$/.test(languages[langId].particles[newid]) ? "" : " ";
				return languages[langId].particles[newid] + spacing;
			} else {
				prev_particle = false;
				const newid = index.toString().slice(-2);
				return languages[langId].lexis[parseInt(newid)] + spacing;
			}
		});
		return d20plus.ut.toSentenceCase(translation.join(""), false);
	}

	// console.log(gibberish("In publishing and graphic design, --Lorem --ipsum is a placeholder text commonly used to demonstrate the visual form of a document", undefined, false))
	// console.log(gibberish("I will kill you", undefined, false))

	function availableLanguages (charId) {
		const char = d20.Campaign.characters.get(charId);
		const langId = d20.journal.customSheets.availableAttributes.repeating_proficiencies_prof_type;
		// first check if character sheet is loaded, if not - initialize it
		if (!char.attribs.length && !char.attribs.fetching) {
			char.attribs.fetch(char.attribs);
			char.attribs.fetching = true;
			const wait = setInterval(function () {
				if (char.attribs.length) {
					clearInterval(wait);
					delete char.attribs.fetching;
					d20plus.chat.refreshLanguages();
				}
			}, 20);
		}
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
			.map(lan => d20plus.ut.toSentenceCase(lan, true))
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
			.map(player => [player.attributes.displayname, player.attributes.id]);
		const characters = d20.Campaign.characters.models
			.filter(char => {
				const actors = char.attributes.controlledby.split(",");
				return actors.some(actor => { return actor && players.map(player => player[1]).includes(actor); })
			})
			.map(char => [char.attributes.name, false]);
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
				[`${__("ui_dialog_submit")}`]: function () {
					const val = msg.selected.val();
					const langId = language.normalize().toLowerCase();
					d20plus.ut.log(`Select language style ${language} to ${val}`);

					dialog.off();
					dialog.dialog("destroy").remove();
					d20.textchat.$textarea.focus();

					d20plus.chat.languageAdditions[langId] = val;
					$("#textchat-input button.btn").get(0).click();
				},
				[`${__("ui_dialog_cancel")}`]: function () {
					dialog.off();
					dialog.dialog("destroy").remove();
				},
			},
		});
	}

	const languageTemplate = () => `
		<script id="sheet-rolltemplate-inlanguage" type="text/html">{{displaymessage}}<br>
			<span style="font-style:italic" title="${__("msg_chat_lang_title")} {{titlelanguage}}">
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
		["/w (name)", __("msg_chat_help_w")],
		["/w gm", __("msg_chat_help_wgm")],
		["/wb", __("msg_chat_help_wb"), "b20"],
		["/ws", __("msg_chat_help_ws"), "b20"],
		["/em, /me", __("msg_chat_help_em")],
		["/in (language)", __("msg_chat_help_in"), "b20"],
		["--(word)", __("msg_chat_help_inname"), "b20"],
		// ["/cl on|off", __("msg_chat_help_cl"), "b20"],
		["/talktomyself", __("msg_chat_help_sm")],
		["/ttms", __("msg_chat_help_ttms"), "b20"],
		["/mtms (text)", __("msg_chat_help_mtms"), "b20"],
		["/ooc, /o", __("msg_chat_help_ooc")],
		["/roll, /r (XdY)", __("msg_chat_help_r")],
		["/gmroll, /gr (XdY)", __("msg_chat_help_gr")],
		["/desc", __("msg_chat_help_desc"), "gm"],
		["/as (name)", __("msg_chat_help_as"), "gm"],
		["/emas (name)", __("msg_chat_help_emas"), "gm"],
		["&#42;(text)&#42;", __("msg_chat_help_fi")],
		["&#42;&#42;(text)&#42;&#42;", __("msg_chat_help_fb")],
		["&#96;&#96;(text)&#96;&#96;", __("msg_chat_help_fc")],
		["&#126;&#126;(text)&#126;&#126;", __("msg_chat_help_fs")],
		["/fx (params)", __("msg_chat_help_fx")],
		["#(macro)", __("msg_chat_help_m")],
		["/help", __("msg_chat_help"), "b20"],
		["", "<a style=\"font-variant: diagonal-fractions; font-size: smaller; font-variant-caps: small-caps;\" href=\"https://wiki.roll20.net/Text_Chat\">roll20 wiki</a>"],
	];

	d20plus.chat.help = (text, msg) => {
		d20plus.ut.sendHackerChat(chatHelp.reduce((html, string) => {
			const isb20 = string[2] === "b20" ? "&#42;" : "";
			const code = string[0] ? `<code>${string[0]}</code>${isb20}` : "&nbsp;";
			const gmcheck = string[2] !== "gm" || window.is_gm;
			const langcheck = d20plus.cfg.getOrDefault("chat", "languages") || string[0].search(/(in \(language\))|(-\(word\))/) === -1;
			if (gmcheck && langcheck) return `${html}<br>${code}<span style="float:right"> ${string[1]}</span>`;
			return html;
		}, __("msg_b20_chat_help_title")));
		return "";
	}

	d20plus.chat.sendInLanguage = (message, language) => {
		d20plus.ut.log(message, language);
		let languageid = d20plus.chat.getLanguageId(language);
		if (!Object.keys(languages).includes(languageid)) {
			if (!Object.keys(d20plus.chat.languageAdditions).includes(languageid)) {
				d20plus.chat.setLanguagePreset(message, language);
				return "";
			}
		}
		const knows = window.is_gm || hasLanguageProfeciency(languageid);
		message = knows ? message : gibberish(message, languageid, true);
		// const coded = btoa(encodeURI(string));
		// const pos = Math.round(Math.random() * (coded.length - 2));
		// const encoded = coded.slice(0, pos) + btoa(encodeURI(d20_player_id)) + coded.slice(pos);
		// return `${gibberish(string, lanid)}\n&{template:inlanguage} {{language=${language}}} {{languageid=${languageid}}} {{encoded=${encoded}}}`;
		// d20plus.chat.msgInLang = {language, languageid, message};
		return `${gibberish(message, languageid)}|&inlang|${language}|&meta|${languageid}|&meta|${message}`;
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

	d20plus.chat.sendParsedInLanguage = (text, msg) => {
		return msg.replace(/^ (?:(\p{L}+)|"(.*?)") (.*?)$/u, (...str) => {
			return d20plus.chat.sendInLanguage(str[3], str[1] || str[2]);
		});
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
			const phdm = info.phdm ? "<br>Detected DarkMode script" : "";
			let html = `Detected betteR20-${info.b20n} v${info.b20v}<br>Detected VTTES v${info.vtte}${phdm}<br>Info updated ${time}`;
			if (d20plus.ut.cmpVersions(info.b20v, d20plus.version) < 0) html += `<br>Player's betteR20 may be outdated`;
			if (d20plus.ut.cmpVersions(info.vtte, window.r20es?.hooks?.welcomeScreen?.config?.previousVersion) < 0) html += `<br>Player's betteR20 may be outdated`;
			$(`#connects${id}`).html(html);
			$(`#connects${id}-info`).html("i");
		} else {
			$(`#connects${id}`).html("VTTES/betteR20 not installed or version info sharing is disabled");
		}
	}

	d20plus.chat.getSpeakingTo = () => {
		const prev = $("#speakingto").val();
		$("#speakingto").html((() => {
			return d20plus.chat.availableAddressees().reduce((result, addressee) => {
				const icon = addressee[1] ? "🗣" : "⚑";
				const option = `${icon} ${addressee[0]}`;
				const value = `value="${addressee[0]}"`;
				result += `<option ${value}>${option}</option>`;
				return result;
			}, `<option value="">All</option><option value="ttms">None</option>`);
		})());
		$("#speakingto").val(prev);
	}

	// for debugging
	// d20plus.ut.injectCode(d20.textchat, "incoming", (params) => {console.log(params); return {through: true, params}});
	// document.querySelector('iframe').contentDocument.body.querySelector("div").style.color = "red"
	// modify iframe

	addConfigOptions(
		"chat", {
			"social": {
				"name": __("cfg_option_enable_social"),
				"default": true,
				"_type": "boolean",
				"_player": true,
			},
			"showPlayerConnects": {
				"name": __("cfg_option_log_players_in_chat"),
				"default": true,
				"_type": "boolean",
			},
			"commands": {
				"name": __("cfg_option_additional_commands"),
				"default": true,
				"_type": "boolean",
				"_player": true,
			},
			"highlightttms": {
				"name": __("cfg_option_highlight_ttms"),
				"default": true,
				"_type": "boolean",
				"_player": true,
			},
			"shareVersions": {
				"name": __("cfg_option_share_version_info"),
				"default": true,
				"_type": "boolean",
				"_player": true,
			},
		},
	);

	d20plus.chat.onsocial = () => {
		d20plus.chat.social = !d20plus.chat.social;
		if (d20plus.chat.social) {
			$("#textchat-input").addClass("social");
			d20plus.chat.refreshLanguages();
			d20plus.chat.getSpeakingTo();
		} else {
			$("#textchat-input").removeClass("social");
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

	d20plus.chat.closeSocial = () => {
		d20plus.chat.social = false;
		$("#textchat-input").removeClass("social");
	}

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
				notification = `${player.name} ${__("msg_player_joined")}`;
				player.delay = 8000;
			} else {
				if (d20plus.chat.players[current.id].online && !player.on) {
					notification = `${player.name} ${__("msg_player_disconnected")}`;
					d20plus.chat.players[current.id].online = false;
				} else if (!d20plus.chat.players[current.id].online && player.on) {
					notification = `${player.name} ${__("msg_player_connected")}`;
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
					// playerid: window.currentPlayer.id,
					// target: d20_player_id,
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
		// eslint-disable-next-line no-console
		console.log(params[1], d20plus.chat.localHistory);
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
		if (d20plus.cfg.getOrDefault("chat", "languages") && msg.listenerid?.language) {
			const speech = msg.listenerid;
			const is_current_player = msg.playerid === d20_player_id;
			const knows_language = hasLanguageProfeciency(speech.languageid);
			const translated = speech.message.replace(/\n/g, "<br>").replace(/ --([^ ^-])/g, " $1");
			if (window.is_gm || is_current_player || knows_language) {
				msg.content = `
					{{displaymessage=${msg.content}}}
					{{displaylanguage=(${speech.language})}}
					{{titlelanguage=${speech.language}}}
					{{translated=${translated}}}`;
				msg.rolltemplate = "inlanguage";
				delete msg.listenerid;
			}
			/* return `{{displaylanguage=(${lang})}} {{titlelanguage=${lang}}} {{translated=${decodedFinal}}}`;
			const template = /\{\{language=(.*?)\}\} \{\{languageid=(.*?)\}\} \{\{encoded=(.*?)\}\}/;
			params[1].content = params[1].content
				.replace(template, (str, lang, lanId, encoded) => {
					const request = params[1];
					const is_current_player = request.playerid === d20_player_id;
					const knows_language = hasLanguageProfeciency(lanId);
					if (window.is_gm || is_current_player || knows_language) {
						const decoded = decodeURI(atob(encoded.replace(btoa(encodeURI(params[1][e])), "")));
						const decodedFinal = decoded.replace(/\n/g, "<br>").replace(/ --([^ ^-])/g, " $1");
						return `{{displaylanguage=(${lang})}} {{titlelanguage=${lang}}} {{translated=${decodedFinal}}}`;
					}
				});
			*/
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
			if (d20plus.cfg.getOrDefault("chat", "languages")) text = text.replace(/\/in(.*?)$/gm, d20plus.chat.sendParsedInLanguage);
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
					const prepared = str[1].replace(/\/(r|roll) ([ \dd+-]*?)$/umg, "[[$2]]");
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
		d20plus.ut.injectCode(d20.textchat, "incoming", d20plus.chat.incoming);

		$("body").append(languageTemplate());
		buildLanguageIndex();

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
			$("#textchat-note-container").append($chat_notifier);

			$chat_textarea.on("focus", d20plus.chat.closeSocial);
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
			$(".userscript-commandintro ul").append(__("msg_b20_chat_help", [code, wiki]));
			$("#textchat").on("click", ".userscript-commandintro ul code", d20plus.chat.help);
		}

		$("#textchat-input").off("click", "button")
		$("#textchat-input").on("click", "button", d20plus.chat.outgoing);
	};
}

SCRIPT_EXTENSIONS.push(baseChat);
