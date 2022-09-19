const fs = require("fs");

const SCRIPT_VERSION = "1.31.0.19";
const SCRIPT_REPO = "https://github.com/redweller/betterR20/raw/run/"

const matchString = `
// @match        https://app.roll20.net/editor
// @match        https://app.roll20.net/editor#*
// @match        https://app.roll20.net/editor?*
// @match        https://app.roll20.net/editor/
// @match        https://app.roll20.net/editor/#*
// @match        https://app.roll20.net/editor/?*
`;

// We have to block certain analytics scripts from running. Whenever they and betteR20 are
// running, the analytics scripts manage to somehow crash the entire website.
const analyticsBlocking = `
// @grant        GM_webRequest
// @webRequest   [{"selector": { "include": "*://www.google-analytics.com/analytics.js" },  "action": "cancel"}]
// @webRequest   [{"selector": { "include": "*://cdn.userleap.com/shim.js?*" },  "action": "cancel"}]
// @webRequest   [{"selector": { "include": "*://analytics.tiktok.com/*" },  "action": "cancel"}]
`;

const HEADER_CORE = `// ==UserScript==
// @name         betteR20-core-dev
// @namespace    https://5e.tools/
// @license      MIT (https://opensource.org/licenses/MIT)
// @version      ${SCRIPT_VERSION}
// @description  Enhance your Roll20 experience
// @updateURL    ${SCRIPT_REPO}betteR20-core.meta.js
// @downloadURL  ${SCRIPT_REPO}betteR20-core.user.js
// @author       TheGiddyLimit
${matchString}
// @grant        unsafeWindow
// @run-at       document-start
${analyticsBlocking}
// ==/UserScript==
`;

const HEADER_5ETOOLS = `// ==UserScript==
// @name         betteR20-5etools-dev
// @namespace    https://5e.tools/
// @license      MIT (https://opensource.org/licenses/MIT)
// @version      ${SCRIPT_VERSION}
// @updateURL    ${SCRIPT_REPO}betteR20-5etools.meta.js
// @downloadURL  ${SCRIPT_REPO}betteR20-5etools.user.js
// @description  Enhance your Roll20 experience
// @author       5egmegaanon/astranauta/MrLabRat/TheGiddyLimit/DBAWiseMan/BDeveau/Remuz/Callador Julaan/Erogroth/Stormy/FlayedOne/Cucucc/Cee/oldewyrm/darthbeep/Mertang
${matchString}
// @grant        unsafeWindow
// @run-at       document-start
${analyticsBlocking}
// ==/UserScript==
`;

const JS_DIR = "./js/";
const LIB_DIR = "./lib/";
const BUILD_DIR = "./dist";
const MAIN_DIR = "./.main/js/";

const LANG_STRS = {};

function joinParts (...parts) {
	return parts.join("\n\n");
}

function getDataDirPaths () {
	const walkSync = (dir, filelist = []) => {
		fs.readdirSync(dir).forEach(file => {
			filelist = fs.statSync(`${dir}/${file}`).isDirectory()
				? walkSync(`${dir}/${file}`, filelist)
				: filelist.concat(`${dir}/${file}`);
		});
		return filelist;
	}
	return walkSync("data").filter(it => it.toLowerCase().endsWith("json"));
}

function wrapLibData (filePath, data) {
	data = JSON.stringify(JSON.parse(data));
	return `
JSON_DATA[\`${filePath}\`] = JSON.parse(${JSON.stringify(data)});
`
}

function wrapLangData (ln, data) {
	const header = `
	d20plus.ln.${ln} = {
`;
	const footer = `
	};
`;
	let body = header;
	Object.entries(data).forEach((string) => {
		body += `
		${string[0]}: [\`${string[1]}\`],`;
	})
	body += footer;
	return body;
}

function wrapLangBaseFile () {
	const header = `function baseLanguage () {
	d20plus.ln = { default: {} };
`;
	const footer = `
	for (const id in d20plus.ln.en) {
		d20plus.ln.default[id] = d20plus.ln.en[id];
	}
}

SCRIPT_EXTENSIONS.push(baseLanguage);
`;

	let BASE_LNG = "";

	LOCALES.forEach((lng) => {
		LANG_STRS[lng] = require(`../lang/${lng}.js`);
		BASE_LNG += wrapLangData(lng, LANG_STRS[lng]);
	});

	return `${header}${BASE_LNG}${footer}`;
}

let ixLibApiScript = 0;
function wrapLibScript (script, isApiScript) {
	const name = `lib_script_${ixLibApiScript++}`;
	return `
${isApiScript ? "EXT_LIB_API_SCRIPTS" : "EXT_LIB_SCRIPTS"}.push((function ${name} () {
${script}
}).toString());
`;
}

if (!fs.existsSync(BUILD_DIR)) {
	fs.mkdirSync(BUILD_DIR);
}

const LOCALES = [
	"en",
	"ru",
]

const LIB_SCRIPTS = {
	core: [
		"list.min.js",
		"jszip.min.js",
		"localforage.min.js",

		"parser.js",
		"utils.js",
		"utils-ui.js",
		"hist-port.js",
	],
	"5etools": [
		"list.min.js",
		"jszip.min.js",
		"localforage.min.js",

		"parser.js",
		"utils.js",
		"utils-ui.js",
		"hist-port.js",
		"render.js",
		"render-dice.js",
		"scalecreature.js",
	],
};

const LIB_SCRIPTS_API = {
	core: [
		"VecMath.js",
		"matrixMath.js",
		"PathMath.js",
	],
	"5etools": [
		"VecMath.js",
		"matrixMath.js",
		"PathMath.js",
	],
};

const LIB_JSON = {
	core: [],
	"5etools": getDataDirPaths(),
};

