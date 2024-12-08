// SPECIFYING PATH TO 5eTOOLS:
// Console: node get-data.js <path_to_5etools_root> <path_to_5e2014_root>
// OR create /node/path.js with the following contents:
// module.exports = {mirror5e: "<path_to_5etools_root>", mirror5e2014: "<path_to_5e2014_root>"}
// Omit second console argument / path.js.mirror5e2014 if you only want 2024+ updates

const process = require("process");
const fs = require("fs");
const path = require("path");
const beautify_html = require("js-beautify").js;
const msg = console;

const pathFromFile = fs.existsSync("node/path.js") && require("./path.js");
const pathFromArg = process.argv[2];
const path2014FromArg = process.argv[3];
const SRC_PATH = pathFromFile.mirror5e || pathFromArg;
const SRC_2014_PATH = pathFromFile.mirror5e2014 || path2014FromArg;

if (!SRC_PATH) {
	msg.error(`We need the path to 5etools data to work`);
	process.exit(1);
}

const toUpperFirst = (str) => {
	return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

const processSpells = () => {
	const spellDir = "data/spells/";
	const spellData = [];

	fs.readdirSync(spellDir)
		.filter(f => f.endsWith(".json")
			&& !f.startsWith("fluff-") // && f === "spells-phb.json"
			&& !["index.json", "roll20.json", "sources.json"].includes(f))
		.forEach(f => {
			const spellsRaw = fs.readFileSync(`${spellDir}${f}`);
			const spells = JSON.parse(spellsRaw)?.spell;

			spells.forEach(spell => {
				const data = {};
				const entries = spell.entries.map(txt => (txt.entries && txt.entries.join()) || txt).join();
				const damage = new RegExp(/{@damage (?<damage>[^}]+)}/g);
				const dice = new RegExp(/{@dice (?<dice>[^}]+)}/);
				const highlevel = new RegExp(/{@scale(dice|damage) (?<base>.+)\|.+\|(?<dice>\d+)d(?<die>\d+)}/);

				spell.savingThrow && (data.Save = toUpperFirst(spell.savingThrow[0]));
				if (entries.includes("{@damage")) {
					const damage1st = damage.exec(entries);
					const damage2nd = damage.exec(entries);
					data["Damage"] = damage1st.groups.damage;
					if (damage2nd && spell.damageInflict?.length && !entries.includes("hen you reach 5th")) {
						data["Damage Type"] = toUpperFirst(spell.damageInflict[spell.damageInflict.length - 1]);
						data["Secondary Damage"] = damage2nd.groups.damage;
						data["Secondary Damage Type"] = toUpperFirst(spell.damageInflict[0]);
					} else {
						spell.damageInflict && (data["Damage Type"] = toUpperFirst(spell.damageInflict.join(", ")));
					}
					entries.toLowerCase().includes("on a successful") && (entries.includes("half damage") || entries.includes("half as much")) && (data["Save Success"] = "Half damage");
					spell.spellAttack && (data["Spell Attack"] = spell.spellAttack[0] === "M" ? "Melee" : "Ranged");
				}
				if (entries.includes("{@dice") && spell.miscTags?.includes("HL")) {
					data["Healing"] = dice.exec(entries).groups.dice;
				}
				if (entries.includes("spellcasting ability modifier")) {
					data["Add Casting Modifier"] = "Yes";
				}
				if ((spell.entriesHigherLevel || [])[0]?.entries[0].includes("{@scale")) {
					const hlDice = highlevel.exec(spell.entriesHigherLevel[0].entries[0])?.groups;
					const base = hlDice?.base.split(";") || [];
					// console.log(spell.name, hlDice)
					if (hlDice && (base.includes(data["Damage"]) || base.includes(data["Healing"]))) {
						data["Higher Spell Slot Die"] = `d${hlDice.die}`;
						data["Higher Spell Slot Dice"] = hlDice.dice;
					}
					if (hlDice && base.includes(data["Secondary Damage"]) && data["Damage"] !== data["Secondary Damage"]) {
						data["Secondary Higher Spell Slot Die"] = `d${hlDice.die}`;
						data["Secondary Higher Spell Slot Dice"] = hlDice.dice;
					}
				}
				spell.scalingLevelDice && (data["data-Cantrip Scaling"] = "dice");

				Object.keys(data).length && spellData.push({
					name: spell.name,
					source: spell.source,
					data,
				})
			})
		});

	const spellFile = beautify_html(JSON.stringify({spell: spellData}), {
		indent_with_tabs: true,
		brace_style: "expand",
		jslint_happy: false,
		space_in_empty_paren: true,
		keep_array_indentation: true,
	})
		.replace(/":([\n,\t]*)\{\}/g, `": {}`)
		.replace(/":([\n,\t]*)\{/g, `": {`);

	fs.writeFileSync(`${spellDir}roll20.json`, spellFile);
	msg.log("Processed roll20 spells");
}

if (require.main === module) {
	processSpells();
	msg.log("Done!");
}

module.exports = processSpells;
