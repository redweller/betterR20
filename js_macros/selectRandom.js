// b20-JS: Select random token
// Select several tokens, run this macro. It will randomly select one token
// The token name will be sent to chat, and the selection will switch to this token

const list = d20.engine.selected();
d20.engine.unselect();
if (list[0]) d20.engine.select(list.randomize()[0]);
const selectedCharacter = (d20.engine.selected()[0]?._model.attributes || {name: "no selection"}).name || "Unnamed";
const spell = ` {{rname=Selected:%NEWLINE%${selectedCharacter}}}`;
return `&{template:simple} ${spell} [[${list.length}d6]] {{charname=Random token}}`;
