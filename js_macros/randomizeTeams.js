// b20-JS: Break selected tokens to two teams
// Select tokens and run the macro. It will create lists for two teams
// If the number of tokens is odd, one will be left out
// Useful e.g. when you're playing PvP

const list = d20.engine.selected()
	.map(t => t._model?.attributes?.name)
	.filter(t => t);
const chars = [...list].randomize();
const total = chars.length;
const teamLen = Math.floor(total / 2);

const br = "%NEWLINE%";
const teams = [{}, {}];
const langs = Object.keys(d20plus.chat.languages).randomize();
const nameIds = [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100) ];

for (let i = 0; i < 2; i++) {
	const lexis = d20plus.chat.languages[langs[i]].lexis;
	const name = nameIds.reduce((text, wordId) => {
		return `${text} ${lexis[wordId]}`.toUpperCase();
	}, "");
	teams[i].heading = `Team ${i + 1}${br}[${name}]("style="display:block;text-decoration:none;cursor:text;margin-bottom:5px;)`;
}

const bodies = chars.length > 1 && chars.reduce((res, ch, i) => {
	const newTeam = i === teamLen
		? `${br}${teams[1].heading}`
		: i === teamLen * 2 ? `${br}Left out: ${br}` : "";
	return `${res + newTeam + ch} \`\`>\`\` ` + ` ${br}`;
}, teams[0].heading);
const spell = ` [[${list.length}d6]] {{charname=${br}Create teams}}`;
return `&{template:simple} ${spell} {{rname=${bodies || "Select at least 2 characters"}}}`;
