// ==UserScript==
// @name         5etoolsR20
// @namespace    https://rem.uz/
// @license      MIT (https://opensource.org/licenses/MIT)
// @version      0.7.0
// @updateURL    https://get.5etools.com/5etoolsR20.user.js
// @downloadURL  https://get.5etools.com/5etoolsR20.user.js
// @description  Enhance your Roll20 experience
// @author       5egmegaanon/astranauta/MrLabRat/TheGiddyLimit/DBAWiseMan/BDeveau/Remuz
// @match        https://app.roll20.net/editor/
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

/* eslint no-console: "off" */

var D20plus = function(version) {

	var BASE_SITE_URL = "https://5etools.com/";

	var DATA_URL = BASE_SITE_URL+"data/";
	var JS_URL = BASE_SITE_URL+"js/";
	var IMG_URL = BASE_SITE_URL+"img/";

	var CONFIG_HANDOUT = '5etools';

	// build a big dictionary of sheet properties to be used as reference throughout // TODO use these as reference throughout
	function SheetAttribute (name, ogl, shaped) {
		this.name = name;
		this.ogl = ogl;
		this.shaped = shaped;
	}
	var NPC_SHEET_ATRIBS= {};
	// these are all lowercased; any comparison should be lowercased
	NPC_SHEET_ATRIBS["empty"] = new SheetAttribute("--Empty--", "", "");
	// TODO: implement custom entry (enable textarea)
	//NPC_SHEET_ATRIBS["custom"] = new SheetAttribute("-Custom-", "-Custom-", "-Custom-");
	NPC_SHEET_ATRIBS["npc_hpbase"] = new SheetAttribute("Avg HP", "npc_hpbase", "npc_hpbase");
	NPC_SHEET_ATRIBS["npc_ac"] = new SheetAttribute("AC", "npc_ac", "ac");
	NPC_SHEET_ATRIBS["passive"] = new SheetAttribute("Passive Perception", "passive", "passive");
	NPC_SHEET_ATRIBS["npc_hpformula"] = new SheetAttribute("HP Formula", "npc_hpformula", "npc_hpformula");
	NPC_SHEET_ATRIBS["npc_speed"] = new SheetAttribute("Speed", "npc_speed", "npc_speed");
	NPC_SHEET_ATRIBS["spell_save_dc"] = new SheetAttribute("Spell Save DC", "spell_save_dc", "spell_save_DC");

	var CONFIG_OPTIONS = {
		"token": {
			"_name": "Tokens",
			"bar1": {
				"name": "Bar 1",
				"default": "npc_hpbase",
				"_type": "_SHEET_ATTRIBUTE"
			},
			"bar1_max": {
				"name": "Set Bar 1 Max",
				"default": true,
				"_type": "boolean"
			},
			"bar1_reveal": {
				"name": "Reveal Bar 1",
				"default": false,
				"_type": "boolean"
			},
			"bar2": {
				"name": "Bar 2",
				"default": "npc_ac",
				"_type": "_SHEET_ATTRIBUTE"
			},
			"bar2_max": {
				"name": "Set Bar 2 Max",
				"default": false,
				"_type": "boolean"
			},
			"bar2_reveal": {
				"name": "Reveal Bar 2",
				"default": false,
				"_type": "boolean"
			},
			"bar3": {
				"name": "Bar 3",
				"default": "passive",
				"_type": "_SHEET_ATTRIBUTE"
			},
			"bar3_max": {
				"name": "Set Bar 3 Max",
				"default": false,
				"_type": "boolean"
			},
			"bar3_reveal": {
				"name": "Reveal Bar 3",
				"default": false,
				"_type": "boolean"
			},
			"rollHP": {
				"name": "Roll Token HP",
				"default": false,
				"_type": "boolean"
			},
			"name": {
				"name": "Show Nameplate",
				"default": true,
				"_type": "boolean"
			},
			"name_reveal": {
				"name": "Reveal Nameplate",
				"default": false,
				"_type": "boolean"
			}

		},
		"interface": {
			"_name": "Interface",
			"minifyTracker": {
				"name": "Shrink Initiative Tracker Text",
				"default": false,
				"_type": "boolean"
			}
		}
	};

	var spellDataDir = `${DATA_URL}spells/`;
	var spellDataUrls = {};

	var spellmetaurl = `${spellDataDir}roll20.json`;

	var monsterDataDir = `${DATA_URL}bestiary/`;
	var monsterDataUrls = {};

	var itemdataurl = `${DATA_URL}items.json`;
	var featdataurl = `${DATA_URL}feats.json`;
	var psionicdataurl = `${DATA_URL}psionics.json`;

	var d20plus = {
		sheet: "ogl",
		version: version,
		timeout: 500,
		remaining: 0,
		scriptsLoaded: false,
		monsters: {},
		spells: {},
		psionics: {},
		items: {},
		feats: {},
		initiative: {},
		config: {},
		importer: {}
	};

	d20plus.scripts = [
		{name: "xml2json", url: "https://cdnjs.cloudflare.com/ajax/libs/x2js/1.2.0/xml2json.min.js"},
		{name: "listjs", url: "https://raw.githubusercontent.com/javve/list.js/v1.5.0/dist/list.min.js"},
		{name: "5etoolsutils", url: `${JS_URL}utils.js`},
		{name: "5etoolsrender", url: `${JS_URL}entryrender.js`}
	];

	d20plus.json = [
		{name: "spell index", url: `${spellDataDir}index.json`},
		{name: "bestiary index", url: `${monsterDataDir}index.json`}
	]

	// add JSON index/metadata
	d20plus.addJson = function (onLoadFunction) {
		const onEachLoadFunction = function (name, url, data) {
			if (name === "spell index") spellDataUrls = data;
			else if (name === "bestiary index") monsterDataUrls = data;
			else throw new Error(`Unhandled data from JSON ${name} (${url})`)

			d20plus.log(`> JSON [${name}] Loaded`);
		}
		d20plus.chainLoad(d20plus.json, 0, onEachLoadFunction, onLoadFunction);
	}

	// Inject external JS libraries
	d20plus.addScripts = function(onLoadFunction) {
		const onEachLoadFunction = function(name, url, js) {
			try {
				window.eval(js);
				d20plus.log(`> JS [${name}] Loaded`);
			} catch (e) {
				d20plus.log(`> Error loading ${name}`);
			}
		};
		d20plus.chainLoad(d20plus.scripts, 0, onEachLoadFunction, onLoadFunction);
	};

	d20plus.chainLoad = function (toLoads, index, onEachLoadFunction, onFinalLoadFunction) {
		const toLoad = toLoads[index];
		// on loading the last item, run onLoadFunction
		if (index === toLoads.length-1) {
			$.ajax({
				type: "GET",
				url: toLoad.url+d20plus.getAntiCacheSuffix(),
				success: function(data) {
					onEachLoadFunction(toLoad.name, toLoad.url, data);
					onFinalLoadFunction();
				},
				error: function() {
					d20plus.log(`> Error loading ${toLoad.name}`);
				}
			});
		} else {
			$.ajax({
				type: "GET",
				url: toLoad.url+d20plus.getAntiCacheSuffix(),
				success: function(data) {
					try {
						onEachLoadFunction(toLoad.name, toLoad.url, data);
						d20plus.chainLoad(toLoads, index+1, onEachLoadFunction, onFinalLoadFunction);
					} catch (e) {
						d20plus.log(`> Error loading ${toLoad.name}`);
					}
				},
				error: function() {
					d20plus.log(`> Error loading ${toLoad.name}`);
				}
			});
		}
	};

	d20plus.getAntiCacheSuffix = function() {
		return "?" + (new Date()).getTime();
	};

	d20plus.makeDefaultConfig = function (nextFn) {
		d20.Campaign.handouts.create({
			name: CONFIG_HANDOUT
		}, {
			success: function(handout) {
				notecontents = "The GM notes contain config options saved between sessions. If you want to wipe your saved settings, delete this handout and reload roll20. If you want to edit your settings, click the \"Edit Config\" button in the <b>Settings</b> (cog) panel."

				// default settings
				// token settings mimic official content; other settings as vanilla as possible
				const gmnotes = JSON.stringify(d20plus.getDefaultConfig());

				handout.updateBlobs({notes: notecontents, gmnotes: gmnotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: ""});

				if (nextFn) nextFn();
			}
		});
	};

	d20plus.getConfigHandout = function () {
		return d20.Campaign.handouts.models.find(function(handout) { return handout.attributes.name.toLowerCase() == CONFIG_HANDOUT;});
	};

	d20plus.loadConfigFailed = false;
	d20plus.loadConfig = function() {
		var configHandout = d20plus.getConfigHandout();

		if (!configHandout) {
			d20plus.log("> No config found! Initialising new config...");
			d20plus.makeDefaultConfig(doLoad);
		} else {
			doLoad();
		}

		function doLoad() {
			configHandout = d20plus.getConfigHandout();
			if (configHandout) {
				configHandout.view.render();
				configHandout._getLatestBlob("gmnotes", function(gmnotes) {
					var decoded = decodeURIComponent(gmnotes);

					try {
						d20plus.config = JSON.parse(decoded);

						d20plus.log("> Config Loaded:");
						d20plus.log(d20plus.config);
					} catch (e) {
						if (!d20plus.loadConfigFailed) {
							// prevent infinite loops
							d20plus.loadConfigFailed = true;

							d20plus.log("> Corrupted config! Rebuilding...:");
							gmnotes = JSON.stringify(d20plus.getDefaultConfig());

							configHandout.updateBlobs({notes: notecontents, gmnotes: gmnotes});
							configHandout.save({notes: (new Date).getTime(), inplayerjournals: ""});

							d20plus.loadConfig();
						}
					}
				});
			}
		}
	};

	d20plus.handleConfigChange = function () {
		d20plus.setInitiativeShrink(d20plus.getCfgVal("interface", "minifyTracker"))
	};

	d20plus.getCfgKey = function (group, val) {
		if (val === undefined || d20plus.config[group] === undefined) return undefined;
		const gr = d20plus.config[group];
		for (const key of Object.keys(d20plus.config[group])) {
			if (gr[key] !== undefined && gr[key] === val) {
				return key;
			}
		}
		return undefined;
	};

	d20plus.getCfgVal = function (group, key) {
		if (d20plus.config[group] === undefined) return undefined;
		if (d20plus.config[group][key] === undefined) return undefined;
		if (CONFIG_OPTIONS[group][key]._type === "_SHEET_ATTRIBUTE") {
			return NPC_SHEET_ATRIBS[d20plus.config[group][key]][d20plus.sheet];
		}
		return d20plus.config[group][key];
	};

	// Helpful for checking if a boolean option is set even if false
	d20plus.hasCfgVal = function (group, key) {
		if (d20plus.config[group] === undefined) return undefined;
		if (d20plus.config[group][key] === undefined) return false;
		return true;
	};

	d20plus.setCfgVal = function(group, key, val) {
		if (d20plus.config[group] === undefined) d20plus.config[group] = {};
		d20plus.config[group][key] = val;
	}

	d20plus.getDefaultConfig = function() {
		const outCpy = {}
		$.each(CONFIG_OPTIONS, (sectK, sect) => {
			outCpy[sectK] = outCpy[sectK] || {};
			$.each(sect, (k, data) => {
				if (!k.startsWith("_")) {
					outCpy[sectK][k] = data.default;
				}
			});
		});
		return outCpy;
	};

	// FIXME this should be do-able with built-in roll20 code -- someone with hacker-tier debugging skills pls help
	d20plus.makeTabPane = function ($addTo, headers, content) {
		if (headers.length !== content.length) throw new Error("Tab header and content length were not equal!")

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
	}

	d20plus.openConfigEditor = function () {
		const cEdit = $("#d20plus-configeditor");
		cEdit.dialog("open");

		if (cEdit.attr("hastabs") !== "YES") {
			cEdit.attr("hastabs", "YES");
			const appendTo = $(`<div/>`);
			cEdit.prepend(appendTo);

			const configFields = {};

			const sortedKeys = Object.keys(CONFIG_OPTIONS).sort();
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

				const sortedTabKeys = Object.keys(cfgGroup).filter(k => !k.startsWith("_")).sort(); // sorting alphabetically on key, instead of on display name (allows e.g. "Bar 1" and "Display Bar 1" to be kept together)
				sortedTabKeys.forEach(grpK => {
					const prop = cfgGroup[grpK];

					const toAdd = $(`<tr><td>${prop.name}</td></tr>`)

					// Each config `_type` should have a case here. Each case should add a function to the map [configFields:[cfgK:grpK]]. These functions should return the value of the input.
					switch (prop._type) {
						case "boolean": {
							const field = $(`<input type="checkbox" ${d20plus.getCfgVal(cfgK, grpK) ? `checked` : ""}>`);

							configFields[cfgK][grpK] = () => {
								return field.prop("checked")
							};

							const td = $(`<td/>`).append(field);
							toAdd.append(td);
							break;
						}
						case "_SHEET_ATTRIBUTE": {
							const sortedNpcsAttKeys = Object.keys(NPC_SHEET_ATRIBS).sort((at1, at2) => ascSort(NPC_SHEET_ATRIBS[at1].name, NPC_SHEET_ATRIBS[at2].name));
							const field = $(`<select class="cfg_grp_${cfgK}" data-item="${grpK}">${sortedNpcsAttKeys.map(npcK => `<option value="${npcK}">${NPC_SHEET_ATRIBS[npcK].name}</option>`)}</select>`)
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

					}
					tbody.append(toAdd);
				})

				return content;
			}

			d20plus.makeTabPane(
				appendTo,
				tabList,
				contentList
			)

			const saveButton = $(`#configsave`);
			saveButton.unbind("click");
			$(`#configsave`).bind("click", () => {
				let handout = d20plus.getConfigHandout();
				if (!handout) {
					d20plus.makeDefaultConfig(doSave);
				} else {
					doSave();
				}

				function doSave () {
					$.each(configFields, (cfgK, grp) => {
						$.each(grp, (grpK, grpVField) => {
							d20plus.setCfgVal(cfgK, grpK, grpVField());
						})
					})

					const gmnotes = JSON.stringify(d20plus.config);
					handout.updateBlobs({gmnotes: gmnotes});
					handout.save({notes: (new Date).getTime()});

					d20plus.log(" > Saved config")

					d20plus.handleConfigChange();
				}
			});
		}
	};

	// Window loaded
	window.onload = function() {
		window.unwatch("d20");
		var checkLoaded = setInterval(function() {
			if (!$("#loading-overlay").is(":visible")) {
				clearInterval(checkLoaded);
				d20plus.Init();
			}
		}, 1000);
	};

	// Page fully loaded and visible
	d20plus.Init = function() {
		d20plus.log("> Init (v" + d20plus.version + ")");
		d20plus.log("> Reading Config...");
		d20plus.loadConfig();
		d20plus.bindDropLocations();
		// Firebase will deny changes if we're not GM. Better to fail gracefully.
		if (window.is_gm) {
			d20plus.log("> Is GM");
		} else {
			d20plus.log("> Not GM. Some functionality will be unavailable.");
		}
		d20plus.log("> Load JSON");
		d20plus.addJson(d20plus.onJsonLoad);
	};

	// continue init once JSON loads
	d20plus.onJsonLoad = function() {
		d20plus.log("> Add JS");
		d20plus.addScripts(d20plus.onScriptLoad);
	}

	// continue init once scripts load
	d20plus.onScriptLoad = function() {
		d20plus.log("> Add CSS");
		_.each(d20plus.cssRules, function(r) {d20plus.addCSS(window.document.styleSheets[window.document.styleSheets.length - 1], r.s, r.r);});
		d20plus.log("> Add HTML");
		d20plus.addHTML();
		d20plus.setSheet();

		if (window.is_gm) {
			d20plus.log("> Bind Graphics");
			d20.Campaign.pages.each(d20plus.bindGraphics);
			d20.Campaign.activePage().collection.on("add", d20plus.bindGraphics);
			d20plus.log("> Applying config");
			d20plus.handleConfigChange();
		}
		d20plus.log("> All systems operational");
	};

	// Bind Graphics Add on page
	d20plus.bindGraphics = function(page) {
		try {
			if (page.get("archived") === false) {
				page.thegraphics.on("add", function(e) {
					var character = e.character;
					if (character) {
						var npc = character.attribs.find(function(a) {return a.get("name").toLowerCase() == "npc";});
						var isNPC = npc ? parseInt(npc.get("current")) : 0;
						if (isNPC) {
							// Set bars if configured to do so
							var barsList = ["bar1", "bar2", "bar3"];
							$.each(barsList, (i, barName) => {
								const confVal = d20plus.getCfgVal("token", barName)
								if (confVal) {
									const charAttr = character.attribs.find(a => a.get("name").toLowerCase() == confVal);
									if (charAttr) {
										e.attributes[barName + "_value"] = charAttr.get("current");
										if (d20plus.hasCfgVal("token", barName + "_max")) {
											// TODO: Setting a value to empty/null does not overwrite existing values on the token.
											// setting a specific value does. Must figure this out.
											e.attributes[barName + "_max"] = d20plus.getCfgVal("token", barName + "_max") ? charAttr.get("current") : "";
										}
										if (d20plus.hasCfgVal("token", barName + "_reveal")) {
											e.attributes["showplayers_" + barName] = d20plus.getCfgVal("token", barName + "_reveal");
										}
									}
								}
							})

							// Set Nametag
							if (d20plus.hasCfgVal("token", "name")) {
								e.attributes["showname"] = d20plus.getCfgVal("token", "name");
								if (d20plus.hasCfgVal("token", "name_reveal")) {
									e.attributes["showplayers_name"] = d20plus.getCfgVal("token", "name_reveal");
								}
							}

							// Roll HP
							// TODO: npc_hpbase appears to be hardcoded here? Refactor for NPC_SHEET_ATRIBS?
							// Saw this while working on other things, unclear if it's necessary or not.
							if (d20plus.getCfgVal("token", "rollHP") && d20plus.getCfgKey("token", "npc_hpbase")) {
								var hpf = character.attribs.find(function(a) {return a.get("name").toLowerCase() == NPC_SHEET_ATRIBS["npc_hpformula"][d20plus.sheet];});
								var barName = d20plus.getCfgKey("token", "npc_hpbase");
								if (hpf) {
									var hpformula = hpf.get("current");
									if (hpformula) {
										d20plus.randomRoll(hpformula, function(result) {
											e.attributes[barName + "_value"] = result.total;
											e.attributes[barName + "_max"] = result.total;
											d20plus.log("> Rolled HP for [" + character.get("name") + "]");
										}, function(error) {
											d20plus.log("> Error Rolling HP Dice");
											console.log(error);
										});
									}
								}
							}
						}
					}
				});
			}
		} catch (e) {
			console.log("D20Plus bindGraphics Exception", e);
			console.log("PAGE", page);
		}
	};

	d20plus.bindToken = function (token) {
		function getToken () {
			return $("#initiativewindow").find(`li.token`).filter((i, e) => {
				return $(e).data("tokenid") === token.id;
			});
		}
		getToken().find(`.hp.editable`).text(token.attributes.bar1_value)

		token.on("change", (token, changes) => {
			// FIXME use correct bar number
			// FIXME rebind on page change and initial load
			if (changes.changes.bar1_value) {
				getToken().find(`.hp.editable`).text(token.changed.bar1_value)
			}
		});
	};

	d20plus.lastClickedFolderId = null

	// Create new Journal commands
	d20plus.addJournalCommands = function() {
		// stash the folder ID of the last folder clicked
		$("#journalfolderroot").on("contextmenu", ".dd-content", function(e) {
			if ($(this).parent().hasClass("dd-folder")) {
				const lastClicked = $(this).parent();
				d20plus.lastClickedFolderId = lastClicked.attr("data-globalfolderid");
			}
		})

		var first = $("#journalitemmenu ul li").first();
		first.after("<li data-action-type=\"cloneitem\">Duplicate</li>");
		first.after("<li style=\"height: 10px;\">&nbsp;</li>");
		$("#journalitemmenu ul").on(window.mousedowntype, "li[data-action-type=cloneitem]", function() {
			var id = $currentItemTarget.attr("data-itemid");
			var character = d20.Campaign.characters.get(id);
			var handout = d20.Campaign.handouts.get(id);
			d20plus.log("> Duplicating..");
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
					success: function(h) {
						handout._getLatestBlob("gmnotes", function(gmnotes) {h.updateBlobs({gmnotes: gmnotes});});
						handout._getLatestBlob("notes", function(notes) {h.updateBlobs({notes: notes});});
					}
				});
			}
		});
		// New command on FOLDERS
		var last = $("#journalmenu ul li").last();
		last.after("<li style=\"background-color: #FA5050; color: white;\" data-action-type=\"fulldelete\">Delete Folder + Contents</li>");
		$("#journalmenu ul").on(window.mousedowntype, "li[data-action-type=fulldelete]", function() {
			d20plus.log(" > Nuking folder...");
			const conf = confirm("Are you sure you want to delete this folder, and everything in it? This cannot be undone.");
			if (conf) {
				const folder = $(`[data-globalfolderid='${d20plus.lastClickedFolderId}']`);
				const childItems = folder.find("[data-itemid]").each((i, e) => {
					const $e = $(e);
					const itemId = $e.attr("data-itemid");
					let toDel = d20.Campaign.handouts.get(itemId);
					toDel || (toDel = d20.Campaign.characters.get(itemId))
					if (toDel) toDel.destroy();
				});
				const childFolders = folder.find(`[data-globalfolderid]`).remove();
				folder.remove();
			}
			$("#journalfolderroot").trigger("change");
			d20plus.lastClickedFolderId = null;
			$("#journalmenu").hide();
		});
	};

	// Determine difficulty of current encounter (iniativewindow)
	d20plus.getDifficulty = function() {
		var difficulty = "Unknown";
		var partyXPThreshold = [0, 0, 0, 0];
		var players = [];
		var npcs = [];
		try {
			$.each(d20.Campaign.initiativewindow.cleanList(), function(i, v) {
				var page = d20.Campaign.pages.get(v._pageid);
				if (page) {
					var token = page.thegraphics.get(v.id);
					if (token) {
						var char = token.character;
						if (char) {
							var npc = char.attribs.find(function(a) {return a.get("name").toLowerCase() === "npc";});
							if (npc && npc.get("current") === "1") {
								npcs.push(char);
							} else {
								var level = char.attribs.find(function(a) {return a.get("name").toLowerCase() === "level";});
								// Can't determine difficulty without level
								if (!level || partyXPThreshold === null) {
									partyXPThreshold = null;
									return;
								}
								// Total party threshold
								for (i = 0; i < partyXPThreshold.length; i++) partyXPThreshold[i] += Parser.levelToXpThreshold(level.get("current"))[i];
								players.push(players.length + 1);
							}
						}
					}
				}
			});
			if (!players.length) return difficulty;
			// If a player doesn't have level set, fail out.
			if (partyXPThreshold !== null) {
				var len = npcs.length;
				var multiplier = 0;
				var adjustedxp = 0;
				var xp = 0;
				var index = 0;
				// Adjust for number of monsters
				if (len < 2) index = 0;
				else
				if (len < 3) index = 1;
				else
				if (len < 7) index = 2;
				else
				if (len < 11) index = 3;
				else
				if (len < 15) index = 4;
				else
					index = 5;
				// Adjust for smaller parties
				if (players.length < 3) index++;
				// Set multiplier
				multiplier = d20plus.multipliers[index];
				// Total monster xp
				$.each(npcs, function(i, v) {
					var cr = v.attribs.find(function(a) {return a.get("name").toLowerCase() === "npc_challenge";});
					if (cr) xp += parseInt(Parser.crToXp(cr.get("current")));
				});
				// Encounter's adjusted xp
				adjustedxp = xp * multiplier;
				console.log("Party XP Threshold", partyXPThreshold);
				console.log("Adjusted XP", adjustedxp);
				// Determine difficulty
				if (adjustedxp < partyXPThreshold[0]) difficulty = "Trivial";
				else
				if (adjustedxp < partyXPThreshold[1]) difficulty = "Easy";
				else
				if (adjustedxp < partyXPThreshold[2]) difficulty = "Medium";
				else
				if (adjustedxp < partyXPThreshold[3]) difficulty = "Hard";
				else
					difficulty = "Deadly";
			}
		} catch (e) {
			console.log("D20Plus getDifficulty Exception", e);
		}
		return difficulty;
	};

	// Determine if folder contains monster by that name
	d20plus.objectExists = function(folderObj, folderId, name) {
		const container = folderObj.find(function(a) {return a.id === folderId;});
		let result = false;
		$.each(container.i, function(i, v) {
			var char = d20.Campaign.characters.get(v);
			var handout = d20.Campaign.handouts.get(v);
			if (char && char.get("name") === name) result = true;
			if (handout && handout.get("name") === name) result = true;
		});
		return result;
	};

	// Find and delete object in folder of given name
	d20plus.deleteObject = function(folderObj, folderId, name) {
		const container = folderObj.find(function(a) {return a.id === folderId;});
		let result = false;
		$.each(container.i, function(i, v) {
			var char = d20.Campaign.characters.get(v);
			var handout = d20.Campaign.handouts.get(v);
			if (char && char.get("name") === name) {
				char.destroy();
				result = true;
			}
			if (handout && handout.get("name") === name) {
				handout.destroy();
				result = true;
			}
		});
		return result;
	};

	d20plus.formSrcUrl = function (dataDir, fileName) {
		return dataDir + fileName;
	};

	// Inject HTML
	d20plus.addHTML = function() {
		if (window.is_gm) {
			$("#mysettings > .content").children("hr").first().before(d20plus.settingsHtml);
			$("#mysettings > .content a#button-monsters-load").on(window.mousedowntype, d20plus.monsters.button);
			$("#mysettings > .content a#button-monsters-load-all").on(window.mousedowntype, d20plus.monsters.buttonAll);
			$("#mysettings > .content a#button-spells-load").on(window.mousedowntype, d20plus.spells.button);
			$("#mysettings > .content a#button-spells-load-all").on(window.mousedowntype, d20plus.spells.buttonAll);
			$("#mysettings > .content a#import-psionics-load").on(window.mousedowntype, d20plus.psionics.button);
			$("#mysettings > .content a#import-items-load").on(window.mousedowntype, d20plus.items.button);
			$("#mysettings > .content a#import-feats-load").on(window.mousedowntype, d20plus.feats.button);
			$("#mysettings > .content a#bind-drop-locations").on(window.mousedowntype, d20plus.bindDropLocations);
			$("#mysettings > .content a#bind-tokens").on(window.mousedowntype, d20plus.bindTokens);
			$("#mysettings > .content a#button-edit-config").on(window.mousedowntype, d20plus.openConfigEditor);
			$("#initiativewindow .characterlist").before(d20plus.initiativeHeaders);
			d20plus.getInitTemplate();
			d20.Campaign.initiativewindow.rebuildInitiativeList();
			d20plus.hpAllowEdit();
			d20.Campaign.initiativewindow.model.on("change:turnorder", function () {
				d20plus.updateDifficulty();
			});
			d20plus.updateDifficulty();
			d20plus.addJournalCommands();

			$("body").append(d20plus.importDialogHtml);
			$("body").append(d20plus.importListHTML);
			$("body").append(d20plus.configEditorHTML);
			$("#d20plus-import").dialog({
				autoOpen: false,
				resizable: false
			});
			$("#d20plus-importlist").dialog({
				autoOpen: false,
				resizable: true
			});
			$("#d20plus-configeditor").dialog({
				autoOpen: false,
				resizable: true,
				width: 800,
				height: 400,
			});
			$("#d20plus-configeditor").parent().append(d20plus.configEditorButtonBarHTML);
			/* Removed until I can figure out a way to show the new version without the certificate error
			$("body").append(d20plus.dmscreenHtml);
			var $dmsDialog = $("#dmscreen-dialog");
			$dmsDialog.dialog({
				title: "DM Screen",
				width: 700,
				height: 515,
				autoOpen: false
			});
			$("#floatingtoolbar > ul").append(d20plus.dmscreenButton);
			$("#dmscreen-button").on(window.mousedowntype, function(){$dmsDialog.dialog($dmsDialog.dialog("isOpen") ? "close" : "open");});*/

			populateDropdown("#button-spell-select", "#import-spell-url", spellDataDir, spellDataUrls, "PHB");
			populateDropdown("#button-monsters-select", "#import-monster-url", monsterDataDir, monsterDataUrls, "MM");

			function populateDropdown(dropdownId, inputFieldId, baseUrl, srcUrlObject, defaultSel) {
				const defaultUrl = d20plus.formSrcUrl(baseUrl, srcUrlObject[defaultSel]);
				$(inputFieldId).val(defaultUrl);
				const dropdown = $(dropdownId);
				$.each(Object.keys(srcUrlObject), function (i, src) {
					dropdown.append($('<option>', {
						value: d20plus.formSrcUrl(baseUrl, srcUrlObject[src]),
						text: Parser.sourceJsonToFullCompactPrefix(src)
					}));
				});
				dropdown.append($('<option>', {
					value: "",
					text: "Custom"
				}));
				dropdown.val(defaultUrl);
				dropdown.change(function () {
					$(inputFieldId).val(this.value);
				});
			}
		}
		// add a bind button to the journal for players
		const altBindButton = $(`<button id="bind-drop-locations-alt" class="btn bind-drop-locations" href="#" title="Bind drop locations and handouts" style="margin-right: 0.5em;">Bind Drag-n-Drop</button>`);
		altBindButton.on("click", function () {
			d20plus.bindDropLocations();
		});
		if (window.is_gm) {
			$("#journal > .content:eq(1) > button.btn.superadd").after(altBindButton);
		} else {
			$(`#journal .content`).before(altBindButton);
			altBindButton.after(`<br>`);
		}
		$("#journal > .content:eq(1) btn#bind-drop-locations").on(window.mousedowntype, d20plus.bindDropLocations);
	};

	d20plus.updateDifficulty = function() {
		var $span = $("div#initiativewindow").parent().find(".ui-dialog-buttonpane > span.difficulty");
		var $btnpane = $("div#initiativewindow").parent().find(".ui-dialog-buttonpane");
		if (!$span.length) {
			$btnpane.prepend(d20plus.difficultyHtml);
			$span = $("div#initiativewindow").parent().find(".ui-dialog-buttonpane > span.difficulty");
		}
		$span.text("Difficulty: " + d20plus.getDifficulty());
	};

	// bind tokens to the initiative tracker
	// TODO automate this on page load/battlemap change
	d20plus.bindTokens = function () {
		// Gets a list of all the tokens on the current page:
		const curTokens = d20.Campaign.pages.get(d20.Campaign.activePage()).thegraphics.toArray();
		curTokens.forEach(t => {
			d20plus.bindToken(t);
		});
	};

	// bind drop locations on sheet to accept custom handouts
	d20plus.bindDropLocations = function() {
		// Bind Spells and Items, add compendium-item to each of them
		var journalFolder = d20.Campaign.get("journalfolder");
		if (journalFolder === "") {
			d20.journal.addFolderToFolderStructure("Spells");
			d20.journal.addFolderToFolderStructure("Psionics");
			d20.journal.addFolderToFolderStructure("Items");
			d20.journal.addFolderToFolderStructure("Feats");
			d20.journal.refreshJournalList();
			journalFolder = d20.Campaign.get("journalfolder");
		}
		var journalFolderObj = JSON.parse(journalFolder);
		var handouts = journalFolderObj.find(function(a) {return a.n && (a.n === "Spells" || a.n === "Items");});

		function addClasses (folderName) {
			$(`#journalfolderroot > ol.dd-list > li.dd-folder > div.dd-content:contains(${folderName})`).parent().find("ol li[data-itemid]").addClass("compendium-item").addClass("ui-draggable").addClass("Vetools-draggable");
		}
		addClasses("Spells");
		addClasses("Psionics");
		addClasses("Items");
		addClasses("Feats");

		// if player, force-enable dragging
		if (!window.is_gm) {
			$(`.Vetools-draggable`).draggable({
				revert: true,
				distance: 10,
				revertDuration: 0,
				helper: "clone",
				handle: ".namecontainer",
				appendTo: "body",
				scroll: true,
				start: function() {
					$("#journalfolderroot").addClass("externaldrag")
				},
				stop: function() {
					$("#journalfolderroot").removeClass("externaldrag")
				}
			})
		}

		d20.Campaign.characters.models.each(function(v, i) {
			v.view.rebindCompendiumDropTargets = function() {
				// ready character sheet for draggable
				$(".sheet-compendium-drop-target").each(function() {
					$(this).droppable({
						hoverClass: "dropping",
						tolerance: "pointer",
						activeClass: "active-drop-target",
						accept: ".compendium-item",
						drop: function(t, i) {
							var characterid = $(".characterdialog").has(t.target).attr("data-characterid");
							var character = d20.Campaign.characters.get(characterid).view;
							var inputData;
							if ($(i.helper[0]).hasClass("handout")) {
								console.log("Handout item dropped onto target!");
								t.originalEvent.dropHandled = !0;
								var id = $(i.helper[0]).attr("data-itemid");
								var handout = d20.Campaign.handouts.get(id);
								console.log(character);
								var data = "";
								if (window.is_gm) {
									handout._getLatestBlob("gmnotes", function(gmnotes) {
										data = gmnotes;
										handout.updateBlobs({gmnotes: gmnotes});
										handleData(data);
									});
								} else {
									handout._getLatestBlob("notes", function (notes) {
										data = $(notes).filter("del").html();
										handleData(data);
									});
								}

								function handleData (data) {
									data = JSON.parse(data);

									// FIXME remove Feat workaround when roll20 supports feat drag-n-drop properly
									if (data.data.Category === "Feats") {
										const rowId = d20plus.generateRowId();
										character.model.attribs.create({
											"name": `repeating_traits_${rowId}_options-flag`,
											"current": "0"
										});

										character.model.attribs.create({
											"name": `repeating_traits_${rowId}_name`,
											"current": data.name
										});

										character.model.attribs.create({
											"name": `repeating_traits_${rowId}_description`,
											"current": data.Vetoolscontent
										});

										character.model.attribs.create({
											"name": `repeating_traits_${rowId}_source`,
											"current": "Feat"
										});

										character.model.view._updateSheetValues();
										const dirty = [];
										$.each(d20.journal.customSheets.attrDeps, function(i, v) {dirty.push(i);});
										d20.journal.notifyWorkersOfAttrChanges(character.model.view.model.id, dirty, true);
									} else if (data.data.Category === "Psionics") {
										function makeSpellTrait(level, rowId, propName, content) {
											character.model.attribs.create({
												"name": `repeating_spell-${level}_${rowId}_${propName}`,
												"current": `${content}`
											});
										}
										// disable all components
										function noComponents(level, rowId, hasM) {
											makeSpellTrait(level, rowId, "spellcomp_v", 0);
											makeSpellTrait(level, rowId, "spellcomp_s", 0);
											if (!hasM) {
												makeSpellTrait(level, rowId, "spellcomp_m", 0);
											}
											makeSpellTrait(level, rowId, "options-flag", 0);
										}

										const renderer = new EntryRenderer();
										renderer.setBaseUrl(BASE_SITE_URL);

										if (data.type === "D") {
											const rowId = d20plus.generateRowId();

											// make focus
											const focusLevel = "cantrip";
											makeSpellTrait(focusLevel, rowId, "spelllevel", "cantrip");
											makeSpellTrait(focusLevel, rowId, "spellname", `${data.name} Focus`);
											makeSpellTrait(focusLevel, rowId, "spelldescription", data.focus);
											makeSpellTrait(focusLevel, rowId, "spellcastingtime", "1 bonus action");
											noComponents(focusLevel, rowId);

											data.modes.forEach(m => {
												if (m.submodes) {
													m.submodes.forEach(sm => {
														const rowId = d20plus.generateRowId();
														const smLevel = sm.cost.min;
														makeSpellTrait(smLevel, rowId, "spelllevel", smLevel);
														makeSpellTrait(smLevel, rowId, "spellname", `${m.name} (${sm.name})`);
														const renderStack = [];
														renderer.recursiveEntryRender({entries: sm.entries}, renderStack, 3);
														makeSpellTrait(smLevel, rowId, "spelldescription", renderStack.join(""));
														const costStr = sm.cost.min === sm.cost.max ? sm.cost.min : `${sm.cost.min}-${sm.cost.max}`;
														makeSpellTrait(smLevel, rowId, "spellcomp_materials", `${costStr} psi points`);
														noComponents(smLevel, rowId, true);
													});
												} else {
													const rowId = d20plus.generateRowId();
													const mLevel = m.cost.min;
													makeSpellTrait(mLevel, rowId, "spelllevel", mLevel);
													makeSpellTrait(mLevel, rowId, "spellname", `${m.name}`);
													const renderStack = [];
													renderer.recursiveEntryRender({entries: m.entries}, renderStack, 3);
													makeSpellTrait(mLevel, rowId, "spelldescription", `Psionic Discipline mode\n\n${renderStack.join("")}`);
													const costStr = m.cost.min === m.cost.max ? m.cost.min : `${m.cost.min}-${m.cost.max}`;
													makeSpellTrait(mLevel, rowId, "spellcomp_materials", `${costStr} psi points`);
													if (m.concentration) {
														makeSpellTrait(mLevel, rowId, "spellduration", `${m.concentration.duration} ${m.concentration.unit}`);
													}
													noComponents(mLevel, rowId, true);
												}
											});
										} else {
											const rowId = d20plus.generateRowId();
											const level = "cantrip";
											makeSpellTrait(level, rowId, "spelllevel", "cantrip");
											makeSpellTrait(level, rowId, "spellname", data.name);
											makeSpellTrait(level, rowId, "spelldescription", `Psionic Talent\n\n${EntryRenderer.psionic.getTalentText(data, renderer)}`);
											noComponents(level, rowId, false);
										}

										character.model.view._updateSheetValues();
										const dirty = [];
										$.each(d20.journal.customSheets.attrDeps, function(i, v) {dirty.push(i);});
										d20.journal.notifyWorkersOfAttrChanges(character.model.view.model.id, dirty, true);
									} else {
										inputData = data.data;
										inputData.Name = data.name;
										inputData.Content = data.content;
										const r = $(t.target);
										r.find("*[accept]").each(function() {
											const $this = $(this);
											const acceptTag = $this.attr("accept");
											if (inputData[acceptTag] !== undefined) {
												if ("input" === this.tagName.toLowerCase()) {
													if ("checkbox" === $this.attr("type")) {
														if (inputData[acceptTag]) {
															$this.attr("checked", "checked");
														} else {
															$this.removeAttr("checked");
														}
													} else if ("radio" === $this.attr("type")) {
														if (inputData[acceptTag]) {
															$this.attr("checked", "checked");
														} else {
															$this.removeAttr("checked");
														}
													} else {
														$this.val(inputData[acceptTag]);
													}
												} else if ("select" === this.tagName.toLowerCase()) {
													$this.find("option").each(function () {
														const $this = $(this);
														if ($this.attr("value") === inputData[acceptTag] || $this.text() === inputData[acceptTag]) $this.attr("selected", "selected");
													});
												} else {
													$this.val(inputData[acceptTag]);
												}
												// persist the value
												character.saveSheetValues(this);
											}
										});
									}
								}
							}
							 else {
								console.log("Compendium item dropped onto target!");
								t.originalEvent.dropHandled = !0;
								inputData = $(i.helper[0]).attr("data-pagename");
								console.log("https://app.roll20.net/compendium/" + COMPENDIUM_BOOK_NAME + "/" + inputData + ".json?plaintext=true");
								$.get("https://app.roll20.net/compendium/" + COMPENDIUM_BOOK_NAME + "/" + inputData + ".json?plaintext=true", function(i) {
									var n = i.data;
									n.Name = i.name;
									n.Content = i.content;
									var r = $(t.target);
									r.find("*[accept]").each(function() {
										var t = $(this);
										var i = t.attr("accept");
										n[i] && ("input" === t[0].tagName.toLowerCase() && "checkbox" === t.attr("type") ? t.attr("value") === n[i] ? t.attr("checked", "checked") : t.removeAttr("checked") : "input" === t[0].tagName.toLowerCase() && "radio" === t.attr("type") ? t.attr("value") === n[i] ? t.attr("checked", "checked") : t.removeAttr("checked") : "select" === t[0].tagName.toLowerCase() ? t.find("option").each(function() {
											var e = $(this);
											(e.attr("value") === n[i] || e.text() === n[i]) && e.attr("selected", "selected");
										}) : $(this).val(n[i]), character.saveSheetValues(this));
									});
								});
							}
						}
					});
				});
			};
		});
	};

	d20plus.handleAjaxError = function(jqXHR, exception) {
		var msg = "";
		if (jqXHR.status === 0) {
			msg = "Could not connect.\n Check Network";
		} else if (jqXHR.status === 404) {
			msg = "Page not found [404]";
		} else if (jqXHR.status === 500) {
			msg = "Internal Server Error [500]";
		} else if (exception === 'parsererror') {
			msg = "Data parse failed";
		} else if (exception === 'timeout') {
			msg = "Timeout";
		} else if (exception === 'abort') {
			msg = "Request aborted";
		} else {
			msg = "Uncaught Error.\n" + jqXHR.responseText;
		}
		d20plus.log("> ERROR: " + msg);
	};

	// Import Monsters button was clicked
	d20plus.monsters.button = function() {
		var url = $("#import-monster-url").val();
		if (url !== null) d20plus.monsters.load([url]);
	};

	// Import All Spells button was clicked
	d20plus.monsters.buttonAll = function() {
		const toLoad = Object.keys(monsterDataUrls).filter(src => !isNonstandardSource(src)).map(src => d20plus.monsters.formMonsterUrl(monsterDataUrls[src]));
		d20plus.monsters.load(toLoad, true);
	};

	d20plus.monsters.formMonsterUrl = function (fileName) {
		return d20plus.formSrcUrl(monsterDataDir, fileName);
	};

	// Fetch monster data from XML url and import it
	d20plus.monsters.load = function(urls) {
		if (urls.length === 0) {
			d20plus.log("> ERROR: no URLs!");
			return;
		}

		$("a.ui-tabs-anchor[href='#journal']").trigger("click");
		var x2js = new X2JS();
		var datatype = $("#import-datatype").val();
		if (datatype === "json") datatype = "text";

		let loaded = 0;
		let allData = [];

		urls.forEach(url => {
			$.ajax({
				type: "GET",
				url: url,
				dataType: datatype,
				success: function(data) {
					loaded++;
					allData.push(data);
					if (loaded >= urls.length) {
						handleSuccess(allData);
					}
				},
				error: function(jqXHR, exception) {d20plus.handleAjaxError(jqXHR, exception);}
			});
		});

		d20plus.timeout = 500;

		function handleSuccess(data) {
			try {
				d20plus.log("Importing Data (" + $("#import-datatype").val().toUpperCase() + ")");
				monsterdata = (datatype === "XML") ? data.map(xml => x2js.xml2json(xml)) : data.map(json => JSON.parse(json.replace(/^var .* \= /g, "")));
				let temp = {monster: []};
				monsterdata.forEach(data => temp.monster = temp.monster.concat(data.monster));
				monsterdata = temp;

				var length = monsterdata.monster.length;
				monsterdata.monster.sort(function(a,b) {
					if (a.name < b.name) return -1;
					if (a.name > b.name) return 1;
					return 0;
				});
				// building list for checkboxes
				$("#import-list .list").html("");
				$.each(monsterdata.monster, function(i, v) {
					try {
						$("#import-list .list").append(`<label><input type="checkbox" data-listid="${i}"> <span class="name">${v.name}</span></label>`);
					} catch (e) {
						console.log("Error building list!", e);
						d20plus.addImportError(v.name);
					}
				});
				var options = {valueNames: [ 'name' ]};
				var importList = new List ("import-list", options);
				$(`#import-list > .search`).val("");
				importList.search("");
				$("#import-options label").hide();
				$("#import-overwrite").parent().show();
				$("#delete-existing").parent().show();
				$("#organize-by-source").parent().show();
				$("#d20plus-importlist").dialog("open");
				const selectAllBox = $("#d20plus-importlist input#importlist-selectall");
				selectAllBox.unbind("click");
				selectAllBox.prop("checked", false);
				selectAllBox.bind("click", function() {
					d20plus._importToggleSelectAll(importList, selectAllBox);
				});
				$("#d20plus-importlist button").unbind("click");
				$("#d20plus-importlist button#importstart").bind("click", function() {
					d20plus._importHandleStart(importList, monsterdata.monster, "monster", d20plus.monsters.import)
				});
			} catch (e) {
				console.log("> Exception ", e);
			}
		}
	};

	d20plus._importToggleSelectAll = function (importList, selectAllCb) {
		const $sa = $(selectAllCb);
		importList.items.forEach(i => Array.prototype.forEach.call(i.elm.children, (e) => {
			if (e.tagName === "INPUT") {
				$(e).prop("checked", $sa.prop("checked"));
			}
		}));
	};

	d20plus._importHandleStart = function (importList, dataList, stringItemType, importFunction) {
		$("#d20plus-importlist").dialog("close");
		var overwrite = $("#import-overwrite").prop("checked");
		var deleteExisting = $("#delete-existing").prop("checked");
		const items = importList.items
		importList.items.forEach(i => Array.prototype.forEach.call(i.elm.children, (e) => {
			const $e = $(e);
			if ($e.is("input") && $e.prop("checked")) {
				var dataIndex = parseInt($e.data("listid"));
				var curItem = dataList[dataIndex];
				try {
					console.log(`> ${(dataIndex + 1)}/${length} Attempting to import ${stringItemType} [${curItem.name}]`);
					importFunction(curItem, overwrite, deleteExisting);
				} catch (x) {
					console.log("Error Importing!", x);
					d20plus.addImportError(curItem.name);
				}
			}
		}));
	}

	// Create monster character from js data object
	d20plus.monsters.import = function(data, overwrite, deleteExisting) {
		var typeArr = Parser.monTypeToFullObj(data.type).asText.split(",");
		var fname = $("#organize-by-source").prop("checked") ? Parser.sourceJsonToFull(data.source) : typeArr[0].toLowerCase().replace(/\((any race)\)/g, "").capFirstLetter();
		var findex = 1;
		var folder;
		d20.journal.refreshJournalList();
		var journalFolder = d20.Campaign.get("journalfolder");
		if (journalFolder === "") {
			d20.journal.addFolderToFolderStructure("Characters");
			d20.journal.refreshJournalList();
			journalFolder = d20.Campaign.get("journalfolder");
		}
		var journalFolderObj = JSON.parse(journalFolder);
		var monsters = journalFolderObj.find(function(a) {return a.n && a.n == "Monsters";});
		if (!monsters) d20.journal.addFolderToFolderStructure("Monsters");
		d20.journal.refreshJournalList();
		journalFolder = d20.Campaign.get("journalfolder");
		journalFolderObj = JSON.parse(journalFolder);
		monsters = journalFolderObj.find(function(a) {return a.n && a.n == "Monsters";});
		var name = data.name || "(Unknown Name)";
		// check for duplicates
		var dupe = false;
		$.each(monsters.i, function(i, v) {
			if (v.id !== undefined) {
				if (d20plus.objectExists(monsters.i, v.id, name)) dupe = true;
				if (overwrite || deleteExisting) d20plus.deleteObject(monsters.i, v.id, name);
			}
		});
		if (deleteExisting || (dupe && !overwrite)) return;
		var timeout = 0;
		d20plus.remaining++;
		if (d20plus.timeout == 500) {
			$("#d20plus-import").dialog("open");
			$("#import-remaining").text(d20plus.remaining);
		}
		timeout = d20plus.timeout;
		d20plus.timeout += 2500;
		setTimeout(function() {
			d20plus.log("Running import of [" + name + "]");
			$("#import-remaining").text(d20plus.remaining);
			$("#import-name").text(name);
			d20.journal.refreshJournalList();
			journalFolder = d20.Campaign.get("journalfolder");
			journalFolderObj = JSON.parse(journalFolder);
			monsters = journalFolderObj.find(function(a) {return a.n && a.n == "Monsters";});
			// make source folder
			for (i = -1; i < monsters.i.length; i++) {
				var theFolderName = (findex == 1) ? fname : fname + " " + findex;
				folder = monsters.i.find(function(f) {return f.n == theFolderName;});
				if (folder) {
					if (folder.i.length >= 90) {
						findex++;
					} else {
						break;
					}
				} else {
					d20.journal.addFolderToFolderStructure(theFolderName, monsters.id);
					d20.journal.refreshJournalList();
					journalFolder = d20.Campaign.get("journalfolder");
					journalFolderObj = JSON.parse(journalFolder);
					monsters = journalFolderObj.find(function(a) {return a.n && a.n == "Monsters";});
					folder = monsters.i.find(function(f) {return f.n == theFolderName;});
					break;
				}
			}
			if (!folder) {
				console.log("> Failed to find or create source folder!");
				return;
			}
			d20.Campaign.characters.create({name: name}, {
				success: function(character) {
					function getSetAvatarImage(avatar) {
						character.attributes.avatar = avatar;
						var tokensize = 1;
						if (character.size === "L") tokensize = 2;
						if (character.size === "H") tokensize = 3;
						if (character.size === "G") tokensize = 4;
						var lightradius = 5;
						if(character.senses && character.senses.toLowerCase().match(/(darkvision|blindsight|tremorsense|truesight)/)) lightradius = Math.max.apply(Math, character.senses.match(/\d+/g));
						var lightmin = 0;
						if(character.senses && character.senses.toLowerCase().match(/(blindsight|tremorsense|truesight)/)) lightmin = lightradius;
						var defaulttoken = {
							represents: character.id,
							name: character.name,
							imgsrc: avatar,
							width: 70 * tokensize,
							height: 70 * tokensize,
							light_hassight: true,
							light_radius: lightradius,
							light_dimradius: lightmin
						};

						character.updateBlobs({ avatar: avatar, defaulttoken: JSON.stringify(defaulttoken) });
						character.save({defaulttoken: (new Date()).getTime()});
					}
					/* OGL Sheet */
					try {
						const type = Parser.monTypeToFullObj(data.type).asText;
						const source = Parser.sourceJsonToAbv(data.source);
						const avatar = `${IMG_URL}${source}/${name}.png`;
						character.size = data.size;
						character.name = name;
						character.senses = data.senses;
						character.hp = data.hp.match(/^\d+/);
						$.ajax({
							url: avatar,
							type: 'HEAD',
							error: function() {getSetAvatarImage(`${IMG_URL}blank.png`);},
							success: function() {getSetAvatarImage(avatar);}
						});
						var ac = data.ac.match(/^\d+/);
						var actype = /\(([^)]+)\)/.exec(data.ac);
						var hp = data.hp.match(/^\d+/);
						var hpformula = /\(([^)]+)\)/.exec(data.hp);
						var passive = data.passive != null ? data.passive : "";
						var passiveStr = passive !== "" ? "passive Perception " + passive : "";
						var senses = data.senses || "";
						var sensesStr = senses !== "" ? senses + ", " + passiveStr : passiveStr;
						var size = d20plus.getSizeString(data.size || "");
						var alignment = data.alignment || "(Unknown Alignment)";
						var cr = data.cr != null ? data.cr : "";
						var xp = Parser.crToXp(cr);
						character.attribs.create({name: "npc", current: 1});
						character.attribs.create({name: "npc_toggle", current: 1});
						character.attribs.create({name: "npc_options-flag", current: 0});
						character.attribs.create({name: "wtype", current: "@{whispertoggle}"});
						character.attribs.create({name: "rtype", current: "@{advantagetoggle}"});
						character.attribs.create({name: "advantagetoggle", current: "{{query=1}} {{advantage=1}} {{r2=[[@{d20}"});
						character.attribs.create({name: "whispertoggle", current: "/w gm "});
						character.attribs.create({name: "dtype", current: "full"});
						character.attribs.create({name: "npc_name", current: name});
						character.attribs.create({name: "npc_size", current: size});
						character.attribs.create({name: "type", current: type});
						character.attribs.create({name: "npc_type", current: size + " " + type + ", " + alignment});
						character.attribs.create({name: "npc_alignment", current: alignment});
						character.attribs.create({name: "npc_ac", current: ac != null ? ac[0] : ""});
						character.attribs.create({name: "npc_actype", current: actype != null ? actype[1] || "" : ""});
						character.attribs.create({name: "npc_hpbase", current: hp != null ? hp[0] : ""});
						character.attribs.create({name: "npc_hpformula", current: hpformula != null ? hpformula[1] || "" : ""});
						data.npc_speed = data.speed;
						if (d20plus.sheet === "shaped") {
							data.npc_speed = data.npc_speed.toLowerCase();
							var match = data.npc_speed.match(/^\s*(\d+)\s?(ft\.?|m\.?)/);
							if (match && match[1]) {
								data.speed = match[1] + ' ' + match[2];
								character.attribs.create({name: "speed", current: match[1] + ' ' + match[2]});
							}
							data.npc_speed = data.speed;
							var regex = /(burrow|climb|fly|swim)\s+(\d+)\s?(ft\.?|m\.?)/g;
							var speeds = void 0;
							while ((speeds = regex.exec(data.npc_speed)) !== null) character.attribs.create({name: "speed_"+speeds[1], current: speeds[2] + ' ' + speeds[3]});
							if (data.npc_speed && data.npc_speed.includes('hover')) character.attribs.create({name: "speed_fly_hover", current: 1});
							data.npc_speed = '';
						}
						character.attribs.create({name: "npc_speed", current: data.speed != null ? data.speed : ""});
						character.attribs.create({name: "strength", current: data.str});
						character.attribs.create({name: "strength_base", current: data.str});
						character.attribs.create({name: "dexterity", current: data.dex});
						character.attribs.create({name: "dexterity_base", current: data.dex});
						character.attribs.create({name: "constitution", current: data.con});
						character.attribs.create({name: "constitution_base", current: data.con});
						character.attribs.create({name: "intelligence", current: data.int});
						character.attribs.create({name: "intelligence_base", current: data.int});
						character.attribs.create({name: "wisdom", current: data.wis});
						character.attribs.create({name: "wisdom_base", current: data.wis});
						character.attribs.create({name: "charisma", current: data.cha});
						character.attribs.create({name: "charisma_base", current: data.cha});
						character.attribs.create({name: "passive", current: passive});
						character.attribs.create({name: "npc_languages", current: data.languages != null ? data.languages : ""});
						character.attribs.create({name: "npc_challenge", current: cr});
						character.attribs.create({name: "npc_xp", current: xp});
						character.attribs.create({name: "npc_vulnerabilities", current: data.vulnerable != null ? data.vulnerable : ""});
						character.attribs.create({name: "damage_vulnerabilities", current: data.vulnerable != null ? data.vulnerable : ""});
						character.attribs.create({name: "npc_resistances", current: data.resist != null ? data.resist : ""});
						character.attribs.create({name: "damage_resistances", current: data.resist != null ? data.resist : ""});
						character.attribs.create({name: "npc_immunities", current: data.immune != null ? data.immune : ""});
						character.attribs.create({name: "damage_immunities", current: data.immune != null ? data.immune : ""});
						character.attribs.create({name: "npc_condition_immunities", current: data.conditionImmune != null ? data.conditionImmune : ""});
						character.attribs.create({name: "damage_condition_immunities", current: data.conditionImmune != null ? data.conditionImmune : ""});
						character.attribs.create({name: "npc_senses", current: sensesStr});
						if (data.save != null && data.save.length > 0) {
							var savingthrows;
							if (data.save instanceof Array) {
								savingthrows = data.save;
							} else {
								savingthrows = data.save.split(", ");
							}
							character.attribs.create({name: "npc_saving_flag", current: 1});
							$.each(savingthrows, function(i, v) {
								var save = v.split(" ");
								character.attribs.create({name: "npc_" + save[0].toLowerCase() + "_save_base", current: parseInt(save[1])});
								character.attribs.create({name: save[0].toLowerCase() + "_saving_throw_proficient", current: parseInt(save[1])});
							});
						}
						if (data.skill != null) {
							const skills = data.skill;
							const skillsString = Object.keys(skills).map(function(k){return k.uppercaseFirst() + ' ' + skills[k];}).join(', ');
							character.attribs.create({name: "npc_skills_flag", current: 1});
							character.attribs.create({name: "npc_skills", current: skillsString});

							// Shaped Sheet currently doesn't correctly load NPC Skills
							// This adds a visual representation as a Trait for reference
							if (d20plus.sheet === "shaped") {
								var newRowId = d20plus.generateRowId();
								character.attribs.create({name: "repeating_npctrait_" + newRowId + "_name", current: "NPC Skills"});
								character.attribs.create({name: "repeating_npctrait_" + newRowId + "_desc", current: skillsString});
							}
							
							$.each(skills, function(k, v) {
								character.attribs.create({name: "npc_" + $.trim(k).toLowerCase().replace(/ /g,"_") + "_base", current: parseInt($.trim(v)) || 0});
							});
						}
						if (data.trait != null) {
							if (!(data.trait instanceof Array)) {
								var tmp1 = data.trait;
								data.trait = [];
								data.trait.push(tmp1);
							}
							$.each(data.trait, function(i, v) {
								var newRowId = d20plus.generateRowId();
								var text = "";
								character.attribs.create({name: "repeating_npctrait_" + newRowId + "_name", current: v.name});
								if (v.text instanceof Array) {
									$.each(v.text, function(z, x) {
										if (!x) return;
										text += (z > 0 ? "\r\n" : "") + x;
									});
								} else {
									text = v.text;
								}
								character.attribs.create({name: "repeating_npctrait_" + newRowId + "_desc", current: text});
							});
						}
						if (data.action != null) {
							if (!(data.action instanceof Array)) {
								var tmp2 = data.action;
								data.action = [];
								data.action.push(tmp2);
							}
							var npc_exception_actions = ["Web (Recharge 5-6)"];
							$.each(data.action, function(i, v) {
								var newRowId = d20plus.generateRowId();
								var text = "";
								if (v.text instanceof Array) {
									$.each(v.text, function(z, x) {
										if (!x) return;
										text += (z > 0 ? "\r\n" : "") + x;
									});
								} else {
									text = v.text;
								}
								var actiontext = text;
								// if (v.text instanceof Array) {
								// 	actiontext = v.text[0];
								// } else {
								// 	actiontext = v.text;
								// }
								var action_desc = actiontext; // required for later reduction of information dump.
								var rollbase = "@{wtype}&{template:npcaction} @{attack_display_flag} @{damage_flag} {{name=@{npc_name}}} {{rname=@{name}}} {{r1=[[1d20+(@{attack_tohit}+0)]]}} @{rtype}+(@{attack_tohit}+0)]]}} {{dmg1=[[@{attack_damage}+0]]}} {{dmg1type=@{attack_damagetype}}} {{dmg2=[[@{attack_damage2}+0]]}} {{dmg2type=@{attack_damagetype2}}} {{crit1=[[@{attack_crit}+0]]}} {{crit2=[[@{attack_crit2}+0]]}} {{description=@{description}}} @{charname_output}";
								// attack parsing
								if (actiontext.indexOf(" Attack:") > -1) {
									var name = v.name;
									var attacktype = "";
									var attacktype2 = "";
									if (actiontext.indexOf(" Weapon Attack:") > -1) {
										attacktype = actiontext.split(" Weapon Attack:")[0];
										attacktype2 = " Weapon Attack:";
									} else if (actiontext.indexOf(" Spell Attack:") > -1) {
										attacktype = actiontext.split(" Spell Attack:")[0];
										attacktype2 = " Spell Attack:";
									}
									var attackrange = "";
									var rangetype = "";
									if (attacktype.indexOf("Melee") > -1) {
										attackrange = (actiontext.match(/reach (.*?),/) || ["", ""])[1];
										rangetype = "Reach";
									} else {
										attackrange = (actiontext.match(/range (.*?),/) || ["", ""])[1];
										rangetype = "Range";
									}
									var tohit = (actiontext.match(/\+(.*) to hit/) || ["", ""])[1];
									var damage = "";
									var damagetype = "";
									var damage2 = "";
									var damagetype2 = "";
									var onhit = "";
									damageregex = /\d+ \((\d+d\d+\s?(?:\+|\-)?\s?\d*)\) (\S+ )?damage/g;
									damagesearches = damageregex.exec(actiontext);
									if (damagesearches) {
										onhit = damagesearches[0];
										damage = damagesearches[1];
										damagetype = (damagesearches[2] != null) ? damagesearches[2].trim() : "";
										damagesearches = damageregex.exec(actiontext);
										if (damagesearches) {
											onhit += " plus " + damagesearches[0];
											damage2 = damagesearches[1];
											damagetype2 = (damagesearches[2] != null) ? damagesearches[2].trim() : "";
										}
									}
									onhit = onhit.trim();
									var attacktarget = (actiontext.match(/\.,(?!.*\.,)(.*)\. Hit:/) || ["", ""])[1];
									// Cut the information dump in the description
									var atk_desc_simple_regex = /Hit: \d+ \((\d+d\d+\s?(?:\+|\-)?\s?\d*)\) (\S+ )?damage\.(.*)/g;
									var atk_desc_complex_regex = /(Hit:.*)/g;
									// is it a simple attack (just 1 damage type)?
									var match_simple_atk = atk_desc_simple_regex.exec(actiontext);
									if (match_simple_atk != null) {
										//if yes, then only display special effects, if any
										action_desc = match_simple_atk[3].trim();
									} else {
										//if not, simply cut everything before "Hit:" so there are no details lost.
										var match_compl_atk = atk_desc_complex_regex.exec(actiontext);
										if (match_compl_atk != null) action_desc = match_compl_atk[1].trim();
									}
									var tohitrange = "+" + tohit + ", " + rangetype + " " + attackrange + ", " + attacktarget + ".";
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_name", current: name});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_flag", current: "on"});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_npc_options-flag", current: 0});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_display_flag", current: "{{attack=1}}"});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_options", current: "{{attack=1}}"});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_tohit", current: tohit});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_damage", current: damage});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_damagetype", current: damagetype});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_damage2", current: damage2});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_damagetype2", current: damagetype2});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_name_display", current: name});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_rollbase", current: rollbase});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_type", current: attacktype});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_type_display", current: attacktype + attacktype2});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_tohitrange", current: tohitrange});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_range", current: attackrange});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_target", current: attacktarget});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_damage_flag", current: "{{damage=1}} {{dmg1flag=1}} {{dmg2flag=1}}"});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_onhit", current: onhit});
								} else {
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_name", current: v.name});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_npc_options-flag", current: 0});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_rollbase", current: rollbase});
									character.attribs.create({name: "repeating_npcaction_" + newRowId + "_name_display", current: v.name});
								}
								var descriptionFlag = Math.max(Math.ceil(text.length / 57), 1);
								character.attribs.create({
									name: "repeating_npcaction_" + newRowId + "_description",
									current: action_desc
								});
								character.attribs.create({
									name: "repeating_npcaction_" + newRowId + "_description_flag",
									current: descriptionFlag
								});
							});
						}
						if (data.reaction != null) {
							if (!(data.reaction instanceof Array)) {
								var tmp3 = data.reaction;
								data.reaction = [];
								data.reaction.push(tmp3);
							}
							character.attribs.create({name: "reaction_flag", current: 1});
							character.attribs.create({name: "npcreactionsflag", current: 1});
							$.each(data.reaction, function(i, v) {
								var newRowId = d20plus.generateRowId();
								var text = "";
								character.attribs.create({name: "repeating_npcreaction_" + newRowId + "_name", current: v.name});
								if (v.text instanceof Array) {
									$.each(v.text, function(z, x) {
										if (!x) return;
										text += (z > 0 ? "\r\n" : "") + x;
									});
								} else {
									text = v.text;
								}
								character.attribs.create({name: "repeating_npcreaction_" + newRowId + "_desc", current: text});
								character.attribs.create({name: "repeating_npcreaction_" + newRowId + "_description", current: text});
							});
						}
						if (data.legendary != null) {
							if (!(data.legendary instanceof Array)) {
								var tmp4 = data.legendary;
								data.legendary = [];
								data.legendary.push(tmp4);
							}
							character.attribs.create({name: "legendary_flag", current: "1"});
							let legendaryActions = data.legendaryActions || 3;
							character.attribs.create({name: "npc_legendary_actions", current: legendaryActions.toString()});
							$.each(data.legendary, function(i, v) {
								var newRowId = d20plus.generateRowId();
								var actiontext = "";
								var text = "";
								var rollbase = "@{wtype}&{template:npcaction} @{attack_display_flag} @{damage_flag} {{name=@{npc_name}}} {{rname=@{name}}} {{r1=[[1d20+(@{attack_tohit}+0)]]}} @{rtype}+(@{attack_tohit}+0)]]}} {{dmg1=[[@{attack_damage}+0]]}} {{dmg1type=@{attack_damagetype}}} {{dmg2=[[@{attack_damage2}+0]]}} {{dmg2type=@{attack_damagetype2}}} {{crit1=[[@{attack_crit}+0]]}} {{crit2=[[@{attack_crit2}+0]]}} {{description=@{description}}} @{charname_output}";
								if (v.attack != null) {
									if (!(v.attack instanceof Array)) {
										var tmp = v.attack;
										v.attack = [];
										v.attack.push(tmp);
									}
									$.each(v.attack, function(z, x) {
										if (!x) return;
										var attack = x.split("|");
										var name = "";
										if (v.attack.length > 1)
											name = (attack[0] == v.name) ? v.name : v.name + " - " + attack[0] + "";
										else
											name = v.name;
										var onhit = "";
										var damagetype = "";
										if (attack.length == 2) {
											damage = "" + attack[1];
											tohit = "";
										} else {
											damage = "" + attack[2];
											tohit = attack[1] || 0;
										}
										character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_name", current: name});
										character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_attack_flag", current: "on"});
										character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_npc_options-flag", current: 0});
										character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_attack_display_flag", current: "{{attack=1}}"});
										character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_attack_options", current: "{{attack=1}}"});
										character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_attack_tohit", current: tohit});
										character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_attack_damage", current: damage});
										character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_name_display", current: name});
										character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_rollbase", current: rollbase});
										character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_attack_type", current: ""});
										character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_attack_tohitrange", current: ""});
										character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_damage_flag", current: "{{damage=1}} {{dmg1flag=1}} {{dmg2flag=1}}"});
										if (damage !== "") {
											damage1 = damage.replace(/\s/g, "").split(/d|(?=\+|\-)/g);
											if (damage1[1])
												damage1[1] = damage1[1].replace(/[^0-9-+]/g, "");
											damage2 = isNaN(eval(damage1[1])) === false ? eval(damage1[1]) : 0;
											if (damage1.length < 2) {
												onhit = onhit + damage1[0] + " (" + damage + ")" + damagetype + " damage";
											} else if (damage1.length < 3) {
												onhit = onhit + Math.floor(damage1[0] * ((damage2 / 2) + 0.5)) + " (" + damage + ")" + damagetype + " damage";
											} else {
												onhit = onhit + (Math.floor(damage1[0] * ((damage2 / 2) + 0.5)) + parseInt(damage1[2], 10)) + " (" + damage + ")" + damagetype + " damage";
											}
										}
										character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_attack_onhit", current: onhit});
									});
								} else {
									character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_name", current: v.name});
									character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_npc_options-flag", current: 0});
									character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_rollbase", current: rollbase});
									character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_name_display", current: v.name});
								}
								if (v.text instanceof Array) {
									$.each(v.text, function(z, x) {
										if (!x) return;
										text += (z > 0 ? "\r\n" : "") + x;
									});
								} else {
									text = v.text;
								}
								var descriptionFlag = Math.max(Math.ceil(text.length / 57), 1);
								character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_description", current: text});
								character.attribs.create({name: "repeating_npcaction-l_" + newRowId + "_description_flag", current: descriptionFlag});
							});
						}
						character.view._updateSheetValues();
						var dirty = [];
						$.each(d20.journal.customSheets.attrDeps, function(i, v) {dirty.push(i);});
						d20.journal.notifyWorkersOfAttrChanges(character.view.model.id, dirty, true);
					} catch (e) {
						d20plus.log("> Error loading [" + name + "]");
						d20plus.addImportError(name);
						console.log(data);
						console.log(e);
					}
					/* end OGL Sheet */
					//character.updateBlobs({gmnotes: gmnotes});
					d20.journal.addItemToFolderStructure(character.id, folder.id);
				}
			});
			d20plus.remaining--;
			if (d20plus.remaining == 0) {
				setTimeout(function() {
					$("#import-name").text("DONE!");
					$("#import-remaining").text("0");
					d20plus.bindDropLocations();
				}, 1000);
			}
		}, timeout);
	};

	// Import dialog showing names of monsters failed to import
	d20plus.addImportError = function(name) {
		var $span = $("#import-errors");
		if ($span.text() == "0") {
			$span.text(name);
		} else {
			$span.text($span.text() + ", " + name);
		}
	};

	// Get NPC size from chr
	d20plus.getSizeString = function(chr) {
		const result = Parser.sizeAbvToFull(chr);
		return result ? result : "(Unknown Size)";
	};

	// Create ID for repeating row
	d20plus.generateRowId = function() {return window.generateUUID().replace(/_/g, "Z");};

	// Create editable HP variable and autocalculate + or -
	d20plus.hpAllowEdit = function() {
		$("#initiativewindow").on(window.mousedowntype, ".hp.editable", function() {
			if ($(this).find("input").length > 0) return void $(this).find("input").focus();
			var val = $.trim($(this).text());
			$(this).html("<input type='text' value='" + val + "'/>");
			$(this).find("input").focus();
		});
		$("#initiativewindow").on("keydown", ".hp.editable", function(event) {
			if (event.which == 13) {
				var total = 0,
					el, token, id, char, hp,
					val = $.trim($(this).find("input").val()),
					matches = val.match(/[+\-]*(\.\d+|\d+(\.\d+)?)/g) || [];
				while (matches.length) {
					total += parseFloat(matches.shift());
				}
				el = $(this).parents("li.token");
				id = el.data("tokenid");
				token = d20.Campaign.pages.get(d20.Campaign.activePage()).thegraphics.get(id);
				char = token.character;
				npc = char.attribs.find(function(a) {return a.get("name").toLowerCase() === "npc";});
				if (npc && npc.get("current") == "1") {
					// FIXME use the right bar
					token.attributes.bar1_value = total;
				} else {
					hp = char.attribs.find(function(a) {return a.get("name").toLowerCase() === "hp";});
					if (hp) {
						hp.syncedSave({current: total});
					} else {
						char.attribs.create({name: "hp", current: total});
					}
				}
				d20.Campaign.initiativewindow.rebuildInitiativeList();
			}
		});
	};

	// Cross-browser add CSS rule
	d20plus.addCSS = function(sheet, selector, rules) {
		index = sheet.cssRules.length;
		if ("insertRule" in sheet) {
			sheet.insertRule(selector + "{" + rules + "}", index);
		} else if ("addRule" in sheet) {
			sheet.addRule(selector, rules, index);
		}
	};

	// Send string to chat using current char id
	d20plus.chatSend = function(str) {d20.textchat.doChatInput(str);};

	// Get character by name
	d20plus.charByName = function(name) {
		var char = null;
		d20.Campaign.characters.each(function(c) {if (c.get("name") == name) char = c;});
		return char;
	};

	// Prettier log
	d20plus.log = function(arg) {console.log("%cD20Plus", "color: #3076b9; font-size: large", arg);};

	// Return random result from rolling dice
	d20plus.randomRoll = function(roll, success, error) {d20.textchat.diceengine.process(roll, success, error);};

	// Return random integer between [0,int)
	d20plus.randomInt = function(int) {return d20.textchat.diceengine.random(int);};

	// Change character sheet formulas
	d20plus.setSheet = function() {
		d20plus.sheet = "ogl";
		if (d20.journal.customSheets.layouthtml.indexOf("shaped_d20") > 0) d20plus.sheet = "shaped";
		if (d20.journal.customSheets.layouthtml.indexOf("DnD5e_Character_Sheet") > 0) d20plus.sheet = "community";
		d20plus.log("> Switched Character Sheet Template to " + d20plus.sheet);
	};

	// Return Initiative Tracker template with formulas
	d20plus.initErrorHandler = null;
	d20plus.getInitTemplate = function() {
		var cachedFunction = d20.Campaign.initiativewindow.rebuildInitiativeList;
		const chachedTemplate = $("#tmpl_initiativecharacter").clone();
		d20.Campaign.initiativewindow.rebuildInitiativeList = function() {
			var html = d20plus.initiativeTemplate;
			_.each(d20plus.formulas[d20plus.sheet], function(v, i) {
				html = html.replace("||" + i + "||", v);
			});
			$("#tmpl_initiativecharacter").replaceWith(html);

			// Hack to catch errors, part 1
			const startTime = (new Date).getTime();

			var results = cachedFunction.apply(this, []);
			setTimeout(function() {
				$(".initmacrobutton").unbind("click");
				$(".initmacrobutton").bind("click", function() {
					console.log("Macro button clicked");
					tokenid = $(this).parent().parent().data("tokenid");
					var token, char;
					var page = d20.Campaign.activePage();
					if (page) token = page.thegraphics.get(tokenid);
					if (token) char = token.character;
					if (char) {
						char.view.showDialog();
						// d20.textchat.doChatInput(`%{` + char.id + `|` + d20plus.formulas[d20plus.sheet]["macro"] + `}`)
					}
				});
			}, 100);

			// Hack to catch errors, part 2
			if (d20plus.initErrorHandler) {
				window.removeEventListener("error", d20plus.initErrorHandler);
			}
			d20plus.initErrorHandler = function (event) {
				// if we see an error within 150 msec of trying to override the initiative window...
				if (((new Date).getTime() - startTime) < 150) {
					d20plus.log(" > ERROR: failed to populate custom initiative tracker, restoring default...");
					// restore the default functionality
					$("#tmpl_initiativecharacter").replaceWith(chachedTemplate);
					return cachedFunction();
				}
			};
			window.addEventListener("error", d20plus.initErrorHandler);
			return results;
		};
	};

	d20plus.spells.formSpellUrl = function (fileName) {
		return d20plus.formSrcUrl(spellDataDir, fileName);
	};

	// Import Spells button was clicked
	d20plus.spells.button = function() {
		var url = $("#import-spell-url").val();
		if (url !== null) d20plus.spells.load([url], Object.values(spellDataUrls).map(file => d20plus.spells.formSpellUrl(file)).includes(url));
	};

	// Import All Spells button was clicked
	d20plus.spells.buttonAll = function() {
		const toLoad = Object.keys(spellDataUrls).filter(src => !isNonstandardSource(src)).map(src => d20plus.spells.formSpellUrl(spellDataUrls[src]));
		d20plus.spells.load(toLoad, true);
	};

	// Fetch spell data from file
	d20plus.spells.load = function(urls, loadMeta) {
		if (urls.length === 0) {
			d20plus.log("> ERROR: no URLs!");
			return;
		};

		$("a.ui-tabs-anchor[href='#journal']").trigger("click");
		var x2js = new X2JS();
		var datatype = $("#import-datatype").val();
		if (datatype === "json") datatype = "text";

		let loaded = 0;
		let allData = [];

		if (loadMeta) {
			$.ajax({
				type: "GET",
				url: spellmetaurl,
				dataType: datatype,
				success: function(metaData) { chainLoad(JSON.parse(metaData));},
				error: function(jqXHR, exception) {d20plus.handleAjaxError(jqXHR, exception);}
			});
		} else {
			chainLoad(null);
		}

		function chainLoad(metadata) {
			urls.forEach(url => {
				$.ajax({
					type: "GET",
					url: url,
					dataType: datatype,
					success: function(data) {
						loaded++;
						allData.push(data);
						if (loaded >= urls.length) {
							handleSuccess(allData, metadata);
						}
					},
					error: function(jqXHR, exception) {d20plus.handleAjaxError(jqXHR, exception);}
				});
			});
		}

		d20plus.timeout = 500;

		function handleSuccess(data, meta) {
			try {
				d20plus.log("Importing Data (" + $("#import-datatype").val().toUpperCase() + ")");
				spelldata = (datatype === "XML") ? data.map(xml => x2js.xml2json(xml)) : data.map(json => JSON.parse(json.replace(/^var .* \= /g, "")));
				let temp = {spell: []};
				spelldata.forEach(data => temp.spell = temp.spell.concat(data.spell));
				spelldata = temp;

				var length = spelldata.spell.length;
				spelldata.spell.sort(function(a,b) {
					if (a.name < b.name) return -1;
					if (a.name > b.name) return 1;
					return 0;
				});

				if (meta) {
					for (let i = 0; i < spelldata.spell.length; ++i) {
						const curSpell = spelldata.spell[i];
						for (let j = 0; j < meta.spell.length; ++j) {
							const curMeta = meta.spell[j];
							if (curSpell.name === curMeta.name && curSpell.source === curMeta.source) {
								curSpell.roll20 = curMeta.data;
								break;
							}
						}
					}
				}

				// building list for checkboxes
				$("#import-list .list").html("");
				$.each(spelldata.spell, function(i, v) {
					try {
						$("#import-list .list").append(`<label><input type="checkbox" data-listid="${i}"> <span class="name">${v.name}</span></label>`);
					} catch (e) {
						console.log("Error building list!", e);
						d20plus.addImportError(v.name);
					}
				});
				var options = {valueNames: [ 'name' ]};
				var importList = new List ("import-list", options);
				$(`#import-list > .search`).val("");
				importList.search("");
				$("#import-options label").hide();
				$("#import-overwrite").parent().show();
				$("#delete-existing").parent().show();
				$("#organize-by-source").parent().show();
				$("#import-showplayers").parent().show();
				$("#d20plus-importlist").dialog("open");
				const selectAllBox = $("#d20plus-importlist input#importlist-selectall");
				selectAllBox.unbind("click");
				selectAllBox.prop("checked", false);
				selectAllBox.bind("click", function() {
					d20plus._importToggleSelectAll(importList, selectAllBox);
				});
				$("#d20plus-importlist button").unbind("click");
				$("#d20plus-importlist button#importstart").bind("click", function() {
					d20plus._importHandleStart(importList, spelldata.spell, "spell", d20plus.spells.import)
				});
			} catch (e) {
				console.log("> Exception ", e);
			}
		}
	};

	// Import individual spells
	d20plus.spells.import = function(data, overwrite, deleteExisting) {
		var level = Parser.spLevelToFull(data.level);
		if (level.toLowerCase() !== "cantrip") level += " level";
		level = level.trim().capFirstLetter()

		d20plus.importer.initFolder(data, overwrite, deleteExisting, "Spells", level, d20plus.spells.handoutBuilder)
	};

	d20plus.spells.handoutBuilder = function (name, data, folder) {
		// build spell handout
		d20.Campaign.handouts.create({
			name: name
		}, {
			success: function(handout) {
				if (!data.school) data.school = "A";
				if (!data.range) data.range = "Self";
				if (!data.duration) data.duration = "Instantaneous";
				if (!data.components) data.components = "";
				if (!data.time) data.components = "1 action";

				const r20Data = {};
				if (data.roll20) Object.assign(r20Data, data.roll20);
				Object.assign(
					r20Data,
					{
						"Level": String(data.level),
						"Range": Parser.spRangeToFull(data.range),
						"School": Parser.spSchoolAbvToFull(data.school),
						"Source": "5etoolsR20",
						"Classes": d20plus.importer.getCleanText(Parser.spClassesToFull(data.classes)),
						"Category": "Spells",
						"Duration": Parser.spDurationToFull(data.duration),
						"Material": "",
						"Components": parseComponents(data.components),
						"Casting Time": Parser.spTimeListToFull(data.time)
					}
				);

				var r20json = {
					name: data.name,
					content: "",
					htmlcontent: "",
					data: r20Data
				};
				if (data.components.m && data.components.m.length) r20json.data["Material"] = data.components.m;
				if (data.meta) {
					if (data.meta.ritual) r20json.data["Ritual"] = "Yes";
				}
				if (data.duration.filter(d => d.concentration).length > 0) {
					r20json.data["Concentration"] = "Yes";
				}
				var notecontents = "";
				var gmnotes = "";
				notecontents += `<p><h3>${data.name}</h3>
<em>${Parser.spLevelSchoolMetaToFull(data.level, data.school, data.meta)}</em></p><p>
<strong>Casting Time:</strong> ${Parser.spTimeListToFull(data.time)}<br>
<strong>Range:</strong> ${Parser.spRangeToFull(data.range)}<br>
<strong>Components:</strong> ${Parser.spComponentsToFull(data.components)}<br>
<strong>Duration:</strong> ${Parser.spDurationToFull(data.duration)}<br>
</p>`;
				const renderer = new EntryRenderer();
				const renderStack = [];
				const entryList = {type: "entries", entries: data.entries};
				renderer.setBaseUrl(BASE_SITE_URL);
				renderer.recursiveEntryRender(entryList, renderStack, 1);
				r20json.content = d20plus.importer.getCleanText(renderStack.join(" "));
				notecontents += renderStack.join("");
				if (data.entriesHigherLevel) {
					const hLevelRenderStack = [];
					const higherLevelsEntryList = {type: "entries", entries: data.entriesHigherLevel};
					renderer.recursiveEntryRender(higherLevelsEntryList, hLevelRenderStack, 2);
					r20json.content += "\n\nAt Higher Levels: " + d20plus.importer.getCleanText(hLevelRenderStack.join(" ").replace("At Higher Levels.", ""));
					notecontents += hLevelRenderStack.join("");
				}
				notecontents += `<p><strong>Classes:</strong> ${Parser.spClassesToFull(data.classes)}</p>`;
				gmnotes = JSON.stringify(r20json);
				notecontents += `<del>${gmnotes}</del>`
				console.log(notecontents);
				handout.updateBlobs({notes: notecontents, gmnotes: gmnotes});
				var injournals = ($("#import-showplayers").prop("checked")) ? ["all"].join(",") : "";
				handout.save({notes: (new Date).getTime(), inplayerjournals: injournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	}

	// parse spell components
	function parseComponents(components) {
		const out = [];
		if (components.v) out.push("V");
		if (components.s) out.push("S");
		if (components.m) out.push("M");
		return out.join(" ");
	}

	// Import Items button was clicked
	d20plus.items.button = function() {
		var url = $("#import-items-url").val();
		if (url !== null) d20plus.items.load(url);
	};

	// Fetch items data from file
	d20plus.items.load = function(url) {
		d20plus.importer.simple(url, "item", "item", d20plus.items.import);
	};

	// Import individual items
	d20plus.items.import = function(data, overwrite, deleteExisting) {
		var fname = $("#organize-by-source").prop("checked") ? Parser.sourceJsonToFull(data.source) : (d20plus.items.parseType(data.type ? data.type.split(",")[0] : (data.wondrous ? "Wondrous Item" : data.technology)));
		var findex = 1;
		var folder;
		d20.journal.refreshJournalList();
		var journalFolder = d20.Campaign.get("journalfolder");
		if (journalFolder === "") {
			d20.journal.addFolderToFolderStructure("Characters");
			d20.journal.refreshJournalList();
			journalFolder = d20.Campaign.get("journalfolder");
		}
		var journalFolderObj = JSON.parse(journalFolder);
		var items = journalFolderObj.find(function(a) {return a.n && a.n === "Items";});
		if (!items) d20.journal.addFolderToFolderStructure("Items");
		d20.journal.refreshJournalList();
		journalFolder = d20.Campaign.get("journalfolder");
		journalFolderObj = JSON.parse(journalFolder);
		items = journalFolderObj.find(function(a) {return a.n && a.n === "Items";});
		var name = data.name || "(Unknown Name)";
		// check for duplicates
		var dupe = false;
		$.each(items.i, function(i, v) {
			if (v.id !== undefined) {
				if (d20plus.objectExists(items.i, v.id, name)) dupe = true;
				if (overwrite || deleteExisting) d20plus.deleteObject(items.i, v.id, name);
			}
		});
		if (deleteExisting || (dupe && !overwrite)) return;
		d20plus.remaining++;
		if (d20plus.timeout === 500) {
			$("#d20plus-import").dialog("open");
			$("#import-remaining").text("d20plus.remaining");
		}
		timeout = d20plus.timeout;
		d20plus.timeout += 2500;
		setTimeout(function() {
			d20plus.log("Running import of [" + name + "]");
			$("#import-remaining").text(d20plus.remaining);
			$("#import-name").text(name);
			d20.journal.refreshJournalList();
			journalFolder = d20.Campaign.get("journalfolder");
			journalFolderObj = JSON.parse(journalFolder);
			items = journalFolderObj.find(function(a) {return a.n && a.n === "Items";});
			// make source folder
			for (i = -1; i < items.i.length; i++) {
				var theFolderName = (findex === 1) ? fname : fname + " " + findex;
				folder = items.i.find(function(f) {return f.n === theFolderName;});
				if (folder) {
					if (folder.i.length >= 90) {
						findex++;
					} else {
						break;
					}
				} else {
					d20.journal.addFolderToFolderStructure(theFolderName, items.id);
					d20.journal.refreshJournalList();
					journalFolder = d20.Campaign.get("journalfolder");
					journalFolderObj = JSON.parse(journalFolder);
					items = journalFolderObj.find(function(a) {return a.n && a.n === "Items";});
					folder = items.i.find(function(f) {return f.n === theFolderName;});
					break;
				}
			}
			if (!folder) {
				console.log("> Failed to find or create source folder!");
				return;
			}
			// build item handout
			d20.Campaign.handouts.create({
				name: name
			}, {
				success: function(handout) {
					var notecontents = "";
					const typeArray = [];
					if (data.wondrous) typeArray.push("Wondrous Item");
					if (data.technology) typeArray.push(data.technology);
					if (data.age) typeArray.push(data.age);
					if (data.weaponCategory) typeArray.push(data.weaponCategory+" Weapon");
					var type = data.type;
					if (data.type) typeArray.push(d20plus.items.parseType(data.type));
					var typestring = typeArray.join(", ");
					var damage = "";
					if (data.dmg1 && data.dmgType) damage = data.dmg1 + " " + Parser.dmgTypeToFull(data.dmgType);
					var armorclass = "";
					if (type === "S") armorclass = "+" + data.ac;
					if (type === "LA") armorclass = data.ac + " + Dex";
					if (type === "MA") armorclass = data.ac + " + Dex (max 2)";
					if (type === "HA") armorclass = data.ac;
					var properties = "";
					if (data.property) {
						var propertieslist = data.property.split(",");
						for (var i = 0; i < propertieslist.length; i++) {
							var a = d20plus.items.parseProperty(propertieslist[i]);
							var b = propertieslist[i];
							if (b === "V") a = a + " (" + data.dmg2 + ")";
							if (b === "T" || b === "A") a = a + " (" + data.range + "ft.)";
							if (b === "RLD") a = a + " (" + data.reload + " shots)";
							if (i > 0) a = ", " + a;
							properties += a;
						}
					}
					var reqAttune = data.reqAttune;
					var attunementstring = "";
					if (reqAttune) {
						if (reqAttune === "YES") {
							attunementstring = " (Requires Attunement)";
						} else if (reqAttune === "OPTIONAL") {
							attunementstring = " (Attunement Optional)";
						} else {
							reqAttune = " (Requires Attunement "+reqAttune+")";
						}
					}
					notecontents += `<p><h3>${data.name}</h3></p><em>${typestring}`;
					if (data.tier) notecontents += ", " + data.tier;
					var rarity = data.rarity;
					var ismagicitem = (rarity !== "None" && rarity !== "Unknown");
					if (ismagicitem) notecontents += ", " + rarity;
					if (attunementstring) notecontents += attunementstring;
					notecontents += `</em>`;
					if (damage) notecontents += `<p><strong>Damage: </strong>${damage}</p>`;
					if (properties) notecontents += `<p><strong>Properties: </strong>${properties}</p>`;
					if (armorclass) notecontents += `<p><strong>Armor Class: </strong>${armorclass}</p>`;
					if (data.weight) notecontents += `<p><strong>Weight: </strong>${data.weight} lbs.</p>`;
					var itemtext = data.entries ? data.entries : "";
					const renderer = new EntryRenderer();
					const renderStack = [];
					const entryList = {type: "entries", entries: data.entries};
					renderer.setBaseUrl(BASE_SITE_URL);
					renderer.recursiveEntryRender(entryList, renderStack, 1);
					var textstring = renderStack.join("");
					if (textstring) {
						notecontents += `<hr>`;
						notecontents += textstring;
					}
					console.log(notecontents);
					handout.updateBlobs({notes: notecontents});
					var injournals = ($("#import-showplayers").prop("checked")) ? ["all"].join(",") : "";
					handout.save({
						notes: (new Date).getTime(),
						inplayerjournals: injournals
					});
					d20.journal.addItemToFolderStructure(handout.id, folder.id);
				}
			});
			d20plus.remaining--;
			if (d20plus.remaining === 0) {
				setTimeout(function() {
					$("#import-name").text("DONE!");
					$("#import-remaining").text("0");
					d20plus.bindDropLocations();
				}, 1000);
			}
		}, timeout);
	};

	d20plus.items.parseType = function(type) {
		const result = Parser.itemTypeToAbv(type);
		return result ? result : "n/a";
	};

	d20plus.items.parseDamageType = function(damagetype) {
		const result = Parser.dmgTypeToFull(damagetype);
		return result ? result : false;
	};

	d20plus.items.parseProperty = function(property) {
		if (property === "A") return "ammunition";
		if (property === "AF") return "ammunition";
		if (property === "BF") return "burst fire";
		if (property === "F") return "finesse";
		if (property === "H") return "heavy";
		if (property === "L") return "light";
		if (property === "LD") return "loading";
		if (property === "R") return "reach";
		if (property === "RLD") return "reload";
		if (property === "S") return "special";
		if (property === "T") return "thrown";
		if (property === "2H") return "two-handed";
		if (property === "V") return "versatile";
		return "n/a";
	};

	// Import Psionics button was clicked
	d20plus.psionics.button = function () {
		var url = $("#import-psionics-url").val();
		if (url !== null) d20plus.psionics.load(url);
	}

	// Fetch psionic data from file
	d20plus.psionics.load = function (url) {
		d20plus.importer.simple(url, "psionic", "psionic", d20plus.psionics.import, false);
	};

	// Import individual psionics
	d20plus.psionics.import = function (data, overwrite, deleteExisting) {
		const subFolder = data.name[0].toUpperCase();
		d20plus.importer.initFolder(data, overwrite, deleteExisting, "Psionics", subFolder, d20plus.psionics.handoutBuilder)
	};

	d20plus.psionics.handoutBuilder = function (name, data, folder) {
		d20.Campaign.handouts.create({
			name: name
		}, {
			success: function (handout) {
				function renderTalent() {
					const renderStack = [];
					renderer.recursiveEntryRender(({entries: data.entries, type: "entries"}), renderStack);
					return renderStack.join(" ");
				}

				const renderer = new EntryRenderer();
				renderer.setBaseUrl(BASE_SITE_URL);
				data.data = {
					Category: "Psionics"
				};
				const gmNotes = JSON.stringify(data);

				const baseNoteContents = `
				<h3>${data.name}</h3>
				<p><em>${data.type === "D" ? `${data.order} ${Parser.psiTypeToFull(data.type)}` : `${Parser.psiTypeToFull(data.type)}`}</em></p>
				${data.type === "D" ? `${EntryRenderer.psionic.getDisciplineText(data, renderer)}` : `${renderTalent()}`}
				`

				const noteContents = `${baseNoteContents}<br><del>${gmNotes}</del>`;

				console.log(noteContents);
				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				const injournals = ($("#import-showplayers").prop("checked")) ? ["all"].join(",") : "";
				handout.save({notes: (new Date).getTime(), inplayerjournals: injournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	// Import Feats button was clicked
	d20plus.feats.button = function () {
		var url = $("#import-feats-url").val();
		if (url !== null) d20plus.feats.load(url);
	};

	// Fetch feat data from file
	d20plus.feats.load = function (url) {
		d20plus.importer.simple(url, "feat", "feat", d20plus.feats.import, true);
	};

	// Import individual feats
	d20plus.feats.import = function (data, overwrite, deleteExisting) {
		const subFolder = data.name[0].toUpperCase();
		d20plus.importer.initFolder(data, overwrite, deleteExisting, "Feats", subFolder, d20plus.feats.handoutBuilder)
	};

	d20plus.feats.handoutBuilder = function (name, data, folder) {
		d20.Campaign.handouts.create({
			name: name
		}, {
			success: function (handout) {

				const renderer = new EntryRenderer();
				renderer.setBaseUrl(BASE_SITE_URL);
				const prerequisite = EntryRenderer.feat.getPrerequisiteText(data.prerequisite);
				EntryRenderer.feat.mergeAbilityIncrease(data);

				const renderStack = [];
				renderer.recursiveEntryRender({entries: data.entries}, renderStack, 2);
				const rendered = renderStack.join("");

				const r20json = {
					"name": data.name,
					"content": `${prerequisite ? `**Prerequisite**: ${prerequisite}\n\n` : ""}${$(rendered).text()}`,
					"Vetoolscontent": d20plus.importer.getCleanText(rendered),
					"htmlcontent": "",
					"data": {
						"Category": "Feats"
					}
				};
				const gmNotes = JSON.stringify(r20json);

				const baseNoteContents = `${prerequisite ? `<p><i>Prerequisite: ${prerequisite}.</i></p> ` : ""}${rendered}`;
				const noteContents = `${baseNoteContents}<del>${gmNotes}</del>`;

				console.log(noteContents);
				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				var injournals = ($("#import-showplayers").prop("checked")) ? ["all"].join(",") : "";
				handout.save({notes: (new Date).getTime(), inplayerjournals: injournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.importer.initFolder = function (data, overwrite, deleteExisting, parentFolderName, folderName, handoutBuilder) {
		var fname = $("#organize-by-source").prop("checked") ? Parser.sourceJsonToFull(data.source) : folderName;
		var findex = 1;
		var folder;
		d20.journal.refreshJournalList();
		var journalFolder = d20.Campaign.get("journalfolder");
		if (journalFolder === "") {
			d20.journal.addFolderToFolderStructure("Characters");
			d20.journal.refreshJournalList();
			journalFolder = d20.Campaign.get("journalfolder");
		}
		var journalFolderObj = JSON.parse(journalFolder);
		var parentFolder = journalFolderObj.find(function(a) {return a.n && a.n === parentFolderName;});
		if (!parentFolder) d20.journal.addFolderToFolderStructure(parentFolderName);
		d20.journal.refreshJournalList();
		journalFolder = d20.Campaign.get("journalfolder");
		journalFolderObj = JSON.parse(journalFolder);
		parentFolder = journalFolderObj.find(function(a) {return a.n && a.n === parentFolderName;});
		var name = data.name || "(Unknown Name)";
		// check for duplicates
		var dupe = false;
		$.each(parentFolder.i, function(i, v) {
			if (v.id !== undefined) {
				if (d20plus.objectExists(parentFolder.i, v.id, name)) dupe = true;
				if (overwrite || deleteExisting) d20plus.deleteObject(parentFolder.i, v.id, name);
			}
		});
		if (deleteExisting || (dupe && !overwrite)) return;
		d20plus.remaining++;
		if (d20plus.timeout === 500) {
			$("#d20plus-import").dialog("open");
			$("#import-remaining").text("d20plus.remaining");
		}
		timeout = d20plus.timeout;
		d20plus.timeout += 2500;
		setTimeout(function() {
			d20plus.log("Running import of [" + name + "]");
			$("#import-remaining").text(d20plus.remaining);
			$("#import-name").text(name);
			d20.journal.refreshJournalList();
			journalFolder = d20.Campaign.get("journalfolder");
			journalFolderObj = JSON.parse(journalFolder);
			parentFolder = journalFolderObj.find(function(a) {return a.n && a.n === parentFolderName;});
			// make source folder
			for (i = -1; i < parentFolder.i.length; i++) {
				var theFolderName = (findex === 1) ? fname : fname + " " + findex;
				folder = parentFolder.i.find(function(f) {return f.n === theFolderName;});
				if (folder) {
					if (folder.i.length >= 90) {
						findex++;
					} else {
						break;
					}
				} else {
					d20.journal.addFolderToFolderStructure(theFolderName, parentFolder.id);
					d20.journal.refreshJournalList();
					journalFolder = d20.Campaign.get("journalfolder");
					journalFolderObj = JSON.parse(journalFolder);
					parentFolder = journalFolderObj.find(function(a) {return a.n && a.n === parentFolderName;});
					folder = parentFolder.i.find(function(f) {return f.n === theFolderName;});
					break;
				}
			}
			if (!folder) {
				console.log("> Failed to find or create source folder!");
				return;
			}

			handoutBuilder(name, data, folder);

			d20plus.remaining--;
			if (d20plus.remaining === 0) {
				setTimeout(function() {
					$("#import-name").text("DONE!");
					$("#import-remaining").text("0");
					d20plus.bindDropLocations();
				}, 1000);
			}
			d20plus.log(`Finished import of [${name}]`);
		}, timeout);
	}

	d20plus.importer.simple = function (url, listProp, stringItemType, importFunction, addSource) {
		$("a.ui-tabs-anchor[href='#journal']").trigger("click");
		const x2js = new X2JS();
		let datatype = $("#import-datatype").val();
		if (datatype === "json") datatype = "text";
		$.ajax({
			type: "GET",
			url: url,
			dataType: datatype,
			success: function (data) {
				try {
					d20plus.log("Importing Data (" + $("#import-datatype").val().toUpperCase() + ")");
					data = (datatype === "XML") ? x2js.xml2json(data) : JSON.parse(data.replace(/^\s*var\s*.*\s*=\s*/g, ""));
					data[listProp].sort(function (a, b) {
						if (a.name < b.name) return -1;
						if (a.name > b.name) return 1;
						return 0;
					});
					const $impList = $("#import-list");
					const $l = $impList.find(".list");
					$l.html("");
					// build checkbox list
					data[listProp].forEach((it, i) => {
						try {
							$l.append(`<label><input type="checkbox" data-listid="${i}"> <span class="name">${it.name}${addSource ? ` (${Parser.sourceJsonToAbv(it.source)})` : ""}</span></label>`);
						} catch (e) {
							console.log("Error building list!", e);
							d20plus.addImportError(it.name);
						}
					});
					const options = {
						valueNames: ["name"]
					};
					const importList = new List ("import-list", options);
					// reset search
					$impList.find(".search").val("");
					importList.search("");

					$("#import-options").find("label").hide();
					$("#import-overwrite").parent().show();
					$("#delete-existing").parent().show();
					$("#organize-by-source").parent().show();
					$("#import-showplayers").parent().show();

					const $importWindow = $("#d20plus-importlist");
					$importWindow.dialog("open");

					const $selectAllBox = $importWindow.find("input#importlist-selectall");
					$selectAllBox.unbind("click");
					$selectAllBox.prop("checked", false);
					$selectAllBox.bind("click", () => {
						d20plus._importToggleSelectAll(importList, $selectAllBox);
					});

					$importWindow.find("button").unbind("click");
					$importWindow.find("button#importstart").bind("click", () => {
						d20plus._importHandleStart(importList, data[listProp], stringItemType, importFunction)
					})
				} catch (e) {
					console.log("> Exception ", e);
				}
			},
			error: function(jqXHR, exception) {
				d20plus.handleAjaxError(jqXHR, exception);
			}
		});
		d20plus.timeout = 500;
	};

	d20plus.importer.getCleanText = function (str) {
		const $ele = $(str);
		$ele.find("p, li, br").append("\n\n");
		return $ele.text();
	}

	String.prototype.capFirstLetter = function() {
		return this.replace(/\w\S*/g, function(w) {return w.charAt(0).toUpperCase() + w.substr(1).toLowerCase();});
	};

	d20plus.dmscreenButton = `<li id="dmscreen-button" tip="DM Screen">
	<span class="pictos">N</span>
</li>`;

	// This is an older version of the repo. The newer version has a security error when loaded over SSL :(
	d20plus.dmscreenHtml = `<div id="dmscreen-dialog">
	<iframe src="//ftwinston.github.io/5edmscreen/mobile"></iframe>
</div>`;

	d20plus.miniInitStyle = `
		#initiativewindow button.initmacrobutton {
			padding: 1px 4px;
		}

		#initiativewindow input {
			font-size: 8px;
		}

		#initiativewindow ul li span.name {
			font-size: 13px;
			padding-top: 0;
			padding-left: 4px;
			margin-top: -3px;
		}

		#initiativewindow ul li img {
			min-height: 15px;
			max-height: 15px;
		}

		#initiativewindow ul li {
			min-height: 15px;
		}

		#initiativewindow ul li span.initiative,
		#initiativewindow ul li span.ac,
		#initiativewindow ul li span.hp,
		#initiativewindow ul li span.pp,
		#initiativewindow ul li span.cr,
		#initiativewindow ul li span.initmacro {
			font-size: 12px;
			font-weight: bold;
			text-align: right;
			float: right;
			padding: 0 5px;
			width: 7%;
			min-height: 20px;
		}

		#initiativewindow ul li .controls {
			padding: 0 3px;
		}
	`;

	d20plus.setInitiativeShrink = function(doShrink) {
		const customStyle = $(`#dynamicStyle`);
		if (doShrink) {
			customStyle.html(d20plus.miniInitStyle);
		} else {
			customStyle.html("");
		}
	};

	d20plus.difficultyHtml = `<span class="difficulty" style="position: absolute"></span>`;

	d20plus.multipliers = [1, 1.5, 2, 2.5, 3, 4, 5];

	d20plus.formulas = {
		"ogl": {
			"CR": "@{npc_challenge}",
			"AC": "@{ac}",
			"NPCAC": "@{npc_ac}",
			"HP": "@{hp}",
			"PP": "@{passive_wisdom}",
			"macro": ""
		},
		"community": {
			"CR": "@{npc_challenge}",
			"AC": "@{AC}",
			"NPCAC": "@{AC}",
			"HP": "@{HP}",
			"PP": "10 + @{perception}",
			"macro": ""
		},
		"shaped": {
			"CR": "@{challenge}",
			"AC": "@{AC}",
			"NPCAC": "@{AC}",
			"HP": "@{HP}",
			"PP": "@{repeating_skill_$11_passive}",
			"macro": "shaped_statblock"
		}
	};

	d20plus.configEditorHTML = `
<div id="d20plus-configeditor" title="Config Editor" style="position: relative">
	<!-- populate with js -->
</div>`

	d20plus.configEditorButtonBarHTML = `
<div class="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix">
	<div class="ui-dialog-buttonset">
		<button type="button" id="configsave" alt="Save" title="Save Config" class="btn" role="button" aria-disabled="false">
			<span>Save</span>
		</button>
	</div>
</div>
`;

	d20plus.importListHTML = `<div id="d20plus-importlist" title="Import...">
	<p><input type="checkbox" title="Select all" id="importlist-selectall"></p>
	<p>
	<span id="import-list"><input class="search" autocomplete="off" placeholder="Search list..."><br><span class="list" style="max-height: 600px; overflow-y: scroll; display: block; margin-top: 1em;"></span></span>
	</p>
	<p id="import-options">
	<label><input type="checkbox" title="Import by source" id="organize-by-source"> Import by source instead of type?</label>
	<label><input type="checkbox" title="Make items visible to all players" id="import-showplayers" checked> Make handouts visible to all players?</label>
	<label><input type="checkbox" title="Overwrite existing" id="import-overwrite"> Overwrite existing entries?</label>
	<label><input type="checkbox" title="Delete existing" id="delete-existing"> ONLY delete selected entries?</label>
	</p>
	<button type="button" id="importstart" alt="Load" title="Load Monsters" class="btn" role="button" aria-disabled="false">
	<span>Load</span>
	</button>
</div>`;

	d20plus.importDialogHtml = `<div id="d20plus-import" title="Importing...">
	<p>
	<h3 id="import-name"></h3>
	</p>
	<span id="import-remaining"></span> remaining
	<p></p>
	Errors: <span id="import-errors">0</span>
</div>`;

	d20plus.refreshButtonHtml = `<button type="button" alt="Refresh" title="Refresh" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only pictos bigbuttonwithicons" role="button" aria-disabled="false">
	<span class="ui-button-text" style="">1</span>
</button>`;

	d20plus.settingsHtml = `<hr>
<h3>5etoolsR20 v${d20plus.version}</h3>
<label>Data Type:</label>
<select id="import-datatype" value="json">
	<option value="json">JSON</option>
	<option value="xml">XML</option>
</select>
<h4>Monster Importing</h4>
<p style="margin-bottom: 0;">
<label for="import-monster-url">Monster Data URL:</label>
<select id="button-monsters-select">
	<!-- populate with JS-->
</select>
<input type="text" id="import-monster-url">
</p>
<p><a class="btn" href="#" id="button-monsters-load">Import Monsters</a></p>
<p><a class="btn" href="#" id="button-monsters-load-all" title="Standard sources only; no third-party or UA">Import Monsters From All Sources</a></p>
<h4>Item Importing</h4>
<p>
<label for="import-items-url">Item Data URL:</label>
<input type="text" id="import-items-url" value="${itemdataurl}">
<a class="btn" href="#" id="import-items-load">Import Items</a>
</p>
<h4>Spell Importing</h4>
<p style="margin-bottom: 0;">
<label for="import-spell-url">Spell Data URL:</label>
<select id="button-spell-select">
	<!-- populate with JS-->
</select>
<input type="text" id="import-spell-url">
</p>
<p><a class="btn" href="#" id="button-spells-load">Import Spells</a><p/>
<p><a class="btn" href="#" id="button-spells-load-all" title="Standard sources only; no third-party or UA">Import Spells From All Sources</a></p>
<h4>Psionic Importing</h4>
<p>
<label for="import-psionics-url">Psionics Data URL:</label>
<input type="text" id="import-psionics-url" value="${psionicdataurl}">
<a class="btn" href="#" id="import-psionics-load">Import Psionics</a>
</p>
<h4>Feat Importing</h4>
<p>
<label for="import-feats-url">Feat Data URL:</label>
<input type="text" id="import-feats-url" value="${featdataurl}">
<a class="btn" href="#" id="import-feats-load">Import Feats</a>
</p>
<div style="width: 1px; height: 5px;"/>
<a class="btn bind-drop-locations" href="#" id="bind-drop-locations">Bind Drag-n-Drop</a>
<div style="width: 1px; height: 5px;"/>
<a class="btn bind-tokens" href="#" id="bind-tokens" title="Lets you update token HP and have the tracker window update">Bind Tokens to Tracker</a>
<div style="width: 1px; height: 5px;"/>
<a class="btn" href="#" id="button-edit-config">Edit Config</a>
<style id="dynamicStyle"></style>`;

	d20plus.cssRules = [
		{
			s: "#initiativewindow ul li span.initiative,#initiativewindow ul li span.ac,#initiativewindow ul li span.hp,#initiativewindow ul li span.pp,#initiativewindow ul li span.cr,#initiativewindow ul li span.initmacro",
			r: "font-size: 25px;font-weight: bold;text-align: right;float: right;padding: 2px 5px;width: 10%;min-height: 20px;"
		},
		{
			s: "#initiativewindow ul li span.editable input",
			r: "width: 100%; box-sizing: border-box;height: 100%;"
		},
		{
			s: "#initiativewindow div.header",
			r: "height: 30px;"
		},
		{
			s: "#initiativewindow div.header span",
			r: "cursor: default;font-size: 15px;font-weight: bold;text-align: right;float: right;width: 10%;min-height: 20px;padding: 5px;"
		},
		{
			s: ".ui-dialog-buttonpane span.difficulty",
			r: "display: inline-block;padding: 5px 4px 6px;margin: .5em .4em .5em 0;font-size: 18px;"
		},
		{
			s: ".ui-dialog-buttonpane.buttonpane-absolute-position",
			r: "position: absolute;bottom: 0;box-sizing: border-box;width: 100%;"
		},
		{
			s: ".ui-dialog.dialog-collapsed .ui-dialog-buttonpane",
			r: "position: initial;"
		},
		{
			s: "#dmscreen-dialog iframe",
			r: "width: 100%;height: 100%;position: absolute;top: 0;left: 0;border: 0;"
		},
		{
			s: ".token .cr,.header .cr",
			r: "display: none!important;"
		},
		{
			s: "li.handout.compendium-item .namecontainer",
			r: "box-shadow: inset 0px 0px 25px 2px rgb(195, 239, 184);"
		},
		{
			s: ".bind-drop-locations:active",
			r: "box-shadow: inset 0px 0px 25px 2px rgb(195, 239, 184);"
		},
		{
			s: "div.config-table-wrapper",
			r: "min-height: 200px; width: 100%; height: 100%; max-height: 600px; overflow-y: auto;"
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
			r: "vertical-align: middle;"
		},
		{
			s: "del",
			r: "display: none;"
		}
	];

	d20plus.initiativeHeaders = `<div class="header">
	<span class="ui-button-text initmacro">Sheet</span>
	<span class="initiative" alt="Initiative" title="Initiative">Init</span>
  <span class="pp" alt="Passive Perception" title="Passive Perception">PP</span>
  <span class="ac" alt="AC" title="AC">AC</span>
  <span class="cr" alt="CR" title="CR">CR</span>
  <span class="hp" alt="HP" title="HP">HP</span>
</div>`;

	// FIXME use the right bar for HP
	d20plus.initiativeTemplate = `<script id="tmpl_initiativecharacter" type="text/html">
	<![CDATA[
		<li class='token <$ if (this.layer === "gmlayer") { $>gmlayer<$ } $>' data-tokenid='<$!this.id$>' data-currentindex='<$!this.idx$>'>
			<span alt='Sheet Macro' title='Sheet Macro' class='initmacro'>
				<button type='button' class='initmacrobutton ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only pictos' role='button' aria-disabled='false'>
				<span class='ui-button-text'>N</span>
				</button>
			</span>
			<span alt='Initiative' title='Initiative' class='initiative <$ if (this.iseditable) { $>editable<$ } $>'>
				<$!this.pr$>
			</span>
			<$ var token = d20.Campaign.pages.get(d20.Campaign.activePage()).thegraphics.get(this.id); $>
			<$ var char = (token) ? token.character : null; $>
			<$ if (char) { $>
				<$ var npc = char.attribs.find(function(a){return a.get("name").toLowerCase() == "npc" }); $>
				<$ var passive = char.autoCalcFormula('@{passive}') || char.autoCalcFormula('||PP||'); $>
				<span class='pp' alt='Passive Perception' title='Passive Perception'><$!passive$></span>
				<span class='ac' alt='AC' title='AC'>
					<$ if(npc && npc.get("current") == "1") { $>
						<$!char.autoCalcFormula('||NPCAC||')$>
					<$ } else { $>
						<$!char.autoCalcFormula('||AC||')$>
					<$ } $>
				</span>
				<span class='cr' alt='CR' title='CR'>
					<$ if(npc && npc.get("current") == "1") { $>
						<$!char.attribs.find(function(e) { return e.get("name").toLowerCase() === "npc_challenge" }).get("current")$>
					<$ } $>
				</span>
				<span class='hp editable' alt='HP' title='HP'>
					<$ if(npc && npc.get("current") == "1") { $>
						<$!token.attributes.bar1_value$>
					<$ } else { $>
						<$!char.autoCalcFormula('||HP||')$>
					<$ } $>
				</span>
			<$ } $>
			<$ if (this.avatar) { $><img src='<$!this.avatar$>' /><$ } $>
			<span class='name'><$!this.name$></span>
				<div class='clear' style='height: 0px;'></div>
				<div class='controls'>
			<span class='pictos remove'>#</span>
			</div>
		</li>
	]]>
</script>`;

	/* object.watch polyfill by Eli Grey, http://eligrey.com */
	if (!Object.prototype.watch) {
		Object.defineProperty(Object.prototype, "watch", {
			enumerable: false,
			configurable: true,
			writable: false,
			value: function(prop, handler) {
				var
					oldval = this[prop],
					newval = oldval,
					getter = function() {
						return newval;
					},
					setter = function(val) {
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
			value: function(prop) {
				var val = this[prop];
				delete this[prop];
				this[prop] = val;
			}
		});
	}
	/* end object.watch polyfill */

	window.d20ext = {};
	window.watch("d20ext", function(id, oldValue, newValue) {
		d20plus.log("> Set Development");
		newValue.environment = "development";
		return newValue;
	});
	window.d20 = {};
	window.watch("d20", function(id, oldValue, newValue) {
		d20plus.log("> Obtained d20 variable");
		window.unwatch("d20ext");
		window.d20ext.environment = "production";
		newValue.environment = "production";
		return newValue;
	});
	d20plus.log("> Injected");
};

// Inject
if (window.top === window.self) unsafeWindow.eval("(" + D20plus.toString() + ")('" + GM_info.script.version + "')");
