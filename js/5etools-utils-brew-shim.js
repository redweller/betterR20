function utilsBrewShim () {
	/**
	 * A shim for 5etools' "BrewUtil2," as we do not want/need the vast majority of its functionality in b20.
	 */
	d20plus.brewShim = {
		META: {},
		HOMEBREW: {},

		addBrewMeta (_meta) {
			Object.entries(_meta || {})
				.forEach(([prop, val]) => {
					if (!val) return;
					if (typeof val !== "object") return;

					if (val instanceof Array) {
						(d20plus.brewShim.META[prop] = d20plus.brewShim.META[prop] || []).push(...MiscUtil.copy(val));
						return;
					}

					d20plus.brewShim.META[prop] = d20plus.brewShim.META[prop] || {};
					Object.assign(d20plus.brewShim.META[prop], MiscUtil.copy(val));
				});

			// Add a special "_sources" cache, which is a lookup-friendly object (rather than "sources", which is an array)
			d20plus.brewShim.META._sources = d20plus.brewShim.META._sources || {};
			Object.assign(
				d20plus.brewShim.META._sources,
				(_meta?.sources || [])
					.mergeMap(src => ({[(src.json || "").toLowerCase()]: MiscUtil.copy(src)})),
			);
		},

		addBrew (brew) {
			this.addBrewMeta(brew._meta);

			Object.entries(brew)
				.filter(([, arr]) => arr != null && arr instanceof Array)
				.forEach(([k, arr]) => {
					arr = arr.filter(it => {
						if (it.source) return !Parser.SOURCE_JSON_TO_ABV[it.source];
						if (it.inherits) return !Parser.SOURCE_JSON_TO_ABV[it.inherits.source];
						return true;
					})
					d20plus.brewShim.HOMEBREW[k] = [...(d20plus.brewShim.HOMEBREW[k] || []), ...arr];
				})
		},
	}

	class BrewUtil2 {
		static hasSourceJson (source) { return !!this.getMetaLookup("_sources")[(source || "").toLowerCase()]; }
		static sourceJsonToFull (source) { return this.getMetaLookup("_sources")[(source || "").toLowerCase()]?.full || source; }
		static sourceJsonToSource (source) { return this.getMetaLookup("_sources")[(source || "").toLowerCase()]; }
		static sourceJsonToAbv (source) { return this.getMetaLookup("_sources")[(source || "").toLowerCase()]?.abbreviation || source; }
		static sourceJsonToDate (source) { return this.getMetaLookup("_sources")[(source || "").toLowerCase()]?.dateReleased || "1970-01-01"; }

		static sourceJsonToStyle (source) { return ""; }

		static getValidColor (color) { return color; }

		static pGetBrewProcessed () { return d20plus.brewShim.HOMEBREW; }

		static getMetaLookup (type) { return d20plus.brewShim.META[type]; }
	}

	window.BrewUtil2 = BrewUtil2;
}

SCRIPT_EXTENSIONS.push(utilsBrewShim);
