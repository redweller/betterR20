const fs = require("fs");
const { Script } = require("vm");
const beautify_html = require("js-beautify").html;

const SCRIPT_VERSION = "1.35.11.61";
const SCRIPT_REPO = "https://raw.githubusercontent.com/redweller/betterR20/run/";

const SCRIPT_BETA = "1.35.186.12";
const SCRIPT_BETA_REPO = "https://raw.githubusercontent.com/redweller/betterR20/dev-beta/dist/";
const SCRIPT_BETA_DESCRIPTION = `This version contains following changes
-- Beta features overview:
⦁ Mouseover hints on Conditions
⦁ Filter Imports by List
⦁ Extra Layers functionality
⦁ Token Images Editor
⦁ Better token Actions & Automation
⦁ Some fixes related to roll20 newUI
⦁ context menu small fix
⦁ ArtRepo is restored from backup
-- v.186.11 changes:
⦁ warn about Jumpgate on startup
⦁ "import source" selector rework
⦁ community module imports fix
⦁ fix crash on startup when 5e.tools is inaccessible
⦁ new image URLs fixer
⦁ new UVTT/DA walls data importer
⦁ new multitoken parameters format:
- faster loading due to less server requests
- use "tools/URLs fixer" to fix old multitokens
⦁ 5etools v2.1.0 update:
- update data and libs
- separate userscript for 2014 rules only
-- v.186.12 changes:
⦁ fix 5et2014 queries
⦁ better source selector behavior
-- v.186.13 changes:
⦁ 5etools v2.5.5 update
`;

const SCRIPT_ALPHA_DESCRIPTION = `<p>This version contains following changes<br><code>-- Alpha features overview:</code><br>⦁ Mouseover hints on Conditions<br>⦁ Filter Imports by List<br>⦁ Extra Layers functionality<br>⦁ Token Images Editor<br>⦁ Better token Actions & Automation<br>⦁ Some fixes related to roll20 newUI<br>⦁ ArtRepo is restored from backup repo<br><code>-- Pre-release 185a:</code><br>⦁ Update libs and data to latest 5etools versions<br><code>-- v.185.5a:</code><br>⦁ URLs now point to the main site<br><code>-- v.185.6a:</code><br>⦁ Fix class import<br><code>-- v.185.7a:</code><br>⦁ Major 5etools data update<br></p>`;

const AUTHORS_CORE = `TheGiddyLimit/Redweller`;
const AUTHORS_5ETOOLS = `5egmegaanon/astranauta/MrLabRat/TheGiddyLimit/DBAWiseMan/BDeveau/Remuz/Callador Julaan/Erogroth/Stormy/FlayedOne/Cucucc/Cee/oldewyrm/darthbeep/Mertang/Redweller`;

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
// @author       5egmegaanon/astranauta/MrLabRat/TheGiddyLimit/DBAWiseMan/BDeveau/Remuz/Callador Julaan/Erogroth/Stormy/FlayedOne/Cucucc/Cee/oldewyrm/darthbeep/Mertang/Redweller
${matchString}
// @grant        unsafeWindow
// @run-at       document-start
${analyticsBlocking}
// ==/UserScript==
`;

const JS_DIR = "./js/";
const LIB_DIR = "./lib/";
const BUILD_DIR = "./dist";
const UPSTREAM_DIR = ".././betterR20.test/";
const UPSTREAM_JS = `${UPSTREAM_DIR}js/`;

const LANG_STRS = {};

function getHeader (name, info) {
	return `// ==UserScript==
