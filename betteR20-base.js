var betteR20Base = function () {
	addConfigOptions("token", {
			"_name": "Tokens",
			"enhanceStatus": {
				"name": "Use Custom Status Icons",
				"default": true,
				"_type": "boolean"
			},
			"statusSheetUrl": {
				"name": `Custom Status Spritesheet Url (<a style="color: blue" href="https://app.roll20.net/images/statussheet.png" target="_blank">Original</a>)`,
				"default": "https://raw.githubusercontent.com/TheGiddyLimit/5etoolsR20/master/img/statussheet.png",
				"_type": "String"
			},
			"statusSheetSmallUrl": {
				"name": `Custom Status Spritesheet (Small) Url (<a style="color: blue" href="https://app.roll20.net/images/statussheet_small.png" target="_blank">Original</a>)`,
				"default": "https://raw.githubusercontent.com/TheGiddyLimit/5etoolsR20/master/img/statussheet_small.png",
				"_type": "String"
			}
		}
	);
	addConfigOptions("canvas", {
			"_name": "Canvas",
			"_player": true,
			"halfGridSnap": {
				"name": "Snap to Half-Grid",
				"default": false,
				"_type": "boolean",
				"_player": true
			},
			"scaleNamesStatuses": {
				"name": "Scaled Names and Status Icons",
				"default": true,
				"_type": "boolean",
				"_player": true
			}
		}
	);

	const d20plus = {
		// EXTERNAL SCRIPTS ////////////////////////////////////////////////////////////////////////////////////////////
		scriptsLoaded: false,
		scripts: [
			{name: "listjs", url: "https://raw.githubusercontent.com/javve/list.js/v1.5.0/dist/list.min.js"},
			{name: "VecMath", url: "https://raw.githubusercontent.com/Roll20/roll20-api-scripts/master/Vector%20Math/1.0/VecMath.js"},
			{name: "MatrixMath", url: "https://raw.githubusercontent.com/Roll20/roll20-api-scripts/master/MatrixMath/1.0/matrixMath.js"},
			{name: "PathMath", url: "https://raw.githubusercontent.com/Roll20/roll20-api-scripts/master/PathMath/1.5/PathMath.js"}
		],

		addScripts: (onLoadFunction) => {
			d20plus.log("Add JS");
			const onEachLoadFunction = function (name, url, js) {
				try {
					window.eval(js);
					d20plus.log(`JS [${name}] Loaded`);
				} catch (e) {
					d20plus.log(`Error loading ${name}`);
					d20plus.log(e);
				}
			};
			d20plus.chainLoad(d20plus.scripts, 0, onEachLoadFunction, onLoadFunction);
		},

		chainLoad: (toLoads, index, onEachLoadFunction, onFinalLoadFunction) => {
			const toLoad = toLoads[index];
			// on loading the last item, run onLoadFunction
			let retries = 3;
			function withRetries () {
				$.ajax({
					type: "GET",
					url: toLoad.url + d20plus.getAntiCacheSuffix() + retries,
					success: function (data) {
						if (index === toLoads.length - 1) {
							onEachLoadFunction(toLoad.name, toLoad.url, data);
							onFinalLoadFunction();
						} else {
							onEachLoadFunction(toLoad.name, toLoad.url, data);
							d20plus.chainLoad(toLoads, index + 1, onEachLoadFunction, onFinalLoadFunction);
						}
					},
					error: function (resp, qq, pp) {
						if (resp && resp.status === 500 && retries-- > 0) {
							console.error(resp, qq, pp);
							d20plus.log(`Error loading ${toLoad.name}; retrying`);
							setTimeout(() => {
								withRetries();
							}, 500);
						} else {
							console.error(resp, qq, pp);
							d20plus.log(`Error loading ${toLoad.name}`);
						}
					}
				});
			}
			withRetries();
		},

		// MOCK API  ///////////////////////////////////////////////////////////////////////////////////////////////////
		initMockApi: () => { // TODO check if this needs to be enabled for players too
			if (!ACCOUNT_ORIGINAL_PERMS.xlfeats) {
				window.log = (...args) => d20plus.logApi(...args);

				const chatHandlers = [];
				window.on = (evtType, fn, ...others) => {
					switch (evtType) {
						case "chat:message":
							chatHandlers.push(fn);
							break;
						default:
							console.error("Unhandled message type: ", evtType, "with args", fn, others)
							break;
					}
				};

				window.createObj = (objType, obj, ...others) => {
					switch (objType) {
						case "path": {
							const page = d20.Campaign.pages._byId[obj._pageid];
							obj.scaleX = obj.scaleX || 1;
							obj.scaleY = obj.scaleY || 1;
							obj.path = obj.path || obj._path
							return page.thepaths.create(obj)
							break;
						}
						default:
							console.error("Unhandled object type: ", objType, "with args", obj, others)
							break;
					}
				};

				const seenMessages = new Set();
				d20.textchat.chatref = d20.textchat.shoutref.parent().child("chat");
				const handleChat = (e) => {
					if (!d20.textchat.chatstartingup) {
						e.id = e.key();
						if (!seenMessages.has(e.id)) {
							seenMessages.add(e.id);

							var t = e.val();
							if (t) {
								if (window.DEBUG) console.log("CHAT: ", t);

								chatHandlers.forEach(fn => fn(t));
							}
						}
					}
				};
				d20.textchat.chatref.on("child_added", handleChat);
				d20.textchat.chatref.on("child_changed", handleChat);
			}
		},

		// UTILITIES ///////////////////////////////////////////////////////////////////////////////////////////////////
		log: (...args) => {
			console.log("%cD20Plus > ", "color: #3076b9; font-size: large", ...args);
		},

		logApi: (...args) => {
			console.log("%cD20Plus > ", "color: #ff00ff; font-size: large", ...args);
		},

		ascSort: (a, b) => {
			if (b === a) return 0;
			return b < a ? 1 : -1;
		},

		checkVersion () {
			function cmpVersions (a, b) {
				const regExStrip0 = /(\.0+)+$/;
				const segmentsA = a.replace(regExStrip0, '').split('.');
				const segmentsB = b.replace(regExStrip0, '').split('.');
				const l = Math.min(segmentsA.length, segmentsB.length);

				for (let i = 0; i < l; i++) {
					const diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
					if (diff) {
						return diff;
					}
				}
				return segmentsA.length - segmentsB.length;
			}

			d20plus.log("Checking current version");
			$.ajax({
				url: `https://get.5e.tools`,
				success: (data) => {
					const m = /<!--\s*(\d+\.\d+\.\d+)\s*-->/.exec(data);
					if (m) {
						const curr = d20plus.version;
						const avail = m[1];
						const cmp = cmpVersions(curr, avail);
						if (cmp < 0) {
							setTimeout(() => {
								d20.textchat.incoming(false, ({
									who: "system",
									type: "system",
									content: `<span style="margin-left: -45px; margin-right: -5px; margin-bottom: -7px; display: inline-block; font-weight: bold; font-family: 'Lucida Console', Monaco, monospace; color: #20C20E; background: black; padding: 3px;">
										A newer version of the script is available. Get ${avail} <a style="color: white;" href="https://get.5e.tools/">here</a>.
									</span>`
								}));
							}, 1000);
						}
					}
				},
				error: () => {
					d20plus.log("Failed to check version");
				}
			})
		},

		chatTag: (message) => {
			d20plus.sendHackerChat(`
				${message}
				<br>
				<br>
				Need help? Join our <a style="color: white;" href="https://discord.gg/AzyBjtQ">Discord</a>.
				<br>
				<br>
				<span title="You'd think this would be obvious.">Please DO NOT post about this script or any related content in official channels, such as the Roll20 forums.</span>
			`);
		},

		sendHackerChat: (message) => {
			d20.textchat.incoming(false, ({
				who: "system",
				type: "system",
				content: `<span style="margin-left: -45px; margin-right: -5px; margin-bottom: -7px; display: inline-block; font-weight: bold; font-family: 'Lucida Console', Monaco, monospace; color: #20C20E; background: black; padding: 3px;">
					${message}
				</span>`
			}));
		},

		addCSS: (sheet, selector, rules) => {
			const index = sheet.cssRules.length;
			if ("insertRule" in sheet) {
				sheet.insertRule(selector + "{" + rules + "}", index);
			} else if ("addRule" in sheet) {
				sheet.addRule(selector, rules, index);
			}
		},

		addAllCss: () => {
			d20plus.log("Add CSS");
			const targetSheet = window.document.styleSheets[window.document.styleSheets.length - 1];
			_.each(d20plus.baseCssRules, function (r) {
				d20plus.addCSS(targetSheet, r.s, r.r);
			});
			if (!window.is_gm) {
				_.each(d20plus.baseCssRulesPlayer, function (r) {
					d20plus.addCSS(targetSheet, r.s, r.r);
				});
			}
			_.each(d20plus.cssRules, function (r) {
				d20plus.addCSS(targetSheet, r.s, r.r);
			});
		},

		getAntiCacheSuffix: () => {
			return "?" + (new Date()).getTime();
		},

		generateRowId: () => {
			return window.generateUUID().replace(/_/g, "Z");
		},

		randomRoll: (roll, success, error) => {
			d20.textchat.diceengine.process(roll, success, error);
		},

		randomInt: (int) => {
			// Return random integer between [0,int)
			return d20.textchat.diceengine.random(int);
		},

		getJournalFolderObj: () => {
			d20.journal.refreshJournalList();
			let journalFolder = d20.Campaign.get("journalfolder");
			if (journalFolder === "") {
				d20.journal.addFolderToFolderStructure("Characters");
				d20.journal.refreshJournalList();
				journalFolder = d20.Campaign.get("journalfolder");
			}
			return JSON.parse(journalFolder);
		},

		getCleanText: (str) => {
			const check = jQuery.parseHTML(str);
			if (check.length === 1 && check[0].constructor === Text) {
				return str;
			}
			const $ele = $(str);
			$ele.find("p, li, br").append("\n\n");
			return $ele.text().replace(/[ ]+/g, " ");
		},

		_lastInput: null,
		getNumberRange (promptText, min, max) {
			function alertInvalid () {
				alert("Please enter a valid range.");
			}

			function isOutOfRange (num) {
				return num < min || num > max;
			}

			function alertOutOfRange () {
				alert(`Please enter numbers in the range ${min}-${max} (inclusive).`);
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
				const res =  prompt(promptText, d20plus._lastInput || "E.g. 1-5, 8, 11-13");
				if (res && res.trim()) {
					d20plus._lastInput = res;
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
							d20plus._lastInput = null;
							return out;
						}
					} else {
						alertInvalid();
					}
				} else {
					d20plus._lastInput = null;
					return null;
				}
			}
		},

		math: {
			/**
			 * Normalize a 2d vector.
			 * @param out Result storage
			 * @param a Vector to normalise
			 */
			normalize (out, a) {
				const x = a[0],
					y = a[1];
				let len = x*x + y*y;
				if (len > 0) {
					len = 1 / Math.sqrt(len);
					out[0] = a[0] * len;
					out[1] = a[1] * len;
				}
				return out;
			},

			/**
			 * Scale a 2d vector.
			 * @param out Resulst storage
			 * @param a Vector to scale
			 * @param b Value to scale by
			 */
			scale (out, a, b) {
				out[0] = a[0] * b;
				out[1] = a[1] * b;
				return out;
			}
		},

		// CONFIG //////////////////////////////////////////////////////////////////////////////////////////////////////
		config: {},

		loadConfigFailed: false,

		loadConfig: (nextFn) => {
			d20plus.log("Reading Config");
			let configHandout = d20plus.getConfigHandout();

			if (!configHandout) {
				d20plus.log("No config found! Initialising new config...");
				d20plus.makeDefaultConfig(doLoad);
			} else {
				doLoad();
			}

			function doLoad () {
				configHandout = d20plus.getConfigHandout();
				if (configHandout) {
					configHandout.view.render();
					configHandout._getLatestBlob("gmnotes", function (gmnotes) {
						try {
							const decoded = decodeURIComponent(gmnotes);

							d20plus.config = JSON.parse(decoded);

							d20plus.log("Config Loaded:");
							d20plus.log(d20plus.config);
							nextFn();
						} catch (e) {
							if (!d20plus.loadConfigFailed) {
								// prevent infinite loops
								d20plus.loadConfigFailed = true;

								d20plus.log("Corrupted config! Rebuilding...");
								d20plus.makeDefaultConfig(() => {
									d20plus.loadConfig(nextFn)
								});
							} else {
								// if the config fails, continue to load anyway
								nextFn();
							}
						}
					});
				} else {
					d20plus.log("Failed to create config handout!");
					nextFn();
				}
			}
		},

		loadPlayerConfig: (nextFn) => {
			d20plus.log("Reading player Config");
			const loaded = StorageUtil.get(`Veconfig`);
			if (!loaded) {
				d20plus.log("No player config found! Initialising new config...");
				const dfltConfig = d20plus.getDefaultConfig();
				d20plus.config = Object.assign(d20plus.config, dfltConfig);
				StorageUtil.set(`Veconfig`, d20plus.config);
			}
			d20plus.log("Player config Loaded:");
			d20plus.log(d20plus.config);
			nextFn();
		},

		makeDefaultConfig: (nextFn) => {
			d20.Campaign.handouts.create({
				name: CONFIG_HANDOUT
			}, {
				success: function (handout) {
					notecontents = "The GM notes contain config options saved between sessions. If you want to wipe your saved settings, delete this handout and reload roll20. If you want to edit your settings, click the \"Edit Config\" button in the <b>Settings</b> (cog) panel.";

					// default settings
					// token settings mimic official content; other settings as vanilla as possible
					const gmnotes = JSON.stringify(d20plus.getDefaultConfig());

					handout.updateBlobs({notes: notecontents, gmnotes: gmnotes});
					handout.save({notes: (new Date).getTime(), inplayerjournals: ""});

					if (nextFn) nextFn();
				}
			});
		},

		getConfigHandout: () => {
			d20plus.getJournalFolderObj(); // ensure journal init

			return d20.Campaign.handouts.models.find(function (handout) {
				return handout.attributes.name === CONFIG_HANDOUT;
			});
		},

		getCfgKey: (group, val) => {
			if (val === undefined || d20plus.config[group] === undefined) return undefined;
			const gr = d20plus.config[group];
			for (const key of Object.keys(d20plus.config[group])) {
				if (gr[key] !== undefined && gr[key] === val) {
					return key;
				}
			}
			return undefined;
		},

		getRawCfgVal: (group, key) => {
			if (d20plus.config[group] === undefined) return undefined;
			if (d20plus.config[group][key] === undefined) return undefined;
			return d20plus.config[group][key];
		},

		getCfgVal: (group, key) => {
			if (d20plus.config[group] === undefined) return undefined;
			if (d20plus.config[group][key] === undefined) return undefined;
			if (CONFIG_OPTIONS[group][key]._type === "_SHEET_ATTRIBUTE") {
				if (!NPC_SHEET_ATTRIBUTES[d20plus.config[group][key]]) return undefined;
				return NPC_SHEET_ATTRIBUTES[d20plus.config[group][key]][d20plus.sheet];
			}
			if (CONFIG_OPTIONS[group][key]._type === "_SHEET_ATTRIBUTE_PC") {
				if (!PC_SHEET_ATTRIBUTES[d20plus.config[group][key]]) return undefined;
				return PC_SHEET_ATTRIBUTES[d20plus.config[group][key]][d20plus.sheet];
			}
			return d20plus.config[group][key];
		},

		getCfgDefaultVal: (group, key) => {
			if (CONFIG_OPTIONS[group] === undefined) return undefined;
			if (CONFIG_OPTIONS[group][key] === undefined) return undefined;
			return CONFIG_OPTIONS[group][key].default
		},

		getCfgEnumVals: (group, key) => {
			if (CONFIG_OPTIONS[group] === undefined) return undefined;
			if (CONFIG_OPTIONS[group][key] === undefined) return undefined;
			return CONFIG_OPTIONS[group][key]._values
		},

		getDefaultConfig: () => {
			const outCpy = {};
			$.each(CONFIG_OPTIONS, (sectK, sect) => {
				if (window.is_gm || sect._player) {
					outCpy[sectK] = outCpy[sectK] || {};
					$.each(sect, (k, data) => {
						if (!k.startsWith("_") && (window.is_gm || data._player)) {
							outCpy[sectK][k] = data.default;
						}
					});
				}
			});
			return outCpy;
		},

		// Helpful for checking if a boolean option is set even if false
		hasCfgVal: (group, key) => {
			if (d20plus.config[group] === undefined) return undefined;
			return d20plus.config[group][key] !== undefined;
		},

		setCfgVal: (group, key, val) => {
			if (d20plus.config[group] === undefined) d20plus.config[group] = {};
			d20plus.config[group][key] = val;
		},

		makeTabPane: ($addTo, headers, content) => {
			if (headers.length !== content.length) throw new Error("Tab header and content length were not equal!");

			if ($addTo.attr("hastabs") !== "YES") {
				const $tabBar = $(`<ul class="nav nav-tabs"/>`);

				const tabList = [];
				const paneList = [];
				const $tabPanes = $(`<div class="tabcontent"/>`);

				$.each(content, (i, e) => {
					const toAdd = $(`<div class="plustab${i} tab-pane" ${i === 0 ? "" : `style="display: none"`}/>`);
					toAdd.append(e);
					paneList[i] = toAdd;
					$tabPanes.append(toAdd);
				});

				$.each(headers, (i, e) => {
					const toAdd = $(`<li ${i === 0 ? `class="active"` : ""}><a data-tab="plustab${i}" href="#">${e}</a></li>`).on("click", () => {
						paneList.forEach((p, i2) => {
							if (i2 === i) {
								tabList[i2].addClass("active");
								paneList[i2].show();
							} else {
								tabList[i2].removeClass("active");
								paneList[i2].hide();
							}
						});
					});
					tabList[i] = (toAdd);
					$tabBar.append(toAdd);
				});

				$addTo
					.append($tabBar)
					.append($tabPanes);

				$addTo.attr("hastabs", "YES");
			}
		},

		openConfigEditor: () => {
			const cEdit = $("#d20plus-configeditor");
			cEdit.dialog("open");

			if (cEdit.attr("hastabs") !== "YES") {
				cEdit.attr("hastabs", "YES");
				const appendTo = $(`<div/>`);
				cEdit.prepend(appendTo);

				const configFields = {};

				let sortedKeys = Object.keys(CONFIG_OPTIONS).sort((a, b) => d20plus.ascSort(CONFIG_OPTIONS[a]._name, CONFIG_OPTIONS[b]._name));
				if (!window.is_gm) sortedKeys = sortedKeys.filter(k => CONFIG_OPTIONS[k]._player);

				const tabList = sortedKeys.map(k => CONFIG_OPTIONS[k]._name);
				const contentList = sortedKeys.map(k => makeTab(k));

				function makeTab (cfgK) {
					const cfgGroup = CONFIG_OPTIONS[cfgK];
					configFields[cfgK] = {};

					const content = $(`
						<div class="config-table-wrapper">
							<table class="config-table">
								<thead><tr><th>Property</th><th>Value</th></tr></thead>
								<tbody></tbody>
							</table>
						</div>
					`);
					const tbody = content.find(`tbody`);

					let sortedTabKeys = Object.keys(cfgGroup).filter(k => !k.startsWith("_"));
					if (!window.is_gm) sortedTabKeys = sortedTabKeys.filter(k => cfgGroup[k]._player);

					sortedTabKeys.forEach((grpK, idx) => {
						const prop = cfgGroup[grpK];

						// IDs only used for label linking
						const toAdd = $(`<tr><td><label for="conf_field_${idx}" class="config-name">${prop.name}</label></td></tr>`);

						// Each config `_type` should have a case here. Each case should add a function to the map [configFields:[cfgK:grpK]]. These functions should return the value of the input.
						switch (prop._type) {
							case "boolean": {
								const field = $(`<input type="checkbox" id="conf_field_${idx}" ${d20plus.getCfgVal(cfgK, grpK) ? `checked` : ""}>`);

								configFields[cfgK][grpK] = () => {
									return field.prop("checked")
								};

								const td = $(`<td/>`).append(field);
								toAdd.append(td);
								break;
							}
							case "String": {
								const curr = d20plus.getCfgVal(cfgK, grpK) || "";
								const def = d20plus.getCfgDefaultVal(cfgK, grpK) || "";
								const field = $(`<input id="conf_field_${idx}" value="${curr}" ${def ? `placeholder="Default: ${def}"` : ""}>`);

								configFields[cfgK][grpK] = () => {
									return field.val() ? field.val().trim() : "";
								};

								const td = $(`<td/>`).append(field);
								toAdd.append(td);
								break;
							}
							case "_SHEET_ATTRIBUTE_PC":
							case "_SHEET_ATTRIBUTE": {
								const DICT = prop._type === "_SHEET_ATTRIBUTE" ? NPC_SHEET_ATTRIBUTES : PC_SHEET_ATTRIBUTES;
								const sortedNpcsAttKeys = Object.keys(DICT).sort((at1, at2) => d20plus.ascSort(DICT[at1].name, DICT[at2].name));
								const field = $(`<select id="conf_field_${idx}" class="cfg_grp_${cfgK}" data-item="${grpK}">${sortedNpcsAttKeys.map(npcK => `<option value="${npcK}">${DICT[npcK].name}</option>`)}</select>`);
								const cur = d20plus.getCfgVal(cfgK, grpK);
								if (cur !== undefined) {
									field.val(cur);
								}

								configFields[cfgK][grpK] = () => {
									return field.val()
								};

								const td = $(`<td/>`).append(field);
								toAdd.append(td);
								break;
							}
							case "integer": {
								const def = d20plus.getCfgDefaultVal(cfgK, grpK);
								const field = $(`<input id="conf_field_${idx}" type="number" value="${d20plus.getCfgVal(cfgK, grpK)}" ${def != null ? `placeholder="Default: ${def}"` : ""}>`);

								configFields[cfgK][grpK] = () => {
									return Number(field.val());
								};

								const td = $(`<td/>`).append(field);
								toAdd.append(td);
								break;
							}
							case "_FORMULA": {
								const $field = $(`<select id="conf_field_${idx}" class="cfg_grp_${cfgK}" data-item="${grpK}">${d20plus.formulas._options.sort().map(opt => `<option value="${opt}">${opt}</option>`)}</select>`);

								const cur = d20plus.getCfgVal(cfgK, grpK);
								if (cur !== undefined) {
									$field.val(cur);
								}

								configFields[cfgK][grpK] = () => {
									return $field.val();
								};

								const td = $(`<td/>`).append($field);
								toAdd.append(td);
								break;
							}
							case "_WHISPERMODE": {
								const $field = $(`<select id="conf_field_${idx}" class="cfg_grp_${cfgK}" data-item="${grpK}">${d20plus.whisperModes.map(mode => `<option value="${mode}">${mode}</option>`)}</select>`);

								const cur = d20plus.getCfgVal(cfgK, grpK);
								if (cur !== undefined) {
									$field.val(cur);
								}

								configFields[cfgK][grpK] = () => {
									return $field.val();
								};

								const td = $(`<td/>`).append($field);
								toAdd.append(td);
								break;
							}
							case "_ADVANTAGEMODE": {
								const $field = $(`<select id="conf_field_${idx}" class="cfg_grp_${cfgK}" data-item="${grpK}">${d20plus.advantageModes.map(mode => `<option value="${mode}">${mode}</option>`)}</select>`);

								const cur = d20plus.getCfgVal(cfgK, grpK);
								if (cur !== undefined) {
									$field.val(cur);
								}

								configFields[cfgK][grpK] = () => {
									return $field.val();
								};

								const td = $(`<td/>`).append($field);
								toAdd.append(td);
								break;
							}
							case "_DAMAGEMODE": {
								const $field = $(`<select id="conf_field_${idx}" class="cfg_grp_${cfgK}" data-item="${grpK}">${d20plus.damageModes.map(mode => `<option value="${mode}">${mode}</option>`)}</select>`);

								const cur = d20plus.getCfgVal(cfgK, grpK);
								if (cur !== undefined) {
									$field.val(cur);
								}

								configFields[cfgK][grpK] = () => {
									return $field.val();
								};

								const td = $(`<td/>`).append($field);
								toAdd.append(td);
								break;
							}
							case "_enum": { // for generic String enums not covered above
								const $field = $(`<select id="conf_field_${idx}" class="cfg_grp_${cfgK}" data-item="${grpK}">${d20plus.getCfgEnumVals(cfgK, grpK).map(it => `<option value="${it}">${it}</option>`)}</select>`);

								const cur = d20plus.getCfgVal(cfgK, grpK);
								if (cur !== undefined) {
									$field.val(cur);
								} else {
									const def = d20plus.getCfgDefaultVal(cfgK, grpK);
									if (def !== undefined) {
										$field.val(def);
									}
								}

								configFields[cfgK][grpK] = () => {
									return $field.val();
								};

								const td = $(`<td/>`).append($field);
								toAdd.append(td);
								break;
							}
						}
						tbody.append(toAdd);
					});

					return content;
				}

				d20plus.makeTabPane(
					appendTo,
					tabList,
					contentList
				);

				const saveButton = $(`#configsave`);
				saveButton.unbind("click");
				saveButton.bind("click", () => {
					function _updateLoadedConfig () {
						$.each(configFields, (cfgK, grp) => {
							$.each(grp, (grpK, grpVField) => {
								d20plus.setCfgVal(cfgK, grpK, grpVField());
							})
						});
					}

					if (window.is_gm) {
						let handout = d20plus.getConfigHandout();
						if (!handout) {
							d20plus.makeDefaultConfig(doSave);
						} else {
							doSave();
						}

						function doSave () {
							_updateLoadedConfig();

							const gmnotes = JSON.stringify(d20plus.config).replace(/%/g, "%25");
							handout.updateBlobs({gmnotes: gmnotes});
							handout.save({notes: (new Date).getTime()});

							d20plus.log("Saved config");

							d20plus.baseHandleConfigChange();
							if (d20plus.handleConfigChange) d20plus.handleConfigChange();
						}
					} else {
						_updateLoadedConfig();
						StorageUtil.set(`Veconfig`, d20plus.config);
						d20plus.baseHandleConfigChange();
						if (d20plus.handleConfigChange) d20plus.handleConfigChange();
					}
				});
			}
		},

		_handleStatusTokenConfigChange: () => {
			if (window.is_gm) {
				if (d20plus.getCfgVal("token", "enhanceStatus")) {
					const sheetUrl = d20plus.getCfgVal("token", "statusSheetUrl") || d20plus.getCfgDefaultVal("token", "statusSheetUrl");
					const sheetSmallUrl = d20plus.getCfgVal("token", "statusSheetSmallUrl") || d20plus.getCfgDefaultVal("token", "statusSheetSmallUrl");

					window.Campaign && window.Campaign.save({
						"bR20cfg_statussheet": sheetUrl,
						"bR20cfg_statussheet_small": sheetSmallUrl
					});

					d20.token_editor.statussheet.src = sheetUrl;
					d20.token_editor.statussheet_small.src =  sheetSmallUrl;
					d20plus._removeStatusEffectEntries(); // clean up any old data
					d20plus._addStatusEffectEntries();
				} else {
					window.Campaign && window.Campaign.save({
						"bR20cfg_statussheet": "",
						"bR20cfg_statussheet_small": ""
					});

					d20.token_editor.statussheet.src = "/images/statussheet.png";
					d20.token_editor.statussheet_small.src = "/images/statussheet_small.png";
					d20plus._removeStatusEffectEntries();
				}
			} else {
				if (window.Campaign && window.Campaign.attributes && window.Campaign.attributes.bR20cfg_statussheet && window.Campaign.attributes.bR20cfg_statussheet_small) {
					d20.token_editor.statussheet.src = window.Campaign.attributes.bR20cfg_statussheet;
					d20.token_editor.statussheet_small.src =  window.Campaign.attributes.bR20cfg_statussheet_small;
					d20plus._addStatusEffectEntries();
				} else {
					d20.token_editor.statussheet.src = "/images/statussheet.png";
					d20.token_editor.statussheet_small.src = "/images/statussheet_small.png";
					d20plus._removeStatusEffectEntries();
				}
			}
		},

		baseHandleConfigChange: () => {
			d20plus._handleStatusTokenConfigChange();
		},

		startPlayerConfigHandler: () => {
			function handlePlayerCfg () {
				d20plus.baseHandleConfigChange();
				if (d20plus.handleConfigChange) d20plus.handleConfigChange(true);
			}

			// every 5 seconds, poll and apply any config changes the GM might have made
			if (!window.is_gm) {
				setInterval(() => {
					handlePlayerCfg();
				}, 5000);
			}
			handlePlayerCfg();
		},

		// SETTINGS TOOLS //////////////////////////////////////////////////////////////////////////////////////////////
		tools: [
			{
				name: "Journal Cleaner",
				desc: "Quickly select and delete journal items from the root folder, useful for cleaning up loose items after deleting a folder.",
				html: `
				<div id="d20plus-quickdelete" title="Journal Root Cleaner">
				<p>A list of characters and handouts in the journal folder root, which allows them to be quickly deleted.</p>
				<p style="display: flex; justify-content: space-between"><label><input type="checkbox" title="Select all" id="deletelist-selectall"> Select All</label> <a class="btn" href="#" id="quickdelete-btn-submit">Delete Selected</a></p>
				<div id="delete-list-container">
					<input class="search" autocomplete="off" placeholder="Search list..." style="width: 100%;">
					<br><br>
					<ul class="list deletelist" style="max-height: 600px; overflow-y: scroll; display: block; margin: 0;"></ul>
				</div>
				</div>;
				`,
				dialogFn: () => {
					$("#d20plus-quickdelete").dialog({
						autoOpen: false,
						resizable: true,
						width: 800,
						height: 650,
					});
				},
				openFn: () => {
					const $win = $("#d20plus-quickdelete");
					$win.dialog("open");

					const journal = d20plus.getJournalFolderObj();
					const rootItems = [];
					journal.forEach(it => {
						if (it.i) return; // skip folders
						const handout = d20.Campaign.handouts.get(it);
						if (handout && (handout.get("name") === CONFIG_HANDOUT || handout.get("name") === ART_HANDOUT)) return; // skip 5etools handouts
						const character = d20.Campaign.characters.get(it);
						if (handout) rootItems.push({type: "handouts", id: it, name: handout.get("name")});
						if (character) rootItems.push({type: "characters", id: it, name: character.get("name")});
					});

					const $delList = $win.find(`.list`);
					$delList.empty();

					rootItems.forEach((it, i) => {
						$delList.append(`
							<label class="import-cb-label">
								<input type="checkbox" data-listid="${i}">
								<span class="name">${it.name}</span>
							</label>
						`);
					});

					// init list library
					const delList = new List("delete-list-container", {
						valueNames: ["name"],
						listClass: "deletelist"
					});

					const $cbAll = $("#deletelist-selectall");
					$cbAll.unbind("click");
					$cbAll.prop("checked", false);
					$cbAll.bind("click", function () {
						d20plus.importer._importToggleSelectAll(delList, $cbAll);
					});

					const $btnDel = $(`#quickdelete-btn-submit`);
					$btnDel.off("click");
					$btnDel.on("click", () => {
						if (confirm("Delete selected?")) {
							delList.items.forEach(it => Array.prototype.forEach.call(it.elm.children, (e) => {
								const $e = $(e);
								if ($e.is("input") && $e.prop("checked")) {
									const dataIndex = parseInt($e.data("listid"));
									const toDel = rootItems[dataIndex];
									d20.Campaign[toDel.type].get(toDel.id).destroy();
								}
							}));
							$win.dialog("close");
							$("#journalfolderroot").trigger("change");
						}
					});
				}
			},
			{
				name: "SVG Draw",
				desc: "Paste SVG data as text to automatically draw the paths.",
				html: `
				<div id="d20plus-svgdraw" title="SVG Drawing Tool">
				<p>Paste SVG data as text to automatically draw any included &lt;path&gt;s. Draws to the current layer, in the top-left corner, with no scaling. Takes colour information from &quot;stroke&quot; attributes.</p>
				<p>Line width (px; default values are 1, 3, 5, 8, 14): <input name="stroke-width" placeholder="5" value="5" type="number"></p>
				<textarea rows="10" cols="100" placeholder="Paste SVG data here"></textarea>
				<br>
				<button class="btn">Draw</button>
				</div>
				`,
				dialogFn: () => {
					$("#d20plus-svgdraw").dialog({
						autoOpen: false,
						resizable: true,
						width: 800,
						height: 650,
					});
				},
				openFn: () => {
					// adapted from `d20.engine.finishCurrentPolygon`
					function addShape(path, pathStroke, strokeWidth) {
						let i = d20.engine.convertAbsolutePathStringtoFabric(path);
						i = _.extend(i, {
							strokeWidth: strokeWidth,
							fill: "transparent",
							stroke: pathStroke,
							path: JSON.parse(i.path)
						});
						d20.Campaign.activePage().addPath(i);
						d20.engine.debounced_renderTop();
					}

					const $win = $("#d20plus-svgdraw");
					$win.dialog("open");

					$win.find(`button`).off("click").on("click", () => {
						d20plus.log("Drawing paths");
						const input = $win.find(`textarea`).val();
						const svg = $.parseXML(input);

						const toDraw = $(svg).find("path").map((i, e) => {
							const $e = $(e);
							return {stroke: $e.attr("stroke") || "black", d: $e.attr("d")}
						}).get();

						const strokeWidth = Math.max(1, Number($win.find(`input[name="stroke-width"]`).val()));

						toDraw.forEach(it => {
							addShape(it.d, it.stroke, strokeWidth)
						});
					});
				}
			},
			{
				name: "Multi-Whisper",
				desc: "Send whispers to multiple players ",
				html: `
				<div id="d20plus-whispers" title="Multi-Whisper Tool">
				<div>
					<button class="btn toggle-dc">Show Disconnected Players</button>
					<button class="btn send-all">Send All Messages</button>
				</div>
				<hr>
				<div class="messages" style="max-height: 600px; overflow-y: auto; overflow-x: hidden; transform: translateZ(0)">
					<!-- populate with JS -->
				</div>
				</div>
				`,
				dialogFn: () => {
					$("#d20plus-whispers").dialog({
						autoOpen: false,
						resizable: true,
						width: 1000,
						height: 760,
					});
				},
				openFn: () => {
					$("a.ui-tabs-anchor[href='#textchat']").trigger("click");

					const $win = $("#d20plus-whispers");
					$win.dialog("open");

					const $btnToggleDc = $win.find(`.toggle-dc`).off("click").text("Show Disconnected Players");
					const $btnSendAll = $win.find(`.send-all`).off("click");

					const $pnlMessages = $win.find(`.messages`).empty();
					const players = d20.Campaign.players.toJSON();
					players.forEach((p, i) => {
						const $btnSend = $(`<button class="btn send">Send</button>`).on("click", function () {
							const $btn = $(this);
							const $wrp = $btn.closest(`.wrp-message`);
							const toMsg = $wrp.find(`input[data-player-id]:checked`).filter(":visible").map((ii, e) => $(e).attr("data-player-id")).get();
							const content = $wrp.find(`.message`).val().trim();
							toMsg.forEach(targetId => {
								d20.textchat.doChatInput(`/w ${d20.Campaign.players.get(targetId).get("displayname").split(" ")[0]} ${content}`);

								// This only posts to local player's chat, sadly
								// d20.textchat.incoming(
								// 	false,
								// 	{
								// 		avatar: `/users/avatar/${window.currentPlayer.get("d20userid")}/30`,
								// 		who: d20.textchat.$speakingas.find("option:first-child").text(),
								// 		type: "whisper",
								// 		content: content,
								// 		playerid: window.currentPlayer.id,
								// 		id: d20plus.generateRowId(),
								// 		target: targetId,
								// 		target_name: d20.Campaign.players.get(targetId).get("displayname") || ""
								// 	}
								// );
							})
						});

						$pnlMessages.append($(`
							<div ${p.online || `style="display: none;"`} data-online="${p.online}" class="wrp-message">
								<div>
									${players.map((pp, ii) => `<label style="margin-right: 10px; ${pp.online || ` display: none;`}" data-online="${pp.online}" class="display-inline-block">${pp.displayname} <input data-player-id="${pp.id}" type="checkbox" ${i === ii ? `checked="true"` : ""}></label>`).join("")}
								</div>
								<textarea style="display: block; width: 95%;" placeholder="Enter whisper" class="message"></textarea>
							</div>						
						`).append($btnSend).append(`<hr>`));
					});

					$btnToggleDc.on("click", () => {
						$btnToggleDc.text($btnToggleDc.text().startsWith("Show") ? "Hide Disconnected Players" : "Show Disconnected Players");
						$pnlMessages.find(`[data-online="false"]`).toggle();
					});

					$btnSendAll.on("click", () => {
						$pnlMessages.find(`button.send`).click();
					});
				}
			},
			{
				name: "Table Importer",
				desc: "Import TableExport data",
				html: `
				<div id="d20plus-tables" title="Table Importer">
					<div>
					<button class="btn paste-clipboard">Paste from Clipboard</button> <i>Accepts <a href="https://app.roll20.net/forum/post/1144568/script-tableexport-a-script-for-exporting-and-importing-rollable-tables-between-accounts">TableExport</a> format.</i>
					</div>
					<br>
					<div id="table-list">
						<input type="search" class="search" placeholder="Search tables...">
						<div class="list" style="transform: translateZ(0); max-height: 490px; overflow-y: scroll; overflow-x: hidden;"><i>Loading...</i></div>
					</div>
				<br>
				<button class="btn start-import">Import</button>
				</div>
				
				<div id="d20plus-tables-clipboard" title="Paste from Clipboard"/>
				`,
				dialogFn: () => {
					$("#d20plus-tables").dialog({
						autoOpen: false,
						resizable: true,
						width: 800,
						height: 690,
					});
					$(`#d20plus-tables-clipboard`).dialog({
						autoOpen: false,
						resizable: true,
						width: 640,
						height: 480,
					});
				},
				openFn: () => {
					const $win = $("#d20plus-tables");
					$win.dialog("open");

					const $btnImport = $win.find(`.start-import`).off("click");
					const $btnClipboard = $win.find(`.paste-clipboard`).off("click");

					const url = `${BASE_SITE_URL}/data/roll20-tables.json`;
					DataUtil.loadJSON(url).then((data) => {
						function createTable (t) {
							const r20t = d20.Campaign.rollabletables.create({
								name: t.name.replace(/\s+/g, "-"),
								showplayers: t.isShown,
								id: d20plus.generateRowId()
							});

							r20t.tableitems.reset(t.items.map(i => {
								const out = {
									id: d20plus.generateRowId(),
									name: i.row
								};
								if (i.weight !== undefined) out.weight = i.weight;
								if (i.avatar) out.avatar = i.avatar;
								return out;
							}));
							r20t.tableitems.forEach(it => it.save());
						}

						// Allow pasting of custom tables
						$btnClipboard.on("click", () => {
							const $wrpClip = $(`#d20plus-tables-clipboard`);
							const $iptClip = $(`<textarea placeholder="Paste TableExport data here" style="display: block; width: 600px; height: 340px;"/>`).appendTo($wrpClip);
							const $btnCheck = $(`<button class="btn" style="margin-right: 5px;">Check if Valid</button>`).on("click", () => {
								let error = false;
								try {
									getFromPaste($iptClip.val());
								} catch (e) {
									console.error(e);
									window.alert(e.message);
									error = true;
								}
								if (!error) window.alert("Looking good!");
							}).appendTo($wrpClip);
							const $btnImport = $(`<button class="btn">Import</button>`).on("click", () => {
								const ts = getFromPaste($iptClip.val());
								ts.forEach(t => createTable(t));
							}).appendTo($wrpClip);

							$wrpClip.dialog("open");
						});

						function getFromPaste (paste) {
							const tables = [];
							let tbl = null;

							paste.split("\n").forEach(line => parseLine(line.trim()));
							return tables;

							function parseLine (line) {
								if (line.startsWith("!import-table-item")) {
									if (!tbl) {
										throw new Error("No !import-table statement found");
									}
									const [junk, tblName, row, weight] = line.split("--").map(it => it.trim());
									tbl.items.push({
										row,
										weight
									})
								} else if (line.startsWith("!import-table")) {
									if (tbl) {
										throw new Error("No blank line found between tables")
									}
									const [junk, tblName,showHide] = line.split("--").map(it => it.trim());
									tbl = {
										name: tblName,
										isShown: showHide.toLowerCase() === "show"
									};
									tbl.items = [];
								} else if (line.trim()) {
									throw new Error("Non-empty line which didn't match !import-table or !import-table-item")
								} else {
									if (tbl) {
										tables.push(tbl);
										tbl = null;
									}
								}
							}
						}

						// Official tables
						const $lst = $win.find(`.list`);
						const tables = data.table.sort((a, b) => SortUtil.ascSort(a.name, b.name));
						let tmp = "";
						tables.forEach((t, i) => {
							tmp += `
								<label class="import-cb-label" data-listid="${i}">
									<input type="checkbox">
									<span class="name col-10">${t.name}</span>
									<span title="${t.source ? Parser.sourceJsonToFull(t.source) : "Unknown Source"}" class="source">SRC[${t.source ? Parser.sourceJsonToAbv(t.source) : "UNK"}]</span>
								</label>
							`;
						});
						$lst.html(tmp);
						tmp = null;

						const tableList = new List("table-list", {
							valueNames: ["name", "source"]
						});

						$btnImport.on("click", () => {
							$("a.ui-tabs-anchor[href='#deckstables']").trigger("click");
							const sel = tableList.items
								.filter(it => $(it.elm).find(`input`).prop("checked"))
								.map(it => tables[$(it.elm).attr("data-listid")]);

							sel.forEach(t => createTable(t));
						});
					});
				}
			},
			{
				name: "Token Avatar URL Fixer",
				desc: "Change the root URL for tokens en-masse.",
				html: `
				<div id="d20plus-avatar-fixer" title="Avatar Fixer">
				<p><b>Warning:</b> this thing doesn't really work.</p>
				<p>Current URLs (view only): <select class="view-only"></select></p>
				<p><label>Replace:<br><input name="search" value="https://5etools.com/"></label></p>
				<p><label>With:<br><input name="replace" value="https://thegiddylimit.github.io/"></label></p>
				<p><button class="btn">Go!</button></p>
				</div>
				`,
				dialogFn: () => {
					$("#d20plus-avatar-fixer").dialog({
						autoOpen: false,
						resizable: true,
						width: 400,
						height: 400,
					});
				},
				openFn: () => {
					function replaceAll (str, search, replacement) {
						return str.split(search).join(replacement);
					}

					const $win = $("#d20plus-avatar-fixer");
					$win.dialog("open");

					const $selView = $win.find(`.view-only`);
					const toView = [];
					d20.Campaign.characters.toJSON().forEach(c => {
						if (c.avatar && c.avatar.trim()) {
							toView.push(c.avatar);
						}
					});
					toView.sort(SortUtil.ascSort).forEach(url => $selView.append(`<option disabled>${url}</option>`));

					const $btnGo = $win.find(`button`).off("click");
					$btnGo.on("click", () => {
						let count = 0;
						$("a.ui-tabs-anchor[href='#journal']").trigger("click");

						const search = $win.find(`[name="search"]`).val();
						const replace = $win.find(`[name="replace"]`).val();

						d20.Campaign.characters.toJSON().forEach(c => {
							const id = c.id;

							const realC = d20.Campaign.characters.get(id);

							const curr = realC.get("avatar");
							let toSave = false;
							if (curr.includes(search)) {
								count++;
								realC.set("avatar", replaceAll(curr, search, replace));
								toSave = true;
							}
							if (realC.get("defaulttoken")) {
								realC._getLatestBlob("defaulttoken", (bl) => {
									if (bl && bl.imgsrc && bl.imgsrc.includes(search)) {
										count++;
										realC.updateBlobs({imgsrc: replaceAll(bl.imgsrc, search, replace)});
										toSave = true;
									}
								});
							}
							if (toSave) {
								realC.save();
							}
						});
						window.alert(`Replaced ${count} item${count === 0 || count > 1 ? "s" : ""}.`)
					});
				}
			}
		],

		addTools: () => {
			const $body = $(`body`);
			const $tools = $(`#d20-tools-list`);
			const $toolsList = $tools.find(`.tools-list`);
			d20plus.tools.forEach(t => {
				$body.append(t.html); // add HTML
				t.dialogFn(); // init window
				// add tool row
				const $wrp = $(`<div class="tool-row"/>`);
				$wrp.append(`<p style="width: 20%;">${t.name}</p>`);
				$wrp.append(`<p style="width: 60%;">${t.desc}</p>`);
				$(`<a style="width: 15%;" class="btn" href="#">Open</a>`).on(mousedowntype, () => {
					t.openFn();
					$tools.dialog("close");
				}).appendTo($wrp);
				$toolsList.append($wrp);
			});

			$tools.dialog({
				autoOpen: false,
				resizable: true,
				width: 800,
				height: 650,
			});
			$(`#button-view-tools`).on(mousedowntype, () => {
				$tools.dialog("open");
			});
		},

		// ART /////////////////////////////////////////////////////////////////////////////////////////////////////////////
		art: {
			button: () => {
				// add external art button was clicked
				const $art = $("#d20plus-artfolder");
				$art.dialog("open");
				const $artList = $art.find(`.list`);
				$artList.empty();

				if (d20plus.art.custom) {
					d20plus.art.custom.forEach(a => {
						const $liArt = getArtLi(a.name, a.url);
						$artList.append($liArt);
					});
				}

				// init list library
				const artList = new List("art-list-container", {
					valueNames: ["name"],
					listClass: "artlist"
				});

				const $btnAdd = $(`#art-list-add-btn`);
				const $iptAddName = $(`#art-list-add-name`);
				const $iptAddUrl = $(`#art-list-add-url`);
				$btnAdd.off("click");
				$btnAdd.on("click", () => {
					const name = $iptAddName.val().trim();
					const url = $iptAddUrl.val().trim();
					if (!name || !url) {
						alert("Missing required fields!")
					} else {
						artList.search();
						artList.filter();
						const $liArt = getArtLi(name, url);
						$artList.append($liArt);
						refreshCustomArtList();
					}
				});

				const $btnMassAdd = $(`#art-list-multi-add-btn`);
				$btnMassAdd.off("click");
				$btnMassAdd.on("click", () => {
					$("#d20plus-artmassadd").dialog("open");
					const $btnMassAddSubmit = $(`#art-list-multi-add-btn-submit`);
					$btnMassAddSubmit.off("click");
					$btnMassAddSubmit.on("click", () => {
						artList.search();
						artList.filter();
						const $iptUrls = $(`#art-list-multi-add-area`);
						const massUrls = $iptUrls.val();
						const spl = massUrls.split("\n").map(s => s.trim()).filter(s => s);
						if (!spl.length) return;
						else {
							const delim = "---";
							const toAdd = [];
							for (const s of spl) {
								if (!s.includes(delim)) {
									alert(`Badly formatted line: ${s}`)
									return;
								} else {
									const parts = s.split(delim);
									if (parts.length !== 2) {
										alert(`Badly formatted line: ${s}`)
										return;
									} else {
										toAdd.push({
											name: parts[0],
											url: parts[1]
										});
									}
								}
							}
							toAdd.forEach(a => {
								$artList.append(getArtLi(a.name, a.url));
							});
							refreshCustomArtList();
							$("#d20plus-artmassadd").dialog("close");
						}
					});
				});

				makeDraggables();
				d20plus.art.refreshList = refreshCustomArtList;

				function getArtLi (name, url) {
					const showImage = d20plus.getCfgVal("interface", "showCustomArtPreview");
					const $liArt = $(`
						<li class="dd-item library-item draggableresult Vetools-draggable-art ui-draggable" data-fullsizeurl="${url}">
							${showImage ? `<img src="${url}" style="width: 30px; max-height: 30px; display: inline-block" draggable="false">` : ""}
							<div class="dd-content name" style="display: inline-block; width: 35%;" data-url="${url}">${name}</div>
							<a href="${url}"><span class="url" style="display: inline-block; width: ${showImage ? "40%" : "55%"};">${url}</span></a>
						</li>
					`);
					if (!showImage) {
						$liArt.on("mousedown", () => {
							const $loader = $(`<div class="temp-warning">Loading image - don't drop yet!</div>`);
							const $img = $(`<img src="${url}" style="width: 30px; max-height: 30px; display: none">`);
							if (!$img.prop("complete")) {
								$(`body`).append($loader);
								$img.on("load", () => {
									$loader.remove();
								});
								$loader.append($img);
							}
						});
					}

					const $btnDel = $(`<span class="delete btn btn-danger"><span class="pictos">#</span></span>`).on("click", () => {
						$liArt.remove();
						refreshCustomArtList();
					});
					$liArt.append($btnDel);
					return $liArt;
				}

				function refreshCustomArtList () {
					artList.reIndex();
					const custom = [];
					artList.items.forEach(i => {
						const $ele = $(i.elm);
						custom.push({
							name: $ele.find(`.name`).text(),
							url: $ele.find(`.url`).text()
						});
					});
					d20plus.art.custom = custom;
					makeDraggables();
					saveToHandout();
				}

				function makeDraggables () {
					$(`.Vetools-draggable-art`).draggable({
						handle: ".dd-content",
						revert: true,
						revertDuration: 0,
						helper: "clone",
						appendTo: "body"
					})
				}

				function saveToHandout () {
					const handout = d20plus.getArtHandout();
					if (!handout) {
						d20.Campaign.handouts.create({
							name: ART_HANDOUT
						}, {
							success: function (handout) {
								notecontents = "This handout is used to store custom art URLs."

								const gmnotes = JSON.stringify(d20plus.art.custom);
								handout.updateBlobs({notes: notecontents, gmnotes: gmnotes});
								handout.save({notes: (new Date).getTime(), inplayerjournals: ""});
							}
						});
					} else {
						const gmnotes = JSON.stringify(d20plus.art.custom);
						handout.updateBlobs({gmnotes: gmnotes});
						handout.save({notes: (new Date).getTime()});
					}
				}
			},

			// TODO load a decent default art library from somewhere
			default: [
				{
					name: "Phoenix",
					url: "http://www.discgolfbirmingham.com/wordpress/wp-content/uploads/2014/04/phoenix-rising.jpg"
				}
			]
		},

		getArtHandout: () => {
			return d20.Campaign.handouts.models.find((handout) => {
				return handout.attributes.name === ART_HANDOUT;
			});
		},

		loadArt: (nextFn) => {
			d20plus.log("Loading custom art");
			const handout = d20plus.getArtHandout();
			if (handout) {
				handout.view.render();
				handout._getLatestBlob("gmnotes", function (gmnotes) {
					const decoded = decodeURIComponent(gmnotes);
					try {
						d20plus.art.custom = JSON.parse(decoded);
						nextFn();
					} catch (e) {
						nextFn();
					}
				});
			} else {
				nextFn();
			}
		},

		addCustomArtSearch: () => {
			d20plus.log("Add custom art search");
			const $afterTo = $(`#libraryresults`);
			$afterTo.after(d20plus.artListHTML);

			const $olNone = $(`#image-search-none`);
			const $olHasResults = $(`#image-search-has-results`);

			const $olArt = $(`#custom-art-results`);
			const $srchImages = $(`#imagedialog .searchbox input.keywords`);
			$srchImages.on("keyup", () => {
				$olArt.empty();
				const searched = $srchImages.val().trim().toLowerCase();
				if (searched.length === 0) {
					$olNone.show();
					$olHasResults.hide();
					return;
				}

				let toShow = d20plus.art.default.filter(a => a.name.toLowerCase().includes(searched));
				if (d20plus.art.custom) toShow = toShow.concat(d20plus.art.custom.filter(a => a.name.toLowerCase().includes(searched)));

				if (!toShow.length) {
					$olNone.show();
					$olHasResults.hide();
				} else {
					$olNone.hide();
					$olHasResults.show();

					toShow.forEach(a => {
						$olArt.append(`
				<li class="dd-item library-item draggableresult Vetoolsresult ui-draggable" data-fullsizeurl="${a.url}">
					<div class="dd-content">
						<div class="token"><img src="${a.url}" draggable="false"></div>
						<div class="name">
							<div class="namecontainer"><a href="${a.url}" rel="external">${a.name}</a></div>
						</div>
					</div>
				</li>
			`);
					});
				}

				$("#imagedialog #Vetoolsresults .draggableresult").draggable({
					handle: ".dd-content",
					revert: true,
					revertDuration: 0,
					helper: "clone",
					appendTo: "body"
				}).addTouch();
			});
		},

		initArtFromUrlButtons: () => {
			d20plus.log("Add direct URL art buttons");
			$("#tmpl_charactereditor").replaceWith(d20plus.template_charactereditor);
			$("#tmpl_handouteditor").replaceWith(d20plus.template_handouteditor);

			$(`.character-image-by-url`).live("click", function () {
				const cId = $(this).closest(`[data-characterid]`).attr(`data-characterid`);
				const url = window.prompt("Enter a URL", "https://example.com/pic.png");
				if (url) {
					d20.Campaign.characters.get(cId).set("avatar", url);
				}
			});

			$(`.handout-image-by-url`).live("click", function () {
				const hId = $(this).closest(`[data-handoutid]`).attr(`data-handoutid`);
				const url = window.prompt("Enter a URL", "https://example.com/pic.png");
				if (url) {
					d20.Campaign.handouts.get(hId).set("avatar", url);
				}
			});
		},

		// UI ENHANCEMENTS /////////////////////////////////////////////////////////////////////////////////////////////////

		addProFeatures: () => {
			d20plus.log("Add Pro features");

			// modified to allow players to use the FX tool, and to keep current colour selections when switching tool
			// BEGIN ROLL20 CODE
			function setMode (e) {
				d20plus.log("Setting mode " + e);
				// BEGIN MOD
				// "text" === e || "rect" === e || "polygon" === e || "path" === e || "pan" === e || "select" === e || "targeting" === e || "measure" === e || window.is_gm || (e = "select"),
				// END MOD
				"text" == e ? $("#editor").addClass("texteditmode") : $("#editor").removeClass("texteditmode"),
					$("#floatingtoolbar li").removeClass("activebutton"),
					$("#" + e).addClass("activebutton"),
				"fog" == e.substring(0, 3) && $("#fogcontrols").addClass("activebutton"),
				"rect" == e && ($("#drawingtools").addClass("activebutton"),
					$("#drawingtools").removeClass("text path polygon line_splitter").addClass("rect")),
				"text" == e && ($("#drawingtools").addClass("activebutton"),
					$("#drawingtools").removeClass("rect path polygon line_splitter").addClass("text")),
				"path" == e && $("#drawingtools").addClass("activebutton").removeClass("text rect polygon line_splitter").addClass("path"),
					"polygon" == e ? $("#drawingtools").addClass("activebutton").removeClass("text rect path line_splitter").addClass("polygon") : d20.engine.finishCurrentPolygon(),
					// BEGIN MOD (also line_splitter added to above removeClass calls
				"line_splitter" == e && ($("#drawingtools").addClass("activebutton"),
					$("#drawingtools").removeClass("rect path polygon text").addClass("line_splitter")),
					// END MOD
				"pan" !== e && "select" !== e && d20.engine.unselect(),
					"pan" == e ? ($("#select").addClass("pan").removeClass("select").addClass("activebutton"),
						d20.token_editor.removeRadialMenu(),
						$("#editor-wrapper").addClass("panning")) : $("#editor-wrapper").removeClass("panning"),
				"select" == e && $("#select").addClass("select").removeClass("pan").addClass("activebutton"),
					$("#floatingtoolbar .mode").hide(),
				("text" == e || "select" == e) && $("#floatingtoolbar ." + e).show(),
					"gridalign" == e ? $("#gridaligninstructions").show() : "gridalign" === d20.engine.mode && $("#gridaligninstructions").hide(),
					"targeting" === e ? ($("#targetinginstructions").show(),
						$("#upperCanvas").addClass("targeting"),
						d20.engine.canvas.hoverCursor = "crosshair") : "targeting" === d20.engine.mode && ($("#targetinginstructions").hide(),
						$("#upperCanvas").removeClass("targeting"),
					d20.engine.nextTargetCallback && _.defer(function () {
						d20.engine.nextTargetCallback && d20.engine.nextTargetCallback(!1)
					}),
						d20.engine.canvas.hoverCursor = "move"),
					console.log("Switch mode to " + e),
					// BEGIN MOD
					d20.engine.mode = e;
				d20.engine.canvas.isDrawingMode = "path" == e ? !0 : !1;
				if ("text" == e || "path" == e || "rect" == e || "polygon" == e || "fxtools" == e
					// BEGIN MOD
					|| "measure" == e) {
					// END MOD
					$("#secondary-toolbar").show();
					$("#secondary-toolbar .mode").hide();
					$("#secondary-toolbar ." + e).show();
					("path" == e || "rect" == e || "polygon" == e) && ("" === $("#path_strokecolor").val() && ($("#path_strokecolor").val("#000000").trigger("change-silent"),
						$("#path_fillcolor").val("transparent").trigger("change-silent")),
						d20.engine.canvas.freeDrawingBrush.color = $("#path_strokecolor").val(),
						d20.engine.canvas.freeDrawingBrush.fill = $("#path_fillcolor").val() || "transparent",
						$("#path_width").trigger("change")),
					"fxtools" == e && "" === $("#fxtools_color").val() && $("#fxtools_color").val("#a61c00").trigger("change-silent"),
						$("#floatingtoolbar").trigger("blur")
				} else {
					$("#secondary-toolbar").hide();
					$("#floatingtoolbar").trigger("blur");
				}
				// END MOD
				// END ROLL20 CODE
			}

			d20plus.setMode = setMode;

			// rebind buttons with new setMode
			const $drawTools = $("#drawingtools");
			const $rect = $drawTools.find(".chooserect");
			const $path = $drawTools.find(".choosepath");
			const $poly = $drawTools.find(".choosepolygon");
			$drawTools.unbind(clicktype).bind(clicktype, () => {
				$(this).hasClass("rect") ? setMode("rect") : $(this).hasClass("text") ? setMode("text") : $(this).hasClass("path") ? setMode("path") : $(this).hasClass("drawselect") ? setMode("drawselect") : $(this).hasClass("polygon") && setMode("polygon")
			});
			$rect.unbind(clicktype).bind(clicktype, () => {
				setMode("rect");
				return false;
			});
			$path.unbind(clicktype).bind(clicktype, () => {
				setMode("path");
				return false;
			});
			$poly.unbind(clicktype).bind(clicktype, () => {
				setMode("polygon");
				return false;
			});
			$("#rect").unbind(clicktype).bind(clicktype, () => setMode("rect"));
			$("#path").unbind(clicktype).bind(clicktype, () => setMode("path"));

			if (!$(`#fxtools`).length) {
				const $fxMode = $(`<li id="fxtools"/>`).append(`<span class="pictos">e</span>`);
				$fxMode.on("click", () => {
					d20plus.setMode("fxtools");
				});
				$(`#drawingtools`).after($fxMode);
			}

			if (window.is_gm) {
				// add lighting layer tool
				if (!$(`#editinglayer .choosewalls`).length) {
					$(`#editinglayer .choosegmlayer`).after(`<li class="choosewalls"><span class="pictostwo">r</span> Dynamic Lighting</li>`);
				}

				// ensure tokens have editable sight
				$("#tmpl_tokeneditor").replaceWith(d20plus.template_TokenEditor);
				// show dynamic lighting/etc page settings
				$("#tmpl_pagesettings").replaceWith(d20plus.template_pageSettings);
				$("#page-toolbar").on("mousedown", ".settings", function () {
					var e = d20.Campaign.pages.get($(this).parents(".availablepage").attr("data-pageid"));
					e.view._template = $.jqotec("#tmpl_pagesettings");
				});
			}
		},

		_stickyMeasure: {},
		enhanceMeasureTool: () => {
			d20plus.log("Enhance Measure tool");

			// add extra toolbar
			const $wrpBar = $(`#secondary-toolbar`);
			const toAdd = `
				<ul class="mode measure" style="display: none;">
					<li>
						<select id="measure_mode" style="width: 100px;">
							<option value="1" selected>Ruler</option>
							<option value="2">Radius</option>
							<option value="3">Cone</option>
							<option value="4">Box</option>
							<option value="5">Line</option>
						</select>
					</li>
					<li>
						<label style="display: inline-flex">Sticky <input style="margin-left: 4px;" type="checkbox" id="measure_sticky"></label>
					</li>
					<li>
						<button id="measure_sticky_clear">Clear</button>
					</li>
					<li class="measure_mode_sub measure_mode_sub_2" style="display: none;">
						<select id="measure_mode_sel_2" style="width: 100px;">
							<option value="1" selected>Burst</option>
							<option value="2">Blast</option>
						</select>
					</li>
					<li class="measure_mode_sub measure_mode_sub_3" style="display: none;">
						<input type="number" min="0" id="measure_mode_ipt_3" style="width: 30px;" value="1">
						<label style="display: inline-flex;" title="The PHB cone rules are the textbook definition of one radian.">rad.</label>
					</li>
					<li class="measure_mode_sub measure_mode_sub_4" style="display: none;">
						<select id="measure_mode_sel_4" style="width: 100px;">
							<option value="1" selected>Burst</option>
							<option value="2">Blast</option>
						</select>
					</li>
					<li class="measure_mode_sub measure_mode_sub_5" style="display: none;">
						<select id="measure_mode_sel_5" style="width: 120px;">
							<option value="1" selected>Total Width: </option>
							<option value="2">Width To Edge: </option>
						</select>
						<input type="number" step="5" min="5" id="measure_mode_ipt_5" style="width: 30px;" value="5">
						<label style="display: inline-flex;">ft.</label>
					</li>
				</ul>`;
			$wrpBar.append(toAdd);

			$(`#measure`).click(() => {
				d20plus.setMode("measure");
			});
			const $cbSticky = $(`#measure_sticky`);
			let tempShift = false;
			$(document).on("mousemove", (evt) => {
				if (evt.shiftKey && !tempShift && d20.engine.mode === "measure" && !$cbSticky.prop("checked")) {
					tempShift = true;
					$cbSticky.prop("checked", true);
				} else if (!evt.shiftKey && tempShift && d20.engine.mode === "measure" && $cbSticky.prop("checked")) {
					tempShift = false;
					$cbSticky.prop("checked", false);
				}
			});
			const $selMeasure = $(`#measure_mode`);
			$selMeasure.on("change", () => {
				$(`.measure_mode_sub`).hide();
				$(`.measure_mode_sub_${$selMeasure.val()}`).show();
			});
			$(`#measure_sticky_clear`).click(() => {
				delete d20plus._stickyMeasure[window.currentPlayer.id];
				d20.engine.renderTop();
				const event = {
					type: "Ve_measure_clear_sticky",
					player: window.currentPlayer.id,
					time: (new Date).getTime()
				};
				d20.textchat.sendShout(event)
			});

			d20.textchat.shoutref.on("value", function(e) {
				if (!d20.textchat.chatstartingup) {
					var t = e.val();
					if (t) {
						const msg = JSON.parse(t);
						if (window.DEBUG) console.log("SHOUT: ", msg);

						if (Object.keys(d20plus._stickyMeasure).length) {
							d20.Campaign.players.toJSON().filter(p => !p.online).forEach(p => delete d20plus._stickyMeasure[p.id]);
						}

						switch (msg.type) {
							case "Ve_measure_clear_sticky": {
								delete d20plus._stickyMeasure[msg.player];
								d20.engine.renderTop();
							}
						}
					}
				}
			});

			// ROLL20 CODE
			var T = function (e, t, n, i, r, o) {
				// BEGIN MOD
				if (!t.reRender) {
					if (t.Ve.sticky) {
						d20plus._stickyMeasure[t.player] = {
							...t,
							offset: [...d20.engine.currentCanvasOffset]
						}
					} else {
						delete d20plus._stickyMeasure[t.player];
					}
				}
				// END MOD
				var a = d20.engine.getDistanceInScale({
					x: t.x,
					y: t.y
				}, {
					x: t.to_x,
					y: t.to_y
				}, o)
					, s = a[0];
				void 0 !== r && (s = Math.round(10 * (s + r)) / 10);
				var l = s + "" + d20.Campaign.activePage().get("scale_units");
				if (e.strokeStyle = t.color,
						n) {
					// BEGIN MOD
					var fontSize = (1 / d20.engine.canvasZoom) * 12;
					e.font = fontSize + "pt Arial Black";
					var c = e.measureText(l);
					e.fillStyle = "rgba(255,255,255,0.75)";
					e.beginPath();
					e.rect(t.to_x - 35, t.to_y - (23 + fontSize), c.width + 10, (10 + fontSize));
					e.closePath();
					e.fill();
					// END MOD
				}

				// BEGIN MOD
				if (t.Ve) {
					const RAD_90_DEG = 1.5708;

					const euclid = (x1, y1, x2, y2) => {
						const a = x1 - x2;
						const b = y1 - y2;
						return Math.sqrt(a * a + b * b)
					};

					const rotPoint = (angle, pX, pY) => {
						const s = Math.sin(angle);
						const c = Math.cos(angle);

						pX -= t.x;
						pY -= t.y;

						const xNew = pX * c - pY * s;
						const yNew = pX * s + pY * c;

						pX = xNew + t.x;
						pY = yNew + t.y;
						return [pX, pY];
					};

					switch (t.Ve.mode) {
						case "1": // standard ruler
							break;
						case "2": { // radius
							const drawCircle = (cx, cy, rad) => {
								e.beginPath();
								e.arc(cx, cy, rad, 0, 2*Math.PI);
								e.stroke();
								e.closePath();
							};

							switch (t.Ve.radius.mode) {
								case "1": // origin
									drawCircle(t.x, t.y, euclid(t.x, t.y, t.to_x, t.to_y));
									break;
								case "2": { // halfway
									const dx = t.to_x - t.x;
									const dy = t.to_y - t.y;
									const cX = t.x + (dx / 2);
									const cY = t.y + (dy / 2);

									drawCircle(cX, cY, euclid(cX, cY, t.to_x, t.to_y));
									break;
								}
							}

							break;
						}
						case "3": { // cone
							const arcRadians = (Number(t.Ve.cone.arc) || 1) / 2;

							const r = euclid(t.x, t.y, t.to_x, t.to_y);
							const dx = t.to_x - t.x;
							const dy = t.to_y - t.y;
							const startR = Math.atan2(dy, dx);

							// arc 1
							e.beginPath();
							e.arc(t.x, t.y, r, startR, startR + arcRadians);
							e.stroke();
							e.closePath();
							// arc 2
							e.beginPath();
							e.arc(t.x, t.y, r, startR, startR - arcRadians, true); // draw counter-clockwise
							e.stroke();
							e.closePath();

							// border line 1
							const s1 = Math.sin(arcRadians);
							const c1 = Math.cos(arcRadians);
							const xb1 = dx * c1 - dy * s1;
							const yb1 = dx * s1 + dy * c1;
							e.beginPath();
							e.moveTo(t.x, t.y);
							e.lineTo(t.x + xb1, t.y + yb1);
							e.stroke();
							e.closePath();

							// border line 2
							const s2 = Math.sin(-arcRadians);
							const c2 = Math.cos(-arcRadians);
							const xb2 = dx * c2 - dy * s2;
							const yb2 = dx * s2 + dy * c2;
							e.beginPath();
							e.moveTo(t.x, t.y);
							e.lineTo(t.x + xb2, t.y + yb2);
							e.stroke();
							e.closePath();
							break;
						}
						case "4": { // box
							const dxHalf = (t.to_x - t.x) / 2;
							const dyHalf = (t.to_y - t.y) / 2;

							e.beginPath();
							switch (t.Ve.box.mode) {
								case "1": // origin
									const dx = t.to_x - t.x;
									const dy = t.to_y - t.y;

									const [x1, y1] = rotPoint(RAD_90_DEG, t.to_x, t.to_y);
									const [x3, y3] = rotPoint(-RAD_90_DEG, t.to_x, t.to_y);

									e.moveTo(x1, y1);
									e.lineTo(x1 + dx, y1 + dy);
									e.lineTo(x3 + dx, y3 + dy);
									e.lineTo(x3 - dx, y3 - dy);
									e.lineTo(x1 - dx, y1 - dy);
									e.lineTo(x1 + dx, y1 + dy);

									break;
								case "2": { // halfway
									const [x1, y1] = rotPoint(RAD_90_DEG, t.to_x - dxHalf, t.to_y - dyHalf);
									const [x3, y3] = rotPoint(-RAD_90_DEG, t.to_x - dxHalf, t.to_y - dyHalf);

									e.moveTo(t.x, t.y);
									e.lineTo(x1, y1);
									e.lineTo(x3, y3);

									const dx3 = (x3 - t.x);
									const dy3 = (y3 - t.y);
									e.lineTo(t.to_x + dx3, t.to_y + dy3);

									const dx1 = (x1 - t.x);
									const dy1 = (y1 - t.y);
									e.lineTo(t.to_x + dx1, t.to_y + dy1);

									e.lineTo(x1, y1);

									break;
								}
							}
							e.stroke();
							e.closePath();
							break;
						}
						case "5": { // line
							e.beginPath();

							const div = t.Ve.line.mode === "2" ? 1 : 2;

							const norm = [];
							d20plus.math.normalize(norm, [t.to_x - t.x, t.to_y - t.y]);
							const width = Number(t.Ve.line.width) / div;
							const scaledWidth = (width / d20.Campaign.activePage().get("scale_number")) * 70;
							d20plus.math.scale(norm, norm, scaledWidth);

							const xRot = t.x + norm[0];
							const yRot = t.y + norm[1];

							const [x1, y1] = rotPoint(RAD_90_DEG, xRot, yRot);
							const [x3, y3] = rotPoint(-RAD_90_DEG, xRot, yRot);
							console.log(t.x, t.y, norm, xRot, yRot);

							e.moveTo(t.x, t.y);
							e.lineTo(x1, y1);
							e.lineTo(x3, y3);

							const dx3 = (x3 - t.x);
							const dy3 = (y3 - t.y);
							e.lineTo(t.to_x + dx3, t.to_y + dy3);

							const dx1 = (x1 - t.x);
							const dy1 = (y1 - t.y);
							e.lineTo(t.to_x + dx1, t.to_y + dy1);

							e.lineTo(x1, y1);

							e.stroke();
							e.closePath();
							break;
						}
					}
				}
				// END MOD

				e.beginPath();
				var u = 15
					, d = Math.atan2(t.to_y - t.y, t.to_x - t.x);
				e.moveTo(t.x, t.y),
					e.lineTo(t.to_x, t.to_y),
				(i === !0 || "arrow" === i) && (e.lineTo(t.to_x - u * Math.cos(d - Math.PI / 6), t.to_y - u * Math.sin(d - Math.PI / 6)),
					e.moveTo(t.to_x, t.to_y),
					e.lineTo(t.to_x - u * Math.cos(d + Math.PI / 6), t.to_y - u * Math.sin(d + Math.PI / 6))),
					e.closePath(),
					e.stroke(),
				"nub" === i && (e.beginPath(),
					e.arc(t.to_x, t.to_y, 7, 0, 2 * Math.PI, !0),
					e.closePath(),
					e.fillStyle = e.strokeStyle,
					e.fill()),
				n && (e.fillStyle = "rgba(0,0,0,1)",
					e.fillText(l, t.to_x - 30, t.to_y - 20)),
					a;
			};
			d20.engine.drawMeasurements = function (e) {
				e.globalCompositeOperation = "source-over",
					e.lineWidth = 3,
					e.globalAlpha = 1,
					_.each(d20.engine.measurements, function (t) {
						if (t.pageid === d20.Campaign.activePage().id) {
							var n = _.clone(t)
								, i = d20.Campaign.players.get(n.player);
							n.color = i.get("color"),
								n.to_x = n.to_x - d20.engine.currentCanvasOffset[0],
								n.to_y = n.to_y - d20.engine.currentCanvasOffset[1],
								n.x = n.x - d20.engine.currentCanvasOffset[0],
								n.y = n.y - d20.engine.currentCanvasOffset[1],
								T(e, n, !0, !0)
						}
					})
				// BEGIN MOD
				const offset = (num, offset, xy) => {
					return (num + offset[xy]) - d20.engine.currentCanvasOffset[xy];
				};

				$.each(d20plus._stickyMeasure, (pId, n) => {
					const nuX = offset(n.x, n.offset, 0);
					const nuY = offset(n.y, n.offset, 1);
					const nuToX = offset(n.to_x, n.offset, 0);
					const nuToY = offset(n.to_y, n.offset, 1);
					const nuN = {
						...n,
						x: nuX,
						y: nuY,
						to_x: nuToX,
						to_y: nuToY,
						reRender: true
					};
					T(e, nuN, true, true);
				});

				// unrelated code, but throw it in the render loop here
				let doRender = false;
				$.each(d20plus._tempTopRenderLines, (id, toDraw) => {
					console.log("DRAWING", toDraw.ticks, toDraw.offset)
					e.beginPath();
					e.strokeStyle = window.currentPlayer.get("color");
					e.lineWidth = 2;

					const nuX = offset(toDraw.x - d20.engine.currentCanvasOffset[0], toDraw.offset, 0);
					const nuY = offset(toDraw.y - d20.engine.currentCanvasOffset[1], toDraw.offset, 1);
					const nuToX = offset(toDraw.to_x - d20.engine.currentCanvasOffset[0], toDraw.offset, 0);
					const nuToY = offset(toDraw.to_y - d20.engine.currentCanvasOffset[1], toDraw.offset, 1);

					e.moveTo(nuX, nuY);
					e.lineTo(nuToX, nuToY);

					e.moveTo(nuToX, nuY);
					e.lineTo(nuX, nuToY);

					e.stroke();
					e.closePath();

					toDraw.ticks--;
					doRender = true;
					if (toDraw.ticks <= 0) {
						delete d20plus._tempTopRenderLines[id];
					}
				});
				if (doRender) {
					d20.engine.debounced_renderTop()
				}
				// END MOD
			}
			// END ROLL20 CODE
		},

		_addStatusEffectEntries: () => {
			const sheetUrl = window.is_gm ? d20plus.getCfgVal("token", "statusSheetUrl") || d20plus.getCfgDefaultVal("token", "statusSheetUrl"): window.Campaign.attributes.bR20cfg_statussheet;

			const temp = new Image();
			temp.onload = () => {
				const xSize = 34;
				const iMin = 47;
				// const iMax = 101;
				const iMax = Math.ceil(temp.width / xSize); // round the last one up to a full image
				for (let i = iMin; i < iMax; ++i) {
					d20.token_editor.statusmarkers["5etools_" + (i - iMin)] = String(i * xSize);
				}
			};
			temp.src = sheetUrl;

			$(`#5etools-status-css`).html(`#radial-menu .markermenu .markericon {
				background-image: url(${sheetUrl});
			}`);
		},

		_removeStatusEffectEntries: () => {
			$(`#5etools-status-css`).html("");
			Object.keys(d20.token_editor.statusmarkers).filter(k => k.startsWith("5etools_")).forEach(k => delete d20.token_editor.statusmarkers[k]);
		},

		enhanceStatusEffects: () => {
			d20plus.log("Enhance status effects");
			$(`head`).append(`<style id="5etools-status-css"/>`);
			d20plus._handleStatusTokenConfigChange();

			function overwriteStatusEffects () {
				d20.engine.canvasDirty = true;
				d20.engine.canvasTopDirty = true;
				d20.engine.canvas._objects.forEach(it => {
					// avoid adding it to any objects that wouldn't have it to begin with
					if (!it.model || !it.model.view || !it.model.view.updateBackdrops) return;

					it.model.view.updateBackdrops = function (e) {
						if (!this.nohud && ("objects" == this.model.get("layer") || "gmlayer" == this.model.get("layer")) && "image" == this.model.get("type") && this.model && this.model.collection && this.graphic) {
							// BEGIN MOD
							const scaleFact = (d20plus.getCfgVal("canvas", "scaleNamesStatuses") && d20.Campaign.activePage().get("snapping_increment"))
								? d20.Campaign.activePage().get("snapping_increment")
								: 1;
							// END MOD
							var t = this.model.collection.page
								, n = e || d20.engine.canvas.getContext();
							n.save(),
							(this.graphic.get("flipX") || this.graphic.get("flipY")) && n.scale(this.graphic.get("flipX") ? -1 : 1, this.graphic.get("flipY") ? -1 : 1);
							var i = this
								, r = Math.floor(this.graphic.get("width") / 2)
								, o = Math.floor(this.graphic.get("height") / 2)
								, a = (parseFloat(t.get("scale_number")),
								this.model.get("statusmarkers").split(","));
							-1 !== a.indexOf("dead") && (n.strokeStyle = "rgba(189,13,13,0.60)",
								n.lineWidth = 10,
								n.beginPath(),
								n.moveTo(-r + 7, -o + 15),
								n.lineTo(r - 7, o - 5),
								n.moveTo(r - 7, -o + 15),
								n.lineTo(-r + 7, o - 5),
								n.closePath(),
								n.stroke()),
								n.rotate(-this.graphic.get("angle") * Math.PI / 180),
								n.strokeStyle = "rgba(0,0,0,0.65)",
								n.lineWidth = 1;
							var s = 0
								, l = i.model.get("bar1_value")
								, c = i.model.get("bar1_max");
							if ("" != c && (window.is_gm || this.model.get("showplayers_bar1") || this.model.currentPlayerControls() && this.model.get("playersedit_bar1"))) {
								var u = parseInt(l, 10) / parseInt(c, 10)
									, d = -o - 20 + 0;
								n.fillStyle = "rgba(" + d20.Campaign.tokendisplay.bar1_rgb + ",0.75)",
									n.beginPath(),
									n.rect(-r + 3, d, Math.floor((2 * r - 6) * u), 8),
									n.closePath(),
									n.fill(),
									n.beginPath(),
									n.rect(-r + 3, d, 2 * r - 6, 8),
									n.closePath(),
									n.stroke(),
									s++
							}
							var l = i.model.get("bar2_value")
								, c = i.model.get("bar2_max");
							if ("" != c && (window.is_gm || this.model.get("showplayers_bar2") || this.model.currentPlayerControls() && this.model.get("playersedit_bar2"))) {
								var u = parseInt(l, 10) / parseInt(c, 10)
									, d = -o - 20 + 12;
								n.fillStyle = "rgba(" + d20.Campaign.tokendisplay.bar2_rgb + ",0.75)",
									n.beginPath(),
									n.rect(-r + 3, d, Math.floor((2 * r - 6) * u), 8),
									n.closePath(),
									n.fill(),
									n.beginPath(),
									n.rect(-r + 3, d, 2 * r - 6, 8),
									n.closePath(),
									n.stroke(),
									s++
							}
							var l = i.model.get("bar3_value")
								, c = i.model.get("bar3_max");
							if ("" != c && (window.is_gm || this.model.get("showplayers_bar3") || this.model.currentPlayerControls() && this.model.get("playersedit_bar3"))) {
								var u = parseInt(l, 10) / parseInt(c, 10)
									, d = -o - 20 + 24;
								n.fillStyle = "rgba(" + d20.Campaign.tokendisplay.bar3_rgb + ",0.75)",
									n.beginPath(),
									n.rect(-r + 3, d, Math.floor((2 * r - 6) * u), 8),
									n.closePath(),
									n.fill(),
									n.beginPath(),
									n.rect(-r + 3, d, 2 * r - 6, 8),
									n.closePath(),
									n.stroke()
							}
							var h, p, g = 1, f = !1;
							switch (d20.Campaign.get("markers_position")) {
								case "bottom":
									h = o - 10,
										p = r;
									break;
								case "left":
									h = -o - 10,
										p = -r,
										f = !0;
									break;
								case "right":
									h = -o - 10,
										p = r - 18,
										f = !0;
									break;
								default:
									h = -o + 10,
										p = r
							}
							// BEGIN MOD
							n.strokeStyle = "white";
							n.lineWidth = 3 * scaleFact;
							const scaledFont = 14 * scaleFact;
							n.font = "bold " + scaledFont + "px Arial";
							// END MOD
							_.each(a, function (e) {
								var t = d20.token_editor.statusmarkers[e.split("@")[0]];
								if (!t)
									return !0;
								if ("dead" === e)
									return !0;
								var i = 0;
								if (g--,
									"#" === t.substring(0, 1))
									n.fillStyle = t,
										n.beginPath(),
										f ? h += 16 : p -= 16,
										n.arc(p + 8, f ? h + 4 : h, 6, 0, 2 * Math.PI, !0),
										n.closePath(),
										n.stroke(),
										n.fill(),
										i = f ? 10 : 4;
								else {
									// BEGIN MOD
									if (!d20.token_editor.statussheet_ready) return;
									const scaledWH = 21 * scaleFact;
									const scaledOffset = 22 * scaleFact;
									f ? h += scaledOffset : p -= scaledOffset;

									if (d20.engine.canvasZoom <= 1) {
										n.drawImage(d20.token_editor.statussheet_small, parseInt(t, 10), 0, 21, 21, p, h - 9, scaledWH, scaledWH);
									} else {
										n.drawImage(d20.token_editor.statussheet, parseInt(t, 10), 0, 24, 24, p, h - 9, scaledWH, scaledWH)
									}

									i = f ? 14 : 12;
									i *= scaleFact;
									// END MOD
								}
								if (-1 !== e.indexOf("@")) {
									var r = e.split("@")[1];
									// BEGIN MOD
									// bing backtick to "clear counter"
									if (r === "`") return;
									n.fillStyle = "rgb(222,31,31)";
									var o = f ? 9 : 14;
									o *= scaleFact;
									o -= (14 - (scaleFact * 14));
									n.strokeText(r + "", p + i, h + o);
									n.fillText(r + "", p + i, h + o);
									// END MOD
								}
							});
							var m = i.model.get("name");
							if ("" != m && 1 == this.model.get("showname") && (window.is_gm || this.model.get("showplayers_name") || this.model.currentPlayerControls() && this.model.get("playersedit_name"))) {
								n.textAlign = "center";
								// BEGIN MOD
								var y = 14 * scaleFact;
								const scaledY = 22 * scaleFact;
								const scaled6 = 6 * scaleFact;
								const scaled8 = 8 * scaleFact;
								n.font = "bold " + y + "px Arial";
								var v = n.measureText(m).width;
								n.fillStyle = "rgba(255,255,255,0.50)";
								n.fillRect(-1 * Math.floor((v + scaled6) / 2), o + scaled8, v + scaled6, y + scaled6);
								n.fillStyle = "rgb(0,0,0)";
								n.fillText(m + "", 0, o + scaledY, v);
								// END MOD
							}
							n.restore()
						}
					}
				});
			}

			overwriteStatusEffects();

			d20.engine.canvas.off("object:added");
			d20.engine.canvas.on("object:added", overwriteStatusEffects);

			// the holy trinity
			// d20.engine.canvas.on("object:removed", () => console.log("added"));
			// d20.engine.canvas.on("object:removed", () => console.log("removed"));
			// d20.engine.canvas.on("object:modified", () => console.log("modified"));

			$(document).off("mouseenter", ".markermenu");
			$(document).on("mouseenter", ".markermenu", function () {
				var e = this;
				$(this).on("mouseover.statusiconhover", ".statusicon", function () {
					a = $(this).attr("data-action-type").replace("toggle_status_", "")
				}),
					$(document).on("keypress.statusnum", function (t) {
						// BEGIN MOD // TODO see if this clashes with keyboard shortcuts
						if ("dead" !== a && currentcontexttarget) {
							// END MOD
							var n = String.fromCharCode(t.which)
								,
								i = "" == currentcontexttarget.model.get("statusmarkers") ? [] : currentcontexttarget.model.get("statusmarkers").split(",")
								, r = (_.map(i, function (e) {
									return e.split("@")[0]
								}),
									!1);
							i = _.map(i, function (e) {
								return e.split("@")[0] == a ? (r = !0,
								a + "@" + n) : e
							}),
							r || ($(e).find(".statusicon[data-action-type=toggle_status_" + a + "]").addClass("active"),
								i.push(a + "@" + n)),
								currentcontexttarget.model.save({
									statusmarkers: i.join(",")
								})
						}
					})
			})
		},

		enhancePageSelector: () => {
			d20plus.log("Enhancing page selector");
			var updatePageOrder = function () {
				d20plus.log("Saving page order...");
				var pos = 0;
				$("#page-toolbar .pages .chooseablepage").each(function () {
					var page = d20.Campaign.pages.get($(this).attr("data-pageid"));
					page && page.save({
						placement: pos
					});
					pos++;
				});
				d20.pagetoolbar.noReload = false;
				d20.pagetoolbar.refreshPageListing();
			}

			function overwriteDraggables () {
				// make them draggable on both axes
				$("#page-toolbar .pages").sortable("destroy");
				$("#page-toolbar .pages").sortable({
					items: "> .chooseablepage",
					start: function () {
						d20.pagetoolbar.noReload = true;
					},
					stop: function () {
						updatePageOrder()
					},
					distance: 15
				}).addTouch();
				$("#page-toolbar .playerbookmark").draggable("destroy");
				$("#page-toolbar .playerbookmark").draggable({
					revert: "invalid",
					appendTo: "#page-toolbar",
					helper: "original"
				}).addTouch();
				$("#page-toolbar .playerspecificbookmark").draggable("destroy");
				$("#page-toolbar .playerspecificbookmark").draggable({
					revert: "invalid",
					appendTo: "#page-toolbar",
					helper: "original"
				}).addTouch();
			}

			overwriteDraggables();
			$(`#page-toolbar`).css("top", "calc(-90vh + 40px)");

			const originalFn = d20.pagetoolbar.refreshPageListing;
			d20.pagetoolbar.refreshPageListing = () => {
				originalFn();
				// original function is debounced at 100ms, so debounce this at 110ms and hope for the best
				_.debounce(() => {
					overwriteDraggables();
				}, 110)();
			}
		},

		initQuickSearch: ($iptSearch, $outSearch) => {
			$iptSearch.on("keyup", () => {
				const searchVal = ($iptSearch.val() || "").trim();
				$outSearch.empty();
				if (searchVal.length <= 2) return; // ignore 2 characters or less, for performance reasons
				const found = $(`#journal .content`).find(`li[data-itemid]`).filter((i, ele) => {
					const $ele = $(ele);
					return $ele.find(`.name`).text().trim().toLowerCase().includes(searchVal.toLowerCase());
				});
				if (found.length) {
					$outSearch.append(`<p><b>Search results:</b></p>`);
					const $outList = $(`<ol class="dd-list Vetools-search-results"/>`);
					$outSearch.append($outList);
					found.clone().addClass("Vetools-draggable").appendTo($outList);
					$outSearch.append(`<hr>`);
					$(`.Vetools-search-results .Vetools-draggable`).draggable({
						revert: true,
						distance: 10,
						revertDuration: 0,
						helper: "clone",
						handle: ".namecontainer",
						appendTo: "body",
						scroll: true,
						start: function () {
							$("#journalfolderroot").addClass("externaldrag")
						},
						stop: function () {
							$("#journalfolderroot").removeClass("externaldrag")
						}
					});
				}
			});
		},

		addSelectedTokenCommands: () => {
			d20plus.log("Add token rightclick commands");
			$("#tmpl_actions_menu").replaceWith(d20plus.template_actionsMenu);

			// BEGIN ROLL20 CODE
			var e, t = !1, n = [];
			var i = function() {
				t && (t.remove(),
					t = !1),
				e && clearTimeout(e)
			};
			var r = function (r) {
				var o, a;
				r.changedTouches && r.changedTouches.length > 0 ? (o = r.changedTouches[0].pageX,
					a = r.changedTouches[0].pageY) : (o = r.pageX,
					a = r.pageY),
					i(),
					n = [];
				for (var s = [], l = d20.engine.selected(), c = 0; c < l.length; c++)
					n.push(l[c]),
						s.push(l[c].type);
				if (s = _.uniq(s),
					n.length > 0)
					if (1 == s.length) {
						var u = n[0];
						t = $("image" == u.type && 0 == u.model.get("isdrawing") ? $("#tmpl_actions_menu").jqote(u.model) : $("#tmpl_actions_menu").jqote(u.model))
					} else {
						var u = n[0];
						t = $($("#tmpl_actions_menu").jqote(u.model))
					}
				else
					t = $($("#tmpl_actions_menu").jqote({}));
				if (!window.is_gm && t[0].lastElementChild.childElementCount < 1)
					return !1;
				t.appendTo("body");
				var d = t.height()
					, h = t.width()
					, p = {};
				return p.top = a > $("#editor-wrapper").height() - $("#playerzone").height() - d - 100 ? a - d + "px" : a + "px",
					p.left = o > $("#editor-wrapper").width() - h ? o + 10 - h + "px" : o + 10 + "px",
					t.css(p),
					$(".actions_menu").bind("mousedown mouseup touchstart", function(e) {
						e.stopPropagation()
					}),
					$(".actions_menu ul > li").bind("mouseover touchend", function() {
						if (e && (clearTimeout(e),
								e = !1),
							$(this).parents(".hasSub").length > 0)
							;
						else if ($(this).hasClass("hasSub")) {
							$(".actions_menu").css({
								width: "215px",
								height: "250px"
							});
							var t = this;
							_.defer(function() {
								$(".actions_menu ul.submenu").hide(),
									$(t).find("ul.submenu:hidden").show()
							})
						} else
							$(".actions_menu ul.submenu").hide()
					}),
					$(".actions_menu ul.submenu").live("mouseover", function() {
						e && (clearTimeout(e),
							e = !1)
					}),
					$(".actions_menu, .actions_menu ul.submenu").live("mouseleave", function() {
						e || (e = setTimeout(function() {
							$(".actions_menu ul.submenu").hide(),
								$(".actions_menu").css("width", "100px").css("height", "auto"),
								e = !1
						}, 500))
					}),
					$(".actions_menu li").on(clicktype, function() {
						var e = $(this).attr("data-action-type");
						if (null != e) {
							if ("copy" == e)
								d20.clipboard.doCopy(),
									i();
							else if ("paste" == e)
								d20.clipboard.doPaste(),
									i();
							else if ("delete" == e) {
								var t = d20.engine.selected();
								d20.engine.canvas.deactivateAllWithDispatch();
								for (var r = 0; r < t.length; r++)
									t[r].model.destroy();
								i()
							} else if ("undo" == e)
								d20.undo && d20.undo.doUndo(),
									i();
							else if ("tofront" == e)
								d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
									_.each(n, function(e) {
										d20.engine.canvas.bringToFront(e)
									}),
									d20.Campaign.activePage().debounced_recordZIndexes(),
									i();
							else if ("toback" == e)
								d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
									_.each(n, function(e) {
										d20.engine.canvas.sendToBack(e)
									}),
									d20.Campaign.activePage().debounced_recordZIndexes(),
									i();
							else if (-1 !== e.indexOf("tolayer_")) {
								d20.engine.unselect();
								var o = e.replace("tolayer_", "");
								_.each(n, function(e) {
									e.model.save({
										layer: o
									})
								}),
									i(),
									d20.token_editor.removeRadialMenu()
							} else if ("addturn" == e)
								_.each(n, function(e) {
									d20.Campaign.initiativewindow.addTokenToList(e.model.id)
								}),
									i(),
								d20.tutorial && d20.tutorial.active && $(document.body).trigger("addedTurn");
							else if ("group" == e) {
								var a = [];
								d20.engine.unselect(),
									_.each(n, function(e) {
										a.push(e.model.id)
									}),
									_.each(n, function(e) {
										e.model.addToGroup(a)
									}),
									i();
								var s = n[0];
								d20.engine.select(s)
							} else if ("ungroup" == e)
								d20.engine.unselect(),
									_.each(n, function(e) {
										e.model.clearGroup()
									}),
									d20.token_editor.removeRadialMenu(),
									i();
							else if ("toggledrawing" == e)
								d20.engine.unselect(),
									_.each(n, function(e) {
										e.model.set({
											isdrawing: !e.model.get("isdrawing")
										}).save()
									}),
									i(),
									d20.token_editor.removeRadialMenu();
							else if ("toggleflipv" == e)
								d20.engine.unselect(),
									_.each(n, function(e) {
										e.model.set({
											flipv: !e.model.get("flipv")
										}).save()
									}),
									i(),
									d20.token_editor.removeRadialMenu();
							else if ("togglefliph" == e)
								d20.engine.unselect(),
									_.each(n, function(e) {
										e.model.set({
											fliph: !e.model.get("fliph")
										}).save()
									}),
									i(),
									d20.token_editor.removeRadialMenu();
							else if ("takecard" == e)
								d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
									_.each(n, function(e) {
										var t = d20.decks.cardByID(e.model.get("cardid"));
										if (e.model.get("isdrawing") === !1)
											var n = {
												bar1_value: e.model.get("bar1_value"),
												bar1_max: e.model.get("bar1_max"),
												bar2_value: e.model.get("bar2_value"),
												bar2_max: e.model.get("bar2_max"),
												bar3_value: e.model.get("bar3_value"),
												bar3_max: e.model.get("bar3_max")
											};
										d20.Campaign.hands.addCardToHandForPlayer(t, window.currentPlayer, n ? n : void 0),
											_.defer(function() {
												e.model.destroy()
											})
									}),
									d20.engine.unselect(),
									i();
							else if ("flipcard" == e)
								d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
									_.each(n, function(e) {
										var t = e.model.get("sides").split("|")
											, n = e.model.get("currentSide")
											, i = n + 1;
										i > t.length - 1 && (i = 0),
											e.model.set({
												currentSide: i,
												imgsrc: unescape(t[i])
											}).save()
									}),
									i();
							else if ("setdimensions" == e) {
								var l = n[0]
									, c = $($("#tmpl_setdimensions").jqote()).dialog({
									title: "Set Dimensions",
									width: 325,
									height: 225,
									buttons: {
										Set: function() {
											var e, t;
											"pixels" == c.find(".dimtype").val() ? (e = parseInt(c.find("input.width").val(), 10),
												t = parseInt(c.find("input.height").val(), 10)) : (e = parseFloat(c.find("input.width").val()) * window.dpi,
												t = parseFloat(c.find("input.height").val()) * window.dpi),
												l.model.save({
													width: e,
													height: t
												}),
												c.off("change"),
												c.dialog("destroy").remove()
										},
										Cancel: function() {
											c.off("change"),
												c.dialog("destroy").remove()
										}
									},
									beforeClose: function() {
										c.off("change"),
											c.dialog("destroy").remove()
									}
								});
								c.on("change", ".dimtype", function() {
									"pixels" == $(this).val() ? (c.find("input.width").val(Math.round(l.get("width"))),
										c.find("input.height").val(Math.round(l.get("height")))) : (c.find("input.width").val(l.get("width") / window.dpi),
										c.find("input.height").val(l.get("height") / window.dpi))
								}),
									c.find(".dimtype").trigger("change"),
									i()
							} else if ("aligntogrid" == e)
								if (0 === d20.Campaign.activePage().get("snapping_increment")) {
									i();
									var u = $($("#tmpl_grid-disabled").jqote(h)).dialog({
										title: "Grid Off",
										buttons: {
											Ok: function() {
												u.off("change"),
													u.dialog("destroy").remove()
											}
										},
										beforeClose: function() {
											u.off("change"),
												u.dialog("destroy").remove()
										}
									})
								} else
									d20.engine.gridaligner.target = n[0],
										d20plus.setMode("gridalign"),
										i();
							else if ("side_random" == e) {
								d20.engine.canvas.getActiveGroup() && d20.engine.unselect();
								var d = [];
								_.each(n, function(e) {
									if (e.model && "" != e.model.get("sides")) {
										var t = e.model.get("sides").split("|")
											, n = t.length
											, i = d20.textchat.diceengine.random(n);

										const imgUrl = unescape(t[i]);
										e.model.save(getRollableTokenUpdate(imgUrl, i)),
											d.push(t[i])
									}
								}),
									d20.textchat.rawChatInput({
										type: "tokenroll",
										content: d.join("|")
									}),
									i()
							} else if ("side_choose" == e) {
								var l = n[0]
									, h = l.model.toJSON()
									, p = h.currentSide;
								h.sidesarray = h.sides.split("|");
								var c = $($("#tmpl_chooseside").jqote(h)).dialog({
									title: "Choose Side",
									width: 325,
									height: 225,
									buttons: {
										Choose: function() {
											const imgUrl = unescape(h.sidesarray[p]);
											d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
												l.model.save(getRollableTokenUpdate(imgUrl, p)),
												l = null,
												h = null,
												c.off("slide"),
												c.dialog("destroy").remove()
										},
										Cancel: function() {
											l = null,
												h = null,
												c.off("slide"),
												c.dialog("destroy").remove()
										}
									},
									beforeClose: function() {
										l = null,
											h = null,
											c.off("slide"),
											c.dialog("destroy").remove()
									}
								});
								c.find(".sideslider").slider({
									min: 0,
									max: h.sidesarray.length - 1,
									step: 1,
									value: h.currentSide
								}),
									c.on("slide", function(e, t) {
										t.value != p && (p = t.value,
											c.find(".sidechoices .sidechoice").hide().eq(t.value).show())
									}),
									c.find(".sidechoices .sidechoice").hide().eq(h.currentSide).show(),
									i()
							}
							// BEGIN MOD
							if ("rollsaves" === e) {
								const sel = d20.engine.selected();

								const options = ["str", "dex", "con", "int", "wis", "cha"].map(it => `<option value='${it}'>${Parser.attAbvToFull(it)}</option>`);
								const dialog= $("<div><p style='font-size: 1.15em;'><strong>" + d20.utils.strip_tags("Select Save") + ":</strong> <select style='width: 150px; margin-left: 5px;'>" + options.join("") + "</select></p></div>");
								dialog.dialog({
									title: "Input Value",
									beforeClose: function() {
										return false;
									},
									buttons: {
										Submit: function() {
											const val = Parser.attAbvToFull(dialog.find("select").val());
											console.log(val);
											d20.engine.unselect();
											sel.forEach(it => {
												d20.engine.select(it);
												const toRoll = `@{selected|wtype} &{template:simple} {{charname=@{selected|token_name}}} {{always=1}} {{rname=${val} Save}} {{mod=@{selected|${val.toLowerCase()}_save_bonus}}} {{r1=[[1d20+@{selected|${val.toLowerCase()}_save_bonus}]]}} {{r2=[[1d20+@{selected|${val.toLowerCase()}_save_bonus}]]}}`;
												d20.textchat.doChatInput(toRoll);
												d20.engine.unselect();
											});

											dialog.off();
											dialog.dialog("destroy").remove();
											d20.textchat.$textarea.focus();
										},
										Cancel: function() {
											dialog.off();
											dialog.dialog("destroy").remove();
										}
									}
								});

								i();
							} else if ("rollinit" === e) {
								const sel = d20.engine.selected();
								d20.engine.unselect();
								sel.forEach(it => {
									d20.engine.select(it);
									const toRoll = `@{selected|wtype} &{template:simple} {{rname=Initiative}} {{charname=@{selected|token_name}}} {{mod=[[@{selected|initiative_bonus}]]}} {{r1=[[@{selected|d20}+@{selected|dexterity_mod} &{tracker}]]}}{{normal=1}}`;
									d20.textchat.doChatInput(toRoll);
									d20.engine.unselect();
								});
								i();
							} else if ("rollertokenresize" === e) {
								resizeToken();
								i();
							}
							// END MOD
							return !1
						}
					}),
					!1
			};
			// END ROLL20 CODE

			function getRollableTokenUpdate (imgUrl, curSide) {
				const m = /\?roll20_token_size=(.*)/.exec(imgUrl);
				const toSave = {
					currentSide: curSide,
					imgsrc: imgUrl
				};
				if (m) {
					toSave.width = 70 * Number(m[1]);
					toSave.height = 70 * Number(m[1])
				}
				return toSave;
			}

			function resizeToken () {
				const sel = d20.engine.selected();

				const options = [["Tiny", 0.5], ["Small", 1], ["Medium", 1], ["Large", 2], ["Huge", 3], ["Gargantuan", 4], ["Colossal", 5]].map(it => `<option value='${it[1]}'>${it[0]}</option>`);
				const dialog = $(`<div><p style='font-size: 1.15em;'><strong>${d20.utils.strip_tags("Select Size")}:</strong> <select style='width: 150px; margin-left: 5px;'>${options.join("")}</select></p></div>`);
				dialog.dialog({
					title: "New Size",
					beforeClose: function () {
						return false;
					},
					buttons: {
						Submit: function () {
							const size = dialog.find("select").val();
							d20.engine.unselect();
							sel.forEach(it => {
								const nxtSize = size * 70;
								const sides = it.model.get("sides");
								if (sides) {
									const ueSides = unescape(sides);
									const cur = it.model.get("currentSide");
									const split = ueSides.split("|");
									if (split[cur].includes("roll20_token_size")) {
										split[cur] = split[cur].replace(/(\?roll20_token_size=).*/, `$1${size}`);
									} else {
										split[cur] += `?roll20_token_size=${size}`;
									}
									const toSaveSides = split.map(it => escape(it)).join("|");
									const toSave = {
										sides: toSaveSides,
										width: nxtSize,
										height: nxtSize
									};
									console.log(`Updating token:`, toSave);
									it.model.save(toSave);
								} else {
									console.warn("Token had no side data!")
								}
							});
							dialog.off();
							dialog.dialog("destroy").remove();
							d20.textchat.$textarea.focus();
						},
						Cancel: function () {
							dialog.off();
							dialog.dialog("destroy").remove();
						}
					}
				});
			}

			d20.token_editor.showContextMenu = r;
			d20.token_editor.closeContextMenu = i;
			$(`#editor-wrapper`).on("click", d20.token_editor.closeContextMenu);
		},

		_tempTopRenderLines: {}, // format: {x: ..., y: ..., to_x: ..., to_y: ..., ticks: ..., offset: ...}
		// previously "enhanceSnap"
		enhanceMouseDown: () => {
			/**
			 * Dumb variable names copy-pasted from uglified code
			 * @param c x co-ord
			 * @param u y c-ord
			 * @returns {*[]} 2-len array; [0] = x and [1] = y
			 */
			function getClosestHexPoint (c, u) {
				function getEuclidDist (x1, y1, x2, y2) {
					return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
				}

				const hx = d20.canvas_overlay.activeHexGrid.GetHexAt({
					X: c,
					Y: u
				});

				let minDist = 1000000;
				let minPoint = [c, u];

				function checkDist(x1, y1) {
					const dist = getEuclidDist(x1, y1, c, u);
					if (dist < minDist) {
						minDist =  dist;
						minPoint = [x1, y1];
					}
				}
				hx.Points.forEach(pt => {
					checkDist(pt.X, pt.Y);
				});
				checkDist(hx.MidPoint.X, hx.MidPoint.Y);

				return minPoint;
			}

			// BEGIN ROLL20 CODE
			const M = function(e) { // seems to be "A" nowadays
				//BEGIN MOD
				var t = d20.engine.canvas;
				var s = $("#editor-wrapper");
				// END MOD
				var n, r;
				if (d20.tddice && d20.tddice.handleInteraction && d20.tddice.handleInteraction(),
						e.touches) {
					if ("pan" == d20.engine.mode)
						return;
					e.touches.length > 1 && (R = d20.engine.mode,
						d20.engine.mode = "pan",
						d20.engine.leftMouseIsDown = !0),
						d20.engine.lastTouchStarted = (new Date).getTime(),
						n = e.touches[0].pageX,
						r = e.touches[0].pageY,
						e.preventDefault()
				} else
					n = e.pageX,
						r = e.pageY;
				for (var o = d20.engine.showLastPaths.length; o--; )
					"selected" == d20.engine.showLastPaths[o].type && d20.engine.showLastPaths.splice(o, 1);
				d20.engine.handleMetaKeys(e),
				("select" == d20.engine.mode || "path" == d20.engine.mode) && t.__onMouseDown(e),
				(1 == e.which || e.touches && 1 == e.touches.length) && (d20.engine.leftMouseIsDown = !0);
				var a = Math.floor(n / d20.engine.canvasZoom + d20.engine.currentCanvasOffset[0] - d20.engine.paddingOffset[0] / d20.engine.canvasZoom)
					, l = Math.floor(r / d20.engine.canvasZoom + d20.engine.currentCanvasOffset[1] - d20.engine.paddingOffset[1] / d20.engine.canvasZoom);
				if (d20.engine.lastMousePos = [a, l],
					!d20.engine.leftMouseIsDown || "fog-reveal" != d20.engine.mode && "fog-hide" != d20.engine.mode && "gridalign" != d20.engine.mode) {
					if (d20.engine.leftMouseIsDown && "fog-polygonreveal" == d20.engine.mode) {
						// BEGIN MOD
						var c = a;
						var u = l;
						if (0 != d20.engine.snapTo && (e.shiftKey && !d20.Campaign.activePage().get("adv_fow_enabled") || !e.shiftKey && d20.Campaign.activePage().get("adv_fow_enabled"))) {
							if ("square" == d20.Campaign.activePage().get("grid_type")) {
								c = d20.engine.snapToIncrement(c, d20.engine.snapTo);
								u = d20.engine.snapToIncrement(u, d20.engine.snapTo);
							} else {
								const minPoint = getClosestHexPoint(c, u);
								c = minPoint[0];
								u = minPoint[1];
							}
						}
						if (d20.engine.fog.points.length > 0 && Math.abs(d20.engine.fog.points[0][0] - c) + Math.abs(d20.engine.fog.points[0][1] - u) < 15) {
							d20.engine.fog.points.push([d20.engine.fog.points[0][0], d20.engine.fog.points[0][1]]);
							d20.engine.finishPolygonReveal();
						} else {
							d20.engine.fog.points.push([c, u]);
						}
						d20.engine.drawOverlays();
						// END MOD
					} else if (d20.engine.leftMouseIsDown && "measure" == d20.engine.mode) {
						if (d20.engine.measure.down[0] = a,
								d20.engine.measure.down[1] = l,
							0 != d20.engine.snapTo && !e.altKey)
							if ("square" == d20.Campaign.activePage().get("grid_type"))
								d20.engine.measure.down[1] = d20.engine.snapToIncrement(d20.engine.measure.down[1] + Math.floor(d20.engine.snapTo / 2), d20.engine.snapTo) - Math.floor(d20.engine.snapTo / 2),
									d20.engine.measure.down[0] = d20.engine.snapToIncrement(d20.engine.measure.down[0] + Math.floor(d20.engine.snapTo / 2), d20.engine.snapTo) - Math.floor(d20.engine.snapTo / 2);
							else {
								var d = d20.canvas_overlay.activeHexGrid.GetHexAt({
									X: d20.engine.measure.down[0],
									Y: d20.engine.measure.down[1]
								});
								d20.engine.measure.down[1] = d.MidPoint.Y,
									d20.engine.measure.down[0] = d.MidPoint.X
							}
					} else if (d20.engine.leftMouseIsDown && "fxtools" == d20.engine.mode)
						d20.engine.fx.current || (d20.engine.fx.current = d20.fx.handleClick(a, l));
					else if (d20.engine.leftMouseIsDown && "text" == d20.engine.mode) {
						var h = {
							fontFamily: $("#font-family").val(),
							fontSize: $("#font-size").val(),
							fill: $("#font-color").val(),
							text: "",
							left: a,
							top: l
						}
							, p = d20.Campaign.activePage().addText(h);
						_.defer(function() {
							d20.engine.editText(p.view.graphic, h.top, h.left),
								setTimeout(function() {
									$(".texteditor").focus()
								}, 300)
						})
					} else if (d20.engine.leftMouseIsDown && "rect" == d20.engine.mode) {
						var g = parseInt($("#path_width").val(), 10)
							, f = d20.engine.drawshape.shape = {
							strokewidth: g,
							x: 0,
							y: 0,
							width: 10,
							height: 10,
							type: e.altKey ? "circle" : "rect"
						}
							, c = a
							, u = l;
						0 != d20.engine.snapTo && e.shiftKey && (c = d20.engine.snapToIncrement(c, d20.engine.snapTo),
							u = d20.engine.snapToIncrement(u, d20.engine.snapTo)),
							f.x = c,
							f.y = u,
							f.fill = $("#path_fillcolor").val(),
							f.stroke = $("#path_strokecolor").val(),
							d20.engine.drawshape.start = [n + d20.engine.currentCanvasOffset[0] - d20.engine.paddingOffset[0], r + d20.engine.currentCanvasOffset[1] - d20.engine.paddingOffset[1]],
							d20.engine.renderTop()
					} else if (d20.engine.leftMouseIsDown && "polygon" == d20.engine.mode) {
						if (d20.engine.drawshape.shape)
							var f = d20.engine.drawshape.shape;
						else {
							var g = parseInt($("#path_width").val(), 10)
								, f = d20.engine.drawshape.shape = {
								strokewidth: g,
								points: [],
								type: "polygon"
							};
							f.fill = $("#path_fillcolor").val(),
								f.stroke = $("#path_strokecolor").val()
						}
						// BEGIN MOD
						var c = a;
						var u = l;
						if (0 != d20.engine.snapTo && e.shiftKey) {
							if ("square" == d20.Campaign.activePage().get("grid_type")) {
								c = d20.engine.snapToIncrement(c, d20.engine.snapTo);
								u = d20.engine.snapToIncrement(u, d20.engine.snapTo);
							} else {
								const minPoint = getClosestHexPoint(c, u);
								c = minPoint[0];
								u = minPoint[1];
							}
						}
						if (f.points.length > 0 && Math.abs(f.points[0][0] - c) + Math.abs(f.points[0][1] - u) < 15) {
							f.points.push([f.points[0][0], f.points[0][1]]);
							if (f.points.length > 2) {
								f.points.push([f.points[1][0], f.points[1][1]]);
							}
							d20.engine.finishCurrentPolygon();
						} else {
							f.points.push([c, u]);
						}
						d20.engine.debounced_renderTop();
						// END MOD
					} else if (d20.engine.leftMouseIsDown && "targeting" === d20.engine.mode) {
						var m = d20.engine.canvas.findTarget(e, !0, !0);
						return void (void 0 !== m && "image" === m.type && m.model && d20.engine.nextTargetCallback(m))
					}
					// BEGIN MOD
					else if (d20.engine.leftMouseIsDown && "line_splitter" === d20.engine.mode) {
						const lastPoint = {x: d20.engine.lastMousePos[0], y: d20.engine.lastMousePos[1]};
						(d20.engine.canvas._objects || []).forEach(o => {
							if (o.type === "path" && o.containsPoint(lastPoint)) {
								const asObj = o.toObject();
								const anyCurves = asObj.path.filter(it => it instanceof Array && it.length > 0  && it[0] === "C");
								if (!anyCurves.length) {
									// PathMath expects these
									o.model.set("_pageid", d20.Campaign.activePage().get("id"));
									o.model.set("_path", JSON.stringify(o.path));

									console.log("SPLITTING PATH: ", o.model);
									const mainPath = o.model;

									// BEGIN PathSplitter CODE
									let mainSegments = PathMath.toSegments(mainPath);
									// BEGIN MOD
									// fake a tiny diagonal line
									const SLICE_LEN = 10;
									const slicePoint1 = [lastPoint.x + (SLICE_LEN / 2), lastPoint.y + (SLICE_LEN / 2), 1];
									const slicePoint2 = [lastPoint.x - (SLICE_LEN / 2), lastPoint.y - (SLICE_LEN / 2), 1];
									const nuId = d20plus.generateRowId();
									d20plus._tempTopRenderLines[nuId] = {
										ticks: 2,
										x: slicePoint1[0],
										y: slicePoint1[1],
										to_x: slicePoint2[0],
										to_y: slicePoint2[1],
										offset: [...d20.engine.currentCanvasOffset]
									};
									setTimeout(() => {
										d20.engine.debounced_renderTop();
									}, 1);
									let splitSegments = [
										[slicePoint1, slicePoint2]
									];
									// END MOD
									let segmentPaths = _getSplitSegmentPaths(mainSegments, splitSegments);

									// (function moved into this scope)
									function _getSplitSegmentPaths(mainSegments, splitSegments) {
										let resultSegPaths = [];
										let curPathSegs = [];

										_.each(mainSegments, seg1 => {

											// Find the points of intersection and their parametric coefficients.
											let intersections = [];
											_.each(splitSegments, seg2 => {
												let i = PathMath.segmentIntersection(seg1, seg2);
												if(i) intersections.push(i);
											});

											if(intersections.length > 0) {
												// Sort the intersections in the order that they appear along seg1.
												intersections.sort((a, b) => {
													return a[1] - b[1];
												});

												let lastPt = seg1[0];
												_.each(intersections, i => {
													// Complete the current segment path.
													curPathSegs.push([lastPt, i[0]]);
													resultSegPaths.push(curPathSegs);

													// Start a new segment path.
													curPathSegs = [];
													lastPt = i[0];
												});
												curPathSegs.push([lastPt, seg1[1]]);
											}
											else {
												curPathSegs.push(seg1);
											}
										});
										resultSegPaths.push(curPathSegs);

										return resultSegPaths;
									};
									// (end function moved into this scope)

									// Convert the list of segment paths into paths.
									let _pageid = mainPath.get('_pageid');
									let controlledby = mainPath.get('controlledby');
									let fill = mainPath.get('fill');
									let layer = mainPath.get('layer');
									let stroke = mainPath.get('stroke');
									let stroke_width = mainPath.get('stroke_width');

									let results = [];
									_.each(segmentPaths, segments => {
										let pathData = PathMath.segmentsToPath(segments);
										_.extend(pathData, {
											_pageid,
											controlledby,
											fill,
											layer,
											stroke,
											stroke_width
										});
										let path = createObj('path', pathData);
										results.push(path);
									});

									// Remove the original path and the splitPath.
									// BEGIN MOD
									mainPath.destroy();
									// END MOD
									// END PathSplitter CODE
								}
							}
						});
					}
					// END MOD
				} else
					d20.engine.fog.down[0] = a,
						d20.engine.fog.down[1] = l,
					0 != d20.engine.snapTo && "square" == d20.Campaign.activePage().get("grid_type") && ("gridalign" == d20.engine.mode ? e.shiftKey && (d20.engine.fog.down[0] = d20.engine.snapToIncrement(d20.engine.fog.down[0], d20.engine.snapTo),
						d20.engine.fog.down[1] = d20.engine.snapToIncrement(d20.engine.fog.down[1], d20.engine.snapTo)) : (e.shiftKey && !d20.Campaign.activePage().get("adv_fow_enabled") || !e.shiftKey && d20.Campaign.activePage().get("adv_fow_enabled")) && (d20.engine.fog.down[0] = d20.engine.snapToIncrement(d20.engine.fog.down[0], d20.engine.snapTo),
						d20.engine.fog.down[1] = d20.engine.snapToIncrement(d20.engine.fog.down[1], d20.engine.snapTo)));
				if (window.currentPlayer && d20.engine.leftMouseIsDown && "select" == d20.engine.mode) {
					if (d20.engine.pings[window.currentPlayer.id] && d20.engine.pings[window.currentPlayer.id].radius > 20)
						return;
					var y = a
						, v = l
						, b = {
						left: y,
						top: v,
						radius: -5,
						player: window.currentPlayer.id,
						pageid: d20.Campaign.activePage().id,
						currentLayer: window.currentEditingLayer
					};
					window.is_gm && e.shiftKey && (b.scrollto = !0),
						d20.engine.pings[window.currentPlayer.id] = b,
						d20.engine.pinging = {
							downx: n,
							downy: r
						},
						d20.engine.renderTop()
				}
				3 == e.which && (d20.engine.rightMouseIsDown = !0),
					d20.engine.rightMouseIsDown && ("select" == d20.engine.mode || "path" == d20.engine.mode || "text" == d20.engine.mode) || d20.engine.leftMouseIsDown && "pan" == d20.engine.mode ? (d20.engine.pan.beginPos = [s.scrollLeft(), s.scrollTop()],
						d20.engine.pan.panXY = [n, r],
						d20.engine.pan.panning = !0) : d20.engine.pan.panning = !1,
					// BEGIN MOD
				$(`#upperCanvas`).hasClass("hasfocus") || $(`#upperCanvas`).focus()
				// END MOD
			};
			// END ROLL20 CODE

			if (UPPER_CANVAS_MOUSEDOWN) {
				d20plus.log("Enhancing hex snap");
				d20.engine.uppercanvas.removeEventListener("mousedown", UPPER_CANVAS_MOUSEDOWN);
				d20.engine.uppercanvas.addEventListener("mousedown", M);
			}

			// add half-grid snap
			d20.engine.snapToIncrement = function(e, t) {
				if (d20plus.getCfgVal("canvas", "halfGridSnap")) {
					t = t / 2;
				}
				return t * Math.round(e / t);
			}
		},

		enhanceMouseUp: () => { // P

		},

		enhanceMouseMove: () => {
			// M
			// needs to be called after `enhanceMeasureTool()`
			const $selMeasureMode = $(`#measure_mode`);
			const $cbSticky = $(`#measure_sticky`);
			const $selRadMode = $(`#measure_mode_sel_2`);
			const $iptConeWidth = $(`#measure_mode_ipt_3`);
			const $selBoxMode = $(`#measure_mode_sel_4`);
			const $selLineMode = $(`#measure_mode_sel_5`);
			const $iptLineWidth = $(`#measure_mode_ipt_5`);

			// BEGIN ROLL20 CODE
			var x = function(e) {
				e.type = "measuring",
					e.time = (new Date).getTime(),
					d20.textchat.sendShout(e)
			}
				, k = _.throttle(x, 200)
				, E = function(e) {
				k(e),
				d20.tutorial && d20.tutorial.active && $(document.body).trigger("measure"),
					d20.engine.receiveMeasureUpdate(e)
			};
			// END ROLL20 CODE

			// add missing vars
			var t = d20.engine.canvas;
			var a = $("#editor-wrapper");

			// BEGIN ROLL20 CODE
			const M = function(e) {
				var n, i;
				if (e.changedTouches ? ((e.changedTouches.length > 1 || "pan" == d20.engine.mode) && (delete d20.engine.pings[window.currentPlayer.id],
					d20.engine.pinging = !1),
					e.preventDefault(),
					n = e.changedTouches[0].pageX,
					i = e.changedTouches[0].pageY) : (n = e.pageX,
					i = e.pageY),
				"select" != d20.engine.mode && "path" != d20.engine.mode && "targeting" != d20.engine.mode || t.__onMouseMove(e),
				d20.engine.leftMouseIsDown || d20.engine.rightMouseIsDown) {
					var o = Math.floor(n / d20.engine.canvasZoom + d20.engine.currentCanvasOffset[0] - d20.engine.paddingOffset[0] / d20.engine.canvasZoom)
						, r = Math.floor(i / d20.engine.canvasZoom + d20.engine.currentCanvasOffset[1] - d20.engine.paddingOffset[1] / d20.engine.canvasZoom);
					if (!d20.engine.leftMouseIsDown || "fog-reveal" != d20.engine.mode && "fog-hide" != d20.engine.mode && "gridalign" != d20.engine.mode) {
						if (d20.engine.leftMouseIsDown && "measure" == d20.engine.mode) {
							if (d20.engine.measure.down[2] = o,
								d20.engine.measure.down[3] = r,
							0 != d20.engine.snapTo && !e.altKey)
								if ("square" == d20.Campaign.activePage().get("grid_type"))
									d20.engine.measure.down[2] = d20.engine.snapToIncrement(d20.engine.measure.down[2] + Math.floor(d20.engine.snapTo / 2), d20.engine.snapTo) - Math.floor(d20.engine.snapTo / 2),
										d20.engine.measure.down[3] = d20.engine.snapToIncrement(d20.engine.measure.down[3] + Math.floor(d20.engine.snapTo / 2), d20.engine.snapTo) - Math.floor(d20.engine.snapTo / 2);
								else {
									var s = d20.canvas_overlay.activeHexGrid.GetHexAt({
										X: d20.engine.measure.down[2],
										Y: d20.engine.measure.down[3]
									});
									if (!s)
										return;
									d20.engine.measure.down[3] = s.MidPoint.Y,
										d20.engine.measure.down[2] = s.MidPoint.X
								}
							var l = {
								x: d20.engine.measure.down[0],
								y: d20.engine.measure.down[1],
								to_x: d20.engine.measure.down[2],
								to_y: d20.engine.measure.down[3],
								player: window.currentPlayer.id,
								pageid: d20.Campaign.activePage().id,
								currentLayer: window.currentEditingLayer
								// BEGIN MOD
								,
								Ve: {
									mode: $selMeasureMode.val(),
									sticky: $cbSticky.prop("checked"),
									radius: {
										mode: $selRadMode.val()
									},
									cone: {
										arc: $iptConeWidth.val()
									},
									box: {
										mode: $selBoxMode.val(),
									},
									line: {
										mode: $selLineMode.val(),
										width: $iptLineWidth.val()
									}
								}
								// END MOD
							};
							E(l)
						} else if (d20.engine.leftMouseIsDown && "fxtools" == d20.engine.mode) {
							if (d20.engine.fx.current) {
								var c = (new Date).getTime();
								c - d20.engine.fx.lastMoveBroadcast > d20.engine.fx.MOVE_BROADCAST_FREQ ? (d20.fx.moveFx(d20.engine.fx.current, o, r),
									d20.engine.fx.lastMoveBroadcast = c) : d20.fx.moveFx(d20.engine.fx.current, o, r, !0)
							}
						} else if (d20.engine.leftMouseIsDown && "rect" == d20.engine.mode) {
							var u = (n + d20.engine.currentCanvasOffset[0] - d20.engine.paddingOffset[0] - d20.engine.drawshape.start[0]) / d20.engine.canvasZoom
								, d = (i + d20.engine.currentCanvasOffset[1] - d20.engine.paddingOffset[1] - d20.engine.drawshape.start[1]) / d20.engine.canvasZoom;
							0 != d20.engine.snapTo && e.shiftKey && (u = d20.engine.snapToIncrement(u, d20.engine.snapTo),
								d = d20.engine.snapToIncrement(d, d20.engine.snapTo));
							var h = d20.engine.drawshape.shape;
							h.width = u,
								h.height = d,
								d20.engine.renderTop()
						}
					} else
						d20.engine.fog.down[2] = o,
							d20.engine.fog.down[3] = r,
						0 != d20.engine.snapTo && "square" == d20.Campaign.activePage().get("grid_type") && ("gridalign" == d20.engine.mode ? e.shiftKey && (d20.engine.fog.down[2] = d20.engine.snapToIncrement(d20.engine.fog.down[2], d20.engine.snapTo),
							d20.engine.fog.down[3] = d20.engine.snapToIncrement(d20.engine.fog.down[3], d20.engine.snapTo)) : (e.shiftKey && !d20.Campaign.activePage().get("adv_fow_enabled") || !e.shiftKey && d20.Campaign.activePage().get("adv_fow_enabled")) && (d20.engine.fog.down[2] = d20.engine.snapToIncrement(d20.engine.fog.down[2], d20.engine.snapTo),
							d20.engine.fog.down[3] = d20.engine.snapToIncrement(d20.engine.fog.down[3], d20.engine.snapTo))),
							d20.engine.drawOverlays();
					if (d20.engine.pinging)
						(u = Math.abs(d20.engine.pinging.downx - n)) + (d = Math.abs(d20.engine.pinging.downy - i)) > 10 && (delete d20.engine.pings[window.currentPlayer.id],
							d20.engine.pinging = !1);
					if (d20.engine.pan.panning) {
						u = 2 * (n - d20.engine.pan.panXY[0]),
							d = 2 * (i - d20.engine.pan.panXY[1]);
						if (d20.engine.pan.lastPanDist += Math.abs(u) + Math.abs(d),
						d20.engine.pan.lastPanDist < 10)
							return;
						var p = d20.engine.pan.beginPos[0] - u
							, f = d20.engine.pan.beginPos[1] - d;
						a.stop().animate({
							scrollLeft: p,
							scrollTop: f
						}, {
							duration: 1500,
							easing: "easeOutExpo",
							queue: !1
						})
					}
				}
			};
			// END ROLL20 CODE

			if (UPPER_CANVAS_MOUSEMOVE) {
				d20plus.log("Enhancing mouse move");
				d20.engine.uppercanvas.removeEventListener("mousemove", UPPER_CANVAS_MOUSEMOVE);
				d20.engine.uppercanvas.addEventListener("mousemove", M);
			}
		},

		addLineCutterTool: () => {
			const $btnTextTool = $(`.choosetext`);

			const $btnSplitTool = $(`<li class="choosesplitter">✂️ Line Splitter</li>`).click(() => {
				d20plus.setMode("line_splitter");
			});

			$btnTextTool.after($btnSplitTool);
		},

		_tokenHover: null,
		_drawTokenHover: () => {
			$(`.Vetools-token-hover`).remove();
			if (!d20plus._tokenHover || !d20plus._tokenHover.text) return;

			const pt = d20plus._tokenHover.pt;
			const txt = unescape(d20plus._tokenHover.text);

			const scaleFact = (1 / d20.engine.canvasZoom);
			const xOffset = pt.x > (d20.engine.canvasWidth / 2) ? -300 * scaleFact : 0;

			$(`body`).append(`<div class="Vetools-token-hover" style="top: ${pt.y}px; left: ${pt.x + xOffset}px">${txt}</div>`);
		},
		addTokenHover: () => {
			// BEGIN ROLL20 CODE
			d20.engine.drawOverlaysTop = function(e) {
				e.globalCompositeOperation = "lighter";
				d20.fx.render(e);
				e.globalCompositeOperation = "source-over";
				d20.engine.redrawSightTokens(e);
				d20.engine.drawShadowMovements(e);
				d20.engine.drawMeasurements(e);
				d20.engine.drawPings(e);
				d20.engine.drawInProgressDrawings(e);

				// BEGIN MOD
				d20plus._drawTokenHover();
				// END MOD
			};
			// END ROLL20 CODE

			// store data for the rendering function to access
			d20.engine.canvas.on("mouse:move", (data, ...others) => {
				// enable hover from GM layer -> token layer
				let hoverTarget = data.target;
				if (data.e && window.currentEditingLayer === "gmlayer") {
					const cache = window.currentEditingLayer;
					window.currentEditingLayer = "objects";
					hoverTarget = d20.engine.canvas.findTarget(data.e, null, true);
					window.currentEditingLayer = cache;
				}

				if (data.e.shiftKey && hoverTarget && hoverTarget.model) {
					d20.engine.renderTop();
					const gmNotes = hoverTarget.model.get("gmnotes");
					const pt = d20.engine.canvas.getPointer(data.e);
					pt.x -= d20.engine.currentCanvasOffset[0];
					pt.y -= d20.engine.currentCanvasOffset[1];
					d20plus._tokenHover = {
						pt: pt,
						text: gmNotes,
						id: hoverTarget.model.id
					};
				} else {
					if (d20plus._tokenHover) d20.engine.renderTop();
					d20plus._tokenHover = null;
				}
			})
		},

		enhanceMarkdown: () => {
			const OUT_STRIKE = "<span style='text-decoration: line-through'>$1</span>";

			// BEGIN ROLL20 CODE
			window.Markdown.parse = function(e) {
					{
						var t = e
							, n = []
							, i = [];
						-1 != t.indexOf("\r\n") ? "\r\n" : -1 != t.indexOf("\n") ? "\n" : ""
					}
					return t = t.replace(/{{{([\s\S]*?)}}}/g, function(e) {
						return n.push(e.substring(3, e.length - 3)),
							"{{{}}}"
					}),
						t = t.replace(new RegExp("<pre>([\\s\\S]*?)</pre>","gi"), function(e) {
							return i.push(e.substring(5, e.length - 6)),
								"<pre></pre>"
						}),
						// BEGIN MOD
						t = t.replace(/~~(.*?)~~/g, OUT_STRIKE),
						// END MOD
						t = t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
						t = t.replace(/\*(.*?)\*/g, "<em>$1</em>"),
						t = t.replace(/``(.*?)``/g, "<code>$1</code>"),
						t = t.replace(/\[([^\]]+)\]\(([^)]+(\.png|\.gif|\.jpg|\.jpeg))\)/g, '<a href="$2"><img src="$2" alt="$1" /></a>'),
						t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>'),
						t = t.replace(new RegExp("<pre></pre>","g"), function() {
							return "<pre>" + i.shift() + "</pre>"
						}),
						t = t.replace(/{{{}}}/g, function() {
							return n.shift()
						})
				}
			// END ROLL20 CODE

			// after a short delay, replace any old content in the chat
			setTimeout(() => {
				$(`.message`).each(function () {
					$(this).html($(this).html().replace(/~~(.*?)~~/g, OUT_STRIKE))
				})
			}, 2500);
		},

		// JOURNAL UI //////////////////////////////////////////////////////////////////////////////////////////////////////

		lastClickedFolderId: null,

		addJournalCommands: () => {
			// Create new Journal commands
			// stash the folder ID of the last folder clicked
			$("#journalfolderroot").on("contextmenu", ".dd-content", function (e) {
				if ($(this).parent().hasClass("dd-folder")) {
					const lastClicked = $(this).parent();
					d20plus.lastClickedFolderId = lastClicked.attr("data-globalfolderid");
				}


				if ($(this).parent().hasClass("character")) {
					$(`.Vetools-make-tokenactions`).show();
				} else {
					$(`.Vetools-make-tokenactions`).hide();
				}
			});

			var first = $("#journalitemmenu ul li").first();
			// "Make Tokenactions" option
			first.after(`<li class="Vetools-make-tokenactions" data-action-type="additem">Make Tokenactions</li>`);
			$("#journalitemmenu ul").on(window.mousedowntype, "li[data-action-type=additem]", function () {
				var id = $currentItemTarget.attr("data-itemid");
				var character = d20.Campaign.characters.get(id);
				d20plus.log("Making Token Actions..");
				if (character) {
					var npc = character.attribs.find(function (a) {
						return a.get("name").toLowerCase() == "npc";
					});
					var isNPC = npc ? parseInt(npc.get("current")) : 0;
					if (isNPC) {
						//Npc specific tokenactions
						character.abilities.create({
							name: "Perception",
							istokenaction: true,
							action: d20plus.actionMacroPerception
						});
						character.abilities.create({
							name: "DR/Immunities",
							istokenaction: true,
							action: d20plus.actionMacroDrImmunities
						});
						character.abilities.create({
							name: "Stats",
							istokenaction: true,
							action: d20plus.actionMacroStats
						});
						character.abilities.create({
							name: "Saves",
							istokenaction: true,
							action: d20plus.actionMacroSaves
						});
						character.abilities.create({
							name: "Skill-Check",
							istokenaction: true,
							action: d20plus.actionMacroSkillCheck
						});
						character.abilities.create({
							name: "Ability-Check",
							istokenaction: true,
							action: d20plus.actionMacroAbilityCheck
						});
					} else {
						//player specific tokenactions
						//@{selected|repeating_attack_$0_atkname}
						character.abilities.create({
							name: "Attack 1",
							istokenaction: true,
							action: "%{selected|repeating_attack_$0_attack}"
						});
						character.abilities.create({
							name: "Attack 2",
							istokenaction: true,
							action: "%{selected|repeating_attack_$1_attack}"
						});
						character.abilities.create({
							name: "Attack 3",
							istokenaction: true,
							action: "%{selected|repeating_attack_$2_attack}"
						});
						character.abilities.create({
							name: "Tool 1",
							istokenaction: true,
							action: "%{selected|repeating_tool_$0_tool}"
						});
						//" + character.get("name") + "
						character.abilities.create({
							name: "Whisper GM",
							istokenaction: true,
							action: "/w gm ?{Message to whisper the GM?}"
						});
						character.abilities.create({
							name: "Favorite Spells",
							istokenaction: true,
							action: "/w @{character_name} &{template:npcaction} {{rname=Favorite Spells}} {{description=Favorite Spells are the first spells in each level of your spellbook.\n\r[Cantrip](~selected|repeating_spell-cantrip_$0_spell)\n[1st Level](~selected|repeating_spell-1_$0_spell)\n\r[2nd Level](~selected|repeating_spell-2_$0_spell)\n\r[3rd Level](~selected|repeating_spell-3_$0_spell)\n\r[4th Level](~selected|repeating_spell-4_$0_spell)\n\r[5th Level](~selected|repeating_spell-5_$0_spell)}}"
						});
						character.abilities.create({
							name: "Dual Attack",
							istokenaction: false,
							action: "%{selected|repeating_attack_$0_attack}\n\r%{selected|repeating_attack_$0_attack}"
						});
						character.abilities.create({
							name: "Saves",
							istokenaction: true,
							action: "@{selected|wtype}&{template:simple} @{selected|rtype}?{Save|Strength, +@{selected|strength_save_bonus}@{selected|pbd_safe}]]&#125;&#125; {{rname=Strength Save&#125;&#125 {{mod=@{selected|strength_save_bonus}&#125;&#125; {{r1=[[@{selected|d20}+@{selected|strength_save_bonus}@{selected|pbd_safe}]]&#125;&#125; |Dexterity, +@{selected|dexterity_save_bonus}@{selected|pbd_safe}]]&#125;&#125; {{rname=Dexterity Save&#125;&#125 {{mod=@{selected|dexterity_save_bonus}&#125;&#125; {{r1=[[@{selected|d20}+@{selected|dexterity_save_bonus}@{selected|pbd_safe}]]&#125;&#125; |Constitution, +@{selected|constitution_save_bonus}@{selected|pbd_safe}]]&#125;&#125; {{rname=Constitution Save&#125;&#125 {{mod=@{selected|constitution_save_bonus}&#125;&#125; {{r1=[[@{selected|d20}+@{selected|constitution_save_bonus}@{selected|pbd_safe}]]&#125;&#125; |Intelligence, +@{selected|intelligence_save_bonus}@{selected|pbd_safe}]]&#125;&#125; {{rname=Intelligence Save&#125;&#125 {{mod=@{selected|intelligence_save_bonus}&#125;&#125; {{r1=[[@{selected|d20}+@{selected|intelligence_save_bonus}@{selected|pbd_safe}]]&#125;&#125; |Wisdom, +@{selected|wisdom_save_bonus}@{selected|pbd_safe}]]&#125;&#125; {{rname=Wisdom Save&#125;&#125 {{mod=@{selected|wisdom_save_bonus}&#125;&#125; {{r1=[[@{selected|d20}+@{selected|wisdom_save_bonus}@{selected|pbd_safe}]]&#125;&#125; |Charisma, +@{selected|charisma_save_bonus}@{selected|pbd_safe}]]&#125;&#125; {{rname=Charisma Save&#125;&#125 {{mod=@{selected|charisma_save_bonus}&#125;&#125; {{r1=[[@{selected|d20}+@{selected|charisma_save_bonus}@{selected|pbd_safe}]]&#125;&#125;}@{selected|global_save_mod}@{selected|charname_output"
						});
						character.abilities.create({
							name: "Skill-Check",
							istokenaction: true,
							action: "@{selected|wtype}&{template:simple} @{selected|rtype}?{Ability|Acrobatics, +@{selected|acrobatics_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=Acrobatics&#125;&#125; {{mod=@{selected|acrobatics_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|acrobatics_bonus}@{selected|pbd_safe} ]]&#125;&#125; |Animal Handling, +@{selected|animal_handling_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=Animal Handling&#125;&#125; {{mod=@{selected|animal_handling_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|animal_handling_bonus}@{selected|pbd_safe} ]]&#125;&#125; |Arcana, +@{selected|arcana_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=Arcana&#125;&#125; {{mod=@{selected|arcana_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|arcana_bonus}@{selected|pbd_safe} ]]&#125;&#125; |Athletics, +@{selected|athletics_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=Athletics&#125;&#125; {{mod=@{selected|athletics_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|athletics_bonus}@{selected|pbd_safe} ]]&#125;&#125; |Deception, +@{selected|deception_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=Deception&#125;&#125; {{mod=@{selected|deception_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|deception_bonus}@{selected|pbd_safe} ]]&#125;&#125; |History, +@{selected|history_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=History&#125;&#125; {{mod=@{selected|history_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|history_bonus}@{selected|pbd_safe} ]]&#125;&#125; |Insight, +@{selected|insight_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=Insight&#125;&#125; {{mod=@{selected|insight_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|insight_bonus}@{selected|pbd_safe} ]]&#125;&#125; |Intimidation, +@{selected|intimidation_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=Intimidation&#125;&#125; {{mod=@{selected|intimidation_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|intimidation_bonus}@{selected|pbd_safe} ]]&#125;&#125; |Investigation, +@{selected|investigation_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=Investigation&#125;&#125; {{mod=@{selected|investigation_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|investigation_bonus}@{selected|pbd_safe} ]]&#125;&#125; |Medicine, +@{selected|medicine_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=Medicine&#125;&#125; {{mod=@{selected|medicine_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|medicine_bonus}@{selected|pbd_safe} ]]&#125;&#125; |Nature, +@{selected|nature_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=Nature&#125;&#125; {{mod=@{selected|nature_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|nature_bonus}@{selected|pbd_safe} ]]&#125;&#125; |Perception, +@{selected|perception_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=Perception&#125;&#125; {{mod=@{selected|perception_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|perception_bonus}@{selected|pbd_safe} ]]&#125;&#125; |Performance, +@{selected|performance_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=Performance&#125;&#125; {{mod=@{selected|performance_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|performance_bonus}@{selected|pbd_safe} ]]&#125;&#125; |Persuasion, +@{selected|persuasion_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=Persuasion&#125;&#125; {{mod=@{selected|persuasion_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|persuasion_bonus}@{selected|pbd_safe} ]]&#125;&#125; |Religion, +@{selected|religion_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=Religion&#125;&#125; {{mod=@{selected|religion_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|religion_bonus}@{selected|pbd_safe} ]]&#125;&#125; |Sleight of Hand, +@{selected|sleight_of_hand_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=Sleight of Hand&#125;&#125; {{mod=@{selected|sleight_of_hand_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|sleight_of_hand_bonus}@{selected|pbd_safe} ]]&#125;&#125; |Stealth, +@{selected|stealth_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=Stealth&#125;&#125; {{mod=@{selected|stealth_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|stealth_bonus}@{selected|pbd_safe} ]]&#125;&#125; |Survival, +@{selected|survival_bonus}@{selected|pbd_safe} ]]&#125;&#125; {{rname=Survival&#125;&#125; {{mod=@{selected|survival_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|survival_bonus}@{selected|pbd_safe} ]]&#125;&#125; |Strength, +@{selected|strength_mod}@{selected|jack_attr}[STR]]]&#125;&#125; {{rname=Strength&#125;&#125; {{mod=@{selected|strength_mod}@{selected|jack_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|strength_mod}@{selected|jack_attr}[STR]]]&#125;&#125; |Dexterity, +@{selected|dexterity_mod}@{selected|jack_attr}[DEX]]]&#125;&#125; {{rname=Dexterity&#125;&#125; {{mod=@{selected|dexterity_mod}@{selected|jack_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|dexterity_mod}@{selected|jack_attr}[DEX]]]&#125;&#125; |Constitution, +@{selected|constitution_mod}@{selected|jack_attr}[CON]]]&#125;&#125; {{rname=Constitution&#125;&#125; {{mod=@{selected|constitution_mod}@{selected|jack_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|constitution_mod}@{selected|jack_attr}[CON]]]&#125;&#125; |Intelligence, +@{selected|intelligence_mod}@{selected|jack_attr}[INT]]]&#125;&#125; {{rname=Intelligence&#125;&#125; {{mod=@{selected|intelligence_mod}@{selected|jack_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|intelligence_mod}@{selected|jack_attr}[INT]]]&#125;&#125; |Wisdom, +@{selected|wisdom_mod}@{selected|jack_attr}[WIS]]]&#125;&#125; {{rname=Wisdom&#125;&#125; {{mod=@{selected|wisdom_mod}@{selected|jack_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|wisdom_mod}@{selected|jack_attr}[WIS]]]&#125;&#125; |Charisma, +@{selected|charisma_mod}@{selected|jack_attr}[CHA]]]&#125;&#125; {{rname=Charisma&#125;&#125; {{mod=@{selected|charisma_mod}@{selected|jack_bonus}&#125;&#125; {{r1=[[ @{selected|d20} + @{selected|charisma_mod}@{selected|jack_attr}[CHA]]]&#125;&#125; } @{selected|global_skill_mod} @{selected|charname_output}"
						});
					}
					//for everyone
					character.abilities.create({
						name: "Initiative",
						istokenaction: true,
						action: d20plus.actionMacroInit
					});
				}
			});

			// "Duplicate" option
			first.after("<li data-action-type=\"cloneitem\">Duplicate</li>");
			first.after("<li style=\"height: 10px;\">&nbsp;</li>");
			$("#journalitemmenu ul").on(window.mousedowntype, "li[data-action-type=cloneitem]", function () {
				var id = $currentItemTarget.attr("data-itemid");
				var character = d20.Campaign.characters.get(id);
				var handout = d20.Campaign.handouts.get(id);
				d20plus.log("Duplicating..");
				if (character) {
					character.editview.render();
					character.editview.$el.find("button.duplicate").trigger("click");
				}
				if (handout) {
					handout.view.render();
					var json = handout.toJSON();
					delete json.id;
					json.name = "Copy of " + json.name;
					handout.collection.create(json, {
						success: function (h) {
							handout._getLatestBlob("gmnotes", function (gmnotes) {
								h.updateBlobs({gmnotes: gmnotes});
							});
							handout._getLatestBlob("notes", function (notes) {
								h.updateBlobs({notes: notes});
							});
						}
					});
				}
			});

			// New command on FOLDERS
			var last = $("#journalmenu ul li").last();
			last.after("<li style=\"background-color: #FA5050; color: white;\" data-action-type=\"fulldelete\">Delete Folder + Contents</li>");
			$("#journalmenu ul").on(window.mousedowntype, "li[data-action-type=fulldelete]", function () {
				d20plus.importer.recursiveRemoveDirById(d20plus.lastClickedFolderId, true);
				d20plus.lastClickedFolderId = null;
				$("#journalmenu").hide();
			});
		},

		// CSS /////////////////////////////////////////////////////////////////////////////////////////////////////////////
		baseCssRules: [
			// generic
			{
				s: ".display-inline-block",
				r: "display: inline-block;"
			},
			// page view enhancement
			{
				s: "#page-toolbar",
				r: "height: calc(90vh - 40px);"
			},
			{
				s: "#page-toolbar .container",
				r: "height: 100%; white-space: normal;"
			},
			{
				s: "#page-toolbar .pages .availablepage",
				r: "width: 100px; height: 100px;"
			},
			{
				s: "#page-toolbar .pages .availablepage img.pagethumb",
				r: "max-width: 60px; max-height: 60px;"
			},
			{
				s: "#page-toolbar .pages .availablepage span",
				r: "bottom: 1px;"
			},
			// search
			{
				s: ".Vetoolsresult",
				r: "background: #ff8080;"
			},
			// config editor
			{
				s: "div.config-table-wrapper",
				r: "min-height: 200px; width: 100%; height: 100%; max-height: 460px; overflow-y: auto; transform: translateZ(0);"
			},
			{
				s: "table.config-table",
				r: "width: 100%; table-layout: fixed;"
			},
			{
				s: "table.config-table tbody tr:nth-child(odd)",
				r: "background-color: #f8f8f8;"
			},
			{
				s: "table.config-table tbody td > *",
				r: "vertical-align: middle; margin: 0;"
			},
			{
				s: ".config-name",
				r: "display: inline-block; line-height: 35px; width: 100%;"
			},
			// tool list
			{
				s: ".tools-list",
				r: "max-height: 70vh;"
			},
			{
				s: ".tool-row",
				r: "min-height: 40px; display: flex; flex-direction: row; align-items: center;"
			},
			{
				s: ".tool-row:nth-child(odd)",
				r: "background-color: #f0f0f0;"
			},
			{
				s: ".tool-row > *",
				r: "flex-shrink: 0;"
			},
			// warning overlay
			{
				s: ".temp-warning",
				r: "position: fixed; top: 12px; left: calc(50vw - 200px); z-index: 10000; width: 320px; background: transparent; color: red; font-weight: bold; font-size: 150%; font-variant: small-caps; border: 1px solid red; padding: 4px; text-align: center; border-radius: 4px;"
			},
			// GM hover text
			{
				s: ".Vetools-token-hover",
				r: "pointer-events: none; position: fixed; z-index: 100000; background: white; padding: 5px 5px 0 5px; border-radius: 5px;     border: 1px solid #ccc; max-width: 450px;"
			},
			// drawing tools bar
			{
				s: "#drawingtools.line_splitter .currentselection:after",
				r: "content: '✂️';"
			}
		],

		baseCssRulesPlayer: [
			{
				s: ".player-hidden",
				r: "display: none !important;"
			}
		],

		cssRules: [], // other scripts should populate this

		// HTML AND TEMPLATES //////////////////////////////////////////////////////////////////////////////////////////////

		addHtmlHeader: () => {
			d20plus.log("Add HTML");
			const $body = $("body");

			const $wrpSettings = $(`<div id="betteR20-settings"/>`);
			$("#mysettings > .content").children("hr").first().before($wrpSettings);

			$wrpSettings.append(d20plus.settingsHtmlHeader);
			$body.append(d20plus.configEditorHTML);
			if (window.is_gm) {
				$(`#imagedialog`).find(`.searchbox`).find(`.tabcontainer`).first().after(d20plus.artTabHtml);
				$(`a#button-add-external-art`).on(window.mousedowntype, d20plus.art.button);

				$body.append(d20plus.addArtHTML);
				$body.append(d20plus.addArtMassAdderHTML);
				$body.append(d20plus.toolsListHtml);
				$("#d20plus-artfolder").dialog({
					autoOpen: false,
					resizable: true,
					width: 800,
					height: 400,
				});
				$("#d20plus-artmassadd").dialog({
					autoOpen: false,
					resizable: true,
					width: 800,
					height: 400,
				});
			}
			const $cfgEditor = $("#d20plus-configeditor");
			$cfgEditor.dialog({
				autoOpen: false,
				resizable: true,
				width: 800,
				height: 650,
			});
			$cfgEditor.parent().append(d20plus.configEditorButtonBarHTML);

			// shared GM/player conent
			// quick search box
			const $iptSearch = $(`<input id="player-search" class="ui-autocomplete-input" autocomplete="off" placeholder="Quick search by name...">`);
			const $wrprResults = $(`<div id="player-search-results" class="content searchbox"/>`);

			if (window.is_gm) {
				$iptSearch.css("width", "calc(100% - 5px)");
				const $addPoint = $("#journal").find("button.btn.superadd");
				$addPoint.after($wrprResults);
				$addPoint.after(`<br>`);
				$addPoint.after($iptSearch);
				$addPoint.after(`<br><br>`);
			} else {
				const $wrprControls = $(`<div class="content searchbox" id="search-wrp-controls"/>`);
				$(`#journal .content`).before($wrprControls).before($wrprResults);
				$iptSearch.css("max-width", "calc(100% - 140px)");
				$wrprControls.append($iptSearch);
			}
			d20plus.initQuickSearch($iptSearch, $wrprResults);
		},

		addHtmlFooter: () => {
			const $wrpSettings = $(`#betteR20-settings`);
			$wrpSettings.append(d20plus.settingsHtmlPtFooter);

			$("#mysettings > .content a#button-edit-config").on(window.mousedowntype, d20plus.openConfigEditor);
			d20plus.addTools();
		},

		settingsHtmlPtFooter:
			`<p>
			<a class="btn " href="#" id="button-edit-config" style="margin-top: 3px;">Edit Config</a>
			</p>
			<p>
			For help, advice, and updates, <a href="https://discord.gg/AzyBjtQ" target="_blank" style="color: #08c;">join our Discord!</a>
			</p>
			<p>
			<a class="btn player-hidden" href="#" id="button-view-tools" style="margin-top: 3px;">Open Tools List</a>
			</p>
			<style id="dynamicStyle"></style>
		`,

		artTabHtml: `
	<p><a class="btn" href="#" id="button-add-external-art">Manage External Art</a></p>
	`,

		addArtHTML: `
	<div id="d20plus-artfolder" title="External Art" style="position: relative">
	<p>Add external images by URL. Any direct link to an image should work.</p>
	<p>
	<input placeholder="Name*" id="art-list-add-name">
	<input placeholder="URL*" id="art-list-add-url">
	<a class="btn" href="#" id="art-list-add-btn">Add URL</a>
	<a class="btn" href="#" id="art-list-multi-add-btn">Add Multiple URLs...</a>
	<p/>
	<hr>
	<div id="art-list-container">
	<input class="search" autocomplete="off" placeholder="Search list..." style="width: 100%;">
	<br>
	<p>
		<span style="display: inline-block; width: 40%; font-weight: bold;">Name</span>
		<span style="display: inline-block; font-weight: bold;">URL</span>
	</p>
	<ul class="list artlist" style="max-height: 600px; overflow-y: scroll; display: block; margin: 0;"></ul>
	</div>
	</div>`,

		addArtMassAdderHTML: `
	<div id="d20plus-artmassadd" title="Mass Add Art URLs">
	<p>One entry per line; entry format: <b>[name]---[URL (direct link to image)]</b> <a class="btn" href="#" id="art-list-multi-add-btn-submit">Add URLs</a></p>
	<p><textarea id="art-list-multi-add-area" style="width: 100%; height: 100%; min-height: 500px;" placeholder="My Image---http://pics.me/img1.png"></textarea></p>
	</div>`,

		artListHTML: `
	<div id="Vetoolsresults">
	<ol class="dd-list" id="image-search-none"><div class="alert white">No results found in 5etools for those keywords.</div></ol>
	
	<ol class="dd-list" id="image-search-has-results">
		<li class="dd-item dd-folder Vetoolsresult">
			<div class="dd-content">
				<div class="folder-title">From 5etools</div>
			</div>
	
			<ol class="dd-list Vetoolsresultfolder" id="custom-art-results"></ol>
		</li>
	</ol>
	</div>`,

		configEditorHTML: `
	<div id="d20plus-configeditor" title="Config Editor" style="position: relative">
	<!-- populate with js -->
	</div>`,

		configEditorButtonBarHTML: `
	<div class="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix">
	<div class="ui-dialog-buttonset">
		<button type="button" id="configsave" alt="Save" title="Save Config" class="btn" role="button" aria-disabled="false">
			<span>Save</span>
		</button>
	</div>
	</div>
	`,

		toolsListHtml: `
		<div id="d20-tools-list" title="Tools List" style="position: relative">
		<div class="tools-list">
		<!-- populate with js -->
		</div>
		</div>
		`,

		template_TokenEditor: `
	 <script id='tmpl_tokeneditor' type='text/html'>
      <div class='dialog largedialog tokeneditor' style='display: block;'>
        <ul class='nav nav-tabs'>
          <li class='active'>
            <a data-tab='basic' href='javascript:void(0);'>Basic</a>
          </li>
          <li>
            <a data-tab='advanced' href='javascript:void(0);'>Advanced</a>
          </li>
        </ul>
        <div class='tab-content'>
          <div class='basic tab-pane'>
            <div style='float: left; width: 300px;'>
              <div style='float: right; margin-right: 85px; font-size: 1.2em; position: relative; top: -4px; cursor: help;'>
                <a class='showtip pictos' title="You can choose to have the token represent a Character from the Journal. If you do, the token's name, controlling players, and bar values will be based on the Character. Most times you'll just leave this set to None/Generic.">?</a>
              </div>
              <label>Represents Character</label>
              <select class='represents'>
                <option value=''>None/Generic Token</option>
                <$ _.each(window.Campaign.activeCharacters(), function(char) { $>
                <option value="<$!char.id$>"><$!char.get("name")$></option>
                <$ }); $>
              </select>
              <div class='clear'></div>
              <div style='float: right; margin-right: 75px;'>
                <label>
                  <input class='showname' type='checkbox' value='1'>
                  Show nameplate?
                </label>
              </div>
              <label>Name</label>
              <input class='name' style='width: 210px;' type='text'>
              <div class='clear'></div>
              <label>Controlled By</label>
              <$ if(this.character) { $>
              <p>(Determined by Character settings)</p>
              <$ } else { $>
              <select class='controlledby chosen' multiple='true'>
                <option value='all'>All Players</option>
                <$ window.Campaign.players.each(function(player) { $>
                <option value="<$!player.id$>"><$!player.get("displayname")$></option>
                <$ }); $>
              </select>
              <$ } $>
              <div class='clear' style='height: 10px;'></div>
              <label>
                Tint Color
              </label>
              <input class='tint_color colorpicker' type='text'>
              <div class='clear'></div>
            </div>
            <div style='float: left; width: 300px;'>
              <label>
                <span class='bar_color_indicator' style='background-color: <$!window.Campaign.get('bar1_color')$>'></span>
                Bar 1
              </label>
              <div class='clear' style='height: 1px;'></div>
              <div class='inlineinputs' style='margin-top: 5px; margin-bottom: 5px;'>
                <input class='bar1_value' type='text'>
                /
                <input class='bar1_max' type='text'>
                <$ if(this.character) { $>
                <div style='float: right;'>
                  <select class='bar1_link' style='width: 125px;'>
                    <option value=''>None</option>
                    <$ _.each(this.tokensettingsview.availAttribs(), function(attrib) { $>
                    <option value="<$!attrib.id$>"><$!attrib.name$>
                    <$ }); $>
                  </select>
                  <a class='pictos showtip' style='font-size: 1.2em; position: relative; top: -5px; margin-left: 10px; cursor: help;' title='You can choose an Attribute from the Character this token represents. The values for this bar will be synced to the values of that Attribute.'>?</a>
                </div>
                <$ } $>
              </div>
              <span style='color: #888;'>(Leave blank for no bar)</span>
              <div class='clear'></div>
              <label>
                <span class='bar_color_indicator' style='background-color: <$!window.Campaign.get('bar2_color')$>'></span>
                Bar 2
              </label>
              <div class='inlineinputs' style='margin-top: 5px; margin-bottom: 5px;'>
                <input class='bar2_value' type='text'>
                /
                <input class='bar2_max' type='text'>
                <$ if(this.character) { $>
                <div style='float: right; margin-right: 30px;'>
                  <select class='bar2_link' style='width: 125px;'>
                    <option value=''>None</option>
                    <$ _.each(this.tokensettingsview.availAttribs(), function(attrib) { $>
                    <option value="<$!attrib.id$>"><$!attrib.name$>
                    <$ }); $>
                  </select>
                </div>
                <$ } $>
              </div>
              <span style='color: #888;'>(Leave blank for no bar)</span>
              <div class='clear'></div>
              <label>
                <span class='bar_color_indicator' style='background-color: <$!window.Campaign.get('bar3_color')$>'></span>
                Bar 3
              </label>
              <div class='inlineinputs' style='margin-top: 5px; margin-bottom: 5px;'>
                <input class='bar3_value' type='text'>
                /
                <input class='bar3_max' type='text'>
                <$ if(this.character) { $>
                <div style='float: right; margin-right: 30px;'>
                  <select class='bar3_link' style='width: 125px;'>
                    <option value=''>None</option>
                    <$ _.each(this.tokensettingsview.availAttribs(), function(attrib) { $>
                    <option value="<$!attrib.id$>"><$!attrib.name$>
                    <$ }); $>
                  </select>
                </div>
                <$ } $>
              </div>
              <span style='color: #888;'>(Leave blank for no bar)</span>
              <div class='clear' style='height: 10px;'></div>
              <div style='float: left; width: 130px;'>
                <div style='float: right;'>
                  <label>
                    <input class='aura1_square' type='checkbox'>
                    Square
                  </label>
                </div>
                <label>
                  Aura 1
                </label>
                <div class='inlineinputs' style='margin-top: 5px;'>
                  <input class='aura1_radius' type='text'>
                  <$!window.Campaign.activePage().get("scale_units")$>.
                  <input class='aura1_color colorpicker' type='text'>
                </div>
              </div>
              <div style='float: left; width: 130px; margin-left: 20px;'>
                <div style='float: right;'>
                  <label>
                    <input class='aura2_square' type='checkbox'>
                    Square
                  </label>
                </div>
                <label>
                  Aura 2
                </label>
                <div class='inlineinputs' style='margin-top: 5px;'>
                  <input class='aura2_radius' type='text'>
                  <$!window.Campaign.activePage().get("scale_units")$>.
                  <input class='aura2_color colorpicker' type='text'>
                </div>
              </div>
              <div class='clear'></div>
            </div>
            <div class='clear'></div>
            <hr>
            <h4>
              GM Notes
              <span style='font-weight: regular; font-size: 0.9em;'>(Only visible to GMs)</span>
            </h4>
            <textarea class='gmnotes'></textarea>
            <div class='clear'></div>
            <label>&nbsp;</label>
          </div>
          <div class='advanced tab-pane'>
            <div class='row-fluid'>
              <div class='span6'>
                <h4>Player Permissions</h4>
                <div style='margin-left: 5px;'>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Name</label>
                    <label>
                      <input class='showplayers_name' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_name' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 5px;'></div>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Bar 1</label>
                    <label>
                      <input class='showplayers_bar1' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_bar1' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 5px;'></div>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Bar 2</label>
                    <label>
                      <input class='showplayers_bar2' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_bar2' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 5px;'></div>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Bar 3</label>
                    <label>
                      <input class='showplayers_bar3' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_bar3' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 5px;'></div>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Aura 1</label>
                    <label>
                      <input class='showplayers_aura1' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_aura1' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 5px;'></div>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Aura 2</label>
                    <label>
                      <input class='showplayers_aura2' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_aura2' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 10px;'></div>
                  <small style='text-align: left; font-size: 0.9em;'>
                    See: All Players can view
                    <br>
                    Edit: Controlling players can view and change
                  </small>
                </div>
                <div class='clear'></div>
              </div>
              <div class='span6'>
                <h4>Emits Light</h4>
                <div class='inlineinputs' style='margin-top: 5px; margin-bottom: 5px;'>
                  <input class='light_radius' type='text'>
                  <$!window.Campaign.activePage().get("scale_units")$>.
                  <input class='light_dimradius' type='text'>
                  <$!window.Campaign.activePage().get("scale_units")$>.
                  <input class='light_angle' placeholder='360' type='text'>
                  <span style='font-size: 2.0em;'>&deg;</span>
                </div>
                <span style='color: #888; padding-left: 5px;'>Light Radius / (optional) Start of Dim / Angle</span>
                <div class='inlineinputs' style='margin-top: 5px;'>
                  <label style='margin-left: 7px;'>
                    <input class='light_otherplayers' type='checkbox'>
                    All Players See Light
                  </label>
                </div>
                <div class='inlineinputs' style='margin-top: 2px;'>
                  <label style='margin-left: 7px;'>
                    <input class='light_hassight' type='checkbox'>
                    Has Sight
                  </label>
                  <span style="margin-left: 9px; margin-right: 28px;">/</span>
                  Angle:
                  <input class='light_losangle' placeholder='360' type='text'>
                  <span style='font-size: 2.0em;'>&deg;</span>
                </div>
                <div class='inlineinputs' style='margin-left: 90px; margin-top: 5px;'>
                  <span style="margin-left: 8px; margin-right: 12px;">/</span>
                  Multiplyer:
                  <input class='light_multiplier' placeholder='1.0' style='margin-right: 10px;' type='text'>x</input>
                </div>
                <h4>Advanced Fog of War</h4>
                <div class='inlineinputs' style='margin-top: 5px; margin-bottom: 5px;'>
                  <input class='advfow_viewdistance' type='text'>
                  <$!window.Campaign.activePage().get("scale_units")$>.
                </div>
                <span style='color: #888; padding-left: 5px;'>View Distance</span>
                <!-- %h4 -->
                <!-- Token Actions -->
                <!-- %a.pictos.showtip(style="margin-left: 15px; cursor: help; font-size: 1.1em; position: relative; top: -2px;" title="Choose from Macros and Abilities of linked Character to show when token is selected") ? -->
                <!-- %p -->
                <!-- %strong Add New Token Action: -->
                <!-- %br -->
                <!-- %select.chosen(placeholder="Choose from the list...") -->
                <!-- %option(value="") Choose from the list... -->
                <!-- <$ if(this.character) { $> -->
                <!-- <optgroup label="Abilities"> -->
                <!-- <$ this.character.abilities.each(function(abil) { $> -->
                <!-- <option value="ability|<$!abil.get('id')$>"><$!abil.get('name')$></option> -->
                <!-- <$ }); $> -->
                <!-- </optgroup> -->
                <!-- <$ } $> -->
              </div>
            </div>
          </div>
        </div>
      </div>
	</script>
	`,

		template_pageSettings: `
	<script id="tmpl_pagesettings" type="text/html">
		  <label style='padding-top: 4px;'>
			<strong>Page Size</strong>
		  </label>
		  <input type="number" class="width" style="width: 50px;" value="<$!this.model.get("width")$>" />
		  un. by
		  <input type="number" class="height" style="width: 50px; margin-left: 5px;" value="<$!this.model.get("height")$>" />
		  un.
		  <small style='display: block; font-size: 0.9em; margin-left: 110px;'>width by height, 1 unit = 70 pixels</small>
		  <div class='clear' style='height: 15px;'></div>
		  <label style='margin-left: 55px; position: relative; top: 6px;'><strong>Scale:</strong> 1 unit =</label>
		  <input type="number" class="scale_number" style="width: 35px;" value="<$!this.model.get("scale_number")$>" />
		  <select class='scale_units' style='width: 50px; position: relative; top: 2px;'>
			<option value='ft'>ft.</option>
			<option value='m'>m.</option>
			<option value='km'>km.</option>
			<option value='mi'>mi.</option>
			<option value='in'>in.</option>
			<option value='cm'>cm.</option>
			<option value='un'>un.</option>
			<option value='hex'>hex</option>
			<option value='sq.'>sq.</option>
		  </select>
		  <div class='clear' style='height: 15px;'></div>
		  <label>
			<strong>Background</strong>
		  </label>
		  <input class='pagebackground' type='text'>
		  <hr>
		  <label style='position: relative; top: 8px;'>
			<strong>Grid</strong>
		  </label>
		  <label class='checkbox'>
			<input class='gridenabled' type='checkbox' value='1'>
			Enabled, Size:
		  </label>
		  <input type="number" class="snappingincrement" style="width: 35px;" value="<$!this.model.get("snapping_increment")$>" /> units
		  <div class='clear' style='height: 7px;'></div>
		  <label style='margin-left: 55px; position: relative; top: 4px;'>
			<a class='showtip pictos' title='Type of formula to use for calculating distances when using the measurement tool. Note: does not apply to Hex grids.'>?</a>
			Diagonals
		  </label>
		  <select class='diagonaltype' style='width: 100px;'>
			<option value="foure" <$ if(this.model.get("diagonaltype") == "foure") { $>selected<$ } $> >D&D 4E Compatible (Default)</option>
			<option value="threefive" <$ if(this.model.get("diagonaltype") == "threefive") { $>selected<$ } $> >Pathfinder/3.5E Compatible</option>
			<option value="pythagorean" <$ if(this.model.get("diagonaltype") == "pythagorean") { $>selected<$ } $> >Euclidean</option>
			<option value="manhattan" <$ if(this.model.get("diagonaltype") == "manhattan") { $>selected<$ } $> >Manhattan</option>
		  </select>
		  <div class='clear' style='height: 7px;'></div>
		  <label style='margin-left: 55px; position: relative; top: 4px;'>Type</label>
		  <select class='gridtype' style='width: 100px;'>
			<option value="square" <$ if(this.model.get("grid_type") == "square") { $>selected<$ } $> >Square</option>
			<option value="hex" <$ if(this.model.get("grid_type") == "hex") { $>selected<$ } $> >Hex (V)</option>
			<option value="hexr" <$ if(this.model.get("grid_type") == "hexr") { $>selected<$ } $> >Hex (H)</option>
		  </select>
		  <div class='clear' style='height: 2px;'></div>
		  <label class='checkbox' style='margin-left: 130px;'>
			<input class='gridlabels' type='checkbox' value='1'>&nbsp; Show Labels (Hex Only)</input>
		  </label>
		  <div class='clear' style='height: 10px;'></div>
		  <label style='margin-left: 55px;'>Color</label>
		  <input class='gridcolor' type='text'>
		  <div class='clear' style='height: 7px;'></div>
		  <label style='margin-left: 55px;'>Opacity</label>
		  <div class='gridopacity'></div>
		  <div class='clear' style='height: 10px'></div>
		  <hr>
		  <label style='position: relative; top: -2px;'>
			<strong>Fog of War</strong>
		  </label>
		  <label class='checkbox'>
			<input class='darknessenabled' type='checkbox' value='1'>&nbsp; Enabled</input>
		  </label>
		  <hr>
		  <strong style="display: block;"><i>Requires a paid subscription or all players to use a betteR20 script</i></strong>
		  <label style='position: relative; top: 3px; width: 85px; padding-left: 15px;'>
			<strong>Advanced Fog of War</strong>
		  </label>
		  <label class='checkbox'>
			<input class='advancedfowenabled showtip' style='margin-top: 8px; margin-bottom: 8px;' type='checkbox' value='1'>&nbsp; Enabled</input>
		  </label>
		  <span class='no_grid' style='display: none;'>
			, Size:
			<input type="number" class="advancedfowgridsize" style="width: 30px;" value="<$!this.model.get("adv_fow_grid_size")$>" /> units
		  </span>
		  <br>
		  <label class='checkbox'>
			<input class='advancedfowshowgrid showtip' title='By default the Advanced Fog of War hides the map grid anywhere revealed but the player can no longer see because of Dynamic Lighting. This option makes the grid always visible.' type='checkbox' value='1'>&nbsp; Show Grid</input>
		  </label>
		  <br>
		  <label class='checkbox' style='margin-left: 110px;'>
			<input class='dimlightreveals showtip' title='By default the Advanced Fog of War will not be permanently revealed by Dynamic Lighting that is not bright. This option allows dim lighting to also reveal the fog.' type='checkbox' value='1'>&nbsp; Dim Light Reveals</input>
		  </label>
		  <br>
		  <br>
		  <label style='position: relative; top: -2px;'>
			<strong>Dynamic Lighting</strong>
		  </label>
		  <label class='checkbox'>
			<input class='lightingenabled showtip' type='checkbox' value='1'>&nbsp; Enabled</input>
		  </label>
		  <br>
		  <label class='checkbox'>
			<input class='lightenforcelos showtip' title="Player's line of sight set by what tokens they can control." type='checkbox' value='1'>&nbsp; Enforce Line of Sight</input>
		  </label>
		  <br>
		  <br>
		  <label class='checkbox' style='margin-left: 110px;'>
			<input class='lightingupdate' type='checkbox' value='1'>&nbsp; Only Update on Drop</input>
		  </label>
		  <br>
		  <label class='checkbox' style='margin-left: 110px;'>
			<input class='lightrestrictmove' title="Don't allow player tokens to move through Dynamic Lighting walls. Can be enabled even if lighting is not used." type='checkbox' value='1'>&nbsp; Restrict Movement</input>
		  </label>
		  <br>
		  <label class='checkbox' style='margin-left: 110px;'>
			<input class='lightglobalillum' title='Instead of darkness show light in all places players can see.' type='checkbox' value='1'>&nbsp; Global Illumination</input>
		  </label>
		  <hr>
		  <label style='font-weight: bold;'>GM Opacity</label>
		  <div class='fogopacity'></div>
		  <div class='clear'></div>
		  <hr>
		  <label style='font-weight: bold;'>Play on Load</label>
		  <select class='pagejukeboxtrigger' style='width: 180px;'></select>
		  <div class='clear'></div>
		  <hr>
		  <button class='delete btn btn-danger' style='float: right;'>
			Delete Page
		  </button>
		  <button class='archive btn'>
			Archive Page
		  </button>
		  <div class='clear'></div>
	</script>
	`,

		template_actionsMenu: `
	 <script id='tmpl_actions_menu' type='text/html'>
      <div class='actions_menu d20contextmenu'>
        <ul>
          <$ if(this.view && this.view.graphic.type == "image" && this.get("cardid") !== "") { $>
          <li class='head hasSub' data-action-type='takecard'>Take Card</li>
          <li class='head hasSub' data-action-type='flipcard'>Flip Card</li>
          <$ } $>
          <$ if(window.is_gm) { $>
          <$ if(this.view && this.get("isdrawing") === false && window.currentEditingLayer != "map") { $>
          <!-- BEGIN MOD -->
          <li class='head hasSub' data-action-type='rollinit'>Roll Initiative</li>
          <li class='head hasSub' data-action-type='rollsaves'>Roll Save</li>
          <!-- END MOD -->
          <li class='head hasSub' data-action-type='addturn'>Add Turn</li>
          <$ } $>
          <li class='head'>Edit</li>
          <$ if(this.view) { $>
          <li data-action-type='delete'>Delete</li>
          <li data-action-type='copy'>Copy</li>
          <$ } $>
          <li data-action-type='paste'>Paste</li>
          <li data-action-type='undo'>Undo</li>
          <$ if(this.view) { $>
          <li data-action-type='tofront'>To Front</li>
          <li data-action-type='toback'>To Back</li>
          <li class='head hasSub' data-menuname='advanced'>
            Advanced &raquo;
            <ul class='submenu' data-menuname='advanced'>
              <li data-action-type='group'>Group</li>
              <li data-action-type='ungroup'>Ungroup</li>
              <$ if(this.get("type") == "image") { $>
              <li class="<$ if (this && this.get("isdrawing")) { $>active<$ } $>" data-action-type="toggledrawing">Is Drawing</li>
              <li class="<$ if (this && this.get("fliph")) { $>active<$ } $>" data-action-type="togglefliph">Flip Horizontal</li>
              <li class="<$ if (this && this.get("flipv")) { $>active<$ } $>" data-action-type="toggleflipv">Flip Vertical</li>
              <li data-action-type='setdimensions'>Set Dimensions</li>
              <$ if(window.currentEditingLayer == "map") { $>
              <li data-action-type='aligntogrid'>Align to Grid</li>
              <$ } $>
              <$ } $>
            </ul>
          </li>
          <li class='head hasSub' data-menuname='positioning'>
            Layer &raquo;
            <ul class='submenu' data-menuname='positioning'>
              <li data-action-type="tolayer_map" class='<$ if(this && this.get("layer") == "map") { $>active<$ } $>'>Map Layer</li>
              <li data-action-type="tolayer_objects" class='<$ if(this && this.get("layer") == "objects") { $>active<$ } $>'>Token Layer</li>
              <li data-action-type="tolayer_gmlayer" class='<$ if(this && this.get("layer") == "gmlayer") { $>active<$ } $>'>GM Layer</li>
              <li data-action-type="tolayer_walls" class='<$ if(this && this.get("layer") == "walls") { $>active<$ } $>'>Lighting Layer (will not block LoS)</li>
            </ul>
          </li>
          <$ } $>
          <$ } $>
          <$ if(this.view && this.get("sides") !== "" && this.get("cardid") === "") { $>
          <li class='head hasSub' data-menuname='mutliside'>
            Multi-Sided &raquo;
            <ul class='submenu' data-menuname='multiside'>
              <li data-action-type='side_random'>Random Side</li>
              <li data-action-type='side_choose'>Choose Side</li>
              <li data-action-type='rollertokenresize'>Set Side Size</li>
            </ul>
          </li>
          <$ } $>
        </ul>
      </div>
    </script>
		`,

		template_charactereditor: `
 <script id='tmpl_charactereditor' type='text/html'>
      <div class='dialog largedialog charactereditor' style='display: block;'>
        <!-- %ul.nav.nav-tabs -->
        <!-- %li.active -->
        <!-- %a(href="javascript:void(0);" data-tab="bioinfo") Bio & Info -->
        <!-- %li -->
        <!-- %a(href="javascript:void(0);" data-tab="attributesabilities") Attributes & Abilities -->
        <div class='tab-content'>
          <div class='bioinfo tab-pane'>
            <div class='row-fluid'>
              <div class='span5'>
                <label>
                  <strong>Avatar</strong>
                </label>
                <$ if(true) { $>
                <div class="avatar dropbox <$! this.get("avatar") != "" ? "filled" : "" $>" style="width: 95%;">
                <div class="status"></div>
                <div class="inner">
                <$ if(this.get("avatar") == "") { $>
                <h4 style="padding-bottom: 0px; marigin-bottom: 0px; color: #777;">Drop a file<small>(JPG, PNG, GIF)</small></h4>
                <br /> or
                <button class="btn">Choose a file...</button>
                <input class="manual" type="file" />
                <$ } else { $>
                <img src="<$!this.get("avatar")$>" draggable="false" />
                <div class='remove'><a href='#'>Remove</a></div>
                <$ } $>
                </div>
                </div>
                <$ } else { $>
                <div class='avatar'>
                <$ if(this.get("avatar") != "") { $>
                <img src="<$!this.get("avatar")$>" draggable="false" />
                <$ } $>
                </div>
                <$ } $>
                <div class='clear'></div>
                <!-- BEGIN MOD -->
                <button class="btn character-image-by-url">Set Image from URL</button>
                <div class='clear'></div>
                <!-- END MOD -->
                <$ if (window.is_gm) { $>
                <label>
                  <strong>Default Token (Optional)</strong>
                </label>
                <div class="defaulttoken tokenslot <$! this.get("defaulttoken") !== "" ? "filled" : "" $> style="width: 95%;">
                <$ if(this.get("defaulttoken") !== "") { $>
                <img src="" draggable="false" />
                <div class="remove"><a href="#">Remove</a></div>
                <$ } else { $>
                <button class="btn">Use Selected Token</button>
                <small>Select a token on the tabletop to use as the Default Token</small>
                <$ } $>
                </div>
                <$ } $>
              </div>
              <div class='span7'>
                <label>
                  <strong>Name</strong>
                </label>
                <input class='name' type='text'>
                <div class='clear'></div>
                <$ if(window.is_gm) { $>
                <label>
                  <strong>In Player's Journals</strong>
                </label>
                <select class='inplayerjournals chosen' multiple='true' style='width: 100%;'>
                  <option value="all">All Players</option>
                  <$ window.Campaign.players.each(function(player) { $>
                  <option value="<$!player.id$>"><$!player.get("displayname")$></option>
                  <$ }); $>
                </select>
                <div class='clear'></div>
                <label>
                  <strong>Can Be Edited &amp; Controlled By</strong>
                </label>
                <select class='controlledby chosen' multiple='true' style='width: 100%;'>
                  <option value="all">All Players</option>
                  <$ window.Campaign.players.each(function(player) { $>
                  <option value="<$!player.id$>"><$!player.get("displayname")$></option>
                  <$ }); $>
                </select>
                <div class='clear'></div>
                <label>
                  <strong>Tags</strong>
                </label>
                <input class='tags'>
                <div class='clear'></div>
                <hr>
                <button class='delete btn btn-danger' style='float: right;'>
                  Delete
                </button>
                <button class='duplicate btn' style='margin-right: 10px;'>
                  Duplicate
                </button>
                <button class='archive btn'>
                  <$ if(this.get("archived")) { $>Restore from Archive<$ } else { $>Archive<$ } $>
                </button>
                <div class='clear'></div>
                <$ } $>
                <div class='clear'></div>
              </div>
            </div>
            <div class='row-fluid'>
              <div class='span12'>
                <hr>
                <label>
                  <strong>Bio & Info</strong>
                </label>
                <textarea class='bio'></textarea>
                <div class='clear'></div>
                <$ if(window.is_gm) { $>
                <label>
                  <strong>GM Notes (Only visible to GM)</strong>
                </label>
                <textarea class='gmnotes'></textarea>
                <div class='clear'></div>
                <$ } $>
              </div>
            </div>
          </div>
        </div>
      </div>
    </script>		
		`,

		template_handouteditor: `
			<script id='tmpl_handouteditor' type='text/html'>
      <div class='dialog largedialog handouteditor' style='display: block;'>
        <div class='row-fluid'>
          <div class='span12'>
            <label>
              <strong>Name</strong>
            </label>
            <input class='name' type='text'>
            <div class='clear'></div>
            <$ if (window.is_gm) { $>
            <label>
              <strong>In Player's Journals</strong>
            </label>
            <select class='inplayerjournals chosen' multiple='true' style='width: 100%;'>
              <option value="all">All Players</option>
              <$ window.Campaign.players.each(function(player) { $>
              <option value="<$!player.id$>"><$!player.get("displayname")$></option>
              <$ }); $>
            </select>
            <div class='clear'></div>
            <label>
              <strong>Can Be Edited By</strong>
            </label>
            <select class='controlledby chosen' multiple='true' style='width: 100%;'>
              <option value="all">All Players</option>
              <$ window.Campaign.players.each(function(player) { $>
              <option value="<$!player.id$>"><$!player.get("displayname")$></option>
              <$ }); $>
            </select>
            <div class='clear'></div>
            <label>
              <strong>Tags</strong>
            </label>
            <input class='tags'>
            <div class='clear'></div>
            <$ } $>
          </div>
        </div>
        <div class='row-fluid'>
          <div class='span12'>
            <div class="avatar dropbox <$! this.get("avatar") != "" ? "filled" : "" $>">
            <div class="status"></div>
            <div class="inner">
            <$ if(this.get("avatar") == "") { $>
            <h4 style="padding-bottom: 0px; marigin-bottom: 0px; color: #777;">Drop a file</h4>
            <br /> or
            <button class="btn">Choose a file...</button>
            <input class="manual" type="file" />
            <$ } else { $>
            <img src="<$!this.get("avatar")$>" />
            <div class='remove'><a href='#'>Remove</a></div>
            <$ } $>
            </div>
            </div>
            <div class='clear'></div>
          </div>
        </div>
        <!-- BEGIN MOD -->
        <div class='row-fluid'>
		<button class="btn handout-image-by-url">Set Image from URL</button>
		<div class='clear'></div>
		</div>
		<!-- END MOD -->
        <div class='row-fluid'>
          <div class='span12'>
            <label>
              <strong>Description & Notes</strong>
            </label>
            <textarea class='notes'></textarea>
            <div class='clear'></div>
            <$ if(window.is_gm) { $>
            <label>
              <strong>GM Notes (Only visible to GM)</strong>
            </label>
            <textarea class='gmnotes'></textarea>
            <div class='clear'></div>
            <hr>
            <button class='delete btn btn-danger' style='float: right;'>
              Delete Handout
            </button>
            <button class='archive btn'>
              <$ if(this.get("archived")) { $>Restore Handout from Archive<$ } else { $>Archive Handout<$ } $>
            </button>
            <div class='clear'></div>
            <$ } $>
          </div>
        </div>
      </div>
    </script>
		`,
	};
};

