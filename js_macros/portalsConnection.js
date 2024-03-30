// b20-JS: Connect two portals
// Select two tokens not attached to any character
// Run the macro, and it will turn them into connected portals
// If you run the macro on single token, it will be disconnected

(() => {
	const portals = d20.engine.selected();
	if (portals.length === 1
		&& portals[0]._model.attributes.custom_portal) {
		portals[0]._model.save({
			custom_portal: null,
			controlledby: "",
			locked: false,
			lockMovement: false,
		});
		d20plus.ut.sendHackerChat("Portal data successfully erased");
		return;
	} else if (portals.length !== 2
		|| (portals[0]._model.character || portals[0]._model.attributes.type !== "image")
		|| (portals[1]._model.character || portals[1]._model.attributes.type !== "image")) {
		d20plus.ut.sendHackerChat("Select two portals to connect them, or one portal to erase the connection data");
		return;
	}
	d20.engine.unselect();
	for (let i = 0; i < 2; i++) {
		d20.engine.canvas.sendToBack(portals[i]);
		portals[i]._model.save({
			controlledby: "all",
			custom_portal: portals[i ? 0 : 1]._model.id,
			locked: true,
			lockMovement: true,
		});
	}
	d20.Campaign.activePage().debounced_recordZIndexes();
	d20plus.ut.sendHackerChat("Portals successfully connected");
})()