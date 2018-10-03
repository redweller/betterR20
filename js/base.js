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
			}
		}
	);
	addConfigOptions("canvas", {
			"_name": "Canvas",
			"_player": true,
			"halfGridSnap": {
				"name": "Snap to Half-Grid",
				"default": false,
				"_type": "boolean",
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
			"name": "Horizontal Toolbar Opacity (0.00-1.00)",
			"default": 1,
			"_type": "float"
		},
		"streamerChatTag": {
			"name": "Streamer-Friendly Chat Tags",
			"default": false,
			"_type": "boolean"
		},
	});
	addConfigOptions("weather", {
		"_name": "Weather",
		"weatherType1": {
			"name": "Type",
			"default": "None",
			"_type": "_enum",
			"__values": ["None", "Rain", "Snow", "Fog"]
		},
		"weatherSpeed1": {
			"name": "Weather Speed",
			"default": 0.1,
			"_type": "_slider",
			"__sliderMin": 0.01,
			"__sliderMax": 1,
			"__sliderStep": 0.01
		},
		"weatherDir1": {
			"name": "Direction",
			"default": "None",
			"_type": "_enum",
			"__values": ["Northerly", "North-Easterly", "Easterly", "South-Easterly", "Southerly", "South-Westerly", "Westerly", "North-Westerly"]
		},
		"weatherIntensity1": {
			"name": "Intensity",
			"default": "None",
			"_type": "_enum",
			"__values": ["Normal", "Heavy"]
		},
		"weatherTint1": {
			"name": "Tint",
			"default": "None",
			"_type": "_enum",
			"__values": ["None", "Night"]
		},
	});
};

const D20plus = function (version) {
	d20plus.version = version;

	/* object.watch polyfill by Eli Grey, http://eligrey.com */
	if (!Object.prototype.watch) {
		Object.defineProperty(Object.prototype, "watch", {
			enumerable: false,
			configurable: true,
			writable: false,
			value: function (prop, handler) {
				var
					oldval = this[prop],
					newval = oldval,
					getter = function () {
						return newval;
					},
					setter = function (val) {
						oldval = newval;
						return (newval = handler.call(this, prop, oldval, val));
					};
				if (delete this[prop]) {
					Object.defineProperty(this, prop, {
						get: getter,
						set: setter,
						enumerable: true,
						configurable: true
					});
				}
			}
		});
	}
	if (!Object.prototype.unwatch) {
		Object.defineProperty(Object.prototype, "unwatch", {
			enumerable: false,
			configurable: true,
			writable: false,
			value: function (prop) {
				var val = this[prop];
				delete this[prop];
				this[prop] = val;
			}
		});
	}
	/* end object.watch polyfill */

	// Window loaded
	function doBootstrap () {
		d20plus.ut.log("Bootstrapping...");

		let hasRunInit = false;
		function defaultOnload () {
			if (hasRunInit) return;
			hasRunInit = true;
			window.unwatch("d20");
			const checkLoaded = setInterval(function () {
				if (!$("#loading-overlay").is(":visible")) {
					clearInterval(checkLoaded);
					d20plus.Init();
				}
			}, 1000);
		}

		window.onload = defaultOnload;

		if (window.enhancementSuiteEnabled) {
			// r20es will expose the d20 variable if we wait
			// this should always trigger after window.onload has fired, but track init state just in case
			(function waitForD20 () {
				if (typeof window.d20 !== "undefined" && !$("#loading-overlay").is(":visible") && !hasRunInit) {
					hasRunInit = true;
					window.unwatch("d20ext");
					d20plus.ut.log("Setting production (alt)...");
					window.d20ext.environment = "production";
					d20.environment = "production";
					d20plus.Init();
				} else {
					setTimeout(waitForD20, 50);
				}
			})();
		} else {
			window.d20 = {};
			window.watch("d20", function (id, oldValue, newValue) {
				d20plus.ut.log("Obtained d20 variable");
				window.unwatch("d20ext");
				d20plus.ut.log("Setting production...");
				window.d20ext.environment = "production";
				newValue.environment = "production";
				return newValue;
			});
		}

		window.d20plus = d20plus;
		d20plus.ut.log("Injected");
	}

	window.d20ext = {};
	window.watch("d20ext", function (id, oldValue, newValue) {
		if (!window.enhancementSuiteEnabled && newValue.environment !== "development") {
			d20plus.ut.log("Set Development");
			newValue.environment = "development";
			Object.defineProperty(newValue, 'seenad', {
				value: true
			});
		}
		return newValue;
	});

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
