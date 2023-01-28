// ==UserScript==
// @name         betteR20-core-dev
// @namespace    https://5e.tools/
// @license      MIT (https://opensource.org/licenses/MIT)
// @version      1.33.2.36
// @description  Enhance your Roll20 experience
// @updateURL    https://github.com/redweller/betterR20/raw/run/betteR20-core.meta.js
// @downloadURL  https://github.com/redweller/betterR20/raw/run/betteR20-core.user.js
// @author       TheGiddyLimit

// @match        https://app.roll20.net/editor
// @match        https://app.roll20.net/editor#*
// @match        https://app.roll20.net/editor?*
// @match        https://app.roll20.net/editor/
// @match        https://app.roll20.net/editor/#*
// @match        https://app.roll20.net/editor/?*

// @grant        unsafeWindow
// @run-at       document-start

// @grant        GM_webRequest
// @webRequest   [{"selector": { "include": "*://www.google-analytics.com/analytics.js" },  "action": "cancel"}]
// @webRequest   [{"selector": { "include": "*://cdn.userleap.com/shim.js?*" },  "action": "cancel"}]
// @webRequest   [{"selector": { "include": "*://analytics.tiktok.com/*" },  "action": "cancel"}]

// ==/UserScript==
