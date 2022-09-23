function d20plusEngine () {
	d20plus.engine = {};

	d20plus.engine.addProFeatures = () => {
		d20plus.ut.log("Add Pro features");

		d20plus.setMode = d20plus.mod.setMode;
		window.setMode = d20plus.mod.setMode;

		// rebind buttons with new setMode
		const $drawTools = $("#drawingtools");
		const $rect = $drawTools.find(".chooserect");
		const $ellipse = $drawTools.find(".choosecircle");
		const $path = $drawTools.find(".choosepath");
		const $poly = $drawTools.find(".choosepolygon");
		$drawTools.unbind(clicktype).bind(clicktype, function () {
			$(this).hasClass("rect") ? setMode("rect") : $(this).hasClass("ellipse") ? setMode("ellipse") : $(this).hasClass("text") ? setMode("text") : $(this).hasClass("path") ? setMode("path") : $(this).hasClass("drawselect") ? setMode("drawselect") : $(this).hasClass("polygon") && setMode("polygon")
		});
		$rect.unbind(clicktype).bind(clicktype, () => {
			setMode("rect");
			return false;
		});
		$ellipse.unbind(clicktype).bind(clicktype, () => {
			setMode("ellipse");
			return false;
		});
		$path.unbind(clicktype).bind(clicktype, () => {
			setMode("path");
			return false;
		});
		$poly.unbind(clicktype).bind(clicktype, () => {
			setMode("polygon");
			return false;
		});
		$("#rect").unbind(clicktype).bind(clicktype, () => setMode("rect"));
		$("#ellipse").unbind(clicktype).bind(clicktype, () => setMode("ellipse"));
		$("#path").unbind(clicktype).bind(clicktype, () => setMode("path"));

		if (!$(`#fxtools`).length) {
			const $fxMode = $(`<li id="fxtools"/>`).append(`<span class="pictos">e</span>`);
			$fxMode.on("click", () => {
				d20plus.setMode("fxtools");
			});
			$(`#drawingtools`).after($fxMode);
		}

		if (window.is_gm) {
			// add lighting layer tool
			if (!$(`#editinglayer .choosewalls`).length) {
				$(`#editinglayer .choosegmlayer`).after(`
					<li class="choosewalls">
						<span class="pictostwo">r</span> 
						${d20plus.cfg.get("canvas", "showLight") ? __("ui_bar_light_n_barriers") : __("ui_bar_barriers")}
					</li>
				`);
			}

			// add light placement tool
			if (d20plus.cfg.get("canvas", "showLight")) {
				if (!$(`#placelight`).length) {
					const $torchMode = $(`<li class="placelight" tip="Place Light"><span class="pictostwo">t</span></li>`);
					$torchMode.on("click", () => {
						d20plus.setMode("placelight");
						$torchMode.addClass("activebutton");
					});
					$(`#measure`).after($torchMode);
				}
			}

			$("#page-toolbar").on("mousedown", ".js__settings-page", function () {
				let e = d20.Campaign.pages.get($(this).parents(".availablepage").attr("data-pageid"));
				e.view._template = $.jqotec("#tmpl_pagesettings");
			});
		}
	};

	d20plus.engine._removeStatusEffectEntries = () => {
		$(`#5etools-status-css`).html("");
		Object.keys(d20.token_editor.statusmarkers).filter(k => k.startsWith("5etools_")).forEach(k => delete d20.token_editor.statusmarkers[k]);
	};

	d20plus.engine.enhanceStatusEffects = () => {
		d20plus.ut.log("Enhance status effects");
		$(`head`).append(`<style id="5etools-status-css"/>`);

		d20plus.mod.overwriteStatusEffects();

		d20.engine.canvas.off("object:added");
		d20.engine.canvas.on("object:added", d20plus.mod.overwriteStatusEffects);

		// the holy trinity
		// d20.engine.canvas.on("object:removed", () => console.log("added"));
		// d20.engine.canvas.on("object:removed", () => console.log("removed"));
		// d20.engine.canvas.on("object:modified", () => console.log("modified"));

		$(document).off("mouseenter", ".markermenu");
		$(document).on("mouseenter", ".markermenu", d20plus.mod.mouseEnterMarkerMenu)
	};

	d20plus.engine.swapTemplates = () => {
		document.dispatchEvent(new Event(`b20initTemplates`));
		d20plus.ut.log("Swapping templates...");
		$("#tmpl_charactereditor").html($(d20plus.html.characterEditor).html());
		$("#tmpl_handouteditor").html($(d20plus.html.handoutEditor).html());
		$("#tmpl_deckeditor").html($(d20plus.html.deckEditor).html());
		$("#tmpl_cardeditor").html($(d20plus.html.cardEditor).html());
		// ensure tokens have editable sight
		$("#tmpl_tokeneditor").replaceWith(d20plus.html.tokenEditor);
		// show dynamic lighting/etc page settings
		$("#tmpl_pagesettings").replaceWith(d20plus.engine._makePageSettings());
	};

	d20plus.engine._makePageSettings = () => {
		return `<script id='tmpl_pagesettings' type='text/html'>
			<ul class='nav nav-tabs pagedetails_navigation'>
				${d20plus.html.pageSettingsNavTabs}
			</ul>
			<div class='tab-content'>
				${d20plus.html.pageSettings}
				${d20plus.html.pageSettingsWeather}
				${d20plus.html.pageSettingsViews}
			</div>
		</script>`;
	};

	d20plus.engine.enhancePageSelector = () => {
		d20plus.ut.log("Enhancing page selector");

		let updatePageOrder = function () {
			d20plus.ut.log("Saving page order...");
			let pos = 0;
			$("#page-toolbar .pages .chooseablepage").each(function () {
				let page = d20.Campaign.pages.get($(this).attr("data-pageid"));
				page && page.save({
					placement: pos,
				});
				pos++;
			});
			d20.pagetoolbar.noReload = false;
			d20.pagetoolbar.refreshPageListing();
		};

		function overwriteDraggables () {
			// make them draggable on both axes
			$("#page-toolbar .pages").sortable("destroy");
			$("#page-toolbar .pages").sortable({
				items: "> .chooseablepage",
				start: function () {
					d20.pagetoolbar.noReload = true;
				},
				stop: function () {
					updatePageOrder()
				},
				distance: 15,
			}).addTouch();
			$("#page-toolbar .playerbookmark").draggable("destroy");
			$("#page-toolbar .playerbookmark").draggable({
				revert: "invalid",
				appendTo: "#page-toolbar",
				helper: "original",
			}).addTouch();
			$("#page-toolbar .playerspecificbookmark").draggable("destroy");
			$("#page-toolbar .playerspecificbookmark").draggable({
				revert: "invalid",
				appendTo: "#page-toolbar",
				helper: "original",
			}).addTouch();
		}

		overwriteDraggables();
		$(`#page-toolbar`).css("top", "calc(-90vh + 40px)");

		const originalFn = d20.pagetoolbar.refreshPageListing;
		// original function is debounced at 100ms, so debounce this at 110ms and hope for the best
		const debouncedOverwrite = _.debounce(() => {
			overwriteDraggables();
			// fire an event for other parts of the script to listen for
			const pageChangeEvt = new Event(`VePageChange`);
			d20plus.ut.log("Firing page-change event");
			document.dispatchEvent(pageChangeEvt);
		}, 110);
		d20.pagetoolbar.refreshPageListing = () => {
			originalFn();
			debouncedOverwrite();
		}

		$(`body`).on("click", ".weather input[type=range]", function (event) {
			if (this.name) $(`.${this.name}`).val(this.value);
		}).on("mouseup", "li.dl", function (event) {
			// process Dynamic Lighting tabs
			const $dynLightTab = $(event.target).closest("li.dl");
			const $isTabAnchor = $(event.target).closest("a");
			if (!$dynLightTab.hasClass("active")) {
				setTimeout(() => {
					if (!$dynLightTab.hasClass("legacy")) $(`[data-tab=lighting]:visible`).click();
					else $(`[data-tab=legacy-lighting]:visible`).click();
				}, 10);
			}
			if ($isTabAnchor.data("tab") === "lighting") $dynLightTab.removeClass("legacy");
			if ($isTabAnchor.data("tab") === "legacy-lighting") $dynLightTab.addClass("legacy");
		}).on("mousedown", ".chooseablepage .js__settings-page", function () {
			const $this = $(this);
			d20plus.engine._lastSettingsPageId = $this.closest(`[data-pageid]`).data("pageid");
		}).on("click", ".chooseablepage .js__settings-page", function () {
			setTimeout(() => d20plus.engine.enhancePageSettings(), 50);
		});
	};

	d20plus.engine.enhancePageSettings = () => {
		if (!d20plus.engine._lastSettingsPageId) return;
		const page = d20.Campaign.pages.get(d20plus.engine._lastSettingsPageId);
		if (page && page.get) {
			const $dialog = $(`.pagedetails_navigation:visible`).closest(`.ui-dialog`);
			// if editing active page then close pages list and add Apply button
			if (d20.Campaign.activePage().id === d20plus.engine._lastSettingsPageId) {
				const $barPage = $(`#page-toolbar`);
				const $overlay = $(`.ui-widget-overlay`);
				const templateApply = `<button type="button" class="btn btn-apply" title="Apply settings for current page">Apply</button>`;
				if (!$barPage.hasClass("closed")) {
					$barPage.find(`.handle`).click();
					$overlay.remove();
				}
				$dialog.find(`.btn-primary:visible`).before(templateApply);
				$(`.btn-apply`).on("click", d20plus.engine._applySettings);
			}
			// process options within open dialog
			if ($dialog[0]) {
				const $pageTitle = $dialog.find(`.ui-dialog-title:visible`);
				d20plus.engine._handleCustomOptions($dialog.find(`.dialog .tab-content`));
				if ($pageTitle[0] && !$(".ui-dialog-pagename:visible")[0]) {
					$pageTitle.after(`<span class="ui-dialog-pagename">${page.get("name")}</span>`);
					$dialog.find(`.btn-primary:visible`).on("mousedown", () => {
						d20plus.engine._handleCustomOptions($dialog.find(`.dialog .tab-content`), "save");
					});
					// closed editors behave strangely, so replace Close with Cancel
					$dialog.find(`.ui-dialog-titlebar-close:visible`).on("mousedown", () => {
						$dialog.find(`.ui-dialog-buttonpane .btn:not(.btn-apply):not(.btn-primary)`).click();
					});
				}
			}
		}
	}

	d20plus.engine._applySettings = () => {
		const $dialog = $(`.pagedetails_navigation:visible`).closest(".ui-dialog");
		const activeTab = $(`li.active:visible:not(.dl) > a`).data("tab");
		const activeTabScroll = $dialog.find(`.ui-dialog-content`).scrollTop();
		const pageid = d20plus.engine._lastSettingsPageId;
		if ($dialog[0]) {
			$(`#page-toolbar`).css("visibility", "hidden");
			d20plus.engine._handleCustomOptions($dialog.find(`.dialog .tab-content`), "save");
			setTimeout(() => {
				$dialog.find(`.btn-primary:visible`).click();
				$(`#page-toolbar .handle`).click();
				$(`.chooseablepage[data-pageid=${pageid}] .js__settings-page`).click();
				$(`.nav-tabs:visible [data-tab=${activeTab}]`).click();
				$(`.ui-dialog-content:visible`).scrollTop(activeTabScroll);
				setTimeout(() => {
					$(`#page-toolbar`).css("visibility", "unset");
				}, 1000);
			}, 10);
		}
	}

	d20plus.engine._handleCustomOptions = (dialog, doSave) => {
		const page = d20.Campaign.pages.get(d20plus.engine._lastSettingsPageId);
		if (!page || !page.get) return;
		[
			"weather",
			"views",
		].forEach(category => $.each(d20plus[category].props, (name, deflt) => {
			if (doSave) {
				d20plus.engine._saveOption(page, dialog, {name, deflt});
			} else {
				d20plus.engine._getOption(page, dialog, {name, deflt});
			}
		}));
		if (doSave) {
			page.save();
		}
	}

	d20plus.engine._saveOption = (page, dialog, prop) => {
		const $e = dialog.find(`[name="${prop.name}"]`);
		const val = $e.is(":checkbox") ? !!$e.prop("checked") : $e.val();
		if (val && val !== prop.deflt) {
			page.attributes[`bR20cfg_${prop.name}`] = val;
		} else {
			if (page.attributes.hasOwnProperty(`bR20cfg_${prop.name}`)) {
				page.attributes[`bR20cfg_${prop.name}`] = null;
			}
		}
	}

	d20plus.engine._getOption = (page, dialog, prop) => {
		const val = page.get(`bR20cfg_${prop.name}`) || prop.deflt;
		dialog.find(`[name="${prop.name}"]`).each((i, e) => {
			const $e = $(e);
			if ($e.is(":checkbox")) {
				$e.prop("checked", !!val);
			} else if ($e.is("input[type=range]")) {
				$(`.${prop.name}`).val(val);
				$e.val(val);
			} else {
				$e.val(val);
			}
		});
	}

	d20plus.engine.initQuickSearch = ($iptSearch, $outSearch) => {
		$iptSearch.on("keyup", () => {
			const searchVal = ($iptSearch.val() || "").trim();
			$outSearch.empty();
			if (searchVal.length <= 2) return; // ignore 2 characters or less, for performance reasons
			const found = $(`#journal .content`).find(`li[data-itemid]`).filter((i, ele) => {
				const $ele = $(ele);
				return $ele.find(`.name`).text().trim().toLowerCase().includes(searchVal.toLowerCase());
			});
			if (found.length) {
				$outSearch.append(`<p><b>Search results:</b></p>`);
				const $outList = $(`<ol class="dd-list Vetools-search-results"/>`);
				$outSearch.append($outList);
				found.clone().addClass("Vetools-draggable").appendTo($outList);
				$outSearch.append(`<hr>`);
				$(`.Vetools-search-results .Vetools-draggable`).draggable({
					revert: true,
					distance: 10,
					revertDuration: 0,
					helper: "clone",
					handle: ".namecontainer",
					appendTo: "body",
					scroll: true,
					start: function () {
						$("#journalfolderroot").addClass("externaldrag")
					},
					stop: function () {
						$("#journalfolderroot").removeClass("externaldrag")
					},
				});
			}
		});
	};

	/* eslint-disable */

	d20plus.engine.getSelectedToMove = () => {
		const n = [];
		for (var l = d20.engine.selected(), c = 0; c < l.length; c++)
			n.push(l[c]);
	};

	d20plus.engine.forwardOneLayer = (n) => {
		d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
			_.each(n, function (e) {
				d20.engine.canvas.bringForward(e)
			}),
			d20.Campaign.activePage().debounced_recordZIndexes()
	};

	d20plus.engine.backwardOneLayer = (n) => {
		d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
			_.each(n, function (e) {
				d20.engine.canvas.sendBackwards(e)
			}),
			d20.Campaign.activePage().debounced_recordZIndexes()
	};

	// previously "enhanceSnap"
	d20plus.engine.enhanceMouseDown = () => {
		const R = d20plus.overwrites.canvasHandlerDown

		if (FINAL_CANVAS_MOUSEDOWN_LIST.length) {
			FINAL_CANVAS_MOUSEDOWN = (FINAL_CANVAS_MOUSEDOWN_LIST.find(it => it.on === d20.engine.final_canvas) || {}).listener;
		}

		if (FINAL_CANVAS_MOUSEDOWN) {
			d20plus.ut.log("Enhancing hex snap");
			d20.engine.final_canvas.removeEventListener("mousedown", FINAL_CANVAS_MOUSEDOWN);
			d20.engine.final_canvas.addEventListener("mousedown", R);
		}

		// add sub-grid snap
		d20.engine.snapToIncrement = function(e, t) {
			t *= Number(d20plus.cfg.getOrDefault("canvas", "gridSnap"));
			return t * Math.round(e / t);
		}
	};

	d20plus.engine.enhanceMouseUp = () => { // P

	};

	// needs to be called after `enhanceMeasureTool()`
	d20plus.engine.enhanceMouseMove = () => {
		// add missing vars
		var i = d20.engine.canvas;

		// Roll20 bug (present as of 2019-5-25) workaround
		//   when box-selecting + moving tokens, the "object:moving" event throws an exception
		//   try-catch-ignore this, because it's extremely annoying
		const cachedFire = i.fire.bind(i);
		i.fire = function (namespace, opts) {
			if (namespace === "object:moving") {
				try {
					cachedFire(namespace, opts);
				} catch (e) {}
			} else {
				cachedFire(namespace, opts);
			}
		};

		const I = d20plus.overwrites.canvasHandlerMove

		if (FINAL_CANVAS_MOUSEMOVE_LIST.length) {
			FINAL_CANVAS_MOUSEMOVE = (FINAL_CANVAS_MOUSEMOVE_LIST.find(it => it.on === d20.engine.final_canvas) || {}).listener;
		}

		if (FINAL_CANVAS_MOUSEMOVE) {
			d20plus.ut.log("Enhancing mouse move");
			d20.engine.final_canvas.removeEventListener("mousemove", FINAL_CANVAS_MOUSEMOVE);
			d20.engine.final_canvas.addEventListener("mousemove", I);
		}
	};

	/* eslint-enable */

	d20plus.engine.tokenRepresentsPc = (token) => {
		if (!token || !token.get) return undefined;
		if (token.get("type") !== "image") return false;
		if (!token.character) return false;
		if (!token.character.attribs.length && !token.character.attribs.fetching) {
			token.character.attribs.fetch(token.character.attribs);
			token.character.attribs.fetching = true;
		} else if (token.character.attribs.length) {
			if (token.character.attribs.fetching) delete token.character.attribs.fetching;
			const attr = token.character.attribs.models.find(atrib => atrib.attributes.name === "npc");
			if (attr) {
				if (attr.attributes.current === "0") return true;
				else return false;
			}
		}
	}

	d20plus.engine.addLineCutterTool = () => {
		const $btnTextTool = $(`.choosetext`);

		const $btnSplitTool = $(`<li class="choosesplitter">✂️ Line Splitter</li>`).click(() => {
			d20plus.setMode("line_splitter");
		});

		$btnTextTool.after($btnSplitTool);
	};

	d20plus.engine._tokenHover = null;
	d20plus.engine._drawTokenHover = () => {
		$(`.Vetools-token-hover`).remove();
		if (!d20plus.engine._tokenHover || !d20plus.engine._tokenHover.text) return;

		const pt = d20plus.engine._tokenHover.pt;
		const txt = unescape(d20plus.engine._tokenHover.text);

		$(`body`).append(`<div class="Vetools-token-hover" style="top: ${pt.y * d20.engine.canvasZoom}px; left: ${pt.x * d20.engine.canvasZoom}px">${txt}</div>`);
	};
	d20plus.engine.addTokenHover = () => {
		// gm notes on shift-hover
		const cacheRenderLoop = d20.engine.renderLoop;
		d20.engine.renderLoop = () => {
			d20plus.engine._drawTokenHover();
			cacheRenderLoop();
		};

		// store data for the rendering function to access
		d20.engine.canvas.on("mouse:move", (data, ...others) => {
			// enable hover from GM layer -> token layer
			let hoverTarget = data.target;
			if (data.e && window.currentEditingLayer === "gmlayer") {
				const cache = window.currentEditingLayer;
				window.currentEditingLayer = "objects";
				hoverTarget = d20.engine.canvas.findTarget(data.e, null, true);
				window.currentEditingLayer = cache;
			}

			if (data.e.shiftKey && hoverTarget && hoverTarget.model) {
				d20.engine.redrawScreenNextTick();
				const gmNotes = hoverTarget.model.get("gmnotes");
				const pt = d20.engine.canvas.getPointer(data.e);
				pt.x -= d20.engine.currentCanvasOffset[0];
				pt.y -= d20.engine.currentCanvasOffset[1];
				d20plus.engine._tokenHover = {
					pt: pt,
					text: gmNotes,
					id: hoverTarget.model.id,
				};
			} else {
				if (d20plus.engine._tokenHover) d20.engine.redrawScreenNextTick();
				d20plus.engine._tokenHover = null;
			}
		})
	};

	d20plus.engine.enhanceMarkdown = () => {
		const OUT_STRIKE = "<span style='text-decoration: line-through'>$1</span>";

		/* eslint-disable */

		// BEGIN ROLL20 CODE
		window.Markdown.parse = function(e) {
			{
				var t = e
					, n = []
					, i = [];
				-1 != t.indexOf("\r\n") ? "\r\n" : -1 != t.indexOf("\n") ? "\n" : ""
			}
			return t = t.replace(/{{{([\s\S]*?)}}}/g, function(e) {
				return n.push(e.substring(3, e.length - 3)),
					"{{{}}}"
			}),
				t = t.replace(new RegExp("<pre>([\\s\\S]*?)</pre>","gi"), function(e) {
					return i.push(e.substring(5, e.length - 6)),
						"<pre></pre>"
				}),
				// BEGIN MOD
				t = t.replace(/~~(.*?)~~/g, OUT_STRIKE),
				// END MOD
				t = t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
				t = t.replace(/\*(.*?)\*/g, "<em>$1</em>"),
				t = t.replace(/``(.*?)``/g, "<code>$1</code>"),
				t = t.replace(/\[([^\]]+)\]\(([^)]+(\.png|\.gif|\.jpg|\.jpeg))\)/g, '<a href="$2"><img src="$2" alt="$1" /></a>'),
				t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>'),
				t = t.replace(new RegExp("<pre></pre>","g"), function() {
					return "<pre>" + i.shift() + "</pre>"
				}),
				t = t.replace(/{{{}}}/g, function() {
					return n.shift()
				})
		};
		// END ROLL20 CODE

		/* eslint-enable */

		// after a short delay, replace any old content in the chat
		setTimeout(() => {
			$(`.message`).each(function () {
				$(this).html($(this).html().replace(/~~(.*?)~~/g, OUT_STRIKE))
			})
		}, 2500);
	};

	d20plus.engine.enhancePathWidths = () => {
		const $selThicc = $(`#path_width`).css("width", "150px");
		$selThicc.append(`
				<option value="5">Custom 1 (5 px.)</option>
				<option value="5">Custom 2 (5 px.)</option>
				<option value="5">Custom 3 (5 px.)</option>
			`);
		const $iptThicc = $(`<input type="number" style="max-width: 50px;">`).hide();
		const $lblPixels = $(`<label style="display: inline-flex;"> pixels</label>`).hide();
		$selThicc.after($lblPixels).after($iptThicc);

		let $selOpt = null;
		$selThicc.on("change", () => {
			$selOpt = $selThicc.find(`option:selected`);
			const txt = $selOpt.text();
			if (txt.startsWith("Custom")) {
				const thicc = /\((.*?) px\.\)/.exec(txt)[1];
				$lblPixels.show();
				$iptThicc.show().val(Number(thicc));
			} else {
				$lblPixels.hide();
				$iptThicc.hide();
			}
		});

		$iptThicc.on("keyup", () => {
			if (!$selOpt) $selOpt = $selThicc.find(`option:selected`);
			if ($selOpt) {
				const clean = Math.round(Math.max(1, Number($iptThicc.val())));
				$selOpt.val(`${clean}`);
				$selOpt.text($selOpt.text().replace(/\(\d+ px\.\)/, `(${clean} px.)`));
				d20.engine.canvas.freeDrawingBrush.width = clean;
			}
		});
	};

	d20plus.engine.enhanceTransmogrifier = () => {
		JqueryUtil.addSelectors();

		$("#transmogrifier").on("click", () => {
			setTimeout(() => {
				const $btnAlpha = $(`#vetools-transmog-alpha`);
				if (!$btnAlpha.length) {
					const $prependTarget = $(`.ui-dialog-title:textEquals(transmogrifier)`).first().parent().parent().find(`.ui-dialog-content`);
					$(`<button id="#vetools-transmog-alpha" class="btn btn default" style="margin-bottom: 5px;">Sort Items Alphabetically</button>`).on("click", () => {
						// coped from a bookmarklet
						$("iframe").contents().find(".objects").each((c, e) => { let $e = $(e); $e.children().sort((a, b) => { let name1 = $(a).find(".name").text().toLowerCase(); let name2 = $(b).find(".name").text().toLowerCase(); let comp = name1.localeCompare(name2); return comp; }).each((i, c) => $e.append(c)); });
					}).prependTo($prependTarget);
				}
			}, 35);
		})
	};

	d20plus.engine.layersIsMarkedAsHidden = (layer) => {
		const page = d20.Campaign.activePage();
		if (page && page.get && page.get(`bR20cfg_hidden`)) return page.get(`bR20cfg_hidden`).search(layer) > -1;
	}

	d20plus.engine.layersVisibilityCheck = () => {
		const layers = ["floors", "background", "foreground", "roofs"];
		layers.forEach((layer) => {
			const isHidden = d20.engine.canvas._objects.some((o) => {
				if (o.model) return o.model.get("layer") === `hidden_${layer}`;
			}) || d20plus.engine.layersIsMarkedAsHidden(layer);
			d20plus.engine.layerVisibilityOff(layer, isHidden, true);
		});
		if (!$(`#floatinglayerbar`).hasClass("objects")
			&& window.currentEditingLayer === "objects") $(`#floatinglayerbar`).addClass("objects");
	}

	d20plus.engine.layersToggle = (event) => {
		event.stopPropagation();
		const target = event.target;
		const page = d20.Campaign.activePage();
		const layer = target.parentElement.className.replace(/.*choose(\w+?)\b.*/, "$1");
		if (!page.get(`bR20cfg_hidden`)) page.set(`bR20cfg_hidden`, "");
		if (d20plus.engine.layersIsMarkedAsHidden(layer)) {
			d20plus.engine.layerVisibilityOff(layer, false);
		} else {
			d20plus.engine.layerVisibilityOff(layer, true);
		}
	};

	d20plus.engine.layerVisibilityOff = (layer, off, force) => {
		const menuButton = $(`#editinglayer .choose${layer}`);
		const secondaryButton = $(`#floatinglayerbar li.choose${layer}`);
		const page = d20.Campaign.activePage();
		if (off) {
			if (d20plus.engine.objectsHideUnhide("layer", layer, "layeroff", false) || force) {
				if (window.currentEditingLayer === layer) $(`#editinglayer li.chooseobjects`).click();
				menuButton.addClass("stashed");
				secondaryButton.addClass("off");
				if (!d20plus.engine.layersIsMarkedAsHidden(layer)) {
					page.set(`bR20cfg_hidden`, `${page.get(`bR20cfg_hidden`)} ${layer}`);
					page.save();
				}
			}
		} else {
			d20plus.engine.objectsHideUnhide("layer", layer, "layeroff", true);
			menuButton.removeClass("stashed");
			secondaryButton.removeClass("off");
			if (d20plus.engine.layersIsMarkedAsHidden(layer)) {
				page.set(`bR20cfg_hidden`, page.get(`bR20cfg_hidden`).replace(` ${layer}`, ""));
				page.save();
			}
		}
	}

	d20plus.engine._objectsStashProps = (obj, visible) => {
		[
			"emits_bright_light",
			"emits_low_light",
			"has_directional_bright_light",
			"has_directional_dim_light",
			"bar1_value",
			"bar2_value",
			"bar3_value",
			"showname",
		].each((prop) => {
			if (!visible) {
				if (obj.attributes[prop]) {
					obj.attributes[`bR20_${prop}`] = obj.attributes[prop];
					obj.attributes[prop] = false;
				}
			} else {
				if (obj.attributes[`bR20_${prop}`]) {
					obj.attributes[prop] = obj.attributes[`bR20_${prop}`];
					obj.attributes[`bR20_${prop}`] = null;
				}
			}
		});
	}

	d20plus.engine._graphicsStashToRight = (_this, visible) => {
		if (typeof _this.left !== "number") return;
		if (!visible) {
			const page = d20.Campaign.pages.get(_this.page_id);
			const newLeft = _this.left + page.get("width") * 70;
			_this.bR20_left = _this.left;
			_this.left = newLeft;
		} else {
			if (_this.bR20_left) {
				_this.left = _this.bR20_left;
				_this.bR20_left = null;
			}
		}
	}

	d20plus.engine.objectsHideUnhide = (query, val, prefix, visible) => {
		let some = false;
		for (const o of d20.engine.canvas._objects) {
			if (!o.model) continue;
			if (`${o.model.get(query)}`.search(val) > -1) {
				const _this = o.model.attributes;
				const {layer} = o.model.attributes;
				if (visible) {
					if (_this.bR20_hidden && _this.bR20_hidden.search(prefix) > -1) {
						_this.bR20_hidden = _this.bR20_hidden.replace(`${prefix}_`, "");
						if (_this.type !== "path") {
							_this.layer = layer.replace(`${prefix}_`, "");
							if (!_this.bR20_hidden) {
								d20plus.engine._objectsStashProps(o.model, true);
							}
						} else if (!_this.bR20_hidden) {
							d20plus.engine._graphicsStashToRight(_this, true);
						}
						o.saveState();
						o.model.save();
						some = true;
					}
				} else {
					if (!_this.bR20_hidden || _this.bR20_hidden.search(prefix) === -1) {
						_this.bR20_hidden = `${prefix}_${_this.bR20_hidden || ""}`;
						if (_this.type !== "path") {
							_this.layer = `${prefix}_${layer}`;
							d20plus.engine._objectsStashProps(o.model, false);
						} else {
							d20plus.engine._graphicsStashToRight(_this, false);
						}
						o.saveState();
						o.model.save();
						some = true;
					}
				}
			}
		}
		return some;
	};

	d20plus.engine.addLayers = () => {
		d20plus.ut.log("Adding layers");

		d20plus.mod.editingLayerOnclick();
		if (window.is_gm) {
			// Override icons a bit
			$(`#floatingtoolbar .chooseobjects .pictos`).html("U");
			$(`#editinglayer .submenu .choosegmlayer`).html(`
				<span class="pictos">E</span>
				${__("ui_bar_gm")}
			`);

			$(`#floatingtoolbar .choosemap`).html(`
				<span class="pictos" style="padding: 0 3px 0 3px;">G</span> 
				${__("ui_bar_map")}
			`);

			// Add layers to layer dropdown
			if (d20plus.cfg.getOrDefault("canvas", "showBackground")) {
				$(`#floatingtoolbar .choosemap`).after(`
					<li class="choosebackground">
						<span class="pictos">a</span>
						${__("ui_bar_bg")}
						<span class="pictos layer_toggle" title="${__("ui_bar_toggle_layer_title")}">E</span>
					</li>
				`);
				$(".choosebackground > .layer_toggle").on("click", d20plus.engine.layersToggle);
			}

			if (d20plus.cfg.getOrDefault("canvas", "showFloors")) {
				$(`#floatingtoolbar .choosemap`).after(`
					<li class="choosefloors">
						<span class="pictos">I</span>
						${__("ui_bar_fl")}
						<span class="pictos layer_toggle" title="${__("ui_bar_toggle_layer_title")}">E</span>
					</li>
				`);
				$(".choosefloors > .layer_toggle").on("click", d20plus.engine.layersToggle);
			}

			if (d20plus.cfg.getOrDefault("canvas", "showRoofs")) {
				$(`#floatingtoolbar .chooseobjects`).after(`
					<li class="chooseroofs">
						<span class="pictos">H</span>
						${__("ui_bar_rf")}
						<span class="pictos layer_toggle" title="${__("ui_bar_toggle_layer_title")}">E</span>
					</li>
				`);
				$(".chooseroofs > .layer_toggle").on("click", d20plus.engine.layersToggle);
			}

			if (d20plus.cfg.getOrDefault("canvas", "showForeground")) {
				$(`#floatingtoolbar .choosegmlayer`).before(`
					<li class="chooseforeground">
						<span class="pictos">B</span>
						${__("ui_bar_fg")}
						<span class="pictos layer_toggle" title="${__("ui_bar_toggle_layer_title")}">E</span>
					</li>
				`);
				$(".chooseforeground > .layer_toggle").on("click", d20plus.engine.layersToggle);
			}

			if (d20plus.cfg.getOrDefault("canvas", "showWeather")) {
				$(`#floatingtoolbar .choosewalls`).after(`
					<li class="chooseweather">
						<span class="pictos">C</span>
						${__("ui_bar_we")}
					</li>
				`);
			}
		}

		d20.engine.canvas._renderAll = _.bind(d20plus.mod.renderAll, d20.engine.canvas);
		d20.engine.canvas._layerIteratorGenerator = d20plus.mod.layerIteratorGenerator;
	};

	d20plus.engine.removeLinkConfirmation = function () {
		d20.utils.handleURL = d20plus.mod.handleURL;
		$(document).off("click", "a").on("click", "a", d20.utils.handleURL);
	};

	d20plus.engine.repairPrototypeMethods = function () {
		d20plus.mod.fixHexMethods();
		d20plus.mod.fixVideoMethods();
	};

	d20plus.engine.disableFrameRecorder = function () {
		if (d20.engine.frame_recorder) {
			d20.engine.frame_recorder.active = false;
			d20.engine.frame_recorder._active = false;
		}
	};
}

SCRIPT_EXTENSIONS.push(d20plusEngine);
