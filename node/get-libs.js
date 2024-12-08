// SPECIFYING PATH TO 5eTOOLS:
// Console: node get-libs.js <path_to_5etools_root>
// OR create /node/path.js with the following contents:
// module.exports = {mirror5e: "<path_to_5etools_root>"}

const process = require("process");
const fs = require("fs");
const path = require("path");
const rollup = require("rollup").rollup;
const msg = console;

const pathFromFile = fs.existsSync("node/path.js") && require("./path.js");
const pathFromArg = process.argv[2];
const SRC_PATH = pathFromFile?.mirror5e || pathFromArg;

if (!SRC_PATH) {
	msg.error(`We need the path to 5etools data to work`);
	process.exit(1);
}

const _LIBS = new Set([
	"parser.js",
	"render.js",
	"render-dice.js",
	"scalecreature.js",
	"filter.js",
	"utils.js",
	"utils-ui.js",
	"utils-brew.js",
	"utils-config.js",
	"utils-dataloader.js",
]);

async function build (input, output) {
	const bundle = await rollup({
		input,
		onLog: (lvl, log, handler) => log.code !== "EVAL" && handler(lvl, log),
	});

	await bundle.write({
		file: output,
		format: "es",
	});
}

async function main () {
	const siteJsRoot = path.join(SRC_PATH, "js");
	const files = fs.readdirSync(siteJsRoot);

	for (const name of files) {
		if (!_LIBS.has(name)) continue;

		const src = path.join(siteJsRoot, name);
		const bundle = path.join("lib", name);
		await build(src, bundle);
	}

	msg.log("Successfully processed libs");
}

require.main === module && main().then(() => msg.log("Done!"));
module.exports = main;
