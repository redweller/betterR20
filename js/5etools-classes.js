function d20plusClass () {
	d20plus.classes = {};
	d20plus.subclasses = {};

	// Import Classes button was clicked
	d20plus.classes.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-classes-url-player").val() : $("#import-classes-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.classes.playerImportBuilder : d20plus.classes.handoutBuilder;

			DataUtil.loadJSON(url).then((data) => {
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

	// Import All Classes button was clicked
	d20plus.classes.buttonAll = function (forcePlayer) {
		const handoutBuilder = !forcePlayer && window.is_gm ? d20plus.classes.handoutBuilder : d20plus.classes.playerImportBuilder;

		DataUtil.class.loadJSON(BASE_SITE_URL).then((data) => {
			d20plus.importer.showImportList(
				"class",
				data.class,
				handoutBuilder,
				{
					forcePlayer
				}
			);
		});
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
			tags: d20plus.importer.getTagString([
				Parser.sourceJsonToFull(data.source)
			], "class")
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

	d20plus.classes._handleSubclasses = async function (data, overwrite, inJournals, outerFolderName, forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		// import subclasses
		if (data.subclasses) {
			const allSubclasses = (data.source && !SourceUtil.isNonstandardSource(data.source)) || !window.confirm(`${data.name} subclasses: import published/official only?`);

			const gainFeatureArray = d20plus.classes._getGainAtLevelArr(data);

			data.subclasses.forEach(sc => {
				if (!allSubclasses && !SourceUtil.isNonstandardSource(sc.source)) return;

				sc.class = data.name;
				sc.classSource = sc.classSource || data.source;
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

	d20plus.classes._getGainAtLevelArr = function (clazz) {
		const gainFeatureArray = [];
		outer: for (let i = 0; i < 20; i++) {
			const lvlFeatureList = clazz.classFeatures[i];
			for (let j = 0; j < lvlFeatureList.length; j++) {
				const feature = lvlFeatureList[j];
				if (feature.gainSubclassFeature) {
					gainFeatureArray.push(true);
					continue outer;
				}
			}
			gainFeatureArray.push(false);
		}
		return gainFeatureArray;
	};

	d20plus.classes.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.classes._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
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
		const noteContents = `${rendered}\n\n<del class="hidden">${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

			DataUtil.loadJSON(url).then((data) => {
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

	d20plus.subclasses._preloadClass = function (subclass) {
		if (!subclass.class) Promise.resolve();

		d20plus.ut.log("Preloading class...");
		return DataUtil.class.loadJSON(BASE_SITE_URL).then((data) => {
			const clazz = data.class.find(it => it.name.toLowerCase() === subclass.class.toLowerCase() && it.source.toLowerCase() === (subclass.classSource || SRC_PHB).toLowerCase());
			if (!clazz) {
				throw new Error(`Could not find class for subclass ${subclass.name}::${subclass.source} with class ${subclass.class}::${subclass.classSource || SRC_PHB}`);
			}

			const gainAtLevelArr = d20plus.classes._getGainAtLevelArr(clazz);
			subclass._gainAtLevels = gainAtLevelArr;
		});
	};

	d20plus.subclasses.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Subclasses`, folderName);
		const path = ["Sublasses", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		d20plus.subclasses._preloadClass(data).then(() => {
			const name = `${data.shortName} (${data.class})`;
			d20.Campaign.handouts.create({
				name: name,
				tags: d20plus.importer.getTagString([
					data.class,
					Parser.sourceJsonToFull(data.source)
				], "subclass")
			}, {
				success: function (handout) {
					if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

					const [noteContents, gmNotes] = d20plus.subclasses._getHandoutData(data);

					handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
					handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
					d20.journal.addItemToFolderStructure(handout.id, folder.id);
				}
			});
		});
	};

	d20plus.subclasses.playerImportBuilder = function (data) {
		d20plus.subclasses._preloadClass(data).then(() => {
			const [notecontents, gmnotes] = d20plus.subclasses._getHandoutData(data);

			const importId = d20plus.ut.generateRowId();
			d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
			const name = `${data.class ? `${data.class} \u2014 ` : ""}${data.name}`;
			d20plus.importer.makePlayerDraggable(importId, name);
		});
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
		const noteContents = `${rendered}\n\n<del class="hidden">${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};

}

SCRIPT_EXTENSIONS.push(d20plusClass);
