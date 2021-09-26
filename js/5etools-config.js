function tools5eConfig () {
	d20plus.cfg5e = {};

	d20plus.cfg5e.updateBaseSiteUrl = () => {
		if (!d20plus.cfg.get("import", "baseSiteUrl")) return;

		BASE_SITE_URL = d20plus.cfg.get("import", "baseSiteUrl");
		d20plus.ut.log(`Base Site Url updated: ${BASE_SITE_URL}`);

		SITE_JS_URL = `${BASE_SITE_URL}js/`;
		DATA_URL = `${BASE_SITE_URL}data/`;

		IMG_URL = `${BASE_SITE_URL}img/`;

		SPELL_DATA_DIR = `${DATA_URL}spells/`;
		SPELL_META_URL = `${SPELL_DATA_DIR}roll20.json`;
		MONSTER_DATA_DIR = `${DATA_URL}bestiary/`;
		ADVENTURE_DATA_DIR = `${DATA_URL}adventure/`;
		CLASS_DATA_DIR = `${DATA_URL}class/`;

		ITEM_DATA_URL = `${DATA_URL}items.json`;
		FEAT_DATA_URL = `${DATA_URL}feats.json`;
		PSIONIC_DATA_URL = `${DATA_URL}psionics.json`;
		OBJECT_DATA_URL = `${DATA_URL}objects.json`;
		BACKGROUND_DATA_URL = `${DATA_URL}backgrounds.json`;
		OPT_FEATURE_DATA_URL = `${DATA_URL}optionalfeatures.json`;
		RACE_DATA_URL = `${DATA_URL}races.json`;
	};
}

SCRIPT_EXTENSIONS.push(tools5eConfig);
