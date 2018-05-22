// ==UserScript==
// @name         betteR20-5etools
// @namespace    https://rem.uz/
// @license      MIT (https://opensource.org/licenses/MIT)
// @version      1.7.3
// @updateURL    https://get.5etools.com/script/betteR20-5etools.user.js
// @downloadURL  https://get.5etools.com/script/betteR20-5etools.user.js
// @description  Enhance your Roll20 experience
// @author       5egmegaanon/astranauta/MrLabRat/TheGiddyLimit/DBAWiseMan/BDeveau/Remuz/Callador Julaan/Erogroth
// @match        https://app.roll20.net/editor/
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==


ART_HANDOUT = "betteR20-art";
CONFIG_HANDOUT = "betteR20-config";

BASE_SITE_URL = "https://thegiddylimit.github.io/"; // FIXME restore when the main site is back up/automate this

SCRIPT_EXTENSIONS = [];

CONFIG_OPTIONS = {
	interface: {
		_name: "Interface",
		showCustomArtPreview: {
			name: "Show Custom Art Previews",
			default: true,
			_type: "boolean"
		}
	}
};

addConfigOptions = function (category, options) {
	if (!CONFIG_OPTIONS[category]) CONFIG_OPTIONS[category] = options;
	else CONFIG_OPTIONS[category] = Object.assign(CONFIG_OPTIONS[category], options);
};

OBJECT_DEFINE_PROPERTY = Object.defineProperty;
Object.defineProperty = function (obj, prop, vals) {
	try {
		if (prop === "largefeats" || prop === "xlfeats") {
			vals.value = true;
		}
		OBJECT_DEFINE_PROPERTY(obj, prop, vals);
	} catch (e) {
		console.log("failed to define property:");
		console.log(e);
		console.log(obj, prop, vals);
	}
};

UPPER_CANVAS_MOUSEDOWN = null;
EventTarget.prototype.addEventListenerBase = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(type, listener, options, ...others) {
	if (type === "mousedown" && this === d20.engine.uppercanvas) UPPER_CANVAS_MOUSEDOWN = listener;
	this.addEventListenerBase(type, listener, options, ...others);
};

