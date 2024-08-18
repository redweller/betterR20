// SPECIFYING PATH TO 5eTOOLS:
// Console: node get-data.js <path_to_5etools_root>
// OR create /node/path.js with module.exports = "<path_to_5etools_root>"

const process = require("process");
const fs = require("fs");
const path = require("path");

const pathFromFile = fs.existsSync("node/path.js") && require("./path.js");
const pathFromArg = process.argv[2];
const SRC_PATH = pathFromFile || pathFromArg;

if (!SRC_PATH) {
	// eslint-disable-next-line no-console
	console.error(`We need the path to 5etools data to work`);
	process.exit(1);
}

const _BLOCKLIST_FILENAMES_JSON = new Set([
	"changelog.json",
	"roll20-items.json",
	"roll20-tables.json",
	"roll20.json",
]);

// region https://stackoverflow.com/a/55566081

const recursiveReadDir = (p, a = []) => {
	if (fs.statSync(p).isDirectory()) fs.readdirSync(p).map(f => recursiveReadDir(a[a.push(path.join(p, f)) - 1], a))
	return a
}
// endregion

async function main () {
	const curListing = recursiveReadDir("data");

	for (const pth of curListing) {
		if (!pth.endsWith(".json")) continue;
		if (_BLOCKLIST_FILENAMES_JSON.has(path.basename(pth))) continue;
		const pathSiteDir = path.join(SRC_PATH, pth);
		if (!fs.existsSync(pathSiteDir)) throw new Error(`File ${pth} does not exist in 5etools data!`);
		fs.copyFileSync(pathSiteDir, pth);
	}
}

// eslint-disable-next-line no-console
main().then(() => console.log("Done!"));
