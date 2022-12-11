function baseChat () {
	d20plus.chat = d20plus.chat || {};

	d20plus.chat.localHistory = [];
	d20plus.chat.lastRespondent = ""
	const e = "playerid";
	let comprehendsAll = false;

	d20plus.chat.toCamelCase = (string, lowercase) => {
		return string.charAt(0).toUpperCase() + (lowercase ? string.slice(1).toLowerCase() : string.slice(1));
	}

	// eslint-disable-next-line
	const languages = {"common":{"title":"common","lexis":["alae","alavairthae","alehose","amarast","anyhail","badaulder","darchains","dathna","deven","drios","durgos","elsun","evenfeast","eventide","fieldings","fireseared","galad","glim","haelhard","harbright","hardjaws","harnor","haularake","hawksnarl","highsun","hrammar","hrast","hrasting","hugor","hykyath","jursak","keghand","kell","lalandath","lamenor","lammath","lifeblood","marrado","mayhap","murdath","naed","naeth","nandra","navalar","nightjack","nightmaid","olor","orbal","parharding","plounce","potjack","potmaid","punnet","rhambukkya","rivvim","roofwrack","sabbas","sabruin","saer","sark","scorchkettle","sel","shaeling","sheelie","sildur","silverfin","skaether","slake","sorn","spear","spurnarmor","standath","steading","stettar","stlarn","stomran","straek","sumbor","tantam","tasmar","tenday","thael","thargur","tharsun","thoats","thruss","thulsun","tindertwig","tluin","topon","tumin","uluvathae","vasark","vlandranna","voh","waelo","wanton","wenich","zzar"],"particles":["fol","a","me","on","an","fo-","to-","do","per"],"alias":"human","factor":4},"dwarvish":{"title":"dwarvish","lexis":["akrak","angaz","azamar","azul","bakraz","barag","barak","baraz","bin","bin","bolg","brog","chuf","dal","dar","dharkhangron","doh","drakk","drazh","drek","drongnel","fleg","gorak","gorm","gorog","goruz","grim","grimaz","gromdal","gronit","grumbak","guz","guzzen","guzzen","hunk","karu","kazad","kazak","kazhunki","kazhunki","khaz","khazukan","klad","krink","kro","kron","kruk","kruti","migdhal","migdhal","mizpal","naggrund","nar","onk","orrud","ragarin","rik","rikigraz","rikigraz","rorkaz","ruf","runk","ruvalk","sar","skarrenruf","skruff","skrund","skuf","stok","thingaz","thongli","throng","thrund","thrynaz","thrynaz","tiwaz","tiwaz","trogg","umanar","umanar","und","undi","ungor","urk","varaz","varf","varn","vengryn","vlag","vorkhul","wan","wanaz","wazzock","werit","wyr","zak","zaki","zan","zank"],"particles":["ha ","a-","un","um","dum-","on-","or","ad","har"],"alias":"dwarven","factor":3},"elvish":{"title":"elvish","lexis":["alahen","alamanyar","alaninquitálima","alasaila","alaurē","alcárima","alcorin","aleldarin","alfárima","alfirin","alistima","alómear","alquettima","ampanotalea","ancale","ancárima","andúne","asanye","avante","celure","ceníte","cirmacin","etya","etyarin","farale","farastea","himíte","ilquárea","induinen","indyel","insil","intin","isil","istalima","istare","lacalima","laistea","laistila","laman","lamate","lambion","lamélima","lirale","líruima","manar","mára","mastima","mecin","milyar","mólome","nairea","naitie","nandor","nasque","nefíte","nemestea","nengwear","níríte","noldorin","númen","númerea","nyárula","nyelle","ocamnar","ólamar","ontale","ortalima","ortare","perómandar","púlima","puntar","qualme","quende","quenderin","quenelya","quettima","raiqua","símen","sinan","sinar","sindar","sinome","sintar","súrimar","suryar","taltea","tancal","tauvar","telerin","tírima","turindura","túvima","tyen","úcalima","úcárima","umbar","vanima","vórear","yúlima"],"particles":["na","en'","il'","né","ol'","an","o'","lor-","i-"],"alias":"elven|elf","factor":5},"giant":{"title":"giant","lexis":["arûna","ascûdgamln","astim","athrid","bahst","barzûl","barzûln","belard","beor","borith","brâgha","brak","carharûg","carkna","carn","darm","delva","dem","derûndân","dômar","dorzada","drâth","dûnost","dûrgrimst","dûrmgrist","ebardac","edaris","egraz","encesti","erôth","erôthknurl","estvarn","estver","etal","fanghur","feldûnost","felfarthen","felrast","formv","frekk","fûthmér","gáld","gáldhiem","gaml","ganaht","gar","gauhnith","gedthrall","gerdûm","ghastgar","goroth","grimstnzhadn","gûntera","harng","harûg","helzvog","hert","hiem","hírna","hort","hrenth","hrestvog","hreth","hrethcarach","hûthvír","hûtt","ingeitum","knurlcarathn","ledwonnû","meitder","mendûnost","menknurlan","mensagh","menthiv","menwarrev","mérna","mezzintar","mithrim","môgh","môgren","nal","narho","quan","ragni","sartos","sartosvrenht","sesti","sheilve","sweld","thardsvergûndnzmal","thargen","thorv","thriknzdal","thrond","trangnarn","urzhad","vrem","vrenht","wharn"],"particles":["dûr","az","azt","og","rra-","rna-","da-","rr-","gro"],"alias":"ogre","factor":3},"gnomish":{"title":"gnomish","lexis":["athon","aumata","budhu","burbo","buspo","caw","cewin","cha","curunír","eglath","ettuli","ghaik","ghustil","gurgof","hacta","hadhwa","haedh","hamna","hanin","hatta","hauda","haudh","hîn","huine","jez","kaincha","kainu","kait","kalach","kalas","kel","kelu","khamu","kheru","kith","koilu","koiru","koitā","kuinu","kuitā","kurwē","lauda","laudh","linna","liru","madha","mascu","matjā","matulā","melā","mîdh","mirhanac","nacte","nadha","naedh","natha","natte","ndilā","necte","nette","nidh","nîdh","nídha","niñkwis","ōmata","peles","pelsa","pentro","psar","psára","raef","rak","rathki","resta","revrykal","rîdh","rrakkma","sedu","taltas","tancula","tañkas","teles","telu","thar","thillu","thilnu","thoron","tinnúviel","tithilla","tolen","tolu","tuilu","tyaz","uba","umitl","varsh","vlaakith","xarā","xenna"],"particles":["ae","et","en","dam","bom","ne","m","ik","ro"],"alias":"gnome","factor":4},"goblin":{"title":"goblin","lexis":["ana","ari","armauk","auga","bagal","banam","banos","bauruk","bizel","booyahg","braeunk","bree","dabog","dargrath","dargum","daul","dha","durbuluk","fak","foshnu","fund","fushat","gever","gog","golog","guthash","hak","hruggekolohk","hu","hum","illska","karanzol","karkat","karkitas","kherek","kurrauz","laug","lind","lodar","lorach","loz","mabus","magas","margim","mub","mubaram","mubulat","mug","nagransham","namat","nixir","noldo","nor","nying","ovani","paflok","pafund","paken","palkas","parat","parhor","pik","plak","plasas","plasi","pluhun","poni","porandor","rup","ryk","sapat","shakab","shakapon","shakutarbik","shat","skag","tarthur","thag","tharb","thark","tharm","thos","thur","tok","trolkh","vadoksam","vadoksog","vaws","vaza","vek","vhos","vok","vosh","voz","yark","zabraz","zan","zongot","zorrat"],"particles":["ta","vo","no","suk","ya","yol","mar","mak","psa"],"alias":"goblinoid","factor":3},"halfling":{"title":"halfling","lexis":["adaldrida","balc","ban","banakil","banzir","barabatta","bas","bilba","bolgra","bophîn","branda","brandu","brandugamba","bree","carbandur","cast","castu","chet","cubuc","cugbagu","dûkan","dûkan","fallohide","froda","gad","galab","galbassi","galpsi","gamba","globa","gluva","grad","hamanullas","hamfast","harfoots","hloth","hlothran","isen","kali","kalimac","karningul","kast","kili","kûd","kuduk","labin","labingi","lograd","loho","lohtur","lothran","luthran","luthur","mathom","maura","nahald","nargian","nec","nîn","peppin","pharë","phur","phurunargian","ram","ran","rapha","rasputa","raspûta","raza","razan","razanur","razar","rog","sharku","smial","soval","stenr","stjarna","stoor","stydja","sund","sûza","tapuc","thain","tharantin","tharni","tóbias","tragu","trahald","trahan","trân","tuca","tung","tur","turac","wini","zara","zilbirapha","zir"],"particles":["a","o","ol-","nî","ul","lo","u","u-","so-"],"alias":"hobbit","factor":4}};

	function buildLanguageIndex () {
		d20plus.chat.languageIndex = {};
		Object.keys(languages).forEach(id => {
			const language = languages[id];
			d20plus.chat.languageIndex[id] = id;
			d20plus.chat.languageIndex[language.title] = id;
			language.alias.split("|").forEach(name => {
				d20plus.chat.languageIndex[name] = id;
			})
		});
	}

	function gibberish (string, langId, incompetent) {
		const paragraphs = string.split("\n");
		if (paragraphs.length > 1) return paragraphs.map(str => gibberish(str, langId, incompetent)).join("\n");
		const src_words = string.toLowerCase().match(/\p{L}+/gu);
		if (src_words === null) return "";
		const src_terms = string.toLowerCase().match(/(--\p{L}+|\p{L}+)/gu);
		const src_temp = [...src_words];
		const spacing = " ";
		const translation = src_words.map((word, i) => {
			const metaword = (i > 0 ? src_words[i - 1] : "") + word + (i < src_words.length - 1 && src_words.length > 2 ? src_words[i + 1] : "");
			let index = 0;
			Array.from(metaword).forEach((letter) => {
				index += letter.charCodeAt(0);
			});
			if (incompetent && Math.random() > 0.5) {
				const newid = Math.floor(Math.random() * src_temp.length);
				const newword = src_temp[newid];
				src_temp.splice(newid, 1);
				return newword + spacing;
			} else if (src_terms[i].includes("--")) {
				return d20plus.chat.toCamelCase(src_terms[i].replace(/--/gu, "")) + spacing;
			} else if ((index - 1) % 9 + 1 < languages[langId].factor && i < src_words.length - 1) {
				const newid = (index.toString().charAt(0) + index - 1) % 9;
				const spacing = /['-]$/.test(languages[langId].particles[newid]) ? "" : " ";
				return languages[langId].particles[newid] + spacing;
			} else {
				const newid = index.toString().slice(-2);
				return languages[langId].lexis[parseInt(newid)] + spacing;
			}
		});
		return d20plus.chat.toCamelCase(translation.join(""), false);
	}

	// console.log(gibberish("In publishing and graphic design, --Lorem --ipsum is a placeholder text commonly used to demonstrate the visual form of a document", undefined, false))
	// console.log(gibberish("I will kill you", undefined, false))

	function availableLanguages (charId) {
		const char = d20.Campaign.characters.get(charId);
		const langId = d20.journal.customSheets.availableAttributes.repeating_proficiencies_prof_type;
		const traits = char.attribs.models
			.filter(prop => {
				return prop.attributes.name.match(/repeating_proficiencies_(.*?)_prof_type/)
				&& ![langId, "LANGUAGE"].includes(prop.attributes.current);
			})
			.map(trait => trait.attributes.name.replace(/repeating_proficiencies_(.*?)_prof_type/, "$1"));
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
			.map(lan => lan.charAt(0).toUpperCase() + lan.slice(1).toLowerCase())
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
				d20plus.chat.getSpeakingIn(Object.keys(languages));
				$("#speakingin").val(prev);
			} else {
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

	const socialHTML = `
		<div class="btn" id="socialswitch">
			<span class="pictos">w</span>
		</div>
		<div style="float: left;" class="social">
			<label for="speakingto">To:</label>
			<select id="speakingto" class="selectize social">
				<option value="">All</option>
			</select>
			<label for="speakingin">In:</label>
			<select class="selectize social" id="speakingin">
				<option value=""></option>
			</select>
		</div>
		<style type="text/css">
			#textchat-input .social {
				display: none;
			}
			#textchat-input.social .social {
				display: inline-block;
			}
			#textchat-input.social textarea {
				height: 19px;
			}
			.selectize.social {
				width: 100px;
			}
			select#speakingto, select#speakingin {
				height: 22px;
				padding: 0px 5px;
			}
			#socialswitch {
				height: 18px;
				margin-left: 5px;
			}
			#textchat-input.talkingtoself textarea {
				border: 2px solid rgba(255,0,0,0.4);
				background-color: rgba(255,0,0,0.2);
			}
		</style>
	`;

	const languageTemplate = () => `
		<script id="sheet-rolltemplate-inlanguage" type="text/html">
			<span style="font-style:italic" title="${__("msg_chat_lang_title")} {{titlelanguage}}">
			<span style="font-weight:bold">{{displaylanguage}}</span> {{translated}}
			</span>
		</script>
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
		}, __("msg_b20_chat_help_title")));
		return "";
	}

	d20plus.chat.sendInLanguage = (string, lan) => {
		const lanid = d20plus.chat.getLanguageId(lan);
		const knows = window.is_gm || hasLanguageProfeciency(lanid);
		string = knows ? string : gibberish(string, lanid, true);
		const coded = btoa(encodeURI(string));
		const pos = Math.round(Math.random() * (coded.length - 2));
		const ready = coded.slice(0, pos) + btoa(encodeURI(d20_player_id)) + coded.slice(pos);
		return `${gibberish(string, lanid)}\n&{template:inlanguage} {{language=${lan}}} {{languageid=${lanid}}} {{encoded=${ready}}}`;
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

	d20plus.chat.sendToThoseWhoUnderstand = (text, msg) => {
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
			"showPlayerConnects": {
				"name": __("cfg_option_log_players_in_chat"),
				"default": true,
				"_type": "boolean",
			},
			"social": {
				"name": __("cfg_option_enable_social"),
				"default": true,
				"_type": "boolean",
				"_player": true,
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
			"showVersions": {
				"name": __("cfg_option_versions_from_players"),
				"default": true,
				"_type": "boolean",
			},
			"sendVersions": {
				"name": __("cfg_option_versions_to_gm"),
				"default": true,
				"_type": "boolean",
				"_player": "only",
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
		const ttms = $("#speakingto").val() === "ttms";
		if (d20.textchat.talktomyself && !ttms) {
			d20.textchat.doChatInput(`/talktomyself off`);
			d20plus.chat.localHistory.push(false);
			setTimeout(() => d20plus.chat.checkTTMSStatus(), 10);
		} else if (!d20.textchat.talktomyself && ttms) {
			d20.textchat.doChatInput(`/talktomyself on`);
			d20plus.chat.localHistory.push(false);
			setTimeout(() => d20plus.chat.checkTTMSStatus(), 10);
		}
	}

	d20plus.chat.processPlayersList = (changelist) => {
		// console.log(changelist);
		// console.log(d20.Campaign.players.models.reduce((outp, player) => `${outp} | ${player.attributes.displayname} ${player.attributes.online}`, ""));
		if (!d20plus.chat.players) d20plus.chat.players = {};
		d20.Campaign.players.models.forEach(player => {
			const player_state = player.attributes.online;
			const player_name = player.attributes.displayname;
			let notification = false;
			let drwho = player_name.length > 17 ? `${player_name.slice(0, 15)}...` : player_name;
			if (!d20plus.chat.players[player.id]) {
				d20plus.chat.players[player.id] = { online: player_state };
				notification = `${drwho}} ${__("msg_player_joined")}`;
				drwho = "::";
			} else {
				if (d20plus.chat.players[player.id].online && !player_state) {
					notification = `${drwho} ${__("msg_player_disconnected")}`;
					drwho = "::";
					d20plus.chat.players[player.id].online = false;
				} else if (!d20plus.chat.players[player.id].online && player_state) {
					notification = __("msg_player_connected");
					drwho = false;
					d20plus.chat.players[player.id].online = true;
				}
			}
			if (changelist && notification && d20plus.cfg.getOrDefault("chat", "showPlayerConnects")) {
				d20.textchat.incoming(false, {
					who: drwho || player_name,
					type: "general",
					// playerid: window.currentPlayer.id,
					// target: d20_player_id,
					id: d20plus.ut.generateRowId(),
					avatar: `/users/avatar/${player.attributes.d20userid}/30`,
					content: notification,
				})
			}
		})
	}

	d20plus.chat.incoming = (params) => {
		console.log(params[1], d20plus.chat.localHistory);
		const msg = params[1];
		const version_tmpl = /^VTTES .*? \| betteR20 .*?$/;
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
			if (window.is_gm && msg.content.match(version_tmpl)) {
				if (d20plus.cfg.getOrDefault("chat", "showVersions")) {
					msg.type = "general";
				} else {
					return;
				}
			} else if (params[1].playerid === d20_player_id) {
				d20plus.chat.lastRespondent = params[1].target_name;
			} else if (params[1].target.includes(d20_player_id)) {
				d20plus.chat.lastRespondent = d20.Campaign.players.get(params[1].playerid)?.attributes.displayname;
			}
		}
		if (d20plus.chat.mtms?.await && params[1]) {
			if (params[1].playerid === d20_player_id
				|| params[1].type === "error") d20plus.chat.mtms.success = true;
		}
		if (!d20plus.chat.sentVersion && !window.is_gm) {
			if (msg.content.match(version_tmpl)) {
				d20plus.chat.sentVersion = true;
				return;
			}
		}
		if (params[1].rolltemplate === "inlanguage") {
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
			text = text.replace(/\/in(.*?)$/gm, d20plus.chat.sendToThoseWhoUnderstand);
			text = text.replace(/\/wb(.*?)$/gm, d20plus.chat.sendReply);
			text = text.replace(/^\/ws(.*?)$/gm, d20plus.chat.sendToSelected);
			text = text.replace(/^\/ttms( |$)/s, "/talktomyself$1");
			text = text.replace(/^\/mtms(.*?)$/s, d20plus.chat.sendMyself);
			text = text.replace(/^\/help(.*?)$/s, d20plus.chat.help);
			// text = text.replace(/^\/cl (on|off)$/sm, comprehendLanguages);
		}

		if (d20plus.cfg.getOrDefault("chat", "social")) {
			const speakingto = $("#speakingto").val();
			const speakingin = $("#speakingin").val();

			if (speakingin) {
				if (!text.match(/^\/(.*?)$/)) text = d20plus.chat.sendInLanguage(text, speakingin);
			}

			if (speakingto && speakingto !== "ttms") {
				text = text.replace(/^([^/]*?)$/mgu, (...str) => {
					const prepared = str[1].replace(/\/(r|roll) ([ \dd+-]*?)$/umg, "[[$2]]");
					return `/w "${speakingto}" ${prepared}`;
				});
			}
		}

		const toSend = $.trim(text);
		if (text !== srcText && text) d20plus.chat.localHistory.push($.trim(srcText));
		d20.textchat.doChatInput(toSend);
		tc.val("").focus();
		if (text !== "" && d20plus.chat.social) {
			d20plus.chat.onsocial();
			if (!d20.textchat.talktomyself) $("#speakingto").val("");
			$("#speakingin").val("");
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
		} else if (d20plus.cfg.getOrDefault("chat", "sendVersions")) {
			d20.textchat.doChatInput([
				"/w gm ",
				`VTTES ${window.r20es?.hooks?.welcomeScreen?.config?.previousVersion}`,
				` | betteR20 ${d20plus.version}`,
			].join(""));
		}

		if (d20plus.cfg.getOrDefault("chat", "social")) {
			$("#textchat-input").append(socialHTML);
			$("#socialswitch").on("click", d20plus.chat.onsocial);
			$("#speakingas").on("change", d20plus.chat.onspeakingas);
			$("#speakingto").on("change", d20plus.chat.onspeakingto);
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
