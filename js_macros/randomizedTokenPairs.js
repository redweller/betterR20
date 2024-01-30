// b20-JS: List of randomized token pairs
// Select tokens and run the macro. It will create randomized list of pairs
// Useful e.g. when you're playing scenario where characters randomly change bodies

const list = d20.engine.selected()
	.map(t => t._model.attributes.name)
	.filter(t => t);
const chars = [...list].randomize();
const bodies = list.reduce((res, ch) => {
	return res + ch + " ``>`` " + chars.pop() + "%NEWLINE%";
}, "");
const spell = ` [[${list.length}d6]] {{charname=%NEWLINE%Swap characters}}`;
return `/w gm &{template:simple} ${spell} {{rname=${bodies || "None selected"}}}`;
