function d20plusVehicles () {
	d20plus.vehicles = {};

	// Import Vehicle button was clicked
	d20plus.vehicles.button = function () {
		const url = $("#import-vehicles-url").val();

		if (url && url.trim()) {
			DataUtil.loadJSON(url).then((data) => {
				d20plus.importer.addBrewMeta(data._meta);
				d20plus.importer.showImportList(
					"vehicle",
					data.vehicle,
					d20plus.vehicles.handoutBuilder,
				);
			});
		}
	};

	d20plus.vehicles.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, options) {
		// make dir
		const folder = d20plus.journal.makeDirTree(`Vehicles`, folderName);
		const path = ["Vehicles", ...folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		const source = data.source;
		d20.Campaign.characters.create(
			{
				name: name,
				tags: d20plus.importer.getTagString([
					Renderer.utils.getRenderedSize(data.size),
					Parser.vehicleTypeToFull(data.vehicleType),
					Parser.sourceJsonToFull(data.source),
				], "vehicle"),
			},
			{
				success: function (character) {
					if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_VEHICLES](data)] = {name: data.name, source: data.source, type: "character", roll20Id: character.id};

					try {
						const tokenUrl = `${IMG_URL}vehicles/tokens/${source}/${name}.png`;
						const avatar = data.tokenUrl || Parser.nameToTokenName(tokenUrl);
						character.size = data.size || "L";
						character.name = name;
						character.senses = data.senses ? data.senses instanceof Array ? data.senses.join(", ") : data.senses : null;
						character.hp = data.hp;
						$.ajax({
							url: avatar,
							type: "HEAD",
							error: function () {
								d20plus.importer.getSetAvatarImage(character, `${IMG_URL}blank.png`);
							},
							success: function () {
								d20plus.importer.getSetAvatarImage(character, avatar);
							},
						});

						const renderer = new Renderer();
						renderer.setBaseUrl(BASE_SITE_URL);
						
						character.attribs.create({name: "npc", current: 1});
						character.attribs.create({name: "npc_options-flag", current: 0});
						character.attribs.create({name: "is_vehicle", current: 1});
						// region disable charachtermancer
						character.attribs.create({name: "mancer_confirm_flag", current: ""});
						character.attribs.create({name: "l1mancer_status", current: "completed"});
						// endregion
						character.attribs.create({name: "wtype", current: d20plus.importer.getDesiredWhisperType()});
						character.attribs.create({name: "rtype", current: d20plus.importer.getDesiredRollType()});
						character.attribs.create({
							name: "queryadvantage",
							current: d20plus.importer.getDesiredAdvantageToggle(),
						});
						character.attribs.create({
							name: "whispertoggle",
							current: d20plus.importer.getDesiredWhisperToggle(),
						});

						const achpContainer = data.vehicleType === "INFWAR" ? data.hp : (data.hull || data);
						const acType = achpContainer.acFrom ? achpContainer.acFrom[0] : Parser.vehicleTypeToFull(data.vehicleType);
						let speed = "\u2014";
						if (data.speed) speed = Parser.getSpeedString(data);
						else if (data.pace) speed = `${data.pace * 10} ft.`;
						const keel = data.dimensions ? data.dimensions[0].split(" ")[0] : "";
						const beam = data.dimensions ? data.dimensions[1].split(" ")[0] : "";

						character.attribs.create({name: "vehicle_ac", current: achpContainer.ac || ""});
						character.attribs.create({name: "vehicle_actype", current: acType});
						character.attribs.create({name: "vehicle_cargo", current: data.capCargo || ""});
						character.attribs.create({name: "vehicle_hp", current: achpContainer.hp || ""});
						character.attribs.create({name: "vehicle_crew", current: Renderer.vehicle.getShipCreatureCapacity(data)});
						character.attribs.create({name: "vehicle_dt", current: achpContainer.dt || ""});
						character.attribs.create({name: "vehicle_keel", current: keel});
						character.attribs.create({name: "vehicle_beam", current: beam});
						character.attribs.create({name: "vehicle_speed", current: speed});
						character.attribs.create({name: "vehicle_cost", current: Parser.vehicleCostToFull(data)});
						character.attribs.create({name: "ui_flags", current: ""});


						if (data.weapon) {
							data.weapon.forEach(w => {
								const newRowId = d20plus.ut.generateRowId();
								const desc = d20plus.importer.getCleanText(renderer.render({entries: w.entries}));
								// Cost code stolen from Giddy
								const cost = w.costs? w.costs.map(cost => {
									return `${Parser.vehicleCostToFull(cost) || "\u2014"}${cost.note ? `  (${renderer.render(cost.note)})` : ""}`;
								}).join(", ") : "\u2014";

								character.attribs.create({name: `repeating_vehicleweapon_${newRowId}_name`, current: w.name});
								character.attribs.create({name: `repeating_vehicleweapon_${newRowId}_quantity`, current: w.count || 1});
								character.attribs.create({name: `repeating_vehicleweapon_${newRowId}_crew`, current: w.crew || ""});
								character.attribs.create({name: `repeating_vehicleweapon_${newRowId}_actions`, current: "10"});
								character.attribs.create({name: `repeating_vehicleweapon_${newRowId}_ac`, current: w.ac || ""});
								character.attribs.create({name: `repeating_vehicleweapon_${newRowId}_hp`, current: w.hp || ""});
								character.attribs.create({name: `repeating_vehicleweapon_${newRowId}_cost`, current: cost});
								character.attribs.create({name: `repeating_vehicleweapon_${newRowId}_description`, current: desc});
							})
						}
						d20plus.importer.addOrUpdateAttr(character, "ui_flags", "");
						character.view.updateSheetValues();

						if (data.entries) {
							const bio = renderer.render({type: "entries", entries: data.entries});

							setTimeout(() => {
								const fluffAs = d20plus.cfg.get("import", "importFluffAs") || d20plus.cfg.getDefault("import", "importFluffAs");
								let k = fluffAs === "Bio" ? "bio" : "gmnotes";
								character.updateBlobs({
									[k]: Markdown.parse(bio),
								});
								character.save({
									[k]: (new Date()).getTime(),
								});
							}, 500);
						}

						d20plus.importer.addOrUpdateAttr(character, "ui_flags", "");
						
					} catch (e) {
						d20plus.ut.log(`Error loading [${name}]`);
						d20plus.monsters.addImportError(name);
						// eslint-disable-next-line no-console
						console.log(data, e);
					}
					d20.journal.addItemToFolderStructure(character.id, folder.id);
				},
			}
		);
	};
}

SCRIPT_EXTENSIONS.push(d20plusVehicles);
