const fs = require("fs");

const SCRIPT_VERSION = "1.4.14";

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
// @author       5egmegaanon/astranauta/MrLabRat/TheGiddyLimit/DBAWiseMan/BDeveau/Remuz/Callador Julaan/Erogroth
// @match        https://app.roll20.net/editor/
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==
`;

function joinParts (...parts) {
	return parts.join("\n\n");
}

const buildDir = "./dist";
if (!fs.existsSync(buildDir)){
	fs.mkdirSync(buildDir);
}

const ptBase = fs.readFileSync("betteR20-base.js").toString();
const ptBaseHead = fs.readFileSync("betteR20-base-header.js").toString();

const ptCore = fs.readFileSync("betteR20-core.js").toString();

const pt5etools = fs.readFileSync("betteR20-5etools.js").toString();
const pt5etoolsEmoji = fs.readFileSync("betteR20-5etools-emoji.js").toString();

const fullBase = joinParts(HEADER_CORE, ptBaseHead, ptCore, ptBase);
const full5etools = joinParts(HEADER_5ETOOLS, ptBaseHead, pt5etools, pt5etoolsEmoji, ptBase);

fs.writeFileSync(`${buildDir}/betteR20-core.user.js`, fullBase);
fs.writeFileSync(`${buildDir}/betteR20-5etools.user.js`, full5etools);

console.log("Build complete.");