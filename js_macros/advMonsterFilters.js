// b20-JS: Add advanced monster import filters
// Reload the page and run this macro once
// The advanced filters will become available in Monsters import

// Obsolete in b20beta

const tooLate =  !!$(`#import-list .list`).text();
const beenThere = d20plus.importer.addedAdvancedFilters;
const filters = "``tag``, ``size``, ``language``, ``movement``,  ``sense``, ``immune``, ``resist``, ``inflict``, ``skill``and ``save``";
if (beenThere) return d20plus.ut.sendHackerChat(`
	The customized monster filters already been applied.
	Additional filters include: <br> ${filters}
`);
if (tooLate) return d20plus.ut.sendHackerChat(`
	It appears that the import window had already been opened
	prior to applying the customized filters.
	Please reaload the game and run this macro again.
`, true);
d20plus.monsters._listIndexConverter = (m) => {
	m.__pType = m.__pType || Parser.monTypeToFullObj(m.type).types[0]; // only filter using first primary type
	m.__pTags = {} // additional filters (include conditional traits and all related items)
	m.__pTags.resist = (m.resist || []).map(c => c.resist?.map(c => c.resist || c) || (typeof c === "string" ? c : []));
	m.__pTags.immune = [].concat(m.immune || [], m.conditionImmune || []).map(c => c.immune?.map(c => c.immune || c) || (typeof c === "string" ? c : []));
	m.__pTags.conditions = [].concat(m.conditionInflict || [], m.conditionInflictSpell || [], m.conditionInflictLegendary || []);
	m.__pTags.inflict = [].concat(m.__pTags.conditions, m.damageTags?.map(c => Parser.DMGTYPE_JSON_TO_FULL[c]) || []);
	m.__pTags.languageList = {...Parser.MON_LANGUAGE_TAG_TO_FULL, CS: "mute", LF: "any", X: "any"};
	m.__pTags.language = m.languageTags?.map(c => m.__pTags.languageList[c]) || m.languages || ["none"];
	m.__pTags.sense = m.senseTags?.map(c => Parser.MON_SENSE_TAG_TO_FULL[c]) || m.senses?.map(c => c.split ? c.split(" ")[0] : []) || ["none"];
	return {
		name: m.name.toLowerCase(),
		type: m.__pType.toLowerCase(),
		environment: (m.environment || []).map(c => c.toLowerCase()),
		cr: m.cr === undefined ? "unknown" : (m.cr.cr || m.cr).toLowerCase(),
		source: Parser.sourceJsonToAbv(m.source).toLowerCase(),
		tag: (m.type.tags || []).map(c => c.tag?.toLowerCase() || c.toLowerCase()),
		size: (m.size || []).flatten().map(c => c.toString().toLowerCase()),
		movement: m.speed ? Object.keys(m.speed) : [],
		save: m.save ? Object.keys(m.save) : [],
		skill: m.skill ? Object.keys(m.skill) : [],
		language: m.__pTags.language.map(c => c.toString().toLowerCase()),
		immune: m.__pTags.immune.flatten().map(c => c.toString().toLowerCase()),
		resist: m.__pTags.resist.flatten().map(c => c.toString().toLowerCase()),
		inflict: m.__pTags.inflict.flatten().map(c => c.toString().toLowerCase()),
		sense: m.__pTags.sense.flatten().map(c => c.toString().toLowerCase()),
	};
};
d20plus.importer.addedAdvancedFilters = true;
return d20plus.ut.sendHackerChat(`
	The customized monster filters have been applied.
	In addition to the standard ones, you can now filter monster imports by: <br> ${filters}
`);
