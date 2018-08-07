ART_HANDOUT = "betteR20-art";
CONFIG_HANDOUT = "betteR20-config";

BASE_SITE_URL = "https://5etools.com/"; // TODO automate to use mirror if main site is unavailable
SITE_JS_URL = BASE_SITE_URL + "js/";

SCRIPT_EXTENSIONS = [];

CONFIG_OPTIONS = {
	interface: {
		_name: "Interface",
		showCustomArtPreview: {
			name: "Show Custom Art Previews",
			default: true,
			_type: "boolean"
		}
	}
};

addConfigOptions = function (category, options) {
	if (!CONFIG_OPTIONS[category]) CONFIG_OPTIONS[category] = options;
	else CONFIG_OPTIONS[category] = Object.assign(CONFIG_OPTIONS[category], options);
};

OBJECT_DEFINE_PROPERTY = Object.defineProperty;
ACCOUNT_ORIGINAL_PERMS = {
	largefeats: false,
	xlfeats: false
};
Object.defineProperty = function (obj, prop, vals) {
	try {
		if (prop === "largefeats" || prop === "xlfeats") {
			ACCOUNT_ORIGINAL_PERMS[prop] = vals.value;
			vals.value = true;
		}
		OBJECT_DEFINE_PROPERTY(obj, prop, vals);
	} catch (e) {
		console.log("failed to define property:");
		console.log(e);
		console.log(obj, prop, vals);
	}
};

UPPER_CANVAS_MOUSEDOWN = null;
UPPER_CANVAS_MOUSEMOVE = null;
EventTarget.prototype.addEventListenerBase = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(type, listener, options, ...others) {
	if (type === "mousedown" && this === d20.engine.uppercanvas) UPPER_CANVAS_MOUSEDOWN = listener;
	if (type === "mousemove" && this === d20.engine.uppercanvas) UPPER_CANVAS_MOUSEMOVE = listener;
	this.addEventListenerBase(type, listener, options, ...others);
};
