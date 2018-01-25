// ==UserScript==
// @name         5etoolsR20
// @namespace    https://rem.uz/
// @license      MIT (https://opensource.org/licenses/MIT)
// @version      1.0.1
// @updateURL    https://get.5etools.com/5etoolsR20.user.js
// @downloadURL  https://get.5etools.com/5etoolsR20.user.js
// @description  Enhance your Roll20 experience
// @author       5egmegaanon/astranauta/MrLabRat/TheGiddyLimit/DBAWiseMan/BDeveau/Remuz/Callador Julaan/Erogroth
// @match        https://app.roll20.net/editor/
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

/* eslint no-console: "off" */

var D20plus = function(version) {

	const BASE_SITE_URL = "https://5etools.com/";

	const DATA_URL = BASE_SITE_URL+"data/";
	const JS_URL = BASE_SITE_URL+"js/";
	const IMG_URL = BASE_SITE_URL+"img/";

	const CONFIG_HANDOUT = '5etools';
	const ART_HANDOUT = "5etools-art";

	// build a big dictionary of sheet properties to be used as reference throughout // TODO use these as reference throughout
	function SheetAttribute (name, ogl, shaped) {
		this.name = name;
		this.ogl = ogl;
		this.shaped = shaped;
	}
	const NPC_SHEET_ATTRIBUTES= {};
	// these (other than the name, which is for display only) are all lowercased; any comparison should be lowercased
	NPC_SHEET_ATTRIBUTES["empty"] = new SheetAttribute("--Empty--", "", "");
	// TODO: implement custom entry (enable textarea)
	//NPC_SHEET_ATTRIBUTES["custom"] = new SheetAttribute("-Custom-", "-Custom-", "-Custom-");
	NPC_SHEET_ATTRIBUTES["npc_hpbase"] = new SheetAttribute("Avg HP", "npc_hpbase", "npc_hpbase");
	NPC_SHEET_ATTRIBUTES["npc_ac"] = new SheetAttribute("AC", "npc_ac", "ac");
	NPC_SHEET_ATTRIBUTES["passive"] = new SheetAttribute("Passive Perception", "passive", "passive");
	NPC_SHEET_ATTRIBUTES["npc_hpformula"] = new SheetAttribute("HP Formula", "npc_hpformula", "npc_hpformula");
	NPC_SHEET_ATTRIBUTES["npc_speed"] = new SheetAttribute("Speed", "npc_speed", "npc_speed");
	NPC_SHEET_ATTRIBUTES["spell_save_dc"] = new SheetAttribute("Spell Save DC", "spell_save_dc", "spell_save_DC");

	// Old formulas entered in as sheet attributes, consider keeping these separate
	NPC_SHEET_ATTRIBUTES["npc_challenge"] = new SheetAttribute("CR", "npc_challenge", "challenge");
	NPC_SHEET_ATTRIBUTES["hp"] = new SheetAttribute("Current HP", "hp", "HP");

	const CONFIG_OPTIONS = {
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
			},
			"tokenactions": {
				"name": "Add TokenAction Macros on Import",
				"default": true,
				"_type": "boolean"
			},
			"whispermode": {
				"name": "Whipser Mode on Import",
				"default": "Toggle (Default GM)",
				"_type": "_WHISPERMODE"
			},
			"advantagemode": {
				"name": "Advantage Mode on Import",
				"default": "Toggle (Default Advantage)",
				"_type": "_ADVANTAGEMODE"
			},
			"damagemode": {
				"name": "Auto Roll Damage Mode on Import",
				"default": "Auto Roll",
				"_type": "_DAMAGEMODE"
			}

		},
		"interface": {
			"_name": "Interface",
			"customTracker": {
				"name": "Add Additional Info to Tracker",
				"default": true,
				"_type": "boolean"
			},
			"trackerCol1": {
				"name": "Tracker Column 1",
				"default": "HP",
				"_type": "_FORMULA"
			},
			"trackerCol2": {
				"name": "Tracker Column 2",
				"default": "AC",
				"_type": "_FORMULA"
			},
			"trackerCol3": {
				"name": "Tracker Column 3",
				"default": "PP",
				"_type": "_FORMULA"
			},
			"minifyTracker": {
				"name": "Shrink Initiative Tracker Text",
				"default": false,
				"_type": "boolean"
			},
			"showDifficulty": {
				"name": "Show Difficutlty in Tracker",
				"default": true,
				"_type": "boolean"
			}
		},
		"import": {
			"_name": "Import",
			"importIntervalHandout": {
				"name": "Rest Time between Each Handout (msec)",
				"default": 100,
				"_type": "integer"
			},
			"importIntervalCharacter": {
				"name": "Rest Time between Each Character (msec)",
				"default": 2500,
				"_type": "integer"
			}
		}
	};

	const spellDataDir = `${DATA_URL}spells/`;
	let spellDataUrls = {};
	let spellMetaData = {};

	const spellmetaurl = `${spellDataDir}roll20.json`;

	const monsterDataDir = `${DATA_URL}bestiary/`;
	let monsterDataUrls = {};

	const adventureDataDir = `${DATA_URL}adventure/`;
	let adventureMetadata = {};

	const itemdataurl = `${DATA_URL}items.json`;
	const featdataurl = `${DATA_URL}feats.json`;
	const psionicdataurl = `${DATA_URL}psionics.json`;
	const objectdataurl = `${DATA_URL}objects.json`;
	const classdataurl = `${DATA_URL}classes.json`;
	const backgrounddataurl = `${DATA_URL}backgrounds.json`;

	const d20plus = {
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
		objects: {},
		classes: {},
		subclasses: {},
		backgrounds: {},
		adventures: {},
		initiative: {},
		config: {},
		importer: {},
		art: {}
	};

	d20plus.advantageModes = ["Toggle (Default Advantage)", "Toggle", "Toggle (Default Disadvantage)", "Always", "Query", "Never"];
	d20plus.whisperModes = ["Toggle (Default GM)", "Toggle (Default Public)", "Always", "Query", "Never"];
	d20plus.damageModes = ["Auto Roll", "Don't Auto Roll"];

	d20plus.formulas = {
		_options: ["--Empty--", "AC", "HP", "PP"],
		"ogl": {
			"cr": "@{npc_challenge}",
			"ac": "@{ac}",
			"npcac": "@{npc_ac}",
			"hp": "@{hp}",
			"pp": "@{passive_wisdom}",
			"macro": ""
		},
		"community": {
			"cr": "@{npc_challenge}",
			"ac": "@{AC}",
			"npcac": "@{AC}",
			"hp": "@{HP}",
			"pp": "10 + @{perception}",
			"macro": ""
		},
		"shaped": {
			"cr": "@{challenge}",
			"ac": "@{AC}",
			"npcac": "@{AC}",
			"hp": "@{HP}",
			"pp": "@{repeating_skill_$11_passive}",
			"macro": "shaped_statblock"
		}
	};

	d20plus.scripts = [
		{name: "listjs", url: "https://raw.githubusercontent.com/javve/list.js/v1.5.0/dist/list.min.js"},
		{name: "5etoolsutils", url: `${JS_URL}utils.js`},
		{name: "5etoolsrender", url: `${JS_URL}entryrender.js`}
	];

	d20plus.json = [
		{name: "spell index", url: `${spellDataDir}index.json`},
		{name: "spell metadata", url: spellmetaurl},
		{name: "bestiary index", url: `${monsterDataDir}index.json`},
		{name: "adventures index", url: `${DATA_URL}adventures.json`}
	];

	// add JSON index/metadata
	d20plus.addJson = function (onLoadFunction) {
		const onEachLoadFunction = function (name, url, data) {
			if (name === "spell index") spellDataUrls = data;
			else if (name === "spell metadata") spellMetaData = data;
			else if (name === "bestiary index") monsterDataUrls = data;
			else if (name === "adventures index") adventureMetadata = data;
			else throw new Error(`Unhandled data from JSON ${name} (${url})`);

			d20plus.log(`> JSON [${name}] Loaded`);
		};
		d20plus.chainLoad(d20plus.json, 0, onEachLoadFunction, onLoadFunction);

		// TODO load this from somewhere
		d20plus.art.default = [
			{
				name: "Phoenix",
				url: "http://www.discgolfbirmingham.com/wordpress/wp-content/uploads/2014/04/phoenix-rising.jpg"
			}
		]
	};

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
				notecontents = "The GM notes contain config options saved between sessions. If you want to wipe your saved settings, delete this handout and reload roll20. If you want to edit your settings, click the \"Edit Config\" button in the <b>Settings</b> (cog) panel.";

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
		return d20.Campaign.handouts.models.find(function (handout) {
			return handout.attributes.name.toLowerCase() === CONFIG_HANDOUT;
		});
	};

	d20plus.getArtHandout = function () {
		return d20.Campaign.handouts.models.find((handout) => {
			return handout.attributes.name.toLowerCase() === ART_HANDOUT;
		});
	};

	d20plus.loadConfigFailed = false;
	d20plus.loadConfig = function(nextFn) {
		let configHandout = d20plus.getConfigHandout();

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
					const decoded = decodeURIComponent(gmnotes);

					try {
						d20plus.config = JSON.parse(decoded);

						d20plus.log("> Config Loaded:");
						d20plus.log(d20plus.config);
						nextFn();
					} catch (e) {
						if (!d20plus.loadConfigFailed) {
							// prevent infinite loops
							d20plus.loadConfigFailed = true;

							d20plus.log("> Corrupted config! Rebuilding...");
							d20plus.makeDefaultConfig(() => {
								d20plus.loadConfig(nextFn)
							});
						} else {
							// if the config fails, continue to load anyway
							nextFn();
						}
					}
				});
			}
		}
	};

	d20plus.loadArt = function (nextFn) {
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
	};

	d20plus.handleConfigChange = function () {
		d20plus.setInitiativeShrink(d20plus.getCfgVal("interface", "minifyTracker"));
		d20.Campaign.initiativewindow.rebuildInitiativeList();
		d20plus.updateDifficulty();
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

	d20plus.getRawCfgVal = function (group, key) {
		if (d20plus.config[group] === undefined) return undefined;
		if (d20plus.config[group][key] === undefined) return undefined;
		return d20plus.config[group][key];
	};

	d20plus.getCfgVal = function (group, key) {
		if (d20plus.config[group] === undefined) return undefined;
		if (d20plus.config[group][key] === undefined) return undefined;
		if (CONFIG_OPTIONS[group][key]._type === "_SHEET_ATTRIBUTE") {
			return NPC_SHEET_ATTRIBUTES[d20plus.config[group][key]][d20plus.sheet];
		}
		return d20plus.config[group][key];
	};

	d20plus.getCfgDefaultVal = function (group, key) {
		if (CONFIG_OPTIONS[group] === undefined) return undefined;
		if (CONFIG_OPTIONS[group][key] === undefined) return undefined;
		return CONFIG_OPTIONS[group][key].default
	};

	// get the user config'd token HP bar
	d20plus.getCfgHpBarNumber = function () {
		const bars = [
			d20plus.getCfgVal("token", "bar1"),
			d20plus.getCfgVal("token", "bar2"),
			d20plus.getCfgVal("token", "bar3")
		];
		return bars[0] === "npc_hpbase" ? 1 : bars[1] === "npc_hpbase" ? 2 : bars[2] === "npc_hpbase" ? 3 : null;
	};

	// Helpful for checking if a boolean option is set even if false
	d20plus.hasCfgVal = function (group, key) {
		if (d20plus.config[group] === undefined) return undefined;
		return d20plus.config[group][key] !== undefined;
	};

	d20plus.setCfgVal = function(group, key, val) {
		if (d20plus.config[group] === undefined) d20plus.config[group] = {};
		d20plus.config[group][key] = val;
	};

	d20plus.getDefaultConfig = function() {
		const outCpy = {};
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

	// this should be do-able with built-in roll20 code -- someone with hacker-tier reverse engineering skills pls help
	d20plus.makeTabPane = function ($addTo, headers, content) {
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
	};

	d20plus.openConfigEditor = function () {
		const cEdit = $("#d20plus-configeditor");
		cEdit.dialog("open");

		if (cEdit.attr("hastabs") !== "YES") {
			cEdit.attr("hastabs", "YES");
			const appendTo = $(`<div/>`);
			cEdit.prepend(appendTo);

			const configFields = {};

			const sortedKeys = Object.keys(CONFIG_OPTIONS).sort((a, b) => ascSort(CONFIG_OPTIONS[a]._name, CONFIG_OPTIONS[b]._name));
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

				const sortedTabKeys = Object.keys(cfgGroup).filter(k => !k.startsWith("_"));
				sortedTabKeys.forEach(grpK => {
					const prop = cfgGroup[grpK];

					const toAdd = $(`<tr><td>${prop.name}</td></tr>`);

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
							const sortedNpcsAttKeys = Object.keys(NPC_SHEET_ATTRIBUTES).sort((at1, at2) => ascSort(NPC_SHEET_ATTRIBUTES[at1].name, NPC_SHEET_ATTRIBUTES[at2].name));
							const field = $(`<select class="cfg_grp_${cfgK}" data-item="${grpK}">${sortedNpcsAttKeys.map(npcK => `<option value="${npcK}">${NPC_SHEET_ATTRIBUTES[npcK].name}</option>`)}</select>`);
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
							const field = $(`<input type="number" value="${d20plus.getCfgVal(cfgK, grpK)}" placeholder="${d20plus.getCfgDefaultVal(cfgK, grpK)}">`);

							configFields[cfgK][grpK] = () => {
								return Number(field.val());
							};

							const td = $(`<td/>`).append(field);
							toAdd.append(td);
							break;
						}
						case "_FORMULA": {
							const $field = $(`<select class="cfg_grp_${cfgK}" data-item="${grpK}">${d20plus.formulas._options.sort().map(opt => `<option value="${opt}">${opt}</option>`)}</select>`);

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
							const $field = $(`<select class="cfg_grp_${cfgK}" data-item="${grpK}">${d20plus.whisperModes.map(mode => `<option value="${mode}">${mode}</option>`)}</select>`);

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
							const $field = $(`<select class="cfg_grp_${cfgK}" data-item="${grpK}">${d20plus.advantageModes.map(mode => `<option value="${mode}">${mode}</option>`)}</select>`);

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
							const $field = $(`<select class="cfg_grp_${cfgK}" data-item="${grpK}">${d20plus.damageModes.map(mode => `<option value="${mode}">${mode}</option>`)}</select>`);

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
					});

					const gmnotes = JSON.stringify(d20plus.config);
					handout.updateBlobs({gmnotes: gmnotes});
					handout.save({notes: (new Date).getTime()});

					d20plus.log(" > Saved config");

					d20plus.handleConfigChange();
				}
			});
		}
	};

	d20plus.openJournalCleaner = function () {
		const $win = $("#d20plus-quickdelete");
		$win.dialog("open");

		const journal = d20plus.importer.getJournalFolderObj();
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
		$cbAll.bind("click", function() {
			d20plus.importer._importToggleSelectAll(delList, $cbAll);
		});

		const $btnDel = $(`#quickdelete-btn-submit`);
		$btnDel.off("click");
		$btnDel.on("click", () => {
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
		});
	};

	// Window loaded
	window.onload = function() {
		window.unwatch("d20");
		const checkLoaded = setInterval(function() {
			if (!$("#loading-overlay").is(":visible")) {
				clearInterval(checkLoaded);
				d20plus.Init();
			}
		}, 1000);
	};

	// Page fully loaded and visible
	d20plus.Init = function() {
		d20plus.log("> Init (v" + d20plus.version + ")");
		d20plus.setSheet();
		if (window.is_gm) {
			d20plus.log("> Reading Config");
			d20plus.loadConfig(d20plus.onConfigLoad);
		} else {
			d20plus.onConfigLoad();
		}
	};

	// continue more init after config loaded
	d20plus.onConfigLoad = function () {
		if (window.is_gm) {
			d20plus.log("> Loading custom art");
			d20plus.loadArt(d20plus.onArtLoad);
		} else {
			d20plus.onArtLoad();
		}
	};

	// continue more init after art loaded
	d20plus.onArtLoad = function () {
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
	};

	// continue init once scripts load
	d20plus.onScriptLoad = function () {
		IS_ROLL20 = true; // global variable from 5etools' utils.js
		d20plus.log("> Add CSS");
		_.each(d20plus.cssRules, function (r) {
			d20plus.addCSS(window.document.styleSheets[window.document.styleSheets.length - 1], r.s, r.r);
		});
		d20plus.log("> Add HTML");
		d20plus.addHTML();

		if (window.is_gm) {
			d20plus.log("> Bind Graphics");
			d20.Campaign.pages.each(d20plus.bindGraphics);
			d20.Campaign.activePage().collection.on("add", d20plus.bindGraphics);
			d20plus.log("> Add custom art search");
			d20plus.addCustomArtSearch();
			d20plus.log("> Applying config");
			d20plus.handleConfigChange();
		}
		d20plus.log("> All systems operational");

		d20.textchat.incoming(false, ({who: "system", type: "system", content: `<span style="font-weight: bold; font-family: 'Lucida Console', Monaco, monospace; color: #20C20E; background: black; padding: 3px;">5etoolsR20 v${d20plus.version} ready</span>`}))
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
							// TODO: npc_hpbase appears to be hardcoded here? Refactor for NPC_SHEET_ATTRIBUTES?
							// Saw this while working on other things, unclear if it's necessary or not.
							if (d20plus.getCfgVal("token", "rollHP") && d20plus.getCfgKey("token", "npc_hpbase")) {
								var hpf = character.attribs.find(function(a) {return a.get("name").toLowerCase() == NPC_SHEET_ATTRIBUTES["npc_hpformula"][d20plus.sheet];});
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

	d20plus.addCustomArtSearch = function () {
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
			};

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
	};

	// bind token HP to initiative tracker window HP field
	d20plus.bindToken = function (token) {
		function getInitTrackerToken () {
			const $window = $("#initiativewindow");
			if (!$window.length) return [];
			return $window.find(`li.token`).filter((i, e) => {
				return $(e).data("tokenid") === token.id;
			});
		}
		const $initToken = getInitTrackerToken();
		if (!$initToken.length) return;
		const $iptHp = $initToken.find(`.hp.editable`);
		const npcFlag = token.character ? token.character.attribs.find((a) => {
			return a.get("name").toLowerCase() === "npc";
		}) : null;
		// if there's a HP column enabled
		if ($iptHp.length) {
			let toBind;
			if (!token.character || npcFlag && npcFlag.get("current") == "1") {
				const hpBar = d20plus.getCfgHpBarNumber();
				// and a HP bar chosen
				if (hpBar) {
					$iptHp.text(token.attributes[`bar${hpBar}_value`])
				}

				toBind = (token, changes) => {
					const $initToken = getInitTrackerToken();
					if (!$initToken.length) return;
					const $iptHp = $initToken.find(`.hp.editable`);
					const hpBar = d20plus.getCfgHpBarNumber();

					if ($iptHp && hpBar) {
						if (changes.changes[`bar${hpBar}_value`]) {
							$iptHp.text(token.changed[`bar${hpBar}_value`]);
						}
					}
				};
			} else {
				toBind = (token, changes) => {
					const $initToken = getInitTrackerToken();
					if (!$initToken.length) return;
					const $iptHp = $initToken.find(`.hp.editable`);
					if ($iptHp) {
						$iptHp.text(token.character.autoCalcFormula(d20plus.formulas[d20plus.sheet].hp));
					}
				}
			}
			// clean up old handler
			if (d20plus.tokenBindings[token.id]) token.off("change", d20plus.tokenBindings[token.id]);
			// add new handler
			d20plus.tokenBindings[token.id] = toBind;
			token.on("change", toBind);
		}
	};
	d20plus.tokenBindings = {};

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
			d20plus.importer.recursiveRemoveDirById(d20plus.lastClickedFolderId, true);
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

	/**
	 * Takes a path made up of strings and arrays of strings, and turns it into one flat array of strings
	 */
	d20plus.importer.getCleanPath = function (...path) {
		const clean = [];
		getStrings(clean, path);
		return clean.map(s => s.trim()).filter(s => s);

		function getStrings (stack, toProc) {
			toProc.forEach(tp => {
				if (typeof tp === "string") {
					stack.push(tp);
				} else if (tp instanceof Array) {
					getStrings(stack, tp);
				} else {
					throw new Error("Object in path was not a string or an array")
				}
			});
		}
	};

	d20plus.importer.makeDirTree = function (...path) {
		const parts = d20plus.importer.getCleanPath(path);
		// path e.g. d20plus.importer.makeDirTree("Spells", "Cantrips", "1")
		// roll20 allows a max directory depth of 4 :joy: (5, but the 5th level is unusable)
		if (parts.length > 4) throw new Error("Max directory depth exceeded! The maximum is 4.")

		const madeSoFar = [];

		const root = {i: d20plus.importer.getJournalFolderObj()};

		// roll20 folder management is dumb, so just pick the first folder with the right name if there's multiple
		let curDir = root;
		parts.forEach(toMake => {
			const existing = curDir.i.find((it) => {
				// n is folder name (only folders have the n property)
				return it.n && it.n === toMake && it.i;
			});
			if (!existing) {
				if (curDir.id) {
					d20.journal.addFolderToFolderStructure(toMake, curDir.id);
				} else {
					// root has no id
					d20.journal.addFolderToFolderStructure(toMake);
				}
			}
			d20.journal.refreshJournalList();
			madeSoFar.push(toMake);

			// we have to save -> reread the entire directory JSON -> walk back to where we were
			let nextDir = {i: JSON.parse(d20.Campaign.get("journalfolder"))};
			madeSoFar.forEach(f => {
				nextDir = nextDir.i.find(dir => dir.n && (dir.n.toLowerCase() === f.toLowerCase()));
			});

			curDir = nextDir;
		});
		return curDir;
	};

	d20plus.importer.recursiveRemoveDirById = function (folderId, withConfirmation) {
		if (!withConfirmation || confirm("Are you sure you want to delete this folder, and everything in it? This cannot be undone.")) {
			const folder = $(`[data-globalfolderid='${folderId}']`);
			if (folder.length) {
				d20plus.log(" > Nuking folder...");
				const childItems = folder.find("[data-itemid]").each((i, e) => {
					const $e = $(e);
					const itemId = $e.attr("data-itemid");
					let toDel = d20.Campaign.handouts.get(itemId);
					toDel || (toDel = d20.Campaign.characters.get(itemId));
					if (toDel) toDel.destroy();
				});
				const childFolders = folder.find(`[data-globalfolderid]`).remove();
				folder.remove();
				$("#journalfolderroot").trigger("change");
			}
		}
	};

	d20plus.importer.removeDirByPath = function (...path) {
		path = d20plus.importer.getCleanPath(path);
		return d20plus.importer._checkOrRemoveDirByPath(true, path);
	};

	d20plus.importer.checkDirExistsByPath = function (...path) {
		path = d20plus.importer.getCleanPath(path);
		return d20plus.importer._checkOrRemoveDirByPath(false, path);
	};

	d20plus.importer._checkOrRemoveDirByPath = function (doDelete, path) {
		const parts = d20plus.importer.getCleanPath(path);

		const root = {i: d20plus.importer.getJournalFolderObj()};

		let curDir = root;
		for (let i = 0; i < parts.length; ++i) {
			const p = parts[i];
			let lastId;
			const existing = curDir.i.find((it) => {
				lastId = it.id;
				// n is folder name (only folders have the n property)
				return it.n && it.n === p;
			});
			if (!existing) return false;
			curDir = existing;
			if (i === parts.length - 1) {
				d20plus.importer.recursiveRemoveDirById(lastId, false);
				return true;
			}
		}
	};

	d20plus.importer.removeFileByPath = function (...path) {
		path = d20plus.importer.getCleanPath(path);
		return d20plus.importer._checkOrRemoveFileByPath(true, path);
	};

	d20plus.importer.checkFileExistsByPath = function (...path) {
		path = d20plus.importer.getCleanPath(path);
		return d20plus.importer._checkOrRemoveFileByPath(false, path);
	};

	d20plus.importer._checkOrRemoveFileByPath = function (doDelete, path) {
		const parts = d20plus.importer.getCleanPath(path);

		const root = {i: d20plus.importer.getJournalFolderObj()};

		let curDir = root;
		for (let i = 0; i < parts.length; ++i) {
			const p = parts[i];
			let lastId;
			const existing = curDir.i.find((it) => {
				if (i === parts.length - 1) {
					// for the last item, check handouts/characters to see if the match it (which could be a string ID)
					const char = d20.Campaign.characters.get(it);
					const handout = d20.Campaign.handouts.get(it);
					if ((char && char.get("name") === p) || (handout && handout.get("name") === p)) {
						lastId = it;
						return true;
					}
				} else {
					lastId = it.id;
					// n is folder name (only folders have the n property)
					return it.n && it.n === p;
				}
				return false;
			});
			if (!existing) return false;
			curDir = existing;
			if (i === parts.length - 1) {
				if (doDelete) {
					// on the last item, delete
					let toDel = d20.Campaign.handouts.get(lastId);
					toDel || (toDel = d20.Campaign.characters.get(lastId))
					if (toDel) toDel.destroy();
				}
				return true;
			}
		}
		return false;
	};

	d20plus.formSrcUrl = function (dataDir, fileName) {
		return dataDir + fileName;
	};

	// Inject HTML
	d20plus.addHTML = function() {
		if (window.is_gm) {
			$(`#imagedialog .searchbox`).find(`.tabcontainer`).first().after(d20plus.artTabHtml);
			$(`a#button-add-external-art`).on(window.mousedowntype, d20plus.art.button);

			$("#mysettings > .content").children("hr").first().before(d20plus.settingsHtml);
			$("#mysettings > .content a#button-monsters-load").on(window.mousedowntype, d20plus.monsters.button);
			$("#mysettings > .content a#button-monsters-load-all").on(window.mousedowntype, d20plus.monsters.buttonAll);
			$("#mysettings > .content a#button-spells-load").on(window.mousedowntype, d20plus.spells.button);
			$("#mysettings > .content a#button-spells-load-all").on(window.mousedowntype, d20plus.spells.buttonAll);
			$("#mysettings > .content a#import-psionics-load").on(window.mousedowntype, d20plus.psionics.button);
			$("#mysettings > .content a#import-items-load").on(window.mousedowntype, d20plus.items.button);
			$("#mysettings > .content a#import-feats-load").on(window.mousedowntype, d20plus.feats.button);
			$("#mysettings > .content a#import-objects-load").on(window.mousedowntype, d20plus.objects.button);
			$("#mysettings > .content a#import-classes-load").on(window.mousedowntype, d20plus.classes.button);
			$("#mysettings > .content a#import-subclasses-load").on(window.mousedowntype, d20plus.subclasses.button);
			$("#mysettings > .content a#import-backgrounds-load").on(window.mousedowntype, d20plus.backgrounds.button);
			$("#mysettings > .content a#button-adventures-load").on(window.mousedowntype, d20plus.adventures.button);

			$("#mysettings > .content a#bind-drop-locations").on(window.mousedowntype, d20plus.bindDropLocations);
			$("#mysettings > .content a#button-edit-config").on(window.mousedowntype, d20plus.openConfigEditor);
			$("#mysettings > .content a#button-mass-deleter").on(window.mousedowntype, d20plus.openJournalCleaner);
			$("#mysettings > .content select#import-mode-select").on("change", d20plus.importer.importModeSwitch);
			$("#initiativewindow .characterlist").before(d20plus.initiativeHeaders);
			d20plus.setTurnOrderTemplate();
			d20.Campaign.initiativewindow.rebuildInitiativeList();
			d20plus.hpAllowEdit();
			d20.Campaign.initiativewindow.model.on("change:turnorder", function () {
				d20plus.updateDifficulty();
			});
			d20plus.updateDifficulty();
			d20plus.addJournalCommands();

			const $body = $("body");
			$body.append(d20plus.importDialogHtml);
			$body.append(d20plus.importListHTML);
			$body.append(d20plus.configEditorHTML);
			$body.append(d20plus.addArtHTML);
			$body.append(d20plus.addArtMassAdderHTML);
			$body.append(d20plus.quickDeleterHtml);
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
				height: 650,
			});
			$("#d20plus-configeditor").parent().append(d20plus.configEditorButtonBarHTML);
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
			$("#d20plus-quickdelete").dialog({
				autoOpen: false,
				resizable: true,
				width: 800,
				height: 650,
			});

			populateDropdown("#button-spell-select", "#import-spell-url", spellDataDir, spellDataUrls, "PHB");
			populateDropdown("#button-monsters-select", "#import-monster-url", monsterDataDir, monsterDataUrls, "MM");
			populateAdventuresDropdown();

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

			function populateAdventuresDropdown () {
				const defaultAdvUrl = d20plus.formSrcUrl(adventureDataDir, "adventure-lmop.json");
				const $iptUrl = $("#import-adventures-url");
				$iptUrl.val(defaultAdvUrl);
				$iptUrl.data("id", "lmop")
				const $sel = $("#button-adventures-select");
				adventureMetadata.adventure.forEach(a => {
					$sel.append($('<option>', {
						value: d20plus.formSrcUrl(adventureDataDir, `adventure-${a.id.toLowerCase()}.json|${a.id}`),
						text: a.name
					}));
				})
				$sel.append($('<option>', {
					value: "",
					text: "Custom"
				}));
				$sel.val(defaultAdvUrl);
				$sel.change(() => {
					const [url, id] = $sel.val().split("|");
					$($iptUrl).val(url);
					$iptUrl.data("id", id);
				});
			}
		}
		// add a bind button to the journal for players
		const altBindButton = $(`<button id="bind-drop-locations-alt" class="btn bind-drop-locations" href="#" title="Bind drop locations and handouts">Bind Drag-n-Drop</button>`);
		altBindButton.on("click", function () {
			d20plus.bindDropLocations();
		});
		const $iptSearch = $(`<input id="player-search" class="ui-autocomplete-input" autocomplete="off" placeholder="Quick search by name...">`);
		const $wrprResults = $(`<div id="player-search-results" class="content searchbox"/>`);
		if (window.is_gm) {
			altBindButton.css("margin-right", "5px");
			$iptSearch.css("width", "calc(100% - 5px)");
			const $addPoint = $("#journal button.btn.superadd");
			$addPoint.after($wrprResults);
			$addPoint.after(`<br>`);
			$addPoint.after($iptSearch);
			$addPoint.after(`<br><br>`);
			$addPoint.after(altBindButton);
		} else {
			altBindButton.css("margin-top", "5px");
			const $wrprControls = $(`<div class="content searchbox"/>`);
			$(`#journal .content`).before($wrprControls).before($wrprResults);
			$iptSearch.css("max-width", "calc(100% - 140px)");
			$wrprControls.append($iptSearch);
			$wrprControls.append(altBindButton);
		}
		d20plus.initQuickSearch($iptSearch, $wrprResults);

		$("#journal btn#bind-drop-locations").on(window.mousedowntype, d20plus.bindDropLocations);
	};

	d20plus.initQuickSearch = function ($iptSearch, $outSearch) {
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
					start: function() {
						$("#journalfolderroot").addClass("externaldrag")
					},
					stop: function() {
						$("#journalfolderroot").removeClass("externaldrag")
					}
				});
			}
		});
	};

	d20plus.updateDifficulty = function() {
		if (!$("div#initiativewindow").parent().is("body")) {
			var $span = $("div#initiativewindow").parent().find(".ui-dialog-buttonpane > span.difficulty");
			var $btnpane = $("div#initiativewindow").parent().find(".ui-dialog-buttonpane");
			if (!$span.length) {
				$btnpane.prepend(d20plus.difficultyHtml);
				$span = $("div#initiativewindow").parent().find(".ui-dialog-buttonpane > span.difficulty");
			}
			if (d20plus.getCfgVal("interface", "showDifficulty")) {
				$span.text("Difficulty: " + d20plus.getDifficulty());
				$span.show();
			} else {
				$span.hide();
			}
		}
	};

	// bind tokens to the initiative tracker
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
			d20.journal.addFolderToFolderStructure("Classes");
			d20.journal.addFolderToFolderStructure("Subclasses");
			d20.journal.addFolderToFolderStructure("Backgrounds");
			d20.journal.refreshJournalList();
			journalFolder = d20.Campaign.get("journalfolder");
		}

		function addClasses (folderName) {
			$(`#journalfolderroot > ol.dd-list > li.dd-folder > div.dd-content:contains(${folderName})`).parent().find("ol li[data-itemid]").addClass("compendium-item").addClass("ui-draggable").addClass("Vetools-draggable");
		}
		addClasses("Spells");
		addClasses("Psionics");
		addClasses("Items");
		addClasses("Feats");
		addClasses("Classes");
		addClasses("Subclasses");
		addClasses("Backgrounds");

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
			});
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
									const extraDirty = [];

									// TODO remove Feat workaround when roll20 supports feat drag-n-drop properly
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
									} else if (data.data.Category === "Backgrounds") { // TODO remove Background workaround when roll20 supports background drag-n-drop properly
										const bg = data.Vetoolscontent;

										const renderer = new EntryRenderer();
										renderer.setBaseUrl(BASE_SITE_URL);
										const renderStack = [];
										let feature;
										bg.entries.forEach(e => {
											if (e.name.includes("Feature:")) {
												feature = JSON.parse(JSON.stringify(e));
												feature.name = feature.name.replace("Feature:", "").trim();
											}
										});
										if (feature) renderer.recursiveEntryRender({entries: feature.entries}, renderStack);

										d20plus.importer.addOrUpdateAttr(character.model, "background", bg.name);

										const fRowId = d20plus.generateRowId();
										character.model.attribs.create({name: `repeating_traits_${fRowId}_name`, current: bg.name});
										character.model.attribs.create({name: `repeating_traits_${fRowId}_source`, current: "Background"});
										character.model.attribs.create({name: `repeating_traits_${fRowId}_source_type`, current: bg.name});
										if (renderStack.length) {
											character.model.attribs.create({name: `repeating_traits_${fRowId}_description`, current: d20plus.importer.getCleanText(renderStack.join(""))});
										}
										character.model.attribs.create({name: `repeating_traits_${fRowId}_options-flag`, current: "0"});

										if (bg.skillProficiencies) {
											const skills = bg.skillProficiencies.split(",").map(s => s.toLowerCase().trim().replace(/ /g, "_"));
											skills.forEach(s => {
												d20plus.importer.addOrUpdateAttr(character.model, `${s}_prof`, `(@{pb}*@{${s}_type})`);
											});
										}
									} else if (data.data.Category === "Classes") {
										let level = prompt("What level?", "1");
										if (level && level.trim()) {
											level = Number(level);
											if (level) {
												if (level < 0 || level > 20) {
													alert("Please enter a number between one and 20!");
													return;
												}

												const clss = data.Vetoolscontent;

												// --- these don't work
												// d20plus.importer.addOrUpdateAttr(character.model, "class", data.name);
												// d20plus.importer.addOrUpdateAttr(character.model, "level", level);
												// d20plus.importer.addOrUpdateAttr(character.model, "base_level", String(level));

												// operation "kitchen sink"
												setTimeout(() => {
													d20plus.importer.addOrUpdateAttr(character.model, "pb", d20plus.getProfBonusFromLevel(Number(level)));
													// try to set level -- none of these actually work lol
													d20plus.importer.addOrUpdateAttr(character.model, "level", level);
													d20plus.importer.addOrUpdateAttr(character.model, "base_level", String(level));
													character.$charsheet.find(`.sheet-pc .sheet-core input[name=attr_base_level]`)
														.val(String(level))
														.text(String(level))
														.trigger("change");
													// hack to set class
													character.$charsheet.find(`.sheet-pc .sheet-core select[name=attr_class]`).val(data.name).trigger("change");
													character.model.persisted = false;
													extraDirty.add("level", "base_level", "pb");
												}, 500);

												const renderer = new EntryRenderer();
												renderer.setBaseUrl(BASE_SITE_URL);
												for (let i = 0; i < level; i++) {
													const lvlFeatureList = clss.classFeatures[i];
													for (let j = 0; j < lvlFeatureList.length; j++) {
														const feature = lvlFeatureList[j];
														// don't add "you gain a subclass feature" or ASI's
														if (!feature.gainSubclassFeature && feature.name !== "Ability Score Improvement") {
															const renderStack = [];
															renderer.recursiveEntryRender({entries: feature.entries}, renderStack);

															const fRowId = d20plus.generateRowId();
															character.model.attribs.create({name: `repeating_traits_${fRowId}_name`, current: feature.name});
															character.model.attribs.create({name: `repeating_traits_${fRowId}_source`, current: "Class"});
															character.model.attribs.create({name: `repeating_traits_${fRowId}_source_type`, current: clss.name});
															character.model.attribs.create({name: `repeating_traits_${fRowId}_description`, current: d20plus.importer.getCleanText(renderStack.join(""))});
															character.model.attribs.create({name: `repeating_traits_${fRowId}_options-flag`, current: "0"});
														}
													}
												}
											}
										}
									} else if (data.data.Category === "Subclasses") {
										const sc = data.Vetoolscontent;
										let maxIndex = sc.subclassFeatures.length;
										// _gainAtLevels should be a 20-length array of booleans
										if (sc._gainAtLevels) {
											maxIndex = 0;

											let level = prompt("What level?", "1");
											if (level && level.trim()) {
												level = Number(level);
												if (level) {
													if (level < 0 || level > 20) {
														alert("Please enter a number between one and 20!");
														return;
													}

													for (let i = 0; i < level; i++) {
														if (sc._gainAtLevels[i]) maxIndex++;
													}
												}
											} else {
												return;
											}
										}

										if (maxIndex === 0) return;

										const renderer = new EntryRenderer();
										renderer.setBaseUrl(BASE_SITE_URL);
										for (let i = 0; i < maxIndex; i++) {
											const lvlFeatureList = sc.subclassFeatures[i];
											for (let j = 0; j < lvlFeatureList.length; j++) {
												const featureCpy = JSON.parse(JSON.stringify(lvlFeatureList[j]));
												let feature = lvlFeatureList[j];
												const renderStack = [];

												try {
													while (!feature.name || (feature[0] && !feature[0].name)) {
														if (feature.entries && feature.entries.name) {
															feature = feature.entries;
															continue;
														} else if (feature.entries[0] && feature.entries[0].name) {
															feature = feature.entries[0];
															continue;
														} else {
															feature = feature.entries;
														}

														if (!feature) {
															// in case something goes wrong, reset break the loop
															feature = featureCpy;
															break;
														}
													}
												} catch (e) {
													// in case something goes _really_ wrong, reset
													feature = featureCpy;
												}

												renderer.recursiveEntryRender({entries: feature.entries}, renderStack);

												const fRowId = d20plus.generateRowId();
												character.model.attribs.create({name: `repeating_traits_${fRowId}_name`, current: feature.name});
												character.model.attribs.create({name: `repeating_traits_${fRowId}_source`, current: "Class"});
												character.model.attribs.create({name: `repeating_traits_${fRowId}_source_type`, current: `${sc.class} (${sc.name})`});
												character.model.attribs.create({name: `repeating_traits_${fRowId}_description`, current: d20plus.importer.getCleanText(renderStack.join(""))});
												character.model.attribs.create({name: `repeating_traits_${fRowId}_options-flag`, current: "0"});
											}
										}
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
														makeSpellTrait(smLevel, rowId, "spelldescription", d20plus.importer.getCleanText(renderStack.join("")));
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
													makeSpellTrait(mLevel, rowId, "spelldescription", `Psionic Discipline mode\n\n${d20plus.importer.getCleanText(renderStack.join(""))}`);
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
											makeSpellTrait(level, rowId, "spelldescription", `Psionic Talent\n\n${d20plus.importer.getCleanText(EntryRenderer.psionic.getTalentText(data, renderer))}`);
											noComponents(level, rowId, false);
										}
									} else {
										inputData = data.data;
										inputData.Name = data.name;
										inputData.Content = data.content;
										character.$charsheet.find("*[accept]").each(function() {
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

									character.model.view._updateSheetValues();
									const dirty = [];
									extraDirty.forEach(ed => {
										dirty.push(ed);
									});
									$.each(d20.journal.customSheets.attrDeps, function(i, v) {dirty.push(i);});
									d20.journal.notifyWorkersOfAttrChanges(character.model.view.model.id, dirty, true);
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

	d20plus.getProfBonusFromLevel = function (level) {
		if (level < 5) return "2";
		if (level < 9) return "3";
		if (level < 13) return "4";
		if (level < 17) return "5";
		return "6";
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

	d20plus.monsters._groupOptions = ["Type", "CR", "Alphabetical", "Source"];
	// Import Monsters button was clicked
	d20plus.monsters.button = function() {
		const url = $("#import-monster-url").val();
		if (url && url.trim()) {
			DataUtil.loadJSON(url, (data) => {
				d20plus.importer.showImportList(
					"monster",
					data.monster,
					d20plus.monsters.handoutBuilder,
					{
						groupOptions: d20plus.monsters._groupOptions
					}
				);
			});
		}
	};

	// Import All Monsters button was clicked
	d20plus.monsters.buttonAll = function() {
		const toLoad = Object.keys(monsterDataUrls).filter(src => !isNonstandardSource(src)).map(src => d20plus.monsters.formMonsterUrl(monsterDataUrls[src]));
		if (toLoad.length) {
			DataUtil.multiLoadJSON(toLoad.map(url => ({url: url})), () => {}, (dataStack) => {
				let toAdd = [];
				dataStack.forEach(d => toAdd = toAdd.concat(d.monster));
				d20plus.importer.showImportList(
					"monster",
					toAdd,
					d20plus.monsters.handoutBuilder,
					{
						groupOptions: d20plus.monsters._groupOptions,
						showSource: true
					}
				);
			});
		}
	};

	d20plus.monsters.formMonsterUrl = function (fileName) {
		return d20plus.formSrcUrl(monsterDataDir, fileName);
	};

	d20plus.importer.getSetAvatarImage = function (character, avatar) {
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
	};

	d20plus.importer.addAction = function (character, name, text, index) {
		if (d20plus.hasCfgVal("token", "tokenactions")) {
			character.abilities.create({name: index  +": " + name, istokenaction: true, action: d20plus.actionMacroAction(index)});
		}

		var newRowId = d20plus.generateRowId();
		var actiontext = text;
		var action_desc = actiontext; // required for later reduction of information dump.
		var rollbase = "@{wtype}&{template:npcaction} @{attack_display_flag} @{damage_flag} {{name=@{npc_name}}} {{rname=@{name}}} {{r1=[[1d20+(@{attack_tohit}+0)]]}} @{rtype}+(@{attack_tohit}+0)]]}} {{dmg1=[[@{attack_damage}+0]]}} {{dmg1type=@{attack_damagetype}}} {{dmg2=[[@{attack_damage2}+0]]}} {{dmg2type=@{attack_damagetype2}}} {{crit1=[[@{attack_crit}+0]]}} {{crit2=[[@{attack_crit2}+0]]}} {{description=@{description}}} @{charname_output}";
		// attack parsing
		if (actiontext.indexOf(" Attack:") > -1) {
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
			character.attribs.create({name: "repeating_npcaction_" + newRowId + "_name", current: name});
			character.attribs.create({name: "repeating_npcaction_" + newRowId + "_npc_options-flag", current: 0});
			character.attribs.create({name: "repeating_npcaction_" + newRowId + "_rollbase", current: rollbase});
			character.attribs.create({name: "repeating_npcaction_" + newRowId + "_name_display", current: name});
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
	}

	// Create monster character from js data object
	d20plus.monsters.handoutBuilder = function (data, overwrite, inJournals, folderName) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Monsters`, folderName);
		const path = ["Monsters", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.characters.create({name: name}, {
			success: function(character) {
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
						error: function () {
							d20plus.importer.getSetAvatarImage(character, `${IMG_URL}blank.png`);
						},
						success: function () {
							d20plus.importer.getSetAvatarImage(character, avatar);
						}
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
					character.attribs.create({name: "wtype", current: d20plus.importer.getDesiredWhisperType()});
					character.attribs.create({name: "rtype", current: d20plus.importer.getDesiredRollType()});
					character.attribs.create({name: "advantagetoggle", current: d20plus.importer.getDesiredAdvantageToggle()});
					character.attribs.create({name: "whispertoggle", current: d20plus.importer.getDesiredWhisperToggle()});
					character.attribs.create({name: "dtype", current: d20plus.importer.getDesiredDamageType()});
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
					function calcMod (score) {
						return Math.floor((Number(score) - 10) / 2);
					}

					character.attribs.create({name: "npc_speed", current: data.speed != null ? data.speed : ""});
					character.attribs.create({name: "strength", current: data.str});
					character.attribs.create({name: "strength_base", current: data.str});
					character.attribs.create({name: "strength_mod", current: calcMod(data.str)});

					character.attribs.create({name: "dexterity", current: data.dex});
					character.attribs.create({name: "dexterity_base", current: data.dex});
					character.attribs.create({name: "dexterity_mod", current: calcMod(data.dex)});

					character.attribs.create({name: "constitution", current: data.con});
					character.attribs.create({name: "constitution_base", current: data.con});
					character.attribs.create({name: "constitution_mod", current: calcMod(data.con)});

					character.attribs.create({name: "intelligence", current: data.int});
					character.attribs.create({name: "intelligence_base", current: data.int});
					character.attribs.create({name: "intelligence_mod", current: calcMod(data.int)});

					character.attribs.create({name: "wisdom", current: data.wis});
					character.attribs.create({name: "wisdom_base", current: data.wis});
					character.attribs.create({name: "wisdom_mod", current: calcMod(data.wis)});

					character.attribs.create({name: "charisma", current: data.cha});
					character.attribs.create({name: "charisma_base", current: data.cha});
					character.attribs.create({name: "charisma_mod", current: calcMod(data.cha)});

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

					// add Tokenaction Macros
					if (d20plus.hasCfgVal("token", "tokenactions")) {
						character.abilities.create({name: "Perception", istokenaction: true, action: d20plus.actionMacroPerception});
						character.abilities.create({name: "Init", istokenaction: true, action: d20plus.actionMacroInit});
						character.abilities.create({name: "DR/Immunities", istokenaction: true, action: d20plus.actionMacroDrImmunities});
						character.abilities.create({name: "Stats", istokenaction: true, action: d20plus.actionMacroStats});
						character.abilities.create({name: "Saves", istokenaction: true, action: d20plus.actionMacroSaves});
						character.abilities.create({name: "Skill-Check", istokenaction: true, action: d20plus.actionMacroSkillCheck});
						character.abilities.create({name: "Ability-Check", istokenaction: true, action: d20plus.actionMacroAbilityCheck});
					}

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
					if (data.spellcasting) {
						// make it a spellcaster
						character.attribs.create({name: `npcspellcastingflag`, current: "1"});

						// figure out the casting ability or spell DC
						let spellDc;
						let spellAbility;
						let casterLevel;
						for (const sc of data.spellcasting) {
							const abils = [];
							const toCheck = sc.headerEntries.join("");

							// use the first ability/DC we find, since roll20 doesn't support multiple
							const abM = /(strength|constitution|dexterity|intelligence|wisdom|charisma)/i.exec(toCheck);
							const dcM = /DC (\d+)/i.exec(toCheck);
							const lvlM = /(\d+)(st|nd|rd|th).level\s+spellcaster/i.exec(toCheck);
							if (dcM) {
								spellDc = dcM[1];
							}
							if (lvlM) {
								casterLevel = lvlM[1];
							}
							if (abM) {
								spellAbility = abM[1];
							}
						}
						// delay these, does nothing otherwise (getting overwritten by turning on npc_spellcasting after, perhaps?)
						// if (spellDc) character.attribs.create({name: `spell_save_dc`, current: spellDc});
						// if (spellAbility) character.attribs.create({name: "spellcasting_ability", current: `@{${spellAbility.toLowerCase()}_mod}+`})
						// if (casterLevel) character.attribs.create({name: "caster_level", current: casterLevel})
						// TODO investigate setting character class + level as an alternative
						const spAbilsDelayMs = 250;
						setTimeout(() => {
							if (spellDc) {
								d20plus.importer.addOrUpdateAttr(character, "spell_save_dc", spellDc);
							}
							if (spellAbility) {
								d20plus.importer.addOrUpdateAttr(character, "spellcasting_ability", `@{${spellAbility.toLowerCase()}_mod}+`);
							}
							if (casterLevel) {
								d20plus.importer.addOrUpdateAttr(character, "caster_level", casterLevel);
								d20plus.importer.addOrUpdateAttr(character, "level", Number(casterLevel));
							}
						}, spAbilsDelayMs);

						// add the spellcasting text
						const newRowId = d20plus.generateRowId();
						const renderer = new EntryRenderer();
						renderer.setBaseUrl(BASE_SITE_URL);
						const spellTrait = EntryRenderer.monster.getSpellcastingRenderedString(data, renderer);
						character.attribs.create({name: `repeating_npctrait_${newRowId}_name`, current: "Spellcasting"});
						character.attribs.create({name: `repeating_npctrait_${newRowId}_desc`, current: d20plus.importer.getCleanText(spellTrait)});

						// add the spells
						const allSpells = [];
						data.spellcasting.forEach(sc => {
							const toAdd = ["constant", "will", "rest", "daily", "weekly"];
							toAdd.forEach(k => {
								if (sc[k]) {
									Object.values(sc[k]).forEach(spOrSpArr => {
										if (spOrSpArr instanceof Array) {
											Array.prototype.push.apply(allSpells, spOrSpArr);
										} else {
											allSpells.push(spOrSpArr);
										}
									});
								}
							});
							if (sc.spells) {
								Object.keys(sc.spells).forEach(lvl => {
									// delayed creation of spell slots, once it's a spellcaster
									setTimeout(() => {
										if (sc.spells[lvl].slots) {
											const slotName = `lvl${lvl}_slots_total`;
											d20plus.importer.addOrUpdateAttr(character, slotName, String(sc.spells[lvl].slots));
										}
									}, spAbilsDelayMs);

									if (sc.spells[lvl].spells) {
										Array.prototype.push.apply(allSpells, sc.spells[lvl].spells);
									}
								});
							}
						});

						// add spells to sheet
						character.view.render();
						let chainTimeout = 0;
						allSpells.forEach(sp => {
							const tagSplit = EntryRenderer.splitByTags(sp);
							tagSplit.forEach(s => {
								if (!s || !s.trim()) return;
								if (s.charAt(0) === "@") {
									const [tag, text] = EntryRenderer.splitFirstSpace(s);
									if (tag === "@spell") {
										let [name, source] = text.split("|");
										if (!source) source = "PHB";
										const rawUrl = spellDataUrls[Object.keys(spellDataUrls).find(src => source.toLowerCase() === src.toLowerCase())];
										const url = d20plus.spells.formSpellUrl(rawUrl);
										// the JSON gets cached by the script, so this is fine
										DataUtil.loadJSON(url, (data) => {
											const spell = data.spell.find(spell => spell.name.toLowerCase() === name.toLowerCase());

											const [notecontents, gmnotes] = d20plus.spells._getHandoutData(spell);

											addSpell(JSON.parse(gmnotes), spell);
										});
									}
								}
							});
						});

						function addSpell (sp, VeSp) {
							const rId = d20plus.generateRowId();
							const lvl = sp.data.Level === "0" ? "cantrip" : sp.data.Level;
							const base = `repeating_spell-${lvl}_${rId}_`;

							makeAttrib("spelllevel", lvl);
							makeAttrib("spellname", sp.name);
							makeAttrib("spellschool", sp.data.School);
							makeAttrib("spellcastingtime", sp.data["Casting Time"]); // spaces in property names l m a o
							makeAttrib("spellrange", sp.data.Range);
							makeAttrib("spelltarget", sp.data.Target);
							makeAttrib("spellcomp_v", Number(!!VeSp.components.v));
							makeAttrib("spellcomp_s", Number(!!VeSp.components.s));
							makeAttrib("spellcomp_materials", sp.data.Material);
							if (!sp.data.Material && !VeSp.components.m) makeAttrib("spellcomp_m", "0");
							makeAttrib("spellconcentration", sp.data.Concentration)
							makeAttrib("spellduration", sp.data.Duration);
							// Would have to set this -> save spell -> enter damage numbers -> save spell, so just do inline rollers instead.
							// makeAttrib("spelloutput", "ATTACK");
							makeAttrib("spelldamage", sp.data.Damage);
							makeAttrib("spelldamagetype", sp.data["Damage Type"]);
							makeAttrib("spellsave", sp.data.Save);
							makeAttrib("spellsavesuccess", sp.data["Save Success"]);
							makeAttrib("spellhldie", sp.data["Higher Spell Slot Dice"]);
							makeAttrib("spellhldietype", sp.data["Higher Spell Slot Die"]);
							const [text, hlText] = sp.content.split("\n\nAt Higher Levels:")
							makeAttrib("spelldescription", addInlineRollers(text));
							makeAttrib("spellathigherlevels", addInlineRollers(hlText));
							makeAttrib("options-flag", "0");

							function makeAttrib(name, current) {
								if (current !== undefined && current !== null) character.attribs.create({name: `${base}${name}`, current: current});
							}

							function addInlineRollers (text) {
								if (!text) return text;
								return text.replace(DICE_REGEX, (match) => {
									return `[[${match}]]`;
								});
							}
						}
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

							if (d20plus.hasCfgVal("token", "tokenactions")) {
								character.abilities.create({name: "Trait" + i  +": " + v.name, istokenaction: true, action: d20plus.actionMacroTrait(i)});
							}

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
							var text = "";
							if (v.text instanceof Array) {
								$.each(v.text, function(z, x) {
									if (!x) return;
									text += (z > 0 ? "\r\n" : "") + x;
								});
							} else {
								text = v.text;
							}
							d20plus.importer.addAction(character, v.name, text, i);
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

							// roll20 only supports a single reaction, so only use the first
							if (d20plus.hasCfgVal("token", "tokenactions") && i === 0) {
								character.abilities.create({name: "Reaction: " + v.name, istokenaction: true, action: d20plus.actionMacroReaction});
							}

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
						let tokenactiontext = "";
						$.each(data.legendary, function(i, v) {
							var newRowId = d20plus.generateRowId();
							var actiontext = "";
							var text = "";

							if (d20plus.hasCfgVal("token", "tokenactions")) {
								tokenactiontext += "[" + v.name + "](~selected|repeating_npcaction-l_$" + i + "_npc_action)\n\r";
							}

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
						if (d20plus.hasCfgVal("token", "tokenactions")) {
							character.abilities.create({name: "Legendary Actions", istokenaction: true, action: d20plus.actionMacroLegendary(tokenactiontext)});
						}
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
				d20.journal.addItemToFolderStructure(character.id, folder.id);
			}
		});
	};

	d20plus.importer.findAttrId = function (character, attrName) {
		const found = character.attribs.toJSON().find(a => a.name === attrName);
		return found ? found.id : undefined;
	};

	d20plus.importer.addOrUpdateAttr = function (character, attrName, value) {
		const id = d20plus.importer.findAttrId(character, attrName);
		if (id) {
			character.attribs.get(id).set("current", value);
		} else {
			character.attribs.create({
				"name": attrName,
				"current": value
			});
		}
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
			const $span = $(this);
			$span.html(`<input type='text' value='${val}'/>`);
			const $ipt = $(this).find("input");
			$ipt[0].focus();
		});
		$("#initiativewindow").on("keydown", ".hp.editable", function(event) {
			if (event.which == 13) {
				const $span = $(this);
				const $ipt = $span.find("input");
				if (!$ipt.length) return;

				var el, token, id, char, hp,
					val = $.trim($ipt.val());

				// roll20 token modification supports plus/minus for a single integer; mimic this
				const m = /^((\d+)?([+-]))?(\d+)$/.exec(val);
				if (m) {
					let op = null;
					if (m[3]) {
						op = m[3] === "+" ? "ADD" : "SUB";
					}
					const base = m[2] ? eval(m[0]) : null;
					const mod = Number(m[4]);

					el = $(this).parents("li.token");
					id = el.data("tokenid");
					token = d20.Campaign.pages.get(d20.Campaign.activePage()).thegraphics.get(id);
					char = token.character;

					npc = char.attribs ? char.attribs.find(function(a) {return a.get("name").toLowerCase() === "npc";}) : null;
					let total;
					// char.attribs doesn't exist for generico tokens, in this case stick stuff in an appropriate bar
					if (!char.attribs || npc && npc.get("current") == "1") {
						const hpBar = d20plus.getCfgHpBarNumber();
						if (hpBar) {
							total;
							if (base !== null) {
								total = base;
							} else if (op) {
								const curr = token.attributes[`bar${hpBar}_value`];
								if (op === "ADD") total = curr + mod;
								else total = curr - mod;
							} else {
								total = mod;
							}
							token.attributes[`bar${hpBar}_value`] = total;
						}
					} else {
						hp = char.attribs.find(function(a) {return a.get("name").toLowerCase() === "hp";});
						if (hp) {
							total;
							if (base !== null) {
								total = base;
							} else if (op) {
								if (op === "ADD") total = hp.attributes.current + mod;
								else total = hp.attributes.current - mod;
							} else {
								total = mod;
							}
							hp.syncedSave({current: total});
						} else {
							total;
							if (base !== null) {
								total = base;
							} else if (op) {
								if (op === "ADD") total = mod;
								else total = 0 - mod;
							} else {
								total = mod;
							}
							char.attribs.create({name: "hp", current: total});
						}
					}
					// convert the field back to text
					$span.html(total);
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
	d20plus.setTurnOrderTemplate = function() {
		if (!d20plus.turnOrderCachedFunction) {
			d20plus.turnOrderCachedFunction = d20.Campaign.initiativewindow.rebuildInitiativeList;
			d20plus.turnOrderCachedTemplate = $("#tmpl_initiativecharacter").clone();
		}

		d20.Campaign.initiativewindow.rebuildInitiativeList = function() {
			var html = d20plus.initiativeTemplate;
			var columnsAdded = [];
			$(".tracker-header-extra-columns").empty();

			const cols = [
				d20plus.getCfgVal("interface", "trackerCol1"),
				d20plus.getCfgVal("interface", "trackerCol2"),
				d20plus.getCfgVal("interface", "trackerCol3")
			];

			const headerStack = [];
			const replaceStack = [
				// this is hidden by CSS
				`<span class='cr' alt='CR' title='CR'>
					<$ if(npc && npc.get("current") == "1") { $>
						<$!char.attribs.find(function(e) { return e.get("name").toLowerCase() === "npc_challenge" }).get("current")$>
					<$ } $>
				</span>`
			];
			cols.forEach((c, i) => {
				switch (c) {
					case "HP": {
						const hpBar = d20plus.getCfgHpBarNumber();
						replaceStack.push(`
							<span class='hp editable tracker-col' alt='HP' title='HP'>
								<$ if(npc && npc.get("current") == "1") { $>
									${hpBar ? `<$!token.attributes.bar${hpBar}_value$>` : ""}
								<$ } else if (typeof char.autoCalcFormula !== "undefined") { $>
									<$!char.autoCalcFormula('${d20plus.formulas[d20plus.sheet].hp}')$>
								<$ } $>
							</span>
						`);
						headerStack.push(`<span class='tracker-col'>HP</span>`);
						break;
					}
					case "AC": {
						replaceStack.push(`
							<span class='ac tracker-col' alt='AC' title='AC'>
								<$ if(npc && npc.get("current") == "1") { $>
									<$!char.autoCalcFormula('${d20plus.formulas[d20plus.sheet].npcac}')$>
								<$ } else if (typeof char.autoCalcFormula !== "undefined") { $>
									<$!char.autoCalcFormula('${d20plus.formulas[d20plus.sheet].ac}')$>
								<$ } else { $>
									<$!"\u2014"$>
								<$ } $>
							</span>
						`);
						headerStack.push(`<span class='tracker-col'>AC</span>`);
						break;
					}
					case "PP": {
						replaceStack.push(`
							<$ var passive = typeof char.autoCalcFormula !== "undefined" ? (char.autoCalcFormula('@{passive}') || char.autoCalcFormula('${d20plus.formulas[d20plus.sheet].pp}')) : "\u2014"; $>
							<span class='pp tracker-col' alt='Passive Perception' title='Passive Perception'><$!passive$></span>							
						`);
						headerStack.push(`<span class='tracker-col'>PP</span>`);
						break;
					}
					default: {
						replaceStack.push(`<span class="tracker-col"/>`);
						headerStack.push(`<span class="tracker-col"/>`);
					}
				}
			});

			console.log("use custom tracker val was ", d20plus.getCfgVal("interface", "customTracker"))
			if (d20plus.getCfgVal("interface", "customTracker")) {
				const $header = $(".tracker-header-extra-columns");
				// prepend/reverse used since tracker gets populated in right-to-left order
				headerStack.forEach(h => $header.prepend(h))
				html = html.replace(`<!--5ETOOLS_REPLACE_TARGET-->`, replaceStack.reverse().join(" \n"));
			}

			$("#tmpl_initiativecharacter").replaceWith(html);

			// Hack to catch errors, part 1
			const startTime = (new Date).getTime();

			var results = d20plus.turnOrderCachedFunction.apply(this, []);
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

				d20plus.bindTokens();
			}, 100);

			// Hack to catch errors, part 2
			if (d20plus.initErrorHandler) {
				window.removeEventListener("error", d20plus.initErrorHandler);
			}
			d20plus.initErrorHandler = function (event) {
				// if we see an error within 250 msec of trying to override the initiative window...
				if (((new Date).getTime() - startTime) < 250) {
					d20plus.log(" > ERROR: failed to populate custom initiative tracker, restoring default...");
					// restore the default functionality
					$("#tmpl_initiativecharacter").replaceWith(d20plus.turnOrderCachedTemplate);
					return d20plus.turnOrderCachedFunction();
				}
			};
			window.addEventListener("error", d20plus.initErrorHandler);
			return results;
		};
	};

	d20plus.spells.formSpellUrl = function (fileName) {
		return d20plus.formSrcUrl(spellDataDir, fileName);
	};

	d20plus.spells._groupOptions = ["Level", "Alphabetical", "Source"];
	// Import Spells button was clicked
	d20plus.spells.button = function() {
		const url = $("#import-spell-url").val();
		if (url && url.trim()) {
			DataUtil.loadJSON(url, (data) => {
				d20plus.importer.showImportList(
					"spell",
					data.spell,
					d20plus.spells.handoutBuilder,
					{
						groupOptions: d20plus.spells._groupOptions
					}
				);
			});
		}
	};

	// Import All Spells button was clicked
	d20plus.spells.buttonAll = function() {
		const toLoad = Object.keys(spellDataUrls).filter(src => !isNonstandardSource(src)).map(src => d20plus.spells.formSpellUrl(spellDataUrls[src]));

		if (toLoad.length) {
			DataUtil.multiLoadJSON(toLoad.map(url => ({url: url})), () => {}, (dataStack) => {
				let toAdd = [];
				dataStack.forEach(d => toAdd = toAdd.concat(d.spell));
				d20plus.importer.showImportList(
					"spell",
					toAdd,
					d20plus.spells.handoutBuilder,
					{
						groupOptions: d20plus.spells._groupOptions,
						showSource: true
					}
				);
			});
		}
	};

	// Create spell handout from js data object
	d20plus.spells.handoutBuilder = function (data, overwrite, inJournals, folderName) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Spells`, folderName);
		const path = ["Spells", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		// merge in roll20 metadata, if available
		const spellMeta = spellMetaData.spell.find(sp => sp.name.toLowerCase() === data.name.toLowerCase() && sp.source.toLowerCase() === data.source.toLowerCase());
		if (spellMeta) {
			data.roll20 = spellMeta.data;
		}
		// build spell handout
		d20.Campaign.handouts.create({
			name: name
		}, {
			success: function(handout) {
				const [notecontents, gmnotes] = d20plus.spells._getHandoutData(data);

				console.log(notecontents);
				handout.updateBlobs({notes: notecontents, gmnotes: gmnotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	}

	d20plus.spells._getHandoutData = function (data) {
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
		notecontents += `<del>${gmnotes}</del>`;

		return [notecontents, gmnotes];
	}

	// parse spell components
	function parseComponents(components) {
		const out = [];
		if (components.v) out.push("V");
		if (components.s) out.push("S");
		if (components.m) out.push("M");
		return out.join(" ");
	}

	d20plus.items._groupOptions = ["Type", "Rarity", "Alphabetical", "Source"];
	// Import Items button was clicked
	d20plus.items.button = function() {
		const url = $("#import-items-url").val();
		if (url && url.trim()) {
			if (url.trim() === "https://5etools.com/data/items.json") {
				EntryRenderer.item.buildList((itemList) => {
					d20plus.importer.showImportList(
						"item",
						itemList,
						d20plus.items.handoutBuilder,
						{
							groupOptions: d20plus.items._groupOptions,
							showSource: true
						}
					);
				},
				{
					items: "https://5etools.com/data/items.json",
					basicitems: "https://5etools.com/data/basicitems.json",
					magicvariants: "https://5etools.com/data/magicvariants.json"
				});
			} else {
				// for non-standard URLs, do a generic import
				DataUtil.loadJSON(url, (data) => {
					d20plus.importer.showImportList(
						"item",
						data.item,
						d20plus.items.handoutBuilder,
						{
							groupOptions: d20plus.items._groupOptions
						}
					);
				});
			}
		}
	};

	// Import individual items
	d20plus.items.handoutBuilder = function(data, overwrite, inJournals, folderName) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Items`, folderName);
		const path = ["Items", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;

		// build item handout
		d20.Campaign.handouts.create({
			name: name
		}, {
			success: function(handout) {
				var notecontents = "";
				roll20Data = {
					name: data.name,
					data: {
						Category: "Items"
					}
				};
				const typeArray = [];
				if (data.wondrous) typeArray.push("Wondrous Item");
				if (data.technology) typeArray.push(data.technology);
				if (data.age) typeArray.push(data.age);
				if (data.weaponCategory) typeArray.push(data.weaponCategory+" Weapon");
				var type = data.type;
				if (data.type) {
					const fullType = d20plus.items.parseType(data.type);
					typeArray.push(fullType);
					roll20Data.data["Item Type"] = fullType;
				} else if (data.typeText) {
					roll20Data.data["Item Type"] = data.typeText;
				}
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
					var propertieslist = data.property;
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
				if (properties) {
					notecontents += `<p><strong>Properties: </strong>${properties}</p>`;
					roll20Data.data.Properties = properties;
				}
				if (armorclass) {
					notecontents += `<p><strong>Armor Class: </strong>${armorclass}</p>`;
					roll20Data.data.AC = String(data.ac);
				}
				if (data.weight) {
					notecontents += `<p><strong>Weight: </strong>${data.weight} lbs.</p>`;
					roll20Data.data.Weight = String(data.weight);
				}
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

				if (data.range) {
					roll20Data.data.Range = data.range;
				}
				if (data.dmg1 && data.dmgType) {
					roll20Data.data.Damage = data.dmg1;
					roll20Data.data["Damage Type"] = Parser.dmgTypeToFull(data.dmgType);
				}
				if (textstring.trim()) {
					roll20Data.content = d20plus.importer.getCleanText(textstring);
					roll20Data.htmlcontent = roll20Data.content;
				}
				if (data.stealth) {
					roll20Data.data.Stealth = "Disadvantage";
				}
				// roll20Data.data.Duration = "1 Minute"; // used by e.g. poison; not show in sheet
				// roll20Data.data.Save = "Constitution"; // used by e.g. poison, ball bearings; not shown in sheet
				// roll20Data.data.Target = "Each creature in a 10-foot square centered on a point within range"; // used by e.g. ball bearings; not shown in sheet
				// roll20Data.data["Item Rarity"] = "Wondrous"; // used by Iron Bands of Binding... and nothing else?; not shown in sheet
				if (data.reqAttune === "YES") {
					roll20Data.data["Requires Attunement"] = "Yes";
				} else {
					roll20Data.data["Requires Attunement"] = "No";
				}
				// TODO handle other magic versions
				// roll20Data.data.Modifiers = ... ; // this can be a variety of things, and is a comma separated list
				// some examples, that are currently handled:
				// "Ranged Attacks +3, Ranged Damage +3"
				// "Ac +2"
				// "Spell Attack +2"
				// "Saving Throws +1"
				// "AC +15, Spell Attack +2, Spell DC +2"
				// ...and some examples, that are not:
				// "Constitution +2"
				// "Strength: 21"
				if (data.modifier) {
					const allModifiers = data.modifier.filter(m => m.__text).map(m => m.__text.split(" ").map(s => s.uppercaseFirst()).join(" ")).join(", ");
					roll20Data.data.Modifiers = allModifiers;
				}

				gmnotes = JSON.stringify(roll20Data);

				handout.updateBlobs({notes: notecontents, gmnotes: gmnotes});
				handout.save({
					notes: (new Date).getTime(),
					inplayerjournals: inJournals
				});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
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

	d20plus.psionics._groupOptions = ["Alphabetical", "Order", "Source"];
	// Import Psionics button was clicked
	d20plus.psionics.button = function () {
		const url = $("#import-psionics-url").val();
		if (url && url.trim()) {
			DataUtil.loadJSON(url, (data) => {
				d20plus.importer.showImportList(
					"psionic",
					data.psionic,
					d20plus.psionics.handoutBuilder,
					{
						groupOptions: d20plus.psionics._groupOptions
					}
				);
			});
		}
	};

	d20plus.psionics.handoutBuilder = function (data, overwrite, inJournals, folderName) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Psionics`, folderName);
		const path = ["Psionics", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
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

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	// Import Feats button was clicked
	d20plus.feats.button = function () {
		const url = $("#import-feats-url").val();
		if (url && url.trim()) {
			DataUtil.loadJSON(url, (data) => {
				d20plus.importer.showImportList(
					"feat",
					data.feat,
					d20plus.feats.handoutBuilder,
					{
						showSource: true
					}
				);
			});
		}
	};

	d20plus.feats.handoutBuilder = function (data, overwrite, inJournals, folderName) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Feats`, folderName);
		const path = ["Feats", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
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

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};


	// Import Object button was clicked
	d20plus.objects.button = function () {
		const url = $("#import-objects-url").val();
		if (url && url.trim()) {
			DataUtil.loadJSON(url, (data) => {
				d20plus.importer.showImportList(
					"object",
					data.object,
					d20plus.objects.handoutBuilder
				);
			});
		}
	};

	d20plus.objects.handoutBuilder = function (data, overwrite, inJournals, folderName) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Objects`, folderName);
		const path = ["Objects", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.characters.create({name: name}, {
			success: function(character) {
				try {
					const avatar = `${IMG_URL}objects/${name}.png`;
					character.size = data.size;
					character.name = name;
					character.senses = data.senses;
					character.hp = data.hp;
					$.ajax({
						url: avatar,
						type: 'HEAD',
						error: function () {
							d20plus.importer.getSetAvatarImage(character, `${IMG_URL}blank.png`);
						},
						success: function () {
							d20plus.importer.getSetAvatarImage(character, avatar);
						}
					});
					const ac = data.ac.match(/^\d+/);
					const size = Parser.sizeAbvToFull(data.size);
					character.attribs.create({name: "npc", current: 1});
					character.attribs.create({name: "npc_toggle", current: 1});
					character.attribs.create({name: "npc_options-flag", current: 0});
					character.attribs.create({name: "wtype", current: d20plus.importer.getDesiredWhisperType()});
					character.attribs.create({name: "rtype", current: d20plus.importer.getDesiredRollType()});
					character.attribs.create({name: "advantagetoggle", current: d20plus.importer.getDesiredAdvantageToggle()});
					character.attribs.create({name: "whispertoggle", current: d20plus.importer.getDesiredWhisperToggle()});
					character.attribs.create({name: "dtype", current: d20plus.importer.getDesiredDamageType()});
					character.attribs.create({name: "npc_name", current: name});
					character.attribs.create({name: "npc_size", current: size});
					character.attribs.create({name: "type", current: data.type});
					character.attribs.create({name: "npc_type", current: `${size} ${data.type}`});
					character.attribs.create({name: "npc_ac", current: ac != null ? ac[0] : ""});
					character.attribs.create({name: "npc_actype", current: ""});
					character.attribs.create({name: "npc_hpbase", current: data.hp});
					character.attribs.create({name: "npc_hpformula", current: data.hp ? `${data.hp}d1` : ""});

					character.attribs.create({name: "npc_immunities", current: data.immune || ""});
					character.attribs.create({name: "damage_immunities", current: data.immune || ""});

					const renderer = new EntryRenderer();
					renderer.setBaseUrl(BASE_SITE_URL);
					if (data.actionEntries) {
						data.actionEntries.forEach((e, i) => {
							const renderStack = [];
							renderer.recursiveEntryRender({entries: e.entries}, renderStack, 2);
							const actionText = d20plus.importer.getCleanText(renderStack.join(""));
							d20plus.importer.addAction(character, e.name, actionText, i);
						});
					}

					character.view._updateSheetValues();
					var dirty = [];
					$.each(d20.journal.customSheets.attrDeps, function(i, v) {dirty.push(i);});
					d20.journal.notifyWorkersOfAttrChanges(character.view.model.id, dirty, true);
				} catch (e) {
					d20plus.log(`> Error loading [${name}]`);
					d20plus.addImportError(name);
					console.log(data);
					console.log(e);
				}
				d20.journal.addItemToFolderStructure(character.id, folder.id);
			}
		});
	};

	d20plus.importer.getDesiredRollType = function () {
		// rtype
		const toggle = "@{advantagetoggle}";
		const never = "{{normal=1}} {{r2=[[0d20";
		const always = "{{always=1}} {{r2=[[@{d20}";
		const query = "{{query=1}} ?{Advantage?|Normal Roll,&#123&#123normal=1&#125&#125 &#123&#123r2=[[0d20|Advantage,&#123&#123advantage=1&#125&#125 &#123&#123r2=[[@{d20}|Disadvantage,&#123&#123disadvantage=1&#125&#125 &#123&#123r2=[[@{d20}}";
		const desired = d20plus.getCfgVal("token", "advantagemode");
		if (desired) {
			switch (desired) {
				case "Toggle (Default Advantage)":
				case "Toggle":
				case "Toggle (Default Disadvantage)":
					return toggle;
				case "Always":
					return always;
				case "Query":
					return query;
				case "Never":
					return never;
			}
		} else {
			return toggle;
		}
	};

	d20plus.importer.getDesiredAdvantageToggle = function () {
		// advantagetoggle
		const advantage = "{{query=1}} {{advantage=1}} {{r2=[[@{d20}";
		const disadvantage = "{{query=1}} {{disadvantage=1}} {{r2=[[@{d20}";
		const desired = d20plus.getCfgVal("token", "advantagemode");
		const neither = "";
		if (desired) {
			switch (desired) {
				case "Toggle (Default Advantage)":
					return advantage;
				case "Toggle (Default Disadvantage)":
					return desired;
				case "Toggle":
				case "Always":
				case "Query":
				case "Never":
					return neither;
			}
		} else {
			return neither;
		}
	};

	d20plus.importer.getDesiredWhisperType = function () {
		// wtype
		const toggle = "@{whispertoggle}";
		const never = " ";
		const always = "/w gm ";
		const query = "?{Whisper?|Public Roll,|Whisper Roll,/w gm }";
		const desired = d20plus.getCfgVal("token", "whispermode");
		if (desired) {
			switch (desired) {
				case "Toggle (Default GM)":
				case "Toggle (Default Public)":
					return toggle;
				case "Always":
					return always;
				case "Query":
					return query;
				case "Never":
					return never;
			}
		} else {
			return toggle;
		}
	};

	d20plus.importer.getDesiredWhisperToggle = function () {
		// whispertoggle
		const gm = "/w gm ";
		const pblic = " ";
		const desired = d20plus.getCfgVal("token", "whispermode");
		if (desired) {
			switch (desired) {
				case "Toggle (Default GM)":
					return gm;
				case "Toggle (Default Public)":
					return pblic;
				case "Always":
					return "";
				case "Query":
					return "";
				case "Never":
					return "";
			}
		} else {
			return gm;
		}
	};

	d20plus.importer.getDesiredDamageType = function () {
		// dtype
		const on = "full";
		const off = "pick";
		const desired = d20plus.getCfgVal("token", "damagemode");
		if (desired) {
			switch (desired) {
				case "Auto Roll":
					return on;
				case "Don't Auto Roll":
					return off;
			}
		} else {
			return on;
		}
	}

	// Import Classes button was clicked
	d20plus.classes.button = function () {
		const url = $("#import-classes-url").val();
		if (url && url.trim()) {
			DataUtil.loadJSON(url, (data) => {
				d20plus.importer.showImportList(
					"class",
					data.class,
					d20plus.classes.handoutBuilder
				);
			});
		}
	};

	d20plus.classes.handoutBuilder = function (data, overwrite, inJournals, folderName) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Classes`, folderName);
		const path = ["Classes", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name
		}, {
			success: function (handout) {
				const renderer = new EntryRenderer();
				renderer.setBaseUrl(BASE_SITE_URL);

				const renderStack = [];
				// make a copy of the data to modify
				const curClass = JSON.parse(JSON.stringify(data));
				// render the class text
				for (let i = 0; i < 20; i++) {
					const lvlFeatureList = curClass.classFeatures[i];
					for (let j = 0; j < lvlFeatureList.length; j++) {
						const feature = lvlFeatureList[j];
						renderer.recursiveEntryRender(feature, renderStack);
					}
				}
				const rendered = renderStack.join("");

				const r20json = {
					"name": data.name,
					"Vetoolscontent": data,
					"data": {
						"Category": "Classes"
					}
				};
				const gmNotes = JSON.stringify(r20json);
				const noteContents = `${rendered}\n\n<del>${gmNotes}</del>`;

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});

		// import subclasses
		if (data.subclasses) {
			const gainFeatureArray = [];
			outer: for (let i = 0; i < 20; i++) {
				const lvlFeatureList = data.classFeatures[i];
				for (let j = 0; j < lvlFeatureList.length; j++) {
					const feature = lvlFeatureList[j];
					if (feature.gainSubclassFeature) {
						gainFeatureArray.push(true);
						continue outer;
					}
				}
				gainFeatureArray.push(false);
			}

			data.subclasses.forEach(sc => {
				sc.class = data.name;
				sc._gainAtLevels = gainFeatureArray;
				const folderName = d20plus.importer._getHandoutPath("subclass", sc, "Class");
				const path = [folderName, sc.source || data.source];
				d20plus.subclasses.handoutBuilder(sc, overwrite, inJournals, path);
			});
		}
	};

	d20plus.subclasses._groupOptions = ["Class", "Alphabetical", "Source"];
	// Import Subclasses button was clicked
	d20plus.subclasses.button = function () {
		const url = $("#import-subclasses-url").val();
		if (url && url.trim()) {
			DataUtil.loadJSON(url, (data) => {
				d20plus.importer.showImportList(
					"subclass",
					data.subclass,
					d20plus.subclasses.handoutBuilder,
					{
						groupOptions: d20plus.subclasses._groupOptions,
						showSource: true
					}
				);
			});
		}
	};

	d20plus.subclasses.handoutBuilder = function (data, overwrite, inJournals, folderName) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Subclasses`, folderName);
		const path = ["Sublasses", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = `${data.shortName} (${data.class})`;
		d20.Campaign.handouts.create({
			name: name
		}, {
			success: function (handout) {
				const renderer = new EntryRenderer();
				renderer.setBaseUrl(BASE_SITE_URL);

				const renderStack = [];

				data.subclassFeatures.forEach(lvl => {
					lvl.forEach(f => {
						renderer.recursiveEntryRender(f, renderStack);
					});
				});

				const rendered = renderStack.join("");

				const r20json = {
					"name": data.name,
					"Vetoolscontent": data,
					"data": {
						"Category": "Subclasses"
					}
				};
				const gmNotes = JSON.stringify(r20json);
				const noteContents = `${rendered}\n\n<del>${gmNotes}</del>`;

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.backgrounds.button = function () {
		const url = $("#import-backgrounds-url").val();
		if (url && url.trim()) {
			DataUtil.loadJSON(url, (data) => {
				d20plus.importer.showImportList(
					"background",
					data.background,
					d20plus.backgrounds.handoutBuilder,
					{
						showSource: true
					}
				);
			});
		}
	};

	d20plus.backgrounds.handoutBuilder = function (data, overwrite, inJournals, folderName) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Backgrounds`, folderName);
		const path = ["Backgrounds", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name
		}, {
			success: function (handout) {
				const renderer = new EntryRenderer();
				renderer.setBaseUrl(BASE_SITE_URL);

				const renderStack = [];

				renderer.recursiveEntryRender({entries: data.entries}, renderStack, 1);

				const rendered = renderStack.join("");

				const r20json = {
					"name": data.name,
					"Vetoolscontent": data,
					"data": {
						"Category": "Backgrounds"
					}
				};
				const gmNotes = JSON.stringify(r20json);
				const noteContents = `${rendered}\n\n<del>${gmNotes}</del>`;

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	// Import Adventures button was clicked
	d20plus.adventures.button = function () {
		const url = $("#import-adventures-url").val();
		if (url !== null) d20plus.adventures.load(url);
	};

	d20plus.importer.importModeSwitch = function () {
		$(`.importer-section`).hide();
		const toShow = $(`#import-mode-select`).val();
		$(`.importer-section[data-import-group="${toShow}"]`).show();
	};

	d20plus.importer.showImportList = function (dataType, dataArray, handoutBuilder, options) {
		if (!options) options = {};
		/*
		options = {
			showSource: true,
			groupOptions: ["Source", "CR", "Alphabetical", "Type"]
		}
		 */
		$("a.ui-tabs-anchor[href='#journal']").trigger("click");

		// sort data
		dataArray.sort((a, b) => ascSort(a.name, b.name));

		// build checkbox list
		const $list = $("#import-list .list");
		$list.html("");
		dataArray.forEach((it, i) => {
			$list.append(`
				<label class="import-cb-label">
					<input type="checkbox" data-listid="${i}">
					<span class="name"><span>${it.name}</span>${options.showSource ? ` <span class="source" title="${Parser.sourceJsonToFull(it.source)}">(${Parser.sourceJsonToAbv(it.source)})</span>` : ""}</span>
				</label>
			`);
		});

		// init list library
		const importList = new List("import-list", {
			valueNames: ["name"]
		});

		// reset the UI and add handlers
		$(`#import-list > .search`).val("");
		importList.search("");
		$("#import-options label").hide();
		$("#import-overwrite").parent().show();
		$("#import-showplayers").parent().show();
		$("#organize-by").parent().show();
		$("#d20plus-importlist").dialog("open");
		const selectAllBox = $("#d20plus-importlist input#importlist-selectall");
		selectAllBox.unbind("click");
		selectAllBox.prop("checked", false);
		selectAllBox.bind("click", function() {
			d20plus.importer._importToggleSelectAll(importList, selectAllBox);
		});
		$("#d20plus-importlist button").unbind("click");
		const $selGroupBy = $(`#organize-by`);
		$selGroupBy.html("");
		options.groupOptions = options.groupOptions || ["Alphabetical", "Source"];
		options.groupOptions.forEach(g => {
			$selGroupBy.append(`<option value="${g}">${g}</option>`);
		});

		$("#d20plus-importlist button#importstart").bind("click", function() {
			$("#d20plus-importlist").dialog("close");
			const overwrite = $("#import-overwrite").prop("checked");
			const inJournals = $("#import-showplayers").prop("checked") ? "all" : "";
			const groupBy = $(`#organize-by`).val();

			// build list of items to process
			const importQueue = [];
			importList.items.forEach(i => Array.prototype.forEach.call(i.elm.children, (e) => {
				const $e = $(e);
				if ($e.is("input") && $e.prop("checked")) {
					const dataIndex = parseInt($e.data("listid"));
					const it = dataArray[dataIndex];
					importQueue.push(it);
				}
			}));

			const $stsName = $("#import-name");
			const $stsRemain = $("#import-remaining");
			let remaining = importQueue.length;
			let interval;
			if (dataType === "monster" || dataType === "object") {
				interval = d20plus.getCfgVal("import", "importIntervalCharacter") || d20plus.getCfgDefaultVal("import", "importIntervalCharacter");
			} else {
				interval = d20plus.getCfgVal("import", "importIntervalHandout") || d20plus.getCfgDefaultVal("import", "importIntervalHandout");
			}

			let cancelWorker = false;
			const $btnCancel = $(`#importcancel`);
			$btnCancel.off("click");
			$btnCancel.on("click", () => {
				handleWorkerComplete();
				cancelWorker = true;
			});

			// start worker to process list
			$("#d20plus-import").dialog("open");

			// run one immediately
			let worker;
			workerFn();
			worker = setInterval(() => {
				workerFn();
			}, interval);

			function workerFn () {
				if (!importQueue.length) {
					handleWorkerComplete();
					return;
				}
				if (cancelWorker) {
					return;
				}

				// pull items out the queue in LIFO order, for journal ordering (last created will be at the top)
				const it = importQueue.pop();
				it.name = it.name || "(Unknown)";

				$stsName.text(it.name);
				$stsRemain.text(remaining--);

				folderName = d20plus.importer._getHandoutPath(dataType, it, groupBy);
				handoutBuilder(it, overwrite, inJournals, folderName);
			}

			function handleWorkerComplete () {
				if (worker) clearInterval(worker);
				if (cancelWorker) {
					$stsName.text("Import cancelled");
					$stsRemain.text(`${$stsRemain.text()} (cancelled)`);
					d20plus.log(` > Import cancelled`);
					setTimeout(() => {
						d20plus.bindDropLocations();
					}, 250);
				} else {
					$stsName.text("Import complete");
					$stsRemain.text("0");
					d20plus.log(` > Import complete`);
					setTimeout(() => {
						d20plus.bindDropLocations();
					}, 250);
				}
			}
		});
	};

	d20plus.importer._getHandoutPath = function (dataType, it, groupBy) {
		switch (dataType) {
			case "monster": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "CR":
						folderName = it.cr;
						break;
					case "Alphabetical":
						folderName = it.name[0].uppercaseFirst();
						break;
					case "Type":
					default:
						folderName = Parser.monTypeToFullObj(it.type).type.uppercaseFirst();
						break;
				}
				return folderName;
			}
			case "spell": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Alphabetical":
						folderName = it.name[0].uppercaseFirst();
						break;
					case "Level":
					default:
						folderName = Parser.spLevelToFull(it.level);
						break;
				}
				return folderName;
			}
			case "item": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Rarity":
						folderName = it.rarity;
						break;
					case "Alphabetical":
						folderName = it.name[0].uppercaseFirst();
						break;
					case "Type":
					default:
						if (it.type) {
							folderName = Parser.itemTypeToAbv(it.type);
						} else if (it.typeText) {
							folderName = it.typeText;
						} else {
							folderName = "Unknown";
						}
						break;
				}
				return folderName;
			}
			case "psionic": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Order":
						folderName = Parser.psiOrderToFull(it.order);
						break;
					case "Alphabetical":
					default:
						folderName = it.name[0].uppercaseFirst();
						break;
				}
				return folderName;
			}
			case "feat": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Alphabetical":
					default:
						folderName = it.name[0].uppercaseFirst();
						break;
				}
				return folderName;
			}
			case "object": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Alphabetical":
					default:
						folderName = it.name[0].uppercaseFirst();
						break;
				}
				return folderName;
			}
			case "class": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Alphabetical":
					default:
						folderName = it.name[0].uppercaseFirst();
						break;
				}
				return folderName;
			}
			case "subclass": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Alphabetical":
						folderName = it.name[0].uppercaseFirst();
						break;
					case "Class":
					default:
						folderName = it.class;
				}
				return folderName;
			}
			case "background": {
				let folderName;
				switch (groupBy) {
					case "Source":
						folderName = Parser.sourceJsonToFull(it.source);
						break;
					case "Alphabetical":
					default:
						folderName = it.name[0].uppercaseFirst();
						break;
				}
				return folderName;
			}
			default:
				throw new Error(`Unknown import type '${dataType}'`);
		}
	};

	d20plus.importer._checkHandleDuplicate = function (path, overwrite) {
		const dupe = d20plus.importer.checkFileExistsByPath(path);
		if (dupe && !overwrite) return false;
		else if (dupe) d20plus.importer.removeFileByPath(path);
		return true;
	}

	d20plus.importer._importToggleSelectAll = function (importList, selectAllCb) {
		const $sa = $(selectAllCb);
		importList.items.forEach(i => Array.prototype.forEach.call(i.elm.children, (e) => {
			if (e.tagName === "INPUT") {
				$(e).prop("checked", $sa.prop("checked"));
			}
		}));
	};

	// Fetch adventure data from file
	d20plus.adventures.load = function (url) {
		$("a.ui-tabs-anchor[href='#journal']").trigger("click");
		$.ajax({
			type: "GET",
			url: url,
			dataType: "text",
			success: function (data) {
				data = JSON.parse(data);

				// open progress window
				$("#d20plus-import").dialog("open");
				$("#import-remaining").text("Initialising...");

				// get metadata
				const adMeta = adventureMetadata.adventure.find(a => a.id.toLowerCase() === $("#import-adventures-url").data("id").toLowerCase())

				const addQueue = [];
				const sections = data.data;
				const adDir = `${Parser.sourceJsonToFull(adMeta.id)}`;
				sections.forEach((s, i) => {
					if (i >= adMeta.contents.length) return;

					const chapterDir = [adDir, adMeta.contents[i].name];

					let front;
					const introEntries = [];
					if (s.entries && typeof s.entries[0] === "string") {
						while (typeof (front = s.entries.shift()) === "string") {
							introEntries.push(front);
						}
					}
					addQueue.push({
						dir: chapterDir,
						type: "entries",
						name: s.name,
						entries: introEntries,
					});

					// compact entries into layers
					front = null;
					let tempStack = [];
					let textIndex = 1;
					while ((front = s.entries.shift())) {
						if (typeof front === "string" || typeof front === "object" && front.type !== "entries") {
							tempStack.push(front);
						} else {
							if (tempStack.length) {
								addQueue.push({
									dir: chapterDir,
									type: "entries",
									name: `Text ${textIndex++}`,
									entries: tempStack
								});
								tempStack = [];
							}
							front.dir = chapterDir;
							addQueue.push(front);
						}
					}
				});

				const renderer = new EntryRenderer();
				renderer.setBaseUrl(BASE_SITE_URL);

				let cancelWorker = false;
				const $btnCancel = $(`#importcancel`);
				$btnCancel.off("click");
				$btnCancel.on("click", () => {
					cancelWorker = true;
				});

				const $stsName = $("#import-name");
				const $stsRemain = $("#import-remaining");
				let remaining = addQueue.length;
				const interval = d20plus.getCfgVal("import", "importInterval") || d20plus.getCfgDefaultVal("import", "importInterval");

				d20plus.log(`Running import of [${adMeta.name}] with ${interval} ms delay between each handout create`);
				let lastId = null;

				const worker = setInterval(() => {
					if (!addQueue.length || cancelWorker) {
						clearInterval(worker);
						$stsName.text("DONE!");
						$stsRemain.text("0");
						d20plus.log(`Finished import of [${adMeta.name}]`);
						return;
					}

					// pull items out the queue in LIFO order, for journal ordering (last created will be at the top)
					const entry = addQueue.pop();
					entry.name = entry.name || "(Unknown)";
					$stsName.text(entry.name);
					$stsRemain.text(remaining--);
					const folder = d20plus.importer.makeDirTree(entry.dir);

					d20.Campaign.handouts.create({
						name: entry.name
					}, {
						success: function (handout) {
							const renderStack = [];
							renderer.recursiveEntryRender(entry, renderStack);
							if (lastId && lastName) renderStack.push(`<br><p>Next handout: <a href="http://journal.roll20.net/handout/${lastId}">${lastName}</a></p>`);
							const rendered = renderStack.join("");

							lastId = handout.id;
							lastName = entry.name
							handout.updateBlobs({notes: rendered});
							handout.save({notes: (new Date).getTime(), inplayerjournals: ""});
							d20.journal.addItemToFolderStructure(handout.id, folder.id);
						}
					});
				}, interval);
			}
		});
	};

	d20plus.importer.getJournalFolderObj = function () {
		d20.journal.refreshJournalList();
		let journalFolder = d20.Campaign.get("journalfolder");
		if (journalFolder === "") {
			d20.journal.addFolderToFolderStructure("Characters");
			d20.journal.refreshJournalList();
			journalFolder = d20.Campaign.get("journalfolder");
		}
		return JSON.parse(journalFolder);
	};

	d20plus.importer.initFolder = function (data, overwrite, deleteExisting, parentFolderName, folderName, handoutBuilder) {
		var fname = $("#organize-by-source").prop("checked") ? Parser.sourceJsonToFull(data.source) : folderName;
		var findex = 1;
		var folder;
		var journalFolderObj = d20plus.importer.getJournalFolderObj();

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
		return $ele.text().replace(/[ ]+/g, " ");

		/* version which preserves images, and converts dice
		const IMG_TAG = "R20IMGTAG";
		let imgIndex = 0;
		const imgStack = [];
		str.replace(/(<img.*>)/, (match) => {
			imgStack.push(match);
			return ` ${IMG_TAG}_${imgIndex++} `;
		});
		const $ele = $(str);
		$ele.find("p, li, br").append("\n\n");
		let out = $ele.text();
		out = out.replace(DICE_REGEX, (match) => {
			return `[[${match}]]`;
		});
		return out.replace(/R20IMGTAG_(\d+)/, (match, g1) => {
			return imgStack[Number(g1)];
		});
		*/
	};

	// add external art button was clicked
	d20plus.art.button = function () {
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
				const $iptUrls = $(`#art-list-multi-add-area`);
				const massUrls = $iptUrls.val();
				const spl = massUrls.split("\n").map(s => s.trim()).filter(s => s);
				if (!spl.length) return;
				else {
					const delim = "---";
					const toAdd = [];
					for(const s of spl) {
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

		function getArtLi (name, url) {
			const $liArt = $(`
					<li class="dd-item library-item draggableresult Vetools-draggable-art ui-draggable" data-fullsizeurl="${url}">
						<img src="${url}" style="width: 30px; max-height: 30px; display: inline-block" draggable="false">
						<div class="dd-content name" style="display: inline-block; width: 35%;" data-url="${url}">${name}</div>
						<span class="url" style="display: inline-block; width: 40%;">${url}</span>
					</li>
				`);
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
					success: function(handout) {
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
	};

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

		#initiativewindow div.header span.initiative,
		#initiativewindow ul li span.initiative,
		#initiativewindow ul li span.tracker-col,
		#initiativewindow div.header span.tracker-col,
		#initiativewindow div.header span.initmacro,
		#initiativewindow ul li span.initmacro {
			font-size: 10px;
			font-weight: bold;
			text-align: right;
			float: right;
			padding: 0 5px;
			width: 7%;
			min-height: 20px;
			display: block;
			overflow: hidden;
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

	d20plus.quickDeleterHtml = `
<div id="d20plus-quickdelete" title="Journal Root Cleaner">
	<p>A list of characters and handouts in the journal folder root, which allows them to be quickly deleted.</p>
	<p style="display: flex; justify-content: space-between"><label><input type="checkbox" title="Select all" id="deletelist-selectall"> Select All</label> <a class="btn" href="#" id="quickdelete-btn-submit">Delete Selected</a></p>
	<div id="delete-list-container">
		<input class="search" autocomplete="off" placeholder="Search list..." style="width: 100%;">
		<br><br>
		<ul class="list deletelist" style="max-height: 600px; overflow-y: scroll; display: block; margin: 0;"></ul>
	</div>
</div>;
	`;

	d20plus.artTabHtml = `
		<p><a class="btn" href="#" id="button-add-external-art">Manage External Art</a></p>
	`;

	d20plus.addArtHTML = `
<div id="d20plus-artfolder" title="External Art" style="position: relative">
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
		<span style="display: inline-block; font-weight: bold;">Url</span>
	</p>
	<ul class="list artlist" style="max-height: 600px; overflow-y: scroll; display: block; margin: 0;"></ul>
</div>
</div>`;

	d20plus.addArtMassAdderHTML = `
<div id="d20plus-artmassadd" title="Mass Add Art URLs">
	<p>One entry per line; entry format: <b>[name]---[URL]</b> <a class="btn" href="#" id="art-list-multi-add-btn-submit">Add URLs</a></p>
	<p><textarea id="art-list-multi-add-area" style="width: 100%; height: 100%; min-height: 500px;"></textarea></p>
</div>`;

	d20plus.artListHTML = `
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
</div>`;

	d20plus.configEditorHTML = `
<div id="d20plus-configeditor" title="Config Editor" style="position: relative">
	<!-- populate with js -->
</div>`;

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
	<label>Group Handouts By... <select id="organize-by"></select></label>
	<label>Make handouts visible to all players? <input type="checkbox" title="Make items visible to all players" id="import-showplayers" checked></label>
	<label>Overwrite existing? <input type="checkbox" title="Overwrite existing" id="import-overwrite"></label>
	</p>
	<button type="button" id="importstart" alt="Load" class="btn" role="button" aria-disabled="false">
	<span>Start Import</span>
	</button>
</div>`;

	d20plus.importDialogHtml = `<div id="d20plus-import" title="Importing...">
	<p>
	<h3 id="import-name"></h3>
	</p>
	<span id="import-remaining"></span> remaining
	<p>
	Errors: <span id="import-errors">0</span>
	</p>
	<p>
	<button type="button" id="importcancel" alt="Cancel" title="Cancel Import" class="btn" role="button" aria-disabled="false">
		<span>Cancel</span>
	</button>
	</p>
</div>`;

	d20plus.refreshButtonHtml = `<button type="button" alt="Refresh" title="Refresh" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only pictos bigbuttonwithicons" role="button" aria-disabled="false">
	<span class="ui-button-text" style="">1</span>
</button>`;

	d20plus.settingsHtml = `<hr>
<h3>5etoolsR20 v${d20plus.version}</h3>

<h4>Import By Category</h4>
<p><small><i>We strongly recommend the OGL sheet for importing. You can switch afterwards.</i></small></p>
<select id="import-mode-select">
	<option value="none" disabled selected>Select category...</option>
	<option value="monster">Monsters</option>
	<option value="spell">Spells</option>
	<option value="item">Items</option>
	<option value="psionic">Psionics</option>
	<option value="feat">Feats</option>
	<option value="object">Objects</option>
	<option value="class">Classes</option>
	<option value="subclass">Subclasses</option>
	<option value="background">Backgrounds</option>
	<option value="adventure">Adventures</option>
</select>

<div class="importer-section" data-import-group="monster">
<h4>Monster Importing</h4>
<label for="import-monster-url">Monster Data URL:</label>
<select id="button-monsters-select">
	<!-- populate with JS-->
</select>
<input type="text" id="import-monster-url">
<p><a class="btn" href="#" id="button-monsters-load">Import Monsters</a></p>
<p><a class="btn" href="#" id="button-monsters-load-all" title="Standard sources only; no third-party or UA">Import Monsters From All Sources</a></p>
<p>
WARNING: Importing huge numbers of character sheets slows the game down. We recommend you import them as needed.<br>
The "Import Monsters From All Sources" button presents a list containing monsters from official sources only.<br>
To import from third-party sources, either individually select one available in the list or enter a custom URL, and "Import Monsters."
</p>
</div>

<div class="importer-section" data-import-group="item">
<h4>Item Importing</h4>
<label for="import-items-url">Item Data URL:</label>
<input type="text" id="import-items-url" value="${itemdataurl}">
<a class="btn" href="#" id="import-items-load">Import Items</a>
</div>

<div class="importer-section" data-import-group="spell">
<h4>Spell Importing</h4>
<label for="import-spell-url">Spell Data URL:</label>
<select id="button-spell-select">
	<!-- populate with JS-->
</select>
<input type="text" id="import-spell-url">
<p><a class="btn" href="#" id="button-spells-load">Import Spells</a><p/>
<p><a class="btn" href="#" id="button-spells-load-all" title="Standard sources only; no third-party or UA">Import Spells From All Sources</a></p>
<p>
The "Import Spells From All Sources" button presents a list containing spells from official sources only.<br>
To import from third-party sources, either individually select one available in the list or enter a custom URL, and "Import Spells."
</p>
</div>

<div class="importer-section" data-import-group="psionic">
<h4>Psionic Importing</h4>
<label for="import-psionics-url">Psionics Data URL:</label>
<input type="text" id="import-psionics-url" value="${psionicdataurl}">
<a class="btn" href="#" id="import-psionics-load">Import Psionics</a>
</div>

<div class="importer-section" data-import-group="feat">
<h4>Feat Importing</h4>
<label for="import-feats-url">Feat Data URL:</label>
<input type="text" id="import-feats-url" value="${featdataurl}">
<a class="btn" href="#" id="import-feats-load">Import Feats</a>
</div>

<div class="importer-section" data-import-group="object">
<h4>Object Importing</h4>
<label for="import-objects-url">Object Data URL:</label>
<input type="text" id="import-objects-url" value="${objectdataurl}">
<a class="btn" href="#" id="import-objects-load">Import Objects</a>
</div>

<div class="importer-section" data-import-group="class">
<h4>Class Importing</h4>
<label for="import-classes-url">Class Data URL:</label>
<input type="text" id="import-classes-url" value="${classdataurl}">
<a class="btn" href="#" id="import-classes-load">Import Classes</a>
</div>

<div class="importer-section" data-import-group="subclass">
<h4>Subclass Importing</h4>
<label for="import-subclasses-url">Subclass Data URL:</label>
<input type="text" id="import-subclasses-url" value="">
<a class="btn" href="#" id="import-subclasses-load">Import Subclasses</a>
<p>
Default subclasses are imported as part of Classes import. This can be used to load homebrew classes.
</p>
</div>

<div class="importer-section" data-import-group="background">
<h4>Background Importing</h4>
<label for="import-backgrounds-url">Background Data URL:</label>
<input type="text" id="import-backgrounds-url" value="${backgrounddataurl}">
<a class="btn" href="#" id="import-backgrounds-load">Import Backgrounds</a>
</div>

<div class="importer-section" data-import-group="adventure">
<h4>Adventure Importing</h4>
<label for="import-adventures-url">Adventure Data URL:</label>
<select id="button-adventures-select">
	<!-- populate with JS-->
</select>
<input type="text" id="import-adventures-url">
<p><a class="btn" href="#" id="button-adventures-load">Import Adventure</a><p/>
</div>

<br>
<a class="btn" href="#" id="button-edit-config" style="margin-top: 3px;">Edit Config</a>
<a class="btn bind-drop-locations" href="#" id="bind-drop-locations" style="margin-top: 3px;">Bind Drag-n-Drop</a>
<a class="btn" href="#" id="button-mass-deleter" style="margin-top: 3px;">Journal Cleaner</a>
<p><strong>Readme</strong></p>
<p>
You can drag-and-drop imported handouts to character sheets.<br>
If a handout is glowing green in the journal, it's draggable. This breaks when Roll20 decides to hard-refresh the journal.<br>
To restore this functionality, press the "Bind Drag-n-Drop" button.<br>
<i>Note: to drag a handout to a character sheet, you need to drag the name, and not the handout icon.</i>
</p>
<p>
For help, advice, and updates, <a href="https://discord.gg/v3AXzcW" target="_blank" style="color: #08c;">join our Discord!</a>
</p>

<style id="dynamicStyle"></style>`;

	d20plus.cssRules = [
		{
			s: "#initiativewindow ul li span.initiative,#initiativewindow ul li span.tracker-col,#initiativewindow ul li span.initmacro",
			r: "font-size: 25px;font-weight: bold;text-align: right;float: right;padding: 2px 5px;width: 10%;min-height: 20px;display: block;"
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
		},
		{
			s: ".import-cb-label .name",
			r: "display: inline-flex; width: calc(100% - 20px); justify-content: space-between;"
		},
		{
			s: ".import-cb-label .source",
			r: "font-style: italic;"
		},
		{
			s: ".importer-section",
			r: "display: none;"
		},
		{
			s: ".Vetoolsresult",
			r: "background: #ff8080;"
		},
		{
			s: ".userscript-entry-title",
			r: "font-weight: bold;"
		},
		{
			s: ".userscript-statsBlockHead > .userscript-entry-title",
			r: "font-weight: bold; font-size: 1.5em;"
		},
		{
			s: ".userscript-statsBlockHead > .userscript-statsBlockSubHead > .userscript-entry-title",
			r: "font-weight: bold; font-size: 1.3em;"
		},
		{
			s: ".userscript-statsInlineHead > .userscript-entry-title, .userscript-statsInlineHeadSubVariant > .userscript-entry-title",
			r: "font-style: italic"
		}
	];

	d20plus.initiativeHeaders = `<div class="header">
	<span class="ui-button-text initmacro">Sheet</span>
	<span class="initiative" alt="Initiative" title="Initiative">Init</span>
 	<span class="cr" alt="CR" title="CR">CR</span>
 	<div class="tracker-header-extra-columns"></div>
	</div>`;

	d20plus.initiativeTemplate = `<script id="tmpl_initiativecharacter" type="text/html">
	<![CDATA[
		<li class='token <$ if (this.layer === "gmlayer") { $>gmlayer<$ } $>' data-tokenid='<$!this.id$>' data-currentindex='<$!this.idx$>'>
			<$ var token = d20.Campaign.pages.get(d20.Campaign.activePage()).thegraphics.get(this.id); $>
			<$ var char = (token) ? token.character : null; $>
			<span alt='Sheet Macro' title='Sheet Macro' class='initmacro'>
				<button type='button' class='initmacrobutton ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only pictos' role='button' aria-disabled='false'>
				<span class='ui-button-text'>N</span>
				</button>
			</span>
			<span alt='Initiative' title='Initiative' class='initiative <$ if (this.iseditable) { $>editable<$ } $>'>
				<$!this.pr$>
			</span>
			<$ if (char) { $>
				<$ var npc = char.attribs ? char.attribs.find(function(a){return a.get("name").toLowerCase() == "npc" }) : null; $>
			<$ } $>
			<div class="tracker-extra-columns">
				<!--5ETOOLS_REPLACE_TARGET-->
			</div>
			<$ if (this.avatar) { $><img src='<$!this.avatar$>' /><$ } $>
			<span class='name'><$!this.name$></span>
				<div class='clear' style='height: 0px;'></div>
				<div class='controls'>
			<span class='pictos remove'>#</span>
			</div>
		</li>
	]]>
</script>`;

	d20plus.actionMacroPerception = "%{Selected|npc_perception} /w gm &{template:default} {{name=Senses}}  /w gm @{Selected|npc_senses} ";
	d20plus.actionMacroInit = "%{selected|npc_init}";
	d20plus.actionMacroDrImmunities = "/w gm &{template:default} {{name=DR/Immunities}} {{Damage Resistance= @{selected|npc_resistances}}} {{Damage Vulnerability= @{selected|npc_vulnerabilities}}} {{Damage Immunity= @{selected|npc_immunities}}} {{Condition Immunity= @{selected|npc_condition_immunities}}} ";
	d20plus.actionMacroStats = "/w gm &{template:default} {{name=Stats}} {{Armor Class= @{selected|npc_AC}}} {{Hit Dice= @{selected|npc_hpformula}}} {{Speed= @{selected|npc_speed}}} {{Skills= @{selected|npc_skills}}} {{Senses= @{selected|npc_senses}}} {{Languages= @{selected|npc_languages}}} {{Challenge= @{selected|npc_challenge}(@{selected|npc_xp}xp)}}";
	d20plus.actionMacroSaves = "/w gm &{template:simple}{{always=1}}?{Saving Throw?|STR,{{rname=Strength Save&#125;&#125;{{mod=@{npc_str_save}&#125;&#125; {{r1=[[1d20+@{npc_str_save}]]&#125;&#125;{{r2=[[1d20+@{npc_str_save}]]&#125;&#125;|DEX,{{rname=Dexterity Save&#125;&#125;{{mod=@{npc_dex_save}&#125;&#125; {{r1=[[1d20+@{npc_dex_save}]]&#125;&#125;{{r2=[[1d20+@{npc_dex_save}]]&#125;&#125;|CON,{{rname=Constitution Save&#125;&#125;{{mod=@{npc_con_save}&#125;&#125; {{r1=[[1d20+@{npc_con_save}]]&#125;&#125;{{r2=[[1d20+@{npc_con_save}]]&#125;&#125;|INT,{{rname=Intelligence Save&#125;&#125;{{mod=@{npc_int_save}&#125;&#125; {{r1=[[1d20+@{npc_int_save}]]&#125;&#125;{{r2=[[1d20+@{npc_int_save}]]&#125;&#125;|WIS,{{rname=Wisdom Save&#125;&#125;{{mod=@{npc_wis_save}&#125;&#125; {{r1=[[1d20+@{npc_wis_save}]]&#125;&#125;{{r2=[[1d20+@{npc_wis_save}]]&#125;&#125;|CHA,{{rname=Charisma Save&#125;&#125;{{mod=@{npc_cha_save}&#125;&#125; {{r1=[[1d20+@{npc_cha_save}]]&#125;&#125;{{r2=[[1d20+@{npc_cha_save}]]&#125;&#125;}{{charname=@{character_name}}} ";
	d20plus.actionMacroSkillCheck = "/w gm &{template:simple}{{always=1}}?{Ability?|Acrobatics,{{rname=Acrobatics&#125;&#125;{{mod=@{npc_acrobatics}&#125;&#125; {{r1=[[1d20+@{npc_acrobatics}]]&#125;&#125;{{r2=[[1d20+@{npc_acrobatics}]]&#125;&#125;|Animal Handling,{{rname=Animal Handling&#125;&#125;{{mod=@{npc_animal_handling}&#125;&#125; {{r1=[[1d20+@{npc_animal_handling}]]&#125;&#125;{{r2=[[1d20+@{npc_animal_handling}]]&#125;&#125;|Arcana,{{rname=Arcana&#125;&#125;{{mod=@{npc_arcana}&#125;&#125; {{r1=[[1d20+@{npc_arcana}]]&#125;&#125;{{r2=[[1d20+@{npc_arcana}]]&#125;&#125;|Athletics,{{rname=Athletics&#125;&#125;{{mod=@{npc_athletics}&#125;&#125; {{r1=[[1d20+@{npc_athletics}]]&#125;&#125;{{r2=[[1d20+@{npc_athletics}]]&#125;&#125;|Deception,{{rname=Deception&#125;&#125;{{mod=@{npc_deception}&#125;&#125; {{r1=[[1d20+@{npc_deception}]]&#125;&#125;{{r2=[[1d20+@{npc_deception}]]&#125;&#125;|History,{{rname=History&#125;&#125;{{mod=@{npc_history}&#125;&#125; {{r1=[[1d20+@{npc_history}]]&#125;&#125;{{r2=[[1d20+@{npc_history}]]&#125;&#125;|Insight,{{rname=Insight&#125;&#125;{{mod=@{npc_insight}&#125;&#125; {{r1=[[1d20+@{npc_insight}]]&#125;&#125;{{r2=[[1d20+@{npc_insight}]]&#125;&#125;|Intimidation,{{rname=Intimidation&#125;&#125;{{mod=@{npc_intimidation}&#125;&#125; {{r1=[[1d20+@{npc_intimidation}]]&#125;&#125;{{r2=[[1d20+@{npc_intimidation}]]&#125;&#125;|Investigation,{{rname=Investigation&#125;&#125;{{mod=@{npc_investigation}&#125;&#125; {{r1=[[1d20+@{npc_investigation}]]&#125;&#125;{{r2=[[1d20+@{npc_investigation}]]&#125;&#125;|Medicine,{{rname=Medicine&#125;&#125;{{mod=@{npc_medicine}&#125;&#125; {{r1=[[1d20+@{npc_medicine}]]&#125;&#125;{{r2=[[1d20+@{npc_medicine}]]&#125;&#125;|Nature,{{rname=Nature&#125;&#125;{{mod=@{npc_nature}&#125;&#125; {{r1=[[1d20+@{npc_nature}]]&#125;&#125;{{r2=[[1d20+@{npc_nature}]]&#125;&#125;|Perception,{{rname=Perception&#125;&#125;{{mod=@{npc_perception}&#125;&#125; {{r1=[[1d20+@{npc_perception}]]&#125;&#125;{{r2=[[1d20+@{npc_perception}]]&#125;&#125;|Performance,{{rname=Performance&#125;&#125;{{mod=@{npc_performance}&#125;&#125; {{r1=[[1d20+@{npc_performance}]]&#125;&#125;{{r2=[[1d20+@{npc_performance}]]&#125;&#125;|Persuasion,{{rname=Persuasion&#125;&#125;{{mod=@{npc_persuasion}&#125;&#125; {{r1=[[1d20+@{npc_persuasion}]]&#125;&#125;{{r2=[[1d20+@{npc_persuasion}]]&#125;&#125;|Religion,{{rname=Religion&#125;&#125;{{mod=@{npc_religion}&#125;&#125; {{r1=[[1d20+@{npc_religion}]]&#125;&#125;{{r2=[[1d20+@{npc_religion}]]&#125;&#125;|Sleight of Hand,{{rname=Sleight of Hand&#125;&#125;{{mod=@{npc_sleight_of_hand}&#125;&#125; {{r1=[[1d20+@{npc_sleight_of_hand}]]&#125;&#125;{{r2=[[1d20+@{npc_sleight_of_hand}]]&#125;&#125;|Stealth,{{rname=Stealth&#125;&#125;{{mod=@{npc_stealth}&#125;&#125; {{r1=[[1d20+@{npc_stealth}]]&#125;&#125;{{r2=[[1d20+@{npc_stealth}]]&#125;&#125;|Survival,{{rname=Survival&#125;&#125;{{mod=@{npc_survival}&#125;&#125; {{r1=[[1d20+@{npc_survival}]]&#125;&#125;{{r2=[[1d20+@{npc_survival}]]&#125;&#125;}{{charname=@{character_name}}} ";
	d20plus.actionMacroAbilityCheck = "/w gm &{template:simple}{{always=1}}?{Ability?|STR,{{rname=Strength&#125;&#125;{{mod=@{strength_mod}&#125;&#125; {{r1=[[1d20+@{strength_mod}]]&#125;&#125;{{r2=[[1d20+@{strength_mod}]]&#125;&#125;|DEX,{{rname=Dexterity&#125;&#125;{{mod=@{dexterity_mod}&#125;&#125; {{r1=[[1d20+@{dexterity_mod}]]&#125;&#125;{{r2=[[1d20+@{dexterity_mod}]]&#125;&#125;|CON,{{rname=Constitution&#125;&#125;{{mod=@{constitution_mod}&#125;&#125; {{r1=[[1d20+@{constitution_mod}]]&#125;&#125;{{r2=[[1d20+@{constitution_mod}]]&#125;&#125;|INT,{{rname=Intelligence&#125;&#125;{{mod=@{intelligence_mod}&#125;&#125; {{r1=[[1d20+@{intelligence_mod}]]&#125;&#125;{{r2=[[1d20+@{intelligence_mod}]]&#125;&#125;|WIS,{{rname=Wisdom&#125;&#125;{{mod=@{wisdom_mod}&#125;&#125; {{r1=[[1d20+@{wisdom_mod}]]&#125;&#125;{{r2=[[1d20+@{wisdom_mod}]]&#125;&#125;|CHA,{{rname=Charisma&#125;&#125;{{mod=@{charisma_mod}&#125;&#125; {{r1=[[1d20+@{charisma_mod}]]&#125;&#125;{{r2=[[1d20+@{charisma_mod}]]&#125;&#125;}{{charname=@{character_name}}} ";

	d20plus.actionMacroTrait = function (index) {
		return "/w gm &{template:npcaction} {{name=@{selected|npc_name}}} {{rname=@{selected|repeating_npctrait_$" + index + "_name}}} {{description=@{selected|repeating_npctrait_$" + index + "_desc} }}";
	};

	d20plus.actionMacroAction = function (index) {
		return "%{selected|repeating_npcaction_$"+ index + "_npc_action}";
	};

	d20plus.actionMacroReaction = "/w gm &{template:npcaction} {{name=@{selected|npc_name}}} {{rname=@{selected|repeating_npcreaction_$0_name}}} {{description=@{selected|repeating_npcreaction_$0_desc} }} ";

	d20plus.actionMacroLegendary = function (tokenactiontext) {
		return "/w gm @{selected|wtype}&{template:npcaction} {{name=@{selected|npc_name}}} {{rname=Legendary Actions}} {{description=The @{selected|npc_name} can take @{selected|npc_legendary_actions} legendary actions, choosing from the options below. Only one legendary option can be used at a time and only at the end of another creature's turn. The @{selected|npc_name} regains spent legendary actions at the start of its turn.\n\r" + tokenactiontext + "}} ";
	}

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
