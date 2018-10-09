const betteR20Core = function () {
	d20plus.Init = () => {
		d20plus.ut.log("Init (v" + d20plus.version + ")");
		d20plus.ut.checkVersion();
		d20plus.settingsHtmlHeader = `<hr><h3>betteR20-core v${d20plus.version}</h3>`;
		d20plus.ut.addAllCss();
		if (window.is_gm) d20plus.engine.enhancePageSelector();
        d20plus.js.addScripts(d20plus.onScriptLoad);

        d20plus.ut.showLoadingMessage(`betteR20-core v${d20plus.version}`);
	};

	d20plus.onScriptLoad = () => {
		d20plus.qpi.initMockApi();
		d20plus.js.addApiScripts(d20plus.onApiScriptLoad);
	};

	d20plus.onApiScriptLoad = () => {
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
		d20plus.engine.enhanceMarkdown();
		d20plus.engine.addProFeatures();
		d20plus.engine.enhanceMeasureTool();
		d20plus.engine.enhanceMouseDown();
		d20plus.engine.enhanceMouseMove();
		d20plus.engine.enhanceStatusEffects();
		d20plus.engine.addLineCutterTool();
		d20plus.ui.addHtmlHeader();
		d20plus.ui.addHtmlFooter();
		d20plus.art.initArtFromUrlButtons();
		if (window.is_gm) {
			d20plus.journal.addJournalCommands();
			d20plus.engine.addSelectedTokenCommands();
			d20plus.art.addCustomArtSearch();
			d20plus.engine.addTokenHover();
			d20plus.engine.enhanceTransmogrifier();
			d20plus.engine.removeLinkConfirmation();
			d20plus.art.initRepoBrowser();
		} else {
			d20plus.cfg.startPlayerConfigHandler();
		}
		d20plus.engine.enhancePathWidths();
		d20plus.ut.disable3dDice();
		d20plus.engine.addLayers();
		d20plus.engine.addWeather();
		d20plus.ui.addQuickUI();
		d20plus.ut.log("All systems operational");
		d20plus.ut.chatTag(`betteR20-core v${d20plus.version}`);
	};
};

SCRIPT_EXTENSIONS.push(betteR20Core);
