// b20-JS: assign maximum possible monster HP
// Select token with assigned character, run the macro
// The max HP from character dice formula will be assigned to bar1

const getHP = (async () => {
	const tk = d20.engine.selected()[0].model;
	const fetched = await d20plus.ut.fetchCharAttribs(tk.character);
	if (!tk || !fetched) return d20plus.ut.sendHackerChat("Select token with character sheet");
	const form = tk.character.attribs.models
		.find(x => x.attributes.name === "npc_hpformula")
		.attributes.current.replace("d", "*");
	const hp = eval(form);
	tk.save({bar1_max: hp, bar1_value: hp});
	d20plus.ut.sendHackerChat(`The max HP for ${tk.attributes.name} is set to ${hp}`);
})();