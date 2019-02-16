unsafeWindow.d20plus = {};

const betteR20Base = function () {
	CONSOLE_LOG = console.log;
	console.log = (...args) => {
		if (args.length === 1 && typeof args[0] === "string" && args[0].startsWith("Switch mode to ")) {
			const mode = args[0].replace("Switch mode to ", "");
			if (typeof d20plus !== "undefined" && d20plus.setMode) d20plus.setMode(mode);
		}
		CONSOLE_LOG(...args);
	};


	addConfigOptions("token", {
			"_name": "Tokens",
			"enhanceStatus": {
				"name": "Use Custom Status Icons",
				"default": true,
				"_type": "boolean"
			},
			"statusSheetUrl": {
				"name": `Custom Status Spritesheet Url (<a style="color: blue" href="https://app.roll20.net/images/statussheet.png" target="_blank">Original</a>)`,
				"default": "https://raw.githubusercontent.com/TheGiddyLimit/5etoolsR20/master/img/statussheet.png",
				"_type": "String"
			},
			"statusSheetSmallUrl": {
				"name": `Custom Status Spritesheet (Small) Url (<a style="color: blue" href="https://app.roll20.net/images/statussheet_small.png" target="_blank">Original</a>)`,
				"default": "https://raw.githubusercontent.com/TheGiddyLimit/5etoolsR20/master/img/statussheet_small.png",
				"_type": "String"
			},
			"massRollWhisperName": {
				"name": "Whisper Token Name to Mass-Rolls",
				"default": false,
				"_type": "boolean"
			}
		}
	);
	addConfigOptions("canvas", {
			"_name": "Canvas",
			"_player": true,
			"gridSnap": {
				"name": "Grid Snap",
				"default": "1",
				"_type": "_enum",
				"__values": ["0.25", "0.5", "1"],
				"_player": true
			},
			"scaleNamesStatuses": {
				"name": "Scaled Names and Status Icons",
				"default": true,
				"_type": "boolean",
				"_player": true
			}
		}
	);
	addConfigOptions("import", {
		"_name": "Import",
		"importIntervalMap": {
			"name": "Rest Time between Each Map (msec)",
			"default": 2500,
			"_type": "integer"
		},
	});
	addConfigOptions("interface", {
		"_name": "Interface",
		"toolbarOpacity": {
			"name": "Horizontal Toolbar Opacity",
			"default": 100,
			"_type": "_slider",
			"__sliderMin": 1,
			"__sliderMax": 100,
			"__sliderStep": 1
		},
		"quickLayerButtons": {
			"name": "Add Quick Layer Buttons",
			"default": true,
			"_type": "boolean"
		},
		"quickInitButtons": {
			"name": "Add Quick Initiative Sort Button",
			"default": true,
			"_type": "boolean"
		},
		"streamerChatTag": {
			"name": "Streamer-Friendly Chat Tags",
			"default": false,
			"_type": "boolean"
		},
		"hideDefaultJournalSearch": {
			"name": "Hide Default Journal Search Bar",
			"default": false,
			"_type": "boolean"
		},
	});
};

const D20plus = function (version) {
	d20plus.version = version;

	// Window loaded
	function doBootstrap () {
		d20plus.ut.log("Bootstrapping...");

		let hasRunInit = false;
		if (window.enhancementSuiteEnabled) {
			// r20es will expose the d20 variable if we wait
			// this should always trigger after window.onload has fired, but track init state just in case
			(function waitForD20 () {
				if (typeof window.d20 !== "undefined" && !$("#loading-overlay").is(":visible") && !hasRunInit) {
					hasRunInit = true;
					d20plus.Init();
				} else {
					setTimeout(waitForD20, 50);
				}
			})();

			window.d20plus = d20plus;
			d20plus.ut.log("Injected");
		} else {
			alert(`The R20ES extension is required! Please install it from https://ssstormy.github.io/roll20-enhancement-suite/`);
		}
	}

	(function doCheckDepsLoaded () {
		if (typeof $ !== "undefined") {
			doBootstrap();
		} else {
			setTimeout(doCheckDepsLoaded, 50);
		}
	})();
};

// if we are the topmost frame, inject
if (window.top === window.self) {
	function strip (str) {
		return str.replace(/use strict/, "").substring(str.indexOf("\n") + 1, str.lastIndexOf("\n")) + "\n";
	}

	let stack = "function (version) {\n";
	stack += strip(betteR20Base.toString());

	for (let i = 0; i < SCRIPT_EXTENSIONS.length; ++i) {
		stack += strip(SCRIPT_EXTENSIONS[i].toString())
	}
	stack += strip(D20plus.toString());

	stack += "\n}";
	unsafeWindow.eval("(" + stack + ")('" + GM_info.script.version + "')");
}
