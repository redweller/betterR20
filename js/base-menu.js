function baseMenu () {
	d20plus.menu = {};

	d20plus.menu.addSelectedTokenCommands = () => {
		d20plus.ut.log("Add token rightclick commands");
		if (d20plus.cfg.getOrDefault("canvas", "enableNeatMenus")) {
			$("#tmpl_actions_menu").replaceWith(d20plus.menu.generateNeatActionsMenu());
		} else {
			$("#tmpl_actions_menu").replaceWith(d20plus.html.actionsMenu);
		}

		const getTokenWhisperPart = () => d20plus.cfg.getOrDefault("token", "massRollWhisperName") ? "/w gm Rolling for @{selected|token_name}...\n" : "";

		Mousetrap.bind("b b", function () { // back on layer
			const n = d20plus.engine.getSelectedToMove();
			d20plus.engine.backwardOneLayer(n);
			return false;
		});

		Mousetrap.bind("b f", function () { // forward one layer
			const n = d20plus.engine.getSelectedToMove();
			d20plus.engine.forwardOneLayer(n);
			return false;
		});

		/**
		 * @param token A token.
		 * @return {number} 0 for unknown, 1 for NPC, 2 for PC.
		 */
		function getTokenType (token) {
			if (token && token.model && token.model.toJSON && token.model.toJSON().represents) {
				const charIdMaybe = token.model.toJSON().represents;
				if (!charIdMaybe) return 0; //
				const charMaybe = d20.Campaign.characters.get(charIdMaybe);
				if (charMaybe) {
					const atbs = charMaybe.attribs.toJSON();
					const npcAtbMaybe = atbs.find(it => it.name === "npc");

					if (npcAtbMaybe && Number(npcAtbMaybe.current) === 1) {
						return 1;
					} else {
						return 2;
					}
				} else return 0;
			} else return 0;
		}

		const lastContextSelection = {
			lastAnimUid: null,
			lastSceneUid: null,
		};

		const tagSize = "?roll20_token_size=";
		const tagSkip = "?roll20_skip_token=";

		/* eslint-disable */

		// BEGIN ROLL20 CODE
		var e, t = !1, n = [];
		var i = function() {
			t && (t.remove(),
				t = !1),
			e && clearTimeout(e)
		};
		var r = function (r) {
			var o, a;
			r.changedTouches && r.changedTouches.length > 0 ? (o = r.changedTouches[0].pageX,
				a = r.changedTouches[0].pageY) : (o = r.pageX,
				a = r.pageY),
				i(),
				n = [];
			for (var s = [], l = d20.engine.selected(), c = 0; c < l.length; c++)
				n.push(l[c]),
					s.push(l[c].type);
			if (s = _.uniq(s),
			n.length > 0)
				if (1 == s.length) {
					var u = n[0];
					t = $("image" == u.type && 0 == u.model.get("isdrawing") ? $("#tmpl_actions_menu").jqote(u.model) : $("#tmpl_actions_menu").jqote(u.model))
				} else {
					var u = n[0];
					t = $($("#tmpl_actions_menu").jqote(u.model))
				}
			else
				t = $($("#tmpl_actions_menu").jqote({}));
			if (!window.is_gm && t[0].lastElementChild.childElementCount < 1)
				return !1;
			t.appendTo("body");
			// BEGIN MOD
			if (d20plus.cfg.getOrDefault("canvas", "enableNeatMenus")) {
				setTimeout(() => {
					const group = $(`.actions_menu > ul > li`).find(`[data-menuname='token']`);
					if (!group.length) return;
					$('[id^=r20es-token-ctx-menu-button-]').each( function () {
						$(this).detach().appendTo(group);
					});
				}, 10);
			}
			// END MOD
			var d = t.height()
				, h = t.width()
				, p = {};
			
			// BEGIN MOD
			// This block is pasted from newer version of roll20 Menu code, with appropriate changes to vars etc
			const r20ping = (u,i)=>{
				var y, d;
				const {canvasZoom: r, currentCanvasOffset: n, paddingOffset: c, pings: p} = d20.engine
					, {currentPlayer: {id: C}, currentEditingLayer: b, is_gm: S} = window;
				if (C && ((d = (y = p[C]) == null ? void 0 : y.radius) != null ? d : 0) <= 20) {
					const x = Math.floor(o / r + n[0] - c[0] / r)
						, k = Math.floor(a / r + n[1] - c[1] / r)
						, D = {
						left: x,
						top: k,
						radius: -5,
						player: C,
						pageid: d20.Campaign.activePage().id,
						currentLayer: b
					};
					(S && u.shiftKey || i) && (D.scrollto = !0),
					p[C] = D,
					d20.engine.pinging = {
						downx: o,
						downy: a
					},
					d20.engine.redrawScreenNextTick(!0)
				}
			}
			;
			// END MOD
			return p.top = a > $("#editor-wrapper").height() - $("#playerzone").height() - d - 100 ? a - d + "px" : a + "px",
				p.left = o > $("#editor-wrapper").width() - h ? o + 10 - h + "px" : o + 10 + "px",
				t.css(p),
				$(".actions_menu").bind("mousedown mouseup touchstart", function(e) {
					e.stopPropagation()
				}),
				$(".actions_menu ul > li").bind("mouseover touchend", function() {
					if (e && (clearTimeout(e),
						e = !1),
					$(this).parents(".hasSub").length > 0)
						;
					else if ($(this).hasClass("hasSub")) {
						$(".actions_menu").css({
							width: "215px",
							height: "250px"
						});
						var t = this;
						_.defer(function() {
							$(".actions_menu ul.submenu").hide(),
								$(t).find("ul.submenu:hidden").show()
						})
					} else
						$(".actions_menu ul.submenu").hide()
				}),
				$(".actions_menu ul.submenu").live("mouseover", function() {
					e && (clearTimeout(e),
						e = !1)
				}),
				$(".actions_menu, .actions_menu ul.submenu").live("mouseleave", function() {
					e || (e = setTimeout(function() {
						$(".actions_menu ul.submenu").hide(),
							$(".actions_menu").css("width", "100px").css("height", "auto"),
							e = !1
					}, 500))
				}),
				$(".actions_menu li").on(clicktype, function(evt) {
					var e = $(this).attr("data-action-type");
					if (null != e) {
						if ("copy" == e)
							d20.clipboard.doCopy(),
								i();
						else if ("paste" == e)
							d20.clipboard.doPaste(),
								i();
						else if ("delete" == e) {
							var t = d20.engine.selected();
							d20.engine.canvas.deactivateAllWithDispatch();
							for (var r = 0; r < t.length; r++)
								t[r].model.destroy();
							i()
						} else if ("undo" == e)
							d20.undo && d20.undo.doUndo(),
								i();
						else if ("tofront" == e)
							d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
								_.each(n, function(e) {
									d20.engine.canvas.bringToFront(e)
								}),
								d20.Campaign.activePage().debounced_recordZIndexes(),
								i();
						else if ("toback" == e)
							d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
								_.each(n, function(e) {
									d20.engine.canvas.sendToBack(e)
								}),
								d20.Campaign.activePage().debounced_recordZIndexes(),
								i();
						// BEGIN MOD
						// This block is pasted from newer version of roll20 Menu code, with appropriate changes to vars etc
						else if (e === "ping")
							r20ping(evt),
							i();
						else if (e === "focusping")
							r20ping(evt, !0),
							i();
						// END MOD
						else if (-1 !== e.indexOf("tolayer_")) {
							d20.engine.unselect();
							var o = e.replace("tolayer_", "");
							_.each(n, function(e) {
								e.model.save({
									layer: o
								})
							}),
								i(),
								d20.token_editor.removeRadialMenu()
						} else if ("addturn" == e)
							_.each(n, function(e) {
								d20.Campaign.initiativewindow.addTokenToList(e.model.id)
							}),
								i(),
							d20.tutorial && d20.tutorial.active && $(document.body).trigger("addedTurn");
						else if ("group" == e) {
							var a = [];
							d20.engine.unselect(),
								_.each(n, function(e) {
									a.push(e.model.id)
								}),
								_.each(n, function(e) {
									e.model.addToGroup(a)
								}),
								i();
							var s = n[0];
							d20.engine.select(s)
						} else if ("ungroup" == e)
							d20.engine.unselect(),
								_.each(n, function(e) {
									e.model.clearGroup()
								}),
								d20.token_editor.removeRadialMenu(),
								i();
						else if ("toggledrawing" == e)
							d20.engine.unselect(),
								_.each(n, function(e) {
									e.model.set({
										isdrawing: !e.model.get("isdrawing")
									}).save()
								}),
								i(),
								d20.token_editor.removeRadialMenu();
						else if ("toggleflipv" == e)
							d20.engine.unselect(),
								_.each(n, function(e) {
									e.model.set({
										flipv: !e.model.get("flipv")
									}).save()
								}),
								i(),
								d20.token_editor.removeRadialMenu();
						else if ("togglefliph" == e)
							d20.engine.unselect(),
								_.each(n, function(e) {
									e.model.set({
										fliph: !e.model.get("fliph")
									}).save()
								}),
								i(),
								d20.token_editor.removeRadialMenu();
						else if ("takecard" == e)
							d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
								_.each(n, function(e) {
									var t = d20.decks.cardByID(e.model.get("cardid"));
									if (e.model.get("isdrawing") === !1)
										var n = {
											bar1_value: e.model.get("bar1_value"),
											bar1_max: e.model.get("bar1_max"),
											bar2_value: e.model.get("bar2_value"),
											bar2_max: e.model.get("bar2_max"),
											bar3_value: e.model.get("bar3_value"),
											bar3_max: e.model.get("bar3_max")
										};
									d20.Campaign.hands.addCardToHandForPlayer(t, window.currentPlayer, n ? n : void 0),
										_.defer(function() {
											e.model.destroy()
										})
								}),
								d20.engine.unselect(),
								i();
						else if ("flipcard" == e)
							d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
								_.each(n, function(e) {
									var t = e.model.get("sides").split("|")
										, n = e.model.get("currentSide")
										, i = n + 1;
									i > t.length - 1 && (i = 0),
										e.model.set({
											currentSide: i,
											imgsrc: unescape(t[i])
										}).save()
								}),
								i();
						// BEGIN MOD
						// This block is pasted from newer version of roll20 Menu code, with appropriate changes to vars etc
	                    else if (e === "removecard")
							d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
								_.each(n, function(e) {
									d20.decks.cardByID(e.model.get("cardid")).save({
										is_removed: !0
									}),
									_.defer(()=>{
										e.model.destroy()
									}
									),
									d20.decks.refreshRemovedPiles()
								}
								),
								i();
						// END MOD
						else if ("setdimensions" == e) {
							var l = n[0]
								, c = $($("#tmpl_setdimensions").jqote()).dialog({
								title: "Set Dimensions",
								width: 325,
								height: 225,
								buttons: {
									Set: function() {
										var e, t;
										"pixels" == c.find(".dimtype").val() ? (e = parseInt(c.find("input.width").val(), 10),
											t = parseInt(c.find("input.height").val(), 10)) : (e = parseFloat(c.find("input.width").val()) * window.dpi,
											t = parseFloat(c.find("input.height").val()) * window.dpi),
											l.model.save({
												width: e,
												height: t
											}),
											c.off("change"),
											c.dialog("destroy").remove()
									},
									Cancel: function() {
										c.off("change"),
											c.dialog("destroy").remove()
									}
								},
								beforeClose: function() {
									c.off("change"),
										c.dialog("destroy").remove()
								}
							});
							c.on("change", ".dimtype", function() {
								"pixels" == $(this).val() ? (c.find("input.width").val(Math.round(l.get("width"))),
									c.find("input.height").val(Math.round(l.get("height")))) : (c.find("input.width").val(l.get("width") / window.dpi),
									c.find("input.height").val(l.get("height") / window.dpi))
							}),
								c.find(".dimtype").trigger("change"),
								i()
						} else if ("aligntogrid" == e)
							if (0 === d20.Campaign.activePage().get("snapping_increment")) {
								i();
								var u = $($("#tmpl_grid-disabled").jqote(h)).dialog({
									title: "Grid Off",
									buttons: {
										Ok: function() {
											u.off("change"),
												u.dialog("destroy").remove()
										}
									},
									beforeClose: function() {
										u.off("change"),
											u.dialog("destroy").remove()
									}
								})
							} else
								d20.engine.gridaligner.target = n[0],
									d20plus.setMode("gridalign"),
									i();
						else if ("side_random" == e) {
							d20.engine.canvas.getActiveGroup() && d20.engine.unselect();
							var d = []
								// BEGIN MOD
								, prevUrl = "none";
								// END MOD
							_.each(n, function(e) {
								if (e.model && "" != e.model.get("sides")) {
									var t = e.model.get("sides").split("|")
										, n = t.length
									// BEGIN MOD
										, i = -1
										, imgUrl = tagSkip;
									const tweakRandom = t.filter(j => !unescape(j).includes(tagSkip)).length > 1;
									while (imgUrl.includes(tagSkip)) {
										i = d20.textchat.diceengine.random(n);
										const tUrl = unescape(t[i]);
										imgUrl = tweakRandom && tUrl === prevUrl ? tagSkip : tUrl;
									}
									prevUrl = imgUrl;
									const trueUrl = getRollableTokenUpdate(imgUrl, i, e.model);
									d.push(trueUrl);
									// END MOD
								}
							}),
								d20.textchat.rawChatInput({
									type: "tokenroll",
									content: d.join("|")
								}),
								i()
						} else if ("side_choose" == e) {
							const e = n[0]
								, t = e.model.toJSON()
								, o = t.sides.split("|");
							let r = t.currentSide;
							const a = $($("#tmpl_chooseside").jqote()).dialog({
								title: "Choose Side",
								width: 325,
								height: 225,
								buttons: {
									Choose: function() {
										const imgUrl = unescape(o[r]);
										d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
											// BEGIN MOD
											getRollableTokenUpdate(imgUrl, r, e.model),
											// END MOD
											a.off("slide"),
											a.dialog("destroy").remove()
									},
									Cancel: function() {
										a.off("slide"),
											a.dialog("destroy").remove()
									}
								},
								beforeClose: function() {
									a.off("slide"),
										a.dialog("destroy").remove()
								}
							})
								, s = a.find(".sidechoices");
							for (const e of o) {
								const t = unescape(e);
								let n = d20.utils.isVideo(t) ? `<video src="${t.replace("/med.webm", "/thumb.webm")}" muted autoplay loop />` : `<img src="${t}" />`;
								n = `<div class="sidechoice">${n}</div>`,
									s.append(n)
							}
							s.children().attr("data-selected", !1).eq(r).attr("data-selected", !0),
								a.find(".sideslider").slider({
									min: 0,
									max: o.length - 1,
									step: 1,
									value: r
								}),
								a.on("slide", function(e, t) {
									t.value != r && (r = t.value,
										a.find(".sidechoices .sidechoice").attr("data-selected", !1).eq(t.value).attr("data-selected", !0))
								}),
								i(),
								d20.token_editor.removeRadialMenu()
						}
						// BEGIN MOD
						const showRollOptions = (formula, options) => {
							const sel = d20.engine.selected();

							options = options.map(it => `<option>${it}</option>`);

							const dialog= $("<div><p style='font-size: 1.15em;'><strong>" + d20.utils.strip_tags(''+__('ui_dialog_select')) + ":</strong> <select style='width: 150px; margin-left: 5px;'>" + options.join("") + "</select></p></div>");

							dialog.dialog({
								title: __('ui_dialog_title'),
								beforeClose: function() {
									return false;
								},
								buttons: {
									[__('ui_dialog_submit')+'']: function() {
										const val = dialog.find("select").val();
										console.log(val);
										d20.engine.unselect();
										sel.forEach(it => {
											d20.engine.select(it);
											const toRoll = formula(it, val);
											d20.textchat.doChatInput(toRoll);
											d20.engine.unselect();
										});

										dialog.off();
										dialog.dialog("destroy").remove();
										d20.textchat.$textarea.focus();
									},
									[__('ui_dialog_cancel')+'']: function() {
										dialog.off();
										dialog.dialog("destroy").remove();
									}
								}
							});

							i();
						};

						if ("rollsaves" === e) {
							// Mass roll: Saves
							const options = ["str", "dex", "con", "int", "wis", "cha"].map(it => Parser.attAbvToFull(it));
							if (!!d20plus.cfg.get('token','massRollAssumesOGL')) {
								const out_options = [];
								const loc_options = {
									[__('stat_save_str')]: 'Strength',
									[__('stat_save_dex')]: 'Dexterity',
									[__('stat_save_con')]: 'Constitution',
									[__('stat_save_int')]: 'Intelligence',
									[__('stat_save_wis')]: 'Wisdom',
									[__('stat_save_cha')]: 'Charisma',
								}
								for (const i in loc_options) out_options.push(i);
								showRollOptions(
									(token, val) => {
										return `@{selected|wtype} &{template:simple} {{rname=^{${loc_options[val].toLowerCase()}-save-u}}} {{charname=@{selected|token_name}}} {{mod=@{selected|${loc_options[val].toLowerCase()}_save_bonus}}} {{always=1}} {{r1=[[@{selected|d20}+@{selected|${loc_options[val].toLowerCase()}_save_bonus}]]}} {{r2=[[@{selected|d20}+@{selected|${loc_options[val].toLowerCase()}_save_bonus}]]}}`;
									},
									out_options
								);
							}
							else if (d20plus.sheet === "ogl") {
								showRollOptions(
									(token, val) => {
										if (getTokenType(token) === 1) {
											const short = val.substring(0, 3);
											return `${getTokenWhisperPart()}@{selected|wtype}&{template:npc} @{selected|npc_name_flag} {{type=Save}} @{selected|rtype} + [[@{selected|npc_${short.toLowerCase()}_save}]][${short.toUpperCase()}]]]}} {{rname=${val} Save}} {{r1=[[1d20 + [[@{selected|npc_${short.toLowerCase()}_save}]][${short.toUpperCase()}]]]}}`;
										} else {
											return `@{selected|wtype} &{template:simple} {{charname=@{selected|token_name}}} {{always=1}} {{rname=${val} Save}} {{mod=@{selected|${val.toLowerCase()}_save_bonus}}} {{r1=[[1d20+@{selected|${val.toLowerCase()}_save_bonus}]]}} {{r2=[[1d20+@{selected|${val.toLowerCase()}_save_bonus}]]}}`;
										}
									},
									options
								);
							}
							else if (d20plus.sheet === "shaped") {
								showRollOptions(
									(token, val) => `@{selected|output_option}} &{template:5e-shaped} {{ability=1}} {{character_name=@{selected|token_name}}} {{title=${val} Save}} {{mod=@{selected|${val.toLowerCase()}_mod}}} {{roll1=[[1d20+@{selected|${val.toLowerCase()}_mod}]]}} {{roll2=[[1d20+@{selected|${val.toLowerCase()}_mod}]]}}`,
									options
								);
							}
						} else if ("rollinit" === e) {
							// Mass roll: Initiative
							const sel = d20.engine.selected();
							d20.engine.unselect();
							sel.forEach(it => {
								d20.engine.select(it);
								let toRoll = ``;
								if (!!d20plus.cfg.get('token','massRollAssumesOGL')) {
									toRoll = `&{template:simple} {{rname=${__('stat_init')}}} {{charname=@{selected|token_name}}} {{mod=@{selected|initiative_bonus}}} {{always=1}} {{r1=[[@{selected|d20}+@{selected|initiative_bonus} &{tracker}]]}} {{r2=[[@{selected|d20}+@{selected|initiative_bonus}]]}}`;
								}
								else if ((d20plus.sheet === "ogl") || !!d20plus.cfg.get('token','massRollAssumesOGL')) {
									toRoll = `%{selected|Initiative}`;
								}
								else if (d20plus.sheet === "shaped") {
									toRoll = `@{selected|output_option} &{template:5e-shaped} {{ability=1}} {{title=INITIATIVE}} {{roll1=[[@{selected|initiative_formula}]]}}`;
								}
								d20.textchat.doChatInput(toRoll);
								d20.engine.unselect();
							});
							i();
						} else if ("rollskills" === e) {
							// TODO a "roll abilitiy check" option? NPC macro: @{selected|wtype}&{template:npc} @{selected|npc_name_flag} {{type=Check}} @{selected|rtype} + [[@{selected|strength_mod}]][STR]]]}} {{rname=Strength Check}} {{r1=[[1d20 + [[@{selected|strength_mod}]][STR]]]}}

							// Mass roll: Skills
							const options = [
								"Athletics",
								"Acrobatics",
								"Sleight of Hand",
								"Stealth",
								"Arcana",
								"History",
								"Investigation",
								"Nature",
								"Religion",
								"Animal Handling",
								"Insight",
								"Medicine",
								"Perception",
								"Survival",
								"Deception",
								"Intimidation",
								"Performance",
								"Persuasion"
							].sort();

							if (!!d20plus.cfg.get('token','massRollAssumesOGL')) {
								let out_options = [];
								const loc_options = {
									[__('stat_ab_athl')]: 'Athletics',
									[__('stat_ab_acrb')]: 'Acrobatics',
									[__('stat_ab_sloh')]: 'Sleight of Hand',
									[__('stat_ab_stel')]: 'Stealth',
									[__('stat_ab_arcn')]: 'Arcana',
									[__('stat_ab_hist')]: 'History',
									[__('stat_ab_invs')]: 'Investigation',
									[__('stat_ab_natr')]: 'Nature',
									[__('stat_ab_relg')]: 'Religion',
									[__('stat_ab_anih')]: 'Animal Handling',
									[__('stat_ab_insg')]: 'Insight',
									[__('stat_ab_medc')]: 'Medicine',
									[__('stat_ab_perc')]: 'Perception',
									[__('stat_ab_surv')]: 'Survival',
									[__('stat_ab_decp')]: 'Deception',
									[__('stat_ab_intm')]: 'Intimidation',
									[__('stat_ab_perf')]: 'Performance',
									[__('stat_ab_pers')]: 'Persuasion',
								}
								for (const i in loc_options) out_options.push(i);
								out_options = out_options.sort();
								showRollOptions(
									(token, val) => {
										const ready_val = loc_options[val].toLowerCase().replace(/ /g, "_");
										return `&{template:simple} {{rname=^{${ready_val}-u}}} {{charname=@{selected|token_name}}} {{mod=@{selected|${ready_val}_bonus}}} {{always=1}} {{r1=[[@{selected|d20}+@{selected|${ready_val}_bonus}]]}} {{r2=[[@{selected|d20}+@{selected|${ready_val}_bonus}]]}}`;
									},
									out_options
								);
							}
							else {
								showRollOptions(
									(token, val) => {
										const clean = val.toLowerCase().replace(/ /g, "_");
										const abil = `${Parser.attAbvToFull(Parser.skillToAbilityAbv(val.toLowerCase())).toLowerCase()}_mod`;
	
										let doRoll = '';
										if (d20plus.sheet === "ogl") {
											doRoll = (atb = abil) => {
												if (getTokenType(token) === 1) {
													const slugged = val.replace(/\s/g, "_").toLowerCase();
													return `${getTokenWhisperPart()}@{selected|wtype}&{template:npc} @{selected|npc_name_flag} {{type=Skill}} @{selected|rtype} + [[@{selected|npc_${slugged}}]]]]}}; {{rname=${val}}}; {{r1=[[1d20 + [[@{selected|npc_${slugged}}]]]]}}`;
												} else {
													return `@{selected|wtype} &{template:simple} {{charname=@{selected|token_name}}} {{always=1}} {{rname=${val}}} {{mod=@{selected|${atb}}}} {{r1=[[1d20+@{selected|${atb}}]]}} {{r2=[[1d20+@{selected|${atb}}]]}}`;
												}
											}
										} 
										else if (d20plus.sheet === "shaped"){
											doRoll = (atb = abil) => {
												return `@{selected|output_option} &{template:5e-shaped} {{ability=1}} {{character_name=@{selected|token_name}}} {{title=${val}}} {{mod=@{selected|${atb}}}} {{roll1=[[1d20+@{selected|${atb}}]]}} {{roll2=[[1d20+@{selected|${atb}}]]}}`;
											}
										}
	
										try {
											if (token && token.model && token.model.toJSON && token.model.toJSON().represents) {
												const charIdMaybe = token.model.toJSON().represents;
												if (!charIdMaybe) return doRoll();
												const charMaybe = d20.Campaign.characters.get(charIdMaybe);
												if (charMaybe) {
													const atbs = charMaybe.attribs.toJSON();
													const npcAtbMaybe = atbs.find(it => it.name === "npc");
	
													if (npcAtbMaybe && npcAtbMaybe.current == 1) {
														const npcClean = `npc_${clean}`;
														const bonusMaybe = atbs.find(it => it.name === npcClean);
														if (bonusMaybe) return doRoll(npcClean);
														else return doRoll();
													} else {
														const pcClean = `${clean}_bonus`;
														const bonusMaybe = atbs.find(it => it.name === pcClean);
														if (bonusMaybe) return doRoll(pcClean);
														else return doRoll();
													}
												} else return doRoll();
											} else return doRoll();
										} catch (x) {
											console.error(x);
											return doRoll();
										}
									},
									options
								);
							}

							
						} else if ("forward-one" === e) {
							d20plus.engine.forwardOneLayer(n);
							i();
						} else if ("back-one" === e) {
							d20plus.engine.backwardOneLayer(n);
							i();
						} else if ("edittokenimages" === e) {
							d20plus.menu.editToken();
							i();
						} else if ("copy-tokenid" === e) {
							const sel = d20.engine.selected();
							window.prompt("Copy to clipboard: Ctrl+C, Enter", sel[0].model.id);
							i();
						} else if ("copy-pathid" === e) {
							const sel = d20.engine.selected();
							window.prompt("Copy to clipboard: Ctrl+C, Enter", sel[0].model.id);
							i();
						} else if ("token-fly" === e) {
							const sel = d20.engine.selected().filter(it => it && it.type === "image");
							new Promise((resolve, reject) => {
								const $dialog = $(`
									<div title="Flight Height">
										<input type="number" placeholder="Flight height" name="flight">
									</div>
								`).appendTo($("body"));
								const $iptHeight = $dialog.find(`input[name="flight"]`).on("keypress", evt => {
									if (evt.which === 13) { // return
										doHandleOk();
									}
								});

								const doHandleOk = () => {
									const selected = Number($iptHeight.val());
									$dialog.dialog("close");
									if (isNaN(selected)) reject(`Value "${$iptHeight.val()}" was not a number!`);
									else resolve(selected);
								};

								$dialog.dialog({
									dialogClass: "no-close",
									buttons: [
										{
											text: "Cancel",
											click: function () {
												$(this).dialog("close");
												$dialog.remove();
												reject(`User cancelled the prompt`);
											}
										},
										{
											text: "OK",
											click: function () {
												doHandleOk();
											}
										}
									]
								});
							}).then(num => {
								const STATUS_PREFIX = `fluffy-wing@`;
								const statusString = `${num}`.split("").map(it => `${STATUS_PREFIX}${it}`).join(",");
								sel.forEach(s => {
									const existing = s.model.get("statusmarkers");
									if (existing && existing.trim()) {
										s.model.set("statusmarkers", [statusString, ...existing.split(",").filter(it => it && it && !it.startsWith(STATUS_PREFIX))].join(","));
									} else {
										s.model.set("statusmarkers", statusString);
									}
									s.model.save();
								});
							});
							i();
						} else if ("token-light" === e) {
							const SOURCES = {
								"None (Blind)": {
									bright: 0,
									dim: 0
								},
								"Torch/Light (Spell)": {
									bright: 20,
									dim: 20
								},
								"Lamp": {
									bright: 15,
									dim: 30
								},
								"Lantern, Bullseye": {
									bright: 60,
									dim: 60,
									angle: 30
								},
								"Lantern, Hooded": {
									bright: 30,
									dim: 30
								},
								"Lantern, Hooded (Dimmed)": {
									bright: 0,
									dim: 5
								},
								"Candle": {
									bright: 5,
									dim: 5
								},
								"Darkvision": {
									bright: 0,
									dim: 60,
									hidden: true
								},
								"Superior Darkvision": {
									bright: 0,
									dim: 120,
									hidden: true
								}
							};

							const sel = d20.engine.selected().filter(it => it && it.type === "image");
							new Promise((resolve, reject) => {
								const $dialog = $(`
									<div title="Light">
										<label class="flex">
											<span>Set Light Style</span>
											 <select style="width: 250px;">
												${Object.keys(SOURCES).map(it => `<option>${it}</option>`).join("")}
											</select>
										</label>
									</div>
								`).appendTo($("body"));
								const $selLight = $dialog.find(`select`);

								$dialog.dialog({
									dialogClass: "no-close",
									buttons: [
										{
											text: "Cancel",
											click: function () {
												$(this).dialog("close");
												$dialog.remove();
												reject(`User cancelled the prompt`);
											}
										},
										{
											text: "OK",
											click: function () {
												const selected = $selLight.val();
												$dialog.dialog("close");
												if (!selected) reject(`No value selected!`);
												else resolve(selected);
											}
										}
									]
								});
							}).then(key => {
								const light = SOURCES[key];

								const light_otherplayers = !light.hidden;
								// these are all stored as strings
								const dimRad = (light.dim || 0);
								const brightRad = (light.bright || 0);
								const totalRad = dimRad + brightRad;
								const light_angle = `${light.angle}` || "";
								const light_dimradius = `${totalRad - dimRad}`;
								const light_radius = `${totalRad}`;

								sel.forEach(s => {
									s.model.set("light_angle", light_angle);
									s.model.set("light_dimradius", light_dimradius);
									s.model.set("light_otherplayers", light_otherplayers);
									s.model.set("light_radius", light_radius);
									s.model.save();
								});
							});
							i();
						} else if ("unlock-tokens" === e) {
							d20plus.tool.get("UNLOCKER").openFn();
							i();
						} else if ("lock-token" === e) {
							d20.engine.selected().forEach(it => {
								if (it.model) {
									if (it.model.get("VeLocked")) {
										it.lockMovementX = false;
										it.lockMovementY = false;
										it.lockScalingX = false;
										it.lockScalingY = false;
										it.lockRotation = false;

										it.model.set("VeLocked", false);
									} else {
										it.lockMovementX = true;
										it.lockMovementY = true;
										it.lockScalingX = true;
										it.lockScalingY = true;
										it.lockRotation = true;

										it.model.set("VeLocked", true);
									}
									it.saveState();
									it.model.save();
								}
							});
							i();
						} else if ("token-animate" === e) {
							d20plus.anim.animatorTool.pSelectAnimation(lastContextSelection.lastAnimUid).then(animUid => {
								if (animUid == null) return;

								lastContextSelection.lastAnimUid = animUid;
								const selected = d20.engine.selected();
								d20.engine.unselect();
								selected.forEach(it => {
									if (it.model) {
										d20plus.anim.animator.startAnimation(it.model, animUid)
									}
								});
							});
							i();
						} else if ("util-scenes" === e) {
							d20plus.anim.animatorTool.pSelectScene(lastContextSelection.lastSceneUid).then(sceneUid => {
								if (sceneUid == null) return;

								lastContextSelection.lastSceneUid = sceneUid;
								d20plus.anim.animatorTool.doStartScene(sceneUid);
							});
							i();
						} else if (["assignview0", "assignview1", "assignview2", "assignview3", "assignview4"].includes(e)) {
							const viewId = e.at(-1);
							d20.engine.selected().forEach(it => {
								if (it.model) {
									if (it.model.get(`bR20_view${viewId}`)) {
										it.model.set(`bR20_view${viewId}`, false);
									} else {
										if (!d20plus.engine.tokenRepresentsPc(it.model)) it.model.set(`bR20_view${viewId}`, true);
									}
									it.saveState();
									it.model.save();
								}
							});
							i();
						}
						// END MOD
						return !1
					}
				}),
				!1
		};
		// END ROLL20 CODE

		/* eslint-enable */

		function getRollableTokenUpdate (imgUrl, currentSide, token) {
			const [imgsrc, m] = (imgUrl || "").replace(tagSkip, "").split(tagSize);
			const toSave = {
				currentSide,
				imgsrc,
			};
			if (m) {
				if (isNaN(m) && m?.split) {
					const [w, h] = m.split("x");
					if (!isNaN(w) && !isNaN(h)) {
						toSave.width = Number(w);
						toSave.height = Number(h);
					}
				} else {
					toSave.width = 70 * Number(m);
					toSave.height = 70 * Number(m)
				}
			}
			token.save(toSave);
			return imgsrc;
		}

		function tokenEditorTexts (selection) {
			const name = selection.length > 1 ? "You are editing multiple tokens" : selection[0].model?.attributes?.name || "Unnamed token";
			const description = selection.length > 1 ? `
				If you press "Save", the changes will be applied to each of the selected tokens, making them multi-sided if you have multiple images on the list below
			` : selection[0].model.attributes.sides ? `
				You are currently editing images for multi-sided token. Add or remove as many sides as you want. If only one image remains, the token will become a single-sided one
			` : `
				Currently this token is represented by a single image. Add more images to convert it to multi-sided token
			`;
			const tokenList = selection.length <= 1 ? "" : selection.reduce((r, t) => `${r}
				<div class="tokenbox selected" data-tokenid="${t.model.id}" data-tokenimg="${t.model.attributes.imgsrc}">
					<div class="inner">
						<img src="${t.model.attributes.imgsrc}">
						<div class="name">${t.model.attributes.name}</div>
					</div>
				</div>
			`, "");
			return {name, description, tokenList};
		}

		d20plus.menu.editToken = (tokenId) => {
			const selection = tokenId
				? d20.engine.canvas._objects.filter(t => t.model.id === tokenId)
				: d20.engine.selected().filter(t => t.type === "image");
			if (!selection.length) return;
			const images = [];
			const added = [];
			const $dialog = $(d20plus.html.tokenImageEditor);
			const $list = $dialog.find(".tokenimagelist tbody");
			const $tokenList = $dialog.find(".tokenlist");
			const sizes = [["tiny - half square", "0.5"], ["small - 1x1", "1.0"], ["medium - 1x1", "1"], ["large - 2x2", "2"], ["huge - 3x3", "3"], ["gargantuan - 4x4", "4"], ["colossal - 5x5", "5"], ["custom", "0"]];
			const findStandardSize = (w, h) => {
				return (w === h && sizes.find(s => s[1] === `${w / 70}`)?.last()) || "0";
			}
			const addImageOnInit = (img, add) => {
				const sizeChanged = img.w !== images.last()?.w || img.h !== images.last()?.h;
				if (images.length && sizeChanged) $list.variedSizes = true;
				images.push(img);
				added.push(add || img.url);
			}
			selection.forEach(t => {
				const sides = t.model.attributes.sides?.split("|");
				const token = t.model.attributes.imgsrc;
				const {width: tw, height: th} = t.model.attributes;
				if (sides.length > 1) {
					const curSide = sides[t.model.attributes.currentSide] || token;
					sides.forEach((s, k) => {
						const checked = unescape(s);
						const listed = added.indexOf(checked);
						const [url, size] = checked.split(tagSize);
						const [sw, sh] = (size || "").split("x");
						const image = {
							url: url.replaceAll(tagSkip, ""),
							skip: url.includes(tagSkip),
							face: unescape(curSide).includes(url),
							w: tw,
							h: th,
						};
						if (listed !== -1) {
							if (k === t.model.attributes.currentSide) images[listed].face = true;
							return;
						} else if (!isNaN(size)) {
							Object.merge(image, {size, w: size * 70, h: size * 70});
						} else if (!isNaN(sw) && !isNaN(sh)) {
							Object.merge(image, {size: "0", w: sw, h: sh});
						}
						addImageOnInit(image, checked);
					});
				} else {
					const listed = added.indexOf(t.model.attributes.imgsrc);
					if (listed !== -1) images[listed].face = true;
					else addImageOnInit({url: t.model.attributes.imgsrc, face: true, w: tw, h: th});
				}
			});
			if ($list.variedSizes) {
				images.forEach(i => { if (i.size === undefined) i.size = findStandardSize(i.w, i.h); });
			}
			const htmls = tokenEditorTexts(selection);
			const resetTokens = () => {
				$tokenList.find(".selected").each((k, t) => {
					const $token = $(t);
					const $tokenimage = $token.find("img");
					$tokenimage.attr("src", $token.data("tokenimg"));
				});
			}
			const buildList = () => {
				if (images.length === 1) {
					$list.someImageSelected = true;
					images[0].selected = true;
				}
				$list.html(images.reduce((r, i, k) => `${r}
					<tr class="tokenimage${images.length === 1 ? " lastone" : ""}${i.skip ? " skipped" : ""}" data-index="${(i.id = k, k)}">
						<td style="padding:0px;" title="Current image">
							<input class="face" type="checkbox"${i.selected ? " checked" : ""}>
						</td>
						<td>
							<div class="dropbox filled">
							<div class="inner"><img src="${i.url}"><div class="remove"><span>Drop a file</span></div></div>
							</div>
						</td>
						<td>
							<label>Select size:</label><select>${sizes.reduce((o, s) => `${o}
								<option value="${s[1]}"${s[1] === i.size ? " selected" : ""}>${s[0]}</option>
							`, `<option>default (keep as is)</option>`)}</select>
							<span class="custom${i.size === "0" ? " set" : ""}"><input class="w" value="${i.w}"> X <input class="h" value="${i.h}">px</span>
							<label class="skippable"><input class="toskip" type="checkbox"${i.skip ? " checked" : ""}> Skip side on randomize</label>
						</td>
						<td style="padding:0px;">
							<span class="btn url" title="Edit URL...">j</span>
							<span class="btn delete" title="Delete">#</span>
						</td>
					</tr>
				`, ""));
				if (!$list.someImageSelected) {
					images.forEach((i, k) => {
						if (i.face) $list.find("input.face").eq(k).prop({indeterminate: true});
					});
				}
			}
			$dialog.dialog({
				autoopen: true,
				title: "Edit token image(s)",
				width: 450,
				open: () => {
					buildList();
					$tokenList.html(htmls.tokenList);
					$dialog.parent().css("maxHeight", "80vh").css("top", "10vh");
					$dialog.find(".edittitle").text(htmls.name);
					$dialog.find(".editlabel").text(htmls.description);
					$list.droppable({
						greedy: true,
						tolerance: "pointer",
						hoverClass: "ui-dropping",
						scope: "default",
						accept: ".resultimage, .library-item, .journalitem.character",
						drop: (evt, $d) => {
							evt.originalEvent.dropHandled = !0;
							evt.stopPropagation();
							evt.preventDefault();
							$d.helper.detach();
							const char = d20.Campaign.characters.get($d.draggable.data("itemid"));
							const dtoken = JSON.parse(char?._blobcache.defaulttoken || "{}");
							const url = $d.draggable.data("fullsizeurl")
								|| $d.draggable.data("url")
								|| dtoken.imgsrc;
							const img = document.elementFromPoint(evt.clientX, evt.clientY);
							const id = img.tagName === "IMG" ? $(img).closest(".tokenimage").data("index") : undefined;
							if (images[id]?.url && url) {
								images[id].url = url;
								$list.find(".dropbox img").eq(id).attr("src", url);
								if (images[id].selected) $tokenList.find(".selected img").attr("src", images[id].url);
							} else if (url) {
								if ($list.variedSizes && dtoken.width) {
									const [w, h] = [dtoken.width, dtoken.height];
									const size = findStandardSize(w, h);
									images.push({url, size, w, h});
								} else {
									images.push({url, w: 70, h: 70});
								}
								buildList();
							}
						},
					});
					$dialog.on(window.mousedowntype, ".tokenbox", evt => {
						const $token = $(evt.currentTarget);
						if ($token.hasClass("selected")) {
							if ($tokenList.find(".selected").length > 1) {
								$token.removeClass("selected");
								$token.find("img").attr("src", $token.data("tokenimg"));
							}
						} else {
							$token.addClass("selected");
							if ($list.someImageSelected) $token.find("img").attr("src", images.find(i => i.selected)?.url);
						}
					}).on("change", "select", evt => {
						const $changed = $(evt.target);
						const $token = $changed.parent();
						const $custom = $token.find(".custom").removeClass("set");
						const newSize = $changed.val();
						const id = $changed.closest(".tokenimage").data("index");
						if (newSize > 0) {
							$token.find(".w, .h").val(newSize * 70);
							images[id].size = newSize;
							$list.variedSizes = true;
						} else {
							delete images[id].size;
							if (newSize === "0") {
								$list.variedSizes = true;
								images[id].size = newSize;
								images[id].w = $token.find(".w").val();
								images[id].h = $token.find(".h").val();
								$custom.addClass("set");
							}
						}
					}).on("change", "input.face", evt => {
						const id = $(evt.target).closest(".tokenimage").data("index");
						const isChecked = $(evt.target).prop("checked");
						const $allBoxes = $list.find("input.face");
						if (isChecked) {
							$list.someImageSelected = true;
							$allBoxes.prop({checked: false}).prop({indeterminate: false});
							$(evt.target).prop({checked: true});
							$tokenList.find(".selected img").attr("src", images[id].url);
							images.forEach((i, k) => {
								if (k === id) i.selected = true;
								else i.selected = false;
							});
						} else {
							$list.someImageSelected = false;
							images[id].selected = false;
							resetTokens();
							images.forEach((i, k) => {
								if (i.face) $allBoxes.eq(k).prop({indeterminate: true});
							});
						}
					}).on("change", "input.toskip", evt => {
						const $token = $(evt.target).closest(".tokenimage");
						const id = $token.data("index");
						const isChecked = $(evt.target).prop("checked");
						if (isChecked) {
							$token.addClass("skipped");
							images[id].skip = true;
						} else {
							$token.removeClass("skipped");
							images[id].skip = false;
						}
					}).on("change", "input .w, input.h", evt => {
						const $token = $(evt.target).closest(".tokenimage");
						const id = $token.data("index");
						const set = {w: $token.find(".w").val(), h: $token.find(".h").val()};
						if (isNaN(set.w) || isNaN(set.h)) return;
						images[id].w = set.w;
						images[id].h = set.h;
					}).on(window.mousedowntype, ".url", evt => {
						const $token = $(evt.target).closest(".tokenimage");
						const $image = $token.find("img");
						const id = $token.data("index");
						const url = window.prompt("Edit URL", $image.attr("src"));
						if (!url) return;
						d20plus.art.setLastImageUrl(url);
						images[id].url = url;
						$image.attr("src", url);
					}).on(window.mousedowntype, ".delete", evt => {
						const $deleted = $(evt.target).closest(".tokenimage");
						const id = $deleted.data("index");
						if (images.length <= 1) return;
						if (images[id].selected) {
							$list.someImageSelected = false;
							resetTokens();
						}
						images.splice(id, 1);
						buildList();
						if (images.length === 1) {
							$list.someImageSelected = true;
							$list.find("input.face").prop({checked: true});
							$tokenList.find(".selected img").attr("src", images[0].url);
						}
					}).on(window.mousedowntype, ".addimageurl", () => {
						const url = window.prompt("Enter a URL", d20plus.art.getLastImageUrl());
						if (!url) return;
						d20plus.art.setLastImageUrl(url);
						images.push({url, w: 70, h: 70});
						buildList();
					})
				},
				close: () => {
					$dialog.off();
					$dialog.dialog("destroy").remove();
				},
				buttons: {
					save: {
						text: "Save changes",
						click: () => {
							const save = {};
							if (images.length > 1) {
								save.sides = images.map(i => {
									const skipped = i.skip ? tagSkip : "";
									const size = i.size ? tagSize + (i.size === "0" ? `${i.w}x${i.h}` : i.size) : "";
									return escape(i.url + skipped + size);
								}).join("|");
							} else {
								save.sides = "";
							}
							if ($list.someImageSelected) {
								const selected = images.find(i => i.selected);
								if (selected) {
									save.imgsrc = selected.url;
									save.currentSide = selected.id;
									if (selected.size === "0") {
										save.width = Number(selected.w);
										save.height = Number(selected.h);
									} else if (selected.size) {
										save.width = selected.size * 70;
										save.height = selected.size * 70;
									}
								}
							}
							if (selection.length > 1) {
								d20.engine.unselect();
							}
							selection.forEach(t => {
								if (selection.length === 1
									|| $tokenList.find(`[data-tokenid=${t.model.id}]`).hasClass("selected")) {
									t.model.save(save);
								}
							});
							$dialog.off();
							$dialog.dialog("destroy").remove();
							d20.textchat.$textarea.focus();
						},
					},
					cancel: {
						text: "Cancel",
						click: () => {
							$dialog.off();
							$dialog.dialog("destroy").remove();
						},
					},
				},
			});
			return $dialog;
		}

		d20.token_editor.showContextMenu = r;
		d20.token_editor.closeContextMenu = i;
		$(`#editor-wrapper`).on("click", d20.token_editor.closeContextMenu);
	};// RB20 EXCLUDE START

	d20plus.menu._neatActionsView = (id) => {
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
	};

	d20plus.menu.neatActions = {
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
		"edittokenimage": { ln: __("menu_adv_edit"), condition: "this.view && this.get && this.get(\"type\") == \"image\" && this.get(\"cardid\") === \"\"", action: "edittokenimages" },
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
		"edittokenimages": { ln: __("menu_multi_edit"), condition: "this.view && this.get && this.get(\"sides\") !== \"\" && this.get(\"cardid\") === \"\"" },
		"assignview0": { ln: d20plus.menu._neatActionsView("0"), active: "this && this.get(\"bR20_view0\")", condition: "this.view && this.get && !d20plus.engine.tokenRepresentsPc(this) && d20.Campaign.activePage().get('bR20cfg_viewsEnable')" },
		"assignview1": { ln: d20plus.menu._neatActionsView("1"), active: "this && this.get(\"bR20_view1\")", condition: "this.view && this.get && !d20plus.engine.tokenRepresentsPc(this) && d20.Campaign.activePage().get('bR20cfg_viewsEnable') && d20.Campaign.activePage().get('bR20cfg_views1Enable')" },
		"assignview2": { ln: d20plus.menu._neatActionsView("2"), active: "this && this.get(\"bR20_view2\")", condition: "this.view && this.get && !d20plus.engine.tokenRepresentsPc(this) && d20.Campaign.activePage().get('bR20cfg_viewsEnable') && d20.Campaign.activePage().get('bR20cfg_views2Enable')" },
		"assignview3": { ln: d20plus.menu._neatActionsView("3"), active: "this && this.get(\"bR20_view3\")", condition: "this.view && this.get && !d20plus.engine.tokenRepresentsPc(this) && d20.Campaign.activePage().get('bR20cfg_viewsEnable') && d20.Campaign.activePage().get('bR20cfg_views3Enable')" },
		"assignview4": { ln: d20plus.menu._neatActionsView("4"), active: "this && this.get(\"bR20_view4\")", condition: "this.view && this.get && !d20plus.engine.tokenRepresentsPc(this) && d20.Campaign.activePage().get('bR20cfg_viewsEnable') && d20.Campaign.activePage().get('bR20cfg_views4Enable')" },
	};

	d20plus.menu._neatStructure = {
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
				"assignview4",
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
				"edittokenimage",
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
				"edittokenimages",
			] },
		"card": {
			ln: __("menu_card_title"),
			subitems: [
				"takecard",
				"flipcard",
			] },
	};

	d20plus.menu._pushQuickMenus = () => {
		if (d20plus.cfg.getOrDefault("canvas", "enableQuickMenuItems")) {
			let output = "";
			const pushMenu = (num, action, condition) => {
				if (!action) action = d20plus.cfg.getOrDefault(`canvas`, `quickMenuItem${num}`);
				if (action) title = d20plus.menu.neatActions[action].quick || d20plus.menu.neatActions[action].ln;
				if (action && title) {
					if (!condition) {
						condition = d20plus.menu.neatActions[action].condition;
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
	};

	d20plus.menu.generateNeatActionsMenu = () => {
		let templ = "";
		Object.entries(d20plus.menu._neatStructure).forEach((menu) => {
			const menuData = menu[1];
			const menuName = `data-menuname='${menu[0]}'`;
			let menuConditions = [];
			let menuItems = "";
			menuData.subitems.forEach((item) => {
				if (item === "-") {
					menuItems += `\n\t\t<div class="ctx__divider"></div>`;
				} else {
					let itemAction = d20plus.menu.neatActions[item].action || item;
					item = d20plus.menu.neatActions[item];
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
			${d20plus.menu._pushQuickMenus()}
		  </ul>
		  </div>
		</script>
		`;
	};

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
			"__values": Object.keys(d20plus.menu.neatActions),
		},
		"quickMenuItem3": {
			"name": __("cfg_option_quick_3"),
			"default": "rollsaves",
			"_type": "_enum",
			"__values": Object.keys(d20plus.menu.neatActions),
		},
	});// RB20 EXCLUDE END
}

SCRIPT_EXTENSIONS.push(baseMenu);
