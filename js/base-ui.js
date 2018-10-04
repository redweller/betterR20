function baseUi () {
	d20plus.ui = {};

	d20plus.ui.addHtmlHeader = () => {
		d20plus.ut.log("Add HTML");
		const $body = $("body");

		const $wrpSettings = $(`<div id="betteR20-settings"/>`);
		$("#mysettings > .content").children("hr").first().before($wrpSettings);

		$wrpSettings.append(d20plus.settingsHtmlHeader);
		$body.append(d20plus.configEditorHTML);
		if (window.is_gm) {
			$(`#imagedialog`).find(`.searchbox`).find(`.tabcontainer`).first().after(d20plus.artTabHtml);
			$(`a#button-add-external-art`).on(window.mousedowntype, d20plus.art.button);

			$body.append(d20plus.addArtHTML);
			$body.append(d20plus.addArtMassAdderHTML);
			$body.append(d20plus.tool.toolsListHtml);
			$("#d20plus-artfolder").dialog({
				autoOpen: false,
				resizable: true,
				width: 800,
				height: 400,
			});
			$("#d20plus-artmassadd").dialog({
				autoOpen: false,
				resizable: true,
				width: 800,
				height: 400,
			});
		}
		const $cfgEditor = $("#d20plus-configeditor");
		$cfgEditor.dialog({
			autoOpen: false,
			resizable: true,
			width: 800,
			height: 650,
		});
		$cfgEditor.parent().append(d20plus.configEditorButtonBarHTML);

		// shared GM/player conent
		// quick search box
		const $iptSearch = $(`<input id="player-search" class="ui-autocomplete-input" autocomplete="off" placeholder="Quick search by name...">`);
		const $wrprResults = $(`<div id="player-search-results" class="content searchbox"/>`);

		if (window.is_gm) {
			$iptSearch.css("width", "calc(100% - 5px)");
			const $addPoint = $("#journal").find("button.btn.superadd");
			$addPoint.after($wrprResults);
			$addPoint.after(`<br>`);
			$addPoint.after($iptSearch);
			$addPoint.after(`<br><br>`);
		} else {
			const $wrprControls = $(`<div class="content searchbox" id="search-wrp-controls"/>`);
			$(`#journal .content`).before($wrprControls).before($wrprResults);
			$iptSearch.css("max-width", "calc(100% - 140px)");
			$wrprControls.append($iptSearch);
		}
		d20plus.engine.initQuickSearch($iptSearch, $wrprResults);
	};

	d20plus.ui.addHtmlFooter = () => {
		const $wrpSettings = $(`#betteR20-settings`);
		$wrpSettings.append(d20plus.settingsHtmlPtFooter);

		$("#mysettings > .content a#button-edit-config").on(window.mousedowntype, d20plus.cfg.openConfigEditor);
		$("#button-manage-qpi").on(window.mousedowntype, qpi._openManager);
		d20plus.tool.addTools();
	};

	d20plus.ui.addQuickLayerBar = () => {
		const $ulBtns = $(`<div id="floatinglayerbar"><ul/></div>`)
			.css({
				width: 30,
				position: "absolute",
				left: 20,
				top: 330,
				border: "1px solid #666",
				boxShadow: "1px 1px 3px #666",
				zIndex: 10600,
				backgroundColor: "rgba(255,255,255,0.80)"
			})
			.appendTo($(`body`)).find(`ul`);

		const $wrpBtnsMain = $(`#floatingtoolbar`);
		const handleClick = (clazz, evt) => $wrpBtnsMain.find(`.${clazz}`).trigger("click", evt);
		$(`<li class="choosemap"><span class="pictos" style="padding: 0 3px;">@</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`choosemap`, evt));
		$(`<li class="chooseobjects"><span class="pictos">b</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`chooseobjects`, evt));
		$(`<li class="choosegmlayer"><span class="pictos">E</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`choosegmlayer`, evt));
		$(`<li class="choosewalls"><span class="pictostwo">r</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`choosewalls`, evt));

		$("#editinglayer").on(clicktype, "li", function () {
			$("#floatinglayerbar").removeClass("map")
				.removeClass("objects")
				.removeClass("gmlayer")
				.removeClass("walls");
			setTimeout(() => {
				$("#floatinglayerbar").addClass(window.currentEditingLayer)
			}, 1);
		})
	};
}

SCRIPT_EXTENSIONS.push(baseUi);
