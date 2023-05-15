function baseChatConditions () {
	d20plus.chat = d20plus.chat || {};

	// Data for displaying conditions in chat
	// Probably can be used for other similar things
	// (that's why the Type field is there - it will go to template subtitle)
	d20plus.chat.conditions = [
		{
			"title": "Title",
			"type": "Subtitle",
			"alias": [
				"Some alternative name, if needed",
				"Some other alternative name",
			],
			"description": `Text of the description with line breaks`,
		},
		{
			"title": "Blinded",
			"type": "Condition",
			"alias": [
				"Blind",
			],
			"description": `A blinded creature can’t see and automatically fails any ability check that requires sight.
			Attack rolls against the creature have advantage, and the creature’s Attack rolls have disadvantage.`,
		},
	];
}

SCRIPT_EXTENSIONS.push(baseChatConditions);