const D20plus = function (version) {
	d20plus.version = version;

	// Window loaded
	window.onload = function () {
		window.unwatch("d20");
		const checkLoaded = setInterval(function () {
			if (!$("#loading-overlay").is(":visible")) {
				clearInterval(checkLoaded);
				d20plus.Init();
			}
		}, 1000);
	};

	/* object.watch polyfill by Eli Grey, http://eligrey.com */
	if (!Object.prototype.watch) {
		Object.defineProperty(Object.prototype, "watch", {
			enumerable: false,
			configurable: true,
			writable: false,
			value: function (prop, handler) {
				var
					oldval = this[prop],
					newval = oldval,
					getter = function () {
						return newval;
					},
					setter = function (val) {
						oldval = newval;
						return (newval = handler.call(this, prop, oldval, val));
					};
				if (delete this[prop]) {
					Object.defineProperty(this, prop, {
						get: getter,
						set: setter,
						enumerable: true,
						configurable: true
					});
				}
			}
		});
	}
	if (!Object.prototype.unwatch) {
		Object.defineProperty(Object.prototype, "unwatch", {
			enumerable: false,
			configurable: true,
			writable: false,
			value: function (prop) {
				var val = this[prop];
				delete this[prop];
				this[prop] = val;
			}
		});
	}
	/* end object.watch polyfill */

	window.d20ext = {};
	window.watch("d20ext", function (id, oldValue, newValue) {
		d20plus.log("Set Development");
		newValue.environment = "development";
		Object.defineProperty(newValue, 'seenad', {
			value: true
		});
		return newValue;
	});
	window.d20 = {};
	window.watch("d20", function (id, oldValue, newValue) {
		d20plus.log("Obtained d20 variable");
		window.unwatch("d20ext");
		window.d20ext.environment = "production";
		newValue.environment = "production";
		return newValue;
	});
	window.d20plus = d20plus;
	d20plus.log("Injected");
};

document.addEventListener("DOMContentLoaded", function(event) {
	// do some template injection
	$("#tmpl_charactereditor").html($(d20plus.template_charactereditor).html());
	$("#tmpl_handouteditor").html($(d20plus.template_handouteditor).html());
});

// if we are the topmost frame, inject
if (window.top === window.self) {
	function strip (str) {
		return str.substring(str.indexOf("\n") + 1, str.lastIndexOf("\n")) + "\n";
	}

	let stack = "function (version) {\n";
	stack += strip(betteR20Base.toString());

	for (let i = 0; i < SCRIPT_EXTENSIONS.length; ++i) {
		stack += strip(SCRIPT_EXTENSIONS[i].toString())
	}
	stack += strip(D20plus.toString());

	stack += "\n}";
	unsafeWindow.eval("(" + stack + ")('" + GM_info.script.version + "')");
}