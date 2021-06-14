// A port of 5etools' `hist.js`

Hist = {}

Hist.util = {
	getCleanHash (hash) {
		return hash.replace(/,+/g, ",").replace(/,$/, "").toLowerCase();
	},

	getHashParts (location) {
		if (location[0] === "#") location = location.slice(1);
		return location.toLowerCase().replace(/%27/g, "'").split(HASH_PART_SEP);
	},

	getSubHash (location, key) {
		const [link, ...sub] = Hist.util.getHashParts(location);
		const hKey = `${key}${HASH_SUB_KV_SEP}`;
		const part = sub.find(it => it.startsWith(hKey));
		if (part) return part.slice(hKey.length);
		return null;
	},

	setSubhash (location, key, val) {
		if (key.endsWith(HASH_SUB_KV_SEP)) key = key.slice(0, -1);

		const [link, ...sub] = Hist.util.getHashParts(location);
		if (!link) return "";

		const hKey = `${key}${HASH_SUB_KV_SEP}`;
		const out = [link];
		if (sub.length) sub.filter(it => !it.startsWith(hKey)).forEach(it => out.push(it));
		if (val != null) out.push(`${hKey}${val}`);

		return Hist.util.getCleanHash(out.join(HASH_PART_SEP));
	}
};
