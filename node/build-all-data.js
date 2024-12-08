const msg = console;
const getLibs = require("./get-libs");
const getData = require("./get-data");
const getDataR20 = require("./get-data-roll20");

const buildAll = async () => {
	await getLibs();
	await getData();
	getDataR20();
}

buildAll();
msg.log("Build launched");
