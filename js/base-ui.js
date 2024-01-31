function baseUi () {
	d20plus.ui = {};

	d20plus.ui.addHtmlHeader = () => {
		d20plus.ut.log("Add HTML");
		const $body = $("body");

		const $wrpSettings = $(`<div id="betteR20-settings"/>`);
		$("#settings-accordion").children(".panel.panel-default").first().before($wrpSettings);

		$wrpSettings.append(d20plus.settingsHtmlHeader);
		$body.append(d20plus.html.configEditorHTML);
		if (window.is_gm) {
			$(`#imagedialog`).find(`.searchbox`).find(`.tabcontainer`).first().after(d20plus.html.artTabHtml);
			$(`#button-add-external-art`).on(window.mousedowntype, d20plus.art.button);

			$body.append(d20plus.html.addArtHTML);
			$body.append(d20plus.html.addArtMassAdderHTML);
			$body.append(d20plus.html.toolsListHtml);
			$("#d20plus-artfolder").dialog({
				autoOpen: false,
				resizable: true,
				width: 1000,
				height: 800,
			});
			$("#d20plus-artmassadd").dialog({
				autoOpen: false,
				resizable: true,
				width: 800,
				height: 650,
			});
		}
		const $cfgEditor = $("#d20plus-configeditor");
		$cfgEditor.dialog({
			autoOpen: false,
			resizable: true,
			width: 800,
			height: 650,
		});
		$cfgEditor.parent().append(d20plus.html.configEditorButtonBarHTML);

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
		$wrpSettings.append(d20plus.html.settingsHtmlPtFooter);
		$wrpSettings.css("margin", "5px");

		$("#button-edit-config").on(window.mousedowntype, d20plus.cfg.openConfigEditor);
		d20plus.tool.addTools();
	};// RB20 EXCLUDE START

	/* d20plus.ui.addQuickUiGmLegacy = () => {
		const $wrpBtnsMain = $(`#floatingtoolbar`);

		// add quick layer selection panel
		const $ulBtns = $(`<div id="floatinglayerbar"><ul/></div>`)
			.css({
				width: 30,
				position: "absolute",
				left: 10,
				top: $wrpBtnsMain.height() + 90,
				border: "1px solid #666",
				boxShadow: "1px 1px 3px #666",
				zIndex: 10600,
				backgroundColor: "rgba(255,255,255,0.80)",
			})
			.appendTo($(`#playerzone`)).find(`ul`);

		const handleClick = (clazz, evt) => $wrpBtnsMain.find(`.${clazz}`).trigger("click", evt);

		// Add layers to second side bar
		$(`<li title="${__("ui_bar_map")}" class="choosemap"><span class="pictos" style="padding: 0 3px;">G</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`choosemap`, evt));
		if (d20plus.cfg.getOrDefault("canvas", "showFloors")) {
			$(`<li title="${__("ui_bar_fl")}" class="choosefloors"><span class="pictos">I</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`choosefloors`, evt));
		}
		if (d20plus.cfg.getOrDefault("canvas", "showBackground")) {
			$(`<li title="${__("ui_bar_bg")}" class="choosebackground"><span class="pictos">a</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`choosebackground`, evt));
		}
		$(`<li title="${__("ui_bar_obj")}" class="chooseobjects"><span class="pictos">U</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`chooseobjects`, evt));
		if (d20plus.cfg.getOrDefault("canvas", "showRoofs")) {
			$(`<li title="${__("ui_bar_rf")}" class="chooseroofs"><span class="pictos">H</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`chooseroofs`, evt));
		}
		if (d20plus.cfg.getOrDefault("canvas", "showForeground")) {
			$(`<li title="${__("ui_bar_fg")}" class="chooseforeground"><span class="pictos">B</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`chooseforeground`, evt));
		}
		$(`<li title="GM Info Overlay" class="choosegmlayer"><span class="pictos">E</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`choosegmlayer`, evt));
		$(`<li title="${__("ui_bar_barriers")}" class="choosewalls"><span class="pictostwo">r</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`choosewalls`, evt));
		if (d20plus.cfg.getOrDefault("canvas", "showWeather")) {
			$(`<li title="${__("ui_bar_we")}" class="chooseweather"><span class="pictos">C</span></li>`).appendTo($ulBtns).click((evt) => handleClick(`chooseweather`, evt));
		}

		$("body").on("click", "#editinglayer li", function () {
			$("#floatinglayerbar").removeClass("map")
				.removeClass("floors")
				.removeClass("background")
				.removeClass("objects")
				.removeClass("foreground")
				.removeClass("roofs")
				.removeClass("gmlayer")
				.removeClass("walls")
				.removeClass("weather");
			setTimeout(() => {
				$("#floatinglayerbar").addClass(window.currentEditingLayer)
			}, 1);
		});

		// add "desc sort" button to init tracker
		const $initTracker = $(`#initiativewindow`);
		const addInitSortBtn = () => {
			$(`<div class="btn" id="init-quick-sort-desc" style="margin-right: 5px; padding:5px 2px;"><span class="pictos">l</span></div>`).click(() => {
				// this will throw a benign error if the settings dialog has never been opened
				$("#initiativewindow_settings .sortlist_numericdesc").click();
			}).prependTo($initTracker.parent().find(`.ui-dialog-buttonset`).parent());
		};
		const addInitResetBtn = () => { // also add "reset tracker" button
			$(`<div class="btn" id="init-quick-reset" style="margin-right: 5px; padding:5px 2px;"><span class="pictos">#</span></div>`).click(() => {
				// this will throw a benign error if the settings dialog has never been opened
				$("#initiativewindow_settings .clearlist").click();
			}).prependTo($initTracker.parent().find(`.ui-dialog-buttonset`).parent());
		};
		if (d20.Campaign.initiativewindow.model.attributes.initiativepage) {
			addInitSortBtn();
			addInitResetBtn();
		} else {
			d20.Campaign.initiativewindow.model.on("change", (e) => {
				if (d20.Campaign.initiativewindow.model.attributes.initiativepage && $(`#init-quick-sort-desc`).length === 0) {
					addInitSortBtn();
					addInitResetBtn();
					d20plus.cfg.baseHandleConfigChange();
				}
			})
		}
	}; */ // RB20 EXCLUDE END

	d20plus.ui.r20Buttons = [
		{DOMid: "tokens-layer-button", id: "objects", color: "--vtt-toolbar-token-layer-btn-bg"},
		{DOMid: "gm-layer-button", id: "gmlayer", color: "--vtt-toolbar-gm-layer-btn-bg"},
		{DOMid: "lighting-layer-button", id: "walls", color: "--vtt-toolbar-lighting-layer-btn-bg"},
		{DOMid: "map-layer-button", id: "map", color: "--vtt-toolbar-map-layer-btn-bg"},
	];

	d20plus.ui.b20Buttons = [
		{name: "FG", tooltip: "Foreground Layer", icon: "B", id: "foreground", cfg: "showForeground"},
		{name: "ROOF", tooltip: "Roof Layer", icon: "H", id: "roofs", cfg: "showRoofs"},
		{name: "BG", tooltip: "Background Layer", icon: "a", id: "background", cfg: "showBackground"},
		{name: "FLOOR", tooltip: "Floor Layer", icon: "I", id: "floors", cfg: "showFloors"},
		{name: "COVER", tooltip: "Weather Exclusions", icon: "C", id: "weather", cfg: "showWeather"},
	];

	const switchToB20Layer = (evt) => {
		const $selected = $(evt.currentTarget);
		const $icon = $selected.find(".icon-slot");
		const icon = $icon.find("span").text();
		const $roll20LayersButton = $("#layers-menu-button").find(".grimoire__roll20-icon");

		currentEditingLayer = $selected.data("layer");
		d20.Campaign.activePage().onLayerChange();
		d20plus.ui.b20LayersActive = true;

		d20plus.ui.secondaryPanel.buttons.removeClass("b20-selected");
		d20plus.ui.secondaryPanel.iconSlots.removeClass("icon-selected");

		$selected.addClass("b20-selected");
		$icon.addClass("icon-selected icon-circle");
		d20plus.ui.$r20Buttons.removeClass("icon-selected").attr("style", "");
		d20plus.ui.extraButton.icon.text(icon);
		$roll20LayersButton.css({"font-family": "Pictos", "font-size": "1.5em"});
		$roll20LayersButton.text(icon);
	};

	const switchLayersToolbar = (evt) => {
		if (evt.delegateTarget.id === "extra-layer-button") {
			d20plus.ui.$secondaryPanel
				.css({left: "60px"})
				.toggle();
			if (d20plus.ui.$secondaryPanel.css("display") === "none"
				&& d20plus.ui.b20LayersActive) {
				d20plus.ui.extraButton.button.addClass("b20-selected");
				d20plus.ui.extraButton.iconSlot.addClass("icon-selected");
			} else {
				d20plus.ui.extraButton.button.removeClass("b20-selected");
				// d20plus.ui.extraButton.iconSlot.removeClass("icon-selected");
			}
		} else {
			const roll20ToolbarVisible = $("#tokens-layer-button").parent().is(":visible");
			d20plus.ui.$secondaryPanel
				.css({left: "110px"})
				.toggle(roll20ToolbarVisible);
		}
	};

	d20plus.ui.switchToR20Layer = (evt) => {
		d20plus.ui.secondaryPanel.buttons.removeClass("b20-selected");
		d20plus.ui.secondaryPanel.iconSlots.removeClass("icon-selected").addClass("icon-circle");
		d20plus.ui.extraButton.button.removeClass("b20-selected");
		d20plus.ui.extraButton.icon.text("|");
		d20plus.ui.b20LayersActive = false;

		// the following check with setTimeout is required to properly process native r20 buttons.
		// Without it the previously active layer won't be activated again
		const $triggeredBy = $(evt?.target || "#tokens-layer-button .icon-slot");
		const $pressed = $triggeredBy.closest(".toolbar-button-outer");
		const $pressedIcon = $triggeredBy.closest(".icon-slot");
		const $pressedButton = $triggeredBy.closest(".toolbar-button-inner");
		const isFirstButton = $pressed.attr("id") === d20plus.ui.r20Buttons[0].id;
		const $roll20LayersButton = $("#layers-menu-button").find(".grimoire__roll20-icon");
		const secondaryPanelHidden = d20plus.ui.$secondaryPanel.css("display") === "none";

		if (secondaryPanelHidden) d20plus.ui.extraButton.iconSlot.addClass("icon-circle").removeClass("icon-selected");
		$roll20LayersButton.css({"font-family": "Roll20Icons", "font-size": "1.3em"});

		// should manually apply layer instead
		setTimeout(() => {
			if ($pressedIcon.attr("style")) return;
			const layer = d20plus.ui.r20Buttons.find(b => b.DOMid === $pressed.attr("id"));
			if (!layer?.color) return;
			$pressedIcon
				.addClass("icon-selected")
				.attr("style", `background-color: var(${layer.color});`);
			currentEditingLayer = layer.id;
			d20.Campaign.activePage().onLayerChange();
		}, 100);
	};

	d20plus.ui.addQuickUiGm = () => {
		if (!d20plus.cfg.getOrDefault("canvas", "extraLayerButtons")) return;
		const buttonsHmtl = d20plus.ui.b20Buttons.reduce((html, l) => {
			l.enabled = d20plus.cfg.getOrDefault("canvas", l.cfg);
			return `${html}${(l.enabled ? d20plus.html.layerSecondaryPanel(l) : "")}`;
		}, "");
		if (!d20plus.ui.b20Buttons.some(b => b.enabled)) return;

		d20plus.ui.$extraButton = $(d20plus.html.layerExtrasButton);
		d20plus.ui.$secondaryPanel = $(`
			<div class="drawer-outer b20" style="left: 111px;display:none">
			${buttonsHmtl}</div>
		`);

		d20plus.ui.extraButton = {
			icon: d20plus.ui.$extraButton.find(".icon-slot span"),
			iconSlot: d20plus.ui.$extraButton.find(".icon-slot"),
			button: d20plus.ui.$extraButton.find(".toolbar-button-inner"),
		};

		d20plus.ui.secondaryPanel = {
			iconSlots: d20plus.ui.$secondaryPanel.find(".icon-slot"),
			buttons: d20plus.ui.$secondaryPanel.find(".toolbar-button-inner"),
		};

		d20plus.ui.$r20Buttons = $("#tokens-layer-button")
			.parent()
			.find(".toolbar-button-outer:not(.b20) .icon-slot");

		$("body").append(d20plus.ui.$secondaryPanel);
		$("#map-layer-button").after(d20plus.ui.$extraButton);

		d20plus.ui.$extraButton.on("mouseenter", ".toolbar-button-inner", (evt) => {
			$(evt.currentTarget).find(".icon-slot").addClass("icon-selected").removeClass("icon-circle");
		}).on("mouseleave", ".toolbar-button-inner", (evt) => {
			if (d20plus.ui.b20LayersActive || d20plus.ui.$secondaryPanel.css("display") !== "none") return;
			$(evt.currentTarget).find(".icon-slot").removeClass("icon-selected").addClass("icon-circle");
		}).on(clicktype, ".toolbar-button-inner", switchLayersToolbar);

		d20plus.ui.$secondaryPanel.on("mouseenter", ".toolbar-button-inner", (evt) => {
			$(evt.currentTarget).find(".icon-slot").addClass("icon-selected").removeClass("icon-circle");
		}).on("mouseleave", ".toolbar-button-inner", (evt) => {
			if ($(evt.currentTarget).hasClass("b20-selected")) return;
			$(evt.currentTarget).find(".icon-slot").removeClass("icon-selected").addClass("icon-circle");
		}).on(clicktype, ".layer-toggle", (evt) => {
			evt.stopPropagation();
			const $layerIcon = $(evt.currentTarget).prev(".toolbar-button-inner");
			const state = d20plus.engine.layersToggle($layerIcon.data("layer"));
		}).on(clicktype, ".toolbar-button-inner", switchToB20Layer);

		$(document.body)
			.on("mouseup", d20plus.ui.r20Buttons.reduce((css, b) => {
				return `${css}${css ? ", " : ""}#${b.DOMid}  .icon-slot`;
			}, ""), d20plus.ui.switchToR20Layer)
			.on(clicktype, "#layers-menu-button .toolbar-button-inner", switchLayersToolbar);

		$("#playerzone").css({"z-index": 10100}); // otherwise it has the same z-index as native buttons
	};

	d20plus.ui.layerVisibilityIcon = (layer, state) => {
		const $layerIcon = d20plus.ui.$secondaryPanel.find(`[data-layer=${layer}]`);
		$layerIcon.toggleClass("layer-off", !state);
	}

	/**
	 * Prompt the user to choose from a list of checkboxes. By default, one checkbox can be selected, but a "count"
	 * option can be provided to allow the user to choose multiple options.
	 *
	 * @param dataArray options to choose from
	 * @param dataTitle title for the window
	 * @param displayFormatter function to format dataArray for display
	 * @param count exact number of  options the user must, mutually exclusive with countMin and countMax
	 * @param countMin lowest number of options the user must choose, requires countMax, mutually exclusive with count
	 * @param countMax highest number of options the user must choose, requires countMax, mutually exclusive with count
	 * @param additionalHTML additional html code, such as a button
	 * @param note add a note at the bottom of the window
	 * @param messageCountIncomplete message when user does not choose correct number of choices
	 * @param random show button for random choices
	 * @param randomMax Enforce max random choices
	 * @param totallyRandom select randomly number of items between countMin and countMax. Requires count to be null. This has higher priority than randomMax
	 * @return {Promise}
	 */
	d20plus.ui.chooseCheckboxList = async function (dataArray, dataTitle, {displayFormatter = null, count = null, countMin = null, countMax = null, additionalHTML = null, note = null, messageCountIncomplete = null, random = null, randomMax = null, totallyRandom = null} = {}) {
		return new Promise((resolve, reject) => {
			// Ensure count, countMin, and countMax don't mess up
			// Note if(var) is false if the number is 0. countMin is the only count allowed to be 0
			if ((Number.isInteger(count) && Number.isInteger(countMin))
			|| (Number.isInteger(count) && Number.isInteger(countMax))
			|| (count == null && (Number.isInteger(countMin) ^ Number.isInteger(countMax)))
			|| (countMin > countMax)) {
				reject(new Error("Bad arguments--count is mutually exclusive with countMin and countMax, and countMin and countMax require each other."))
			}
			const useRange = Number.isInteger(countMin) && countMax;

			// Generate the HTML
			const $dialog = $(`
				<div title="${dataTitle}">
					${Number.isInteger(count) ? `<div name="remain" class="bold">Remaining: ${count}</div>` : ""}
					${Number.isInteger(countMax) ? `<div name="remain" class="bold">Remaining: ${countMax}, Minimum: ${countMin}</div>` : ""}
					<div>
						${dataArray.map(it => `<label class="split"><span>${displayFormatter ? displayFormatter(it) : it}</span> <input data-choice="${it}" type="checkbox"></label>`).join("")}
					</div>
					${additionalHTML ? `<br><div>${additionalHTML}</div>` : ""}
					${note ? `<br><div class="italic">${note}</div>` : ""}
				</div>
			`).appendTo($("body"));
			const $remain = $dialog.find(`[name="remain"]`);
			const $cbChoices = $dialog.find(`input[type="checkbox"]`);

			// Ensure the proper number of items is chosen
			if (count != null || useRange) {
				const targetCount = count || countMax;
				const remainMin = countMax ? `, Minimum: ${countMin}` : "";
				$cbChoices.on("change", function () {
					const $e = $(this);
					let selectedCount = getSelected().length;
					if (selectedCount > targetCount) {
						$e.prop("checked", false);
						selectedCount--;
					}
					$remain.text(`Remaining: ${targetCount - selectedCount}${remainMin}`);
				});
			}

			function getSelected () {
				return $cbChoices.map((i, e) => ({choice: $(e).data("choice"), selected: $(e).prop("checked")})).get()
					.filter(it => it.selected).map(it => it.choice);
			}

			// Accept or reject selection
			$dialog.dialog({
				dialogClass: "no-close",
				buttons: [
					{
						text: "Cancel",
						click: function () {
							$(this).dialog("close");
							$dialog.remove();
							reject(new Error(`User cancelled the prompt`));
						},
					},
					(random ? {
						text: "Choose randomly",
						click: function () {
							document.querySelectorAll("input[type=checkbox]").forEach(el => el.checked = false);
							let alreadySelected = [];
							if (count != null) {
								for (let i = 0; i < count; i++) {
									let randomSelection = dataArray[Math.floor(Math.random() * dataArray.length)];
									while (alreadySelected.includes(randomSelection)) {
										randomSelection = dataArray[Math.floor(Math.random() * dataArray.length)];
									}
									alreadySelected.push(randomSelection);
									let chkbx = document.querySelector(`[data-choice="${randomSelection}"]`);
									chkbx.checked = true;
								}
							} else {
								let loops;
								if (totallyRandom) {
									loops = Math.floor(Math.random() * (countMax - countMin + 1) + countMin);
								} else {
									loops = randomMax ? countMax : countMin;
								}

								for (let i = 0; i < loops; i++) {
									let randomSelection = dataArray[Math.floor(Math.random() * dataArray.length)];
									if (randomMax) {
										while (alreadySelected.includes(randomSelection)) {
											randomSelection = dataArray[Math.floor(Math.random() * dataArray.length)];
										}
									}
									alreadySelected.push(randomSelection);
									let chkbx = document.querySelector(`[data-choice="${randomSelection}"]`);
									chkbx.checked = true;
								}
							}
						},
					} : null),
					{
						text: "OK",
						click: function () {
							const selected = getSelected();
							if (Number.isInteger(countMin) && countMax && count == null && selected.length >= countMin && selected.length <= countMax) {
								$(this).dialog("close");
								$dialog.remove();
								resolve(selected);
							} else if (!useRange && (selected.length === count || count == null)) {
								$(this).dialog("close");
								$dialog.remove();
								resolve(selected);
							} else {
								alert(messageCountIncomplete ?? "Please select more options!");
							}
						},
					},
				].filter(Boolean),
			})
		});
	};

	/**
	 * Prompt the user to choose from a list of radios. Radio button allow exactly one choice.
	 *
	 * @param dataArray options to choose from
	 * @param dataTitle title for the window
	 * @param displayFormatter function to format dataArray for display
	 * @param random show button for random choices
	 * @param additionalHTML additional html code, such as a button
	 * @param note add a note at the bottom of the window
	 * @param messageCountIncomplete message when user does not choose correct number of choices
	 * @return {Promise}
	 */
	d20plus.ui.chooseRadioList = async function (dataArray, dataTitle, {displayFormatter = null, random = null, additionalHTML = null, note = null, messageCountIncomplete = null} = {}) {
		return new Promise((resolve, reject) => {
			// Generate the HTML
			const $dialog = $(`
				<div title="${dataTitle}">
					<div>
						${dataArray.map(it => `<label class="split"><span>${displayFormatter ? displayFormatter(it) : it}</span> <input data-choice="${it}" type="radio" name="${dataTitle}"></label>`).join("")}
					</div>
					${additionalHTML ? `<br><div>${additionalHTML}</div>` : ""}
					${note ? `<br><div class="italic">${note}</div>` : ""}
				</div>
			`).appendTo($("body"));
			const $remain = $dialog.find(`[name="remain"]`);
			const $cbChoices = $dialog.find(`input[type="radio"]`);

			function getSelected () {
				return $cbChoices.map((i, e) => ({choice: $(e).data("choice"), selected: $(e).prop("checked")})).get()
					.filter(it => it.selected).map(it => it.choice);
			}

			// Accept or reject selection
			$dialog.dialog({
				dialogClass: "no-close",
				buttons: [
					{
						text: "Cancel",
						click: function () {
							$(this).dialog("close");
							$dialog.remove();
							reject(new Error(`User cancelled the prompt`));
						},
					},
					(random ? {
						text: "Choose randomly",
						click: function () {
							const randomSelection = dataArray[Math.floor(Math.random() * dataArray.length)];
							const radio = document.querySelector(`[data-choice="${randomSelection}"]`);
							radio.checked = true;
						},
					} : null),
					{
						text: "OK",
						click: function () {
							const selected = getSelected();
							if (selected.length === 1) {
								$(this).dialog("close");
								$dialog.remove();
								resolve(selected);
							} else if (!useRange && (selected.length === count || count == null)) {
								$(this).dialog("close");
								$dialog.remove();
								resolve(selected);
							} else {
								alert(messageCountIncomplete ?? "Please an option!");
							}
						},
					},
				].filter(Boolean),
			})
		});
	};
}

SCRIPT_EXTENSIONS.push(baseUi);
