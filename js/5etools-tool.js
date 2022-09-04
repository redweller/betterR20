function tools5eTool () {
	// Add the array of tools that are 5e only to the tools array
	d20plus.tool.tools = d20plus.tool.tools.concat([
		{
			toolId: "JSON",
			name: "JSON Importer",
			desc: "Import 5etools JSON files from url or file upload",
			html: `
					<div id="d20plus-json-importer" title="Better20 - JSON Importer">
					<p style="margin-bottom: 4px;">
						<b style="font-size: 110%;">Importer:</b>
						<button class="btn readme" style="float: right;">Help/README</button>
						<div style="clear: both;"></div>
					</p>
					<div style="border-bottom: 1px solid #ccc; margin-bottom: 3px; padding-bottom: 3px;">
						<input type="text" id="import-json-url">
						<p><a class="btn" href="#" id="button-json-load-url">Load From URL</a></p>
						<p><a class="btn" href="#" id="button-json-load-file">Load From File</a></p>
					</div>
					<div>
						<div name="data-loading-message"></div>
						<select name="data-type" disabled style="margin-bottom: 0;">
						<!-- populate with JS-->
						</select>
						<button class="btn" name="view-select-entries">View/Select Entries</button>
						<br>
						<button class="btn" name="select-all-entries">Select Everything</button>
						<div name="selection-summary" style="margin-top: 5px;"></div>
					</div>
					<hr>
					<p><button class="btn" style="float: right;" name="import">Import Selected</button></p>
					</div>
	
					<div id="d20plus-json-importer-list" title="Select Entries">
						<div id="module-importer-list">
							<input type="search" class="search" placeholder="Search..." disabled>
							<div class="list" style="transform: translateZ(0); max-height: 650px; overflow-y: auto; overflow-x: hidden; margin-bottom: 10px;">
							<i>Load a file to view the contents here</i>
							</div>
						</div>
						<div>
							<label class="ib"><input type="checkbox" class="select-all"> Select All</label>
							<button class="btn" style="float: right;" name="confirm-selection">Confirm Selection</button>
						</div>
					</div>
	
					<div id="d20plus-json-importer-progress" title="Import Progress">
						<h3 class="name"></h3>
						<span class="remaining"></span>
						<p>Errors: <span class="errors">0</span> <span class="error-names"></span></p>
						<p><button class="btn cancel">Cancel</button></p>
					</div>
	
					<div id="d20plus-json-importer-help" title="Readme">
						<p>First, either load a module from 5etools, or upload one from a file. Then, choose the category you wish to import, and "View/Select Entries." Once you've selected everything you wish to import from the module, hit "Import Selected." This ensures entries are imported in the correct order.</p>
						<p><b>Note:</b> The script-wide configurable "rest time" options affect how quickly each category of entries is imported (tables and decks use the "Handout" rest time).</p>
						<p><b>Note:</b> Configuration options (aside from "rest time" as detailed above) <i>do not</i> affect the module importer. It effectively "clones" the content as-exported from the original module, including any whisper/advantage/etc settings.</p>
					</div>
					`,
			dialogFn: () => {
				$("#d20plus-json-importer").dialog({
					autoOpen: false,
					resizable: true,
					width: 750,
					height: 360,
				});
				$(`#d20plus-json-importer-progress`).dialog({
					autoOpen: false,
					resizable: false,
				});
				$("#d20plus-json-importer-help").dialog({
					autoOpen: false,
					resizable: true,
					width: 600,
					height: 400,
				});
				$("#d20plus-json-importer-list").dialog({
					autoOpen: false,
					resizable: true,
					width: 600,
					height: 800,
				});
			},
			openFn: () => {
				// The types of things that can be imported with this tool
				const IMPORT_NAMES = {
					"adventure": "Adventures",
					"background": "Backgrounds",
					"class": "Classes",
					"deity": "Deities",
					"feat": "Feats",
					"item": "Items",
					"monster": "Monsters",
					"object": "Objects",
					"optionalfeature": "Optional Features (Invocations, etc.)",
					"psionic": "Psionics",
					"race": "Races",
					"spell": "Spells",
					"subclass": "Subclasses",
					"vehicle": "Vehicles",
				};

				const $win = $("#d20plus-json-importer");
				$win.dialog("open");

				const $winProgress = $(`#d20plus-json-importer-progress`);
				const $btnCancel = $winProgress.find(".cancel").off("click");

				const $win5etools = $(`#d20plus-json-importer-5etools`);

				const $winHelp = $(`#d20plus-json-importer-help`);
				const $btnHelp = $win.find(`.readme`).off("click").click(() => $winHelp.dialog("open"));

				const $winList = $(`#d20plus-json-importer-list`);
				const $wrpLst = $(`#module-json-list`);
				const $lst = $winList.find(`.list`).empty();
				const $cbAll = $winList.find(`.select-all`).off("click").prop("disabled", true);
				const $iptSearch = $winList.find(`.search`).prop("disabled", true);
				const $btnConfirmSel = $winList.find(`[name="confirm-selection"]`).off("click");

				const $wrpSummary = $win.find(`[name="selection-summary"]`);
				const $wrpDataLoadingMessage = $win.find(`[name="data-loading-message"]`);

				const $btnImport = $win.find(`[name="import"]`).off("click").prop("disabled", true);
				const $btnViewCat = $win.find(`[name="view-select-entries"]`).off("click").click(handleLoadedData).prop("disabled", true);
				const $btnSelAllContent = $win.find(`[name="select-all-entries"]`).off("click").prop("disabled", true);

				const $selDataType = $win.find(`[name="data-type"]`).prop("disabled", true);
				let genericFolder;
				let lastLoadedData = null;

				async function handleLoadedData () {
					const lastDataType = $selDataType.val();
					let optionsContainer = null;
					let overrideData = null;
					let extraOptions = {};

					switch (lastDataType) {
						case "adventure":
							optionsContainer = d20plus.adventures;
							break;
						case "background":
							optionsContainer = d20plus.backgrounds;
							break;
						case "class":
							optionsContainer = d20plus.classes;
							overrideData = (await d20plus.classes.getDataForImport(lastLoadedData)).class;
							extraOptions["builderOptions"] = {
								isHomebrew: true,
							}
							break;
						case "deity":
							optionsContainer = d20plus.deities;
							break;
						case "feat":
							optionsContainer = d20plus.feats;
							break;
						case "item":
							optionsContainer = d20plus.items;
							break;
						case "monster":
							optionsContainer = d20plus.monsters;
							break;
						case "object":
							optionsContainer = d20plus.objects;
							break;
						case "optionalfeature":
							optionsContainer = d20plus.optionalfeatures;
							break;
						case "psionic":
							optionsContainer = d20plus.psionics;
							break;
						case "race":
							optionsContainer = d20plus.races;
							break;
						case "spell":
							optionsContainer = d20plus.spells;
							break;
						case "subclass":
							optionsContainer = d20plus.subclasses;
							overrideData = await d20plus.subclasses.getDataForImport(lastLoadedData);
							break;
						case "vehicle":
							optionsContainer = d20plus.vehicles;
							break;
						default:
							throw new Error(`Unhandled data type: ${lastDataType}`);
					}

					const handoutBuilder = optionsContainer["handoutBuilder"];
					d20plus.importer.showImportList(
						lastDataType,
						overrideData || lastLoadedData[lastDataType],
						handoutBuilder,
						{
							groupOptions: optionsContainer._groupOptions,
							listItemBuilder: optionsContainer._listItemBuilder,
							listIndex: optionsContainer._listCols,
							listIndexConverter: optionsContainer._listIndexConverter,
							...extraOptions,
						},
					);
				}

				function populateDropdown (cats) {
					$selDataType.empty();
					cats.forEach(c => {
						$selDataType.append(`<option value="${c}">${IMPORT_NAMES[c]}</option>`)
					});

					// Disable buttons if there are no valid catagories to import
					const disable = !cats.length;
					$btnViewCat.prop("disabled", disable);
					$btnSelAllContent.prop("disabled", disable);
					$selDataType.prop("disabled", disable);
				}

				// Load from url
				const $btnLoadUrl = $(`#button-json-load-url`);
				$btnLoadUrl.off("click").click(async () => {
					const url = $("#import-json-url").val();
					if (url && url.trim()) {
						DataUtil.loadJSON(url).then(data => {
							const cats = Object.keys(IMPORT_NAMES).filter(i => i in data);
							populateDropdown(cats);
							lastLoadedData = data;
						});
					}
				});

				// Load from file
				const $btnLoadFile = $(`#button-json-load-file`);
				$btnLoadFile.off("click").click(async () => {
					const allFiles = await DataUtil.pUserUpload();
					// Due to the new util functon, need to account for data being an array
					const data = allFiles.jsons.find(Boolean);
					const cats = Object.keys(IMPORT_NAMES).filter(i => i in data);
					populateDropdown(cats);
					lastLoadedData = data;
				});
			},
		},
		{
			name: "Shapeshifter Token Builder",
			desc: "Build a rollable table and related token to represent a shapeshifting creature.",
			html: `
				<div id="d20plus-shapeshiftbuild" title="Better20 - Shapeshifter Token Builder">
					<div id="shapeshiftbuild-list">
						<input type="search" class="search" placeholder="Search creatures...">
						<input type="search" class="filter" placeholder="Filter...">
						<span title="Filter format example: 'cr:1/4; cr:1/2; type:beast; source:MM'" style="cursor: help;">[?]</span>
						<div class="list" style="transform: translateZ(0); max-height: 490px; overflow-y: auto; overflow-x: hidden;"><i>Loading...</i></div>
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
			openFn: async () => {
				const $win = $("#d20plus-shapeshiftbuild");
				$win.dialog("open");

				const toLoad = Object.keys(monsterDataUrls).map(src => d20plus.monsters.formMonsterUrl(monsterDataUrls[src]));

				const $fltr = $win.find(`.filter`);
				$fltr.off("keydown").off("keyup");
				$win.find(`button`).off("click");

				const $lst = $win.find(`.list`);
				let tokenList;

				const dataStack = (await Promise.all(toLoad.map(url => DataUtil.loadJSON(url)))).flat();

				$lst.empty();
				let toShow = [];

				const seen = {};
				await Promise.all(dataStack.map(async d => {
					const toAdd = d.monster.filter(m => {
						const out = !(seen[m.source] && seen[m.source].has(m.name));
						if (!seen[m.source]) seen[m.source] = new Set();
						seen[m.source].add(m.name);
						return out;
					});

					toShow = toShow.concat(toAdd);
				}));

				toShow = toShow.sort((a, b) => SortUtil.ascSort(a.name, b.name));

				let tmp = "";
				toShow.forEach((m, i) => {
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
					valueNames: ["name", "type", "cr", "source"],
				});

				d20plus.importer.addListFilter($fltr, toShow, tokenList, d20plus.monsters._listIndexConverter);

				$win.find(`button`).on("click", () => {
					function getSizeInTiles (size) {
						switch (size) {
							case SZ_TINY:
								return 0.5;
							case SZ_SMALL:
							case SZ_MEDIUM:
								return 1;
							case SZ_LARGE:
								return 2;
							case SZ_HUGE:
								return 3;
							case SZ_GARGANTUAN:
								return 4;
							case SZ_COLOSSAL:
								return 5;
						}
					}

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
							// encode size info into the URL, which will get baked into the token
							const avatar = m.tokenUrl || `${IMG_URL}${Parser.sourceJsonToAbv(m.source)}/${m.name.replace(/"/g, "")}.png?roll20_token_size=${getSizeInTiles(m.size)}`;
							item.set("avatar", avatar);
							item.set("token_size", getSizeInTiles(m.size));
							item.save();
						});
						table.save();
						d20.rollabletables.refreshTablesList();
						alert("Created table!")
					}
				});
			},
		},
		{
			name: "Wild Shape Builder",
			desc: "Build a character sheet to represent a character in Wild Shape.",
			html: `
				<div id="d20plus-wildformbuild" title="Better20 - Wild Shape Character Builder">
					<div id="wildformbuild-list">
						<input type="search" class="search" placeholder="Search creatures...">
						<input type="search" class="filter" placeholder="Filter...">
						<span title="Filter format example: 'cr:1/4; cr:1/2; type:beast; source:MM'" style="cursor: help;">[?]</span>
						<div class="list" style="transform: translateZ(0); max-height: 490px; overflow-y: auto; overflow-x: hidden;"><i>Loading...</i></div>
					</div>
				<br>
				<select id="wildform-character">
					<option value="" disabled selected>Select Character</option>
				</select>
				<button class="btn">Create Character Sheets</button>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-wildformbuild").dialog({
					autoOpen: false,
					resizable: true,
					width: 800,
					height: 650,
				});
			},
			openFn: async () => {
				const $win = $("#d20plus-wildformbuild");
				$win.dialog("open");

				const $selChar = $(`#wildform-character`);
				$selChar.empty();
				$selChar.append(`<option value="" disabled>Select Character</option>`);
				const allChars = d20.Campaign.characters.toJSON().map(it => {
					const out = {id: it.id, name: it.name || ""};
					const npc = d20.Campaign.characters.get(it.id).attribs.toJSON().find(it => it.name === "npc");
					out.npc = !!(npc && npc.current && Number(npc.current));
					return out;
				});
				let hasNpc = false;
				allChars.sort((a, b) => a.npc - b.npc || SortUtil.ascSort(a.name.toLowerCase(), b.name.toLowerCase()))
					.forEach(it => {
						if (it.npc && !hasNpc) {
							$selChar.append(`<option value="" disabled>--NPCs--</option>`);
							hasNpc = true;
						}
						$selChar.append(`<option value="${it.id}">${it.name}</option>`)
					});

				const $fltr = $win.find(`.filter`);
				$fltr.off("keydown").off("keyup");
				$win.find(`button`).off("click");

				const $lst = $win.find(`.list`);

				let tokenList;

				const toLoad = Object.keys(monsterDataUrls).map(src => d20plus.monsters.formMonsterUrl(monsterDataUrls[src]));

				const dataStack = (await Promise.all(toLoad.map(async url => DataUtil.loadJSON(url)))).flat();

				$lst.empty();
				let toShow = [];

				const seen = {};
				await Promise.all(dataStack.map(async d => {
					const toAdd = d.monster.filter(m => {
						const out = !(seen[m.source] && seen[m.source].has(m.name));
						if (!seen[m.source]) seen[m.source] = new Set();
						seen[m.source].add(m.name);
						return out;
					});

					toShow = toShow.concat(toAdd);
				}));

				toShow = toShow.sort((a, b) => SortUtil.ascSort(a.name, b.name));

				let tmp = "";
				toShow.forEach((m, i) => {
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

				tokenList = new List("wildformbuild-list", {
					valueNames: ["name", "type", "cr", "source"],
				});

				d20plus.importer.addListFilter($fltr, toShow, tokenList, d20plus.monsters._listIndexConverter);

				$win.find(`button`).on("click", () => {
					const allSel = tokenList.items
						.filter(it => $(it.elm).find(`input`).prop("checked"))
						.map(it => toShow[$(it.elm).attr("data-listid")]);

					const character = $selChar.val();
					if (!character) return alert("No character selected!");

					const d20Character = d20.Campaign.characters.get(character);
					if (!d20Character) return alert("Failed to get character data!");

					const getAttrib = (name) => d20Character.attribs.toJSON().find(x => x.name === name);

					allSel.filter(it => it).forEach(sel => {
						sel = $.extend(true, {}, sel);

						sel.wis = (d20Character.attribs.toJSON().find(x => x.name === "wisdom") || {}).current || 10;
						sel.int = (d20Character.attribs.toJSON().find(x => x.name === "intelligence") || {}).current || 10;
						sel.cha = (d20Character.attribs.toJSON().find(x => x.name === "charisma") || {}).current || 10;

						const attribsSkills = {
							acrobatics_bonus: "acrobatics",
							animal_handling_bonus: "animal_handling",
							arcana_bonus: "arcana",
							athletics_bonus: "athletics",
							deception_bonus: "deception",
							history_bonus: "history",
							insight_bonus: "insight",
							intimidation_bonus: "intimidation",
							investigation_bonus: "investigation",
							medicine_bonus: "medicine",
							nature_bonus: "nature",
							perception_bonus: "perception",
							performance_bonus: "performance",
							persuasion_bonus: "persuasion",
							religion_bonus: "religion",
							slight_of_hand_bonus: "slight_of_hand",
							stealth_bonus: "stealth",
						};
						const attribsSaves = {
							npc_int_save: "int",
							npc_wis_save: "wis",
							npc_cha_save: "cha",
						};
						sel.skill = sel.skill || {};
						sel.save = sel.save || {};

						for (const a in attribsSkills) {
							const characterValue = getAttrib(a);
							if (characterValue) {
								sel.skill[attribsSkills[a]] = Math.max(sel.skill[attribsSkills[a]] || 0, characterValue.current);
							}
						}

						for (const a in attribsSaves) {
							const characterValue = getAttrib(a);
							if (characterValue) {
								sel.save[attribsSkills[a]] = Math.max(sel.save[attribsSkills[a]] || 0, characterValue.current);
							}
						}

						(() => {
							const attr = d20plus.sheet === "ogl" ? "passive_wisdom" : d20plus.sheet === "shaped" ? "perception" : "";
							if (!attr) return;
							const charAttr = getAttrib(attr);
							if (!charAttr) return;
							const passivePer = Number(charAttr.current || 0) + (d20plus.sheet === "shaped" ? 10 : 0);
							sel.passive = Math.max(passivePer, sel.passive);
						})();

						const doBuild = (result) => {
							const options = {
								charFunction: (character) => {
									character._getLatestBlob("defaulttoken", y => {
										if (y) {
											const token = JSON.parse(y);
											token.name = `${sel.name} (${d20Character.attributes.name})`;
											token.showplayers_aura1 = true;
											token.showplayers_aura2 = true;
											token.showplayers_bar1 = true;
											token.showplayers_bar2 = true;
											token.showplayers_bar3 = true;
											token.showplayers_name = true;
											token.bar3_max = result.total;
											token.bar3_value = result.total;
											character.updateBlobs({defaulttoken: JSON.stringify(token)});
											character.save({defaulttoken: (new Date()).getTime()});
										}
									});

									$("a.ui-tabs-anchor[href='#journal']").trigger("click");
								},
								charOptions: {
									inplayerjournals: d20Character.attributes.inplayerjournals,
									controlledby: d20Character.attributes.controlledby,
								},
							};

							d20plus.monsters.handoutBuilder(sel, true, false, `Wild Forms - ${d20Character.attributes.name}`, {}, options);
						};

						if (sel.hp.formula) d20plus.ut.randomRoll(sel.hp.formula, result => doBuild(result));
						else doBuild({total: 0});
					});
				});
			},
		},
	]);
}

SCRIPT_EXTENSIONS.push(tools5eTool);
