const baseTemplate = function () {
	d20plus.template = {};

	d20plus.template.swapTemplates = () => {
		document.dispatchEvent(new Event(`b20initTemplates`));
		d20plus.ut.log("Swapping templates...");
		$("#tmpl_charactereditor").html($(d20plus.html.characterEditor).html());
		$("#tmpl_handouteditor").html($(d20plus.html.handoutEditor).html());
		$("#tmpl_deckeditor").html($(d20plus.html.deckEditor).html());
		$("#tmpl_cardeditor").html($(d20plus.html.cardEditor).html());
		// ensure tokens have editable sight
		$("#tmpl_tokeneditor").replaceWith(d20plus.html.tokenEditor);
		// show dynamic lighting/etc page settings
		$("#tmpl_pagesettings").replaceWith(d20plus.html.roll20pageSettings);
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
};

SCRIPT_EXTENSIONS.push(baseTemplate);
