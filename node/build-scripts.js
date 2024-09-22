const fs = require("fs");

const SCRIPT_VERSION = "1.35.185.11";
const SCRIPT_REPO = "https://raw.githubusercontent.com/redweller/betterR20/beta/dist/";

const SCRIPT_BETA_DESCRIPTION = `This version contains following changes
-- Beta features overview:
<strong>Mouseover hints on Conditions</strong>
⦁ added hints to any chat message on standard D&D conditions
⦁ can be disabled in b20 Config in Chat section
<strong>Filter Imports by List</strong>
⦁ when importing, you can filter by a list of items
⦁ also filter by source, compatible with copying csvs from 5etools
<strong>Layers</strong>
⦁ add new Extra Layers toolbar as part of r20 newUI
⦁ add show/hide layers toggles to b20 layers
<strong>Miscellaneous</strong>
⦁ change players' avatars size
⦁ fixed context menu appearing on left click
⦁ fixed the art repo
<strong>Edit Token Images dialog</strong>
⦁ manage token images at any moment via context menu
⦁ a better Random Side randomizer (for seemingly more random results)
⦁ edit token images directly from roll20 Token Editor
<strong>Better token Actions & Automation</strong>
⦁ new character menu in left top corner of the screen
- new design, the menu works even when no character is selected
- browse stats and actions for last selected token
⦁ use available actions with custom roll templates
- the damage/healing values are clickable and are applied on click
- spell slots, items and resources are spent automatically 
- auto roll saves, and show save/attack success or failure
- view descriptions before you use a spell or a trait
- filter prepared spells/useable traits etc.
- upcast or use spells as ritual
-- v.185.11 changes:
⦁ warn about Jumpgate on startup
⦁ "import source" selector rework
⦁ community module imports fix
⦁ fix crash on startup when 5e.tools is inaccessible
⦁ new image URLs fixer
⦁ new UVTT/DA walls data importer
⦁ new multitoken parameters format
- faster images loading due to less server requests
- use "tools/URLs fixer" to convert your old multitokens
`;

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
// @name         betteR20-beta-core
// @namespace    https://5e.tools/
// @license      MIT (https://opensource.org/licenses/MIT)
// @version      ${SCRIPT_VERSION}
// @updateURL    ${SCRIPT_REPO}betteR20-core.meta.js
// @downloadURL  ${SCRIPT_REPO}betteR20-core.user.js
// @description  Enhance your Roll20 experience
// @author       TheGiddyLimit
${matchString}
// @grant        unsafeWindow
// @run-at       document-start
${analyticsBlocking}
// ==/UserScript==
`;

const HEADER_5ETOOLS = `// ==UserScript==
// @name         betteR20-beta-5etools
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
			"base-tool-dlimport",
			"base-tool-urlfix",
			"base-art",
			"base-art-browse",
			"overwrites/base",
			"overwrites/canvas-handler",
			"templates/template-roll20-token-editor",
			"templates/template-roll20-page-settings",
			"templates/template-roll20-actions-menu",
			"templates/template-roll20-editors-misc",
			"templates/template-base-misc",
			"templates/template-page-weather",
			"base-engine",
			"base-menu",
			"base-weather",
			"base-journal",
			"base-css",
			"base-ui",
			"base-mod",
			"base-macro",
			"base-chat-languages",
			"base-chat-emoji",
			"base-chat",
			"base-ba-character",
			"base-ba-rolltemplates",
			"base-ba",
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
			"base-tool-dlimport",
			"base-tool-urlfix",
			"base-art",
			"base-art-browse",
			"overwrites/base",
			"overwrites/canvas-handler",
			"templates/template-roll20-token-editor",
			"templates/template-roll20-page-settings",
			"templates/template-roll20-actions-menu",
			"templates/template-roll20-editors-misc",
			"templates/template-base-misc",
			"templates/template-page-weather",
			"base-engine",
			"base-menu",
			"base-weather",
			"base-journal",
			"base-css",
			"base-ui",
			"base-mod",
			"base-macro",
			"base-chat-languages",
			"base-chat-emoji",
			"base-chat",
			"base-ba-character",
			"base-ba-rolltemplates",
			"base-ba",
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
		fs.readFileSync(`${JS_DIR}header.js`, "utf-8").toString()
			.replace("%B20_NAME%", k)
			.replace("%B20_VERSION%", SCRIPT_VERSION)
			.replace("%B20_BASE_URL%", "https://5e.tools/")
			.replace("%B20_REPO_URL%", SCRIPT_REPO),
		...libJson.map(filePath => wrapLibData(filePath, fs.readFileSync(filePath, "utf-8"))),
		...v.scripts.map(filename => filename === "base-util"
			? fs.readFileSync(`${JS_DIR}${filename}.js`, "utf-8").toString().replace("}, 6000);", `
			d20plus.ut.sendHackerChat(\`
				<div class="userscript-b20intro">
					<h1 style="display: inline-block;line-height: 25px;margin-top: 5px; font-size: 22px;">
						Notes on b20 beta
						<p style="font-size: 11px;line-height: 15px;color: rgb(32, 194, 14);">
							<span style="color: rgb(194, 32, 14)">You are using preview version of betteR20</span><br>
							Please read this carefully and give feedback in official betteR20 Discord server, 
							in<span style="color: orange; font-family: monospace"> 5etools &gt; better20 &gt; #testing </span>thread
						</p>
					</h1>
					<p>${SCRIPT_BETA_DESCRIPTION.replaceAll("\n", "<br>").replace(/--([^<^>^-]*?)<br>/g, "<code>--$1</code><br>")}</p>
				</div>
			\`);
			}, 6000);`)
			: fs.readFileSync(`${JS_DIR}${filename}.js`, "utf-8").toString()),
		...libScripts.map(filename => wrapLibScript(fs.readFileSync(`${LIB_DIR}${filename}`, "utf-8").toString())),
		...libScriptsApi.map(filename => wrapLibScript(fs.readFileSync(`${LIB_DIR}${filename}`, "utf-8").toString(), true)),
	);
	fs.writeFileSync(filename, fullScript);
	fs.writeFileSync(metaFilename, v.header);
});

fs.writeFileSync(`${BUILD_DIR}/betteR20-version`, `${SCRIPT_VERSION}`);

// eslint-disable-next-line no-console
console.log(`v${SCRIPT_VERSION}: Build completed at ${(new Date()).toJSON().slice(11, 19)}`);