// @name         betteR20-${name}-dev
// @namespace    https://5e.tools/
// @license      MIT (https://opensource.org/licenses/MIT)
// @version      ${SCRIPT_VERSION}
// @updateURL    ${SCRIPT_REPO}betteR20-${name}.meta.js
// @downloadURL  ${SCRIPT_REPO}betteR20-${name}.user.js
// @description  Enhance your Roll20 experience
// @author       ${info.authors}
${matchString}
// @grant        unsafeWindow
// @run-at       document-start
${analyticsBlocking}
// ==/UserScript==
`;
}

function joinParts (...parts) {
	return parts.join("\n\n");
}

function getDataDirPaths (dir) {
	const walkSync = (dir, filelist = []) => {
		fs.readdirSync(dir).forEach(file => {
			filelist = fs.statSync(`${dir}/${file}`).isDirectory()
				? walkSync(`${dir}/${file}`, filelist)
				: filelist.concat(`${dir}/${file}`);
		});
		return filelist;
	}
	return walkSync(dir).filter(it => it.toLowerCase().endsWith("json"));
}

function wrapLibData (filePath, data) {
	data = JSON.stringify(JSON.parse(data));
	// data = lzstring.compressToBase64(data);
	// JSON_DATA[\`${filePath}\`] = JSON.parse(LZString.decompressFromBase64(${JSON.stringify(data)}));
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
	//	"render.js",
	],
	"5etools": [
		"list.min.js",
		"jszip.min.js",
		"localforage.min.js",

		"parser.js",
		"utils.js",
		"utils-config.js",
		"utils-ui.js",
		"filter.js",
		"utils-brew.js",
		"utils-dataloader.js",
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

const SCRIPTS = {
	core: [
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
		"base-tool-dlimport",
		"base-tool-urlfix",
		"base-art",
		"base-art-browse",
		"base-art-cdn",
		"overwrites/base",
		"overwrites/canvas-handler",
		"templates/template-roll20-token-editor",
		"templates/template-roll20-page-settings",
		"templates/template-roll20-actions-menu",
		"templates/template-roll20-editors-misc",
		"templates/template-base-misc",
		"templates/template-page-views",
		"templates/template-page-weather",
		"base-engine",
		"base-menu",
		"base-weather",
		"base-views",
		"base-journal",
		"base-css",
		"base-ui",
		"base-mod",
		"base-macro",
		"base-chat-emoji",
		"base-chat-languages",
		"base-chat",
		"base-ba",
		"base-ba-character",
		"base-ba-rolltemplates",
		"base-remote-libre",
		"base-jukebox-widget",

		"core-bootstrap",

		"base",
	],
	"5etools": [
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
		"base-tool-dlimport",
		"base-tool-urlfix",
		"base-art",
		"base-art-browse",
		"base-art-cdn",
		"overwrites/base",
		"overwrites/canvas-handler",
		"templates/template-roll20-token-editor",
		"templates/template-roll20-page-settings",
		"templates/template-roll20-actions-menu",
		"templates/template-roll20-editors-misc",
		"templates/template-base-misc",
		"templates/template-page-views",
		"templates/template-page-weather",
		"base-engine",
		"base-menu",
		"base-weather",
		"base-views",
		"base-journal",
		"base-css",
		"base-ui",
		"base-mod",
		"base-macro",
		"base-chat-emoji",
		"base-chat-languages",
		"base-chat",
		"base-ba",
		"base-ba-character",
		"base-ba-rolltemplates",
		"base-remote-libre",
		"base-jukebox-widget",

		"5etools-bootstrap",
		"5etools-config",
		"5etools-main",
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
		"5etools-template",
		"5etools-css",

		"base",
	],
};

const BUILDS = {
	core: {
		authors: AUTHORS_CORE,
		baseURL: "https://5e.tools/",
		libs: LIB_SCRIPTS.core,
		libsAPI: LIB_SCRIPTS_API.core,
		scripts: SCRIPTS.core,
		dataJSON: [],
	},
	"5etools": {
		authors: AUTHORS_5ETOOLS,
		baseURL: "https://5e.tools/",
		libs: LIB_SCRIPTS["5etools"],
		libsAPI: LIB_SCRIPTS_API["5etools"],
		scripts: SCRIPTS["5etools"],
		dataJSON: getDataDirPaths("data"),
	},
	"5et2014": {
		authors: AUTHORS_5ETOOLS,
		baseURL: "https://2014.5e.tools/",
		libs: LIB_SCRIPTS["5etools"],
		libsAPI: LIB_SCRIPTS_API["5etools"],
		scripts: SCRIPTS["5etools"],
		dataJSON: getDataDirPaths("data2014"),
	},
}

Object.entries(BUILDS).forEach(([name, data]) => {
	const libScripts = data.libs;
	const libScriptsApi = data.libsAPI;
	const libJson = data.dataJSON;
	const header = getHeader(name, data);

	const filename = `${BUILD_DIR}/betteR20-${name}.user.js`;
	const metaFilename = `${BUILD_DIR}/betteR20-${name}.meta.js`;
	const fullScript = joinParts(
		header,
		fs.readFileSync(`${JS_DIR}header.js`, "utf-8").toString()
			.replace("%B20_NAME%", name)
			.replace("%B20_VERSION%", SCRIPT_VERSION)
			.replace("%B20_BASE_URL%", data.baseURL)
			.replace("%B20_REPO_URL%", SCRIPT_REPO),
		...libJson.map(filePath => wrapLibData(filePath.replace("data2014", "data"), fs.readFileSync(filePath, "utf-8"))),
		wrapLangBaseFile(),
		...data.scripts.map(filename => fs.readFileSync(`${JS_DIR}${filename}.js`, "utf-8").toString()),
		...libScripts.map(filename => wrapLibScript(fs.readFileSync(`${LIB_DIR}${filename}`, "utf-8").toString())),
		...libScriptsApi.map(filename => wrapLibScript(fs.readFileSync(`${LIB_DIR}${filename}`, "utf-8").toString(), true)),
	);
	fs.writeFileSync(filename, fullScript);
	fs.writeFileSync(metaFilename, header);
});

fs.writeFileSync(`${BUILD_DIR}/betteR20-version`, `${SCRIPT_VERSION}`);

// UPDATE SCRIPTS IN .main REPO FOR UPSTREAM PRs

const CHANGED_SCRIPTS = [
	"templates/template-roll20-token-editor",
	"templates/template-roll20-page-settings",
	"templates/template-roll20-actions-menu",
	"templates/template-roll20-editors-misc",
	"templates/template-base-misc",
	"templates/template-page-views",
	"templates/template-page-weather",

	"5etools-config",
	"5etools-css",
	"5etools-importer",
	"5etools-template",
	"5etools-tool",
	"5etools-backgrounds",
	"5etools-classes",
	"5etools-items",
	"5etools-main",
	"5etools-monsters",
	"5etools-objects",
	"5etools-psionics",
	"5etools-spells",
	"5etools-vehicles",

	"base-art",
	"base-art-browse",
	"base-remote-libre",
	"base-config",
	"base-css",
	"base-chat-languages",
	"base-chat-emoji",
	"base-chat",
	"base-ba",
	"base-ba-rolltemplates",
	"base-ba-character",
	"base-engine",
	"base-journal",
	"base-qpi",
	"base-mod",
	"base-views",
	"base-weather",
	"base-menu",
	"base-tool",
	"base-tool-animator",
	"base-tool-module",
	"base-tool-urlfix",
	"base-tool-dlimport",
	"base-ui",
	"base-util",
	"base",
	"header",
];

CHANGED_SCRIPTS.forEach((filename) => {
	const srcpath = `${JS_DIR}${filename}.js`;
	const exclude = / ?\/\/ RB20 EXCLUDE START(.*?)\/\/ RB20 EXCLUDE END/sgm;
	const refactorTemplates = /document\.addEventListener\("b20initTemplates", function initHTML \(\) {\r\n\t\td20plus\.html\.([\w_]+?) = `(.*?)\t`;\r\n\t\tdocument\.removeEventListener\("b20initTemplates", initHTML, false\);\r\n\t}\);/sgm;
	const template = (...s) => {
		let html = `<br20_npm_temp>${s[2]}</br20_npm_temp>`;
		html = html.replace(/<\$(.*?)\$>/g, (...i) => { return `&lt;!--$${i[1].replace(/'/g, "%b20squote%").replace(/"/g, "%b20dquote%")}$--&gt;` });
		html = beautify_html(html, {"indent_with_tabs": true});
		html = html.replace(/&lt;!--\$(.*?)\$--&gt;/g, (...i) => { return `<$${i[1].replace(/%b20squote%/g, "'").replace(/%b20dquote%/g, "\"")}$>` });
		html = [html.replace(/<[/]?br20_npm_temp>/g, ""), `\t`].join("");
		return `d20plus.html.${s[1]} = \`${html}\`;`
	}

	let script = fs.readFileSync(`${srcpath}`, "utf-8").toString();
	script = script.replace(exclude, "");
	script = script.replace(refactorTemplates, template);

	Object.entries(LANG_STRS.en).forEach((string) => {
		const multiline = (`${string[1]}`).search("\n") !== -1 || (`${string[1]}`).search(/\$0/) !== -1;
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
	fs.writeFileSync(`${UPSTREAM_JS}${filename}.js`, script);
});

let upstream_build = `${UPSTREAM_DIR}/node/build-scripts.js`
let upstream_bs_file = fs.readFileSync(upstream_build, "utf-8").toString();

upstream_bs_file = upstream_bs_file
//	.replace(`const BUILD_DIR = "./dist";`, `const BUILD_DIR = "../.test/dist";`)
	.replace(/const SCRIPT_VERSION = "([\d\w.]+?)";/, `const SCRIPT_VERSION = "${SCRIPT_BETA}";`)
	.replace(/const SCRIPT_REPO = "([^"]+?)";/, `const SCRIPT_REPO = "${SCRIPT_BETA_REPO}";`)
	.replace(/const SCRIPT_BETA_DESCRIPTION = `([^`]+?)`;/, `const SCRIPT_BETA_DESCRIPTION = \`${SCRIPT_BETA_DESCRIPTION}\`;`)
	.replaceAll(/\/\/ @name *betteR20-([^b]+?)/g, "// @name         betteR20-beta-$1");
fs.writeFileSync(upstream_build, upstream_bs_file);

// eslint-disable-next-line no-console
console.log(`v${SCRIPT_VERSION}: Build completed at ${(new Date()).toLocaleString().slice(12, 20)}`);
