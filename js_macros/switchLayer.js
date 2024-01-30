const $dialog = $(`<div>${[
	{id: "map", name: "Map", desc: "Base map layer"},
	{id: "floors", name: "Floors", desc: "better20 floors"},
	{id: "background", name: "Background", desc: "better20 background"},
	{id: "objects", name: "Tokens", desc: "Tokens and objects layer"},
	{id: "roofs", name: "Roofs", desc: "better20 roofs"},
	{id: "foreground", name: "Foreground", desc: "better20 foreground"},
	{id: "gmlayer", name: "GM", desc: "GM hidden layer"},
	{id: "walls", name: "DL", desc: "Dynamic Lighting walls"},
	{id: "weather", name: "Weather", desc: "Weather exclusions"},
	].reduce((html, l) => {
		return `${html}<p><span style="display:inline-block;width:150px">${l.desc}</span><button class="btn" data-layer="${l.id}">${l.name}</button></p>`;
	}, "")}</div>`);
$dialog.dialog({
	title: "Switch to layer",
	open: () => {
		$dialog.on("click", "button", (evt) => {
			const layer = $(evt.target).data("layer");
			currentEditingLayer = layer;
			d20.Campaign.activePage().onLayerChange();
		})
	},
	close: () => {
		$dialog.off();
		$dialog.dialog("destroy").remove();
	},
})