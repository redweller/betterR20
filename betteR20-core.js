const betteR20Core = function () {
	d20plus.Init = () => {
		d20plus.log("Init (v" + d20plus.version + ")");
		d20plus.settingsHtmlHeader = `<hr><h3>betteR20-core v${d20plus.version}</h3>`;
		d20plus.addAllCss();
		if (window.is_gm) d20plus.enhancePageSelector();
		d20plus.addScripts(d20plus.onScriptLoad);
	};

	d20plus.onScriptLoad = () => {
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
		d20plus.addProFeatures();
		d20plus.enhanceMeasureTool();
		d20plus.enhanceSnap();
		d20plus.enhanceStatusEffects();
		d20plus.addHtmlHeader();
		d20plus.addHtmlFooter();
		if (window.is_gm) {
			d20plus.addJournalCommands();
			d20plus.addSelectedTokenCommands();
			d20plus.initArtFromUrlButtons();
			d20plus.addCustomArtSearch();
			d20plus.addTokenHover();
		} else {
			d20plus.startPlayerConfigHandler();
		}
		d20plus.log("All systems operational");
		d20plus.chatTag(`betteR20-core v${d20plus.version}`);
	};
};

SCRIPT_EXTENSIONS.push(betteR20Core);