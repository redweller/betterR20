module.exports = {

	cfg_tab_tokens: ["Tokens"],
	cfg_tab_canvas: ["Canvas"],
	cfg_tab_import: ["Import"],
	cfg_tab_interface: ["Interface"],
	cfg_tab_chat: ["Chat"],

	cfg_option_whisper_name: ["Whisper Token Name to Mass-Rolls"],
	cfg_option_quick_init_sort: ["Add Quick Initiative Sort Button"],
	cfg_option_grid_snap: ["Grid Snap"],
	cfg_option_scaled_names: ["Scaled Names and Status Icons"],
	cfg_option_show_fl: ["Include the Floors layer (reload to apply changes)"],
	cfg_option_show_bg: ["Include the Background layer (reload to apply changes)"],
	cfg_option_show_fg: ["Include the Foreground layer (reload to apply changes)"],
	cfg_option_show_rf: ["Include the Roofs layer (reload to apply changes)"],
	cfg_option_show_light: ["Include (force) light sources button (reload to apply changes)"],
	cfg_option_show_weather: ["Include Weather layer and settings (reload to apply changes)"],
	cfg_option_import_interval: ["Rest Time between Each Map (msec)"],
	cfg_option_emoji: ["Add Emoji Replacement to Chat"],
	cfg_option_art_previews: ["Show Custom Art Previews"],
	cfg_option_toolbar_opac: ["Horizontal Toolbar Opacity"],
	cfg_option_layer_panel: ["Add Quick Layer Buttons panel"],
	cfg_option_layer_panel_position: ["-- Select left or right side to display this panel"],
	cfg_option_streamer_tags: ["Streamer-Friendly Chat Tags"],
	cfg_option_hide_r20search: ["Hide Default Journal Search Bar"],

	cfg_option_player_size: ["Set Player List size (0 - don't change)"],
	cfg_option_hide_dmswitch: ["Hide Roll20's Dark Mode switch"],
	cfg_option_hide_help: ["Hide Help Button on floating toolbar"],
	cfg_option_dm_tweaks: ["Enable background style fixes for default dark mode"],
	cfg_option_assume_ogl: ["Alternative mass rolls (only OGL 5e)"],
	cfg_option_silent_chat: ["Don't show welcome messages on load"],
	cfg_option_modest_chat: ["Use default chat style for betteR20 system messages"],
	cfg_option_select_jrnsearch: ["Select Journal search controls"],
	cfg_option_select_artlib: ["Select Art Library controls"],
	cfg_option_quick_init_clear: ["Add Quick Initiative tracker Clear Button"],
	cfg_option_hide_linesplit: ["Hide Line Splitter (reload to apply changes)"],
	cfg_option_neat_menus: ["Reorganized canvas context menu (reload to apply changes)"],
	cfg_option_quick_menu: ["Enable quick actions as copies of the menu entries added to the bottom of Reorganized menu for quick access (needs restart)<br> -- Quick action 1 is always Token to GM & back."],
	cfg_option_quick_2: ["-- Quick action 2"],
	cfg_option_quick_3: ["-- Quick action 3"],
	cfg_option_minify_tracker: ["Shrink Initiative Tracker Text"],
	cfg_option_interiors_toggle: ["Add interior/outside mode switch"],

	cfg_option_legacy_chat: ["Use green/black style for betteR20 system messages"],
	cfg_option_resize_sidebar: ["Resize textbox & tabs with sidebar (requires restart)"],
	cfg_option_welcome_msg: ["Show welcome message on load"],
	cfg_option_log_players_in_chat: ["Show player connects messages"],
	cfg_option_enable_social: ["Enable chat social panel (requires restart)"],
	cfg_option_languages: ["Enable in-game languages (via social panel or /in)"],
	cfg_option_additional_commands: ["Additional text chat commands (/help for full list)"],
	cfg_option_highlight_ttms: ["Highlight text box when in TTMS mode"],
	cfg_option_versions_from_players: ["Show script version notifications from players"],
	cfg_option_share_version_info: ["Share script version numbers"],

	ui_bar_map: ["Map & Backdrop"],
	ui_bar_obj: ["Objects & Tokens"],
	ui_bar_fl: ["Floors"],
	ui_bar_bg: ["Background"],
	ui_bar_fg: ["Foreground"],
	ui_bar_rf: ["Roofs"],
	ui_bar_we: ["Weather Exclusions"],
	ui_bar_gm: ["GM's Hidden layer"],
	ui_bar_barriers: ["Dynamic Field of View"],
	ui_bar_light_n_barriers: ["Dynamic Lighting"],
	ui_bar_toggle_layer_title: ["Toggle layer visibility"],
	ui_bar_toggle_interior: ["Toggle inside/outside"],

	ui_cfg_property: ["Property"],
	ui_cfg_value: ["Value"],
	ui_cfg_save: ["Save"],

	ui_dialog_title: ["Input value"],
	ui_dialog_select: ["Select"],
	ui_dialog_submit: ["Submit"],
	ui_dialog_cancel: ["Cancel"],

	ui_updated: ["Updated"],

	ui_tokened_details: ["Details"],
	ui_tokened_gmnotes: ["GM Notes"],
	ui_tokened_dynlight: ["Dynamic Lighting"],
	ui_tokened_leglight: ["Legacy Lighting"],

	ui_lang_subst_title: ["Choose transcription"],

	ui_lang_subst_subtitle: ["What does $0 language sound like?"],
	ui_lang_subst_p1: ["It seems you're trying to speak language not included in the standard list of D&D 5e PHB."],
	ui_lang_subst_p2: ["That's not a problem. Please select one of the languages from the dropdown below, and it will be used for the imitated message."],
	ui_lang_subst_p3: ["Your choice is purely cosmetic and will not affect who can or can not understand it. This will be remembered until you refresh the page."],
	ui_lang_subst_select: ["Transcribe as:"],
	ui_lang_subst_p_eg: ["This is what your message will look like with the current selection to those who don't speak $0:"],

	menu_unlock: ["Unlock..."],

	menu_card_title: ["Decks"],
	menu_take_card: ["Take Card"],
	menu_flip_card: ["Flip Card"],

	menu_edit_title: ["Edit"],
	menu_edit_del: ["Delete"],
	menu_edit_copy: ["Copy"],
	menu_edit_paste: ["Paste"],
	menu_edit_undo: ["Undo"],

	menu_move_title: ["Move"],
	menu_move_tofront: ["To Front"],
	menu_move_forwone: ["Forward One"],
	menu_move_backone: ["Back One"],
	menu_move_toback: ["To Back"],

	menu_view_title: ["Assign view"],
	menu_layer_title: ["Layer"],
	menu_layer_map: ["Map"],
	menu_layer_fl: ["Floors"],
	menu_layer_bg: ["Background"],
	menu_layer_obj: ["Tokens"],
	menu_layer_fg: ["Foreground"],
	menu_layer_rf: ["Roofs"],
	menu_layer_gm: ["GM Hidden"],
	menu_layer_barriers: ["Field of view"],
	menu_layer_weather: ["Weather"],

	menu_util_title: ["Utilities"],
	menu_util_start: ["Start Scene"],
	menu_util_animate: ["Animate"],
	menu_util_flight: ["Set&nbsp;Flight&nbsp;Height"],
	menu_util_light: ["Set&nbsp;Light"],

	menu_adv_title: ["Advanced"],
	menu_adv_grp: ["Group"],
	menu_adv_regrp: ["Reroup"],
	menu_adv_ungrp: ["Ungroup"],
	menu_adv_isdrv: ["Is Drawing"],
	menu_adv_flh: ["Flip Horizontal"],
	menu_adv_flv: ["Flip Vertical"],
	menu_adv_dimens: ["Set Dimensions"],
	menu_adv_align: ["Align to Grid"],
	menu_adv_lock: ["Lock"],
	menu_adv_unlock: ["Unlock"],
	menu_adv_tokenid: ["View Token ID"],
	menu_adv_pathid: ["View Path ID"],

	menu_token_title: ["Token Tasks"],
	menu_token_turn: ["Add Turn"],

	menu_mass_title: ["Mass Roll"],
	menu_mass_init: ["Initiative"],
	menu_mass_save: ["Saving Throw"],
	menu_mass_skill: ["Skill Check"],

	menu_multi_title: ["Multi-Sided"],
	menu_multi_rnd: ["Random Side"],
	menu_multi_select: ["Choose Side"],
	menu_multi_size: ["Set Side Size"],

	menu_quick_togm: ["Hide from layer"],
	menu_quick_tofg: ["To visible layer"],
	menu_quick_toback: ["Move behind"],
	menu_quick_save: ["Roll save"],

	stat_save_str: ["Strength"],
	stat_save_dex: ["Dexterity"],
	stat_save_con: ["Constitution"],
	stat_save_int: ["Intelligence"],
	stat_save_wis: ["Wisdom"],
	stat_save_cha: ["Charisma"],

	stat_ab_athl: ["Athletics"],
	stat_ab_acrb: ["Acrobatics"],
	stat_ab_sloh: ["Sleight of Hand"],
	stat_ab_stel: ["Stealth"],
	stat_ab_arcn: ["Arcana"],
	stat_ab_hist: ["History"],
	stat_ab_invs: ["Investigation"],
	stat_ab_natr: ["Nature"],
	stat_ab_relg: ["Religion"],
	stat_ab_anih: ["Animal Handling"],
	stat_ab_insg: ["Insight"],
	stat_ab_medc: ["Medicine"],
	stat_ab_perc: ["Perception"],
	stat_ab_surv: ["Survival"],
	stat_ab_decp: ["Deception"],
	stat_ab_intm: ["Intimidation"],
	stat_ab_perf: ["Performance"],
	stat_ab_pers: ["Persuasion"],

	stat_init: ["INITIATIVE"],

	lang_common: ["Common"],
	lang_dwarvish: ["Dwarvish"],
	lang_elvish: ["Elvish"],
	lang_giant: ["Giant"],
	lang_gnomish: ["Gnomish"],
	lang_goblin: ["Goblin"],
	lang_halfling: ["Halfling"],
	lang_orcish: ["Orcish"],
	lang_abyssal: ["Abyssal"],
	lang_celestial: ["Celestial"],
	lang_draconic: ["Draconic"],
	lang_deepspeech: ["Deepspeech"],
	lang_infernal: ["Infernal"],
	lang_primordial: ["Primordial"],
	lang_sylvan: ["Sylvan"],
	lang_undercommon: ["Undercommon"],

	lang_alias_common: [""],
	lang_alias_dwarvish: [""],
	lang_alias_elvish: [""],
	lang_alias_giant: [""],
	lang_alias_gnomish: [""],
	lang_alias_goblin: [""],
	lang_alias_halfling: [""],
	lang_alias_orcish: [""],
	lang_alias_abyssal: [""],
	lang_alias_celestial: [""],
	lang_alias_draconic: [""],
	lang_alias_deepspeech: [""],
	lang_alias_infernal: [""],
	lang_alias_primordial: [""],
	lang_alias_sylvan: [""],
	lang_alias_undercommon: [""],

	msg_chat_help_w: ["private message (whisper)"],
	msg_chat_help_wgm: ["private message to your GM"],
	msg_chat_help_wb: ["PM back to last contact"],
	msg_chat_help_ws: ["PM to selected tokens (GM)"],
	msg_chat_help_versions: ["get script versions (GM)"],
	msg_chat_help_em: ["emote (action from your POV)"],
	msg_chat_help_in: ["speak in a language"],
	msg_chat_help_inname: ["skip word (for in-language)"],
	msg_chat_help_cl: ["comprehend language switch"],
	msg_chat_help_sm: ["silent mode on/off"],
	msg_chat_help_ttms: ["shortcut to /talktomyself"],
	msg_chat_help_mtms: ["execute silently"],
	msg_chat_help_ooc: ["out of character emote"],
	msg_chat_help_r: ["roll dice, e.g. /r 2d6"],
	msg_chat_help_gr: ["roll only for GM"],
	msg_chat_help_desc: ["GM-only describe events"],
	msg_chat_help_as: ["GM-only speak as Name"],
	msg_chat_help_emas: ["GM-only emote as Name"],
	msg_chat_help_il: ["inline dice roll"],
	msg_chat_help_fi: ["format text: italic"],
	msg_chat_help_fb: ["format text: bold"],
	msg_chat_help_fc: ["format text: code"],
	msg_chat_help_fs: ["format text: strikethrough"],
	msg_chat_help_fx: ["show visual effect"],
	msg_chat_help_m: ["run specified macro"],
	msg_chat_help: ["show this list of chat commands"],

	msg_chat_lang_title: [`You understand this because one of your characters speaks`],

	msg_b20_chat_help: [`<li>Full list of chat commands<br>type or press $0<br>or visit <a target='blank' href='$1'>roll20 wiki</a></li>`],
	msg_b20_chat_help_title: [`<strong>List of chat commands:</strong><br>betteR20 commands marked with &#42;`],

	msg_b20_vtte_init: [`VTTE detected and $0 successfully loaded.<br>`],
	msg_b20_version_stream: [`<br>A newer version of $0 is available.<br><br>`],
	msg_b20_version: [`<br>A newer version of $0 is available.<br>Get $1 <a href="$2">5etools</a> OR <a href="$3">core</a>.<br><br>`],

	msg_welcome_versions: ["VTTES v$1 detected<br>$0 loaded"],
	msg_welcome_faq: ["Need help? Visit our <a href=\"$0/index.php/BetteR20_FAQ\"><strong>wiki</strong></a> or join our"],
	msg_welcome_sarcasm: ["You'd think this would be obvious."],
	msg_welcome_p1: ["Please DO NOT post about this script or any related content in official channels, including the Roll20 forums."],
	msg_welcome_p2: ["Before reporting a bug on the Roll20 forums, please disable the script and check if the problem persists."],

	msg_player_connected: [`connected`],
	msg_player_joined: [`joined`],
	msg_status_name: [`status`],
	msg_player_disconnected: [`disconnected`],
};