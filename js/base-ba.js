function baseBetterActions () {
	d20plus.ba = d20plus.ba || {};

	const abilities = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
	let skills = "acrobatics,animal_handling,arcana,athletics,deception,history,insight,intimidation,investigation,medicine,nature,perception,performance,persuasion,religion,sleight_of_hand,stealth,survival";

	const buildAnimations = () => {
		Object.keys(d20plus.anim.animatorTool?._anims || {}).forEach(i => {
			d20plus.ba.tree.anims.push({
				name: d20plus.anim.animatorTool._anims[i].name
					.toSentenceCase()
					.replace("_", " "),
				action: "animation",
				spec: i,
			});
		})
	}

	const getVar = {
		attack: function (param) {
			const char = d20plus.ba.getSingleChar();
			const attr = {
				name: {pc: "atkname", npc: "name"},
				range: {pc: "atkrange", npc: "attack_range"},
				hasattack: {pc: "atkflag", npc: "attack_flag", q: {false: ["0"]}},
				hasdamage: {get: (at) => char.isNpc ? !!at.attack_damage : !!at.dmgbase && at.dmgflag !== "0"},
				hasdamage2: {get: (at) => char.isNpc ? !!at.attack_damage2 : !!at.dmg2base && at.dmg2flag !== "0"},
				damagetype: {pc: "dmgtype", npc: "attack_damagetype"},
				damagetype2: {pc: "dmg2type", npc: "attack_damagetype2"},
				profbonus: {pc: "atkprofflag", q: {false: ["0"]}},
			}[param];
			const val = char.isNpc ? this[attr?.npc] : this[attr?.pc];
			if (attr.get) return attr.get(this);
			else if (!attr.q) return val;
			else return attr.q.true?.includes(val) || (attr.q.false && !attr.q.false.includes(val));
		},
		spell: function (param) {
			const char = d20plus.ba.getSingleChar();
			const attr = {
				hasattack: {get: (sp) => !!sp.spellattack && sp.spellattack !== "None"},
				hasdamage: {get: (sp) => !!sp.spelldamage || !!sp.spelldamage2},
				hasdamageorhealing: {get: (sp) => !!sp.spelldamage || !!sp.spelldamage2 || !!sp.spellhealing},
				hassave: {get: (sp) => !!sp.spellsave && sp.spellsave !== ""},
			}[param];
			const val = char.isNpc ? this[attr?.npc] : this[attr?.pc];
			if (attr.get) return attr.get(this);
			else if (!attr.q) return val;
			else return attr.q.true?.includes(val) || (attr.q.false && !attr.q.false.includes(val));
		},
		char: function (param) {
			void 0;
		},
	}

	const prepareResources = (char) => {
		["other", "class"].forEach(r => {
			const tag = char.stats[`${r}_resource_name`];
			const num = char.stats[`${r}_resource`];
			if (num !== undefined && tag) {
				char.resources = char.resources || {};
				char.resources[tag] = num;
			}
		});
		Object.entries(char.raw.resources || {}).forEach(([id, r]) => {
			["left", "right"].forEach(n => {
				const tag = r[`resource_${n}_name`];
				const num = r[`resource_${n}`];
				if (num !== undefined && tag) {
					char.resources = char.resources || {};
					char.resources[tag] = num;
				}
			});
		})
	}

	const prepareAttacks = (char) => {
		char.attacks = {};
		Object.entries(char.raw.attacks || {}).filter(([id, at]) => {
			return !at.spellid;
		}).forEach(([id, at]) => {
			at.id = id;
			char.attacks[id] = at;
			char.attacks[id]._getVar = getVar["attack"];
		});
		char.isNpc && Object.entries(char.raw.actions || {}).filter(([id, at]) => {
			return at.attack_flag === "on";
		}).forEach(([id, at]) => {
			at.id = id;
			char.attacks[id] = at;
			char.attacks[id]._getVar = getVar["attack"];
		});
	}

	const prepareSpells = (char) => {
		char.spells = {};
		char.spells._byLvl = {};
		/* Object.entries(char.raw.spells || {}).forEach(([lvl, list]) => {
			Object.entries(list || {}).forEach(([id, spl]) => {
				spl.id = id;
				spl.lvl = lvl;
				char.spells[id] = spl;
				char.spells[id]._getVar = getVar["spell"];
			})
		}); */
		Object.entries(char.raw.spells || {}).forEach(([id, spl]) => {
			spl.id = id;
			// spl.lvl = lvl;
			char.spells[id] = spl;
			char.spells[id]._getVar = getVar["spell"];
			char.spells._byLvl[spl.lvl] = char.spells._byLvl[spl.lvl] || {};
			char.spells._byLvl[spl.lvl][id] = char.spells[id];
		})
	}

	const prepareStats = (stats, vals, tag) => {
		if (tag === "hp") stats.hpMax = vals.max;
		stats[tag] = vals.current;
	}

	const prepareTreeStats = (obj, lvls, attr, val) => {
		lvls.forEach(lvl => {
			obj[lvl] = obj[lvl] || {};
			obj = obj[lvl];
		});
		obj[attr] = val;
	}

	const prepareChar = (char, charRef) => {
		char.stats = {};
		char.isNpc = false;
		charRef.attribs?.models.forEach(prop => {
			const [tag, type, id, ...attrPath] = prop.attributes.name.split("_");
			const attr = attrPath.join("_");
			const current = prop.attributes.current;
			if (type === undefined) {
				if (tag === "npc" && current === "1") char.isNpc = true;
				else prepareStats(char.stats, prop.attributes, tag);
			} else if (tag === "npc" && attr === "") {
				char.npcStats = char.npcStats || {};
				if (type === "name") char.name = {ch: prop.attributes.current, tk: char.name.tk, npc: char.name.ch};
				else prepareStats(char.npcStats, prop.attributes, [type].concat(id || []).join("_"));
			} else if (type === "slots") {
				const lvl = tag.slice(-1);
				prepareTreeStats(char, ["spellslots", lvl], id, current);
			} else if (attr === "") {
				if (prop.attributes.name === "charactersheet_type" && current === "npc") char.isNpc = true;
				prepareStats(char.stats, prop.attributes, [tag].concat(type || [], id || []).join("_"));
			} else if (tag === "repeating" && d20plus.ba.singleSelected) {
				const [stype, lvl] = type.split("-");
				if (stype === "spell") {
					if (lvl) {
						prepareTreeStats(char, ["raw", "spells", id], attr, current);
						char.raw.spells[id].lvl = lvl;
					} else {
						char.stats = char.stats || {};
						prepareStats(char.stats, prop.attributes, [type].concat(id || []).join("_"));
					}
				} else if (stype === "npcaction") {
					prepareTreeStats(char, ["raw", "actions", id], attr, current);
					if (lvl) char.raw.actions[id].actionType = lvl;
				} else if (type === "attack") {
					prepareTreeStats(char, ["raw", "attacks", id], attr, current);
				} else if (type === "inventory") {
					prepareTreeStats(char, ["raw", "items", id], attr, current);
				} else if (["proficiencies", "tool", "resource"].includes(type)) {
					const stype = type === "proficiencies" ? "proficiencies" : `${type}s`;
					prepareTreeStats(char, ["raw", stype, id], attr, current);
				} else if (["acmod", "damagemod", "savemod", "skillmod", "tohitmod"].includes(type)) {
					const stype = type.split("mod")[0].replace("tohit", "attack");
					prepareTreeStats(char, ["mods", stype, id], attr, current);
				} else if (type === "npctrait" || type === "trait") {
					prepareTreeStats(char, ["raw", "traits", id], attr, current);
				}
			} else if (type === "reporder") {
				char.order = char.order || {};
				char.order[attr] = current.split(",");
			} else if (tag === "global" && id === "mod" && attr === "flag") {
				prepareTreeStats(char, ["mods", "active"], type, current);
			}
		});
		if (d20plus.ba.singleSelected) {
			prepareSpells(char);
			prepareAttacks(char);
			prepareResources(char);
		}
		char.hp.val = char.hp.val || char.stats.hp || char.npcStats?.hpbase;
		char.hp.max = char.hp.max || char.stats.hpMax;
		return char;
	}

	const prepareAllChars = async () => {
		for (const t of d20plus.ba.tTokens) {
			await d20plus.ba.fetchChar(t);
		}
	}

	const buildGroup = (name, subtree) => {
		d20plus.ba.tree.rolls.push({
			name,
			type: "head",
			items: subtree,
		});
	}

	const buildAbilities = () => {
		const subtree = abilities.map(ab => {
			return {
				name: i18n(ab.replaceAll("-", "_"), ab.toSentenceCase()),
				type: "selector",
				items: [{
					name: "Roll plain check",
					icon: "🗹",
					action: "roll",
					spec: "ability",
					flags: ab,
				}, {
					name: "Save",
					action: "roll",
					spec: "save",
					flags: ab,
				}],
			}
		});
		buildGroup(__("ba_group_abilities"), subtree);
	}

	const buildSkills = () => {
		buildGroup(__("ba_group_skills"), skills.map(sk => {
			return {
				name: i18n(sk.replaceAll("-", "_"), sk.toSentenceCase().replaceAll("_", " ")),
				action: "roll",
				spec: "skill",
				flags: sk,
			};
		}));
	}

	const buildSpellVariants = (lvl, id) => {
		const items = [];
		const char = d20plus.ba.getSingleChar();
		const ritual = char.raw.spells[id]?.spellritual;
		const upcast = !isNaN(lvl)
			&& char.raw.spells[id].spellathigherlevels;
		ritual && items.push({
			name: "As ritual",
			action: "cast",
			spec: id,
		});
		upcast && [...Array(9 - lvl)].map((k, i) => {
			const upLvl = i + lvl + 1;
			const hasSlots = char.isNpc || char?.spellslots[upLvl].total;
			hasSlots && items.push({
				name: `Upcast at lvl ${upLvl}`,
				action: "cast",
				tag: `${upLvl}`,
				spec: id,
			});
		});
		return items.length ? items : null;
	}

	const buildSpellSlots = (char, lvl) => {
		if (char.spellslots && char.spellslots[lvl] && char.spellslots[lvl].total) {
			const has = Number(char.spellslots[lvl].expended) || 0;
			const total = Number(char.spellslots[lvl].total) || 0;
			if (char.spellslots[lvl].total <= 4 && has >= 0) {
				return [...Array(total)].reduce((k, s, i) => {
					return i <= has - 1 ? `${k}⬤` : `${k}◎`;
				}, "");
			} else return `${has}/${char.spellslots[lvl].total}`;
		}
	}

	const buildSpells = () => {
		const subtree = [];
		for (let i = 0; i <= 9; i++) {
			const lvl = i || "cantrip";
			const char = d20plus.ba.getSingleChar();
			const shouldPrepare = ["Cleric", "Druid", "Paladin", "Wizard"].includes(char.stats.class);
			const spells = char?.spells?._byLvl[lvl];
			const items = Object.keys(spells || {}).map(id => {
				const spell = spells[id];
				const isAttack = spell.spellattack
					&& spell.spellattack !== "None";
				const hasVariants = (spell.spellathigherlevels
					|| spell.spellritual)
					&& i !== "cantrip";
				const variants = hasVariants ? buildSpellVariants(lvl, id) : null;
				const unprepared = !shouldPrepare || !i || spell.spellprepared === "1" ? "" : " unprepared";
				return {
					name: spell.spellname,
					type: `spellaction selector${unprepared} ${variants ? "variable" : ""}`,
					items: [{
						name: "Show description",
						icon: "🕮",
						action: "spelldescription",
						spec: id,
					}, {
						name: "Cast spell",
						icon: isAttack ? "⚔" : "⚕",
						action: "cast",
						spec: id,
					}].concat(variants ? {
						icon: "↪",
						type: "parameters",
						items: variants,
					} : []),
				}
			});
			items.length && subtree.push({
				resource: buildSpellSlots(char, lvl),
				name: !i ? "Cantrips" : `Level ${lvl}`,
				type: "head",
				items,
			});
			!items.length && (char.spellslots || {})[lvl]?.total && subtree.push({
				resource: buildSpellSlots(char, lvl),
				name: `Level ${lvl}`,
				type: "head",
			})
		}
		buildGroup(__("ba_group_spells"), subtree);
	}

	const buildAttacks = () => {
		const char = d20plus.ba.getSingleChar();
		buildGroup(__("ba_group_attacks"), Object.entries(char.attacks || {}).filter(([id, at]) => {
			return !at.spellid;
		}).map(([id, at]) => {
			const rangeField = char.isNpc ? at.attack_range : at.atkrange;
			const isCast = !!at.saveflag || at.atkflag === "0";
			const isRanged = !isCast && ((char.isNpc && at.attack_type === "Ranged")
				|| (!char.isNpc && rangeField?.includes("/")));
			const isVersatile = !isCast && rangeField?.includes("[V]");
			const isOffhandable = !isCast && rangeField?.includes("[O]");
			const types = [
				isCast ? " cast" : "",
				isRanged ? " ranged" : "",
				isOffhandable ? " offhand" : "",
				isVersatile ? " versatile" : "",
			].join("");
			return {
				name: at.atkname || at.name,
				type: `atkaction selector${types}`,
				items: [{
					name: "Attack",
					icon: isCast ? "⚕" : isRanged ? "➹" : isVersatile ? "🗡🖑🖑" : "🗡",
					action: "attack",
					spec: id,
				}].concat(isOffhandable ? {
					name: "Attack with offhand",
					icon: "⚔",
					action: "attack",
					spec: id,
					flags: "O",
				} : []).concat(isVersatile ? {
					name: "Attack with single hand (versatile)",
					icon: `🗡🖑`,
					action: "attack",
					spec: id,
					flags: "V",
				} : []).concat({
					name: "Show description",
					icon: "🕮",
					action: "attackdescription",
					spec: id,
				}),
			}
		}));
	}

	const buildActions = () => {
		void 0;
	}

	const addCommonRolls = () => {
		d20plus.ba.tree.rolls.push(
			{name: __("ba_roll_initiative"), action: "roll", spec: "roll", flags: "initiative"},
			{name: __("ba_roll_concentration"), action: "roll", spec: "roll", flags: "concentration"},
		);
		if (!d20plus.ba.singleSelected
			|| !(d20plus.ba.getSingleChar()?.isNpc === false)) return;
		d20plus.ba.tree.rolls = d20plus.ba.tree.rolls.concat([
			{name: __("ba_roll_deathsave"), action: "roll", spec: "roll", flags: "death save|10"},
			{name: __("ba_roll_hitdice"), action: "roll", spec: "roll", flags: "hit dice"},
		]);
	}

	const buildTag = (title, txt, close) => {
		if (txt !== undefined && txt !== "") {
			title = title.last() !== ":" && !close ? `${title}:` : title;
			return close ? `<span><b>${title}</b>&nbsp;${txt}&nbsp;<b>${close}</b></span>`
				: `<span><strong>${title}</strong>&nbsp;${txt}</span>`;
		} else return "";
	}

	const buildHtml = (tree) => {
		tree = tree || d20plus.ba.tree.rolls;
		return tree.reduce((html, it) => {
			if (it.items) {
				if (!it.items.length) return html;
				return `${html}
				<li class="hasSub ${it.type}">
					<span${it.name?.length > 14 ? ` title="${it.name}"` : ""}>
						${it.resource ? `<i>${it.resource}</i>` : ""}${it.icon || it.name}
					</span>
					<ul class="submenu">
						${buildHtml(it.items)}
					</ul>
				</li>`;
			} else if (it.type === "mods") {
				const willBe = `${html}
				<li class="head hasSub">
					<span><span style="font-family:Pictos">y</span> Mods</span>
					<ul class="mods submenu">
						<li><label><input type="checkbox"> Token name</label></li>
						<li><label><input type="checkbox"> Char name</label></li>
						<li class="last-in-group"><label><input type="checkbox"> Hide name</label></li>
						<li><label class="mod advantage"><input type="checkbox"> Advantage</label></li>
						<li class="last-in-group"><label class="mod disadvantage"><input type="checkbox"> Disadvantage</label></li>
						<li><label><input type="checkbox"> To GM</label></li>
						<li class="last-in-group"><label><input type="checkbox"> To self</label></li>
						<li class="last-in-group"><label><input type="checkbox"> Auro-roll damage</label></li>
						<li><label><input type="checkbox"> Hide mods</label></li>
					</ul>
				</li>`;
				return `${html}
				<li class="head hasSub">
					<span><span style="font-family:Pictos">y</span> Mods</span>
					<ul class="mods submenu">
						<li><label class="mod advantage"><input type="checkbox"> Advantage</label></li>
						<li class="last-in-group"><label class="mod disadvantage"><input type="checkbox"> Disadvantage</label></li>
						<li><label class="mod togm"><input type="checkbox" ${d20plus.ba.singleSelected?.attributes?.layer === "gmlayer" ? "checked" : ""}> To GM</label></li>
					</ul>
				</li>`;
			} else {
				const dataAttribs = `data-action="${it.action}" data-spec="${it.spec}"${it.flags ? ` data-flags="${it.flags}"` : ""}`;
				return `${html}<li ${dataAttribs}${it.icon || it.name?.length > 15 ? ` title="${it.name || ""}"` : ""}>
					${it.resource ? `<span><i>${it.resource}</i>` : ""}
					${it.icon || it.name}${it.resource ? `</span>` : ""}
				</li>`;
			}
		}, "");
	}

	const buildStatsHtml = () => {
		const char = d20plus.ba.getSingleChar();

		const baseStats = (char.isNpc ? [
			buildTag("HP:", `${char.hp.val || ""}&nbsp;${buildTag("/", char.hp.max, " ")}`),
			buildTag("(", char.npcStats.hpformula, ")"),
			"<br>",
			buildTag("AC:", char.npcStats.ac),
			buildTag("", char.npcStats.actype, ""),
			buildTag("CR:", char.npcStats.challenge),
			buildTag("Speed", char.npcStats.speed),
		] : [
			buildTag("HP:", `${char.hp.val}&nbsp;${buildTag("/", char.hp.max, " ")}`),
			buildTag("AC:", char.stats.ac),
			buildTag("PB", char.stats.pb),
			buildTag("Speed", char.stats.speed),
		]).concat([
			buildTag("Initiative", char.stats.initiative_bonus),
			buildTag("Passive Perception", char.isNpc ? (char.stats.passive || char.stats.passive_wisdom) : char.stats.passive_wisdom),
		]).join(" ");

		const baseAbilities = abilities.map(a => {
			const rawMod = char.stats[`${a}_mod`];
			const mod = rawMod !== undefined ? (rawMod > 0 ? `+${rawMod}` : rawMod) : "";
			return buildTag(`${a.slice(0, 3).toUpperCase()}:`, `${char.stats[a] || ""}${buildTag(" (", mod, ")")}`);
		}).join(" ");
		const spellStats = Object.keys(char.spells || {}).length ? `<li>${[
			buildTag("Caster Level", char.stats.caster_level),
			buildTag("Spell Save DC", char.stats.spell_save_dc),
			buildTag("Spell Attack Bonus", char.stats.spell_attack_bonus),
		].join(" ")}</li>` : "";

		const classDetails = char.stats.class_display
			?.split(" ").map(c => isNaN(c) && c ? i18n(c.toLowerCase(), c) : c)
			.join(" ") || "";
		const currency = !char.isNpc ? `<li>${["cp", "sp", "ep", "gp", "pp"].map(c => {
			return buildTag(`${c.toUpperCase()}:`, char.stats[c] || "0");
		}).join(" ")}</li>` : "";

		const npcDetails = char.isNpc ? [
			buildTag("Speaks:", char.npcStats.languages),
			buildTag("Senses:", char.npcStats.senses),
			buildTag("Vulnerable to:", char.npcStats.vulnerabilities),
			buildTag("Resists:", char.npcStats.resistances),
			buildTag("Immune to:", char.npcStats.condition_immunities),
			buildTag("Immunities:", char.npcStats.immunities),
		].join(" ") : "";

		return `
			<li><span style="font-size:15px; font-weight: bold;line-height: 16px;width:110px">${char.name.ch || char.name.tk}</span>
				<span style="float: right">
					<button data-action="speakas" title="Speak as character">w</button>
					<button data-action="opensheet" title="Open character sheet">U</button>
					<button data-action="openchar" title="Open character settings">x</button><br>
				</span>
				<span>${char.isNpc ? char.npcStats.type : `${char.stats.race_display}, ${classDetails}`}</span>
			</li><li>${baseStats}</li><li>${baseAbilities}</li>${spellStats}${currency}
			${npcDetails ? `<li>${npcDetails}</li>` : ""}
		`;
	}

	const buildSheet = () => {
		d20plus.ba.$dom.sheet.info.html(buildStatsHtml());
		d20plus.ba.$dom.sheet.name.html(d20plus.ba.getSingleChar()?.name.tk);
		d20plus.ba.$dom.sheet.general.html(buildHtml(d20plus.ba.tree.rolls[1].items));
	}

	const getAmConfig = () => {
		const cfg = d20plus.cfg.getOrDefault("token", "showTokenMenu");
		d20plus.ba.enabled = cfg !== "none";
		d20plus.ba.enabledCharMenu = cfg.includes("char");
		d20plus.ba.enabledAnimation = cfg.includes("anim");
		return d20plus.ba.enabled;
	}

	const getActions = (action, token, spec, flags) => {
		if (action === "animation") {
			d20plus.anim.animator.startAnimation(token, spec);
		} else if (["spelldescription", "attackdescription"].includes(action)) {
			d20plus.ba.makeInfo(action === "spelldescription" ? "spell" : "attack", spec);
		} else {
			d20plus.ba.makeRoll(action, spec, flags);
		}
	};

	const amExecute = async (action, spec, flags) => {
		const selected = action === "animation"
			? d20.engine.selected().filter(it => it.type === "image")
			: d20.engine.selected().filter(it => it._model?.character);
		const isMultiple = selected.length > 1;
		const singleAction = !["animation"].includes(action)
			&& !["ability", "save", "skill", "initiative", "roll"].includes(spec);
		const iterateSelected = (token) => {
			d20plus.ba.currentToken = !d20plus.ba.currentToken && token._model;
			return ["initiative"].includes(spec) || ["animation"].includes(action);
		}
		d20plus.ut.log({action, spec, singleAction, iterateSelected});
		if (!isMultiple || !singleAction) {
			d20plus.ba.executing = true;
			const tokens = [...selected];
			d20.engine.unselect();
			tokens.forEach(t => {
				iterateSelected(t) && d20.engine.select(t);
				getActions(action, t._model, spec, flags);
				iterateSelected(t) && d20.engine.unselect();
			});
			// if (!iterateSelected) tokens.forEach(t => d20.engine.select(t));
			d20plus.ba.executing = false;
		} else {
			d20plus.ba.rollError();
		}
	}

	const amDo = (action) => {
		const amCharId = d20plus.ba.getSingleChar()?.id;
		if (action === "opensheet") d20plus.ba.tTokens[0].character.view.showDialog();
		else if (action === "openchar") d20plus.ba.showDialog();
		else if (action === "speakas") {
			const $speagingas = $("#speakingas");
			const [type, speakAsId] = $speagingas.val().split("|");
			if (speakAsId === amCharId) $speagingas.val(["player", d20_player_id].join("|"));
			else $speagingas.val(["character", amCharId].join("|"));
		}
	}

	const amShow = async () => {
		if (d20plus.ba.executing) return;
		d20plus.ba.tree = {rolls: [{type: "mods"}], stats: [], anims: []};
		d20plus.ba.$dom.buttons.anim.toggle(false);
		d20plus.ba.$dom.buttons.roll.toggle(false);
		d20plus.ba.$dom.buttons.stat.toggle(false);
		if (d20plus.ba.hasChars) {
			if (!d20plus.ba.singleSelected) prepareAllChars();
			else await d20plus.ba.fetchChar();
			buildAbilities();
			buildSkills();
			if (d20plus.ba.singleSelected) {
				buildAttacks();
				buildSpells();
				buildActions();
				buildSheet();
				d20plus.ba.$dom.statsList.html(buildStatsHtml());
				d20plus.ba.$dom.buttons.stat.toggle(true);
			}
			addCommonRolls();
			d20plus.ba.$dom.rollsList.html(buildHtml());
			d20plus.ba.$dom.buttons.roll.toggle(true);
		}
		if (d20plus.ba.hasAnimatable) {
			buildAnimations();
			d20plus.ba.$dom.animationsList.html(buildHtml(d20plus.ba.tree.anims));
			if (d20plus.ba.tree.anims.length) d20plus.ba.$dom.buttons.anim.toggle(true);
		}
		d20plus.ba.$dom.buttons.toggle(true);
		if (d20plus.ba.$dom.r20toolbar.css("display") === "none") {
			d20plus.ba.$dom.r20toolbar.toggle(true);
			d20plus.ba.$dom.r20tokenActions.css("display", "none");
		} else {
			d20plus.ba.$dom.r20tokenActions.css("display", "inline-block");
		}
	}

	const amHide = () => {
		d20plus.ba.$dom.buttons.toggle(false);
	}

	d20plus.ba.rollError = () => {
		d20plus.ut.sendHackerChat("Unrecognized error applying menu command", true);
	}

	d20plus.ba.alterHP = (alter) => {
		const barID = Number(d20plus.cfg.getOrDefault("chat", "dmgTokenBar"));
		const bar = {
			val: `bar${barID}_value`,
			link: `bar${barID}_link`,
			max: `bar${barID}_max`,
		};
		const calcHP = (token) => {
			if (!token?.get) return false;
			const current = token.get(bar.val);
			const max = token.get(bar.max);
			if (isNaN(max) || isNaN(current) || current === "") return false;
			const hp = {old: current, new: current - alter.dmg};
			if (hp.new < 0) hp.new = 0;
			if (max !== "") {
				if (hp.new > max) hp.new = max;
				if (hp.new <= -max) hp.dead = true;
				if (hp.old <= 0 && hp.new > 0) hp.alive = true;
			}
			return hp;
		}
		const playerName = d20plus.ut.getPlayerNameById(d20_player_id);
		const author = `${playerName} applied ${alter.dmg} damage`;
		const transport = {type: "automation", author};
		const targets = alter.targets;
		d20.engine.unselect();
		targets.forEach(async token => {
			if (typeof token === "string") token = d20plus.ut.getTokenById(token);
			else if (token.model) token = token.model;
			const hp = calcHP(token);
			if (!hp) return d20plus.ut.sendHackerChat("You have to select proper token bar in the settings", true);
			if (!token.currentPlayerControls()) return;
			if (alter.restore !== undefined) hp.new = alter.restore;
			const barLinked = token.get(bar.link);
			const tokenName = token.get("name");
			if (barLinked) {
				if (!token.character?.currentPlayerControls()) return;
				const charID = token.character?.id;
				const fetched = await d20plus.ut.fetchCharAttribs(token.character);
				if (fetched && charID) {
					const attrib = token.character.attribs.get(barLinked);
					const charName = token.character.get("name");
					attrib.save({current: hp.new});
					attrib.syncTokenBars();
					hp.msg = `/w "${charName}" ${tokenName} from ${hp.old} to ${hp.new} HP`;
					if (alter.restore !== undefined) hp.msg = `/w "${charName}" ${tokenName} HP back to ${hp.new}`;
				}
			} else {
				token.save({[bar.val]: hp.new});
				hp.msg = `/w gm ${tokenName} from ${hp.old} to ${hp.new} HP`;
				if (alter.restore !== undefined) hp.msg = `/w gm ${tokenName} HP back to ${hp.new}`;
			}
			if (hp.msg) {
				hp.undo = {type: "hp", dmg: alter.dmg, restore: hp.old, targets: [token.id]};
				if (alter.restore === undefined) hp.transport = Object.assign({undo: hp.undo}, transport);
				else transport.author = `${playerName} restored HP to ${alter.restore}`;
				d20.textchat.doChatInput(hp.msg, undefined, hp.transport || transport);
				if (hp.dead) d20.textchat.doChatInput(`${tokenName} is instantly dead`, undefined, transport);
				else if (hp.alive) d20.textchat.doChatInput(`${tokenName} is conscious again`, undefined, transport);
				else if (hp.new === 0) d20.textchat.doChatInput(`${tokenName} falls unconscious`, undefined, transport);
			}
		})
	}

	d20plus.ba.addTurn = (tokenId, init) => {
		const token = d20plus.ut.getTokenById(tokenId);
		const pageId = token?.collection.page.id;
		const tracker = d20.Campaign.initiativewindow;
		const actor = {_pageid: pageId, id: tokenId, pr: init, custom: ""};

		const needsOpening = !tracker.windowopen;
		needsOpening && tracker.openWindow();
		needsOpening && tracker.model.save();
		// for some reason we need to pretend the turn tracker was opened long ago (2s seems enough)
		// otherwise the tokens won't show on the list until the next token is added
		setTimeout(() => {
			let trackerIt = d20.Campaign.currentOrderArray
				.find(it => it._pageid === pageId && it.id === tokenId);
			if (!trackerIt) {
				d20.Campaign.currentOrderArray.push(actor);
				trackerIt = d20.Campaign.currentOrderArray.last();
			}
			trackerIt.pr = init;
			tracker.model.save({turnorder: JSON.stringify(d20.Campaign.currentOrderArray)});
		}, needsOpening ? 2000 : 0);
	}

	d20plus.ba.fetchChar = async (token) => {
		const tokenRef = token || d20plus.ba.tTokens[0];
		const charRef = tokenRef?.character;
		const isUp2Date = d20plus.ba.chars[charRef.id]?.lastGroup === d20plus.ba.thisGroup;
		if (!charRef || isUp2Date) return;

		const name = {ch: charRef?.attributes.name, tk: tokenRef?.attributes.name};
		const hp = {val: tokenRef.attributes.bar1_value, max: tokenRef.attributes.bar1_max};
		await d20plus.ut.fetchCharAttribs(charRef);

		d20plus.ba.chars[charRef.id] = {id: charRef.id, lastTokenId: tokenRef.id, name, hp};
		return prepareChar(d20plus.ba.chars[charRef.id], charRef);
	}

	d20plus.ba.getSingleChar = (token) => {
		const ref = token || d20plus.ba.singleSelected || d20plus.ba.currentToken;
		const id = ref?.character?.id;
		return id && d20plus.ba.chars[id];
	}

	d20plus.ba.showDialog = () => {
		d20plus.ba.$dom.sheet.dialog("open");
	}

	d20plus.ba.initBetterActions = () => {
		d20plus.ba.chars = {};
		skills = i18n("skills-list", skills).split(",");

		d20plus.ba.$dom = {
			buttons: $(d20plus.html.bActionsButtons),
			sheet: $(d20plus.ba.dialogHtml).dialog({
				title: `<span class="char-name"></span>`,
				autoOpen: false,
				width: 500,
				height: 450,
			}),
		};

		d20plus.ba.$dom.buttons.roll = d20plus.ba.$dom.buttons.find(`[data-type=rolls]`);
		d20plus.ba.$dom.buttons.stat = d20plus.ba.$dom.buttons.find(`[data-type=stats]`);
		d20plus.ba.$dom.buttons.anim = d20plus.ba.$dom.buttons.find(`[data-type=animate]`);
		d20plus.ba.$dom.rollsList = d20plus.ba.$dom.buttons.find(`.b20-rolls > ul`);
		d20plus.ba.$dom.statsList = d20plus.ba.$dom.buttons.find(`.b20-stats > ul`);
		d20plus.ba.$dom.animationsList = d20plus.ba.$dom.buttons.find(`.b20-animations > ul`);

		d20plus.ba.$dom.sheet.info = d20plus.ba.$dom.sheet.find(`.content-right.info`);
		d20plus.ba.$dom.sheet.general = d20plus.ba.$dom.sheet.find(`.items .general`);
		d20plus.ba.$dom.sheet.name = d20plus.ba.$dom.sheet.parent().find(`.char-name`);

		d20plus.ba.$dom.r20targetingNote = $("#targetinginstructions");
		d20plus.ba.$dom.r20toolbar = $("#secondary-toolbar");
		d20plus.ba.$dom.r20toolbar.prepend(d20plus.ba.$dom.buttons);
		d20plus.ba.$dom.r20tokenActions = d20plus.ba.$dom.r20toolbar.find(".mode.tokenactions");

		$("body").on("shape_selected", "#editor", evt => {
			const enabled = getAmConfig();
			const selected = d20.engine.selected();
			if (!enabled) return;
			d20plus.ba.tTokens = selected
				.filter(it => it._model?.character)
				.map(it => it._model);
			d20plus.ba.tAnims = selected
				.filter(it => it.type === "image");
			d20plus.ba.thisGroup = d20plus.ut.generateRowId();
			d20plus.ba.singleSelected = d20plus.ba.tTokens.length > 1
				? false
				: d20plus.ba.tTokens[0]; // am.multipleTargets // hasMultiple
			d20plus.ba.hasChars = d20plus.ba.enabledCharMenu
				&& d20plus.ba.tTokens.length > 0;
			d20plus.ba.hasAnimatable = is_gm
				&& d20plus.ba.enabledAnimation
				&& d20plus.ba.tAnims.length > 0
				&& Object.keys(d20plus.anim.animatorTool?._anims || {}).length;
			if (d20plus.ba.hasChars || d20plus.ba.hasAnimatable) amShow();
			else amHide();
		}).on("nothing_selected", "#editor", evt => {
			amHide();
		});

		d20plus.ba.$dom.buttons.on("click", "[data-action], [data-spec]", evt => {
			const $clicked = $(evt.target);
			const action = $clicked.data("action");
			const spec = $clicked.data("spec");
			const flags = $clicked.data("flags");
			if (spec && action) amExecute(action, spec, flags);
			// else if (action && mod) amSet(mod);
			else if (!spec && action) amDo(action);
		});
	}

	d20plus.ba.dialogHtml = `
	<div class="better-sheet">
		<ul class="nav nav-tabs">
			<li class="nav-tabs"><a data-tab="general">General</a></li>
			<li class="nav-tabs"><a data-tab="attacks">Attacks</a></li>
			<li class="nav-tabs"><a data-tab="attacks">Spells</a></li>
			<li class="nav-tabs"><a data-tab="inventory">Inventory</a></li>
		</ul>
		<div class="tab-content">
			<div class="content-left items">
				<div class="tab-pane general" style="display:block">General</div>
				<div class="tab-pane attacks">Attacks</div>
			</div><div class="content-right info">Stats</div>
		</div>
	</div>
	`;
}

SCRIPT_EXTENSIONS.push(baseBetterActions);
