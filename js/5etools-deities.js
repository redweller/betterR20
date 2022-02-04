function d20plusDeities () {
	d20plus.deities = {};

	// Import Object button was clicked
	d20plus.deities.button = function () {
		const url = $("#import-deities-url").val();

		if (url && url.trim()) {
			DataUtil.loadJSON(url).then((data) => {
				d20plus.importer.addBrewMeta(data._meta);
				d20plus.importer.showImportList(
					"deity",
					data.deity,
					d20plus.deities.handoutBuilder,
				);
			});
		}
	};

    d20plus.deities.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, options) {
		// make dir
		const folder = d20plus.journal.makeDirTree(`Deities`, folderName);
		const path = ["Deities", ...folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		d20.Campaign.handouts.create({
			name: `${data.name}${data.title ? `, ${data.title.toTitleCase()}` : ""}`,
			tags: d20plus.importer.getTagString([
				Parser.sourceJsonToFull(data.source),
			], "deity"),
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_DEITIES](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.deities._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date()).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			},
		});
	};

    d20plus.deities._getHandoutData = function (data) {
		const renderer = new Renderer();

        // Create the list of things to add to the entry
		const renderStack = [];

        // Add meta info
        renderStack.push(Renderer.deity.getCompactRenderedString(data));
        // Add flavor text
		renderer.recursiveRender({entries: data.entries}, renderStack, {depth: 1});

		const rendered = renderStack.join("");

        // Add GM notes
		const r20json = {
			"name": data.name,
			"Vetoolscontent": data,
			"data": {
				"Category": "Deities",
			},
		};
		const gmNotes = JSON.stringify(r20json);
		const noteContents = `${rendered}\n\n<del class="hidden">${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};
}

SCRIPT_EXTENSIONS.push(d20plusDeities);
