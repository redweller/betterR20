function d20plusClass () {
	d20plus.classes = {};
	d20plus.subclasses = {};

	// Import Classes button was clicked
	d20plus.classes.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-classes-url-player").val() : $("#import-classes-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.classes.playerImportBuilder : d20plus.classes.handoutBuilder;

			const officialClassUrls = Object.values(classDataUrls).map(v => d20plus.formSrcUrl(CLASS_DATA_DIR, v));

			DataUtil.loadJSON(url).then((data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"class",
					data.class,
					handoutBuilder,
					{
						forcePlayer,
						builderOptions: {
							isHomebrew: !officialClassUrls.includes(url)
						}
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
					forcePlayer,
					builderOptions: {
						isHomebrew: false
					}
				}
			);
		});
	};

	d20plus.classes.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, options) {
		options = options || {};

		// make dir
		const folder = d20plus.journal.makeDirTree(`Classes`, folderName);
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

		d20plus.classes._handleSubclasses(data, overwrite, inJournals, folderName, false, options);
	};

	d20plus.classes._handleSubclasses = async function (data, overwrite, inJournals, outerFolderName, forcePlayer, options) {
		async function chooseSubclassImportStrategy (isUnofficialBaseClass) {
			return new Promise((resolve, reject) => {
				const $dialog = $(`
						<div title="Subclass Import">
							<label class="flex">
								<span>Import ${data.name} ${data.source ? `(${Parser.sourceJsonToAbv(data.source)}) ` : ""}subclasses?</span>
								 <select title="Note: this does not include homebrew. For homebrew subclasses, use the dedicated subclass importer." style="width: 250px;">
								 	${isUnofficialBaseClass ? "" : `<option value="1">Official/Published (excludes UA/etc)</option>`}
								 	<option value="2">All</option>
								 	<option value="3">None</option>
 								</select>
							</label>
						</div>
					`).appendTo($("body"));
				const $selStrat = $dialog.find(`select`);

				$dialog.dialog({
					dialogClass: "no-close",
					buttons: [
						{
							text: "Cancel",
							click: function () {
								$(this).dialog("close");
								$dialog.remove();
								reject(`User cancelled the prompt`);
							}
						},
						{
							text: "OK",
							click: function () {
								const selected = Number($selStrat.val());
								$(this).dialog("close");
								$dialog.remove();
								if (isNaN(selected)) reject(`Value was not a number!`);
								resolve(selected);
							}
						}
					]
				})
			});
		}

		const playerMode = forcePlayer || !window.is_gm;
		// import subclasses
		if (data.subclasses) {
			const importStrategy = await chooseSubclassImportStrategy(options.isHomebrew || (data.source && SourceUtil.isNonstandardSource(data.source)));
			if (importStrategy === 3) return;

			const gainFeatureArray = d20plus.classes._getGainAtLevelArr(data);

			data.subclasses.forEach(sc => {
				if (importStrategy === 1 && SourceUtil.isNonstandardSource(sc.source)) return;

				sc.class = data.name;
				sc.classSource = sc.classSource || data.source;
				sc._gainAtLevels = gainFeatureArray;
				if (playerMode) {
					d20plus.subclasses.playerImportBuilder(sc, data);
				} else {
					const folderName = d20plus.importer._getHandoutPath("subclass", sc, "Class");
					const path = [folderName];
					if (outerFolderName) path.push(sc.source || data.source); // if it wasn't None, group by source
					d20plus.subclasses.handoutBuilder(sc, overwrite, inJournals, path, {}, {}, data);
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

	d20plus.classes.playerImportBuilder = function (data, _1, _2, _3, _4, options) {
		options = options || {};

		const [notecontents, gmnotes] = d20plus.classes._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);

		d20plus.classes._handleSubclasses(data, false, false, null, true, options);
	};

	d20plus.classes._getHandoutData = function (data) {
		const renderer = new Renderer();
		renderer.setBaseUrl(BASE_SITE_URL);

		const renderStack = [];
		// make a copy of the data to modify
		const curClass = JSON.parse(JSON.stringify(data));
		// render the class text
		for (let i = 0; i < 20; i++) {
			const lvlFeatureList = curClass.classFeatures[i];
			for (let j = 0; j < lvlFeatureList.length; j++) {
				const feature = lvlFeatureList[j];
				renderer.recursiveRender(feature, renderStack);
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

				// merge in any subclasses contained in class data
				const allData = MiscUtil.copy(data.subclass || []);
				(data.class || []).map(c => {
					if (c.subclasses) {
						c.subclasses.forEach(sc => {
							sc.class = c.name;
							sc.source = sc.source || c.source;
						});
						return c.subclasses;
					} else return false;
				}).filter(Boolean).forEach(sc => allData.push(sc));

				d20plus.importer.showImportList(
					"subclass",
					allData.flat(),
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

	/**
	 * @param subclass
	 * @param baseClass Will be defined if importing as part of a class, undefined otherwise.
	 */
	d20plus.subclasses._preloadClass = function (subclass, baseClass) {
		if (!subclass.class) Promise.resolve();

		if (baseClass) {
			subclass._gainAtLevels = d20plus.classes._getGainAtLevelArr(baseClass);
			return Promise.resolve();
		} else {
			d20plus.ut.log("Preloading class...");
			return DataUtil.class.loadJSON(BASE_SITE_URL).then((data) => {
				const clazz = data.class.find(it => it.name.toLowerCase() === subclass.class.toLowerCase() && it.source.toLowerCase() === (subclass.classSource || SRC_PHB).toLowerCase());
				if (!clazz) {
					throw new Error(`Could not find class for subclass ${subclass.name}::${subclass.source} with class ${subclass.class}::${subclass.classSource || SRC_PHB}`);
				}

				subclass._gainAtLevels = d20plus.classes._getGainAtLevelArr(clazz);
			});
		}
	};

	/**
	 * @param data
	 * @param overwrite
	 * @param inJournals
	 * @param folderName
	 * @param saveIdsTo
	 * @param options
	 * @param baseClass Will be defined if importing as part of a class, undefined otherwise.
	 */
	d20plus.subclasses.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, options, baseClass) {
		// make dir
		const folder = d20plus.journal.makeDirTree(`Subclasses`, folderName);
		const path = ["Sublasses", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		d20plus.subclasses._preloadClass(data, baseClass).then(() => {
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

	/**
	 * @param data
	 * @param baseClass Will be defined if importing as part of a class, undefined otherwise.
	 */
	d20plus.subclasses.playerImportBuilder = function (data, baseClass) {
		d20plus.subclasses._preloadClass(data, baseClass).then(() => {
			const [notecontents, gmnotes] = d20plus.subclasses._getHandoutData(data);

			const importId = d20plus.ut.generateRowId();
			d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
			const name = `${data.class ? `${data.class} \u2014 ` : ""}${data.name}`;
			d20plus.importer.makePlayerDraggable(importId, name);
		});
	};

	d20plus.subclasses._getHandoutData = function (data) {
		const renderer = new Renderer();
		renderer.setBaseUrl(BASE_SITE_URL);

		const renderStack = [];

		data.subclassFeatures.forEach(lvl => {
			lvl.forEach(f => {
				renderer.recursiveRender(f, renderStack);
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