const betteR205etools = function () {
	const DATA_URL = BASE_SITE_URL + "data/";
	const JS_URL = BASE_SITE_URL + "js/";
	const IMG_URL = BASE_SITE_URL + "img/";

	const SPELL_DATA_DIR = `${DATA_URL}spells/`;
	const SPELL_META_URL = `${SPELL_DATA_DIR}roll20.json`;
	const MONSTER_DATA_DIR = `${DATA_URL}bestiary/`;
	const ADVENTURE_DATA_DIR = `${DATA_URL}adventure/`;

	const ITEM_DATA_URL = `${DATA_URL}items.json`;
	const FEAT_DATA_URL = `${DATA_URL}feats.json`;
	const PSIONIC_DATA_URL = `${DATA_URL}psionics.json`;
	const OBJECT_DATA_URL = `${DATA_URL}objects.json`;
	const CLASS_DATA_URL = `${DATA_URL}classes.json`;
	const BACKGROUND_DATA_URL = `${DATA_URL}backgrounds.json`;
	const RACE_DATA_URL = `${DATA_URL}races.json`;

	const HOMEBREW_REPO_URL = `https://api.github.com/repos/TheGiddyLimit/homebrew/`;
	// the GitHub API has a 60 requests/hour limit per IP which we quickly hit if the user refreshes their Roll20 a couple of times
	// embed shitty OAth2 details here to enable 5k/hour requests per IP (sending them with requests to the API relaxes the limit)
	// naturally these are client-visible and should not be used to secure anything
	const HOMEBREW_CLIENT_ID = `67e57877469da38a85a7`;
	const HOMEBREW_CLIENT_SECRET = `c00dede21ca63a855abcd9a113415e840aca3f92`;

	const REQUIRED_PROPS = {
		"monster": [
			"ac",
			"alignment",
			"cha",
			"con",
			"cr",
			"dex",
			"hp",
			"int",
			"name",
			"passive",
			"size",
			"source",
			"speed",
			"str",
			"type",
			"wis"
		],
		"spell": [
			"name",
			"level",
			"school",
			"time",
			"range",
			"components",
			"duration",
			"classes",
			"entries",
			"source"
		],
		"item": [
			"name",
			"rarity",
			"source"
		],
		"psionic": [
			"name",
			"source",
			"type"
		],
		"feat": [
			"name",
			"source",
			"entries"
		],
		"object": [
			"name",
			"source",
			"size",
			"type",
			"ac",
			"hp",
			"immune",
			"entries"
		],
		"class": [
			"name",
			"source",
			"hd",
			"proficiency",
			"classTableGroups",
			"startingProficiencies",
			"startingEquipment",
			"classFeatures",
			"subclassTitle",
			"subclasses"
		],
		"subclass": [

		],
		"background": [
			"name",
			"source",
			"skillProficiencies",
			"entries"
		],
		"race": [
			"name",
			"source"
		]
	};

	let spellDataUrls = {};
	let spellMetaData = {};
	let monsterDataUrls = {};
	let monsterFluffDataUrls = {};
	let monsterFluffData = {};
	let adventureMetadata = {};

// build a big dictionary of sheet properties to be used as reference throughout // TODO use these as reference throughout
	function SheetAttribute (name, ogl, shaped) {
		this.name = name;
		this.ogl = ogl;
		this.shaped = shaped;
	}

	NPC_SHEET_ATTRIBUTES = {};
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
	NPC_SHEET_ATTRIBUTES["npc_legendary_actions"] = new SheetAttribute("Legendary Actions", "npc_legendary_actions", "npc_legendary_actions");
	NPC_SHEET_ATTRIBUTES["npc_challenge"] = new SheetAttribute("CR", "npc_challenge", "challenge");

	PC_SHEET_ATTRIBUTES = {};
	PC_SHEET_ATTRIBUTES["empty"] = new SheetAttribute("--Default--", "", "");
	PC_SHEET_ATTRIBUTES["hp"] = new SheetAttribute("Current HP", "hp", "HP");
	PC_SHEET_ATTRIBUTES["ac"] = new SheetAttribute("AC", "ac", "ac"); // TODO check shaped
	PC_SHEET_ATTRIBUTES["passive_wisdom"] = new SheetAttribute("Passive Perception", "passive_wisdom", "passive_wisdom"); // TODO check shaped
	PC_SHEET_ATTRIBUTES["speed"] = new SheetAttribute("Speed", "speed", "speed"); // TODO check shaped
	PC_SHEET_ATTRIBUTES["spell_save_dc"] = new SheetAttribute("Spell Save DC", "spell_save_dc", "spell_save_dc"); // TODO check shaped

	addConfigOptions("token", {
		"_name": "Tokens",
		"bar1": {
			"name": "Bar 1 (NPC)",
			"default": "npc_hpbase",
			"_type": "_SHEET_ATTRIBUTE"
		},
		"bar1_pc": {
			"name": "Bar 1 (PC)",
			"default": "",
			"_type": "_SHEET_ATTRIBUTE_PC"
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
			"name": "Bar 2 (NPC)",
			"default": "npc_ac",
			"_type": "_SHEET_ATTRIBUTE"
		},
		"bar2_pc": {
			"name": "Bar 2 (PC)",
			"default": "",
			"_type": "_SHEET_ATTRIBUTE_PC"
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
			"name": "Bar 3 (NPC)",
			"default": "passive",
			"_type": "_SHEET_ATTRIBUTE"
		},
		"bar3_pc": {
			"name": "Bar 3 (PC)",
			"default": "",
			"_type": "_SHEET_ATTRIBUTE_PC"
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
		"maximiseHp": {
			"name": "Maximise Token HP",
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
		"namesuffix": {
			"name": "Append Text to Names on Import",
			"default": "",
			"_type": "String"
		}
	});
	addConfigOptions("import", {
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
		},
		"importFluffAs": {
			"name": "Import Creature Fluff As...",
			"default": "Bio",
			"_type": "_enum",
			"_values": ["Bio", "GM Notes"]
		},
		"whispermode": {
			"name": "Sheet Whisper Mode on Import",
			"default": "Toggle (Default GM)",
			"_type": "_WHISPERMODE"
		},
		"advantagemode": {
			"name": "Sheet Advantage Mode on Import",
			"default": "Toggle (Default Advantage)",
			"_type": "_ADVANTAGEMODE"
		},
		"damagemode": {
			"name": "Sheet Auto Roll Damage Mode on Import",
			"default": "Auto Roll",
			"_type": "_DAMAGEMODE"
		},
		"skipSenses": {
			"name": "Skip Importing Creature Senses",
			"default": false,
			"_type": "boolean"
		},
	});
	addConfigOptions("interface", {
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
			"name": "Show Difficulty in Tracker",
			"default": true,
			"_type": "boolean"
		},
		"emoji": {
			"name": "Add Emoji Replacement to Chat",
			"default": true,
			"_type": "boolean"
		},
		"showCustomArtPreview": {
			"name": "Show Custom Art Previews",
			"default": true,
			"_type": "boolean"
		}
	});

	d20plus.sheet = "ogl";
	d20plus.remaining = 0;
	d20plus.initiative = {};
	d20plus.importer = {};
	d20plus.monsters = {};
	d20plus.spells = {};
	d20plus.psionics = {};
	d20plus.items = {};
	d20plus.feats = {};
	d20plus.races = {};
	d20plus.objects = {};
	d20plus.classes = {};
	d20plus.subclasses = {};
	d20plus.backgrounds = {};
	d20plus.adventures = {};

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

	d20plus.scripts.push({name: "5etoolsutils", url: `${JS_URL}utils.js`});
	d20plus.scripts.push({name: "5etoolsrender", url: `${JS_URL}entryrender.js`});

	d20plus.json = [
		{name: "spell index", url: `${SPELL_DATA_DIR}index.json`},
		{name: "spell metadata", url: SPELL_META_URL},
		{name: "bestiary index", url: `${MONSTER_DATA_DIR}index.json`},
		{name: "bestiary fluff index", url: `${MONSTER_DATA_DIR}fluff-index.json`},
		{name: "adventures index", url: `${DATA_URL}adventures.json`},
		{name: "basic items", url: `${DATA_URL}basicitems.json`}
	];

	// add JSON index/metadata
	d20plus.addJson = function (onLoadFunction) {
		d20plus.log("Load JSON");
		const onEachLoadFunction = function (name, url, data) {
			if (name === "spell index") spellDataUrls = data;
			else if (name === "spell metadata") spellMetaData = data;
			else if (name === "bestiary index") monsterDataUrls = data;
			else if (name === "bestiary fluff index") monsterFluffDataUrls = data;
			else if (name === "adventures index") adventureMetadata = data;
			else if (name === "basic items") {
				data.itemProperty.forEach(p => EntryRenderer.item._addProperty(p));
				data.itemType.forEach(t => EntryRenderer.item._addType(t));
			}
			else throw new Error(`Unhandled data from JSON ${name} (${url})`);

			d20plus.log(`JSON [${name}] Loaded`);
		};
		d20plus.chainLoad(d20plus.json, 0, onEachLoadFunction, onLoadFunction);
	};

	d20plus.handleConfigChange = function () {
		if (window.is_gm) {
			d20plus.log("Applying config");
			d20plus.setInitiativeShrink(d20plus.getCfgVal("interface", "minifyTracker"));
			d20.Campaign.initiativewindow.rebuildInitiativeList();
			d20plus.updateDifficulty();
			if (d20plus.art.refreshList) d20plus.art.refreshList();
		}
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

	d20plus.importer._playerImports = {};
	d20plus.importer.storePlayerImport = function (id, data) {
		d20plus.importer._playerImports[id] = data;
	};

	d20plus.importer.retreivePlayerImport = function (id) {
		return d20plus.importer._playerImports[id];
	};

	d20plus.importer.clearPlayerImport = function () {
		d20plus.importer._playerImports = {};
	};

	d20plus.importer.addMeta = function (meta) {
		if (!meta) return;
		BrewUtil._sourceCache = BrewUtil._sourceCache || {};
		if (meta.sources) {
			meta.sources.forEach(src => {
				BrewUtil._sourceCache[src.json] = {abbreviation: src.abbreviation, full: src.full};
			})
		}
	};

// Page fully loaded and visible
	d20plus.Init = function () {
		d20plus.log("Init (v" + d20plus.version + ")");
		d20plus.settingsHtmlHeader = `<hr><h3>betteR20-5etools v${d20plus.version}</h3>`;
		d20plus.addAllCss();
		if (window.is_gm) {
			d20plus.log("Is GM");
			d20plus.enhancePageSelector();
		}
		else d20plus.log("Not GM. Some functionality will be unavailable.");
		d20plus.setSheet();
		d20plus.addScripts(d20plus.onScriptLoad);
	};

// continue init once JSON loads
	d20plus.onScriptLoad = function () {
		d20plus.addJson(d20plus.onJsonLoad);
	};

// continue init once scripts load
	d20plus.onJsonLoad = function () {
		IS_ROLL20 = true; // global variable from 5etools' utils.js
		BrewUtil._buildSourceCache = function () {
			// no-op when building source cache; we'll handle this elsewhere
			BrewUtil._sourceCache = BrewUtil._sourceCache || {};
		};
		EntryRenderer.getDefaultRenderer().setBaseUrl(BASE_SITE_URL);
		if (window.is_gm) d20plus.loadConfig(d20plus.onConfigLoad);
		else d20plus.onConfigLoad();
	};

// continue more init after config loaded
	d20plus.onConfigLoad = function () {
		if (window.is_gm) d20plus.loadArt(d20plus.onArtLoad);
		else d20plus.onArtLoad();
	};

// continue more init after art loaded
	d20plus.onArtLoad = function () {
		d20plus.bindDropLocations();
		d20plus.addHtmlHeader();
		d20plus.addCustomHTML();
		d20plus.addHtmlFooter();
		d20plus.enhanceMarkdown();
		d20plus.addProFeatures();
		d20plus.initArtFromUrlButtons();
		if (window.is_gm) {
			d20plus.addJournalCommands();
			d20plus.addSelectedTokenCommands();
			d20.Campaign.pages.each(d20plus.bindGraphics);
			d20.Campaign.activePage().collection.on("add", d20plus.bindGraphics);
			d20plus.addCustomArtSearch();
			d20plus.handleConfigChange();
			d20plus.addTokenHover();
		} else {
			d20plus.startPlayerConfigHandler();
		}
		d20plus.enhanceStatusEffects();
		d20plus.enhanceMeasureTool();
		d20plus.enhanceSnap();
		d20plus.enhanceChat();
		d20plus.log("All systems operational");
		d20plus.chatTag(`betteR20-5etools v${d20plus.version}`);
	};

// Bind Graphics Add on page
	d20plus.bindGraphics = function (page) {
		d20plus.log("Bind Graphics");
		try {
			if (page.get("archived") === false) {
				page.thegraphics.on("add", function (e) {
					var character = e.character;
					if (character) {
						var npc = character.attribs.find(function (a) {
							return a.get("name").toLowerCase() == "npc";
						});
						var isNPC = npc ? parseInt(npc.get("current")) : 0;
						// Set bars if configured to do so
						var barsList = ["bar1", "bar2", "bar3"];
						$.each(barsList, (i, barName) => {
							// PC config keys are suffixed "_pc"
							const confVal = d20plus.getCfgVal("token", `${barName}${isNPC ? "" : "_pc"}`);
							if (confVal) {
								const charAttr = character.attribs.find(a => a.get("name").toLowerCase() == confVal);
								if (charAttr) {
									e.attributes[barName + "_value"] = charAttr.get("current");
									if (d20plus.hasCfgVal("token", barName + "_max")) {
										if (d20plus.getCfgVal("token", barName + "_max") && !isNPC && confVal === "hp") { // player HP is current; need to set max to max
											e.attributes[barName + "_max"] = charAttr.get("max");
										} else {
											if (isNPC) {
												// TODO: Setting a value to empty/null does not overwrite existing values on the token.
												// setting a specific value does. Must figure this out.
												e.attributes[barName + "_max"] = d20plus.getCfgVal("token", barName + "_max") ? charAttr.get("current") : "";
											} else {
												// preserve default token for player tokens
												if (d20plus.getCfgVal("token", barName + "_max")) {
													e.attributes[barName + "_max"] = charAttr.get("current");
												}
											}
										}
									}
									if (d20plus.hasCfgVal("token", barName + "_reveal")) {
										e.attributes["showplayers_" + barName] = d20plus.getCfgVal("token", barName + "_reveal");
									}
								}
							}
						});

						// NPC-only settings
						if (isNPC) {
							// Set Nametag
							if (d20plus.hasCfgVal("token", "name")) {
								e.attributes["showname"] = d20plus.getCfgVal("token", "name");
								if (d20plus.hasCfgVal("token", "name_reveal")) {
									e.attributes["showplayers_name"] = d20plus.getCfgVal("token", "name_reveal");
								}
							}

							// Roll HP
							// TODO: npc_hpbase appears to be hardcoded here? Refactor for NPC_SHEET_ATTRIBUTES?
							if ((d20plus.getCfgVal("token", "rollHP") || d20plus.getCfgVal("token", "maximiseHp")) && d20plus.getCfgKey("token", "npc_hpbase")) {
								var hpf = character.attribs.find(function (a) {
									return a.get("name").toLowerCase() == NPC_SHEET_ATTRIBUTES["npc_hpformula"][d20plus.sheet];
								});
								var barName = d20plus.getCfgKey("token", "npc_hpbase");
								var hpformula = hpf.get("current");

								if (hpformula && hpf) {
									if (d20plus.getCfgVal("token", "maximiseHp")) {
										const maxSum = hpformula.replace("d", "*");
										try {
											const max = eval(maxSum);
											if (!isNaN(max)) {
												e.attributes[barName + "_value"] = max;
												e.attributes[barName + "_max"] = max;
											}
										} catch (error) {
											d20plus.log("Error Maximising HP");
											console.log(error);
										}
									} else {
										d20plus.randomRoll(hpformula, function (result) {
											e.attributes[barName + "_value"] = result.total;
											e.attributes[barName + "_max"] = result.total;
											d20plus.log("Rolled HP for [" + character.get("name") + "]");
										}, function (error) {
											d20plus.log("Error Rolling HP Dice");
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

// Determine difficulty of current encounter (iniativewindow)
	d20plus.getDifficulty = function () {
		var difficulty = "Unknown";
		var partyXPThreshold = [0, 0, 0, 0];
		var players = [];
		var npcs = [];
		try {
			$.each(d20.Campaign.initiativewindow.cleanList(), function (i, v) {
				var page = d20.Campaign.pages.get(v._pageid);
				if (page) {
					var token = page.thegraphics.get(v.id);
					if (token) {
						var char = token.character;
						if (char) {
							var npc = char.attribs.find(function (a) {
								return a.get("name").toLowerCase() === "npc";
							});
							if (npc && npc.get("current") === "1") {
								npcs.push(char);
							} else {
								var level = char.attribs.find(function (a) {
									return a.get("name").toLowerCase() === "level";
								});
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
				else if (len < 3) index = 1;
				else if (len < 7) index = 2;
				else if (len < 11) index = 3;
				else if (len < 15) index = 4;
				else
					index = 5;
				// Adjust for smaller parties
				if (players.length < 3) index++;
				// Set multiplier
				multiplier = d20plus.multipliers[index];
				// Total monster xp
				$.each(npcs, function (i, v) {
					var cr = v.attribs.find(function (a) {
						return a.get("name").toLowerCase() === "npc_challenge";
					});
					if (cr) xp += parseInt(Parser.crToXp(cr.get("current")));
				});
				// Encounter's adjusted xp
				adjustedxp = xp * multiplier;
				console.log("Party XP Threshold", partyXPThreshold);
				console.log("Adjusted XP", adjustedxp);
				// Determine difficulty
				if (adjustedxp < partyXPThreshold[0]) difficulty = "Trivial";
				else if (adjustedxp < partyXPThreshold[1]) difficulty = "Easy";
				else if (adjustedxp < partyXPThreshold[2]) difficulty = "Medium";
				else if (adjustedxp < partyXPThreshold[3]) difficulty = "Hard";
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

		const root = {i: d20plus.getJournalFolderObj()};

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
				d20plus.log("Nuking folder...");
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

		const root = {i: d20plus.getJournalFolderObj()};

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

		const root = {i: d20plus.getJournalFolderObj()};

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

	d20plus.addCustomHTML = function () {
		function populateDropdown (dropdownId, inputFieldId, baseUrl, srcUrlObject, defaultSel, homebrewDir) {
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

			const brewUrl = `${HOMEBREW_REPO_URL}contents/${homebrewDir}${d20plus.getAntiCacheSuffix()}&client_id=${HOMEBREW_CLIENT_ID}&client_secret=${HOMEBREW_CLIENT_SECRET}`;
			DataUtil.loadJSON(brewUrl, (data, debugUrl) => {
				if (data.message) console.error(debugUrl, data.message);
				data.forEach(it => {
					dropdown.append($('<option>', {
						value: `${it.download_url}${d20plus.getAntiCacheSuffix()}`,
						text: `Homebrew: ${it.name.trim().replace(/\.json$/i, "")}`
					}));
				});
			}, brewUrl);

			dropdown.val(defaultUrl);
			dropdown.change(function () {
				$(inputFieldId).val(this.value);
			});
		}

		function populateBasicDropdown (dropdownId, inputFieldId, defaultSel, homebrewDir, addForPlayers) {
			function doPopulate (dropdownId, inputFieldId) {
				const $sel = $(dropdownId);
				if (defaultSel) {
					$(inputFieldId).val(defaultSel);
					$sel.append($('<option>', {
						value: defaultSel,
						text: "Official Sources"
					}));
				}
				$sel.append($('<option>', {
					value: "",
					text: "Custom"
				}));

				const brewUrl = `${HOMEBREW_REPO_URL}contents/${homebrewDir}${d20plus.getAntiCacheSuffix()}&client_id=${HOMEBREW_CLIENT_ID}&client_secret=${HOMEBREW_CLIENT_SECRET}`;
				DataUtil.loadJSON(brewUrl, (data, debugUrl) => {
					if (data.message) console.error(debugUrl, data.message);
					data.forEach(it => {
						$sel.append($('<option>', {
							value: `${it.download_url}${d20plus.getAntiCacheSuffix()}`,
							text: `Homebrew: ${it.name.trim().replace(/\.json$/i, "")}`
						}));
					});
				}, brewUrl);

				$sel.val(defaultSel);
				$sel.change(function () {
					$(inputFieldId).val(this.value);
				});
			}

			doPopulate(dropdownId, inputFieldId, defaultSel, homebrewDir);
			if (addForPlayers) doPopulate(`${dropdownId}-player`, `${inputFieldId}-player`, defaultSel, homebrewDir);
		}

		const $body = $("body");
		if (window.is_gm) {
			const $wrpSettings = $(`#betteR20-settings`);

			$wrpSettings.append(d20plus.settingsHtmlImportHeader);
			$wrpSettings.append(d20plus.settingsHtmlSelector);
			$wrpSettings.append(d20plus.settingsHtmlPtMonsters);
			$wrpSettings.append(d20plus.settingsHtmlPtItems);
			$wrpSettings.append(d20plus.settingsHtmlPtSpells);
			$wrpSettings.append(d20plus.settingsHtmlPtPsionics);
			$wrpSettings.append(d20plus.settingsHtmlPtRaces);
			$wrpSettings.append(d20plus.settingsHtmlPtFeats);
			$wrpSettings.append(d20plus.settingsHtmlPtObjects);
			$wrpSettings.append(d20plus.settingsHtmlPtClasses);
			$wrpSettings.append(d20plus.settingsHtmlPtSubclasses);
			$wrpSettings.append(d20plus.settingsHtmlPtBackgrounds);
			$wrpSettings.append(d20plus.settingsHtmlPtAdventures);
			$wrpSettings.append(d20plus.settingsHtmlPtImportFooter);

			$("#mysettings > .content a#button-monsters-load").on(window.mousedowntype, d20plus.monsters.button);
			$("#mysettings > .content a#button-monsters-load-all").on(window.mousedowntype, d20plus.monsters.buttonAll);
			$("#mysettings > .content a#import-objects-load").on(window.mousedowntype, d20plus.objects.button);
			$("#mysettings > .content a#button-adventures-load").on(window.mousedowntype, d20plus.adventures.button);

			$("#mysettings > .content a#bind-drop-locations").on(window.mousedowntype, d20plus.bindDropLocations);
			$("#initiativewindow .characterlist").before(d20plus.initiativeHeaders);

			d20plus.setTurnOrderTemplate();
			d20.Campaign.initiativewindow.rebuildInitiativeList();
			d20plus.hpAllowEdit();
			d20.Campaign.initiativewindow.model.on("change:turnorder", function () {
				d20plus.updateDifficulty();
			});
			d20plus.updateDifficulty();

			populateDropdown("#button-monsters-select", "#import-monster-url", MONSTER_DATA_DIR, monsterDataUrls, "MM", "creature");
			populateBasicDropdown("#button-objects-select", "#import-objects-url", OBJECT_DATA_URL, "object");

			populateAdventuresDropdown();

			function populateAdventuresDropdown () {
				const defaultAdvUrl = d20plus.formSrcUrl(ADVENTURE_DATA_DIR, "adventure-lmop.json");
				const $iptUrl = $("#import-adventures-url");
				$iptUrl.val(defaultAdvUrl);
				$iptUrl.data("id", "lmop");
				const $sel = $("#button-adventures-select");
				adventureMetadata.adventure.forEach(a => {
					$sel.append($('<option>', {
						value: d20plus.formSrcUrl(ADVENTURE_DATA_DIR, `adventure-${a.id.toLowerCase()}.json|${a.id}`),
						text: a.name
					}));
				});
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

			// import
			$("a#button-spells-load").on(window.mousedowntype, () => d20plus.spells.button());
			$("a#button-spells-load-all").on(window.mousedowntype, () => d20plus.spells.buttonAll());
			$("a#import-psionics-load").on(window.mousedowntype, () => d20plus.psionics.button());
			$("a#import-items-load").on(window.mousedowntype, () => d20plus.items.button());
			$("a#import-races-load").on(window.mousedowntype, () => d20plus.races.button());
			$("a#import-feats-load").on(window.mousedowntype, () => d20plus.feats.button());
			$("a#import-classes-load").on(window.mousedowntype, () => d20plus.classes.button());
			$("a#import-subclasses-load").on(window.mousedowntype, () => d20plus.subclasses.button());
			$("a#import-backgrounds-load").on(window.mousedowntype, () => d20plus.backgrounds.button());
			$("select#import-mode-select").on("change", () => d20plus.importer.importModeSwitch());
		} else {
			// player-only HTML if required
		}

		$body.append(d20plus.playerImportHtml);
		const $winPlayer = $("#d20plus-playerimport");
		const $appTo = $winPlayer.find(`.append-target`);
		$appTo.append(d20plus.settingsHtmlSelectorPlayer);
		$appTo.append(d20plus.settingsHtmlPtItemsPlayer);
		$appTo.append(d20plus.settingsHtmlPtSpellsPlayer);
		$appTo.append(d20plus.settingsHtmlPtPsionicsPlayer);
		$appTo.append(d20plus.settingsHtmlPtRacesPlayer);
		$appTo.append(d20plus.settingsHtmlPtFeatsPlayer);
		$appTo.append(d20plus.settingsHtmlPtClassesPlayer);
		$appTo.append(d20plus.settingsHtmlPtSubclassesPlayer);
		$appTo.append(d20plus.settingsHtmlPtBackgroundsPlayer);

		$winPlayer.dialog({
			autoOpen: false,
			resizable: true,
			width: 800,
			height: 650,
		});

		const $wrpPlayerImport = $(`
			<div style="padding: 0 10px">
				<div style="clear: both"></div>
			</div>`);
		const $btnPlayerImport = $(`<button class="btn" href="#" title="A tool to import temporary copies of various things, which can be drag-and-dropped to character sheets." style="margin-top: 5px">Temp Import Spells, Items, Classes,...</button>`)
			.on("click", () => {
				$winPlayer.dialog("open");
			});
		$wrpPlayerImport.prepend($btnPlayerImport);
		$(`#journal`).prepend($wrpPlayerImport);

		// SHARED WINDOWS/BUTTONS
		// import
		$("a#button-spells-load-player").on(window.mousedowntype, () => d20plus.spells.button(true));
		$("a#button-spells-load-all-player").on(window.mousedowntype, () => d20plus.spells.buttonAll(true));
		$("a#import-psionics-load-player").on(window.mousedowntype, () => d20plus.psionics.button(true));
		$("a#import-items-load-player").on(window.mousedowntype, () => d20plus.items.button(true));
		$("a#import-races-load-player").on(window.mousedowntype, () => d20plus.races.button(true));
		$("a#import-feats-load-player").on(window.mousedowntype, () => d20plus.feats.button(true));
		$("a#import-classes-load-player").on(window.mousedowntype, () => d20plus.classes.button(true));
		$("a#import-subclasses-load-player").on(window.mousedowntype, () => d20plus.subclasses.button(true));
		$("a#import-backgrounds-load-player").on(window.mousedowntype, () => d20plus.backgrounds.button(true));
		$("select#import-mode-select-player").on("change", () => d20plus.importer.importModeSwitch());

		$body.append(d20plus.importDialogHtml);
		$body.append(d20plus.importListHTML);
		$body.append(d20plus.importListPropsHTML);
		$("#d20plus-import").dialog({
			autoOpen: false,
			resizable: false
		});
		$("#d20plus-importlist").dialog({
			autoOpen: false,
			resizable: true,
			width: 1000,
			height: 700
		});
		$("#d20plus-import-props").dialog({
			autoOpen: false,
			resizable: true,
			width: 300,
			height: 600
		});

		populateDropdown("#button-spell-select", "#import-spell-url", SPELL_DATA_DIR, spellDataUrls, "PHB", "spell");
		populateDropdown("#button-spell-select-player", "#import-spell-url-player", SPELL_DATA_DIR, spellDataUrls, "PHB", "spell");

		populateBasicDropdown("#button-items-select", "#import-items-url", ITEM_DATA_URL, "item", true);
		populateBasicDropdown("#button-psionics-select", "#import-psionics-url", PSIONIC_DATA_URL, "psionic", true);
		populateBasicDropdown("#button-feats-select", "#import-feats-url", FEAT_DATA_URL, "feat", true);
		populateBasicDropdown("#button-races-select", "#import-races-url", RACE_DATA_URL, "race", true);
		populateBasicDropdown("#button-classes-select", "#import-classes-url", CLASS_DATA_URL, "class", true);
		populateBasicDropdown("#button-subclasses-select", "#import-subclasses-url", "", "subclass", true);
		populateBasicDropdown("#button-backgrounds-select", "#import-backgrounds-url", BACKGROUND_DATA_URL, "background", true);

		// bind tokens button
		const altBindButton = $(`<button id="bind-drop-locations-alt" class="btn bind-drop-locations" href="#" title="Bind drop locations and handouts">Bind Drag-n-Drop</button>`);
		altBindButton.on("click", function () {
			d20plus.bindDropLocations();
		});

		if (window.is_gm) {
			const $addPoint = $(`#journal button.btn.superadd`);
			altBindButton.css("margin-right", "5px");
			$addPoint.after(altBindButton);
		} else {
			altBindButton.css("margin-top", "5px");
			const $wrprControls = $(`#search-wrp-controls`);
			$wrprControls.append(altBindButton);
		}
		$("#journal btn#bind-drop-locations").on(window.mousedowntype, d20plus.bindDropLocations);
	};

	d20plus.updateDifficulty = function () {
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
	d20plus.bindDropLocations = function () {
		if (window.is_gm) {
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
				d20.journal.addFolderToFolderStructure("Races");
				d20.journal.refreshJournalList();
				journalFolder = d20.Campaign.get("journalfolder");
			}
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
		addClasses("Races");

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
				start: function () {
					$("#journalfolderroot").addClass("externaldrag")
				},
				stop: function () {
					$("#journalfolderroot").removeClass("externaldrag")
				}
			});
		}

		d20.Campaign.characters.models.each(function (v, i) {
			v.view.rebindCompendiumDropTargets = function () {
				// ready character sheet for draggable
				$(".sheet-compendium-drop-target").each(function () {
					$(this).droppable({
						hoverClass: "dropping",
						tolerance: "pointer",
						activeClass: "active-drop-target",
						accept: ".compendium-item",
						drop: function (t, i) {
							var characterid = $(".characterdialog").has(t.target).attr("data-characterid");
							var character = d20.Campaign.characters.get(characterid).view;
							var inputData;
							const $hlpr = $(i.helper[0]);

							let doSetDirty = true;

							if ($hlpr.hasClass("handout")) {
								console.log("Handout item dropped onto target!");
								t.originalEvent.dropHandled = !0;

								if ($hlpr.hasClass(`player-imported`)) {
									const data = d20plus.importer.retreivePlayerImport($hlpr.attr("data-playerimportid"));
									handleData(data);
								} else {
									var id = $hlpr.attr("data-itemid");
									var handout = d20.Campaign.handouts.get(id);
									console.log(character);
									var data = "";
									if (window.is_gm) {
										handout._getLatestBlob("gmnotes", function (gmnotes) {
											data = gmnotes;
											handout.updateBlobs({gmnotes: gmnotes});
											handleData(JSON.parse(data));
										});
									} else {
										handout._getLatestBlob("notes", function (notes) {
											data = $(notes).filter("del").html();
											handleData(JSON.parse(data));
										});
									}
								}

								function handleData (data) {
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
										$.each(d20.journal.customSheets.attrDeps, function (i, v) {
											dirty.push(i);
										});
										d20.journal.notifyWorkersOfAttrChanges(character.model.view.model.id, dirty, true);
									} else if (data.data.Category === "Backgrounds") { // TODO remove Background workaround when roll20 supports background drag-n-drop properly
										const bg = data.Vetoolscontent;

										const renderer = new EntryRenderer();
										renderer.setBaseUrl(BASE_SITE_URL);
										const renderStack = [];
										let feature;
										bg.entries.forEach(e => {
											if (e.name && e.name.includes("Feature:")) {
												feature = JSON.parse(JSON.stringify(e));
												feature.name = feature.name.replace("Feature:", "").trim();
											}
										});
										if (feature) renderer.recursiveEntryRender({entries: feature.entries}, renderStack);

										d20plus.importer.addOrUpdateAttr(character.model, "background", bg.name);

										const fRowId = d20plus.generateRowId();
										character.model.attribs.create({
											name: `repeating_traits_${fRowId}_name`,
											current: bg.name
										});
										character.model.attribs.create({
											name: `repeating_traits_${fRowId}_source`,
											current: "Background"
										});
										character.model.attribs.create({
											name: `repeating_traits_${fRowId}_source_type`,
											current: bg.name
										});
										if (renderStack.length) {
											character.model.attribs.create({
												name: `repeating_traits_${fRowId}_description`,
												current: d20plus.importer.getCleanText(renderStack.join(""))
											});
										}
										character.model.attribs.create({
											name: `repeating_traits_${fRowId}_options-flag`,
											current: "0"
										});

										if (bg.skillProficiencies) {
											const skills = bg.skillProficiencies.split(",").map(s => s.toLowerCase().trim().replace(/ /g, "_"));
											skills.forEach(s => {
												d20plus.importer.addOrUpdateAttr(character.model, `${s}_prof`, `(@{pb}*@{${s}_type})`);
											});
										}
									} else if (data.data.Category === "Races") { // TODO remove Race workaround when roll20 supports background drag-n-drop properly
										const race = data.Vetoolscontent;

										d20plus.importer.addOrUpdateAttr(character.model, `race`, race.name);
										d20plus.importer.addOrUpdateAttr(character.model, `speed`, Parser.getSpeedString(race));
										race.entries.forEach(e => {
											const renderer = new EntryRenderer();
											renderer.setBaseUrl(BASE_SITE_URL);
											const renderStack = [];
											renderer.recursiveEntryRender({entries: e.entries}, renderStack);

											const fRowId = d20plus.generateRowId();
											character.model.attribs.create({
												name: `repeating_traits_${fRowId}_name`,
												current: e.name
											});
											character.model.attribs.create({
												name: `repeating_traits_${fRowId}_source`,
												current: "Race"
											});
											character.model.attribs.create({
												name: `repeating_traits_${fRowId}_source_type`,
												current: race.name
											});
											character.model.attribs.create({
												name: `repeating_traits_${fRowId}_description`,
												current: d20plus.importer.getCleanText(renderStack.join(""))
											});
											character.model.attribs.create({
												name: `repeating_traits_${fRowId}_options-flag`,
												current: "0"
											});
										});
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
															character.model.attribs.create({
																name: `repeating_traits_${fRowId}_name`,
																current: feature.name
															});
															character.model.attribs.create({
																name: `repeating_traits_${fRowId}_source`,
																current: "Class"
															});
															character.model.attribs.create({
																name: `repeating_traits_${fRowId}_source_type`,
																current: `${clss.name} ${i + 1}`
															});
															character.model.attribs.create({
																name: `repeating_traits_${fRowId}_description`,
																current: d20plus.importer.getCleanText(renderStack.join(""))
															});
															character.model.attribs.create({
																name: `repeating_traits_${fRowId}_options-flag`,
																current: "0"
															});
														}
													}
												}
											}
										}
									} else if (data.data.Category === "Subclasses") {
										const sc = data.Vetoolscontent;
										let maxIndex = sc.subclassFeatures.length;
										const gainLevels = [];
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
														if (sc._gainAtLevels[i]) {
															maxIndex++;
															gainLevels.push(i + 1);
														}
													}
												}
											} else {
												return;
											}
										}

										if (maxIndex === 0) return;

										const renderer = new EntryRenderer();
										renderer.setBaseUrl(BASE_SITE_URL);
										let firstFeatures = true;
										for (let i = 0; i < maxIndex; i++) {
											const lvlFeatureList = sc.subclassFeatures[i];
											for (let j = 0; j < lvlFeatureList.length; j++) {
												const featureCpy = JSON.parse(JSON.stringify(lvlFeatureList[j]));
												let feature = lvlFeatureList[j];

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
													console.error("Failed to find feature");
													// in case something goes _really_ wrong, reset
													feature = featureCpy;
												}

												// for the first batch of subclass features, try to split them up
												if (firstFeatures && feature.name && feature.entries) {
													const subFeatures = [];
													const baseFeatures = feature.entries.filter(f => {
														if (f.name && f.type === "entries") {
															subFeatures.push(f);
															return false;
														} else return true;
													});
													addFeatureToSheet({name: feature.name, type: feature.type, entries: baseFeatures});
													subFeatures.forEach(sf => {
														addFeatureToSheet(sf);
													})
												} else {
													addFeatureToSheet(feature);
												}

												function addFeatureToSheet (feature) {
													const renderStack = [];
													renderer.recursiveEntryRender({entries: feature.entries}, renderStack);

													const fRowId = d20plus.generateRowId();
													character.model.attribs.create({
														name: `repeating_traits_${fRowId}_name`,
														current: feature.name
													});
													character.model.attribs.create({
														name: `repeating_traits_${fRowId}_source`,
														current: "Class"
													});
													character.model.attribs.create({
														name: `repeating_traits_${fRowId}_source_type`,
														current: `${sc.class} (${sc.name} ${gainLevels[i]})`
													});
													character.model.attribs.create({
														name: `repeating_traits_${fRowId}_description`,
														current: d20plus.importer.getCleanText(renderStack.join(""))
													});
													character.model.attribs.create({
														name: `repeating_traits_${fRowId}_options-flag`,
														current: "0"
													});
												}

												firstFeatures = false;
											}
										}
									} else if (data.data.Category === "Psionics") {
										function makeSpellTrait (level, rowId, propName, content) {
											character.model.attribs.create({
												"name": `repeating_spell-${level}_${rowId}_${propName}`,
												"current": `${content}`
											});
										}

										// disable all components
										function noComponents (level, rowId, hasM) {
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
														makeSpellTrait(mLevel, rowId, "spellconcentration", "Yes");
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
										function doDefaultDrop (n, outerI) {
											const e = character;
											var i = $(outerI.helper[0]).attr("data-pagename");

											// BEGIN ROLL20 CODE
											var r = n.data;
											r.Name = n.name,
												r.uniqueName = i,
												r.Content = n.content;
											var o = $(t.target);
											o.find("*[accept]").each(function() {
												var t = $(this)
													, n = t.attr("accept");
												r[n] && ("input" === t[0].tagName.toLowerCase() && "checkbox" === t.attr("type") ? t.attr("value") == r[n] ? t.attr("checked", "checked") : t.removeAttr("checked") : "input" === t[0].tagName.toLowerCase() && "radio" === t.attr("type") ? t.attr("value") == r[n] ? t.attr("checked", "checked") : t.removeAttr("checked") : "select" === t[0].tagName.toLowerCase() ? t.find("option").each(function() {
													var e = $(this);
													(e.attr("value") === r[n] || e.text() === r[n]) && e.attr("selected", "selected")
												}) : $(this).val(r[n]),
													e.saveSheetValues(this))
											})
											// END ROLL20 CODE
										}
										doDefaultDrop(data, i);
										doSetDirty = false;
									}

									if (doSetDirty) {
										character.model.view._updateSheetValues();
										const dirty = [];
										extraDirty.forEach(ed => {
											dirty.push(ed);
										});
										$.each(d20.journal.customSheets.attrDeps, function (i, v) {
											dirty.push(i);
										});
										d20.journal.notifyWorkersOfAttrChanges(character.model.view.model.id, dirty, true);
									}
								}
							} else {
								// rename some variables...
								const e = character;
								const n = i;

								// original roll20 code
								console.log("Compendium item dropped onto target!");
								t.originalEvent.dropHandled = !0;
								window.wantsToReceiveDrop(this, t, function () {
									var i = $(n.helper[0]).attr("data-pagename");
									console.log(d20.compendium.compendiumBase + "compendium/" + COMPENDIUM_BOOK_NAME + "/" + i + ".json?plaintext=true"),
										$.get(d20.compendium.compendiumBase + "compendium/" + COMPENDIUM_BOOK_NAME + "/" + i + ".json?plaintext=true", function (n) {
											var r = n.data;
											r.Name = n.name,
												r.uniqueName = i,
												r.Content = n.content;
											var o = $(t.target);
											o.find("*[accept]").each(function () {
												var t = $(this)
													, n = t.attr("accept");
												r[n] && ("input" === t[0].tagName.toLowerCase() && "checkbox" === t.attr("type") ? t.attr("value") == r[n] ? t.attr("checked", "checked") : t.removeAttr("checked") : "input" === t[0].tagName.toLowerCase() && "radio" === t.attr("type") ? t.attr("value") == r[n] ? t.attr("checked", "checked") : t.removeAttr("checked") : "select" === t[0].tagName.toLowerCase() ? t.find("option").each(function () {
													var e = $(this);
													(e.attr("value") === r[n] || e.text() === r[n]) && e.attr("selected", "selected")
												}) : $(this).val(r[n]),
													e.saveSheetValues(this))
											})
										})
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

	d20plus.monsters._groupOptions = ["Type", "Type (with tags)", "CR", "Alphabetical", "Source"];
	d20plus.monsters._listCols = ["name", "type", "cr", "source"];
	d20plus.monsters._listItemBuilder = (it) => `
		<span class="name col-4" title="name">${it.name}</span>
		<span class="type col-4" title="type">TYP[${Parser.monTypeToFullObj(it.type).asText.uppercaseFirst()}]</span>
		<span class="cr col-2" title="cr">${it.cr === undefined ? "CR[Unknown]" : `CR[${(it.cr.cr || it.cr)}]`}</span>
		<span title="source (Full: ${Parser.sourceJsonToFull(it.source)})" class="source">SRC[${Parser.sourceJsonToAbv(it.source)}]</span>`;
	d20plus.monsters._listIndexConverter = (m) => {
		m.__pType = m.__pType || Parser.monTypeToFullObj(m.type).type; // only filter using primary type
		return {
			name: m.name.toLowerCase(),
			type: m.__pType.toLowerCase(),
			cr: m.cr === undefined ? "unknown" : (m.cr.cr || m.cr).toLowerCase(),
			source: Parser.sourceJsonToAbv(m.source).toLowerCase()
		};
	};
	// Import Monsters button was clicked
	d20plus.monsters.button = function () {
		function loadData (url) {
			DataUtil.loadJSON(url, (data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"monster",
					data.monster,
					d20plus.monsters.handoutBuilder,
					{
						groupOptions: d20plus.monsters._groupOptions,
						listItemBuilder: d20plus.monsters._listItemBuilder,
						listIndex: d20plus.monsters._listCols,
						listIndexConverter: d20plus.monsters._listIndexConverter
					}
				);
			});
		}

		const url = $("#import-monster-url").val();
		if (url && url.trim()) {
			// ugly hack to pre-load fluff
			const fileName = url.split("/").reverse()[0];
			const src = Object.keys(monsterDataUrls).find(k => monsterDataUrls[k] === fileName);
			if (src && monsterFluffDataUrls[src]) {
				const fluffUrl = d20plus.monsters.formMonsterUrl(monsterFluffDataUrls[src]);
				DataUtil.loadJSON(fluffUrl, (data) => {
					monsterFluffData[src] = data;
					loadData(url);
				});
			} else {
				loadData(url);
			}
		}
	};

// Import All Monsters button was clicked
	d20plus.monsters.buttonAll = function () {
		function loadData () {
			const toLoad = Object.keys(monsterDataUrls).filter(src => !isNonstandardSource(src)).map(src => d20plus.monsters.formMonsterUrl(monsterDataUrls[src]));
			if (toLoad.length) {
				DataUtil.multiLoadJSON(
					toLoad.map(url => ({url})),
					() => {},
					(dataStack) => {
						let toAdd = [];
						dataStack.forEach(d => toAdd = toAdd.concat(d.monster));
						d20plus.importer.showImportList(
							"monster",
							toAdd,
							d20plus.monsters.handoutBuilder,
							{
								groupOptions: d20plus.monsters._groupOptions,
								listItemBuilder: d20plus.monsters._listItemBuilder,
								listIndex: d20plus.monsters._listCols,
								listIndexConverter: d20plus.monsters._listIndexConverter
							}
						);
					}
				);
			}
		}

		// preload fluff if available
		const toLoadFluff = Object.keys(monsterFluffDataUrls)
			.filter(src => !isNonstandardSource(src))
			.map(src => ({url: d20plus.monsters.formMonsterUrl(monsterFluffDataUrls[src]), src}));
		if (toLoadFluff.length) {
			DataUtil.multiLoadJSON(
				toLoadFluff,
				(tl, data) => {
					monsterFluffData[tl.src] = data;
				},
				() => {
					loadData();
				}
			);
		} else {
			loadData();
		}
	};

	d20plus.monsters.formMonsterUrl = function (fileName) {
		return d20plus.formSrcUrl(MONSTER_DATA_DIR, fileName);
	};

	d20plus.importer.getSetAvatarImage = function (character, avatar) {
		character.attributes.avatar = avatar;
		var tokensize = 1;
		if (character.size === "L") tokensize = 2;
		if (character.size === "H") tokensize = 3;
		if (character.size === "G") tokensize = 4;
		var lightradius = 5;
		if (character.senses && character.senses.toLowerCase().match(/(darkvision|blindsight|tremorsense|truesight)/)) lightradius = Math.max.apply(Math, character.senses.match(/\d+/g));
		var lightmin = 0;
		if (character.senses && character.senses.toLowerCase().match(/(blindsight|tremorsense|truesight)/)) lightmin = lightradius;
		const nameSuffix = d20plus.getCfgVal("token", "namesuffix");
		var defaulttoken = {
			represents: character.id,
			name: `${character.name}${nameSuffix ? ` ${nameSuffix}` : ""}`,
			imgsrc: avatar,
			width: 70 * tokensize,
			height: 70 * tokensize
		};
		if (!d20plus.getCfgVal("import", "skipSenses")) {
			defaulttoken.light_hassight = true;
			defaulttoken.light_radius = lightradius;
			defaulttoken.light_dimradius = lightmin;
		}

		character.updateBlobs({avatar: avatar, defaulttoken: JSON.stringify(defaulttoken)});
		character.save({defaulttoken: (new Date()).getTime()});
	};

	d20plus.importer.addAction = function (character, name, text, index) {
		if (d20plus.getCfgVal("token", "tokenactions")) {
			character.abilities.create({
				name: index + ": " + name,
				istokenaction: true,
				action: d20plus.actionMacroAction(index)
			});
		}

		var newRowId = d20plus.generateRowId();
		var actiontext = text;
		var action_desc = actiontext; // required for later reduction of information dump.
		var rollbase = d20plus.importer.rollbase;
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
			var tohit = (actiontext.match(/\+(.*?) to hit/) || ["", ""])[1];
			var damage = "";
			var damagetype = "";
			var damage2 = "";
			var damagetype2 = "";
			var onhit = "";
			damageregex = /\d+ \((\d+d\d+\s?(?:\+|-)?\s?\d*)\) (\S+ )?damage/g;
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
			var atk_desc_simple_regex = /Hit: \d+ \((\d+d\d+\s?(?:\+|-)?\s?\d*)\) (\S+ )?damage\.(.*)/g;
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
			var damageflags = `{{damage=1}} {{dmg1flag=1}}${damage2 ? ` {{dmg2flag=1}}` : ""}`
			character.attribs.create({name: "repeating_npcaction_" + newRowId + "_name", current: name});
			character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_flag", current: "on"});
			character.attribs.create({name: "repeating_npcaction_" + newRowId + "_npc_options-flag", current: "0"});
			character.attribs.create({
				name: "repeating_npcaction_" + newRowId + "_attack_display_flag",
				current: "{{attack=1}}"
			});
			character.attribs.create({
				name: "repeating_npcaction_" + newRowId + "_attack_options",
				current: "{{attack=1}}"
			});
			character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_tohit", current: tohit});
			character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_damage", current: damage});
			character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_crit", current: damage});
			character.attribs.create({
				name: "repeating_npcaction_" + newRowId + "_attack_damagetype",
				current: damagetype
			});
			if (damage2) {
				character.attribs.create({
					name: "repeating_npcaction_" + newRowId + "_attack_damage2",
					current: damage2
				});
				character.attribs.create({
					name: "repeating_npcaction_" + newRowId + "_attack_crit2",
					current: damage2
				});
				character.attribs.create({
					name: "repeating_npcaction_" + newRowId + "_attack_damagetype2",
					current: damagetype2
				});
			}
			character.attribs.create({name: "repeating_npcaction_" + newRowId + "_name_display", current: name});
			character.attribs.create({name: "repeating_npcaction_" + newRowId + "_rollbase", current: rollbase});
			character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_type", current: attacktype});
			character.attribs.create({
				name: "repeating_npcaction_" + newRowId + "_attack_type_display",
				current: attacktype + attacktype2
			});
			character.attribs.create({
				name: "repeating_npcaction_" + newRowId + "_attack_tohitrange",
				current: tohitrange
			});
			character.attribs.create({name: "repeating_npcaction_" + newRowId + "_attack_range", current: attackrange});
			character.attribs.create({
				name: "repeating_npcaction_" + newRowId + "_attack_target",
				current: attacktarget
			});
			character.attribs.create({name: "repeating_npcaction_" + newRowId + "_damage_flag", current: damageflags});
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
	};

// Create monster character from js data object
	d20plus.monsters.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Monsters`, folderName);
		const path = ["Monsters", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		const pType = Parser.monTypeToFullObj(data.type);

		const renderer = new EntryRenderer();
		renderer.setBaseUrl(BASE_SITE_URL);

		// get fluff, if available
		const includedFluff = data.fluff;
		let renderFluff = null;
		// prefer fluff directly attached to the creature
		if (includedFluff) {
			if (includedFluff.entries) {
				const depth = includedFluff.entries.type === "section" ? -1 : 2;
				renderFluff = renderer.renderEntry(includedFluff.entries, depth);
			}
		} else {
			const fluffData = monsterFluffData[data.source] ? monsterFluffData[data.source] : null;
			const fluff = fluffData ? monsterFluffData[data.source].monster.find(it => it.name === data.name) : null;
			if (fluff) {
				if (fluff._copy) {
					const cpy = fluffData.monster.find(it => fluff._copy.name === it.name);
					// preserve these
					const name = fluff.name;
					const src = fluff.source;
					const images = fluff.images;
					Object.assign(fluff, cpy);
					fluff.name = name;
					fluff.source = src;
					if (images) fluff.images = images;
					delete fluff._copy;
				}

				if (fluff._appendCopy) {
					const cpy = fluffData.monster.find(it => fluff._appendCopy.name === it.name);
					if (cpy.images) {
						if (!fluff.images) fluff.images = cpy.images;
						else fluff.images = fluff.images.concat(cpy.images);
					}
					if (cpy.entries) {
						if (!fluff.entries) fluff.entries = cpy.entries;
						else fluff.entries.entries = fluff.entries.entries.concat(cpy.entries.entries);
					}
					delete fluff._appendCopy;
				}

				if (fluff.entries) {
					const depth = fluff.entries.type === "section" ? -1 : 2;
					renderFluff = renderer.renderEntry(fluff.entries, depth);
				}
			}
		}

		d20.Campaign.characters.create(
			{
				name: name,
				tags: d20plus.importer.getTagString([
					pType.type,
					...pType.tags,
					`cr ${(data.cr ? (data.cr.cr || data.cr) : "").replace(/\//g, " over ")}` || "unknown cr",
					Parser.sourceJsonToFull(data.source)
				], "monsters")
			},
			{
			success: function (character) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](data)] = {name: data.name, source: data.source, type: "character", roll20Id: character.id};
				/* OGL Sheet */
				try {
					const type = Parser.monTypeToFullObj(data.type).asText;
					const source = Parser.sourceJsonToAbv(data.source);
					const avatar = data.tokenURL || `${IMG_URL}${source}/${name.replace(/"/g, "")}.png`;
					character.size = data.size;
					character.name = name;
					character.senses = data.senses;
					character.hp = data.hp.average || 0;
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
					var hp = data.hp.average || 0;
					var hpformula = data.hp.formula;
					var passive = data.passive != null ? data.passive : "";
					var passiveStr = passive !== "" ? "passive Perception " + passive : "";
					var senses = data.senses || "";
					var sensesStr = senses !== "" ? senses + ", " + passiveStr : passiveStr;
					var size = d20plus.getSizeString(data.size || "");
					var alignment = data.alignment ? Parser.alignmentListToFull(data.alignment).toLowerCase() : "(Unknown Alignment)";
					var cr = data.cr ? (data.cr.cr || data.cr) : "";
					var xp = Parser.crToXp(cr);
					character.attribs.create({name: "npc", current: 1});
					character.attribs.create({name: "npc_toggle", current: 1});
					character.attribs.create({name: "npc_options-flag", current: 0});
					character.attribs.create({name: "wtype", current: d20plus.importer.getDesiredWhisperType()});
					character.attribs.create({name: "rtype", current: d20plus.importer.getDesiredRollType()});
					character.attribs.create({
						name: "advantagetoggle",
						current: d20plus.importer.getDesiredAdvantageToggle()
					});
					character.attribs.create({
						name: "whispertoggle",
						current: d20plus.importer.getDesiredWhisperToggle()
					});
					character.attribs.create({name: "dtype", current: d20plus.importer.getDesiredDamageType()});
					character.attribs.create({name: "npc_name", current: name});
					character.attribs.create({name: "npc_size", current: size});
					character.attribs.create({name: "type", current: type});
					character.attribs.create({name: "npc_type", current: size + " " + type + ", " + alignment});
					character.attribs.create({name: "npc_alignment", current: alignment});
					character.attribs.create({name: "npc_ac", current: ac != null ? ac[0] : ""});
					character.attribs.create({name: "npc_actype", current: actype != null ? actype[1] || "" : ""});
					character.attribs.create({name: "npc_hpbase", current: hp != null ? hp : ""});
					character.attribs.create({
						name: "npc_hpformula",
						current: hpformula != null ? hpformula || "" : ""
					});
					const parsedSpeed = Parser.getSpeedString(data);
					data.npc_speed = parsedSpeed;
					if (d20plus.sheet === "shaped") {
						data.npc_speed = data.npc_speed.toLowerCase();
						var match = data.npc_speed.match(/^\s*(\d+)\s?(ft\.?|m\.?)/);
						if (match && match[1]) {
							data.speed = match[1] + ' ' + match[2];
							character.attribs.create({name: "speed", current: match[1] + ' ' + match[2]});
						}
						data.npc_speed = parsedSpeed;
						var regex = /(burrow|climb|fly|swim)\s+(\d+)\s?(ft\.?|m\.?)/g;
						var speeds = void 0;
						while ((speeds = regex.exec(data.npc_speed)) !== null) character.attribs.create({
							name: "speed_" + speeds[1],
							current: speeds[2] + ' ' + speeds[3]
						});
						if (data.npc_speed && data.npc_speed.includes('hover')) character.attribs.create({
							name: "speed_fly_hover",
							current: 1
						});
						data.npc_speed = '';
					}

					function calcMod (score) {
						return Math.floor((Number(score) - 10) / 2);
					}

					character.attribs.create({name: "npc_speed", current: parsedSpeed != null ? parsedSpeed : ""});
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
					character.attribs.create({
						name: "npc_languages",
						current: data.languages != null ? data.languages : ""
					});
					character.attribs.create({name: "npc_challenge", current: cr.cr || cr});
					character.attribs.create({name: "npc_xp", current: xp});
					character.attribs.create({
						name: "npc_vulnerabilities",
						current: data.vulnerable != null ? Parser.monImmResToFull(data.vulnerable) : ""
					});
					character.attribs.create({
						name: "damage_vulnerabilities",
						current: data.vulnerable != null ? Parser.monImmResToFull(data.vulnerable) : ""
					});
					character.attribs.create({
						name: "npc_resistances",
						current: data.resist != null ? Parser.monImmResToFull(data.resist) : ""
					});
					character.attribs.create({
						name: "damage_resistances",
						current: data.resist != null ? Parser.monImmResToFull(data.resist) : ""
					});
					character.attribs.create({name: "npc_immunities", current: data.immune != null ? Parser.monImmResToFull(data.immune) : ""});
					character.attribs.create({
						name: "damage_immunities",
						current: data.immune != null ? Parser.monImmResToFull(data.immune) : ""
					});
					character.attribs.create({
						name: "npc_condition_immunities",
						current: data.conditionImmune != null ? Parser.monCondImmToFull(data.conditionImmune) : ""
					});
					character.attribs.create({
						name: "damage_condition_immunities",
						current: data.conditionImmune != null ? Parser.monCondImmToFull(data.conditionImmune) : ""
					});
					character.attribs.create({name: "npc_senses", current: sensesStr});

					// add Tokenaction Macros
					if (d20plus.getCfgVal("token", "tokenactions")) {
						character.abilities.create({
							name: "Perception",
							istokenaction: true,
							action: d20plus.actionMacroPerception
						});
						character.abilities.create({
							name: "Init",
							istokenaction: true,
							action: d20plus.actionMacroInit
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
					}

					if (data.save != null) {
						character.attribs.create({name: "npc_saving_flag", current: 1});
						Object.keys(data.save).forEach(k => {
							character.attribs.create({
								name: "npc_" + k + "_save_base",
								current: data.save[k]
							});
							character.attribs.create({
								name: k + "_saving_throw_proficient",
								current: data.save[k]
							});
						});
					}
					if (data.skill != null) {
						const skills = data.skill;
						const skillsString = Object.keys(skills).map(function (k) {
							return k.uppercaseFirst() + ' ' + skills[k];
						}).join(', ');
						character.attribs.create({name: "npc_skills_flag", current: 1});
						character.attribs.create({name: "npc_skills", current: skillsString});

						// Shaped Sheet currently doesn't correctly load NPC Skills
						// This adds a visual representation as a Trait for reference
						if (d20plus.sheet === "shaped") {
							var newRowId = d20plus.generateRowId();
							character.attribs.create({
								name: "repeating_npctrait_" + newRowId + "_name",
								current: "NPC Skills"
							});
							character.attribs.create({
								name: "repeating_npctrait_" + newRowId + "_desc",
								current: skillsString
							});
						}

						$.each(skills, function (k, v) {
							const cleanSKill = $.trim(k).toLowerCase().replace(/ /g, "_");
							const cleanBonus = parseInt($.trim(v)) || 0;
							character.attribs.create({
								name: "npc_" + cleanSKill + "_base",
								current: parseInt($.trim(v)) || 0
							});
							character.attribs.create({
								name: "npc_" + cleanSKill + "_base",
								current: cleanBonus
							});
							character.attribs.create({
								name: "npc_" + cleanSKill,
								current: cleanBonus
							});
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
						const charInterval = d20plus.getCfgVal("import", "importIntervalCharacter") || d20plus.getCfgDefaultVal("import", "importIntervalCharacter");
						const spAbilsDelayMs = Math.max(350, Math.floor(charInterval / 5));
						console.log(`Spellcasting import interval: ${spAbilsDelayMs} ms`);
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

						// set spellcaster class, since this seems to reliably set spellcasting ability
						if (spellAbility == "Intelligence") d20plus.importer.addOrUpdateAttr(character, "class", `Wizard`);
						if (spellAbility == "Wisdom") d20plus.importer.addOrUpdateAttr(character, "class", `Cleric`);
						if (spellAbility == "Charisma") d20plus.importer.addOrUpdateAttr(character, "class", `Bard`);

						// add the spellcasting text
						const newRowId = d20plus.generateRowId();
						const spellTrait = EntryRenderer.monster.getSpellcastingRenderedTraits(data, renderer).map(it => it.rendered).filter(it => it).join("");
						const cleanDescription = d20plus.importer.getCleanText(spellTrait);
						character.attribs.create({
							name: `repeating_npctrait_${newRowId}_name`,
							current: "Spellcasting"
						});
						character.attribs.create({
							name: `repeating_npctrait_${newRowId}_desc`,
							current: cleanDescription
						});

						// begin building a spells macro
						const tokenActionStack = [cleanDescription];

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

						// render sheet
						character.view.render();

						// add spells to sheet
						const toAdd = [];
						allSpells.forEach(sp => {
							const tagSplit = EntryRenderer.splitByTags(sp);
							tagSplit.forEach(s => {
								if (!s || !s.trim()) return;
								if (s.charAt(0) === "@") {
									const [tag, text] = EntryRenderer.splitFirstSpace(s);
									if (tag === "@spell") {
										toAdd.push(text);
									}
								}
							});
						});

						const addMacroIndex = toAdd.length - 1;
						toAdd.forEach((text, i) => {
							let [name, source] = text.split("|");
							if (!source) source = "PHB";
							const rawUrl = spellDataUrls[Object.keys(spellDataUrls).find(src => source.toLowerCase() === src.toLowerCase())];
							const url = d20plus.spells.formSpellUrl(rawUrl);
							// the JSON gets cached by the script, so this is fine
							DataUtil.loadJSON(url, (data) => {
								const spell = data.spell.find(spell => spell.name.toLowerCase() === name.toLowerCase());

								const [notecontents, gmnotes] = d20plus.spells._getHandoutData(spell);

								addSpell(JSON.parse(gmnotes), spell, i, addMacroIndex);
							});
						});

						function addSpell (sp, VeSp, index, addMacroIndex) {
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

							// TODO reverse engineer/add the other ~20 attributes needed to make this work (see `enableSpellattackHack()`)
							if (sp.content.toLowerCase().includes("ranged spell attack")) {
								makeAttrib("spelloutput", "ATTACK");
								makeAttrib("spellattack", "Ranged");
							} else if (sp.content.toLowerCase().includes("melee spell attack")) {
								makeAttrib("spelloutput", "ATTACK");
								makeAttrib("spellattack", "Melee");
							} else if (sp.data.Damage) {
								makeAttrib("spelloutput", "ATTACK");
								makeAttrib("spellattack", "None");
							}

							tokenActionStack.push(`[${sp.name}](~selected|${base}spell)`);

							if (index === addMacroIndex) {
								if (d20plus.getCfgVal("token", "tokenactions")) {
									character.abilities.create({
										name: "Spells",
										istokenaction: true,
										action: `/w gm @{selected|wtype}&{template:npcaction} {{name=@{selected|npc_name}}} {{rname=Spellcasting}} {{description=${tokenActionStack.join("")}}}`
									});
								}
								enableSpellattackHack();
							}

							function enableSpellattackHack () {
								// temporary(?) hack to avoid creating all the properties manually
								setTimeout(() => {
									const $sel = character.view.$charsheet.find(`select[name=attr_spelloutput]`).filter((i, ele) => {
										return $(ele).val() === "ATTACK";
									});
									setTimeout(() => {
										$sel.val("SPELLCARD").trigger("change")
										setTimeout(() => {
											$sel.val("ATTACK").trigger("change");
										}, spAbilsDelayMs);
									}, spAbilsDelayMs);
								}, spAbilsDelayMs);
							}

							function makeAttrib (name, current) {
								if (current !== undefined && current !== null) character.attribs.create({
									name: `${base}${name}`,
									current: current
								});
							}

							function addInlineRollers (text) {
								if (!text) return text;
								return text.replace(DICE_REGEX, (match) => {
									return `[[${match}]]`;
								});
							}
						}
					}
					if (data.trait) {
						$.each(data.trait, function (i, v) {
							var newRowId = d20plus.generateRowId();
							character.attribs.create({
								name: "repeating_npctrait_" + newRowId + "_name",
								current: v.name
							});

							if (d20plus.getCfgVal("token", "tokenactions")) {
								const offsetIndex = data.spellcasting ? 1 + i : i;
								character.abilities.create({
									name: "Trait" + offsetIndex + ": " + v.name,
									istokenaction: true,
									action: d20plus.actionMacroTrait(offsetIndex)
								});
							}

							var text = d20plus.importer.getCleanText(renderer.renderEntry({entries: v.entries}, 1));
							character.attribs.create({name: "repeating_npctrait_" + newRowId + "_desc", current: text});
						});
					}
					if (data.action) {
						$.each(data.action, function (i, v) {
							var text = d20plus.importer.getCleanText(renderer.renderEntry({entries: v.entries}, 1));
							d20plus.importer.addAction(character, v.name, text, i);
						});
					}
					if (data.reaction) {
						character.attribs.create({name: "reaction_flag", current: 1});
						character.attribs.create({name: "npcreactionsflag", current: 1});
						$.each(data.reaction, function (i, v) {
							var newRowId = d20plus.generateRowId();
							var text = "";
							character.attribs.create({
								name: "repeating_npcreaction_" + newRowId + "_name",
								current: v.name
							});

							// roll20 only supports a single reaction, so only use the first
							if (d20plus.getCfgVal("token", "tokenactions") && i === 0) {
								character.abilities.create({
									name: "Reaction: " + v.name,
									istokenaction: true,
									action: d20plus.actionMacroReaction
								});
							}

							var text = d20plus.importer.getCleanText(renderer.renderEntry({entries: v.entries}, 1));
							character.attribs.create({
								name: "repeating_npcreaction_" + newRowId + "_desc",
								current: text
							});
							character.attribs.create({
								name: "repeating_npcreaction_" + newRowId + "_description",
								current: text
							});
						});
					}
					if (data.legendary) {
						character.attribs.create({name: "legendary_flag", current: "1"});
						let legendaryActions = data.legendaryActions || 3;
						character.attribs.create({name: "npc_legendary_actions", current: legendaryActions.toString()});
						let tokenactiontext = "";
						$.each(data.legendary, function (i, v) {
							var newRowId = d20plus.generateRowId();

							if (d20plus.getCfgVal("token", "tokenactions")) {
								tokenactiontext += "[" + v.name + "](~selected|repeating_npcaction-l_$" + i + "_npc_action)\n\r";
							}

							var rollbase = d20plus.importer.rollbase;
							if (v.attack != null) {
								if (!(v.attack instanceof Array)) {
									var tmp = v.attack;
									v.attack = [];
									v.attack.push(tmp);
								}
								$.each(v.attack, function (z, x) {
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
									character.attribs.create({
										name: "repeating_npcaction-l_" + newRowId + "_name",
										current: name
									});
									character.attribs.create({
										name: "repeating_npcaction-l_" + newRowId + "_attack_flag",
										current: "on"
									});
									character.attribs.create({
										name: "repeating_npcaction-l_" + newRowId + "_npc_options-flag",
										current: 0
									});
									character.attribs.create({
										name: "repeating_npcaction-l_" + newRowId + "_attack_display_flag",
										current: "{{attack=1}}"
									});
									character.attribs.create({
										name: "repeating_npcaction-l_" + newRowId + "_attack_options",
										current: "{{attack=1}}"
									});
									character.attribs.create({
										name: "repeating_npcaction-l_" + newRowId + "_attack_tohit",
										current: tohit
									});
									character.attribs.create({
										name: "repeating_npcaction-l_" + newRowId + "_attack_damage",
										current: damage
									});
									character.attribs.create({
										name: "repeating_npcaction-l_" + newRowId + "_name_display",
										current: name
									});
									character.attribs.create({
										name: "repeating_npcaction-l_" + newRowId + "_rollbase",
										current: rollbase
									});
									character.attribs.create({
										name: "repeating_npcaction-l_" + newRowId + "_attack_type",
										current: ""
									});
									character.attribs.create({
										name: "repeating_npcaction-l_" + newRowId + "_attack_tohitrange",
										current: ""
									});
									character.attribs.create({
										name: "repeating_npcaction-l_" + newRowId + "_damage_flag",
										current: "{{damage=1}} {{dmg1flag=1}} {{dmg2flag=1}}"
									});
									if (damage !== "") {
										damage1 = damage.replace(/\s/g, "").split(/d|(?=\+|-)/g);
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
									character.attribs.create({
										name: "repeating_npcaction-l_" + newRowId + "_attack_onhit",
										current: onhit
									});
								});
							} else {
								character.attribs.create({
									name: "repeating_npcaction-l_" + newRowId + "_name",
									current: v.name
								});
								character.attribs.create({
									name: "repeating_npcaction-l_" + newRowId + "_npc_options-flag",
									current: 0
								});
								character.attribs.create({
									name: "repeating_npcaction-l_" + newRowId + "_rollbase",
									current: rollbase
								});
								character.attribs.create({
									name: "repeating_npcaction-l_" + newRowId + "_name_display",
									current: v.name
								});
							}

							var text = d20plus.importer.getCleanText(renderer.renderEntry({entries: v.entries}, 1));
							var descriptionFlag = Math.max(Math.ceil(text.length / 57), 1);
							character.attribs.create({
								name: "repeating_npcaction-l_" + newRowId + "_description",
								current: text
							});
							character.attribs.create({
								name: "repeating_npcaction-l_" + newRowId + "_description_flag",
								current: descriptionFlag
							});
						});
						if (d20plus.getCfgVal("token", "tokenactions")) {
							character.abilities.create({
								name: "Legendary Actions",
								istokenaction: true,
								action: d20plus.actionMacroLegendary(tokenactiontext)
							});
						}
					}
					character.view._updateSheetValues();
					var dirty = [];
					$.each(d20.journal.customSheets.attrDeps, function (i, v) {
						dirty.push(i);
					});
					d20.journal.notifyWorkersOfAttrChanges(character.view.model.id, dirty, true);


					if (renderFluff) {
						setTimeout(() => {
							const fluffAs = d20plus.getCfgVal("import", "importFluffAs") || d20plus.getCfgDefaultVal("import", "importFluffAs");
							let k = fluffAs === "Bio"? "bio" : "gmnotes";
							character.updateBlobs({
								[k]: Markdown.parse(renderFluff)
							});
							character.save({
								[k]: (new Date).getTime()
							});
						}, 500);
					}
				} catch (e) {
					d20plus.log("Error loading [" + name + "]");
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
	d20plus.addImportError = function (name) {
		var $span = $("#import-errors");
		if ($span.text() == "0") {
			$span.text(name);
		} else {
			$span.text($span.text() + ", " + name);
		}
	};

// Get NPC size from chr
	d20plus.getSizeString = function (chr) {
		const result = Parser.sizeAbvToFull(chr);
		return result ? result : "(Unknown Size)";
	};

// Create editable HP variable and autocalculate + or -
	d20plus.hpAllowEdit = function () {
		$("#initiativewindow").on(window.mousedowntype, ".hp.editable", function () {
			if ($(this).find("input").length > 0) return void $(this).find("input").focus();
			var val = $.trim($(this).text());
			const $span = $(this);
			$span.html(`<input type='text' value='${val}'/>`);
			const $ipt = $(this).find("input");
			$ipt[0].focus();
		});
		$("#initiativewindow").on("keydown", ".hp.editable", function (event) {
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

					npc = char.attribs ? char.attribs.find(function (a) {
						return a.get("name").toLowerCase() === "npc";
					}) : null;
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
						hp = char.attribs.find(function (a) {
							return a.get("name").toLowerCase() === "hp";
						});
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

// Change character sheet formulas
	d20plus.setSheet = function () {
		d20plus.sheet = "ogl";
		if (window.is_gm && (!d20.journal.customSheets || !d20.journal.customSheets)) {
			d20.textchat.incoming(false, ({
				who: "system",
				type: "system",
				content: `<span style="color: red;">5etoolsR20: no character sheet selected! Exiting...</span>`
			}));
			throw new Error("No character sheet selected!");
		}
		if (d20.journal.customSheets.layouthtml.indexOf("shaped_d20") > 0) d20plus.sheet = "shaped";
		if (d20.journal.customSheets.layouthtml.indexOf("DnD5e_Character_Sheet") > 0) d20plus.sheet = "community";
		d20plus.log("Switched Character Sheet Template to " + d20plus.sheet);
	};

// Return Initiative Tracker template with formulas
	d20plus.initErrorHandler = null;
	d20plus.setTurnOrderTemplate = function () {
		if (!d20plus.turnOrderCachedFunction) {
			d20plus.turnOrderCachedFunction = d20.Campaign.initiativewindow.rebuildInitiativeList;
			d20plus.turnOrderCachedTemplate = $("#tmpl_initiativecharacter").clone();
		}

		d20.Campaign.initiativewindow.rebuildInitiativeList = function () {
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
							<$ } else if (typeof char !== "undefined" && char && typeof char.autoCalcFormula !== "undefined") { $>
								<$!char.autoCalcFormula('${d20plus.formulas[d20plus.sheet].hp}')$>
							<$ } else { $>
								<$!"\u2014"$>
							<$ } $>
						</span>
					`);
						headerStack.push(`<span class='tracker-col'>HP</span>`);
						break;
					}
					case "AC": {
						replaceStack.push(`
						<span class='ac tracker-col' alt='AC' title='AC'>
							<$ if(npc && npc.get("current") == "1" && typeof char !== "undefined" && char && typeof char.autoCalcFormula !== "undefined") { $>
								<$!char.autoCalcFormula('${d20plus.formulas[d20plus.sheet].npcac}')$>
							<$ } else if (typeof char !== "undefined" && char && typeof char.autoCalcFormula !== "undefined") { $>
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
						<$ var passive = (typeof char !== "undefined" && char && typeof char.autoCalcFormula !== "undefined") ? (char.autoCalcFormula('@{passive}') || char.autoCalcFormula('${d20plus.formulas[d20plus.sheet].pp}')) : "\u2014"; $>
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
			setTimeout(function () {
				$(".initmacrobutton").unbind("click");
				$(".initmacrobutton").bind("click", function () {
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
					d20plus.log("ERROR: failed to populate custom initiative tracker, restoring default...");
					// restore the default functionality
					$("#tmpl_initiativecharacter").replaceWith(d20plus.turnOrderCachedTemplate);
					return d20plus.turnOrderCachedFunction();
				}
			};
			window.addEventListener("error", d20plus.initErrorHandler);
			return results;
		};
	};

	d20plus.importer.makePlayerDraggable = function (importId, name) {
		const $appTo = $(`#d20plus-playerimport`).find(`.Vetools-player-imported`);
		const $li = $(`
		<li class="journalitem dd-item handout ui-draggable compendium-item Vetools-draggable player-imported" data-playerimportid="${importId}">
			<div class="dd-handle dd-sortablehandle">Drag</div>
			<div class="dd-content">
				<div class="token"><img src="/images/handout.png" draggable="false"></div>
				<div class="name">
					<div class="namecontainer">${name}</div>
				</div>
			</div>
		</li>
	`);
		$li.draggable({
			revert: true,
			distance: 10,
			revertDuration: 0,
			helper: "clone",
			handle: ".namecontainer",
			appendTo: "body",
			scroll: true,
			start: function () {
				console.log("drag start")
			},
			stop: function () {
				console.log("drag stop")
			}
		});
		$appTo.prepend($li);
	};

	d20plus.spells.formSpellUrl = function (fileName) {
		return d20plus.formSrcUrl(SPELL_DATA_DIR, fileName);
	};

	d20plus.spells._groupOptions = ["Level", "Spell Points", "Alphabetical", "Source"];
	d20plus.spells._listCols = ["name", "class", "level", "source"];
	d20plus.spells._listItemBuilder = (it) => `
		<span class="name col-4" title="name">${it.name}</span>
		<span class="class col-3" title="class">${it.classes.fromClassList.map(c => `CLS[${c.name}]`).join(", ")}</span>
		<span class="level col-3" title="level">LVL[${Parser.spLevelToFull(it.level)}]</span>
		<span title="source (Full: ${Parser.sourceJsonToFull(it.source)})" class="source col-2">SRC[${Parser.sourceJsonToAbv(it.source)}]</span>`;
	d20plus.spells._listIndexConverter = (sp) => {
		return {
			name: sp.name.toLowerCase(),
			class: sp.classes.fromClassList.map(c => c.name.toLowerCase()),
			level: Parser.spLevelToFull(sp.level).toLowerCase(),
			source: Parser.sourceJsonToAbv(sp.source).toLowerCase()
		};
	};
	// Import Spells button was clicked
	d20plus.spells.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-spell-url-player").val() : $("#import-spell-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.spells.playerImportBuilder : d20plus.spells.handoutBuilder;

			DataUtil.loadJSON(url, (data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"spell",
					data.spell,
					handoutBuilder,
					{
						groupOptions: d20plus.spells._groupOptions,
						forcePlayer,
						listItemBuilder: d20plus.spells._listItemBuilder,
						listIndex: d20plus.spells._listCols,
						listIndexConverter: d20plus.spells._listIndexConverter
					}
				);
			});
		}
	};

// Import All Spells button was clicked
	d20plus.spells.buttonAll = function (forcePlayer) {
		const toLoad = Object.keys(spellDataUrls).filter(src => !isNonstandardSource(src)).map(src => d20plus.spells.formSpellUrl(spellDataUrls[src]));

		if (toLoad.length) {
			const handoutBuilder = !forcePlayer && window.is_gm ? d20plus.spells.handoutBuilder : d20plus.spells.playerImportBuilder;

			DataUtil.multiLoadJSON(toLoad.map(url => ({url: url})), () => {
			}, (dataStack) => {
				let toAdd = [];
				dataStack.forEach(d => toAdd = toAdd.concat(d.spell));
				d20plus.importer.showImportList(
					"spell",
					toAdd,
					handoutBuilder,
					{
						groupOptions: d20plus.spells._groupOptions,
						forcePlayer,
						listItemBuilder: d20plus.spells._listItemBuilder,
						listIndex: d20plus.spells._listCols,
						listIndexConverter: d20plus.spells._listIndexConverter
					}
				);
			});
		}
	};

	d20plus.importer.getTagString = function (data, prefix) {
		return JSON.stringify(data.map(d => `${prefix}-${Parser.stringToSlug(d.toString())}`).concat([prefix]));
	};

	// Create spell handout from js data object
	d20plus.spells.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, builderOptions) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Spells`, folderName);
		const path = ["Spells", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		// build spell handout
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				Parser.spSchoolAbvToFull(data.school),
				Parser.spLevelToFull(data.level),
				...data.classes.fromClassList.map(c => c.name),
				Parser.sourceJsonToFull(data.source)
			], "spell")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_SPELLS](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [notecontents, gmnotes] = d20plus.spells._getHandoutData(data, builderOptions);

				console.log(notecontents);
				handout.updateBlobs({notes: notecontents, gmnotes: gmnotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.spells.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.spells._getHandoutData(data);

		const importId = d20plus.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.spells._getHandoutData = function (data, builderOptions) {
		builderOptions = builderOptions || {};
		// merge in roll20 metadata, if available
		const spellMeta = spellMetaData.spell.find(sp => sp.name.toLowerCase() === data.name.toLowerCase() && sp.source.toLowerCase() === data.source.toLowerCase());
		if (spellMeta) {
			data.roll20 = spellMeta.data;
		}

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
				"Level": builderOptions.isSpellPoints ? String(Math.min(9, d20plus.spells.spLevelToSpellPoints(data.level))) : String(data.level),
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
<em>${Parser.spLevelSchoolMetaToFull(data.level, data.school, data.meta)}${builderOptions.isSpellPoints && data.level ? ` (${d20plus.spells.spLevelToSpellPoints(data.level)} spell points)` : ""}</em></p><p>
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
	};

// parse spell components
	function parseComponents (components) {
		const out = [];
		if (components.v) out.push("V");
		if (components.s) out.push("S");
		if (components.m) out.push("M");
		return out.join(" ");
	}

	d20plus.items._groupOptions = ["Type", "Rarity", "Alphabetical", "Source"];
	d20plus.items._listCols = ["name", "type", "rarity", "source"];
	d20plus.items._listItemBuilder = (it) => {
		if (!it._isEnhanced) EntryRenderer.item.enhanceItem(it);

		return `
		<span class="name col-3" title="name">${it.name}</span>
		<span class="type col-5" title="type">${it.typeText.split(",").map(t => `TYP[${t.trim()}]`).join(", ")}</span>
		<span class="rarity col-2" title="rarity">RAR[${it.rarity}]</span>
		<span title="source (Full: ${Parser.sourceJsonToFull(it.source)})" class="source col-2">SRC[${Parser.sourceJsonToAbv(it.source)}]</span>`;
	};
	d20plus.items._listIndexConverter = (it) => {
		if (!it._isEnhanced) EntryRenderer.item.enhanceItem(it);
		return {
			name: it.name.toLowerCase(),
			type: it.typeText.toLowerCase().split(","),
			rarity: it.rarity.toLowerCase(),
			source: Parser.sourceJsonToAbv(it.source).toLowerCase()
		};
	};
// Import Items button was clicked
	d20plus.items.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-items-url-player").val() : $("#import-items-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.items.playerImportBuilder : d20plus.items.handoutBuilder;

			if (url.trim() === "https://5etools.com/data/items.json") {
				EntryRenderer.item.buildList((itemList) => {
						d20plus.importer.showImportList(
							"item",
							itemList,
							handoutBuilder,
							{
								groupOptions: d20plus.items._groupOptions,
								forcePlayer,
								listItemBuilder: d20plus.items._listItemBuilder,
								listIndex: d20plus.items._listCols,
								listIndexConverter: d20plus.items._listIndexConverter
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
					d20plus.importer.addMeta(data._meta);
					d20plus.importer.showImportList(
						"item",
						data.item,
						handoutBuilder,
						{
							groupOptions: d20plus.items._groupOptions,
							forcePlayer,
							listItemBuilder: d20plus.items._listItemBuilder,
							listIndex: d20plus.items._listCols,
							listIndexConverter: d20plus.items._listIndexConverter
						}
					);
				});
			}
		}
	};

// Import individual items
	d20plus.items.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Items`, folderName);
		const path = ["Items", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;

		if (!data._isEnhanced) EntryRenderer.item.enhanceItem(data); // for homebrew items

		// build item handout
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				`rarity ${data.rarity}`,
				...data.procType,
				Parser.sourceJsonToFull(data.source)
			], "items")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [notecontents, gmnotes] = d20plus.items._getHandoutData(data);

				handout.updateBlobs({notes: notecontents, gmnotes: gmnotes});
				handout.save({
					notes: (new Date).getTime(),
					inplayerjournals: inJournals
				});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.items.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.items._getHandoutData(data);

		const importId = d20plus.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.items._getHandoutData = function (data) {
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
		if (data.weaponCategory) typeArray.push(data.weaponCategory + " Weapon");
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
				reqAttune = " (Requires Attunement " + reqAttune + ")";
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

		const gmnotes = JSON.stringify(roll20Data);

		return [notecontents, gmnotes];
	};

	d20plus.items.parseType = function (type) {
		const result = Parser.itemTypeToAbv(type);
		return result ? result : "n/a";
	};

	d20plus.items.parseDamageType = function (damagetype) {
		const result = Parser.dmgTypeToFull(damagetype);
		return result ? result : false;
	};

	d20plus.items.parseProperty = function (property) {
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
	d20plus.psionics._listCols = ["name", "order", "source"];
	d20plus.psionics._listItemBuilder = (it) => `
		<span class="name col-6">${it.name}</span>
		<span class="order col-4">ORD[${it.order || "None"}]</span>
		<span title="${Parser.sourceJsonToFull(it.source)}" class="source col-2">SRC[${Parser.sourceJsonToAbv(it.source)}]</span>`;
	d20plus.psionics._listIndexConverter = (p) => {
		return {
			name: p.name.toLowerCase(),
			order: (p.order || "none").toLowerCase(),
			source: Parser.sourceJsonToAbv(p.source).toLowerCase()
		};
	};
// Import Psionics button was clicked
	d20plus.psionics.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-psionics-url-player").val() : $("#import-psionics-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.psionics.playerImportBuilder : d20plus.psionics.handoutBuilder;

			DataUtil.loadJSON(url, (data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"psionic",
					data.psionic,
					handoutBuilder,
					{
						groupOptions: d20plus.psionics._groupOptions,
						forcePlayer,
						listItemBuilder: d20plus.psionics._listItemBuilder,
						listIndex: d20plus.psionics._listCols,
						listIndexConverter: d20plus.psionics._listIndexConverter
					}
				);
			});
		}
	};

	d20plus.psionics.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Psionics`, folderName);
		const path = ["Psionics", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				Parser.psiTypeToFull(data.type),
				data.order || "orderless",
				Parser.sourceJsonToFull(data.source)
				], "psionics")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_PSIONICS](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.psionics._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.psionics.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.psionics._getHandoutData(data);

		const importId = d20plus.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.psionics._getHandoutData = function (data) {
		function renderTalent () {
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
			`;

		const noteContents = `${baseNoteContents}<br><del>${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};

// Import Races button was clicked
	d20plus.races.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-races-url-player").val() : $("#import-races-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.races.playerImportBuilder : d20plus.races.handoutBuilder;

			DataUtil.loadJSON(url, (data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"race",
					EntryRenderer.race.mergeSubraces(data.race),
					handoutBuilder,
					{
						forcePlayer
					}
				);
			});
		}
	};

	d20plus.races.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Races`, folderName);
		const path = ["Races", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				Parser.sizeAbvToFull(data.size),
				Parser.sourceJsonToFull(data.source)
			], "races")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.races._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.races.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.races._getHandoutData(data);

		const importId = d20plus.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.races._getHandoutData = function (data) {
		const renderer = new EntryRenderer();
		renderer.setBaseUrl(BASE_SITE_URL);

		// TODO
		const renderStack = [];
		const ability = utils_getAbilityData(data.ability);
		renderStack.push(`
		<h3>${data.name}</h3>
		<p>
			<strong>Ability Scores:</strong> ${ability.asText}<br>
			<strong>Size:</strong> ${Parser.sizeAbvToFull(data.size)}<br>
			<strong>Speed:</strong> ${Parser.getSpeedString(data)}<br>
		</p>
	`);
		renderer.recursiveEntryRender({entries: data.entries}, renderStack, 1);
		const rendered = renderStack.join("");

		const r20json = {
			"name": data.name,
			"Vetoolscontent": data,
			"data": {
				"Category": "Races"
			}
		};
		const gmNotes = JSON.stringify(r20json);
		const noteContents = `${rendered}\n\n<del>${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};

// Import Feats button was clicked
	d20plus.feats.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-feats-url-player").val() : $("#import-feats-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.feats.playerImportBuilder : d20plus.feats.handoutBuilder;

			DataUtil.loadJSON(url, (data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"feat",
					data.feat,
					handoutBuilder,
					{
						forcePlayer
					}
				);
			});
		}
	};

	d20plus.feats.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Feats`, folderName);
		const path = ["Feats", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				Parser.sourceJsonToFull(data.source)
			], "feats")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.feats._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.feats.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.feats._getHandoutData(data);

		const importId = d20plus.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.feats._getHandoutData = function (data) {
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

		return [noteContents, gmNotes];
	};

// Import Object button was clicked
	d20plus.objects.button = function () {
		const url = $("#import-objects-url").val();
		if (url && url.trim()) {
			DataUtil.loadJSON(url, (data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"object",
					data.object,
					d20plus.objects.handoutBuilder
				);
			});
		}
	};

	d20plus.objects.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Objects`, folderName);
		const path = ["Objects", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.characters.create(
			{
				name: name,
				tags: d20plus.importer.getTagString([
					Parser.sizeAbvToFull(data.size),
					Parser.sourceJsonToFull(data.source)
				], "objects")
			},
			{
			success: function (character) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_OBJECTS](data)] = {name: data.name, source: data.source, type: "character", roll20Id: character.id};

				try {
					const avatar = data.tokenURL || `${IMG_URL}objects/${name}.png`;
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
					character.attribs.create({
						name: "advantagetoggle",
						current: d20plus.importer.getDesiredAdvantageToggle()
					});
					character.attribs.create({
						name: "whispertoggle",
						current: d20plus.importer.getDesiredWhisperToggle()
					});
					character.attribs.create({name: "dtype", current: d20plus.importer.getDesiredDamageType()});
					character.attribs.create({name: "npc_name", current: name});
					character.attribs.create({name: "npc_size", current: size});
					character.attribs.create({name: "type", current: data.type});
					character.attribs.create({name: "npc_type", current: `${size} ${data.type}`});
					character.attribs.create({name: "npc_ac", current: ac != null ? ac[0] : ""});
					character.attribs.create({name: "npc_actype", current: ""});
					character.attribs.create({name: "npc_hpbase", current: data.hp});
					character.attribs.create({name: "npc_hpformula", current: data.hp ? `${data.hp}d1` : ""});

					character.attribs.create({name: "npc_immunities", current: data.immune ? data.immune : ""});
					character.attribs.create({name: "damage_immunities", current: data.immune ? data.immune : ""});

					//Should only be one entry for objects
					if (data.entries != null) {
						character.attribs.create({name: "repeating_npctrait_0_name", current: name});
						character.attribs.create({name: "repeating_npctrait_0_desc", current: data.entries});
						if (d20plus.getCfgVal("token", "tokenactions")) {
							character.abilities.create({
								name: "Information: " + name,
								istokenaction: true,
								action: d20plus.actionMacroTrait(0)
							});
						}
					}

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
					$.each(d20.journal.customSheets.attrDeps, function (i, v) {
						dirty.push(i);
					});
					d20.journal.notifyWorkersOfAttrChanges(character.view.model.id, dirty, true);

					if (data.entries) {
						const bio = renderer.renderEntry({type: "entries", entries: data.entries});

						setTimeout(() => {
							const fluffAs = d20plus.getCfgVal("import", "importFluffAs") || d20plus.getCfgDefaultVal("import", "importFluffAs");
							let k = fluffAs === "Bio"? "bio" : "gmnotes";
							character.updateBlobs({
								[k]: Markdown.parse(bio)
							});
							character.save({
								[k]: (new Date).getTime()
							});
						}, 500);
					}
				} catch (e) {
					d20plus.log(`Error loading [${name}]`);
					d20plus.addImportError(name);
					console.log(data);
					console.log(e);
				}
				d20.journal.addItemToFolderStructure(character.id, folder.id);
			}
		});
	};

// version from previous scripts. Might be useless now?
	d20plus.importer.rollbaseOld = "@{wtype}&{template:npcaction} @{attack_display_flag} @{damage_flag} {{name=@{npc_name}}} {{rname=@{name}}} {{r1=[[1d20+(@{attack_tohit}+0)]]}} @{rtype}+(@{attack_tohit}+0)]]}} {{dmg1=[[@{attack_damage}+0]]}} {{dmg1type=@{attack_damagetype}}} {{dmg2=[[@{attack_damage2}+0]]}} {{dmg2type=@{attack_damagetype2}}} {{crit1=[[@{attack_crit}+0]]}} {{crit2=[[@{attack_crit2}+0]]}} {{description=@{description}}} @{charname_output}";
// from OGL sheet, Jan 2018
	d20plus.importer.rollbase = "@{wtype}&{template:npcaction} {{attack=1}} @{damage_flag} @{npc_name_flag} {{rname=@{name}}} {{r1=[[@{d20}+(@{attack_tohit}+0)]]}} @{rtype}+(@{attack_tohit}+0)]]}} {{dmg1=[[@{attack_damage}+0]]}} {{dmg1type=@{attack_damagetype}}} {{dmg2=[[@{attack_damage2}+0]]}} {{dmg2type=@{attack_damagetype2}}} {{crit1=[[@{attack_crit}+0]]}} {{crit2=[[@{attack_crit2}+0]]}} {{description=@{show_desc}}} @{charname_output}";

	d20plus.importer.getDesiredRollType = function () {
		// rtype
		const toggle = "@{advantagetoggle}";
		const never = "{{normal=1}} {{r2=[[0d20";
		const always = "{{always=1}} {{r2=[[@{d20}";
		const query = "{{query=1}} ?{Advantage?|Normal Roll,&#123&#123normal=1&#125&#125 &#123&#123r2=[[0d20|Advantage,&#123&#123advantage=1&#125&#125 &#123&#123r2=[[@{d20}|Disadvantage,&#123&#123disadvantage=1&#125&#125 &#123&#123r2=[[@{d20}}";
		const desired = d20plus.getCfgVal("import", "advantagemode");
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
		const desired = d20plus.getCfgVal("import", "advantagemode");
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
		const desired = d20plus.getCfgVal("import", "whispermode");
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
		const desired = d20plus.getCfgVal("import", "whispermode");
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
		const desired = d20plus.getCfgVal("import", "damagemode");
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
	};

// Import Classes button was clicked
	d20plus.classes.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-classes-url-player").val() : $("#import-classes-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.classes.playerImportBuilder : d20plus.classes.handoutBuilder;

			DataUtil.loadJSON(url, (data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"class",
					data.class,
					handoutBuilder,
					{
						forcePlayer
					}
				);
			});
		}
	};

	d20plus.classes.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Classes`, folderName);
		const path = ["Classes", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name,
			tags:  d20plus.importer.getTagString([
				Parser.sourceJsonToFull(data.source)
			], "classes")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.classes._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});

		d20plus.classes._handleSubclasses(data, overwrite, inJournals, folderName);
	};

	d20plus.classes._handleSubclasses = function (data, overwrite, inJournals, outerFolderName, forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		// import subclasses
		if (data.subclasses) {
			const allSubclasses = (data.source && isNonstandardSource(data.source)) || !window.confirm(`${data.name} subclasses: import published only?`);

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
				if (!allSubclasses && isNonstandardSource(sc.source)) return;

				sc.class = data.name;
				sc._gainAtLevels = gainFeatureArray;
				if (playerMode) {
					d20plus.subclasses.playerImportBuilder(sc);
				} else {
					const folderName = d20plus.importer._getHandoutPath("subclass", sc, "Class");
					const path = [folderName];
					if (outerFolderName) path.push(sc.source || data.source); // if it wasn't None, group by source
					d20plus.subclasses.handoutBuilder(sc, overwrite, inJournals, path);
				}
			});
		}
	};

	d20plus.classes.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.classes._getHandoutData(data);

		const importId = d20plus.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);

		d20plus.classes._handleSubclasses(data, false, false, null, true);
	};

	d20plus.classes._getHandoutData = function (data) {
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

		return [noteContents, gmNotes];
	};

	d20plus.subclasses._groupOptions = ["Class", "Alphabetical", "Source"];
	d20plus.subclasses._listCols = ["name", "class", "source"];
	d20plus.subclasses._listItemBuilder = (it) => `
		<span class="name col-6">${it.name}</span>
		<span class="class col-4">CLS[${it.class}]</span>
		<span title="${Parser.sourceJsonToFull(it.source)}" class="source col-2">SRC[${Parser.sourceJsonToAbv(it.source)}]</span>`;
	d20plus.subclasses._listIndexConverter = (sc) => {
		return {
			name: sc.name.toLowerCase(),
			class: sc.class.toLowerCase(),
			source: Parser.sourceJsonToAbv(sc.source).toLowerCase()
		};
	};
// Import Subclasses button was clicked
	d20plus.subclasses.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-subclasses-url-player").val() : $("#import-subclasses-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.subclasses.playerImportBuilder : d20plus.subclasses.handoutBuilder;

			DataUtil.loadJSON(url, (data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"subclass",
					data.subclass,
					handoutBuilder,
					{
						groupOptions: d20plus.subclasses._groupOptions,
						forcePlayer,
						listItemBuilder: d20plus.subclasses._listItemBuilder,
						listIndex: d20plus.subclasses._listCols,
						listIndexConverter: d20plus.subclasses._listIndexConverter
					}
				);
			});
		}
	};

	d20plus.subclasses.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Subclasses`, folderName);
		const path = ["Sublasses", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = `${data.shortName} (${data.class})`;
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				data.class,
				Parser.sourceJsonToFull(data.source)
			], "subclasses")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.subclasses._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.subclasses.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.subclasses._getHandoutData(data);

		const importId = d20plus.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		const name = `${data.class ? `${data.class} \u2014 ` : ""}${data.name}`;
		d20plus.importer.makePlayerDraggable(importId, name);
	};

	d20plus.subclasses._getHandoutData = function (data) {
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

		return [noteContents, gmNotes];
	};

	d20plus.backgrounds.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-backgrounds-url-player").val() : $("#import-backgrounds-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.backgrounds.playerImportBuilder : d20plus.backgrounds.handoutBuilder;

			DataUtil.loadJSON(url, (data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"background",
					data.background,
					handoutBuilder,
					{
						forcePlayer
					}
				);
			});
		}
	};

	d20plus.backgrounds.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Backgrounds`, folderName);
		const path = ["Backgrounds", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name,
			tags:  d20plus.importer.getTagString([
				Parser.sourceJsonToFull(data.source)
			], "backgrounds")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BACKGROUNDS](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.backgrounds._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.backgrounds.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.backgrounds._getHandoutData(data);

		const importId = d20plus.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.backgrounds._getHandoutData = function (data) {
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

		return [noteContents, gmNotes];
	};

	// Import Adventures button was clicked
	d20plus.adventures.button = function () {
		const url = $("#import-adventures-url").val();
		if (url !== null) d20plus.adventures.load(url);
	};

	d20plus.importer.importModeSwitch = function () {
		d20plus.importer.clearPlayerImport();
		const $winPlayer = $(`#d20plus-playerimport`).find(`.append-list-journal`).empty();

		$(`.importer-section`).hide();
		const toShow = $(`#import-mode-select`).val();
		$(`#betteR20-settings`).find(`.importer-section[data-import-group="${toShow}"]`).show();
		const toShowPlayer = $(`#import-mode-select-player`).val();
		$(`#d20plus-playerimport`).find(`.importer-section[data-import-group="${toShowPlayer}"]`).show();
	};

	d20plus.importer.showImportList = function (dataType, dataArray, handoutBuilder, options) {
		if (!options) options = {};
		/*
		options = {
			groupOptions: ["Source", "CR", "Alphabetical", "Type"],
			forcePlayer: true,
			callback: () => console.log("hello world"),
			saveIdsTo: {}, // object to receive IDs of created handouts/creatures
			// these three generally used together
			listItemBuilder: (it) => `<span class="name col-8">${it.name}</span><span title="${Parser.sourceJsonToFull(it.source)}" class="source col-4">${it.cr ? `(CR ${it.cr.cr || it.cr}) ` : ""}(${Parser.sourceJsonToAbv(it.source)})</span>`,
			listIndex: ["name", "source"],
			listIndexConverter: (mon) => {
				name: mon.name.toLowerCase(),
				source: Parser.sourceJsonToAbv(m.source).toLowerCase() // everything is assumed to be lowercase
			};
		}
		 */
		$("a.ui-tabs-anchor[href='#journal']").trigger("click");

		if (!window.is_gm || options.forcePlayer) {
			d20plus.importer.clearPlayerImport();
			const $winPlayer = $(`#d20plus-playerimport`);
			const $appPlayer = $winPlayer.find(`.append-list-journal`);
			$appPlayer.empty();
			$appPlayer.append(`<ol class="dd-list Vetools-player-imported" style="max-width: 95%;"/>`);
		}

		// sort data
		dataArray.sort((a, b) => SortUtil.ascSort(a.name, b.name));

		// collect available properties
		const propSet = {}; // represent this as an object instead of a set, to maintain some semblance of ordering
		dataArray.map(it => Object.keys(it)).forEach(keys => keys.forEach(k => propSet[k] = true));

		// build checkbox list
		const $list = $("#import-list .list");
		$list.html("");
		dataArray.forEach((it, i) => {
			if (it.noDisplay) return;

			const inner = options.listItemBuilder
				? options.listItemBuilder(it)
				:  `<span class="name col-10">${it.name}</span><span class="source" title="${Parser.sourceJsonToFull(it.source)}">${Parser.sourceJsonToAbv(it.source)}</span>`;

			$list.append(`
			<label class="import-cb-label" data-listid="${i}">
				<input type="checkbox">
				${inner}
			</label>
		`);
		});

		// init list library
		const importList = new List("import-list", {
			valueNames: options.listIndex || ["name"]
		});

		// reset the UI and add handlers
		$(`#import-list > .search`).val("");
		importList.search("");
		$("#import-options label").hide();
		$("#import-overwrite").parent().show();
		$("#import-showplayers").parent().show();
		$("#organize-by").parent().show();
		$("#d20plus-importlist").dialog("open");

		$("#d20plus-importlist button").unbind("click");

		$("#importlist-selectall").bind("click", () => {
			d20plus.importer._importSelectAll(importList);
		});
		$("#importlist-deselectall").bind("click", () => {
			d20plus.importer._importDeselectAll(importList);
		});
		$("#importlist-selectvis").bind("click", () => {
			d20plus.importer._importSelectVisible(importList);
		});
		$("#importlist-deselectvis").bind("click", () => {
			d20plus.importer._importDeselectVisible(importList);
		});

		$("#importlist-selectall-published").bind("click", () => {
			d20plus.importer._importSelectPublished(importList);
		});

		if (options.listIndexConverter) {
			const $iptFilter = $(`#import-list-filter`).show();
			$(`#import-list-filter-help`).show();
			$iptFilter.off("keydown").off("keyup");
			d20plus.importer.addListFilter($iptFilter, dataArray, importList, options.listIndexConverter);
		} else {
			$(`#import-list-filter`).hide();
			$(`#import-list-filter-help`).hide();
		}

		const excludedProps = new Set();
		const $winProps = $("#d20plus-import-props");
		$winProps.find(`button`).bind("click", () => {
			excludedProps.clear();
			$winProps.find(`.prop-row`).each((i, ele) => {
				if (!$(ele).find(`input`).prop("checked")) excludedProps.add($(ele).find(`span`).text());
			});
		});
		const $btnProps = $(`#save-import-props`);
		$btnProps.bind("click", () => {
			$winProps.dialog("close");
		});
		const $props = $winProps.find(`.select-props`);
		$props.empty();
		$(`#import-open-props`).bind("click", () => {
			Object.keys(propSet).forEach(p => {
				const req = REQUIRED_PROPS[dataType] && REQUIRED_PROPS[dataType].includes(p);
				$props.append(`
					<label style="display: block; ${req ? "color: red;" : ""}" class="prop-row">
						<input type="checkbox" checked="true">
						<span>${p}</span>
					</label>
				`)
			});
			$winProps.dialog("open");
		});

		const $selGroupBy = $(`#organize-by`);
		$selGroupBy.html("");
		options.groupOptions = (options.groupOptions || ["Alphabetical", "Source"]).concat(["None"]);
		options.groupOptions.forEach(g => {
			$selGroupBy.append(`<option value="${g}">${g}</option>`);
		});

		$("#d20plus-importlist button#importstart").bind("click", function () {
			$("#d20plus-importlist").dialog("close");
			const overwrite = $("#import-overwrite").prop("checked");
			const inJournals = $("#import-showplayers").prop("checked") ? "all" : "";
			const groupBy = $(`#organize-by`).val();

			// build list of items to process
			const importQueue = [];
			importList.items.forEach((e) => {
				if ($(e.elm).find("input").prop("checked")) {
					const dataIndex = parseInt($(e.elm).data("listid"));
					const it = dataArray[dataIndex];
					importQueue.push(it);
				}
			});

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
				let it = importQueue.pop();
				it.name = it.name || "(Unknown)";

				$stsName.text(it.name);
				$stsRemain.text(remaining--);

				if (excludedProps.size) {
					it = JSON.parse(JSON.stringify(it));
					[...excludedProps].forEach(k => delete it[k]);
				}

				if (!window.is_gm || options.forcePlayer) {
					handoutBuilder(it);
				} else {
					const folderName = groupBy === "None" ? "" : d20plus.importer._getHandoutPath(dataType, it, groupBy);
					const builderOptions = {};
					if (dataType === "spell" && groupBy === "Spell Points") builderOptions.isSpellPoints = true;
					handoutBuilder(it, overwrite, inJournals, folderName, options.saveIdsTo, builderOptions);
				}
			}

			function handleWorkerComplete () {
				if (worker) clearInterval(worker);
				if (cancelWorker) {
					$stsName.text("Import cancelled");
					if (~$stsRemain.text().indexOf("(cancelled)")) $stsRemain.text(`${$stsRemain.text()} (cancelled)`);
					d20plus.log(`Import cancelled`);
					setTimeout(() => {
						d20plus.bindDropLocations();
					}, 250);
				} else {
					$stsName.text("Import complete");
					$stsRemain.text("0");
					d20plus.log(`Import complete`);
					setTimeout(() => {
						d20plus.bindDropLocations();
					}, 250);
					if (options.callback) options.callback();
				}
			}
		});
	};

	d20plus.spells.spLevelToSpellPoints = function (level) {
		switch (level) {
			case 1:
				return 2;
			case 2:
				return 3;
			case 3:
				return 5;
			case 4:
				return 6;
			case 5:
				return 7;
			case 6:
				return 8;
			case 7:
				return 10;
			case 8:
				return 11;
			case 9:
				return 13;
			case 0:
			default:
				return 0;
		}
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
						folderName = it.cr ? (it.cr.cr || it.cr) : "Unknown";
						break;
					case "Alphabetical":
						folderName = it.name[0].uppercaseFirst();
						break;
					case "Type (with tags)":
						folderName = Parser.monTypeToFullObj(it.type).asText.uppercaseFirst();
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
					case "Spell Points":
						folderName = `${d20plus.spells.spLevelToSpellPoints(it.level)} spell points`;
						break;
					case "Level":
					default:
						folderName = `${Parser.spLevelToFull(it.level)}${it.level ? " level" : ""}`;
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
			case "race": {
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
	};

	d20plus.importer._importToggleSelectAll = function (importList, selectAllCb) {
		const $sa = $(selectAllCb);
		importList.items.forEach(i => Array.prototype.forEach.call(i.elm.children, (e) => {
			if (e.tagName === "INPUT") {
				$(e).prop("checked", $sa.prop("checked"));
			}
		}));
	};

	d20plus.importer._importSelectAll = function (importList) {
		importList.items.forEach(i => Array.prototype.forEach.call(i.elm.children, (e) => {
			if (e.tagName === "INPUT") {
				$(e).prop("checked", true);
			}
		}));
	};

	d20plus.importer._importSelectVisible = function (importList) {
		importList.visibleItems.forEach(i => Array.prototype.forEach.call(i.elm.children, (e) => {
			if (e.tagName === "INPUT") {
				$(e).prop("checked", true);
			}
		}));
	};

	d20plus.importer._importDeselectAll = function (importList) {
		importList.items.forEach(i => Array.prototype.forEach.call(i.elm.children, (e) => {
			if (e.tagName === "INPUT") {
				$(e).prop("checked", false);
			}
		}));
	};

	d20plus.importer._importDeselectVisible = function (importList) {
		importList.visibleItems.forEach(i => Array.prototype.forEach.call(i.elm.children, (e) => {
			if (e.tagName === "INPUT") {
				$(e).prop("checked", false);
			}
		}));
	};

	d20plus.importer._importSelectPublished = function (importList) {
		function setSelection (i, setTo) {
			Array.prototype.forEach.call(i.elm.children, (e) => {
				if (e.tagName === "INPUT") {
					$(e).prop("checked", setTo);
				}
			})
		}

		importList.items.forEach(i => {
			if (isNonstandardSource(i.values().source)) {
				setSelection(i, false);
			} else {
				setSelection(i, true);
			}

		});
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

				function isPart (e) {
					return typeof e === "string" || typeof e === "object" && (e.type !== "entries");
				}

				// open progress window
				$("#d20plus-import").dialog("open");
				$("#import-remaining").text("Initialising...");

				// get metadata
				const adMeta = adventureMetadata.adventure.find(a => a.id.toLowerCase() === $("#import-adventures-url").data("id").toLowerCase())

				const addQueue = [];
				const sections = JSON.parse(JSON.stringify(data.data));
				const adDir = `${Parser.sourceJsonToFull(adMeta.id)}`;
				sections.forEach((s, i) => {
					if (i >= adMeta.contents.length) return;

					const chapterDir = [adDir, adMeta.contents[i].name];

					const introEntries = [];
					if (s.entries && s.entries.length && isPart(s.entries[0])) {
						while (isPart(s.entries[0])) {
							introEntries.push(s.entries[0]);
							s.entries.shift();
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
						if (isPart(front)) {
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

				const $stsName = $("#import-name");
				const $stsRemain = $("#import-remaining");
				const interval = d20plus.getCfgVal("import", "importIntervalHandout") || d20plus.getCfgDefaultVal("import", "importIntervalHandout");

				////////////////////////////////////////////////////////////////////////////////////////////////////////
				EntryRenderer.getDefaultRenderer().setBaseUrl(BASE_SITE_URL);
				// pre-import tags
				const tags = {};
				renderer.doExportTags(tags);
				addQueue.forEach(entry => {
					renderer.recursiveEntryRender(entry, []);
				});

				// storage for returned handout/character IDs
				const RETURNED_IDS = {};

				// monsters
				const preMonsters = Object.keys(tags)
					.filter(k => tags[k].page === "bestiary.html")
					.map(k => tags[k]);
				if (confirm("Import creatures from this adventure?")) doPreImport(preMonsters, showMonsterImport);
				else doItemImport();

				function showMonsterImport (toImport) {
					d20plus.log(`Displaying monster import list for [${adMeta.name}]`);
					d20plus.importer.showImportList(
						"monster",
						toImport.filter(it => it),
						d20plus.monsters.handoutBuilder,
						{
							groupOptions: d20plus.monsters._groupOptions,
							saveIdsTo: RETURNED_IDS,
							callback: doItemImport,
							listItemBuilder: d20plus.monsters._listItemBuilder,
							listIndex: d20plus.monsters._listCols,
							listIndexConverter: d20plus.monsters._listIndexConverter
						}
					);
				}

				// items
				function doItemImport () {
					const preItems = Object.keys(tags)
						.filter(k => tags[k].page === "items.html")
						.map(k => tags[k]);
					if (confirm("Import items from this adventure?")) doPreImport(preItems, showItemImport);
					else doMainImport();
				}

				function showItemImport (toImport) {
					d20plus.log(`Displaying item import list for [${adMeta.name}]`);
					d20plus.importer.showImportList(
						"item",
						toImport.filter(it => it),
						d20plus.items.handoutBuilder,
						{
							groupOptions: d20plus.items._groupOptions,
							saveIdsTo: RETURNED_IDS,
							callback: doMainImport,
							listItemBuilder: d20plus.items._listItemBuilder,
							listIndex: d20plus.items._listCols,
							listIndexConverter: d20plus.items._listIndexConverter
						}
					);
				}

				function doPreImport (asTags, callback) {
					const tmp = [];
					let cachedCount = asTags.length;
					asTags.forEach(it => {
						try {
							EntryRenderer.hover._doFillThenCall(
								it.page,
								it.source,
								it.hash,
								() => {
									tmp.push(EntryRenderer.hover._getFromCache(it.page, it.source, it.hash));
									cachedCount--;
									if (cachedCount <= 0) callback(tmp);
								}
							);
						} catch (x) {
							console.log(x);
							cachedCount--;
							if (cachedCount <= 0) callback(tmp);
						}
					});
				}
				////////////////////////////////////////////////////////////////////////////////////////////////////////
				function doMainImport () {
					// pass in any created handouts/characters to use for links in the renderer
					renderer.setRoll20Ids(RETURNED_IDS);

					let cancelWorker = false;
					const $btnCancel = $(`#importcancel`);
					$btnCancel.off("click");
					$btnCancel.on("click", () => {
						cancelWorker = true;
					});

					let remaining = addQueue.length;

					d20plus.log(`Running import of [${adMeta.name}] with ${interval} ms delay between each handout create`);
					let lastId = null;
					let lastName = null;

					const worker = setInterval(() => {
						if (!addQueue.length || cancelWorker) {
							clearInterval(worker);
							$stsName.text("DONE!");
							$stsRemain.text("0");
							d20plus.log(`Finished import of [${adMeta.name}]`);
							renderer.resetRoll20Ids();
							return;
						}

						// pull items out the queue in LIFO order, for journal ordering (last created will be at the top)
						const entry = addQueue.pop();
						entry.name = entry.name || "(Unknown)";
						entry.name = d20plus.importer.getCleanText(renderer.renderEntry(entry.name));
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
								lastName = entry.name;
								handout.updateBlobs({notes: rendered});
								handout.save({notes: (new Date).getTime(), inplayerjournals: ""});
								d20.journal.addItemToFolderStructure(handout.id, folder.id);
							}
						});
					}, interval);
				}
			}
		});
	};

	d20plus.importer.getCleanText = function (str) {
		const check = jQuery.parseHTML(str);
		if (check.length === 1 && check[0].constructor === Text) {
			return str;
		}
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

	d20plus.setInitiativeShrink = function (doShrink) {
		const customStyle = $(`#dynamicStyle`);
		if (doShrink) {
			customStyle.html(d20plus.miniInitStyle);
		} else {
			customStyle.html("");
		}
	};

	d20plus.difficultyHtml = `<span class="difficulty" style="position: absolute"></span>`;

	d20plus.multipliers = [1, 1.5, 2, 2.5, 3, 4, 5];

	d20plus.playerImportHtml = `<div id="d20plus-playerimport" title="Temporary Import">
	<div class="append-target">
		<!-- populate with js -->
	</div>
	<div class="append-list-journal" style="max-height: 400px; overflow-y: auto;">
		<!-- populate with js -->		
	</div>
	<p><i>Player-imported items are temporary, as players can't make handouts. GMs may also use this functionality to avoid cluttering the journal. Once imported, items can be drag-dropped to character sheets.</i></p>
</div>`;

	d20plus.importListHTML = `<div id="d20plus-importlist" title="Import..." style="width: 1000px;">
<p style="display: flex">
	<button type="button" id="importlist-selectall" class="btn" style="margin: 0 2px;"><span>Select All</span></button>
	<button type="button" id="importlist-deselectall" class="btn" style="margin: 0 2px;"><span>Deselect All</span></button>
	<button type="button" id="importlist-selectvis" class="btn" style="margin: 0 2px;"><span>Select Visible</span></button>
	<button type="button" id="importlist-deselectvis" class="btn" style="margin: 0 2px;"><span>Deselect Visible</span></button>
	<span style="width:1px;background: #bbb;height: 26px;margin: 2px;"></span>
	<button type="button" id="importlist-selectall-published" class="btn" style="margin: 0 2px;"><span>Select All Published</span></button>
</p>
<p>
<span id="import-list">
	<input class="search" autocomplete="off" placeholder="Search list...">
	<input type="search" id="import-list-filter" class="filter" placeholder="Filter...">
	<span id ="import-list-filter-help" title="Filter format example: 'cr:1/4; cr:1/2; type:beast; source:MM' -- hover over the columns to see the filterable name." style="cursor: help;">[?]</span>
	<br>
	<span class="list" style="max-height: 400px; overflow-y: scroll; overflow-x: hidden; display: block; margin-top: 1em; transform: translateZ(0);"></span>
</span>
</p>
<p id="import-options">
<label style="display: inline-block">Group Handouts By... <select id="organize-by"></select></label>
<button type="button" id="import-open-props" class="btn" role="button" aria-disabled="false" style="padding: 3px; display: inline-block;">Select Properties</button>
<label>Make handouts visible to all players? <input type="checkbox" title="Make items visible to all players" id="import-showplayers" checked></label>
<label>Overwrite existing? <input type="checkbox" title="Overwrite existing" id="import-overwrite"></label>
</p>
<button type="button" id="importstart" class="btn" role="button" aria-disabled="false">
<span>Start Import</span>
</button>
</div>`;

	d20plus.importListPropsHTML = `<div id="d20plus-import-props" title="Choose Properties to Import">
	<div class="select-props" style="max-height: 400px; overflow-y: scroll; transform: translateZ(0)">
		<!-- populate with JS -->		
	</div>
	<p>
		Warning: this feature is highly experimental, and disabling <span style="color: red;">properties which are assumed to always exist</span> is not recommended.
		<br>
		<button type="button" id="save-import-props" class="btn" role="button" aria-disabled="false">Save</button>
	</p>
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

	d20plus.settingsHtmlImportHeader = `
<h4>Import By Category</h4>
<p><small><i>We strongly recommend the OGL sheet for importing. You can switch afterwards.</i></small></p>
`;
	d20plus.settingsHtmlSelector = `
<select id="import-mode-select">
<option value="none" disabled selected>Select category...</option>
<option value="monster">Monsters</option>
<option value="spell">Spells</option>
<option value="item">Items</option>
<option value="psionic">Psionics</option>
<option value="race">Races</option>
<option value="feat">Feats</option>
<option value="object">Objects</option>
<option value="class">Classes</option>
<option value="subclass">Subclasses</option>
<option value="background">Backgrounds</option>
<option value="adventure">Adventures</option>
</select>
`;
	d20plus.settingsHtmlSelectorPlayer = `
<select id="import-mode-select-player">
<option value="none" disabled selected>Select category...</option>
<option value="spell">Spells</option>
<option value="item">Items</option>
<option value="psionic">Psionics</option>
<option value="race">Races</option>
<option value="feat">Feats</option>
<option value="class">Classes</option>
<option value="subclass">Subclasses</option>
<option value="background">Backgrounds</option>
</select>
`;
	d20plus.settingsHtmlPtMonsters = `
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
`;

	d20plus.settingsHtmlPtItems = `
<div class="importer-section" data-import-group="item">
<h4>Item Importing</h4>
<label for="import-items-url">Item Data URL:</label>
<select id="button-items-select"><!-- populate with JS--></select>
<input type="text" id="import-items-url">
<a class="btn" href="#" id="import-items-load">Import Items</a>
</div>
`;

	d20plus.settingsHtmlPtItemsPlayer = `
<div class="importer-section" data-import-group="item">
<h4>Item Importing</h4>
<label for="import-items-url-player">Item Data URL:</label>
<select id="button-items-select-player"><!-- populate with JS--></select>
<input type="text" id="import-items-url-player">
<a class="btn" href="#" id="import-items-load-player">Import Items</a>
</div>
`;

	d20plus.settingsHtmlPtSpells = `
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
`;

	d20plus.settingsHtmlPtSpellsPlayer = `
<div class="importer-section" data-import-group="spell">
<h4>Spell Importing</h4>
<label for="import-spell-url-player">Spell Data URL:</label>
<select id="button-spell-select-player">
<!-- populate with JS-->
</select>
<input type="text" id="import-spell-url-player">
<p><a class="btn" href="#" id="button-spells-load-player">Import Spells</a><p/>
<p><a class="btn" href="#" id="button-spells-load-all-player" title="Standard sources only; no third-party or UA">Import Spells From All Sources</a></p>
<p>
The "Import Spells From All Sources" button presents a list containing spells from official sources only.<br>
To import from third-party sources, either individually select one available in the list or enter a custom URL, and "Import Spells."
</p>
</div>
`;

	d20plus.settingsHtmlPtPsionics = `
<div class="importer-section" data-import-group="psionic">
<h4>Psionic Importing</h4>
<label for="import-psionics-url">Psionics Data URL:</label>
<select id="button-psionics-select"><!-- populate with JS--></select>
<input type="text" id="import-psionics-url">
<a class="btn" href="#" id="import-psionics-load">Import Psionics</a>
</div>
`;

	d20plus.settingsHtmlPtPsionicsPlayer = `
<div class="importer-section" data-import-group="psionic">
<h4>Psionic Importing</h4>
<label for="import-psionics-url-player">Psionics Data URL:</label>
<select id="button-psionics-select-player"><!-- populate with JS--></select>
<input type="text" id="import-psionics-url-player">
<a class="btn" href="#" id="import-psionics-load-player">Import Psionics</a>
</div>
`;

	d20plus.settingsHtmlPtFeats = `
<div class="importer-section" data-import-group="feat">
<h4>Feat Importing</h4>
<label for="import-feats-url">Feat Data URL:</label>
<select id="button-feats-select"><!-- populate with JS--></select>
<input type="text" id="import-feats-url">
<a class="btn" href="#" id="import-feats-load">Import Feats</a>
</div>
`;

	d20plus.settingsHtmlPtFeatsPlayer = `
<div class="importer-section" data-import-group="feat">
<h4>Feat Importing</h4>
<label for="import-feats-url-player">Feat Data URL:</label>
<select id="button-feats-select-player"><!-- populate with JS--></select>
<input type="text" id="import-feats-url-player">
<a class="btn" href="#" id="import-feats-load-player">Import Feats</a>
</div>
`;

	d20plus.settingsHtmlPtObjects = `
<div class="importer-section" data-import-group="object">
<h4>Object Importing</h4>
<label for="import-objects-url">Object Data URL:</label>
<select id="button-objects-select"><!-- populate with JS--></select>
<input type="text" id="import-objects-url">
<a class="btn" href="#" id="import-objects-load">Import Objects</a>
</div>
`;

	d20plus.settingsHtmlPtRaces = `
<div class="importer-section" data-import-group="race">
<h4>Race Importing</h4>
<label for="import-races-url">Race Data URL:</label>
<select id="button-races-select"><!-- populate with JS--></select>
<input type="text" id="import-races-url">
<a class="btn" href="#" id="import-races-load">Import Races</a>
</div>
`;

	d20plus.settingsHtmlPtRacesPlayer = `
<div class="importer-section" data-import-group="race">
<h4>Race Importing</h4>
<label for="import-races-url-player">Race Data URL:</label>
<select id="button-races-select-player"><!-- populate with JS--></select>
<input type="text" id="import-races-url-player">
<a class="btn" href="#" id="import-races-load-player">Import Races</a>
</div>
`;

	d20plus.settingsHtmlPtClasses = `
<div class="importer-section" data-import-group="class">
<h4>Class Importing</h4>
<label for="import-classes-url">Class Data URL:</label>
<select id="button-classes-select"><!-- populate with JS--></select>
<input type="text" id="import-classes-url">
<a class="btn" href="#" id="import-classes-load">Import Classes</a>
</div>
`;

	d20plus.settingsHtmlPtClassesPlayer = `
<div class="importer-section" data-import-group="class">
<h4>Class Importing</h4>
<label for="import-classes-url-player">Class Data URL:</label>
<select id="button-classes-select-player"><!-- populate with JS--></select>
<input type="text" id="import-classes-url-player">
<a class="btn" href="#" id="import-classes-load-player">Import Classes</a>
</div>
`;

	d20plus.settingsHtmlPtSubclasses = `
<div class="importer-section" data-import-group="subclass">
<h4>Subclass Importing</h4>
<label for="import-subclasses-url">Subclass Data URL:</label>
<select id="button-subclasses-select"><!-- populate with JS--></select>
<input type="text" id="import-subclasses-url">
<a class="btn" href="#" id="import-subclasses-load">Import Subclasses</a>
<p>
<b>Default subclasses are imported as part of Classes import. This can be used to load homebrew classes.</b>
</p>
</div>
`;

	d20plus.settingsHtmlPtSubclassesPlayer = `
<div class="importer-section" data-import-group="subclass">
<h4>Subclass Importing</h4>
<label for="import-subclasses-url-player">Subclass Data URL:</label>
<select id="button-subclasses-select-player"><!-- populate with JS--></select>
<input type="text" id="import-subclasses-url-player">
<a class="btn" href="#" id="import-subclasses-load-player">Import Subclasses</a>
<p>
<b>Default subclasses are imported as part of Classes import. This can be used to load homebrew classes.</b>
</p>
</div>
`;

	d20plus.settingsHtmlPtBackgrounds = `
<div class="importer-section" data-import-group="background">
<h4>Background Importing</h4>
<label for="import-backgrounds-url">Background Data URL:</label>
<select id="button-backgrounds-select"><!-- populate with JS--></select>
<input type="text" id="import-backgrounds-url">
<a class="btn" href="#" id="import-backgrounds-load">Import Backgrounds</a>
</div>
`;

	d20plus.settingsHtmlPtBackgroundsPlayer = `
<div class="importer-section" data-import-group="background">
<h4>Background Importing</h4>
<label for="import-backgrounds-url-player">Background Data URL:</label>
<select id="button-backgrounds-select-player"><!-- populate with JS--></select>
<input type="text" id="import-backgrounds-url-player">
<a class="btn" href="#" id="import-backgrounds-load-player">Import Backgrounds</a>
</div>
`;

	d20plus.settingsHtmlPtAdventures = `
<div class="importer-section" data-import-group="adventure">
<h4>Adventure Importing</h4>
<label for="import-adventures-url">Adventure Data URL:</label>
<select id="button-adventures-select">
<!-- populate with JS-->
</select>
<input type="text" id="import-adventures-url">
<p><a class="btn" href="#" id="button-adventures-load">Import Adventure</a><p/>
</div>
`;

	d20plus.settingsHtmlPtImportFooter = `
<br>
<a class="btn bind-drop-locations" href="#" id="bind-drop-locations" style="margin-top: 3px;">Bind Drag-n-Drop</a>
<p><strong>Readme</strong></p>
<p>
You can drag-and-drop imported handouts to character sheets.<br>
If a handout is glowing green in the journal, it's draggable. This breaks when Roll20 decides to hard-refresh the journal.<br>
To restore this functionality, press the "Bind Drag-n-Drop" button.<br>
<i>Note: to drag a handout to a character sheet, you need to drag the name, and not the handout icon.</i>
</p>
`;

	d20plus.cssRules = d20plus.cssRules.concat([
		{
			s: ".no-shrink",
			r: "flex-shrink: 0;"
		},
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
			s: "del",
			r: "display: none;"
		},
		{
			s: ".import-cb-label",
			r: "display: block; margin-right: -13px !important;"
		},
		{
			s: ".import-cb-label span",
			r: "display: inline-block; overflow: hidden; max-height: 18px; letter-spacing: -1px; font-size: 12px;"
		},
		{
			s: ".import-cb-label .source",
			r: "width: calc(16.667% - 28px);'"
		},
		{
			s: ".importer-section",
			r: "display: none;"
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
		},
		{
			s: ".userscript-statsBlockInsetReadaloud",
			r: "background: #cbd6c688 !important"
		},
		// some generic width stuff
		{
			s: ".col-1",
			r: "width: 8.333%;"
		},
		{
			s: ".col-2",
			r: "width: 16.666%;"
		},
		{
			s: ".col-3",
			r: "width: 25%;"
		},
		{
			s: ".col-4",
			r: "width: 33.333%;"
		},
		{
			s: ".col-5",
			r: "width: 41.667%;"
		},
		{
			s: ".col-6",
			r: "width: 50%;"
		},
		{
			s: ".col-7",
			r: "width: 58.333%;"
		},
		{
			s: ".col-8",
			r: "width: 66.667%;"
		},
		{
			s: ".col-9",
			r: "width: 75%;"
		},
		{
			s: ".col-10",
			r: "width: 83.333%;"
		},
		{
			s: ".col-11",
			r: "width: 91.667%;"
		},
		{
			s: ".col-12",
			r: "width: 100%;"
		},
	]);

	d20plus.tools = d20plus.tools.concat([
		{
			name: "Shapeshifter Token Builder",
			desc: "Build a rollable table and related token to represent a shapeshifting creature.",
			html: `
				<div id="d20plus-shapeshiftbuild" title="Shapeshifter Token Builder">
					<div id="shapeshiftbuild-list">
						<input type="search" class="search" placeholder="Search creatures...">
						<input type="search" class="filter" placeholder="Filter...">
						<span title="Filter format example: 'cr:1/4; cr:1/2; type:beast; source:MM'" style="cursor: help;">[?]</span>
						<div class="list" style="transform: translateZ(0); max-height: 490px; overflow-y: scroll; overflow-x: hidden;"><i>Loading...</i></div>
					</div>
				<br>
				<input id="shapeshift-name" placeholder="Table name">
				<button class="btn">Create Table</button>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-shapeshiftbuild").dialog({
					autoOpen: false,
					resizable: true,
					width: 800,
					height: 650,
				});
			},
			openFn: () => {
				const $win = $("#d20plus-shapeshiftbuild");
				$win.dialog("open");

				const toLoad = Object.keys(monsterDataUrls).map(src => d20plus.monsters.formMonsterUrl(monsterDataUrls[src]));

				const $fltr = $win.find(`.filter`);
				$fltr.off("keydown").off("keyup");
				$win.find(`button`).off("click");

				const $lst = $win.find(`.list`);
				let tokenList;

				DataUtil.multiLoadJSON(
					toLoad.map(url => ({url})),
					() => {},
					(dataStack) => {
						$lst.empty();

						let toShow = [];
						dataStack.forEach(d => toShow = toShow.concat(d.monster));
						toShow = toShow.sort((a, b) => SortUtil.ascSort(a.name, b.name));

						let tmp = "";
						toShow.forEach((m, i)  => {
							m.__pType = Parser.monTypeToFullObj(m.type).asText;

							tmp += `
								<label class="import-cb-label" data-listid="${i}">
									<input type="checkbox">
									<span class="name col-4">${m.name}</span>
									<span class="type col-4">TYP[${m.__pType.uppercaseFirst()}]</span>
									<span class="cr col-2">${m.cr === undefined ? "CR[Unknown]" : `CR[${(m.cr.cr || m.cr)}]`}</span>
									<span title="${Parser.sourceJsonToFull(m.source)}" class="source">SRC[${Parser.sourceJsonToAbv(m.source)}]</span>
								</label>
							`;
						});
						$lst.html(tmp);
						tmp = null;

						tokenList = new List("shapeshiftbuild-list", {
							valueNames: ["name", "type", "cr", "source"]
						});

						d20plus.importer.addListFilter($fltr, toShow, tokenList, d20plus.monsters._listIndexConverter);

						$win.find(`button`).on("click", () => {
							console.log("Assembling creature list");
							if (tokenList) {
								$("a.ui-tabs-anchor[href='#deckstables']").trigger("click");

								const sel = tokenList.items
									.filter(it => $(it.elm).find(`input`).prop("checked"))
									.map(it => toShow[$(it.elm).attr("data-listid")]);

								const id = d20.Campaign.rollabletables.create().id;
								const table = d20.Campaign.rollabletables.get(id);
								table.set("name", $(`#shapeshift-name`).val().trim() || "Shapeshifter");
								table.save();
								sel.forEach(m => {
									const item = table.tableitems.create();
									item.set("name", m.name);
									const avatar = m.tokenURL || `${IMG_URL}${Parser.sourceJsonToAbv(m.source)}/${m.name.replace(/"/g, "")}.png`;
									item.set("avatar", avatar);
									item.save();
								});
								table.save();
								d20.rollabletables.refreshTablesList();
								alert("Created table!")
							}
						});
					}
				);
			}
		},
		{
			name: "Pauper's Character Vault",
			desc: "Dump characters to JSON, or import dumped characters.",
			html: `
				<div id="d20plus-paupervault" title="Pauper's Character Vault">
				<p>
					This experimental tool allows you to download characters as JSON, to later upload to other games.
				</p>
				<select style="margin-bottom: 0;"></select> <button class="btn download">Download</button>
				<hr>
				<button class="btn upload">Upload</button><input accept=".json" type="file" style="position: absolute; left: -9999px;"> (Previously Download-ed files only)
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-paupervault").dialog({
					autoOpen: false,
					resizable: true,
					width: 400,
					height: 250,
				});
			},
			openFn: () => {
				const $win = $("#d20plus-paupervault");
				$win.dialog("open");

				const $selChar = $win.find(`select`);

				$selChar.append(d20.Campaign.characters.toJSON().sort((a, b) => SortUtil.ascSort(a.name, b.name)).map(c => {
					return `<option value="${c.id}">${c.name || `(Unnamed; ID ${c.id})`}</option>`
				}).join(""));

				const $btnDl = $win.find(`.download`);
				$btnDl.off("click");
				$btnDl.on("click", () => {
					const id = $selChar.val();
					const rawChar = d20.Campaign.characters.get(id);
					const char = rawChar.toJSON();
					char.attribs = rawChar.attribs.toJSON();
					DataUtil.userDownload(char.name.replace(/[^0-9A-Za-z -_()\[\]{}]/, "_"), JSON.stringify({
						char
					}, null, "\t"));
				});

				const $btnUl = $win.find(`.upload`);
				$btnUl.off("click");
				$btnUl.on("click", () => {
					const $iptFile = $win.find(`input[type="file"]`);

					const input = $iptFile[0];

					const reader = new FileReader();
					reader.onload = () => {
						$("a.ui-tabs-anchor[href='#journal']").trigger("click");

						try {
							const text = reader.result;
							const json = JSON.parse(text);

							if (!json.char) {
								window.alert("Failed to import character! See the log for details.");
								console.error(`No "char" attribute found in parsed JSON!`);
								return;
							}
							const char = json.char;

							const newId = d20plus.generateRowId();
							d20.Campaign.characters.create(
								{
									...char,
									id: newId
								},
								{
									success: function (character) {
										try {
											character.attribs.reset();
											if (!char.attribs) {
												window.alert(`Warning: Uploaded character had no "attribs" attribute. The character sheet will contain no data.`);
												return;
											}
											const toSave = char.attribs.map(a => character.attribs.push(a));
											toSave.forEach(s => s.syncedSave());
										} catch (e) {
											window.alert("Failed to import character! See the log for details.");
											console.error(e);
										}
									}
								}
							);
						} catch (e) {
							console.error(e);
							window.alert("Failed to load file! See the log for details.")
						}
					};
					input.onchange = function () {
						reader.readAsText(input.files[0]);
					};

					$iptFile.click();
				});
			}
		}
	]);

	// caller should run `$iptFilter.off("keydown").off("keyup");` before calling this
	d20plus.importer.addListFilter = function ($iptFilter, dataList, listObj, listIndexConverter) {
		$iptFilter.val("");
		const TYPE_TIMEOUT_MS = 100;
		let typeTimer;
		$iptFilter.on("keyup", () => {
			clearTimeout(typeTimer);
			typeTimer = setTimeout(() => {
				const exps = $iptFilter.val().split(";");
				const filters = exps.map(it => it.trim())
					.filter(it => it)
					.map(it => it.toLowerCase().split(":"))
					.filter(it => it.length === 2)
					.map(it => ({field: it[0], value: it[1]}));
				const grouped = [];
				filters.forEach(f => {
					const existing = grouped.find(it => it.field === f.field);
					if (existing) existing.values.push(f.value);
					else grouped.push({field: f.field, values: [f.value]})
				});

				listObj.filter((item) => {
					const it = dataList[$(item.elm).attr("data-listid")];
					it._filterVs = it._filterVs || listIndexConverter(it);
					return !grouped.find(f => {
						if (it._filterVs[f.field]) {
							if (it._filterVs[f.field] instanceof Array) {
								return !(it._filterVs[f.field].find(v => f.values.includes(v)));
							} else {
								return !f.values.includes(it._filterVs[f.field])
							}
						}
						return false;
					});
				});
			}, TYPE_TIMEOUT_MS);
		});
		$iptFilter.on("keydown", () => {
			clearTimeout(typeTimer);
		});
	};

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
		return "%{selected|repeating_npcaction_$" + index + "_npc_action}";
	};

	d20plus.actionMacroReaction = "/w gm &{template:npcaction} {{name=@{selected|npc_name}}} {{rname=@{selected|repeating_npcreaction_$0_name}}} {{description=@{selected|repeating_npcreaction_$0_desc} }} ";

	d20plus.actionMacroLegendary = function (tokenactiontext) {
		return "/w gm @{selected|wtype}&{template:npcaction} {{name=@{selected|npc_name}}} {{rname=Legendary Actions}} {{description=The @{selected|npc_name} can take @{selected|npc_legendary_actions} legendary actions, choosing from the options below. Only one legendary option can be used at a time and only at the end of another creature's turn. The @{selected|npc_name} regains spent legendary actions at the start of its turn.\n\r" + tokenactiontext + "}} ";
	}
};

SCRIPT_EXTENSIONS.push(betteR205etools);

const betteR20Emoji = function () {
	d20plus.chat = {};

	d20plus.chat.emojiIndex = {
		joy: !0,
		heart: !0,
		heart_eyes: !0,
		sob: !0,
		blush: !0,
		unamused: !0,
		kissing_heart: !0,
		two_hearts: !0,
		weary: !0,
		ok_hand: !0,
		pensive: !0,
		smirk: !0,
		grin: !0,
		recycle: !0,
		wink: !0,
		thumbsup: !0,
		pray: !0,
		relieved: !0,
		notes: !0,
		flushed: !0,
		raised_hands: !0,
		see_no_evil: !0,
		cry: !0,
		sunglasses: !0,
		v: !0,
		eyes: !0,
		sweat_smile: !0,
		sparkles: !0,
		sleeping: !0,
		smile: !0,
		purple_heart: !0,
		broken_heart: !0,
		expressionless: !0,
		sparkling_heart: !0,
		blue_heart: !0,
		confused: !0,
		information_desk_person: !0,
		stuck_out_tongue_winking_eye: !0,
		disappointed: !0,
		yum: !0,
		neutral_face: !0,
		sleepy: !0,
		clap: !0,
		cupid: !0,
		heartpulse: !0,
		revolving_hearts: !0,
		arrow_left: !0,
		speak_no_evil: !0,
		kiss: !0,
		point_right: !0,
		cherry_blossom: !0,
		scream: !0,
		fire: !0,
		rage: !0,
		smiley: !0,
		tada: !0,
		tired_face: !0,
		camera: !0,
		rose: !0,
		stuck_out_tongue_closed_eyes: !0,
		muscle: !0,
		skull: !0,
		sunny: !0,
		yellow_heart: !0,
		triumph: !0,
		new_moon_with_face: !0,
		laughing: !0,
		sweat: !0,
		point_left: !0,
		heavy_check_mark: !0,
		heart_eyes_cat: !0,
		grinning: !0,
		mask: !0,
		green_heart: !0,
		wave: !0,
		persevere: !0,
		heartbeat: !0,
		arrow_forward: !0,
		arrow_backward: !0,
		arrow_right_hook: !0,
		leftwards_arrow_with_hook: !0,
		crown: !0,
		kissing_closed_eyes: !0,
		stuck_out_tongue: !0,
		disappointed_relieved: !0,
		innocent: !0,
		headphones: !0,
		white_check_mark: !0,
		confounded: !0,
		arrow_right: !0,
		angry: !0,
		grimacing: !0,
		star2: !0,
		gun: !0,
		raising_hand: !0,
		thumbsdown: !0,
		dancer: !0,
		musical_note: !0,
		no_mouth: !0,
		dizzy: !0,
		fist: !0,
		point_down: !0,
		red_circle: !0,
		no_good: !0,
		boom: !0,
		thought_balloon: !0,
		tongue: !0,
		poop: !0,
		cold_sweat: !0,
		gem: !0,
		ok_woman: !0,
		pizza: !0,
		joy_cat: !0,
		sun_with_face: !0,
		leaves: !0,
		sweat_drops: !0,
		penguin: !0,
		zzz: !0,
		walking: !0,
		airplane: !0,
		balloon: !0,
		star: !0,
		ribbon: !0,
		ballot_box_with_check: !0,
		worried: !0,
		underage: !0,
		fearful: !0,
		four_leaf_clover: !0,
		hibiscus: !0,
		microphone: !0,
		open_hands: !0,
		ghost: !0,
		palm_tree: !0,
		bangbang: !0,
		nail_care: !0,
		x: !0,
		alien: !0,
		bow: !0,
		cloud: !0,
		soccer: !0,
		angel: !0,
		dancers: !0,
		exclamation: !0,
		snowflake: !0,
		point_up: !0,
		kissing_smiling_eyes: !0,
		rainbow: !0,
		crescent_moon: !0,
		heart_decoration: !0,
		gift_heart: !0,
		gift: !0,
		beers: !0,
		anguished: !0,
		earth_africa: !0,
		movie_camera: !0,
		anchor: !0,
		zap: !0,
		heavy_multiplication_x: !0,
		runner: !0,
		sunflower: !0,
		earth_americas: !0,
		bouquet: !0,
		dog: !0,
		moneybag: !0,
		herb: !0,
		couple: !0,
		fallen_leaf: !0,
		tulip: !0,
		birthday: !0,
		cat: !0,
		coffee: !0,
		dizzy_face: !0,
		point_up_2: !0,
		open_mouth: !0,
		hushed: !0,
		basketball: !0,
		christmas_tree: !0,
		ring: !0,
		full_moon_with_face: !0,
		astonished: !0,
		two_women_holding_hands: !0,
		money_with_wings: !0,
		crying_cat_face: !0,
		hear_no_evil: !0,
		dash: !0,
		cactus: !0,
		hotsprings: !0,
		telephone: !0,
		maple_leaf: !0,
		princess: !0,
		massage: !0,
		love_letter: !0,
		trophy: !0,
		person_frowning: !0,
		us: !0,
		confetti_ball: !0,
		blossom: !0,
		lips: !0,
		fries: !0,
		doughnut: !0,
		frowning: !0,
		ocean: !0,
		bomb: !0,
		ok: !0,
		cyclone: !0,
		rocket: !0,
		umbrella: !0,
		couplekiss: !0,
		couple_with_heart: !0,
		lollipop: !0,
		clapper: !0,
		pig: !0,
		smiling_imp: !0,
		imp: !0,
		bee: !0,
		kissing_cat: !0,
		anger: !0,
		musical_score: !0,
		santa: !0,
		earth_asia: !0,
		football: !0,
		guitar: !0,
		panda_face: !0,
		speech_balloon: !0,
		strawberry: !0,
		smirk_cat: !0,
		banana: !0,
		watermelon: !0,
		snowman: !0,
		smile_cat: !0,
		top: !0,
		eggplant: !0,
		crystal_ball: !0,
		fork_and_knife: !0,
		calling: !0,
		iphone: !0,
		partly_sunny: !0,
		warning: !0,
		scream_cat: !0,
		small_orange_diamond: !0,
		baby: !0,
		feet: !0,
		footprints: !0,
		beer: !0,
		wine_glass: !0,
		o: !0,
		video_camera: !0,
		rabbit: !0,
		tropical_drink: !0,
		smoking: !0,
		space_invader: !0,
		peach: !0,
		snake: !0,
		turtle: !0,
		cherries: !0,
		kissing: !0,
		frog: !0,
		milky_way: !0,
		rotating_light: !0,
		hatching_chick: !0,
		closed_book: !0,
		candy: !0,
		hamburger: !0,
		bear: !0,
		tiger: !0,
		fast_forward: !0,
		icecream: !0,
		pineapple: !0,
		ear_of_rice: !0,
		syringe: !0,
		put_litter_in_its_place: !0,
		chocolate_bar: !0,
		black_small_square: !0,
		tv: !0,
		pill: !0,
		octopus: !0,
		jack_o_lantern: !0,
		grapes: !0,
		smiley_cat: !0,
		cd: !0,
		cocktail: !0,
		cake: !0,
		video_game: !0,
		arrow_down: !0,
		no_entry_sign: !0,
		lipstick: !0,
		whale: !0,
		cookie: !0,
		dolphin: !0,
		loud_sound: !0,
		man: !0,
		hatched_chick: !0,
		monkey: !0,
		books: !0,
		japanese_ogre: !0,
		guardsman: !0,
		loudspeaker: !0,
		scissors: !0,
		girl: !0,
		mortar_board: !0,
		fr: !0,
		baseball: !0,
		vertical_traffic_light: !0,
		woman: !0,
		fireworks: !0,
		stars: !0,
		sos: !0,
		mushroom: !0,
		pouting_cat: !0,
		left_luggage: !0,
		high_heel: !0,
		dart: !0,
		swimmer: !0,
		key: !0,
		bikini: !0,
		family: !0,
		pencil2: !0,
		elephant: !0,
		droplet: !0,
		seedling: !0,
		apple: !0,
		cool: !0,
		telephone_receiver: !0,
		dollar: !0,
		house_with_garden: !0,
		book: !0,
		haircut: !0,
		computer: !0,
		bulb: !0,
		question: !0,
		back: !0,
		boy: !0,
		closed_lock_with_key: !0,
		person_with_pouting_face: !0,
		tangerine: !0,
		sunrise: !0,
		poultry_leg: !0,
		blue_circle: !0,
		oncoming_automobile: !0,
		shaved_ice: !0,
		bird: !0,
		first_quarter_moon_with_face: !0,
		eyeglasses: !0,
		goat: !0,
		night_with_stars: !0,
		older_woman: !0,
		black_circle: !0,
		new_moon: !0,
		two_men_holding_hands: !0,
		white_circle: !0,
		customs: !0,
		tropical_fish: !0,
		house: !0,
		arrows_clockwise: !0,
		last_quarter_moon_with_face: !0,
		round_pushpin: !0,
		full_moon: !0,
		athletic_shoe: !0,
		lemon: !0,
		baby_bottle: !0,
		spaghetti: !0,
		wind_chime: !0,
		fish_cake: !0,
		evergreen_tree: !0,
		up: !0,
		arrow_up: !0,
		arrow_upper_right: !0,
		arrow_lower_right: !0,
		arrow_lower_left: !0,
		performing_arts: !0,
		nose: !0,
		pig_nose: !0,
		fish: !0,
		man_with_turban: !0,
		koala: !0,
		ear: !0,
		eight_spoked_asterisk: !0,
		small_blue_diamond: !0,
		shower: !0,
		bug: !0,
		ramen: !0,
		tophat: !0,
		bride_with_veil: !0,
		fuelpump: !0,
		checkered_flag: !0,
		horse: !0,
		watch: !0,
		monkey_face: !0,
		baby_symbol: !0,
		new: !0,
		free: !0,
		sparkler: !0,
		corn: !0,
		tennis: !0,
		alarm_clock: !0,
		battery: !0,
		grey_exclamation: !0,
		wolf: !0,
		moyai: !0,
		cow: !0,
		mega: !0,
		older_man: !0,
		dress: !0,
		link: !0,
		chicken: !0,
		whale2: !0,
		arrow_upper_left: !0,
		deciduous_tree: !0,
		bento: !0,
		pushpin: !0,
		soon: !0,
		repeat: !0,
		dragon: !0,
		hamster: !0,
		golf: !0,
		surfer: !0,
		mouse: !0,
		waxing_crescent_moon: !0,
		blue_car: !0,
		a: !0,
		interrobang: !0,
		u5272: !0,
		electric_plug: !0,
		first_quarter_moon: !0,
		cancer: !0,
		trident: !0,
		bread: !0,
		cop: !0,
		tea: !0,
		fishing_pole_and_fish: !0,
		bike: !0,
		rice: !0,
		radio: !0,
		baby_chick: !0,
		arrow_heading_down: !0,
		waning_crescent_moon: !0,
		arrow_up_down: !0,
		last_quarter_moon: !0,
		radio_button: !0,
		sheep: !0,
		person_with_blond_hair: !0,
		waning_gibbous_moon: !0,
		lock: !0,
		green_apple: !0,
		japanese_goblin: !0,
		curly_loop: !0,
		triangular_flag_on_post: !0,
		arrows_counterclockwise: !0,
		racehorse: !0,
		fried_shrimp: !0,
		sunrise_over_mountains: !0,
		volcano: !0,
		rooster: !0,
		inbox_tray: !0,
		wedding: !0,
		sushi: !0,
		wavy_dash: !0,
		ice_cream: !0,
		rewind: !0,
		tomato: !0,
		rabbit2: !0,
		eight_pointed_black_star: !0,
		small_red_triangle: !0,
		high_brightness: !0,
		heavy_plus_sign: !0,
		man_with_gua_pi_mao: !0,
		convenience_store: !0,
		busts_in_silhouette: !0,
		beetle: !0,
		small_red_triangle_down: !0,
		arrow_heading_up: !0,
		name_badge: !0,
		bath: !0,
		no_entry: !0,
		crocodile: !0,
		dog2: !0,
		cat2: !0,
		hammer: !0,
		meat_on_bone: !0,
		shell: !0,
		sparkle: !0,
		b: !0,
		m: !0,
		poodle: !0,
		aquarius: !0,
		stew: !0,
		jeans: !0,
		honey_pot: !0,
		musical_keyboard: !0,
		unlock: !0,
		black_nib: !0,
		statue_of_liberty: !0,
		heavy_dollar_sign: !0,
		snowboarder: !0,
		white_flower: !0,
		necktie: !0,
		diamond_shape_with_a_dot_inside: !0,
		aries: !0,
		womens: !0,
		ant: !0,
		scorpius: !0,
		city_sunset: !0,
		hourglass_flowing_sand: !0,
		o2: !0,
		dragon_face: !0,
		snail: !0,
		dvd: !0,
		shirt: !0,
		game_die: !0,
		heavy_minus_sign: !0,
		dolls: !0,
		sagittarius: !0,
		"8ball": !0,
		bus: !0,
		custard: !0,
		crossed_flags: !0,
		part_alternation_mark: !0,
		camel: !0,
		curry: !0,
		steam_locomotive: !0,
		hospital: !0,
		large_blue_diamond: !0,
		tanabata_tree: !0,
		bell: !0,
		leo: !0,
		gemini: !0,
		pear: !0,
		large_orange_diamond: !0,
		taurus: !0,
		globe_with_meridians: !0,
		door: !0,
		clock6: !0,
		oncoming_police_car: !0,
		envelope_with_arrow: !0,
		closed_umbrella: !0,
		saxophone: !0,
		church: !0,
		bicyclist: !0,
		pisces: !0,
		dango: !0,
		capricorn: !0,
		office: !0,
		rowboat: !0,
		womans_hat: !0,
		mans_shoe: !0,
		love_hotel: !0,
		mount_fuji: !0,
		dromedary_camel: !0,
		handbag: !0,
		hourglass: !0,
		negative_squared_cross_mark: !0,
		trumpet: !0,
		school: !0,
		cow2: !0,
		construction_worker: !0,
		toilet: !0,
		pig2: !0,
		grey_question: !0,
		beginner: !0,
		violin: !0,
		on: !0,
		credit_card: !0,
		id: !0,
		secret: !0,
		ferris_wheel: !0,
		bowling: !0,
		libra: !0,
		virgo: !0,
		barber: !0,
		purse: !0,
		roller_coaster: !0,
		rat: !0,
		date: !0,
		rugby_football: !0,
		ram: !0,
		arrow_up_small: !0,
		black_square_button: !0,
		mobile_phone_off: !0,
		tokyo_tower: !0,
		congratulations: !0,
		kimono: !0,
		ship: !0,
		mag_right: !0,
		mag: !0,
		fire_engine: !0,
		clock1130: !0,
		police_car: !0,
		black_joker: !0,
		bridge_at_night: !0,
		package: !0,
		oncoming_taxi: !0,
		calendar: !0,
		horse_racing: !0,
		tiger2: !0,
		boot: !0,
		ambulance: !0,
		white_square_button: !0,
		boar: !0,
		school_satchel: !0,
		loop: !0,
		pound: !0,
		information_source: !0,
		ox: !0,
		rice_ball: !0,
		vs: !0,
		end: !0,
		parking: !0,
		sandal: !0,
		tent: !0,
		seat: !0,
		taxi: !0,
		black_medium_small_square: !0,
		briefcase: !0,
		newspaper: !0,
		circus_tent: !0,
		six_pointed_star: !0,
		mens: !0,
		european_castle: !0,
		flashlight: !0,
		foggy: !0,
		arrow_double_up: !0,
		bamboo: !0,
		ticket: !0,
		helicopter: !0,
		minidisc: !0,
		oncoming_bus: !0,
		melon: !0,
		white_small_square: !0,
		european_post_office: !0,
		keycap_ten: !0,
		notebook: !0,
		no_bell: !0,
		oden: !0,
		flags: !0,
		carousel_horse: !0,
		blowfish: !0,
		chart_with_upwards_trend: !0,
		sweet_potato: !0,
		ski: !0,
		clock12: !0,
		signal_strength: !0,
		construction: !0,
		black_medium_square: !0,
		satellite: !0,
		euro: !0,
		womans_clothes: !0,
		ledger: !0,
		leopard: !0,
		low_brightness: !0,
		clock3: !0,
		department_store: !0,
		truck: !0,
		sake: !0,
		railway_car: !0,
		speedboat: !0,
		vhs: !0,
		clock1: !0,
		arrow_double_down: !0,
		water_buffalo: !0,
		arrow_down_small: !0,
		yen: !0,
		mute: !0,
		running_shirt_with_sash: !0,
		white_large_square: !0,
		wheelchair: !0,
		clock2: !0,
		paperclip: !0,
		atm: !0,
		cinema: !0,
		telescope: !0,
		rice_scene: !0,
		blue_book: !0,
		white_medium_square: !0,
		postbox: !0,
		"e-mail": !0,
		mouse2: !0,
		bullettrain_side: !0,
		ideograph_advantage: !0,
		nut_and_bolt: !0,
		ng: !0,
		hotel: !0,
		wc: !0,
		izakaya_lantern: !0,
		repeat_one: !0,
		mailbox_with_mail: !0,
		chart_with_downwards_trend: !0,
		green_book: !0,
		tractor: !0,
		fountain: !0,
		metro: !0,
		clipboard: !0,
		no_mobile_phones: !0,
		clock4: !0,
		no_smoking: !0,
		black_large_square: !0,
		slot_machine: !0,
		clock5: !0,
		bathtub: !0,
		scroll: !0,
		station: !0,
		rice_cracker: !0,
		bank: !0,
		wrench: !0,
		u6307: !0,
		articulated_lorry: !0,
		page_facing_up: !0,
		ophiuchus: !0,
		bar_chart: !0,
		no_pedestrians: !0,
		vibration_mode: !0,
		clock10: !0,
		clock9: !0,
		bullettrain_front: !0,
		minibus: !0,
		tram: !0,
		clock8: !0,
		u7a7a: !0,
		traffic_light: !0,
		mountain_bicyclist: !0,
		microscope: !0,
		japanese_castle: !0,
		bookmark: !0,
		bookmark_tabs: !0,
		pouch: !0,
		ab: !0,
		page_with_curl: !0,
		flower_playing_cards: !0,
		clock11: !0,
		fax: !0,
		clock7: !0,
		white_medium_small_square: !0,
		currency_exchange: !0,
		sound: !0,
		chart: !0,
		cl: !0,
		floppy_disk: !0,
		post_office: !0,
		speaker: !0,
		japan: !0,
		u55b6: !0,
		mahjong: !0,
		incoming_envelope: !0,
		orange_book: !0,
		restroom: !0,
		u7121: !0,
		u6709: !0,
		triangular_ruler: !0,
		train: !0,
		u7533: !0,
		trolleybus: !0,
		u6708: !0,
		notebook_with_decorative_cover: !0,
		u7981: !0,
		u6e80: !0,
		postal_horn: !0,
		factory: !0,
		children_crossing: !0,
		train2: !0,
		straight_ruler: !0,
		pager: !0,
		accept: !0,
		u5408: !0,
		lock_with_ink_pen: !0,
		clock130: !0,
		sa: !0,
		outbox_tray: !0,
		twisted_rightwards_arrows: !0,
		mailbox: !0,
		light_rail: !0,
		clock930: !0,
		busstop: !0,
		open_file_folder: !0,
		file_folder: !0,
		potable_water: !0,
		card_index: !0,
		clock230: !0,
		monorail: !0,
		clock1230: !0,
		clock1030: !0,
		abc: !0,
		mailbox_closed: !0,
		clock430: !0,
		mountain_railway: !0,
		do_not_litter: !0,
		clock330: !0,
		heavy_division_sign: !0,
		clock730: !0,
		clock530: !0,
		capital_abcd: !0,
		mailbox_with_no_mail: !0,
		symbols: !0,
		aerial_tramway: !0,
		clock830: !0,
		clock630: !0,
		abcd: !0,
		mountain_cableway: !0,
		koko: !0,
		passport_control: !0,
		"non-potable_water": !0,
		suspension_railway: !0,
		baggage_claim: !0,
		no_bicycles: !0,
		skull_crossbones: !0,
		hugging: !0,
		thinking: !0,
		nerd: !0,
		zipper_mouth: !0,
		rolling_eyes: !0,
		upside_down: !0,
		slight_smile: !0,
		middle_finger: !0,
		writing_hand: !0,
		dark_sunglasses: !0,
		eye: !0,
		man_in_suit: !0,
		golfer: !0,
		heart_exclamation: !0,
		star_of_david: !0,
		cross: !0,
		"fleur-de-lis": !0,
		atom: !0,
		wheel_of_dharma: !0,
		yin_yang: !0,
		peace: !0,
		star_and_crescent: !0,
		orthodox_cross: !0,
		biohazard: !0,
		radioactive: !0,
		place_of_worship: !0,
		anger_right: !0,
		menorah: !0,
		om_symbol: !0,
		coffin: !0,
		gear: !0,
		alembic: !0,
		scales: !0,
		crossed_swords: !0,
		keyboard: !0,
		shield: !0,
		bed: !0,
		shopping_bags: !0,
		sleeping_accommodation: !0,
		ballot_box: !0,
		compression: !0,
		wastebasket: !0,
		file_cabinet: !0,
		trackball: !0,
		printer: !0,
		joystick: !0,
		hole: !0,
		candle: !0,
		prayer_beads: !0,
		camera_with_flash: !0,
		amphora: !0,
		label: !0,
		flag_black: !0,
		flag_white: !0,
		film_frames: !0,
		control_knobs: !0,
		level_slider: !0,
		thermometer: !0,
		airplane_arriving: !0,
		airplane_departure: !0,
		railway_track: !0,
		motorway: !0,
		synagogue: !0,
		mosque: !0,
		kaaba: !0,
		stadium: !0,
		desert: !0,
		classical_building: !0,
		cityscape: !0,
		camping: !0,
		bow_and_arrow: !0,
		rosette: !0,
		volleyball: !0,
		medal: !0,
		reminder_ribbon: !0,
		popcorn: !0,
		champagne: !0,
		hot_pepper: !0,
		burrito: !0,
		taco: !0,
		hotdog: !0,
		shamrock: !0,
		comet: !0,
		turkey: !0,
		scorpion: !0,
		lion_face: !0,
		crab: !0,
		spider_web: !0,
		spider: !0,
		chipmunk: !0,
		wind_blowing_face: !0,
		fog: !0,
		play_pause: !0,
		track_previous: !0,
		track_next: !0,
		beach_umbrella: !0,
		chains: !0,
		pick: !0,
		stopwatch: !0,
		ferry: !0,
		mountain: !0,
		shinto_shrine: !0,
		ice_skate: !0,
		skier: !0,
		flag_ac: !0,
		flag_ad: !0,
		flag_ae: !0,
		flag_af: !0,
		flag_ag: !0,
		flag_ai: !0,
		flag_al: !0,
		flag_am: !0,
		"flag-ao": !0,
		"flag-aq": !0,
		"flag-ar": !0,
		"flag-as": !0,
		"flag-at": !0,
		"flag-au": !0,
		"flag-aw": !0,
		"flag-ax": !0,
		"flag-az": !0,
		"flag-ba": !0,
		"flag-bb": !0,
		"flag-bd": !0,
		"flag-be": !0,
		"flag-bf": !0,
		"flag-bg": !0,
		"flag-bh": !0,
		"flag-bi": !0,
		"flag-bj": !0,
		"flag-bl": !0,
		"flag-bm": !0,
		"flag-bn": !0,
		"flag-bo": !0,
		"flag-bq": !0,
		"flag-br": !0,
		"flag-bs": !0,
		"flag-bt": !0,
		"flag-bv": !0,
		"flag-bw": !0,
		"flag-by": !0,
		"flag-bz": !0,
		"flag-ca": !0,
		"flag-cc": !0,
		"flag-cd": !0,
		"flag-cf": !0,
		"flag-cg": !0,
		"flag-ch": !0,
		"flag-ci": !0,
		"flag-ck": !0,
		"flag-cl": !0,
		"flag-cm": !0,
		"flag-cn": !0,
		"flag-co": !0,
		"flag-cp": !0,
		"flag-cr": !0,
		"flag-cu": !0,
		"flag-cv": !0,
		"flag-cw": !0,
		"flag-cx": !0,
		"flag-cy": !0,
		"flag-cz": !0,
		"flag-de": !0,
		"flag-dg": !0,
		"flag-dj": !0,
		"flag-dk": !0,
		"flag-dm": !0,
		"flag-do": !0,
		"flag-dz": !0,
		"flag-ea": !0,
		"flag-ec": !0,
		"flag-ee": !0,
		"flag-eg": !0,
		"flag-eh": !0,
		"flag-er": !0,
		"flag-es": !0,
		"flag-et": !0,
		"flag-eu": !0,
		"flag-fi": !0,
		"flag-fj": !0,
		"flag-fk": !0,
		"flag-fm": !0,
		"flag-fo": !0,
		"flag-fr": !0,
		"flag-ga": !0,
		"flag-gb": !0,
		"flag-gd": !0,
		"flag-ge": !0,
		"flag-gf": !0,
		"flag-gg": !0,
		"flag-gh": !0,
		"flag-gi": !0,
		"flag-gl": !0,
		"flag-gm": !0,
		"flag-gn": !0,
		"flag-gp": !0,
		"flag-gq": !0,
		"flag-gr": !0,
		"flag-gs": !0,
		"flag-gt": !0,
		"flag-gu": !0,
		"flag-gw": !0,
		"flag-gy": !0,
		"flag-hk": !0,
		"flag-hm": !0,
		"flag-hn": !0,
		"flag-hr": !0,
		"flag-ht": !0,
		"flag-hu": !0,
		"flag-ic": !0,
		"flag-id": !0,
		"flag-ie": !0,
		"flag-il": !0,
		"flag-im": !0,
		"flag-in": !0,
		"flag-io": !0,
		"flag-iq": !0,
		"flag-ir": !0,
		"flag-is": !0,
		"flag-it": !0,
		"flag-je": !0,
		"flag-jm": !0,
		"flag-jo": !0,
		"flag-jp": !0,
		"flag-ke": !0,
		"flag-kg": !0,
		"flag-kh": !0,
		"flag-ki": !0,
		"flag-km": !0,
		"flag-kn": !0,
		"flag-kp": !0,
		"flag-kr": !0,
		"flag-kw": !0,
		"flag-ky": !0,
		"flag-kz": !0,
		"flag-la": !0,
		"flag-lb": !0,
		"flag-lc": !0,
		"flag-li": !0,
		"flag-lk": !0,
		"flag-lr": !0,
		"flag-ls": !0,
		"flag-lt": !0,
		"flag-lu": !0,
		"flag-lv": !0,
		"flag-ly": !0,
		"flag-ma": !0,
		"flag-mc": !0,
		"flag-md": !0,
		"flag-me": !0,
		"flag-mf": !0,
		"flag-mg": !0,
		"flag-mh": !0,
		"flag-mk": !0,
		"flag-ml": !0,
		"flag-mm": !0,
		"flag-mn": !0,
		"flag-mo": !0,
		"flag-mp": !0,
		"flag-mq": !0,
		"flag-mr": !0,
		"flag-ms": !0,
		"flag-mt": !0,
		"flag-mu": !0,
		"flag-mv": !0,
		"flag-mw": !0,
		"flag-mx": !0,
		"flag-my": !0,
		"flag-mz": !0,
		"flag-na": !0,
		"flag-nc": !0,
		"flag-ne": !0,
		"flag-nf": !0,
		"flag-ng": !0,
		"flag-ni": !0,
		"flag-nl": !0,
		"flag-no": !0,
		"flag-np": !0,
		"flag-nr": !0,
		"flag-nu": !0,
		"flag-nz": !0,
		"flag-om": !0,
		"flag-pa": !0,
		"flag-pe": !0,
		"flag-pf": !0,
		"flag-pg": !0,
		"flag-ph": !0,
		"flag-pk": !0,
		"flag-pl": !0,
		"flag-pm": !0,
		"flag-pn": !0,
		"flag-pr": !0,
		"flag-ps": !0,
		"flag-pt": !0,
		"flag-pw": !0,
		"flag-py": !0,
		"flag-qa": !0,
		"flag-re": !0,
		"flag-ro": !0,
		"flag-rs": !0,
		"flag-ru": !0,
		"flag-rw": !0,
		"flag-sa": !0,
		"flag-sb": !0,
		"flag-sc": !0,
		"flag-sd": !0,
		"flag-se": !0,
		"flag-sg": !0,
		"flag-sh": !0,
		"flag-si": !0,
		"flag-sj": !0,
		"flag-sk": !0,
		"flag-sl": !0,
		"flag-sm": !0,
		"flag-sn": !0,
		"flag-so": !0,
		"flag-sr": !0,
		"flag-ss": !0,
		"flag-st": !0,
		"flag-sv": !0,
		"flag-sx": !0,
		"flag-sy": !0,
		"flag-sz": !0,
		"flag-ta": !0,
		"flag-tc": !0,
		"flag-td": !0,
		"flag-tf": !0,
		"flag-tg": !0,
		"flag-th": !0,
		"flag-tj": !0,
		"flag-tk": !0,
		"flag-tl": !0,
		"flag-tm": !0,
		"flag-tn": !0,
		"flag-to": !0,
		"flag-tr": !0,
		"flag-tt": !0,
		"flag-tv": !0,
		"flag-tw": !0,
		"flag-tz": !0,
		"flag-ua": !0,
		"flag-ug": !0,
		"flag-um": !0,
		"flag-us": !0,
		"flag-uy": !0,
		"flag-uz": !0,
		"flag-va": !0,
		"flag-vc": !0,
		"flag-ve": !0,
		"flag-vg": !0,
		"flag-vi": !0,
		"flag-vn": !0,
		flag_vu: !0,
		flag_wf: !0,
		flag_ws: !0,
		flag_xk: !0,
		flag_ye: !0,
		flag_yt: !0,
		flag_za: !0,
		flag_zm: !0,
		flag_zw: !0,
		black_heart: !0,
		speech_left: !0,
		egg: !0,
		octagonal_sign: !0,
		spades: !0,
		hearts: !0,
		diamonds: !0,
		clubs: !0,
		drum: !0,
		left_right_arrow: !0,
		tm: !0,
		"100": !0
	};

	addConfigOptions(
		"interface", {
			_name: "Interface",
			emoji: {
				name: "Add Emoji Replacement to Chat",
				default: true,
				_type: "boolean"
			}
		}
	);

	d20plus.enhanceChat = () => {
		d20plus.log("Enhancing chat");
		const tc = d20.textchat.$textarea;
		$("#textchat-input").off("click", "button")
		$("#textchat-input").on("click", "button", function () {
			if (!window.is_gm || d20plus.getCfgVal("interface", "emoji")) {
				tc.val(tc.val().replace(/(:\w*?:)/g, (m0, m1) => {
					const clean = m1.replace(/:/g, "");
					return d20plus.chat.emojiIndex && d20plus.chat.emojiIndex[clean] ? `[${clean}](https://github.com/TheGiddyLimit/emoji-dump/raw/master/out/${clean}.png)` : m1;
				}));
			}
			const toSend = $.trim(tc.val());
			d20.textchat.doChatInput(toSend);
			tc.val("").focus();
		});
	};
};

