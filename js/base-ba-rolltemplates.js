function baseBARollTemplates () {
	d20plus.ba = d20plus.ba || {};

	const targetTag = `@{target|token_id}`;
	const targetName = `@{target|token_name}`;
	const normalizeStyle = `color: inherit;text-decoration: none;cursor: auto;`;

	const getRollMode = () => {
		const adv = d20plus.ba.$dom.buttons.find(".b20-rolls .mods .advantage input").prop("checked");
		const dis = d20plus.ba.$dom.buttons.find(".b20-rolls .mods .disadvantage input").prop("checked");
		return adv ? "advantage" : dis ? "disadvantage" : "normal";
	}

	const getWMode = () => {
		const togm = d20plus.ba.$dom.buttons.find(".b20-rolls .mods .togm input").prop("checked");
		return togm ? "/w gm " : "";
	}

	const getDisplayName = (char) => {

	}

	const getTemplatePart = ([tag, val, props], subtree) => {
		if ((!tag && !subtree) || props === false || props?.q === false) return "";
		if (Array.isArray(val)) val = val.reduce((s, v) => s + getTemplatePart([null].concat(v), true), "");
		else val = props?.css ? `[${val || " "}]("style="${normalizeStyle}${props.css}")` : val;
		const left = props?.left || (props?.lcss ? `[ ]("style="${props?.lcss}")` : "");
		const right = props?.right || (props?.rcss ? `[ ]("style="${props?.rcss}")` : "");
		return `${tag ? `${tag}=` : ""}${left}${val}${right}`;
	}

	const getTemplateVar = (v) => {
		if (v.q === false || (!v.tag && !v.isSubStr) || (!v.val && v.q === undefined)) return "";
		if (Array.isArray(v.val)) {
			const getSubVal = (s, v) => s + getTemplateVar(Object.assign(v, {isSubStr: true}));
			const subVal = v.val.reduce(getSubVal, "");
			v.val = v.css ? `[${subVal}]("style="${normalizeStyle}${v.css}")` : subVal;
		} else {
			if (v.css) v.val = (v.val || " ").replaceAll("]", "&#93;");
			v.val = v.css ? `[${v.val}]("style="${normalizeStyle}${v.css}")` : v.val;
		}
		return `${v.tag ? `${v.tag}=` : ""}${v.val}`;
	}

	/* eslint-disable object-property-newline */
	const buildAbilityTemplate = (v) => {
		const tmplModel = [
			{tag: v.rMode,	val: `1`},
			{tag: `rname`,	val: v.title, css: `color:${v._isNpc ? "#9a384f" : "#607429"};`},
			{tag: `name`,	val: `${v.subTitle || ""} (${v.mod || 0})`},
			{tag: `type`,	val: v.attrName, css: `display:inline-block;width:50%;font-style: normal;margin: 2px 0px;vertical-align: middle;text-align: right;padding-right: 5px;line-height: 14px;letter-spacing: -1px;`},
			{tag: `r1`,	val: [
				{val: ` `, css: `display: inline-block;margin-left:-8px;`},
				{val: `[[${v.r1}${v.dc ? `[chk${v.dc}]` : ""}]]`},
			]},
			{tag: `r2`,	val: [
				{val: `[[${v.r2 || v.r1}${v.dc ? `[chk${v.dc}]` : ""}]]`},
				{val: ` `, css: `display: inline-block;margin-right:-10px;`},
			], q: v.rMode !== "normal"},
		].map(getTemplateVar).filter(s => !!s).join("}} {{");
		return `&{template:npc} ${v.hidden} {{${tmplModel}}}`;
	}

	const buildAttackTemplate = (v) => {
		const tmplModel = [
			{tag: `attack`,	 val: "1"},
			{tag: `crit`,	 val: "1"},
			{tag: `damage`,	 val: "1"},
			{tag: v.rMode,	 val: "1", q: !!v.atk1},
			{tag: `range`,	 val: v.charName, css: `color:${v._isNpc ? "#9a384f" : "#607429"};${!v.atk1 || v.rMode === "" ? "margin-top: 12px;" : ""}font-weight:bold;display: inline-block;font-family: 'Times New Roman', Times;font-style: normal;font-variant: small-caps;font-size: 14px;`},
			{tag: `rname`,	 val: v.title, css: `font-size: 13px;line-height: 16px;`},
			{tag: `charname`, val: [
				{val: v.subTitle, q: !!v.subTitle},
				{val: ` `, q: !!v.targetName || !!v.saveAttr, css: `display: block;padding-bottom: 3px;`},
				{val: [
					{val: `^{on-hit:-u}`, css: `font-style: normal;display: block;`},
					{val: `^{save} **^{difficulty-class-abv}${v.dc} ^{${v.saveAttr?.slice(0, 3)}-u}**`, css: `font-style: normal;display: block;`},
				], q: !!v.saveAttr},
				{val: [
					{val: `^{target:} ${v.targetName}`},
					{val: ` (${v.distance})`, q: !!v.distance},
				], q: !!v.targetName},
				{val: ` `, css: `display: block;padding-bottom: 8px;`},
			]},
			{tag: `mod`, val: [
				{val: v.atkMod, q: v.rMode !== "" && !!v.atkMod},
				{val: v.mod, q: !!v.mod},
				{val: "⚕", q: !!v._isSpell, css: `color:#3737ff;font-weight:bold;`},
			]},
			{tag: `dmg1flag`, val: "1"},
			{tag: `dmg1type`, val: v.dmg1type},
			{tag: `dmg1`,	val: `[[${v.dmg1roll || 0}[${v.dmg1tag}${v.targetId}]]]`},
			{tag: `crit1`,	val: `[[${v.crit1roll || 0}[${v.dmg1tag}${v.targetId}]]]`},
			{tag: `dmg2flag`, val: "1", q: !!v.dmg2on},
			{tag: `dmg2type`, val: v.dmg2type},
			{tag: `dmg2`,	val: `[[${v.dmg2roll || 0}[${v.dmg2tag}${v.targetId}]]]`, q: !!v.dmg2on},
			{tag: `crit2`,	val: `[[${v.crit2roll || 0}[${v.dmg2tag}${v.targetId}]]]`, q: !!v.dmg2on},
			{tag: `r1`,		val: `[[${v.atk1}[atk${btoa(v.targetAc || "")}]]]`, q: !!v.atk1},
			{tag: `r2`,		val: `[[${v.atk2 || v.atk1}[atk${btoa(v.targetAc || "")}]]]`, q: v.rMode !== "normal"},
		].map(getTemplateVar).filter(s => !!s).join("}} {{");
		return `&{template:atkdmg} ${v.hidden || ""} {{${tmplModel}}}`;
	}

	const buildCastTemplate = (v) => {
		const tmplModel = [
			{tag: `attack`,	 val: "1"},
			{tag: `damage`,	 val: "1"},
			{tag: `mod`,	 val: "⚕", css: `color:#3737ff;font-weight:bold;`},
			{tag: `range`,	 val: v.charName, css: `color:${v._isNpc ? "#9a384f" : "#607429"};margin-top: 12px;font-weight:bold;display: inline-block;font-family: 'Times New Roman', Times;font-style: normal;font-variant: small-caps;font-size: 14px;`},
			{tag: `rname`,	 val: v.title, css: `font-size: 13px;line-height: 16px;`},
			{tag: `charname`, val: [
				{val: v.subTitle, css: `display:inline-block;`},
				{val: [
					{val: ` `, css: `display: block;padding-bottom: 7px;`},
					{val: `^{difficulty-class-abv}${v.dc} ^{${v.saveAttr?.slice(0, 3)}-u}`, css: `display: block;font-weight:bold;font-size:13px;`},
					{val: [
						{val: `^{target:} ${v.targetName}`},
						{val: ` (${v.distance})`, q: !!v.distance},
					], q: !!v.targetName, css: `display: block;`},
					{val: `^{save}`, css: `display: block;`},
					{val: ` `, css: `display: block;padding-bottom: 7px;`},
				]},
			]},
			// {tag: `mod`,	 val: v.atkMod},
			{tag: `dmg1type`,	val: [
				{val: `^{damage:-u}%NEWLINE%^{failures-u}`, css: "font-size:8px;line-height:8px;display:block;padding:4px 0px;"},
				{val: v.dmg1type ? `${v.dmg1type || ""} ${v.dmg2type || ""}` : "", q: !!v.dmg1type || !!v.dmg2type, css: `display: block;padding-bottom: 7px;width: 180px;font-style: normal;`},
			]},
			{tag: `dmg2type`,	val: `^{damage:-u}%NEWLINE%^{successes-u}`, css: "font-size:8px;line-height:8px;display:block;padding:4px 0px;"},
			{tag: `dmg1flag`,	val: "1"},
			{tag: `dmg2flag`,	val: "1"},
			{tag: "dmg1", val: v.dmgOnFail},
			{tag: "dmg2", val: v.dmgOnSuccess},
		].map(getTemplateVar).filter(s => !!s).join("}} {{");
		v.hidden = v.hidden || `[[ floor([[${v.dmg1roll}${v.dmg1type ? `[${v.dmg1type}]` : ""} ${v.dmg2roll ? `+ ${v.dmg2roll}${v.dmg2type ? `[${v.dmg2type}]` : ""}` : ""}[dmg${v.targetId}]]]/2) [dmg${v.targetId}] ]]`;
		return `&{template:atkdmg} ${v.hidden || ""} {{${tmplModel}}}`;
	}

	const buildActionTemplate = (v) => {
		const tmplModel = [
			// {tag: v.rMode,	val: "1", q: !!v.dmg1on},
			// {tag: `attack`,	val: "1", q: !!v.dmg1on},
			{tag: `mod`,	 val: "⚕", css: `color:#3737ff;font-weight:bold;`},
			{tag: `rname`,	 val: [
				{val: v.charName, css: `color:${v._isNpc ? "#9a384f" : "#607429"};margin-top: 12px;font-weight:bold;display:block;font-family: 'Times New Roman', Times;font-style: normal;font-variant: small-caps;font-size: 14px;`},
				{val: v.title, css: `font-size: 13px;line-height: 16px;`},
			]},
			{tag: `charname`, val: [
				{val: v.subTitle, css: `display:inline-block;`},
				{val: [
					{val: ` `, css: `display: block;padding-bottom: 7px;`},
					{val: `^{difficulty-class-abv}${v.dc} ^{${v.saveAttr?.slice(0, 3)}-u}`, q: !!v.saveAttr, css: `display: block;font-weight:bold;font-size:13px;`},
					{val: [
						{val: `^{target:} ${v.targetName}`},
						{val: ` (${v.distance})`, q: !!v.distance},
					], q: !!v.targetName, css: `display: block;`},
					{val: `^{save}`, q: !!v.saveAttr, css: `display: block;`},
					{val: ` `, css: `display: block;padding-bottom: 7px;`},
				]},
			]},
		].map(getTemplateVar).filter(s => !!s).join("}} {{");
		return `&{template:simple} ${v.hidden || ""} {{${tmplModel}}}`;
	}

	const buildDescriptionTemplate = (v) => {
		const tmplModel = [
			{tag: `name`,	val: v.title},
			{tag: `source`,	val: [
				{val: v.charName},
				{val: v.subTitle},
			]},
			{tag: `description`, val: v.description, css: `display:block; overflow-y:auto; max-height:250px`},
		].map(getTemplateVar).filter(s => !!s).join("}} {{");
		return `&{template:traits} {{${tmplModel}}}`;
	}

	const getDescriptionTemplate = (token, id, type) => {
		const char = d20plus.ba.getSingleChar(token);
		const cat = char[type] || [];
		const obj = cat[id];
		if (!obj) return;
		if (type === "spells") d20.textchat.doChatInput(`&{template:traits} {{name=${obj.spellname}}} {{source=${obj.spellschool || ""}}} {{description=${obj.spelldescription}}}`);
		else if (type === "attacks") d20.textchat.doChatInput(`&{template:traits} {{name=${obj.atkname}}} {{source=${obj.spellschool || ""}}} {{description=${obj.atkdamagetype || ""}}}`);
	}
	/* eslint-enable object-property-newline */

	const outputTemplate = (values) => {
		const templateModel = {
			ability: buildAbilityTemplate,
			attack: buildAttackTemplate,
			cast: buildCastTemplate,
			action: buildActionTemplate,
			description: buildDescriptionTemplate,
		}[values?._modelType];

		const template = templateModel && templateModel(values);
		if (!template) return d20plus.ba.rollError();

		d20.textchat.doChatInput(`${getWMode()}${template}`);
		console.log(values, template)
		if (values._expend) d20plus.engine.expendResources(values._expend);
	}

	const buildRollModifier = (r) => {
		const char = d20plus.ba.getSingleChar();
		const r20q = /.*@{(?<attr>[^}]*)}.*/g;
		return r?.split("+").reduce((res, attr) => {
			return res + (Number(attr.replace(r20q, (...s) => char.stats[s.last().attr])) || 0);
		}, 0) || 0;
	}

	const buildRollModel = (r) => {
		console.log(r);
		const critrange = r.critrange && Number(r.critrange) !== 20 ? `cs>${r.critrange}` : "";
		const base = !r.base ? ""
			: r.base.toLowerCase().includes("d") ? r.base : `1d${r.base}${critrange}`;
		const mods = r.mods?.reduce((s, m) => {
			if (!m) return s;
			const attr = m[1] ? `[${m[1]}]` : "";
			const raw = String(m[0] || "0").split("+").map(d => {
				if (!d) return "";
				d = d.trim();
				if (d[0] === "-" || (s === "" && !r.base) || d === "") return `${d}`;
				else return `+${d}`;
			}).join("");
			return `${s} ${raw}${attr}`;
		}, "")
		const dmg = r.type ? `[${r.type}${r.target || "@{target|token_id"}]` : "";
		return `${base}${mods}${dmg}`;
	}

	const buildDisplayMod = (r) => {
		const base = !r.base || r.base === "20" ? ""
			: r.base.toLowerCase().includes("d") ? "" : `D${r.base} `;
		const mods = r.mods?.reduce((s, m) => {
			if (!m) return s;
			return s + (Number(m[0]) || 0);
		}, 0) || 0;
		const sign = mods < 0 || !r.base ? "" : "+";
		return `${base}${sign}${mods}`;
	}

	const getAbilityVals = (spec, attr, dc) => {
		const char = d20plus.ba.getSingleChar();
		if (!dc) [attr, dc] = (attr).split("|");

		const abbr = attr.slice(0, 3).toUpperCase();
		const attrBase = attr.replaceAll(" ", "_").replaceAll("-", "_");
		const attrId = spec === "save" ? `${attrBase}_save_bonus` : (spec === "ability" ? `${attrBase}_mod` : `${attrBase}_bonus`);
		const attrIdNpc = spec === "save" ? `${abbr.toLowerCase()}_save` : (spec === "skill" ? attrBase : "");
		const attrVal = (char.isNpc && char.npcStats[attrIdNpc]) || char.stats[attrId];

		const roll = {
			base: attr !== "hit dice" ? `20` : `${char.stats.hitdietype}`,
			// type: spec === "hit dice" ? `heal` : null,
			// target: spec === "hit dice" ? token.id : null,
			mods: [
				attr === "hit dice" || attr === "concentration" ? [char.stats.constitution_mod, "CON"] : [attrVal, abbr],
				attr === "initiative" ? [` `, `init${char.lastTokenId}`] : null,
				spec === "ability" && !char.isNpc ? [`${char.stats.jack_bonus}`, "JACK"] : null,
			],
		}

		const tmplVals = {
			_thisId: char.id,
			_isNpc: char.isNpc,
			_modelType: attr !== "hit dice" ? "ability" : "attack",
			_onSelf: true,
			dc,
			chId: char.id,
			rMode: getRollMode(),
			title: attr !== "hit dice" ? char.name.tk : `^{hit-dice-u}`,
			subTitle: `^{${spec === "ability" ? "abilities" : ["skill", "save", "roll"].includes(spec) ? spec : attr}}`,
			attrName: `^{${spec === "save" ? `${attrBase}-save` : (["death save", "hit dice"].includes(attr) ? attr.split(" ").concat("u").join("-") : attrBase)}}`,
			mod: buildDisplayMod(roll),
			r1: buildRollModel(roll), // +$[[0]]`,
			// r2: `[[${buildRollModel(roll)}]]`, // +$[[0]]`,

			dmg1on: true,
			dmg1tag: "heal",
			dmg1type: `^{hp}`,
			dmg1roll: buildRollModel(roll),
			charName: char.name.tk,
			targetId: char.lastTokenId,
		}

		return tmplVals;
	};

	const getAbilityTemplateOld = (token, spec, attr) => {
		const char = getSingleChar(token);
		const type = attr || "roll"
		// const roll = spec !== "hit dice" ? `d20` : `1d${char.stats.hitdietype}`;
		const typeName = spec === "ability" ? "abilities" : ["skill", "save"].includes(spec) ? spec : type;

		attr = attr || spec;
		const attrBase = attr.replaceAll(" ", "_").replaceAll("-", "_");
		const attrId = spec === "save" ? `${attrBase}_save_bonus` : (spec === "ability" ? `${attrBase}_mod` : `${attrBase}_bonus`);
		const attrName = spec === "save" ? `${attrBase}-save` : (["death save", "hit dice"].includes(spec) ? attr.split(" ").concat("u").join("-") : attrBase);
		const abbr = attr.slice(0, 3).toUpperCase();

		const roll = {
			base: spec !== "hit dice" ? `d20` : `1d${char.stats.hitdietype || 20}`,
			type: spec !== "hit dice" ? `heal` : undefined,
			self: spec !== "hit dice" ? true : undefined,
			mods: [
				spec === "hit dice" ? [`${char.stats.constitution_mod}`, "CON"] : [`${char.stats[attrId]}`, abbr],
				type === "ability" && "!isNpc" ? [`${char.stats.jack_bonus}`, "JACK"] : null,
			],
		}
		const mods = {base: [
			spec === "hit dice" ? [`${char.stats.constitution_mod}`, "CON"] : [`${char.stats[attrId]}`, abbr],
			type === "ability" && "!isNpc" ? [`${char.stats.jack_bonus}`, "JACK"] : null,
		]};
		mods.r1 = mods.base.concat([
			spec === "initiative" ? ["&{tracker}"] : null,	// should be the last one
		]).filter(s => !!s).map(s => `${s[0]}${s[1] ? `[${s[1]}]` : ""}`).join(" ");		// TODO proper Initiative adding and NPCs
		mods.r2 = mods.base.concat([])
			.filter(s => !!s).map(s => `${s[0]}${s[1] ? `[${s[1]}]` : ""}`).join(" ");
		mods.title = mods.base.concat([
			spec === "hit dice" ? [`+ D${char.stats.hitdietype}`] : null,
		]).filter(s => !!s).map(s => s[0]).join(" ");

		const hiddenVars = [
			`${char.stats.global_skill_mod}`,
		].filter(s => !!s).join(" ");

		const tmplVars = {
			chId: char.id,
			rMode: getRollMode(),
			title: char.name,
			subTitle: `^{${typeName}} (${mods.title})`,
			attrName: `^{${attrName}}`,
			r1: `[[${roll}+${mods.r1}]]`, // +$[[0]]`,
			r2: `[[${roll}+${mods.r2}]]`, // +$[[0]]`,
			hidden: hiddenVars,
			isNpc: char.isNpc,
		}

		return d20plus.ba.templateModel("ability", tmplVars);
	};

	const getAttackVals = (id, flags) => {
		const char = d20plus.ba.getSingleChar();
		const atk = char?.attacks[id];
		const ammo = atk.ammo;
		const dmg = atk.rollbase_crit?.match(/{{dmg1=\[\[(?<dmg1>[^}]*)\]\]}}(?:.*?){{dmg2=\[\[(?<dmg2>[^}]*)\]\]}}(?:.*?){{crit1=\[\[(?<crit1>[^}]*)\]\]}}(?:.*?){{crit2=\[\[(?<crit2>[^}]*)\]\]}}/)?.groups || {};
		const atkattr = atk.atkattr_base?.replace(/@{(.*?)}/, "$1");

		const atkRoll = {
			base: `20`,
			critrange: atk.atkcritrange || char.stats.default_critical_range || "20",
			mods: [
				char.isNpc ? [atk.attack_tohit, "MOD"] : undefined,
				atk.atkattr_base ? [char.stats[atkattr], atkattr?.slice(0, 3).toUpperCase()] : undefined,
				atk._getVar("profbonus") && !char.isNpc ? [char.stats.pb, "PB"] : undefined,
			],
		}

		const tmplVals = {
			_thisId: char.id,
			_isNpc: char.isNpc,
			_onSelf: atk._getVar("range")?.includes("[S]"),
			_targeted: !!atk._getVar("hasattack") || !!atk._getVar("hasdamage") || !!atk._getVar("hasdamage2") || !!atk.savedc,
			_modelType: atk._getVar("hasattack") ? "attack" : atk.savedc && atk._getVar("hasdamage") ? "cast" : "action",
			_expend: atk.ammo ? {type: "item", name: atk.ammo, charID: char.id} : undefined,

			chId: char.id, // !
			title: atk._getVar("name") || "^{attack-u}",
			subTitle: [atk._getVar("range")?.replace(/\[\w\]/g, "").replaceAll("]", "&#93;"), i18n(atk.attack_type?.toLowerCase(), "")]
				.reduce((t, v) => v && (!t || `${t}, ${v}`.length < 27) ? `${t}${v && t ? ", " : ""}${v}` : t, ""),
			charName: char.name.tk,
			description: atk.description,

			dmg2on: atk._getVar("hasdamage2"),
			dmg1tag:	atk._getVar("damagetype")?.includes("Healing") ? "heal" : "dmg",
			dmg2tag:	atk._getVar("damagetype2")?.includes("Healing") ? "heal" : "dmg",
			dmg1type:	atk._getVar("damagetype") || "",
			dmg2type:	atk._getVar("damagetype2") || "",
			dmg1roll:	atk.attack_damage || dmg.dmg1 || 0,
			dmg2roll:	atk.attack_damage2 || dmg.dmg2 || 0,
			rMode: getRollMode(),
			crit1roll:	atk.attack_crit || dmg.crit1 || 0,
			crit2roll:	atk.attack_crit2 || dmg.crit2 || 0,
			atk1: buildRollModel(atkRoll),
			atkMod:	buildDisplayMod(atkRoll),
			saveAttr: atk.saveattr?.toLowerCase() || "",
			dc: atk.savedc && buildRollModifier(atk.savedc),
		}
		return tmplVals;
	}

	const getSpellVals = (id, flags) => {
		const expendCfg = d20plus.cfg.getOrDefault("chat", "autoExpend");
		const char = d20plus.ba.getSingleChar();
		const [lvl, upcast] = String(flags).split("|");
		const spell = char.spells[id];
		const spellAbility = spell.spell_ability && spell.spell_ability?.length > 2
			? (spell.spell_ability !== "spell" ? spell.spell_ability : char.stats.spellcasting_ability)?.replace(/@{(.*?)(_mod|)}(\+|)/, "$1") || ""
			: "";
		const subTitle = [spell.spellrange, spell.spellduration, spell.spelltarget, i18n(spell.spellattack?.toLowerCase(), "")]
			.reduce((t, v) => v && (!t || `${t}, ${v}`.length < 27) ? `${t}${v && t ? ", " : ""}${v}` : t, "");
		const onSelf = spell.spellrange?.includes("[S]") || spell.spelltarget?.includes("Self");
		const spelldmgmod = spell.spelldmgmod === "Yes" ? char.stats[`${spellAbility}_mod`] || 0 : "";

		const atkRoll = {
			base: `20`,
			// type: `atk`,
			// target: targetTag,
			critrange: char.stats.default_critical_range || "20",
			mods: [
				spell.spell_ability === "spell" && [char.stats.spell_attack_bonus, "SPELL"], // `@{${char.id}|spell_attack_mod}[MOD]+${spellAbility}@{${char.id}|pb}[PB]`
				spell.spell_ability !== "spell" && [char.stats.spell_attack_mod, "MOD"],
				spell.spell_ability !== "spell" && [char.stats[`${spellAbility}_mod`], spellAbility.slice(0, 3).toUpperCase()],
				spell.spell_ability !== "spell" && [char.stats.pb, "PB"],
			],
		}

		const tmplVals = {
			_thisId: char.id,
			_isNpc:	char.isNpc,
			_isSpell: spell.spell_ability === "spell",
			_save: spell.spellsave?.toLowerCase() || false,
			_expend: spell.lvl !== "cantrip" ? {type: "spell", lvl: spell.lvl, charID: char.id} : undefined,
			_onSelf: spell.spellrange?.includes("[S]"),
			_targeted: !!spell._getVar("hasattack") || !!spell._getVar("hasdamageorhealing") || !!spell._getVar("hassave"),
			_modelType: spell._getVar("hasattack") || (!spell._getVar("hassave") && spell._getVar("hasdamageorhealing")) ? "attack" : (spell._getVar("hassave") && spell._getVar("hasdamage") ? "cast" : "action"),

			rMode: spell._getVar("hasattack") ? getRollMode() : /* spell._getVar("hassave") || !!spell.spelldamage2 ? "always" : */ "",
			chId: char.id,
			charName: char.name.tk,
			title:	spell.spellname,
			subTitle,

			dmg1on: !!spell.spelldamage || !!spell.spellhealing,
			dmg2on: !!spell.spelldamage2,
			dmg1tag:	spell.spelldamage || spell.spelldamage2 ? "dmg" : spell.spellhealing ? "heal" : "",
			dmg2tag:	spell.spelldamage2 ? "dmg" : spell.spelldamage && spell.spellhealing ? "heal" : "",
			dmg1type:	spell.spelldamagetype || (spell.spellhealing ? "healing" : ""),
			dmg2type:	spell.spelldamagetype2 || (spell.spelldamage && spell.spellhealing ? "healing" : ""),
			dmg1roll:	spell.spelldamage ? buildRollModel({base: spell.spelldamage, mods: [[spelldmgmod]]})
				: spell.spellhealing && !spell.spellsave ? buildRollModel({base: spell.spellhealing, mods: [[spelldmgmod]]}) : "",
			dmg2roll:	spell.spelldamage2 ? buildRollModel({base: spell.spelldamage2, mods: [[spelldmgmod]]})
				: spell.spelldamage && spell.spellhealing && !spell.spellsave ? buildRollModel({base: spell.spellhealing, mods: [[spelldmgmod]]}) : "",

			crit1roll:	spell.spelldamage,
			crit2roll:	spell.spelldamage2,
			atk1: buildRollModel(atkRoll),
			atkMod:	buildDisplayMod(atkRoll),
			description: spell.spelldescription,

			dc: spell.spell_ability !== "spell"
				? buildDisplayMod({mods: [[8], [char.stats.spell_dc_mod], [char.stats[`${spellAbility}_mod`]], [char.stats.pb]]})
				: (char.stats.spell_save_dc || "10"),
			saveAttr: spell.spellsave?.toLowerCase() || "",
			// dmgType: spell.spelldamagetype ? `${spell.spelldamagetype} ${spell.spelldamagetype2 || ""}` : "",
			dmgOnFail: `$[[0]]`,
			dmgOnSuccess: spell.lvl === "cantrip" ? "[[0]]" : `$[[1]]`,
		}
		return tmplVals;
	}

	const switchTargeting = (mode) => {
		const on = mode === "on";
		d20plus.mod.setMode(on ? "targeting" : "select");
		d20.engine.canvas.hoverCursor = on ? "crosshair" : "move";
		d20plus.ba.$dom.r20targetingNote[on ? "show" : "hide"]();
		$("#babylonCanvas")[on ? "addClass" : "removeClass"]("targeting");
	}

	d20plus.ba.getTarget = async (vals, target) => {
		if (target === false) { // user Closed targeting dialog
			switchTargeting("off");
			return d20.engine.nextTargetCallback = false;
		} else if (!target) {
			console.log("START TARGETING", vals);
			switchTargeting("on");
			d20.engine.nextTargetCallback = (t) => { d20plus.ba.getTarget(vals, t); };
		} else if (vals._aoe) {
			// console.log(target);
		} else {
			if (!target._model?.character) return d20plus.ut.sendHackerChat("Target the token that represents a PC or NPC", true);
			const targetChar = await d20plus.ba.fetchChar(target._model);
			const thisToken = d20plus.ut.getTokenById(d20plus.ba.chars[vals._thisId].lastTokenId);
			const distance = d20plus.ut.getTokensDistanceText(target._model, thisToken);

			console.log("Getting target", vals);
			switchTargeting("off");
			d20.engine.nextTargetCallback = false;

			if (vals._save) {
				d20plus.ba.currentToken = target._model;
				d20plus.ba.singleSelected = target._model;
				outputTemplate(getAbilityVals("save", vals._save, vals.dc));
			}

			vals.targetId = target._model.id;
			vals.targetName = target._model.attributes.name;
			vals.targetAc = targetChar.isNpc ? targetChar.npcStats.ac : targetChar.stats.ac;
			vals.distance = distance;
			outputTemplate(vals);
			console.log("END TARGETING", vals);
		}
	}

	d20plus.ba.getConcentrationDC = (vals) => {
		const $dc = $(`
			<div>
				Enter incoming damage
				<input type="number" style="width:45px;">
			</div>
		`).dialog({
			title: "Concentration roll",
			autoopen: true,
			close: () => { $dc.off(); $dc.dialog("destroy").remove() },
			buttons: {
				"Cancel": () => { $dc.off(); $dc.dialog("destroy").remove() },
				"Roll": () => {
					const $input = $dc.find("input");
					const dmg = $input.val();
					if (!isNaN(dmg)) {
						vals.dc = Math.max(10, Math.floor(dmg / 2));
						outputTemplate(vals);
					}
					$dc.off(); $dc.dialog("destroy").remove();
				},
			},
		})
	}

	d20plus.ba.makeRoll = (action, spec, flags) => {
		const getTmplVals = {
			roll: getAbilityVals,
			attack: getAttackVals,
			cast: getSpellVals,
		}[action];

		const tmplVals = getTmplVals && getTmplVals(spec, flags);
		if (!tmplVals) return d20plus.ba.rollError();
		else if (flags === "concentration") d20plus.ba.getConcentrationDC(tmplVals);
		else if (tmplVals._targeted) d20plus.ba.getTarget(tmplVals);
		else outputTemplate(tmplVals);
	}

	d20plus.ba.makeInfo = (action, spec, flags) => {
		const getTmplVals = {
			spell: getSpellVals,
			attack: getAttackVals,
		}[action];

		const tmplVals = getTmplVals && getTmplVals(spec, flags);
		if (!tmplVals) return d20plus.ba.rollError();
		tmplVals._modelType = "description";
		outputTemplate(tmplVals);
	}
}

SCRIPT_EXTENSIONS.push(baseBARollTemplates);
