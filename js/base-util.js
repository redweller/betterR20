function baseUtil () {
	const vttesUrl = "https://justas-d.github.io/roll20-enhancement-suite/";
	let shownHardDickWarning = false;

	d20plus.ut = {};

	// d20plus.ut.WIKI_URL = "https://wiki.5e.tools"; // I'll be back ...
	d20plus.ut.WIKI_URL = "https://web.archive.org/web/20210826155610/https://wiki.5e.tools";

	d20plus.ut.log = (...args) => {
		// eslint-disable-next-line no-console
		console.log("%cD20Plus > ", "color: #3076b9; font-size: large", ...args);
		$("#boring-progress").html(`<span>&gt;</span>${args.join(" ").toLocaleLowerCase()}`);
	};

	d20plus.ut.error = (...args) => {
		// eslint-disable-next-line no-console
		console.error("%cD20Plus > ", "color: #b93032; font-size: large", ...args);
	}; // RB20 EXCLUDE START

	d20plus.ut.localize = (str, substitutes) => {
		if (substitutes) {
			output = `${d20plus.ln.default[str]}`;
			for (const needle in substitutes) {
				output = output.replace(`$${needle}`, substitutes[needle]);
			}
			return output;
		} else if (d20plus.ln.default[str]) {
			return d20plus.ln.default[str];
		} else {
			return str;
		}
	}

	window.__ = d20plus.ut.localize;

	d20plus.ut.selectLocale = () => {
		const lan = (typeof LANGUAGE !== "undefined" ? LANGUAGE : "en");
		if ((lan === "en") || (!d20plus.ln[lan])) return;
		for (const id in d20plus.ln.en) {
			if (d20plus.ln[lan][id]) {
				d20plus.ln.default[id][0] = d20plus.ln[lan][id][0];
			}
		}
	} // RB20 EXCLUDE END

	d20plus.ut.chatLog = (arg) => {
		d20.textchat.incoming(
			false,
			{
				who: "betteR20",
				type: "general",
				content: (arg || "").toString(),
				playerid: window.currentPlayer.id,
				id: d20plus.ut.generateRowId(),
				target: window.currentPlayer.id,
				avatar: "https://i.imgur.com/bBhudno.png",
			},
		);
	};

	d20plus.ut.ascSort = (a, b) => {
		if (b === a) return 0;
		return b < a ? 1 : -1;
	};

	d20plus.ut.fix3dDice = () => {
		Object.defineProperty(Array.prototype, "filter", {
			enumerable: false,
			value: Array.prototype.filter,
		});

		Object.defineProperty(Array.prototype, "map", {
			enumerable: false,
			value: Array.prototype.map,
		});
	};

	d20plus.ut.injectCode = (object, method, injectedCode) => {
		const original = object[method].bind(object);
		object[method] = (...initParams) => {
			return injectedCode.bind(object)(original, initParams);
		}
	}// RB20 EXCLUDE START

	d20plus.ut.interceptCode = (object, method, injectedCode) => {
		const original = object[method].bind(object);
		object[method] = (...initParams) => {
			const passParams = injectedCode(initParams);
			return original.apply(original, initParams);
		}
	}// RB20 EXCLUDE END

	d20plus.ut.checkVersion = () => { // RB20 EXCLUDE START
		d20plus.ut.plantVersionInfo();// RB20 EXCLUDE END
		d20plus.ut.log("Checking current version");

		const isStreamer = !!d20plus.cfg.get("chat", "streamerChatTag");
		const scriptName = isStreamer ? "Script" : "betteR20";
		$.ajax({
			url: `https://raw.githubusercontent.com/redweller/betterR20/run/betteR20-version`,
			success: (data) => {
				if (data) {
					const curr = d20plus.version;
					const avail = data;
					const cmp = d20plus.ut.cmpVersions(curr, avail);
					if (cmp < 0) {
						setTimeout(() => {
							if (!isStreamer) {
								const rawToolsInstallUrl = "https://github.com/redweller/betterR20/raw/run/betteR20-5etools.user.js";
								const rawCoreInstallUrl = "https://github.com/redweller/betterR20/raw/run/betteR20-core.user.js";
								d20plus.ut.sendHackerChat(__("msg_b20_version", [scriptName, avail, rawToolsInstallUrl, rawCoreInstallUrl]));
							} else {
								d20plus.ut.sendHackerChat(__("msg_b20_version_stream", [scriptName]));
							}
						}, 1000);
					}
				}
			},
			error: () => {
				d20plus.ut.log("Failed to check version");
			},
		})
	};

	d20plus.ut.showHardDickMessage = (scriptName) => {
		if (shownHardDickWarning) return;
		shownHardDickWarning = true;

		d20plus.ut.sendHackerChat(`
			${scriptName} needs VTT Enhancement Suite! Please install it from <a href="${vttesUrl}">here</a>.
			<br>
		`, true);
	};

	d20plus.ut.chatTag = () => {
		const legacyStyle = !!d20plus.cfg.getOrDefault("chat", "legacySystemMessagesStyle");
		const showWelcome = !!d20plus.cfg.getOrDefault("chat", "showWelcomeMessage");
		const isStreamer = !!d20plus.cfg.get("chat", "streamerChatTag");
		const classname = !legacyStyle ? "userscript-b20intro" : "userscript-hackerintro";
		const scriptName = isStreamer ? "Script" : d20plus.scriptName;
		const data = [
			d20plus.scriptName,
			window.r20es?.hooks?.welcomeScreen?.config?.previousVersion,
			d20plus.ut.WIKI_URL,
		];
		const welcomeTemplate = (b20v, vttv, faq) => `
			<div class="${classname}">
				<img src="" class="userscript-b20img" style="content: unset; width:30px;position: relative;top: 10px;float: right;">
				<h1 style="display: inline-block;line-height: 25px;margin-top: 5px; font-size: 22px;">
					betteR20 
					<span style=" font-size: 13px ; font-weight: normal">by 5etools</span>
					<p style="font-size: 11px;line-height: 15px;font-family: monospace;color: rgb(32, 194, 14);">${__("msg_welcome_versions", [b20v, vttv])}</p>
				</h1>
				<p>${__("msg_welcome_faq", [faq])} <a href="https://discord.gg/nGvRCDs"><strong>Discord</strong></a>.</p>
				<span title="${__("msg_welcome_sarcasm")}">
					<p>${__("msg_welcome_p1")}</p>
					<p>${__("msg_welcome_p2")}</p>
				</span>
			</div>
		`;
		const $boringProgress = $("#boring-progress");
		if (showWelcome) {
			if (!isStreamer) {
				d20plus.ut.sendHackerChat(welcomeTemplate(...data));
			} else {
				d20plus.ut.sendHackerChat(__("msg_b20_vtte_init", [scriptName]));
			}
		}
		if (window.enhancementSuiteEnabled) {
			$boringProgress.before(`<span><span>&gt;</span>vtt enhancement suite detected</span>`)
		} else {
			d20plus.ut.showHardDickMessage(scriptName);
		}
		$boringProgress
			.before(`<span><span>&gt;</span>all systems operational</span>`)
			.html("");// RB20 EXCLUDE START
		/* if (d20plus.cfg.getOrDefault("chat", "resizeSidebarElements")) {
			$("#rightsidebar").on("mouseout", d20plus.ut.resizeSidebar);
			$("body").on("mouseup", d20plus.ut.resizeSidebar);
			d20plus.ut.resizeSidebar("startup");
		} */ // RB20 EXCLUDE END
		setTimeout(() => {
			const $bored = $(`.boring-chat`);
			$bored.css("height", "0px");
			setTimeout(() => {
				$bored.remove();
				clearInterval(d20plus.ut.cursor);
			}, 2000);
		}, 6000);
	};

	d20plus.ut.showInitMessage = () => {
		const consTemplate = `<div class="boring-chat">
			<span><span>&gt;</span>initializing, please wait...</span>
			<span id="boring-progress"><span>&gt;</span>loading data</span>
			<span id="boring-cursor"><span>&gt;</span><aside>|</aside></span>
			<style type="text/css">
			.boring-chat {
				font-family: Menlo, Monaco, Consolas, monospace;
				font-size: small;
				background: black;
				display: inline-block;
				font-weight: bold;
				color: rgb(32, 194, 14);
				width: 100%;
				position: sticky;
				z-index: 1000;
				top: 0px;
				height: 110px;
				transition: height 2s;
				overflow: hidden;
				border-bottom: 1px solid rgb(32, 194, 14);
			}
			.boring-chat > span {
				display: block; white-space: nowrap;
				padding: 0px 5px 0px 45px;
			}
			.boring-chat > span > span {
				float: left; margin-left: -39px;
			}
			</style>
		</div>`;
		$(`#textchat`).prepend(consTemplate);
		let blink = false;
		const $bored = $(`.boring-chat`);
		d20plus.ut.cursor = setInterval(() => {
			$bored.append($(`.boring-cursor`));
			if (blink) $bored.find(`aside`).html("|");
			else $bored.find(`aside`).html("");
			blink = !blink;
		}, 300);
	};

	d20plus.ut.showLoadingMessage = () => {
		const isStreamer = !!d20plus.cfg?.get("chat", "streamerChatTag");
		const scriptName = isStreamer ? "Script" : d20plus.scriptName;
		const loadMsgTemplate = `<span><span>&gt;</span>loading ${d20plus.scriptName}</span>`;
		if (!isStreamer) $(".boring-chat > span:first-child").after(loadMsgTemplate);
		if (!window.enhancementSuiteEnabled) d20plus.ut.showHardDickMessage(scriptName);
		// to get rid of an uncaught error that keeps appearing on timely basis
		if (!window.DD_RUM) window.DD_RUM = {addAction: () => {} };
	}

	d20plus.ut.sendHackerChat = (message, error = false) => {
		const legacyStyle = !!d20plus.cfg.get("chat", "legacySystemMessagesStyle");
		if (!message) return;
		d20.textchat.incoming(false, ({
			who: "system",
			type: !legacyStyle && error ? "error" : "system",
			content: (legacyStyle ? `<span class="${error ? "hacker-chat-error" : "hacker-chat"}">
				${message}
			</span>` : message),
		}));
	};// RB20 EXCLUDE START

	d20plus.ut.plantVersionInfo = () => {
		const thisPlayer = d20?.Campaign.players.get(d20_player_id);
		if (!thisPlayer) return;
		if (thisPlayer.get("script")) {
			thisPlayer.set("script", null, true);
			thisPlayer.save();
		}
	}// RB20 EXCLUDE END

	d20plus.ut.generateVersionInfo = () => {
		d20plus.ut.log("Generating version info");
		const b20n = encodeURI(d20plus.scriptName.split("-")[1].split(" v")[0]);
		const b20v = encodeURI(d20plus.version);
		const vtte = encodeURI(window.r20es?.hooks?.welcomeScreen?.config?.previousVersion);
		const phdm = d20plus.ut.detectDarkModeScript();
		const date = Number(new Date());
		const info = btoa(JSON.stringify({b20n, b20v, vtte, phdm, dnd20: window.b20, date}));
		return info;
	}

	d20plus.ut.parseVersionInfo = (raw) => {
		const info = JSON.parse(decodeURI(atob(raw)));
		const time = d20plus.ut.timeAgo(info.date);
		const phdm = info.phdm ? "<br>Detected DarkMode script" : "";
		const dnd20 = info.dnd20 ? "<br>Detected Beyond20 extension" : "";
		let html = `Detected betteR20-${info.b20n} v${info.b20v}<br>Detected VTTES v${info.vtte}${phdm}${dnd20}<br>Info updated ${time}`;
		if (d20plus.ut.cmpVersions(info.b20v, d20plus.version) < 0) html += `<br>Player's betteR20 may be outdated`;
		if (d20plus.ut.cmpVersions(info.vtte, window.r20es?.hooks?.welcomeScreen?.config?.previousVersion) < 0) html += `<br>Player's VTTES may be outdated`;
		return html;
	}

	d20plus.ut.cmpVersions = (present, latest) => {
		if (!present || !latest) return 0;
		const regExStrip0 = /(\.0+)+$/;
		const segmentsA = present.replace(regExStrip0, "").split(".");
		const segmentsB = latest.replace(regExStrip0, "").split(".");
		const l = Math.min(segmentsA.length, segmentsB.length);

		for (let i = 0; i < l; i++) {
			const diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
			if (diff) {
				return diff;
			}
		}
		return segmentsA.length - segmentsB.length;
	}

	d20plus.ut.detectDarkModeScript = () => {
		d20plus.ut.dmscriptDetected = false;
		// Detect if player is using Roll20 Dark Theme
		// https://github.com/Pharonix/Roll20-Dark-Theme
		$("style").each((i, el) => {
			if (el.textContent.indexOf("/*New Characteristics Menu*/") >= 0) {
				d20plus.ut.dmscriptDetected = true;
				return false;
			}
		});
		return d20plus.ut.dmscriptDetected;
	}// RB20 EXCLUDE START
	/*
	d20plus.ut.resizeSidebar = (init) => {
		const $sidebar = $("#rightsidebar");
		if (init === "startup" || $sidebar.hasClass("ui-resizable-resizing")) {
			const sidebarwidth = $sidebar.width();
			const tabmenuwidth = sidebarwidth < 310 ? 299 : sidebarwidth - 11;
			let textdelta = 9;
			if (d20plus.ut.dmscriptDetected) textdelta = 6;
			$("#textchat-input").width(sidebarwidth - textdelta);
			$(".tabmenu").width(tabmenuwidth);
		}
	} */ // RB20 EXCLUDE END

	d20plus.ut.addCSS = (selectors, rules) => {
		if (!(selectors instanceof Array)) selectors = [selectors];

		selectors.forEach(selector => {
			try {
				const index = d20plus.css.sheet.cssRules.length;
				if ("insertRule" in d20plus.css.sheet) {
					d20plus.css.sheet.insertRule(`${selector}{${rules}}`, index);
				} else if ("addRule" in d20plus.css.sheet) {
					d20plus.css.sheet.addRule(selector, rules, index);
				}
			} catch (e) {
				if ((!selector && selector.startsWith("-webkit-"))) {
					// eslint-disable-next-line no-console
					console.error(`Selector was "${selector}"; rules were "${rules}"`, e);
				}
			}
		});
	};

	d20plus.ut.addAllCss = () => {
		d20plus.ut.log("Adding CSS");

		const sheetElement = document.createElement("style");
		d20plus.css.sheet = document.head.appendChild(sheetElement).sheet;

		_.each(d20plus.css.baseCssRules, function (r) {
			d20plus.ut.addCSS(r.s, r.r);
		});
		if (!window.is_gm) {
			_.each(d20plus.css.baseCssRulesPlayer, function (r) {
				d20plus.ut.addCSS(r.s, r.r);
			});
		}
		_.each(d20plus.css.cssRules, function (r) {
			d20plus.ut.addCSS(r.s, r.r);
		});
	};

	d20plus.ut.timeAgo = (ts) => {
		const difInteger = Number(new Date()) - Number(ts);
		const difMinutes = Math.ceil((difInteger - 60000) / 60000);
		const difHours = Math.ceil((difInteger - 3600000) / 3600000);
		const difDays = Math.ceil((difInteger - 86400000) / 86400000);
		if (difDays > 0) return `${difDays} ${__("d ago")}`;
		if (difHours > 0) return `${difHours} ${__("hr ago")}`;
		if (difMinutes > 0) return `${difMinutes} ${__("min ago")}`;
		return `0 ${__("min ago")}`;
	}

	d20plus.ut.getAntiCacheSuffix = () => {
		return `?${(new Date()).getTime()}`;
	};

	d20plus.ut.generateRowId = () => {
		return window.generateUUID().replace(/_/g, "Z");
	};

	d20plus.ut.randomRoll = (roll, success, error) => {
		d20.textchat.diceengine.process(roll, success, error);
	};

	d20plus.ut.getJournalFolderObj = () => {
		d20.journal.refreshJournalList();
		let journalFolder = d20.Campaign.get("journalfolder");
		if (journalFolder === "") {
			d20.journal.addFolderToFolderStructure("Characters");
			d20.journal.refreshJournalList();
			journalFolder = d20.Campaign.get("journalfolder");
		}
		return JSON.parse(journalFolder);
	}; // RB20 EXCLUDE START

	d20plus.ut.charFetchAndRetry = ({char, callback, params = []} = {}) => {
		const attribs = char?.attribs;
		if (!attribs) return true;
		if (!attribs.length) {
			if (attribs.fetching) return true;
			attribs.fetch(attribs);
			attribs.fetching = true;
			const wait = setInterval(function () {
				if (attribs.length) {
					clearInterval(wait);
					delete char.attribs.fetching;
					callback(...params);
				}
			}, 20);
			return true;
		}
	} // RB20 EXCLUDE END

	d20plus.ut.fetchCharAttribs = async (char) => {
		const attribs = char?.attribs;
		if (!attribs) return false;
		if (attribs.length) {
			return char;
		}
		if (!attribs.fetching) {
			attribs.fetch(attribs);
			attribs.fetching = true;
		}
		return new Promise(resolve => {
			let inProgress = 0;
			const wait = setInterval(() => {
				inProgress++;
				if (attribs.length) resolve(char);
				if (attribs.length || inProgress > 100) {
					resolve(false);
					clearInterval(wait);
					delete attribs.fetching;
					d20plus.ut.log(`Tried fetching ${char.attributes.name}`);
				}
			}, 30);
		});
	}

	d20plus.ut._lastInput = null;
	d20plus.ut.getNumberRange = (promptText, min, max) => {
		function alertInvalid () {
			alert("Please enter a valid range.");
		}

		function isOutOfRange (num) {
			return num < min || num > max;
		}

		function addToRangeVal (range, num) {
			range.add(num);
		}

		function addToRangeLoHi (range, lo, hi) {
			for (let i = lo; i <= hi; ++i) {
				range.add(i);
			}
		}

		function alertOutOfRange () {
			alert(`Please enter numbers in the range ${min}-${max} (inclusive).`);
		}

		while (true) {
			const res = prompt(promptText, d20plus.ut._lastInput || "E.g. 1-5, 8, 11-13");
			if (res && res.trim()) {
				d20plus.ut._lastInput = res;
				const clean = res.replace(/\s*/g, "");
				if (/^((\d+-\d+|\d+),)*(\d+-\d+|\d+)$/.exec(clean)) {
					const parts = clean.split(",");
					const out = new Set();
					let failed = false;

					for (const part of parts) {
						if (part.includes("-")) {
							const spl = part.split("-");
							const numLo = Number(spl[0]);
							const numHi = Number(spl[1]);

							if (isNaN(numLo) || isNaN(numHi) || numLo === 0 || numHi === 0 || numLo > numHi) {
								alertInvalid();
								failed = true;
								break;
							}

							if (isOutOfRange(numLo) || isOutOfRange(numHi)) {
								alertOutOfRange();
								failed = true;
								break;
							}

							if (numLo === numHi) {
								addToRangeVal(out, numLo);
							} else {
								addToRangeLoHi(out, numLo, numHi);
							}
						} else {
							const num = Number(part);
							if (isNaN(num) || num === 0) {
								alertInvalid();
								failed = true;
								break;
							} else {
								if (isOutOfRange(num)) {
									alertOutOfRange();
									failed = true;
									break;
								}
								addToRangeVal(out, num);
							}
						}
					}

					if (!failed) {
						d20plus.ut._lastInput = null;
						return out;
					}
				} else {
					alertInvalid();
				}
			} else {
				d20plus.ut._lastInput = null;
				return null;
			}
		}
	};

	d20plus.ut.getTokensDistanceText = (tokenAmodel, tokenBmodel) => {
		if (!tokenAmodel?.attributes || !tokenBmodel?.attributes) return "";
		const page = d20.Campaign.activePage().attributes;
		const tokenA = tokenAmodel.attributes;
		const tokenB = tokenBmodel.attributes;
		const distX = Math.abs(tokenA.left - tokenB.left) - tokenA.width / 2 - tokenB.width / 2 + 70;
		const distY = Math.abs(tokenA.top - tokenB.top) - tokenA.height / 2 - tokenB.height / 2 + 70;
		const distMapUnits = (dist) => Math.round(dist / 70 * (page.scale_number || 5));
		if (page.diagonaltype === "foure") {
			const maxDist = Math.max(distX, distY);
			return `${distMapUnits(maxDist)} ${page.scale_units || "ft."}`;
		} else if (page.diagonaltype === "manhattan") {
			const totDist = distX + distY;
			return `${distMapUnits(totDist)} ${page.scale_units || "ft."}`;
		} else {
			const distPixels = Math.sqrt(distX ** 2 + distY ** 2);
			return `${distMapUnits(distPixels)} ${page.scale_units || "ft."}`;
		}
	};

	d20plus.ut.getPathById = (pathId) => {
		return d20plus.ut._getCanvasElementById(pathId, "thepaths");
	};

	d20plus.ut.getTokenById = (tokenId) => {
		return d20plus.ut._getCanvasElementById(tokenId, "thegraphics");
	};

	d20plus.ut.getAccountById = (playerId) => {
		return d20.Campaign.players.get(playerId)?.attributes?.d20userid;
	};

	d20plus.ut.getPlayerNameById = (playerId) => {
		return d20.Campaign.players.get(playerId)?.attributes?.displayname;
	};

	d20plus.ut._getCanvasElementById = (id, prop) => {
		const found = d20.Campaign.pages.models.find(model => model[prop]?.get(id));
		return found ? found[prop].get(id) : null;
	};

	d20plus.ut.getMacroByName = (macroName) => {
		const macros = d20.Campaign.players.map(p => p.macros.find(m => m.get("name") === macroName && (p.id === window.currentPlayer.id || m.visibleToCurrentPlayer())))
			.filter(Boolean);
		if (macros.length) {
			return macros[0];
		}
		return null;
	};

	d20plus.ut.getCharacter = (charRef) => {
		if (charRef === "selected") return d20.engine.selected()[0]?.model?.character;
		const characters = d20.Campaign.characters;
		if (charRef.id) return characters._byId[charRef.id];
		return characters._byId[charRef]
			|| characters.models.find(char => char.attributes.name === charRef);
	}

	d20plus.ut.getCharAttribByName = (char, attribName) => {
		return char.attribs?.models?.find(prop => prop?.attributes?.name === attribName);
	};

	d20plus.ut.getCharAbilityByName = (char, abilbName) => {
		return char.abilities?.models?.find(prop => prop?.attributes?.name === abilbName);
	};

	d20plus.ut.getCharMetaAttribByName = (char, attribNamePart, caseInsensitive) => {
		const extract = /^repeating_(?:attack|inventory|proficiencies|resource|spell_(?:\d?|cantrip)|traits)_[^_]*(?:_resource_(?:right|left)|)/;
		const toFind = caseInsensitive ? attribNamePart.toLowerCase() : attribNamePart;
		const metaAttrib = {_ref: {}};
		char.attribs?.models.forEach(prop => {
			const find = caseInsensitive
				? prop.attributes?.name.toLowerCase().includes(toFind)
				: prop.attributes?.name.includes(toFind);
			if (!find) return;
			metaAttrib._ref._id = metaAttrib._ref._id
				|| prop.attributes.name.match(extract)?.last()
				|| attribNamePart;
			const attribName = prop.attributes.name.replace(metaAttrib._ref._id, "").slice(1);
			metaAttrib[attribName || "current"] = prop.attributes.current;
			metaAttrib._ref[attribName || "current"] = prop;
			if (prop.attributes.max) {
				metaAttrib[`${attribName}max`] = prop.attributes.max;
				metaAttrib._ref[`${attribName}max`] = prop;
			}
		});
		if (Object.entries(metaAttrib).length > 1) return metaAttrib;
	}

	d20plus.ut.getActionTmpl = (template) => {
		const res = {noDice: template};
		const getIndex = () => {
			const index = res.path[2]?.slice(1);
			if (!res.path[2] || res.path[2][0] !== "$" || isNaN(index)) return;
			const repquery = ["_reporder"].concat(res.path.slice(0, 2)).join("_");
			const reporder = d20plus.ut.getCharAttribByName(res.char, repquery)?.attributes.current;
			if (reporder) {
				res.path[2] = reporder.split(",")[index];
			} else {
				const reporder = res.char.attribs?.models?.filter(prop => {
					const check = prop?.attributes?.name.split("_");
					return check[1] === res.path[1] && check.last() === "name";
				}).map(prop => prop.attributes.name.split("_")[2]);
				res.path[2] = reporder[index] || res.path[2];
			}
		}
		const getRoll = (tmpl) => `${tmpl}`.replace(/@\{(?<attr>\w*)\}/g, (...group) => {
			const prop = group.last().attr;
			const subAttr = res.action[prop];
			const preserveRef = ["_mod", "d20", "npc_name_flag"].some(ref => prop.includes(ref));
			const preloadRef = prop === "show_desc"
				? res.action.description || ""
				: d20plus.ut.getCharAttribByName(res.char, prop)?.attributes.current;
			d20plus.ut.log("--REPLACING", group[0], " FOR ", (subAttr !== undefined ? getRoll(subAttr) : preloadRef) || (preserveRef ? `@{${prop}}` : ""))
			return (subAttr !== undefined ? getRoll(subAttr) : preloadRef) || (preserveRef ? `@{${prop}}` : "");
		}).replace("repeating_attack_spelldesc_link", () => {
			return [`${res.char.id}|`, "repeating_attack_", res.path[2], "_spelldesc_link"].join("");
		});
		const getTemplate = (template) => {
			const [charRef, actionId] = template.slice(2, -1).split("|");
			if (!charRef || !actionId) return;
			res.char = res.char || d20plus.ut.getCharacter(charRef);
			res.path = actionId?.split("_");
			getIndex();
			d20plus.ut.log("Evaluating template", charRef, actionId);
			if (["link", "output"].includes(res.path.last())) {
				return;
			}
			if (res.path[0] !== "repeating") {
				const abil = d20plus.ut.getCharAbilityByName(res.char, actionId)?.attributes.action;
				if (abil && abil.includes("template:")) res.tmpl = abil;
				else if (abil) getTemplate(abil);
			} else if (res.path[1].includes("spell-")) {
				const spellname = res.path.slice(0, 3).join("_");
				res.action = d20plus.ut.getCharMetaAttribByName(res.char, spellname);
				const spell = res.action?.rollcontent;
				if (spell && spell.includes("template:")) res.tmpl = getRoll(spell);
				else if (spell) getTemplate(spell);
			} else if (res.path[1] === "attack" || res.path[1] === "npcaction") {
				const actionId = res.path.slice(0, 3).join("_");
				res.action = d20plus.ut.getCharMetaAttribByName(res.char, actionId);
				if (res.action?.rollbase && res.action.rollbase.includes("template:")) {
					res.tmpl = getRoll(res.action.rollbase);
				}
			}
		}
		getTemplate(template);
		res.tmpl = res.tmpl
			?.replace(/@{([^|^}^{]*?)}/g, `@{${res.char.attributes.name}|$1}`);
		return res.tmpl || res.noDice;
	}

	/*
	const char = d20plus.ut.getCharacter(charRef);
	if (!char) return noDice;
	const addName = tmpl => tmpl.replace(/@{([^|^}^{]*?)}/g, `@{${char.attributes.name}|$1}`);
	const abil = d20plus.ut.getCharAbilityByName(char, actionId)?.attributes.action;
	if (abil && abil.includes("template:")) return addName(abil);
	else if (abil) actionId = abil.split("|")[1]?.split("_").slice(0, -1).join("_");
	const path = actionId.split("_");
	d20plus.ut.log("Evaluating template", abil, path)
	if (path[0] !== "repeating") return noDice;
	if (path[2][0] === "$") {
		const index = path[2].slice(1);
		const repquery = ["_reporder"].concat(path.slice(0, 2)).join("_");
		const reporder = d20plus.ut.getCharAttribByName(char, repquery)?.attributes.current;
		if (reporder) {
			path[2] = reporder.split(",")[index];
		} else {
			const reporder = char.attribs?.models?.filter(prop => {
				const path = prop?.attributes?.name.split("_");
				return path[1] === "npcaction" && path.last() === "name"
			}).map(prop => prop.attributes.name.split("_")[2]);
			path[2] = reporder[index] || path[2];
		}
	}
	if (path[1] === "npcaction") {
		actionId = path.slice(0, 3).join("_");
	} else if (path.last() === "spell") {
		const spellname = path.slice(0, -1).concat(["rollcontent"]).join("_");
		const spell = d20plus.ut.getCharAttribByName(char, spellname)?.attributes.current;
		d20plus.ut.log("Query spell", spellname, spell)
		if (spell && spell.includes("template:")) return addName(spell);
		else if (spell) actionId = spell.split("|")[1]?.split("_").slice(0, -1).join("_");
	} else if (path.last() === "attack") {
		actionId = path.slice(0, -1).join("_");
	} else return noDice;
	d20plus.ut.log("Search action", actionId)
	const attr = d20plus.ut.getCharMetaAttribByName(char, actionId);
	if (!attr?.rollbase) return noDice;
	const getRoll1 = (tmpl) => `${tmpl}`.replace(/@\{(?<attr>\w*)\}/g, (...group) => {
		const prop = group.last().attr;
		const subAttr = attr[prop];
		const preserveRef = ["_mod", "d20", "npc_name_flag"].some(ref => prop.includes(ref));
		const preloadRef = prop === "show_desc"
			? attr.description || ""
			: d20plus.ut.getCharAttribByName(char, prop)?.attributes.current;
		d20plus.ut.log("--CHECKING", prop, subAttr, preserveRef, preloadRef)
		return (subAttr !== undefined ? getRoll(subAttr) : preloadRef) || (preserveRef ? `@{${prop}}` : "");
	});
	// return getRoll(attr.rollbase); */

	d20plus.ut._BYTE_UNITS = ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
	d20plus.ut.getReadableFileSizeString = (fileSizeInBytes) => {
		let i = -1;
		do {
			fileSizeInBytes = fileSizeInBytes / 1024;
			i++;
		} while (fileSizeInBytes > 1024);
		return Math.max(fileSizeInBytes, 0.1).toFixed(1) + d20plus.ut._BYTE_UNITS[i];
	};

	d20plus.ut.sanitizeFilename = function (str) {
		return str.trim().replace(/[^-\w]/g, "_");
	};// RB20 EXCLUDE START

	d20plus.ut.transliterate = (word) => {
		const a = {"Ё": "YO", "Й": "I", "Ц": "TS", "У": "U", "К": "K", "Е": "E", "Н": "N", "Г": "G", "Ш": "SH", "Щ": "SCH", "З": "Z", "Х": "H", "Ъ": "'", "ё": "yo", "й": "i", "ц": "ts", "у": "u", "к": "k", "е": "e", "н": "n", "г": "g", "ш": "sh", "щ": "sch", "з": "z", "х": "h", "ъ": "'", "Ф": "F", "Ы": "I", "В": "V", "А": "А", "П": "P", "Р": "R", "О": "O", "Л": "L", "Д": "D", "Ж": "ZH", "Э": "E", "ф": "f", "ы": "i", "в": "v", "а": "a", "п": "p", "р": "r", "о": "o", "л": "l", "д": "d", "ж": "zh", "э": "e", "Я": "Ya", "Ч": "CH", "С": "S", "М": "M", "И": "I", "Т": "T", "Ь": "'", "Б": "B", "Ю": "YU", "я": "ya", "ч": "ch", "с": "s", "м": "m", "и": "i", "т": "t", "ь": "'", "б": "b", "ю": "yu"};
		if (!word.split) return "";
		return word.split("").map(function (char) {
			return a[char] || char;
		}).join("");
	}// RB20 EXCLUDE END

	d20plus.ut.dialogClose = (evt) => {
		$(evt.target).off();
		$(evt.target).dialog("destroy").remove();
	}

	d20plus.ut.saveAsJson = function (filename, data) {
		const blob = new Blob([JSON.stringify(data, null, "\t")], {type: "application/json"});
		d20plus.ut.saveAs(blob, `${filename}.json`);
	};

	// based on:
	/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/src/FileSaver.js */
	d20plus.ut.saveAs = (function () {
		const view = window;
		let
			doc = view.document;
			// only get URL when necessary in case Blob.js hasn't overridden it yet
		let get_URL = function () {
			return view.URL || view.webkitURL || view;
		};
		let save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a");
		let can_use_save_link = "download" in save_link;
		let click = function (node) {
			let event = new MouseEvent("click");
			node.dispatchEvent(event);
		};
		let is_safari = /constructor/i.test(view.HTMLElement) || view.safari;
		let is_chrome_ios = /CriOS\/[\d]+/.test(navigator.userAgent);
		let setImmediate = view.setImmediate || view.setTimeout;
		let throw_outside = function (ex) {
			setImmediate(function () {
				throw ex;
			}, 0);
		};
		let force_saveable_type = "application/octet-stream";
		// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
		let arbitrary_revoke_timeout = 1000 * 40; // in ms
		let revoke = function (file) {
			let revoker = function () {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			setTimeout(revoker, arbitrary_revoke_timeout);
		};
		let dispatch = function (filesaver, event_types, event) {
			event_types = [].concat(event_types);
			let i = event_types.length;
			while (i--) {
				let listener = filesaver[`on${event_types[i]}`];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		};
		let auto_bom = function (blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			// note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob([String.fromCharCode(0xFEFF), blob], {type: blob.type});
			}
			return blob;
		};
		let FileSaver = function (blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			// First try a.download, then web filesystem, then object URLs
			let
				filesaver = this;
			let type = blob.type;
			let force = type === force_saveable_type;
			let object_url;
			let dispatch_all = function () {
				dispatch(filesaver, "writestart progress write writeend".split(" "));
			};
			// on any filesys errors revert to saving with object URLs
			let fs_error = function () {
				if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
					// Safari doesn't allow downloading of blob urls
					let reader = new FileReader();
					reader.onloadend = function () {
						let url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, "data:attachment/file;");
						let popup = view.open(url, "_blank");
						if (!popup) view.location.href = url;
						url = undefined; // release reference before dispatching
						filesaver.readyState = filesaver.DONE;
						dispatch_all();
					};
					reader.readAsDataURL(blob);
					filesaver.readyState = filesaver.INIT;
					return;
				}
				// don't create more object URLs than needed
				if (!object_url) {
					object_url = get_URL().createObjectURL(blob);
				}
				if (force) {
					view.location.href = object_url;
				} else {
					let opened = view.open(object_url, "_blank");
					if (!opened) {
						// Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
						view.location.href = object_url;
					}
				}
				filesaver.readyState = filesaver.DONE;
				dispatch_all();
				revoke(object_url);
			};
			filesaver.readyState = filesaver.INIT;

			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				setImmediate(function () {
					save_link.href = object_url;
					save_link.download = name;
					click(save_link);
					dispatch_all();
					revoke(object_url);
					filesaver.readyState = filesaver.DONE;
				}, 0);
				return;
			}

			fs_error();
		};
		let FS_proto = FileSaver.prototype;
		let saveAs = function (blob, name, no_auto_bom) {
			return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
		};
		// IE 10+ (native saveAs)
		if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
			return function (blob, name, no_auto_bom) {
				name = name || blob.name || "download";

				if (!no_auto_bom) {
					blob = auto_bom(blob);
				}
				return navigator.msSaveOrOpenBlob(blob, name);
			};
		}
		FS_proto.abort = function () {};
		FS_proto.readyState = FS_proto.INIT = 0;
		FS_proto.WRITING = 1;
		FS_proto.DONE = 2;
		FS_proto.error =
			FS_proto.onwritestart =
				FS_proto.onprogress =
					FS_proto.onwrite =
						FS_proto.onabort =
							FS_proto.onerror =
								FS_proto.onwriteend =
									null;

		return saveAs;
	}());

	d20plus.ut.promiseDelay = function (delay) {
		return new Promise(resolve => {
			setTimeout(() => resolve(), delay);
		})
	};

	d20plus.ut.LAYERS = ["map", "floors", "background", "objects", "roofs", "foreground", "gmlayer", "walls", "weather"];
	d20plus.ut.layerToName = (l) => {
		switch (l) {
			case "map": return "Map";
			case "floors": return "Floors";
			case "background": return "Background";
			case "objects": return "Objects & Tokens";
			case "roofs": return "Roofs";
			case "foreground": return "Foreground";
			case "gmlayer": return "GM Info Overlay";
			case "walls": return "Dynamic Lighting";
			case "weather": return "Weather Exclusions";
		}
	};

	d20plus.ut.get$SelValue = ($sel) => {
		return $sel[0].options[$sel[0].selectedIndex].value;
	};

	d20plus.ut.isUseSharedJs = () => {
		return BASE_SITE_URL.includes("://5e.tools")
			|| BASE_SITE_URL.includes("://5etools.com")
			|| /:\/\/5etools-mirror-\d+\./.test(BASE_SITE_URL);
	};

	d20plus.ut.fixSidebarLayout = () => {
		$(`#textchat-input`).insertAfter(`#textchat`);
		const cached = d20.textchat.showPopout;
		d20.textchat.showPopout = function () {
			cached();
			const cached2 = d20.textchat.childWindow.onbeforeunload;
			d20.textchat.childWindow.onbeforeunload = function () {
				cached2();
				$(`#textchat-input`).insertAfter(`#textchat`);
			}
		}
	};

	d20plus.ut.dynamicStyles = (slug) => {
		if (!d20plus.css.dynamic) d20plus.css.dynamic = {};
		if (!d20plus.css.dynamic[slug]) {
			d20plus.css.dynamic[slug] = $("<style></style>").appendTo(document.body);
		}
		return d20plus.css.dynamic[slug];
	}

	/**
	* Assumes any other lists have been searched using the same term
	*/
	d20plus.ut.getSearchTermAndReset = (list, ...otherLists) => {
		let lastSearch = null;
		if (list.searched) {
			lastSearch = $(`#search`).val();
			list.search();
			otherLists.forEach(l => l.search());
		}
		list.filter();
		otherLists.forEach(l => l.filter());
		return lastSearch;
	};
}

SCRIPT_EXTENSIONS.push(baseUtil);

/*

map
afow
grid
background
objects
foreground
gmlayer
walls
weather

 */
