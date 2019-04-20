const betteR205etools = function () {
	// Page fully loaded and visible
	d20plus.Init = function () {
		d20plus.ut.log("Init (v" + d20plus.version + ")");
		d20plus.ut.checkVersion();
		d20plus.settingsHtmlHeader = `<hr><h3>betteR20-5etools v${d20plus.version}</h3>`;

		d20plus.template.swapTemplates();

		d20plus.ut.addAllCss();
		if (window.is_gm) {
			d20plus.ut.log("Is GM");
			d20plus.engine.enhancePageSelector();
		}
		else d20plus.ut.log("Not GM. Some functionality will be unavailable.");
		d20plus.setSheet();
		d20plus.js.addScripts(d20plus.onScriptLoad);

		d20plus.ut.showLoadingMessage(`betteR20-5etools v${d20plus.version}`);
	};

	// continue init once JSON loads
	d20plus.onScriptLoad = async function () {
		await d20plus.qpi.initMockApi();
		d20plus.js.addApiScripts(d20plus.onApiScriptLoad);
	};

	// continue init once scripts load
	d20plus.onApiScriptLoad = async function () {
		JqueryUtil.initEnhancements();
		const brewUrl = DataUtil.brew.getDirUrl("creature");
		try {
			const brewMeta = await DataUtil.loadJSON(brewUrl);
			brewMeta.forEach(it => {
				const url = `${it.download_url}${d20plus.ut.getAntiCacheSuffix()}`;
				const name = `Homebrew: ${it.name.trim().replace(/\.json$/i, "")}`;
				monsterBrewDataUrls.push({url, name});
			});
		} catch (e) {
			d20plus.ut.error(`Failed to load bestiary homebrew metadata!`);
		}
		try {
			brewCollectionIndex =  await DataUtil.brew.pLoadCollectionIndex();
		} catch (e) {
			d20plus.ut.error("Failed to pre-load homebrew collection index");
		}
		d20plus.addJson(d20plus.onJsonLoad);
	};

	// continue init once API scripts load
	d20plus.onJsonLoad = function () {
		IS_ROLL20 = true; // global variable from 5etools' utils.js
		BrewUtil._buildSourceCache = function () {
			// no-op when building source cache; we'll handle this elsewhere
			BrewUtil._sourceCache = BrewUtil._sourceCache || {};
		};
		// dummy values
		BrewUtil.homebrew = {};
		BrewUtil.homebrewMeta = {};

		Renderer.get().setBaseUrl(BASE_SITE_URL);
		if (window.is_gm) d20plus.cfg.loadConfig(d20plus.onConfigLoad);
		else d20plus.cfg.loadPlayerConfig(d20plus.onConfigLoad);
	};

	// continue more init after config loaded
	d20plus.onConfigLoad = function () {
		if (window.is_gm) d20plus.art.loadArt(d20plus.onArtLoad);
		else d20plus.onArtLoad();
	};

	// continue more init after art loaded
	d20plus.onArtLoad = function () {
		d20plus.bindDropLocations();
		d20plus.ui.addHtmlHeader();
		d20plus.addCustomHTML();
		d20plus.ui.addHtmlFooter();
		d20plus.engine.enhanceMarkdown();
		d20plus.engine.addProFeatures();
		d20plus.art.initArtFromUrlButtons();
		if (window.is_gm) {
			d20plus.journal.addJournalCommands();
			d20plus.engine.addSelectedTokenCommands();
			d20plus.art.addCustomArtSearch();
			d20plus.engine.addTokenHover();
			d20plus.engine.enhanceTransmogrifier();
			d20plus.engine.removeLinkConfirmation();
			d20plus.artBrowse.initRepoBrowser();
			d20plus.ui.addQuickUiGm();
			d20plus.anim.animatorTool.init();
			// Better20 jukebox tab
			d20plus.remoteLibre.init();
			d20plus.jukeboxWidget.init();
		}
		d20.Campaign.pages.each(d20plus.bindGraphics);
		d20.Campaign.activePage().collection.on("add", d20plus.bindGraphics);
		d20plus.engine.addSelectedTokenCommands();
		d20plus.engine.enhanceStatusEffects();
		d20plus.engine.enhanceMeasureTool();
		d20plus.engine.enhanceMouseDown();
		d20plus.engine.enhanceMouseMove();
		d20plus.engine.addLineCutterTool();
		d20plus.chat.enhanceChat();
		d20plus.engine.enhancePathWidths();
		d20plus.ut.disable3dDice();
		d20plus.engine.addLayers();
		d20plus.weather.addWeather();
		d20plus.engine.repairHexMethods();

		// apply config
		if (window.is_gm) {
			d20plus.cfg.baseHandleConfigChange();
			d20plus.handleConfigChange();
		} else {
			d20plus.cfg.startPlayerConfigHandler();
		}

		d20plus.ut.log("All systems operational");
		d20plus.ut.chatTag(`betteR20-5etools v${d20plus.version}`);
	};
};

SCRIPT_EXTENSIONS.push(betteR205etools);