SCRIPT_EXTENSIONS.push(betteR20Emoji);

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
			"halfGridSnap": {
				"name": "Snap to Half-Grid",
				"default": false,
				"_type": "boolean"
			},
			"scaleNamesStatuses": {
				"name": "Scaled Names and Status Icons",
				"default": true,
				"_type": "boolean"
			}
		}
	);

	const d20plus = {
		// EXTERNAL SCRIPTS ////////////////////////////////////////////////////////////////////////////////////////////
		scriptsLoaded: false,
		scripts: [
			{name: "listjs", url: "https://raw.githubusercontent.com/javve/list.js/v1.5.0/dist/list.min.js"}
		],

		addScripts: (onLoadFunction) => {
			d20plus.log("Add JS");
			const onEachLoadFunction = function (name, url, js) {
				try {
					window.eval(js);
					d20plus.log(`JS [${name}] Loaded`);
				} catch (e) {
					d20plus.log(`Error loading ${name}`);
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

		// UTILITIES ///////////////////////////////////////////////////////////////////////////////////////////////////
		log: (arg) => {
			console.log("%cD20Plus > ", "color: #3076b9; font-size: large", arg);
		},

		ascSort: (a, b) => {
			if (b === a) return 0;
			return b < a ? 1 : -1;
		},

		chatTag: (message) => {
			d20.textchat.incoming(false, ({
				who: "system",
				type: "system",
				content: `<span style="margin-left: -45px; margin-right: -5px; margin-bottom: -7px; display: inline-block; font-weight: bold; font-family: 'Lucida Console', Monaco, monospace; color: #20C20E; background: black; padding: 3px;">
					${message}
					<br>
					<br>
					Need help? Join our <a style="color: white;" href="https://discord.gg/Zk34CUZ">Discord</a>.
					<br>
					<br>
					<span title="You'd think this would be obvious.">Please DO NOT post about this script or any related content in official channels, such as the Roll20 forums.</span>
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
				outCpy[sectK] = outCpy[sectK] || {};
				$.each(sect, (k, data) => {
					if (!k.startsWith("_")) {
						outCpy[sectK][k] = data.default;
					}
				});
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

				const sortedKeys = Object.keys(CONFIG_OPTIONS).sort((a, b) => d20plus.ascSort(CONFIG_OPTIONS[a]._name, CONFIG_OPTIONS[b]._name));
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

						const gmnotes = JSON.stringify(d20plus.config).replace(/%/g, "%25");
						handout.updateBlobs({gmnotes: gmnotes});
						handout.save({notes: (new Date).getTime()});

						d20plus.log("Saved config");

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
				if (d20plus.handleConfigChange) d20plus.handleConfigChange();
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
					<div id="table-list">
						<input type="search" class="search" placeholder="Search tables...">
						<div class="list" style="transform: translateZ(0); max-height: 490px; overflow-y: scroll; overflow-x: hidden;"><i>Loading...</i></div>
					</div>
				<br>
				<button class="btn start-import">Import</button>
				</div>
				`,
				dialogFn: () => {
					$("#d20plus-tables").dialog({
						autoOpen: false,
						resizable: true,
						width: 800,
						height: 650,
					});
				},
				openFn: () => {
					const $win = $("#d20plus-tables");
					$win.dialog("open");

					const $btnImport = $win.find(`.start-import`).off("click");

					const url = `${BASE_SITE_URL}/data/roll20-tables.json`;
					DataUtil.loadJSON(url, (data) => {
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

							sel.forEach(t => {
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
								}))
							})
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
					$("#drawingtools").removeClass("text path polygon").addClass("rect")),
				"text" == e && ($("#drawingtools").addClass("activebutton"),
					$("#drawingtools").removeClass("rect path polygon").addClass("text")),
				"path" == e && $("#drawingtools").addClass("activebutton").removeClass("text rect polygon").addClass("path"),
					"polygon" == e ? $("#drawingtools").addClass("activebutton").removeClass("text rect path").addClass("polygon") : d20.engine.finishCurrentPolygon(),
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
				if ("text" == e || "path" == e || "rect" == e || "polygon" == e || "fxtools" == e) {
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

		enhanceMeasureTool: () => {
			d20plus.log("Enhance Measure tool");
			// ROLL20 CODE
			var T = function (e, t, n, i, r, o) {
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
				e.beginPath();
				var u = 15
					, d = Math.atan2(t.to_y - t.y, t.to_x - t.x);
				return e.moveTo(t.x, t.y),
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
					a
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
										e.model.save({
											currentSide: i,
											imgsrc: unescape(t[i])
										}),
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
											d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
												l.model.save({
													currentSide: p,
													imgsrc: unescape(h.sidesarray[p])
												}),
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
							}
							// END MOD
							return !1
						}
					}),
					!1
			};
			// END ROLL20 CODE
			d20.token_editor.showContextMenu = r;
			d20.token_editor.closeContextMenu = i;
			$(`#editor-wrapper`).on("click", d20.token_editor.closeContextMenu);
		},

		enhanceSnap: () => {
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
			const M = function(e) {
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

		_getHoverGmNoteStr: (str) => {
			const $initial = $(`<div>${str}</div>`);

			let stack = "";
			function recurse ($ele, depth, listDepth, inTable, inTd) {
				const nodes = $ele.contents().get();

				nodes.forEach(n => {
					if (n.nodeType === 3) { // text node
						const pre = listDepth ? ` ${"-".repeat(listDepth)}` : "";
						const doLineEnd = !inTd;
						stack += `${pre}${n.data}${doLineEnd ? "\n" : ""}`;
					} else {
						const $n = $(n);

						if ($n.is("br")) {
							stack += "\n";
							return;
						}

						let nxtInTable = inTable;
						if ($n.is("table")) {
							nxtInTable = true;
						}

						if ($n.is("tr")) {
							stack += "----------\n"
						}

						let nxtInTd = inTd;
						if ($n.is("td")) {
							stack += "|";
							nxtInTd = true;
						}

						let nxtListDepth = listDepth;
						if ($n.is("ul") || $n.is("li")) {
							nxtListDepth = listDepth ? listDepth + 1 : 1;
						}

						recurse($(n), depth + 1, nxtListDepth, nxtInTable, nxtInTd);

						// end TRs with a newline
						if ($n.is("tr")) {
							stack += "\n";
						}
					}
				})

			}

			recurse($initial, 0, 0, false, false);

			return stack;
		},
		_tokenHover: null,
		_drawTokenHover: () => {
			if (!d20plus._tokenHover || !d20plus._tokenHover.text) return;

			const pt = d20plus._tokenHover.pt;
			let txt;
			try {
				txt = d20plus._getHoverGmNoteStr(unescape(d20plus._tokenHover.text));
			} catch (e) {
				txt = "[Error - could not read GM notes - try re-save]"
			}

			function wrapText (context, text, x, y, maxWidth, lineHeight, doDraw) {
				const words = text.replace(/\n/g, " \n ").split(/[ ]+/);
				let line = '';

				for(let n = 0; n < words.length; n++) {
					if (words[n] === "\n") {
						if (doDraw) context.fillText(line.trim(), x, y);
						line = '';
						y += lineHeight;
					}
					const testLine = line + words[n] + ' ';
					const metrics = context.measureText(testLine);
					const testWidth = metrics.width;
					if (testWidth > maxWidth && n > 0) {
						if (doDraw) context.fillText(line.trim(), x, y);
						line = words[n] + ' ';
						y += lineHeight;
					}
					else {
						line = testLine;
					}
				}
				if (doDraw) context.fillText(line.trim(), x, y);
				return y;
			}

			const ctx = d20.engine.canvas.contextTop || d20.engine.canvas.contextContainer;

			const scaleFact = (1 / d20.engine.canvasZoom);
			const xOffset = pt.x > (d20.engine.canvasWidth / 2) ? -300 * scaleFact : 0;
			const fontSize = scaleFact * 12;
			const lineHeight = scaleFact * 18;
			ctx.font = fontSize + "pt Arial Black";

			const finalY = wrapText(ctx, txt, pt.x + xOffset, pt.y, 300 * scaleFact, lineHeight, false);

			ctx.fillStyle = "rgba(255,255,255,0.75)";
			ctx.beginPath();
			ctx.rect(pt.x - (10 * scaleFact) + xOffset, pt.y - lineHeight, 320 * scaleFact, (finalY - pt.y) + (lineHeight + fontSize));
			ctx.closePath();
			ctx.fill();

			ctx.fillStyle = "rgba(0,0,0,1)";
			wrapText(ctx, txt, pt.x + xOffset, pt.y, 300 * scaleFact, lineHeight, true);
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
				if (data.target && data.target.model && data.e.shiftKey) {
					d20.engine.renderTop();
					const gmNotes = data.target.model.get("gmnotes");
					const pt = d20.engine.canvas.getPointer(data.e);
					pt.x -= d20.engine.currentCanvasOffset[0];
					pt.y -= d20.engine.currentCanvasOffset[1];
					d20plus._tokenHover = {
						pt: pt,
						text: gmNotes
					}
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
				s: "temp-warning",
				r: "position: fixed; top: 12px; left: calc(50vw - 200px); z-index: 10000; width: 320px; background: transparent; color: red; font-weight: bold; font-size: 150%; font-variant: small-caps; border: 1px solid red; padding: 4px; text-align: center; border-radius: 4px;"
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
			if (window.is_gm) {
				$(`#imagedialog`).find(`.searchbox`).find(`.tabcontainer`).first().after(d20plus.artTabHtml);
				$(`a#button-add-external-art`).on(window.mousedowntype, d20plus.art.button);

				$body.append(d20plus.configEditorHTML);
				$body.append(d20plus.addArtHTML);
				$body.append(d20plus.addArtMassAdderHTML);
				$body.append(d20plus.toolsListHtml);
				const $cfgEditor = $("#d20plus-configeditor");
				$cfgEditor.dialog({
					autoOpen: false,
					resizable: true,
					width: 800,
					height: 650,
				});
				$cfgEditor.parent().append(d20plus.configEditorButtonBarHTML);
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
			<a class="btn player-hidden" href="#" id="button-edit-config" style="margin-top: 3px;">Edit Config</a>
			</p>
			<p>
			For help, advice, and updates, <a href="https://discord.gg/Zk34CUZ" target="_blank" style="color: #08c;">join our Discord!</a>
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