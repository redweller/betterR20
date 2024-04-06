function baseViews () {
	d20plus.views = {};

	d20plus.views.props = {
		"viewsEnable": false,
		"views0Name": "",
		"views1Enable": false,
		"views1Exclusive": false,
		"views1Name": "",
		"views2Enable": false,
		"views2Exclusive": false,
		"views2Name": "",
		"views3Enable": false,
		"views3Exclusive": false,
		"views3Name": "",
		"views4Enable": false,
		"views4Exclusive": false,
		"views4Name": "",
	};

	d20plus.views._initMenuActions = () => {
		$(`body`).on("click", ".drawer-views > .toolbar-button-outer", function () {
			const page = d20.Campaign.activePage();
			const items = $(".drawer-views > .toolbar-button-outer")
			const id = items.index(this);
			const startgroupindex = (() => { for (let i = id; i >= 0; i--) { if (!page.get(`bR20cfg_views${i}Exclusive`)) return i; } })();
			const endgroupindex = (() => { for (let i = id + 1; i <= 5; i++) { if (!page.get(`bR20cfg_views${i}Exclusive`)) return i - 1; } })();
			if (page.get(`bR20cfg_views${id}Off`)) {
				d20plus.views.changeViewState(id, true);
				for (let i = startgroupindex; i <= endgroupindex; i++) {
					if (i !== id) d20plus.views.changeViewState(i, false);
				}
			} else {
				d20plus.views.changeViewState(id, false);
			}
		});
	}

	d20plus.views._initViewsCss = () => {
		d20plus.ut.dynamicStyles("viewsSelect").html(`
			.ui-dialog label.half {display: inline-block; margin-bottom: 6px;}
			.ui-dialog label.half span {margin-right: 20px;}
			#floatingtoolbar ul.chooseViews li {border-width: 1px;border-style: solid; border-color: var(--dark-surface1);}
			#floatingtoolbar ul.chooseViews:empty {display:none;}
			#floatingtoolbar ul.chooseViews li {height: 19px; border-radius: 12px;}
			#floatingtoolbar ul.chooseViews li.fst {border-bottom-left-radius: 0px; border-bottom-right-radius: 0px; border-bottom-width: 0px;}
			#floatingtoolbar ul.chooseViews li.lst {border-top-left-radius: 0px; border-top-right-radius: 0px; border-top-width: 0px;}
			#floatingtoolbar ul.chooseViews li.mst {border-radius: 0px; border-top: 0px; border-bottom: 0px;}
			#floatingtoolbar ul.chooseViews .pictos {padding: 0 3px 0 3px;}
			#floatingtoolbar ul.chooseViews .view_toggle {padding: 4px 8px 3px 4px; margin-right: 8px; border-right: 1px solid; border-color: inherit;}
			#floatingtoolbar ul.chooseViews li.off .view_toggle .pictos {color: #fff0;}
		`);
	}

	d20plus.views._initLayerMenu = () => {
		d20plus.views.layerMenu = $(`<div></div>`)
			.appendTo($(".drawer-outer.b20"));
	}

	d20plus.views.populateMenu = () => {
		const page = d20.Campaign.activePage();
		if (!page) return;
		if (!page.get("bR20cfg_viewsEnable")) return d20plus.views.layerMenu.html("");
		let menuhtml = `<div class="drawer-views">`;
		for (let id = 0; id <= 4; id++) {
			if (id && !page.get(`bR20cfg_views${id}Enable`)) continue;
			const viewname = page.get(`bR20cfg_views${id}Name`) || (id ? `View ${id}` : `Default view`);
			const viewicon = page.get(`bR20cfg_views${id}Icon`) || "P";
			const exclCheck = (id) => { return page.get(`bR20cfg_views${id}Exclusive`) };
			const viewexcl = exclCheck(id) ? (exclCheck(id + 1) ? "middle" : "last") : (exclCheck(id + 1) ? "first" : "");
			const viewactive = page.get(`bR20cfg_views${id}Off`) ? "" : "active";
			menuhtml += `<div id="view-${id}-button" class="toolbar-button-outer ${[viewexcl, viewactive].join(" ")}" style="color: var(--vtt-toolbar-active-selection-color);">
			<div class="toolbar-button-mid">
				<div class="view-button-inner" data-viewId="${id}" tabindex="0">
					<div class="view-icon-slot">
						<span style="font-size: 1.5em;font-family: Pictos;" class="grimoire__roll20-icon">${viewicon}</span>
					</div>
				</div>
				<span class="label">${viewname}</span>
			</div>
			<div class="toolbar-tooltip-outer" style="filter: initial; top: 6px;">
				<div class="toolbar-tooltip-caret"></div>
				<div class="toolbar-tooltip-inner">
					<span class="toolbar-tooltip-label text-sm-medium">Toggle ${viewname}</span>
					<span class="toolbar-shortcut-label">[b20]</span>
				</div>
			</div>
		</div>`;
		}
		menuhtml += `</div>`;
		d20plus.views.layerMenu.html(menuhtml);
	}

	d20plus.views.assignPortals = () => {
		let menuhtml = "";
		const page = d20.Campaign.activePage();
		const getPortal = (type) => d20.engine[`selected${type}s`]()[0];
		const portal = getPortal("Door") || getPortal("Window");
		if (!page?.get("bR20cfg_viewsEnable")) return;
		for (let id = 0; id <= 4; id++) {
			if (id && !page.get(`bR20cfg_views${id}Enable`)) continue;
			const viewName = page.get(`bR20cfg_views${id}Name`) || (id ? `View ${id}` : `Default view`);
			const viewId = `bR20_view${id}`;
			menuhtml += `<option value="${viewId}">${viewName}</option>`;
		}
		if (menuhtml) {
			const $viewAssigner = $(`
				<div>
					Select View from the list below:
					<select id="viewId">${menuhtml}</select>
					<br>This view will be assigned to
					${!portal ? "all unassigned portals (doors and windows)" : "the selected portal (door or window)"}
				</div>
			`).dialog({
				autoopen: true,
				title: "Choose view",
				buttons: {
					"Cancel": () => { $viewAssigner.off(); $viewAssigner.dialog("destroy").remove() },
					"Assign": () => {
						const chosen = $viewAssigner.find(`#viewId`).val();
						const assigned = (p) => {
							for (let id = 0; id <= 4; id++) if (p.attributes[`bR20_view${id}`]) return true;
						}
						[`doors`, `windows`].forEach(e => page[e].models.forEach(it => {
							if (assigned(it)) return d20plus.ut.log("Taken");
							it.attributes[chosen] = true;
							it.save();
						}));
						$viewAssigner.off(); $viewAssigner.dialog("destroy").remove();
					},
				},
				close: () => { $viewAssigner.off(); $viewAssigner.dialog("destroy").remove() },
			})
		}
	};

	d20plus.views.changeViewState = (id, state) => {
		const page = d20.Campaign.activePage();
		const menuItem = $(".drawer-views > .toolbar-button-outer").get(id);
		if (state) {
			$(menuItem).addClass("active");
			page.set(`bR20cfg_views${id}Off`, false);
			d20plus.engine.objectsHideUnhide(`bR20_view${id}`, true, `view${id}off`, true);
			d20plus.engine.portalsHideUnhide(`bR20_view${id}`, `view${id}off`, true);
		} else {
			$(menuItem).removeClass("active");
			page.set(`bR20cfg_views${id}Off`, true);
			d20plus.engine.objectsHideUnhide(`bR20_view${id}`, true, `view${id}off`, false);
			d20plus.engine.portalsHideUnhide(`bR20_view${id}`, `view${id}off`, false);
		}
		page.save();
		$(`#editinglayer .choose${window.currentEditingLayer}`).click();
	}

	d20plus.views.addViews = () => {
		if (window.is_gm) {
			d20plus.views._initViewsCss();
			d20plus.views._initLayerMenu();
			d20plus.views._initMenuActions();
		}
	}
}

SCRIPT_EXTENSIONS.push(baseViews);