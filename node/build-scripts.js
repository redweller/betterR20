const fs = require("fs");
const beautify_html = require("js-beautify").html;
const lzstring = require("./lz-string");

const SCRIPT_VERSION = "1.35.3.47";
const SCRIPT_REPO = "https://github.com/redweller/betterR20/raw/run/";

const SCRIPT_BETA = "1.35.172.9";
const SCRIPT_BETA_REPO = "https://github.com/redweller/betterR20/raw/beta/";
const SCRIPT_BETA_DESCRIPTION = `This version contains following changes
-- v.172.1 changes:
<strong>Add Edit Token Images dialog</strong>
⦁ manage token images at any moment via context menu
⦁ create and edit Multi-Sided tokens on the fly
⦁ the new dialog replaces Set Side Size (and can set any custom size instead)
⦁ option to exclude any image from Random Side selection
⦁ update Random Side randomizer (to give seemingly more random results)
NOTE: sides with custom size may become unselectable in older versions of betteR20, but should work OK with vanilla roll20
-- v.172.3 changes:
<strong>Mouseover hints on Conditions</strong>
⦁ added hints to any chat message on standard D&D conditions, diseases and statuses
⦁ works with 5etools version only, and uses 5etools data
⦁ can be disabled in b20 Config in Chat section
-- v.172.4 changes:
⦁ condition names with hints are now clickable and send the description to chat
-- v.172.5 changes:
<strong>Filter Imports by List</strong>
⦁ When importing, you can filter by a list of items. This means that when importing, if you press Import by list and enter the items that you want to import, it will automatically choose all of them for you.
⦁ The UX, explaining, and labeling needs work. Please give suggestions
-- v.172.6 changes:
⦁ You can now filter by source. This means the filter is fully compatible with copying csvs from table view in 5etools
⦁ Some "Filter by List" labeling improvements
⦁ (not related to Filter) Change players' avatars size
-- v.172.7 changes:
<strong>Better token Actions & Automation</strong>
⦁ New automatic token action buttons appear whenever you select a character:
Rolls, Stats and Animation (the latter appears only if you've set up animations in current Campaign)
⦁ Rolls lets you select available actions, including spells and attacks, and send the roll to chat.
The roll templates have slightly updated look and let you select the target whenever it's required
⦁ Stats show basic character info. The buttons at the top of the menu let you quickly open character sheet, and let you toggle "Speaking as" this character mode
⦁ Whenever you roll using Better Actions menu, you gain several benefits:
- the damage/healing values are clickable and are applied on click
- spell slots are spent automatically when you use a spell
- both actions give brief chat reminders that allow reverting the changes
-- v.172.9 changes:
⦁ Multiple bug fixes & general refactoring
⦁ Proper display of hit dice and death saves, also added Concentration
⦁ Auto roll saves, and show save/attack success or failure
⦁ Item tracking (enable Ammo tracking and type item name in Ammo field)
The system is still in an unfinished state, so use with caution!`;

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
const UPSTREAM_DIR = "./.main/";
const UPSTREAM_JS = "./.main/js/";

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
	core: [], // core: ["data/conditionsdiseases.json"],
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
			"base-ba-rolltemplates",
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
		// fs.readFileSync(`${JS_DIR}base-lzstring.js`, "utf-8").toString(),
		...libJson.map(filePath => wrapLibData(filePath, fs.readFileSync(filePath, "utf-8"))),
		wrapLangBaseFile(),
		...v.scripts.map(filename => fs.readFileSync(`${JS_DIR}${filename}.js`, "utf-8").toString()),
		...libScripts.map(filename => wrapLibScript(fs.readFileSync(`${LIB_DIR}${filename}`, "utf-8").toString())),
		...libScriptsApi.map(filename => wrapLibScript(fs.readFileSync(`${LIB_DIR}${filename}`, "utf-8").toString(), true)),
	);
	fs.writeFileSync(filename, fullScript);
	fs.writeFileSync(metaFilename, v.header);
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
	"5etools-main",
	"5etools-template",
	"base-art",
	"base-config",
	"base-css",
	"base-chat-languages",
	"base-chat-emoji",
	"base-chat",
	"base-ba",
	"base-ba-rolltemplates",
	"base-engine",
	"base-journal",
	"base-qpi",
	"base-mod",
	"base-views",
	"base-weather",
	"base-menu",
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
	.replace(/const SCRIPT_VERSION = "([\d.]+?)";/, `const SCRIPT_VERSION = "${SCRIPT_BETA}";`)
	.replace(`const BUILD_DIR = "./dist";`, `const BUILD_DIR = "../.test/dist";`)
	.replaceAll("https://github.com/TheGiddyLimit/betterR20/raw/development/", SCRIPT_BETA_REPO)
	.replaceAll(/\/\/ @name *betteR20-([^b]+?)/g, "// @name         betteR20-beta-$1")
	.replace(`=> fs.readFileSync(\`\${JS_DIR}\${filename}.js\`, "utf-8").toString())`, `=> filename === "base-util"
			? fs.readFileSync(\`\${JS_DIR}\${filename}.js\`, "utf-8").toString().replace("}, 6000);", \`
			d20plus.ut.sendHackerChat(\\\`
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
			\\\`);
			if (d20plus.ut.cmpVersions("${SCRIPT_VERSION}", avail) < 0) d20plus.ut.sendHackerChat(\\\`
			<div class="userscript-b20intro">
				<h1 style="display: inline-block;line-height: 25px;margin-top: 5px; font-size: 22px;">
					The testing was completed
					<p style="font-size: 11px;line-height: 15px;color: rgb(32, 194, 14);">You can now switch back to release version</p>
				</h1>
				<p>It appears the current public version of betteR20 is newer then the version of this beta's origin.
				It most probably means that the testing is over and the new features were successfully released.<br><br>
				You can switch back to released script version in TamperMonkey. 
				Check the <code>#testing</code> channel in Discord from time to time, if you want to participate in the future tests.</p>
			</div>
			\\\`);
		}, 6000);\`)
				.replace(/(const |)\\bavail\\b/g, "d20plus.ut.avail")
			: fs.readFileSync(\`\${JS_DIR}\${filename}.js\`, "utf-8").toString())`);
fs.writeFileSync(upstream_build, upstream_bs_file);

// eslint-disable-next-line no-console
console.log(`v${SCRIPT_VERSION}: Build completed at ${(new Date()).toLocaleString().slice(12, 20)}`);
