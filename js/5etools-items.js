function d20plusItems () {
	d20plus.items = {};

	d20plus.items._groupOptions = ["Type", "Rarity", "Alphabetical", "Source"];
	d20plus.items._listCols = ["name", "type", "rarity", "source"];
	d20plus.items._listItemBuilder = (it) => {
		if (!it._isEnhanced) Renderer.item.enhanceItem(it);

		return `
		<span class="name col-3" title="name">${it.name}</span>
		<span class="type col-5" title="type">${it.typeText.split(",").map(t => `TYP[${t.trim()}]`).join(", ")}</span>
		<span class="rarity col-2" title="rarity">RAR[${it.rarity}]</span>
		<span title="source [Full source name is ${Parser.sourceJsonToFull(it.source)}]" class="source col-2">SRC[${Parser.sourceJsonToAbv(it.source)}]</span>`;
	};
	d20plus.items._listIndexConverter = (it) => {
		if (!it._isEnhanced) Renderer.item.enhanceItem(it);
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

			if (url.trim() === `${DATA_URL}items.json`) {
				Renderer.item.pBuildList((itemList) => {
						const packNames = new Set([`burglar's pack`, `diplomat's pack`, `dungeoneer's pack`, `entertainer's pack`, `explorer's pack`, `priest's pack`, `scholar's pack`, `monster hunter's pack`]);

						const packs = itemList.filter(it => packNames.has(it.name.toLowerCase()));
						packs.forEach(p => {
							if (!p._r20SubItemData) {
								const contents = p.entries.find(it => it.type === "list").items;

								const out = [];
								contents.forEach(line => {
									if (line.includes("@item")) {
										const [pre, tag, item] = line.split(/({@item)/g);
										const tagItem = `${tag}${item}`;

										let [n, src] = item.split("}")[0].trim().split("|");
										if (!src) src = "dmg";

										n = n.toLowerCase();
										src = src.toLowerCase();


										const subItem = itemList.find(it => n === it.name.toLowerCase() && src === it.source.toLowerCase());

										let count = 1;
										pre.replace(/\d+/g, (m) => count = Number(m));

										out.push({
											type: "item",
											count,
											data: subItem
										})
									} else {
										out.push({
											type: "misc",
											data: {
												name: line.toTitleCase(),
												data: {
													Category: "Items",
													"Item Type": "Adventuring Gear"
												}
											}
										})
									}
								});

								p._r20SubItemData = out;
							}
						});

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
						urls: {
							items: `${DATA_URL}items.json`,
							basicitems: `${DATA_URL}basicitems.json`,
							magicvariants: `${DATA_URL}magicvariants.json`
						},
						isAddGroups: true,
					});
			} else {
				// for non-standard URLs, do a generic import
				DataUtil.loadJSON(url).then((data) => {
					(data.itemProperty || []).forEach(p => Renderer.item._addProperty(p));
					(data.itemType || []).forEach(t => Renderer.item._addType(t));
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
	d20plus.items.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, options) {
		// make dir
		const folder = d20plus.journal.makeDirTree(`Items`, folderName);
		const path = ["Items", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;

		if (!data._isEnhanced) Renderer.item.enhanceItem(data); // for homebrew items

		// build item handout
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				`rarity ${data.rarity}`,
				...data.procType,
				Parser.sourceJsonToFull(data.source)
			], "item")
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

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.items._getHandoutData = function (data) {
		function removeDiceTags (str) {
			return str ? Renderer.stripTags(str) : str;
		}

		var notecontents = "";
		const roll20Data = {
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
		const cleanDmg1 = removeDiceTags(data.dmg1);
		const cleanDmg2 = removeDiceTags(data.dmg2);
		if (data.dmg1 && data.dmgType) damage = cleanDmg1 + " " + Parser.dmgTypeToFull(data.dmgType);
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
				if (b === "V") {
					a = a + " (" + cleanDmg2 + ")";
					roll20Data.data._versatile = cleanDmg2;
				}
				if (b === "T" || b === "A") a = a + " (" + data.range + "ft.)";
				if (b === "RLD") a = a + " (" + data.reload + " shots)";
				if (i > 0) a = ", " + a;
				properties += a;
			}
		}
		var reqAttune = data.reqAttune;
		var attunementstring = "";
		if (reqAttune) {
			if (reqAttune === "(Requires Attunement)") {
				attunementstring = " (Requires Attunement)";
			} else if (reqAttune === "OPTIONAL") {
				attunementstring = " (Attunement Optional)";
			} else {
				attunementstring = " (Requires Attunement " + reqAttune + ")";
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
		const renderer = new Renderer();
		const renderStack = [];
		const entryList = {type: "entries", entries: data.entries};
		renderer.setBaseUrl(BASE_SITE_URL);
		renderer.recursiveRender(entryList, renderStack, {depth: 1});
		var textstring = renderStack.join("");
		if (textstring) {
			notecontents += `<hr>`;
			notecontents += textstring;
		}

		if (data.range) {
			roll20Data.data.Range = data.range;
		}
		if (data.dmg1 && data.dmgType) {
			roll20Data.data.Damage = cleanDmg1;
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

		if (data._r20SubItemData) {
			roll20Data._subItems = data._r20SubItemData.map(subItem => {
				if (subItem.type === "item") {
					const [subNote, subGm] = d20plus.items._getHandoutData(subItem.data);
					return {subItem: subGm, count: subItem.count};
				} else {
					return {subItem: subItem.data};
				}
			});
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
}

SCRIPT_EXTENSIONS.push(d20plusItems);
