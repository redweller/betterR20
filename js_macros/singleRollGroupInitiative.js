// b20-JS: Assign single roll to group initiative
// Select tokens and run the macro. It will roll for initiative once.
// Same roll result will be assigned to selected tokens

const tokens = d20.engine.selected();
const names = tokens.reduce((l, t) => (l ? l + ", " : "") + t.model.attributes.name, "");
const bonus = tokens[0].model.attributes.represents ? `@{selected|initiative_bonus}` : "0";
const roll = tokens[0].model.attributes.represents ? `@{selected|d20}+${bonus}` : "1d20";
d20.textchat.doChatInput(`
    &{template:simple} {{rname=Initiative}} {{charname=${names}}} {{normal=1}} {{
    }} {{mod=${bonus}}} {{r1=[[${roll}]]}}
`);

setTimeout(() => {
	const init = $(`.inlinerollresult`).last().text();
    const pageId = d20.Campaign.activePage().id;
	tokens.forEach(t => {
        const id = t._model.id;
        const el = {id, pr: init, custom: "", _pageid: pageId};
        d20.Campaign.currentOrderArray.push(el);
	});
    d20.Campaign.initiativewindow.recordOrderFromList();
    d20.Campaign.initiativewindow.rebuildInitiativeList();
}, 2000);
