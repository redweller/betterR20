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
						const crew = data.capCreature ? Renderer.vehicle.getInfwarCreatureCapacity(data) : Renderer.vehicle.getShipCreatureCapacity(data);
						let speed = "\u2014";
						if (data.speed) speed = Parser.getSpeedString(data);
						else if (data.pace) speed = `${data.pace * 10} ft.`;
						const keel = data.dimensions ? data.dimensions[0].split(" ")[0] : "";
						const beam = data.dimensions ? data.dimensions[1].split(" ")[0] : "";

						character.attribs.create({name: "vehicle_ac", current: achpContainer.ac || ""});
						character.attribs.create({name: "vehicle_actype", current: acType});
						character.attribs.create({name: "vehicle_cargo", current: data.capCargo || ""});
						character.attribs.create({name: "vehicle_hp", current: achpContainer.hp || ""});
						character.attribs.create({name: "vehicle_crew", current: crew});
						character.attribs.create({name: "vehicle_dt", current: achpContainer.dt || ""});
						character.attribs.create({name: "vehicle_keel", current: keel});
						character.attribs.create({name: "vehicle_beam", current: beam});
						character.attribs.create({name: "vehicle_speed", current: speed});
						character.attribs.create({name: "vehicle_cost", current: Parser.vehicleCostToFull(data)});


						if (data.weapon) d20plus.importer.addVehicleWeapons(character, data.weapon, renderer);
						if (data.control) d20plus.importer.addVehicleWeapons(character, data.control, renderer, "Control");
						if (data.movement) d20plus.importer.addVehicleWeapons(character, data.movement, renderer, "Movement");
						if (data.trait) d20plus.importer.addVehicleWeapons(character, data.trait, renderer, "Trait");

						let numActions = 0;

						if (data.other) {
							const name = d20plus.importer.getCleanText(renderer.render(data.other[0].name));
							const text = d20plus.importer.getCleanText(renderer.render({entries: data.other[0].entries}, 1)).replace(/^\s*Hit:\s*/, "");
							d20plus.importer.addVehicleAction(character, name, text, numActions++);
						}
						if (data.action) {
							const text = d20plus.importer.getCleanText(renderer.render(data.action[0], 1)).replace(/^\s*Hit:\s*/, "");
							d20plus.importer.addVehicleAction(character, "Actions", text, numActions++);

							data.action[1].items.forEach((a, i) => {
								const name = d20plus.importer.getCleanText(renderer.render(a.name));

								let actionEntries = [];
								if (data.weapon && i < data.weapon.length) actionEntries = data.weapon[i].entries
								actionEntries.push(a.entry);

								const text = d20plus.importer.getCleanText(renderer.render({entries: actionEntries}, 1)).replace(/^\s*Hit:\s*/, "");
								d20plus.importer.addVehicleAction(character, name, text, numActions++);
							});
						}
						else if (data.actionStation) {
							data.actionStation.forEach(a => {
								const name = d20plus.importer.getCleanText(renderer.render(a.name));
								const text = d20plus.importer.getCleanText(renderer.render({entries: a.entries}, 1)).replace(/^\s*Hit:\s*/, "");
								d20plus.importer.addVehicleAction(character, name, text, numActions++);
							});
						}
						else if (data.weapon) {
							data.weapon.forEach(w => {
								if (w.action) {
									w.action.forEach(a => {
										const name = d20plus.importer.getCleanText(renderer.render(a.name));
										const text = d20plus.importer.getCleanText(renderer.render({entries: a.entries.concat(w.entries)}, 1)).replace(/^\s*Hit:\s*/, "");
										d20plus.importer.addVehicleAction(character, name, text, numActions++);
									});
								}
								else if (w.entries) {
									const name = d20plus.importer.getCleanText(renderer.render(w.name));
									const text = d20plus.importer.getCleanText(renderer.render({entries: w.entries}, 1)).replace(/^\s*Hit:\s*/, "");
									d20plus.importer.addVehicleAction(character, name, text, numActions++);
								}
							});
						}

						character.view.updateSheetValues();

						/*if (data.entries) {
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
						}*/


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