const SCRIPTS = {
	core: {
		header: HEADER_CORE,
		scripts: [
			"base-util",
			"base-jsload",
			"base-qpi",
			"base-jukebox",
			"base-math",
			"base-config",
			"base-tool",
			"base-tool-module",
			"base-tool-unlock",
			"base-tool-animator",
			"base-art",
			"base-art-browse",
			"overwrites/base",
			"overwrites/canvas-handler",
			"base-engine",
			"base-weather",
			"base-views",
			"base-journal",
			"base-css",
			"base-ui",
			"base-mod",
			"templates/template-token-editor",
			"templates/template-page-settings",
			"templates/template-roll20-actions-menu",
			"templates/template-roll20-editors-misc",
			"templates/template-base-misc",
			"templates/template-page-views",
			"templates/template-page-weather",
			"base-template",
			"base-emoji",
			"base-remote-libre",
			"base-jukebox-widget",

			"core-bootstrap",

			"base",
		],
	},
	"5etools": {
		header: HEADER_5ETOOLS,
		scripts: [
			"base-util",
			"base-jsload",
			"base-qpi",
			"base-jukebox",
			"base-math",
			"base-config",
			"base-tool",
			"base-tool-module",
			"base-tool-unlock",
			"base-tool-animator",
			"base-tool-table",
			"base-art",
			"base-art-browse",
			"overwrites/base",
			"overwrites/canvas-handler",
			"base-engine",
			"base-weather",
			"base-views",
			"base-journal",
			"base-css",
			"base-ui",
			"base-mod",
			"templates/template-token-editor",
			"templates/template-page-settings",
			"templates/template-roll20-actions-menu",
			"templates/template-roll20-editors-misc",
			"templates/template-base-misc",
			"templates/template-page-views",
			"templates/template-page-weather",
			"base-template",
			"base-emoji",
			"base-remote-libre",
			"base-jukebox-widget",

			"5etools-bootstrap",
			"5etools-config",
			"5etools-main",
			"5etools-utils-brew-shim",
			"5etools-importer",
			"5etools-monsters",
			"5etools-spells",
			"5etools-backgrounds",
			"5etools-classes",
			"5etools-items",
			"5etools-feats",
			"5etools-objects",
			"5etools-tool",
			"5etools-races",
			"5etools-psionics",
			"5etools-optional-features",
			"5etools-adventures",
			"5etools-deities",
			"5etools-vehicles",

			"base",
		],
	},
};

Object.entries(SCRIPTS).forEach(([k, v]) => {
	const libScripts = LIB_SCRIPTS[k];
	const libScriptsApi = LIB_SCRIPTS_API[k];
	const libJson = LIB_JSON[k];

	const filename = `${BUILD_DIR}/betteR20-${k}.user.js`;
	const metaFilename = `${BUILD_DIR}/betteR20-${k}.meta.js`;
	const fullScript = joinParts(
		v.header,
		fs.readFileSync(`${JS_DIR}header.js`, "utf-8").toString(),
		...libJson.map(filePath => wrapLibData(filePath, fs.readFileSync(filePath, "utf-8"))),
		wrapLangBaseFile(),
		...v.scripts.map(filename => fs.readFileSync(`${JS_DIR}${filename}.js`, "utf-8").toString()),
		...libScripts.map(filename => wrapLibScript(fs.readFileSync(`${LIB_DIR}${filename}`, "utf-8").toString())),
		...libScriptsApi.map(filename => wrapLibScript(fs.readFileSync(`${LIB_DIR}${filename}`, "utf-8").toString(), true)),
	);
	fs.writeFileSync(filename, fullScript);
	fs.writeFileSync(metaFilename, v.header);
});

const MAIN_SCRIPTS = [
	"templates/template-token-editor",
	"templates/template-page-settings",
	"templates/template-roll20-actions-menu",
	"templates/template-roll20-editors-misc",
	"templates/template-base-misc",
	"templates/template-page-views",
	"templates/template-page-weather",
	"5etools-bootstrap",
	"5etools-config",
	"5etools-main",
	"base-art",
	"base-config",
	"base-css",
	"base-emoji",
	"base-engine",
	"base-qpi",
	"base-mod",
	"base-template",
	"base-views",
	"base-ui",
	"base-util",
	// "base",
	"core-bootstrap",
	// "header",
];

MAIN_SCRIPTS.forEach((filename) => {
	const srcpath = `${JS_DIR}${filename}.js`;
	const exp = /\/\/ RB20 EXCLUDE START(.*?)\/\/ RB20 EXCLUDE END/sgm;

	let script = fs.readFileSync(`${srcpath}`, "utf-8").toString();
	script = script.replace(exp, "");

	Object.entries(LANG_STRS.en).forEach((string) => {
		const multiline = (`${string[1]}`).search("\n") !== -1;
		let replacement = !multiline ? `"${string[1]}"` : `\`${string[1]}\``;
		script = script.replace(new RegExp(`\\$\{__\\(["|']${string[0]}["|']\\)}`, "g"), string[1]);
		script = script.replace(new RegExp(`__\\(["|']${string[0]}["|'],? ?\\[?([\\w, _.]*?)\\]?\\)`, "g"), (...group) => {
			const matches = group[1].split(", ");
			matches.forEach((match, i) => {
				replacement = replacement.replace(`$${i}`, `\${${match}}`);
			});
			return replacement;
		});
	});
	fs.writeFileSync(`${MAIN_DIR}${filename}.js`, script);
})

fs.writeFileSync(`${BUILD_DIR}/betteR20-version`, `${SCRIPT_VERSION}`);

// eslint-disable-next-line no-console
console.log(`v${SCRIPT_VERSION}: Build completed at ${(new Date()).toJSON().slice(11, 19)}`);
