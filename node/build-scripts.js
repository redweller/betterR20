const fs = require("fs");

const SCRIPT_VERSION = "1.12.4";

const HEADER_CORE = `// ==UserScript==
// @name         betteR20-core
// @namespace    https://rem.uz/
// @license      MIT (https://opensource.org/licenses/MIT)
// @version      ${SCRIPT_VERSION}
// @updateURL    https://get.5etools.com/script/betteR20-core.user.js
// @downloadURL  https://get.5etools.com/script/betteR20-core.user.js
// @description  Enhance your Roll20 experience
// @author       TheGiddyLimit
// @match        https://app.roll20.net/editor/
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==
`;

const HEADER_5ETOOLS = `// ==UserScript==
// @name         betteR20-5etools
// @namespace    https://rem.uz/
// @license      MIT (https://opensource.org/licenses/MIT)
// @version      ${SCRIPT_VERSION}
// @updateURL    https://get.5etools.com/script/betteR20-5etools.user.js
// @downloadURL  https://get.5etools.com/script/betteR20-5etools.user.js
// @description  Enhance your Roll20 experience
// @author       5egmegaanon/astranauta/MrLabRat/TheGiddyLimit/DBAWiseMan/BDeveau/Remuz/Callador Julaan/Erogroth/Stormy
// @match        https://app.roll20.net/editor/
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==
`;

const JS_DIR = "./js/";
const BUILD_DIR = "./dist";

function joinParts (...parts) {
	return parts.join("\n\n");
}

if (!fs.existsSync(BUILD_DIR)){
	fs.mkdirSync(BUILD_DIR);
}

const ptBase = fs.readFileSync(`${JS_DIR}betteR20-base.js`).toString();
const ptBaseHead = fs.readFileSync(`${JS_DIR}betteR20-base-header.js`).toString();

const ptCore = fs.readFileSync(`${JS_DIR}betteR20-core.js`).toString();

const pt5etools = fs.readFileSync(`${JS_DIR}betteR20-5etools.js`).toString();
const pt5etoolsEmoji = fs.readFileSync(`${JS_DIR}betteR20-5etools-emoji.js`).toString();

const fullBase = joinParts(HEADER_CORE, ptBaseHead, ptCore, ptBase);
const full5etools = joinParts(HEADER_5ETOOLS, ptBaseHead, pt5etools, pt5etoolsEmoji, ptBase);

fs.writeFileSync(`${BUILD_DIR}/betteR20-core.user.js`, fullBase);
fs.writeFileSync(`${BUILD_DIR}/betteR20-5etools.user.js`, full5etools);

console.log(`v${SCRIPT_VERSION}: Build completed at ${(new Date()).toJSON().slice(11, 19)}`);
