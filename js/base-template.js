const baseTemplate = function () {
	d20plus.template = {};

	d20plus.template.swapTemplates = () => {
		d20plus.ut.log("Swapping templates...");
		$("#tmpl_charactereditor").html($(d20plus.template_charactereditor).html());
		$("#tmpl_handouteditor").html($(d20plus.template_handouteditor).html());
		$("#tmpl_deckeditor").html($(d20plus.template.deckeditor).html());
		$("#tmpl_cardeditor").html($(d20plus.template.cardeditor).html());
	};

	d20plus.template.neatActionsView = (id) => {
		return `
			<span class="pictos ctx__layer-icon"><$ if (d20.Campaign.activePage().get('bR20cfg_views${id}Icon')) { 
				$> <$!d20.Campaign.activePage().get('bR20cfg_views${id}Icon')$> <$
			} else { 
				$>P<$ 
			} $> </span> <$
			if (d20.Campaign.activePage().get('bR20cfg_views${id}Name')) { 
				$> <$!d20.Campaign.activePage().get('bR20cfg_views${id}Name')$> <$
			} else { 
				$> ${id ? `View ${id}` : `Default`} <$ 
			} $>`;
	}

	d20plus.template.neatActions = {
		"unlock-tokens": { ln: __("menu_unlock"), condition: "window.is_gm && Object.keys(this).length === 0" },
		"takecard": { ln: __("menu_take_card"), condition: "this.view && this.view.graphic.type == \"image\" && this.get(\"cardid\") !== \"\"" },
		"flipcard": { ln: __("menu_flip_card"), condition: "this.view && this.view.graphic.type == \"image\" && this.get(\"cardid\") !== \"\"" },
		"delete": { ln: __("menu_edit_del"), icon: "#", condition: "this.view" },
		"copy": { ln: __("menu_edit_copy"), icon: "|", condition: "window.is_gm && this.view" },
		"paste": { ln: __("menu_edit_paste"), icon: "W", condition: "window.is_gm && !this.view" },
		"undo": { ln: __("menu_edit_undo"), icon: "1", condition: "window.is_gm" },
		"tofront": { ln: __("menu_move_tofront"), condition: "this.view" },
		"forward-one": { ln: __("menu_move_forwone"), condition: "this.view" },
		"back-one": { ln: __("menu_move_backone"), condition: "this.view", quick: __("menu_quick_toback")},
		"toback": { ln: __("menu_move_toback"), condition: "this.view" },
		"tolayer_map": { ln: __("menu_layer_map"), icon: "G", condition: "this.view", active: "this && this.get && this.get(\"layer\") == \"map\"" },
		"tolayer_floors": { ln: __("menu_layer_fl"), icon: "I", condition: "this.view && d20plus.cfg.getOrDefault(\"canvas\", \"showFloors\")", active: "this && this.get && this.get(\"layer\") == \"floors\"" },
		"tolayer_background": { ln: __("menu_layer_bg"), icon: "a", condition: "this.view && d20plus.cfg.getOrDefault(\"canvas\", \"showBackground\")", active: "this && this.get && this.get(\"layer\") == \"background\"" },
		"tolayer_objects": { ln: __("menu_layer_obj"), icon: "U", condition: "this.view", active: "this && this.get && this.get(\"layer\") == \"objects\"", quick: __("menu_quick_tofg") },
		"tolayer_foreground": { ln: __("menu_layer_fg"), icon: "B", condition: "this.view && d20plus.cfg.getOrDefault(\"canvas\", \"showForeground\")", active: "this && this.get && this.get(\"layer\") == \"foreground\"" },
		"tolayer_roofs": { ln: __("menu_layer_rf"), icon: "H", condition: "this.view && d20plus.cfg.getOrDefault(\"canvas\", \"showRoofs\")", active: "this && this.get && this.get(\"layer\") == \"roofs\"" },
		"tolayer_gmlayer": { ln: __("menu_layer_gm"), icon: "E", condition: "this.view", active: "this && this.get && this.get(\"layer\") == \"gmlayer\"", quick: __("menu_quick_togm")},
		"tolayer_walls": { ln: __("menu_layer_barriers"), icon: "r", condition: "this.view", active: "this && this.get && this.get(\"layer\") == \"walls\"" },
		"tolayer_weather": { ln: __("menu_layer_weather"), icon: "C", condition: "this.view && d20plus.cfg.getOrDefault(\"canvas\", \"showWeather\")", active: "this && this.get && this.get(\"layer\") == \"weather\"" },
		"util-scenes": { ln: __("menu_util_start"), condition: "" },
		"token-animate": { ln: __("menu_util_animate"), condition: "this.get && this.get(\"type\") == \"image\"" },
		"token-fly": { ln: __("menu_util_flight"), condition: "this.get && this.get(\"type\") == \"image\"", active: "this && this.attributes.statusmarkers.search(\"fluffy-wing@\")>-1" },
		"token-light": { ln: __("menu_util_light"), condition: "this.get && this.get(\"type\") == \"image\"" },
		"group": { ln: __("menu_adv_grp"), condition: "this.view && this.get && (d20.engine.selected().length > 1 && !d20.engine.selected().some( el => !!el.model.get(\"groupwith\")) )" },
		"regroup": { ln: __("menu_adv_regrp"), condition: "this.view && this.get && (d20.engine.selected().length > 2 && d20.engine.selected().some( el => !el.model.get(\"groupwith\")) )", action: "group"},
		"ungroup": { ln: __("menu_adv_ungrp"), condition: "this.view && this.get  && d20.engine.selected().some( el => !!el.model.get(\"groupwith\"))" },
		"toggledrawing": { ln: __("menu_adv_isdrv"), condition: "this.get && this.get(\"type\") == \"image\"", active: "this && this.get(\"isdrawing\")" },
		"togglefliph": { ln: __("menu_adv_flh"), condition: "this.get && this.get(\"type\") == \"image\"", active: "this && this.get(\"fliph\")" },
		"toggleflipv": { ln: __("menu_adv_flv"), condition: "this.get && this.get(\"type\") == \"image\"", active: "this && this.get(\"flipv\")" },
		"setdimensions": { ln: __("menu_adv_dimens"), condition: "this.get && this.get(\"type\") == \"image\"" },
		"aligntogrid": { ln: __("menu_adv_align"), condition: "this.get && this.get(\"type\") == \"image\" && window.currentEditingLayer == \"map\"" },
		"lock-token": { ln: __("menu_adv_lock"), condition: "this.view && !this.get(\"lockMovement\") && !this.get(\"VeLocked\")" },
		"unlock-token": { ln: __("menu_adv_unlock"), condition: "this.view && (this.get(\"lockMovement\") || this.get(\"VeLocked\"))", action: "lock-token"},
		"copy-tokenid": { ln: __("menu_adv_tokenid"), condition: "this.get && this.get(\"type\") == \"image\"" },
		"copy-pathid": { ln: __("menu_adv_pathid"), condition: "this.get && this.get(\"type\") == \"path\"" },
		"addturn": { ln: __("menu_token_turn"), condition: "this.get && this.get(\"type\") != \"path\"" },
		"rollinit": { ln: __("menu_mass_init"), condition: "this.character && (d20plus.settingsHtmlHeader.search(\"5etools\") > 0 || d20plus.cfg.getOrDefault(\"token\", \"massRollAssumesOGL\"))" },
		"rollsaves": { ln: __("menu_mass_save"), condition: "this.character && (d20plus.settingsHtmlHeader.search(\"5etools\") > 0 || d20plus.cfg.getOrDefault(\"token\", \"massRollAssumesOGL\"))", quick: __("menu_quick_save")},
		"rollskills": { ln: __("menu_mass_skill"), condition: "this.character && (d20plus.settingsHtmlHeader.search(\"5etools\") > 0 || d20plus.cfg.getOrDefault(\"token\", \"massRollAssumesOGL\"))" },
		"side_random": { ln: __("menu_multi_rnd"), condition: "this.view && this.get && this.get(\"sides\") !== \"\" && this.get(\"cardid\") === \"\"" },
		"side_choose": { ln: __("menu_multi_select"), condition: "this.view && this.get && this.get(\"sides\") !== \"\" && this.get(\"cardid\") === \"\"" },
		"rollertokenresize": { ln: __("menu_multi_size"), condition: "this.view && this.get && this.get(\"sides\") !== \"\" && this.get(\"cardid\") === \"\"" },
		"assignview0": { ln: d20plus.template.neatActionsView("0"), active: "this && this.get(\"bR20_view0\")", condition: "this.view && this.get && d20.Campaign.activePage().get('bR20cfg_viewsEnable')" },
		"assignview1": { ln: d20plus.template.neatActionsView("1"), active: "this && this.get(\"bR20_view1\")", condition: "this.view && this.get && d20.Campaign.activePage().get('bR20cfg_viewsEnable') && d20.Campaign.activePage().get('bR20cfg_views1Enable')" },
		"assignview2": { ln: d20plus.template.neatActionsView("2"), active: "this && this.get(\"bR20_view2\")", condition: "this.view && this.get && d20.Campaign.activePage().get('bR20cfg_viewsEnable') && d20.Campaign.activePage().get('bR20cfg_views2Enable')" },
		"assignview3": { ln: d20plus.template.neatActionsView("3"), active: "this && this.get(\"bR20_view3\")", condition: "this.view && this.get && d20.Campaign.activePage().get('bR20cfg_viewsEnable') && d20.Campaign.activePage().get('bR20cfg_views3Enable')" },
	};

	d20plus.template.neatStructure = {
		"edit": {
			ln: __("menu_edit_title"),
			subitems: [
				"delete",
				"copy",
				"paste",
				"undo",
			] },
		"move": {
			ln: __("menu_move_title"),
			subitems: [
				"tofront",
				"forward-one",
				"back-one",
				"toback",
			] },
		"layer": {
			ln: __("menu_layer_title"),
			subitems: [
				"tolayer_map",
				"tolayer_floors",
				"tolayer_background",
				"tolayer_objects",
				"tolayer_foreground",
				"tolayer_roofs",
				"tolayer_gmlayer",
				"tolayer_walls",
				"tolayer_weather",
			] },
		"view": {
			ln: __("menu_view_title"),
			subitems: [
				"assignview0",
				"assignview1",
				"assignview2",
				"assignview3",
			] },
		"util": {
			ln: __("menu_util_title"),
			subitems: [
				"util-scenes",
				"-",
				"token-animate",
				"token-fly",
				"token-light",
			] },
		"adv": {
			ln: __("menu_adv_title"),
			subitems: [
				"unlock-tokens",
				"group",
				"regroup",
				"ungroup",
				"lock-token",
				"unlock-token",
				"-",
				"toggledrawing",
				"togglefliph",
				"toggleflipv",
				"setdimensions",
				"aligntogrid",
				"copy-tokenid",
				"copy-pathid",
			] },
		"token": {
			ln: __("menu_token_title"),
			subitems: [
				"addturn",
				"-",
			] },
		"mass": {
			ln: __("menu_mass_title"),
			subitems: [
				"rollinit",
				"rollsaves",
				"rollskills",
			] },
		"multi": {
			ln: __("menu_multi_title"),
			subitems: [
				"side_random",
				"side_choose",
				"-",
				"rollertokenresize",
			] },
		"card": {
			ln: __("menu_card_title"),
			subitems: [
				"takecard",
				"flipcard",
			] },
	}

	d20plus.template.pushQuickMenus = () => {
		if (d20plus.cfg.getOrDefault("canvas", "enableQuickMenuItems")) {
			let output = "";
			const pushMenu = (num, action, condition) => {
				if (!action) action = d20plus.cfg.getOrDefault(`canvas`, `quickMenuItem${num}`);
				if (action) title = d20plus.template.neatActions[action].quick || d20plus.template.neatActions[action].ln;
				if (action && title) {
					if (!condition) {
						condition = d20plus.template.neatActions[action].condition;
					}
					const conditionStatement = condition ? `if (${condition})` : ``;
					output += `<$ ${conditionStatement} { $><li data-action-type='${action}'>${title}</li><$ } $>`;
				}
			};
			pushMenu(null, "tolayer_objects", `this.view && this.get("layer") == "gmlayer"`);
			pushMenu(null, "tolayer_gmlayer", `this.view && this.get("layer") != "gmlayer"`);
			pushMenu(2);
			pushMenu(3);
			return output;
		} else return "";
	}

	d20plus.template.generateNeatActionsMenu = () => {
		let templ = "";
		Object.entries(d20plus.template.neatStructure).forEach((menu) => {
			const menuData = menu[1];
			const menuName = `data-menuname='${menu[0]}'`;
			let menuConditions = [];
			let menuItems = "";
			menuData.subitems.forEach((item) => {
				if (item === "-") {
					menuItems += `\n\t\t<div class="ctx__divider"></div>`;
				} else {
					let itemAction = d20plus.template.neatActions[item].action || item;
					item = d20plus.template.neatActions[item];
					const itemName = item.ln;
					const itemCondition = item.condition;
					const iconsStyle = item.icon === "a" ? `` : ` style="font-family:&quot;pictos custom&quot;, pictos"`;
					const itemIcon = item.icon ? `<span class="pictos ctx__layer-icon"${iconsStyle}>${item.icon}</span> ` : ``;
					const itemActive = item.active ? ` class='<$ if(${item.active}) { $>active<$ } $>'` : ``;
					const conditionStatement = itemCondition ? `if (${itemCondition})` : ``;
					if (itemCondition && (menuConditions.at(-1) !== itemCondition)) menuConditions.push(itemCondition);
					if (itemAction === "unlock-token") itemAction = "lock-token";
					menuItems += `\n\t\t<$ ${conditionStatement} { $><li data-action-type='${itemAction}'${itemActive}>${itemIcon}${itemName}</li><$ } $>`;
				}
			})
			templ += `<$ if ((${menuConditions.join(") || (")})) { $><li class='head hasSub' ${menuName}>\n\t${menuData.ln}&nbsp;&raquo;
			<ul class='submenu' ${menuName}>${menuItems}\n\t</ul>\n</li><$ } $>\n`;
		});
		return `
		<script id='tmpl_actions_menu' type='text/html'>
		<div class='actions_menu d20contextmenu'>
		  <ul>
		  	${templ}
			${d20plus.template.pushQuickMenus()}
		  </ul>
		  </div>
		</script>
		`;
	}

	addConfigOptions("canvas", {
		"_name": __("cfg_tab_canvas"),
		"_player": true,
		"enableQuickMenuItems": {
			"name": __("cfg_option_quick_menu"),
			"default": true,
			"_type": "boolean",
		},
		"quickMenuItem2": {
			"name": __("cfg_option_quick_2"),
			"default": "back-one",
			"_type": "_enum",
			"__values": Object.keys(d20plus.template.neatActions),
		},
		"quickMenuItem3": {
			"name": __("cfg_option_quick_3"),
			"default": "rollsaves",
			"_type": "_enum",
			"__values": Object.keys(d20plus.template.neatActions),
		},
	});

	d20plus.settingsHtmlPtFooter = `<p>
			<a class="btn " href="#" id="button-edit-config" style="margin-top: 3px; width: calc(100% - 22px);">Edit Config</a>
			</p>
      <p>
			<a class="btn btn player-hidden" href="#" id="button-view-tools" style="margin-top: 3px; width: calc(100% - 22px);">Open Tools List</a>
			</p>
			<p>
			For help, advice, and updates, <a href="https://discord.gg/nGvRCDs" target="_blank" style="color: #08c;">join our Discord!</a>
			</p>
			<style id="dynamicStyle"></style>
		`;

	d20plus.artTabHtml = `
	<div>
		<h3 style="margin-bottom: 4px;">BetteR20</h3>
		<p style="display: flex; width: 100%; justify-content: space-between;">
			<button class="btn" id="button-add-external-art" style="margin-right: 5px;">Manage External Art</button>
			<button class="btn" id="button-browse-external-art">Browse Repo</button>
		</p>
	</div>
	`;

	d20plus.addArtHTML = `
	<div id="d20plus-artfolder" title="BetteR20 - External Art" style="position: relative; background: inherit;">
	<p>Add external images by URL. Any direct link to an image should work.</p>
	<p>
	<input placeholder="Name*" id="art-list-add-name">
	<input placeholder="URL*" id="art-list-add-url">
	<a class="btn" href="#" id="art-list-add-btn">Add URL</a>
	<a class="btn" href="#" id="art-list-multi-add-btn">Add Multiple URLs...</a>
	<a class="btn btn-danger" href="#" id="art-list-delete-all-btn" style="margin-left: 12px;">Delete All</a>
	<p/>
	<hr>
	<div id="art-list-container" style="background: inherit;">
	<p style="position: sticky; top: -10px; background: inherit; z-index: 100;">
		<span style="display: inline-block; width: calc( 35% + 35px ); font-weight: bold;">
			Name
			<input class="search" autocomplete="off" placeholder="Search list..." style="width: 60%; margin: 10px;">
		</span>
		<span style="display: inline-block; font-weight: bold;">URL</span>
	</p>
	<ul class="list artlist" style="display: block; margin: 0; transform: translateZ(0);"></ul>
	</div>
	</div>
	<br>`;

	d20plus.addArtMassAdderHTML = `
	<div id="d20plus-artmassadd" title="Mass Add Art URLs">
	<p>One entry per line; entry format: <b>[name]---[URL (direct link to image)]</b> <button class="btn" id="art-list-multi-add-btn-submit">Add URLs</button></p>
	<p><textarea id="art-list-multi-add-area" style="width: 100%; height: 100%; min-height: 500px;" placeholder="My Image---http://example.com/img1.png"></textarea></p>
	</div>`;

	d20plus.artListHTML = `
	<div id="Vetoolsresults">
	<ol class="dd-list" id="image-search-none"><div class="alert white">No results found in 5etools for those keywords.</div></ol>

	<ol class="dd-list" id="image-search-has-results">
		<li class="dd-item dd-folder Vetoolsresult">
			<div class="dd-content">
				<div class="folder-title">From 5etools</div>
			</div>

			<ol class="dd-list Vetoolsresultfolder" id="custom-art-results"></ol>
		</li>
	</ol>
	</div>`;

	d20plus.configEditorHTML = `
	<div id="d20plus-configeditor" title="Better20 - Config Editor" style="position: relative">
	<!-- populate with js -->
	</div>`;

	d20plus.configEditorButtonBarHTML = `
	<div class="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix">
	<div class="ui-dialog-buttonset">
		<button type="button" id="configsave" alt="Save" title="Save Config" class="btn" role="button" aria-disabled="false">
			<span>Save</span>
		</button>
	</div>
	</div>
	`;

	d20plus.tool.toolsListHtml = `
		<div id="d20-tools-list" title="BetteR20 - Tools List" style="position: relative">
		<div class="tools-list">
		<!-- populate with js -->
		</div>
		</div>
		`;

	d20plus.template_actionsMenu = `
		<script id='tmpl_actions_menu' type='text/html'>
			<div class='actions_menu d20contextmenu'>
				<ul>
					<$ if (Object.keys(this).length === 0) { $>
						<li data-action-type='unlock-tokens'>Unlock...</li>
					<$ } $>
					<$ if(this.view && this.view.graphic.type == "image" && this.get("cardid") !== "") { $>
						<li class='head hasSub' data-action-type='takecard'>Take Card</li>
						<li class='head hasSub' data-action-type='flipcard'>Flip Card</li>
					<$ } $>
					<$ if(window.is_gm) { $>
						<$ if(this.view && this.get("isdrawing") === false && window.currentEditingLayer != "map") { $>
							<!-- BEGIN MOD -->
							<li class='head hasSub' data-menuname='massroll'>
								Mass Roll &raquo;
								<ul class='submenu' data-menuname='massroll'>
									<li class='head hasSub' data-action-type='rollinit'>Initiative</li>
									<li class='head hasSub' data-action-type='rollsaves'>Save</li>
									<li class='head hasSub' data-action-type='rollskills'>Skill</li>
								</ul>
							</li>
							<!-- END MOD -->
							<li class='head hasSub' data-action-type='addturn'>Add Turn</li>
						<$ } $>
						<!-- BEGIN MOD -->
						<!-- <li class='head'>Edit</li> -->
						<!-- END MOD -->
						<$ if(this.view) { $>
							<li data-action-type='delete'>Delete</li>
							<li data-action-type='copy'>Copy</li>
						<$ } $>
						<li data-action-type='paste'>Paste</li>
						<!-- BEGIN MOD -->
						<$ if(!this.view) { $>
							<li data-action-type='undo'>Undo</li>
						<$ } $>
						<!-- END MOD -->

						<!-- BEGIN MOD -->
						<$ if(this.view) { $>
							<li class='head hasSub' data-menuname='move'>
							Move &raquo;
								<ul class='submenu' data-menuname='move'>
									<li data-action-type='tofront'>To Front</li>
									<li data-action-type='forward-one'>Forward One<!-- (B-F)--></li>
									<li data-action-type='back-one'>Back One<!-- (B-B)--></li>
									<li data-action-type='toback'>To Back</li>
								</ul>
							</li>
						<$ } $>

						<li class='head hasSub' data-menuname='VeUtil'>
							Utilities &raquo;
							<ul class='submenu' data-menuname='VeUtil'>
								<li data-action-type='util-scenes'>Start Scene</li>
								<$ if(this.get && this.get("type") == "image") { $>
									<div class="ctx__divider"></div>
									<li data-action-type='token-animate'>Animate</li>
									<li data-action-type='token-fly'>Set&nbsp;Flight&nbsp;Height</li>
									<li data-action-type='token-light'>Set&nbsp;Light</li>
								<$ } $>
							</ul>
						</li>
						<!-- END MOD -->

						<li class='head hasSub' data-menuname='advanced'>
							Advanced &raquo;
							<ul class='submenu' data-menuname='advanced'>
								<li data-action-type='group'>Group</li>
								<li data-action-type='ungroup'>Ungroup</li>
								<$ if(this.get && this.get("type") == "image") { $>
									<li class="<$ if (this && this.get("isdrawing")) { $>active<$ } $>" data-action-type="toggledrawing">Is Drawing</li>
									<li class="<$ if (this && this.get("fliph")) { $>active<$ } $>" data-action-type="togglefliph">Flip Horizontal</li>
									<li class="<$ if (this && this.get("flipv")) { $>active<$ } $>" data-action-type="toggleflipv">Flip Vertical</li>
									<li data-action-type='setdimensions'>Set Dimensions</li>
									<$ if(window.currentEditingLayer == "map") { $>
										<li data-action-type='aligntogrid'>Align to Grid</li>
									<$ } $>
								<$ } $>

								<$ if(this.view) { $>
									<li data-action-type='lock-token'>Lock/Unlock Position</li>
								<$ } $>

								<$ if(this.get && this.get("type") == "image") { $>
									<li data-action-type='copy-tokenid'>View Token ID</li>
								<$ } $>
								<$ if(this.get && this.get("type") == "path") { $>
									<li data-action-type='copy-pathid'>View Path ID</li>
								<$ } $>
							</ul>
						</li>

						<li class='head hasSub' data-menuname='positioning'>
							Layer &raquo;
							<ul class='submenu' data-menuname='positioning'>
								<li data-action-type="tolayer_map" class='<$ if(this && this.get && this.get("layer") == "map") { $>active<$ } $>'><span class="pictos ctx__layer-icon">@</span> Map Layer</li>
								<!-- BEGIN MOD -->
								<li data-action-type="tolayer_background" class='<$ if(this && this.get && this.get("layer") == "background") { $>active<$ } $>'><span class="pictos ctx__layer-icon">a</span> Background Layer</li>
								<!-- END MOD -->
								<li data-action-type="tolayer_objects" class='<$ if(this && this.get && this.get("layer") == "objects") { $>active<$ } $>'><span class="pictos ctx__layer-icon">b</span> Token Layer</li>
								<!-- BEGIN MOD -->
								<li data-action-type="tolayer_foreground" class='<$ if(this && this.get && this.get("layer") == "foreground") { $>active<$ } $>'><span class="pictos ctx__layer-icon">B</span> Foreground Layer</li>
								<!-- END MOD -->
								<li data-action-type="tolayer_gmlayer" class='<$ if(this && this.get && this.get("layer") == "gmlayer") { $>active<$ } $>'><span class="pictos ctx__layer-icon">E</span> GM Layer</li>
								<li data-action-type="tolayer_walls" class='<$ if(this && this.get && this.get("layer") == "walls") { $>active<$ } $>'><span class="pictostwo ctx__layer-icon">r</span> Lighting Layer</li>
								<!-- BEGIN MOD -->
								<li data-action-type="tolayer_weather" class='<$ if(this && this.get && this.get("layer") == "weather") { $>active<$ } $>'><span class="pictos ctx__layer-icon">C</span> Weather Layer</li>
								<!-- END MOD -->
							</ul>
						</li>
					<$ } $>

					<!-- BEGIN MOD -->
					<$ if(this.view && this.get && d20.Campaign.activePage().get && d20.Campaign.activePage().get('bR20cfg_viewsEnable')) { $>
						<li class='head hasSub' data-menuname='view'>
							Assign view &raquo;
							<ul class='submenu' data-menuname='view'>
								<$ if(this.view && d20.Campaign.activePage().get('bR20cfg_viewsEnable')) { $>
								<li data-action-type="assignview0" class='<$ if(this && this.get && this && this.get("bR20_view0")) { $>active<$ } $>'><span class="pictos ctx__layer-icon">P</span><$ if (d20.Campaign.activePage().get('bR20cfg_views0Name')) { $> <$!d20.Campaign.activePage().get('bR20cfg_views0Name')$> <$ } else { $> View 1 <$ } $></li>
								<$ } $>
								<$ if(this.view && d20.Campaign.activePage().get('bR20cfg_views1Enable')) { $>
								<li data-action-type="assignview1" class='<$ if(this && this.get && this && this.get("bR20_view1")) { $>active<$ } $>'><span class="pictos ctx__layer-icon">P</span><$ if (d20.Campaign.activePage().get('bR20cfg_views1Name')) { $> <$!d20.Campaign.activePage().get('bR20cfg_views1Name')$> <$ } else { $> View 2 <$ } $></li>
								<$ } $>
								<$ if(this.view && d20.Campaign.activePage().get('bR20cfg_views2Enable')) { $>
								<li data-action-type="assignview2" class='<$ if(this && this.get && this && this.get("bR20_view2")) { $>active<$ } $>'><span class="pictos ctx__layer-icon">P</span><$ if (d20.Campaign.activePage().get('bR20cfg_views2Name')) { $> <$!d20.Campaign.activePage().get('bR20cfg_views2Name')$> <$ } else { $> View 3 <$ } $></li>
								<$ } $>
								<$ if(this.view && d20.Campaign.activePage().get('bR20cfg_views3Enable')) { $>
								<li data-action-type="assignview3" class='<$ if(this && this.get && this && this.get("bR20_view3")) { $>active<$ } $>'><span class="pictos ctx__layer-icon">P</span><$ if (d20.Campaign.activePage().get('bR20cfg_views3Name')) { $> <$!d20.Campaign.activePage().get('bR20cfg_views3Name')$> <$ } else { $> View 4 <$ } $></li>
								<$ } $>
							</ul>
						</li>
					<$ } $>
					<!-- END MOD -->

					<$ if(this.view && this.get && this.get("sides") !== "" && this.get("cardid") === "") { $>
						<li class='head hasSub' data-menuname='mutliside'>
							Multi-Sided &raquo;
							<ul class='submenu' data-menuname='multiside'>
								<li data-action-type='side_random'>Random Side</li>
								<li data-action-type='side_choose'>Choose Side</li>
								<li data-action-type='rollertokenresize'>Set Side Size</li>
							</ul>
						</li>
					<$ } $>
				</ul>
			</div>
		</script>
		`;

	d20plus.template_charactereditor = `<script id='tmpl_charactereditor' type='text/html'>
  <div class='dialog largedialog charactereditor' style='display: block;'>
    <div class='tab-content'>
      <div class='bioinfo tab-pane'>
        <div class='row-fluid'>
          <div class='span5'>
            <label>
              <strong>Avatar</strong>
            </label>
            <$ if(true) { $>
            <div class="avatar dropbox <$! this.get("avatar") != "" ? "filled" : "" $>" style="width: 95%;">
            <div class="status"></div>
            <div class="inner">
              <$ if(this.get("avatar") == "") { $>
              <h4 style="padding-bottom: 0px; marigin-bottom: 0px; color: #777;">Drop a file from your <br>Art Library or computer<small>(JPG, GIF, PNG, WEBM, WP4)</small></h4>
              <br /> or
              <button class="btn">Click to Upload</button>
              <input class="manual" type="file" />
              <$ } else { $>
              <$ if(/.+\\.webm(\\?.*)?$/i.test(this.get("avatar"))) { $>
              <video src="<$!this.get("avatar")$>" draggable="false" muted autoplay loop />
              <$ } else { $>
              <img src="<$!this.get("avatar")$>" draggable="false" />
              <$ } $>
              <div class='remove'><a href='#'>Remove</a></div>
              <$ } $>
            </div>
          </div>
          <$ } else { $>
          <div class='avatar'>
            <$ if(this.get("avatar") != "") { $>
            <img src="<$!this.get("avatar")$>" draggable="false" />
            <$ } $>
          </div>
          <$ } $>
          <div class='clear'></div>
          <!-- BEGIN MOD -->
          <button class="btn character-image-by-url">Set Image from URL</button>
          <div class='clear'></div>
          <!-- END MOD -->
          <$ if (window.is_gm) { $>
          <label>
            <strong>Default Token (Optional)</strong>
          </label>
          <div class="defaulttoken tokenslot <$! this.get("defaulttoken") !== "" ? "filled" : "" $> style="width: 95%;">
          <$ if(this.get("defaulttoken") !== "") { $>
          <img src="" draggable="false" />
          <div class="remove"><a href="#">Remove</a></div>
          <$ } else { $>
          <button class="btn">Use Selected Token</button>
          <small>Select a token on the tabletop to use as the Default Token</small>
          <$ } $>
        </div>
        <!-- BEGIN MOD -->
        <button class="btn token-image-by-url">Set Token Image from URL</button>
        <small style="text-align: left;">(Update will only be visible upon re-opening the sheet)</small>
        <div class='clear'></div>
        <!-- END MOD -->
        <$ } $>
      </div>
      <div class='span7'>
        <label>
          <strong>Name</strong>
        </label>
        <input class='name' type='text'>
        <div class='clear'></div>
        <$ if(window.is_gm) { $>
        <label>
          <strong>In Player's Journals</strong>
        </label>
        <select class='inplayerjournals selectize' multiple='true' style='width: 100%;'>
          <option value="all">All Players</option>
          <$ window.Campaign.players.each(function(player) { $>
          <option value="<$!player.id$>"><$!player.get("displayname")$></option>
          <$ }); $>
        </select>
        <div class='clear'></div>
        <label>
          <strong>Can Be Edited &amp; Controlled By</strong>
        </label>
        <select class='controlledby selectize' multiple='true' style='width: 100%;'>
          <option value="all">All Players</option>
          <$ window.Campaign.players.each(function(player) { $>
          <option value="<$!player.id$>"><$!player.get("displayname")$></option>
          <$ }); $>
        </select>
        <div class='clear'></div>
        <label>
          <strong>Tags</strong>
        </label>
        <input class='tags'>
        <div class='clear'></div>
        <hr>
        <button class='delete btn btn-danger' style='float: right;'>
          Delete
        </button>
        <button class='duplicate btn' style='margin-right: 10px;'>
          Duplicate
        </button>
        <button class='archive btn'>
          <$ if(this.get("archived")) { $>Restore from Archive<$ } else { $>Archive<$ } $>
        </button>
        <div class='clear'></div>
        <$ } $>
        <div class='clear'></div>
      </div>
    </div>
    <div class='row-fluid'>
      <div class='span12'>
        <hr>
        <label>
          <strong>Bio & Info</strong>
        </label>
        <textarea class='bio'></textarea>
        <div class='clear'></div>
        <$ if(window.is_gm) { $>
        <label>
          <strong>GM Notes (Only visible to GM)</strong>
        </label>
        <textarea class='gmnotes'></textarea>
        <div class='clear'></div>
        <$ } $>
      </div>
    </div>
  </div>
  </div>
  </div>
</script>
		`;

	d20plus.template_handouteditor = `<script id='tmpl_handouteditor' type='text/html'>
  <div class='dialog largedialog handouteditor' style='display: block;'>
    <div class='row-fluid'>
      <div class='span12'>
        <label>
          <strong>Name</strong>
        </label>
        <input class='name' type='text'>
        <div class='clear'></div>
        <$ if (window.is_gm) { $>
        <label>
          <strong>In Player's Journals</strong>
        </label>
        <select class='inplayerjournals chosen' multiple='true' style='width: 100%;'>
          <option value="all">All Players</option>
          <$ window.Campaign.players.each(function(player) { $>
          <option value="<$!player.id$>"><$!player.get("displayname")$></option>
          <$ }); $>
        </select>
        <div class='clear'></div>
        <label>
          <strong>Can Be Edited By</strong>
        </label>
        <select class='controlledby chosen' multiple='true' style='width: 100%;'>
          <option value="all">All Players</option>
          <$ window.Campaign.players.each(function(player) { $>
          <option value="<$!player.id$>"><$!player.get("displayname")$></option>
          <$ }); $>
        </select>
        <div class='clear'></div>
        <label>
          <strong>Tags</strong>
        </label>
        <input class='tags'>
        <div class='clear'></div>
        <$ } $>
      </div>
    </div>
    <div class='row-fluid'>
      <div class='span12'>
        <div class="avatar dropbox <$! this.get("avatar") != "" ? "filled" : "" $>">
        <div class="status"></div>
        <div class="inner">
          <$ if(this.get("avatar") == "") { $>
          <h4 style="padding-bottom: 0px; marigin-bottom: 0px; color: #777;">Drop a file</h4>
          <br /> or
          <button class="btn">Choose a file...</button>
          <input class="manual" type="file" />
          <$ } else { $>
          <$ if(/.+\\.webm(\\?.*)?$/i.test(this.get("avatar"))) { $>
          <video src="<$!this.get("avatar")$>" draggable="false" muted autoplay loop />
          <$ } else { $>
          <img src="<$!this.get("avatar")$>" />
          <$ } $>
          <div class='remove'><a href='#'>Remove</a></div>
          <$ } $>
        </div>
      </div>
      <div class='clear'></div>
    </div>
  </div>
  <!-- BEGIN MOD -->
  <div class='row-fluid'>
  <button class="btn handout-image-by-url">Set Image from URL</button>
  <div class='clear'></div>
  </div>
  <!-- END MOD -->
  <div class='row-fluid'>
    <div class='span12'>
      <label>
        <strong>Description & Notes</strong>
      </label>
      <textarea class='notes'></textarea>
      <div class='clear'></div>
      <$ if(window.is_gm) { $>
      <label>
        <strong>GM Notes (Only visible to GM)</strong>
      </label>
      <textarea class='gmnotes'></textarea>
      <div class='clear'></div>
      <hr>
      <button class='delete btn btn-danger' style='float: right;'>
        Delete Handout
      </button>
      <button class='duplicate btn' style='margin-right: 10px;'>
        Duplicate
      </button>
      <button class='archive btn'>
        <$ if(this.get("archived")) { $>Restore Handout from Archive<$ } else { $>Archive<$ } $>
      </button>
      <div class='clear'></div>
      <$ } $>
    </div>
  </div>
  </div>
</script>
<script id='tmpl_handoutviewer' type='text/html'>
  <div class='dialog largedialog handoutviewer' style='display: block;'>
    <div style='padding: 10px;'>
      <$ if(this.get("avatar") != "") { $>
      <div class='row-fluid'>
        <div class='span12'>
          <div class='avatar'>
            <a class="lightly" target="_blank" href="<$!(this.get("avatar").indexOf("d20.io/") !== -1 ? this.get("avatar").replace(/\\/med\\.(?!webm)/, "/max.") : this.get("avatar"))$>">
            <$ if(/.+\\.webm(\\?.*)?$/i.test(this.get("avatar"))) { $>
            <video src="<$!this.get("avatar")$>" draggable="false" loop muted autoplay />
            <$ } else { $>
            <img src="<$!this.get("avatar")$>" draggable="false" />
            <$ } $>
            <div class='mag-glass pictos'>s</div></a>
            </a>
          </div>
          <div class='clear'></div>
        </div>
      </div>
      <$ } $>
      <div class='row-fluid'>
        <div class='span12'>
          <div class='content note-editor notes'></div>
          <div class='clear'></div>
        </div>
      </div>
      <$ if(window.is_gm) { $>
      <div class='row-fluid'>
        <div class='span12'>
          <hr>
          <label>
            <strong>GM Notes (Only visible to GM)</strong>
          </label>
          <div class='content note-editor gmnotes'></div>
          <div class='clear'></div>
        </div>
      </div>
      <$ } $>
    </div>
  </div>
</script>
	`;

	d20plus.template.deckeditor = `
	<script id='tmpl_deckeditor' type='text/html'>
      <div class='dialog largedialog deckeditor' style='display: block;'>
        <label>Name</label>
        <input class='name' type='text'>
        <div class='clear' style='height: 14px;'></div>
        <label>
          <input class='showplayers' type='checkbox'>
          Show deck to players?
        </label>
        <div class='clear' style='height: 7px;'></div>
        <label>
          <input class='playerscandraw' type='checkbox'>
          Players can draw cards?
        </label>
        <div class='clear' style='height: 7px;'></div>
        <label>
          <input class='infinitecards' type='checkbox'>
          Cards in deck are infinite?
        </label>
        <p class='infinitecardstype'>
          <label>
            <input name='infinitecardstype' type='radio' value='random'>
            Always a random card
          </label>
          <label>
            <input name='infinitecardstype' type='radio' value='cycle'>
            Draw through deck, shuffle, repeat
          </label>
        </p>
        <div class='clear' style='height: 7px;'></div>
        <label>
          Allow choosing specific cards from deck:
          <select class='deckpilemode'>
            <option value='none'>Disabled</option>
            <option value='choosebacks_gm'>GM Choose: Show Backs</option>
            <option value='choosefronts_gm'>GM Choose: Show Fronts</option>
            <option value='choosebacks'>GM + Players Choose: Show Backs</option>
            <option value='choosefronts'>GM + Players Choose: Show Fronts</option>
          </select>
        </label>
        <div class='clear' style='height: 7px;'></div>
        <label>
          Discard Pile:
          <select class='discardpilemode'>
            <option value='none'>No discard pile</option>
            <option value='choosebacks'>Choose: Show Backs</option>
            <option value='choosefronts'>Choose: Show Fronts</option>
            <option value='drawtop'>Draw most recent/top card</option>
            <option value='drawbottom'>Draw oldest/bottom card</option>
          </select>
        </label>
        <div class='clear' style='height: 7px;'></div>
        <hr>
        <strong>When played to the tabletop...</strong>
        <div class='clear' style='height: 5px;'></div>
        <label>
          Played Facing:
          <select class='cardsplayed' style='display: inline-block; width: auto; position: relative; top: 3px;'>
            <option value='facedown'>Face Down</option>
            <option value='faceup'>Face Up</option>
          </select>
        </label>
        <div class='clear' style='height: 7px;'></div>
        <label>
          Considered:
          <select class='treatasdrawing' style='display: inline-block; width: auto; position: relative; top: 3px;'>
            <option value='true'>Drawings (No Bubbles/Stats)</option>
            <option value='false'>Tokens (Including Bubbles and Stats)</option>
          </select>
        </label>
        <div class='clear' style='height: 7px;'></div>
        <div class='inlineinputs'>
          Card Size:
          <input class='defaultwidth' type='text'>
          x
          <input class='defaultheight' type='text'>
          px
        </div>
        <small style='text-align: left; padding-left: 135px; width: auto;'>Leave blank for default auto-sizing</small>
        <div class='clear' style='height: 7px;'></div>
        <!-- %label -->
        <!-- %input.showalldrawn(type="checkbox") -->
        <!-- Everyone sees what card is drawn onto top of deck? -->
        <!-- .clear(style="height: 7px;") -->
        <hr>
        <strong>In other's hands...</strong>
        <div class='clear' style='height: 5px;'></div>
        <div class='inlineinputs'>
          <label style='width: 75px;'>Players see:</label>
          <label>
            <input class='players_seenumcards' type='checkbox'>
            Number of Cards
          </label>
          <label>
            <input class='players_seefrontofcards' type='checkbox'>
            Front of Cards
          </label>
        </div>
        <div class='clear' style='height: 5px;'></div>
        <div class='inlineinputs'>
          <label style='width: 75px;'>GM sees:</label>
          <label>
            <input class='gm_seenumcards' type='checkbox'>
            Number of Cards
          </label>
          <label>
            <input class='gm_seefrontofcards' type='checkbox'>
            Front of Cards
          </label>
        </div>
        <div class='clear' style='height: 5px;'></div>
        <hr>
        <!-- BEGIN MOD -->
        <button class='btn deck-mass-cards-by-url' style='float: right; margin-left: 5px;' data-deck-id="<$!this.id$>">
          Add Cards from URLs
        </button>
        <!-- END MOD -->
        <button class='addcard btn' style='float: right;'>
          <span class='pictos'>&</span>
          Add Card
        </button>
        <h3>Cards</h3>
        <div class='clear' style='height: 7px;'></div>
        <table class='table table-striped'>
          <tbody></tbody>
        </table>
        <div class='clear' style='height: 15px;'></div>
        <label>
          <strong>Card Backing (Required)</strong>
        </label>
        <div class='clear' style='height: 7px;'></div>
        <!-- BEGIN MOD -->
        <button class='btn deck-image-by-url' style="margin-bottom: 10px" data-deck-id="<$!this.id$>">Set image from URL...</button>
        <!-- END MOD -->
        <div class="avatar dropbox <$! this.get("avatar") != "" ? "filled" : "" $>">
        <div class='status'></div>
        <div class='inner'></div>
        <$ if(this.get("avatar") == "") { $>
        <h4 style='padding-bottom: 0px; marigin-bottom: 0px; color: #777;'>Drop a file</h4>
        <br>or</br>
        <button class='btn'>Choose a file...</button>
        <input class='manual' type='file'>
        <$ } else { $>
        <img src="<$!this.get("avatar")$>" />
        <div class='remove'>
          <a href='javascript:void(0);'>Remove</a>
        </div>
        <$ } $>
        </div>
        </div>
        <div class='clear' style='height: 20px;'></div>
        <p style='float: left;'>
          <button class='btn dupedeck'>Duplicate Deck</button>
        </p>
        <$ if(this.id != "A778E120-672D-49D0-BAF8-8646DA3D3FAC") { $>
        <p style='text-align: right;'>
          <button class='btn btn-danger deletedeck'>Delete Deck</button>
        </p>
        <$ } $>
      </div>
    </script>
	`;
	d20plus.template.cardeditor = `
    <script id='tmpl_cardeditor' type='text/html'>
      <div class='dialog largedialog cardeditor' style='display: block;'>
        <label>Name</label>
        <input class='name' type='text'>
        <div class='clear'></div>
        <!-- BEGIN MOD -->
        <button class='btn card-image-by-url' style="margin-bottom: 10px" data-card-id="<$!this.id$>">Set image from URL...</button>
        <!-- END MOD -->
        <div class="avatar dropbox <$! this.get("avatar") != "" ? "filled" : "" $>">
        <div class="status"></div>
        <div class="inner">
        <$ if(this.get("avatar") == "") { $>
        <h4 style='padding-bottom: 0px; marigin-bottom: 0px; color: #777;'>Drop a file</h4>
        <br>or</br>
        <button class='btn'>Choose a file...</button>
        <input class='manual' type='file'>
        <$ } else { $>
        <img src="<$!this.get("avatar")$>" />
        <div class='remove'>
          <a href='javascript:void(0);'>Remove</a>
        </div>
        <$ } $>
        </div>
        </div>
        <div class='clear'></div>
        <label>&nbsp;</label>
        <button class='deletecard btn btn-danger'>Delete Card</button>
      </div>
    </script>
	`;
};

SCRIPT_EXTENSIONS.push(baseTemplate);
