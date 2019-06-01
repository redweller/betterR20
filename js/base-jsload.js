function baseJsLoad () {
	d20plus.js = {};

	d20plus.js.scripts = [
		{name: "listjs", url: "https://raw.githubusercontent.com/javve/list.js/v1.5.0/dist/list.min.js"},
		{name: "localforage", url: "https://raw.githubusercontent.com/localForage/localForage/1.7.3/dist/localforage.min.js"},
		{name: "JSZip", url: `https://raw.githubusercontent.com/Stuk/jszip/master/dist/jszip.min.js`},
	];

	if (d20plus.ut.isUseSharedJs()) d20plus.js.scripts.push({name: "5etoolsShared", url: `${SITE_JS_URL}shared.js`});
	else d20plus.js.scripts.push({name: "5etoolsUtils", url: `${SITE_JS_URL}utils.js`});

	d20plus.js.apiScripts = [
		{name: "VecMath", url: "https://raw.githubusercontent.com/Roll20/roll20-api-scripts/master/Vector%20Math/1.0/VecMath.js"},
		{name: "MatrixMath", url: "https://raw.githubusercontent.com/Roll20/roll20-api-scripts/master/MatrixMath/1.0/matrixMath.js"},
		{name: "PathMath", url: "https://raw.githubusercontent.com/Roll20/roll20-api-scripts/master/PathMath/1.5/PathMath.js"}
	];

	d20plus.js.addScripts = (onLoadFunction) => {
		d20plus.ut.log("Add JS");
		const onEachLoadFunction = function (name, url, js) {
			d20plus.js._addScript(name, js);
		};
		d20plus.js.chainLoad(d20plus.js.scripts, 0, onEachLoadFunction, (...args) => {
			onLoadFunction(...args);

			const cached = DataUtil.loadJSON;
			DataUtil.loadJSON = (...args) => {
				if (args.length > 0 && typeof args[0] === "string" && args[0].startsWith("data/")) {
					args[0] = BASE_SITE_URL + args[0];
				}
				return cached.bind(DataUtil)(...args);
			};
		});
	};

	d20plus.js.addApiScripts = (onLoadFunction) => {
		d20plus.ut.log("Add Builtin API Scripts");
		const onEachLoadFunction = function (name, url, js) {
			d20plus.js._addScript(name, js);
		};
		d20plus.js.chainLoad(d20plus.js.apiScripts, 0, onEachLoadFunction, onLoadFunction);
	};

	d20plus.js._addScript = (name, js) => {
		return new Promise((resolve, reject) => {
			try {
				window.eval(js);
				d20plus.ut.log(`JS [${name}] Loaded`);
				resolve()
			} catch (e) {
				d20plus.ut.log(`Error loading [${name}]`);
				d20plus.ut.log(e);
				reject(e);
			}
		})
	};

	d20plus.js.chainLoad = (toLoads, index, onEachLoadFunction, onFinalLoadFunction) => {
		const toLoad = toLoads[index];
		// on loading the last item, run onLoadFunction
		d20plus.js.loadWithRetries(
			toLoad.name,
			toLoad.url,
			(data) => {
				if (index === toLoads.length - 1) {
					onEachLoadFunction(toLoad.name, toLoad.url, data);
					onFinalLoadFunction();
				} else {
					onEachLoadFunction(toLoad.name, toLoad.url, data);
					d20plus.js.chainLoad(toLoads, index + 1, onEachLoadFunction, onFinalLoadFunction);
				}
			},
			!!toLoad.isJson
		);
	};

	d20plus.js.loadWithRetries = (name, url, onSuccess, isJson) => {
		let retries = 3;
		function withRetries () {
			return new Promise((resolve, reject) => {
				$.ajax({
					type: "GET",
					url: `${url}${d20plus.ut.getAntiCacheSuffix()}${retries}`,
					success: function (data) {
						if (isJson && typeof data === "string") resolve(JSON.parse(data));
						else resolve(data);
					},
					error: function (resp, qq, pp) {
						if (resp && resp.status >= 400 && retries-- > 0) {
							console.error(resp, qq, pp);
							d20plus.ut.log(`Error loading ${name}; retrying`);
							setTimeout(() => {
								withRetries().then((data) => onSuccess(data));
							}, 500);
						} else {
							console.error(resp, qq, pp);
							d20plus.ut.log(`Error loading ${name}`);
							reject(resp, qq, pp);
						}
					}
				});
			})
		}

		withRetries().then((data) => onSuccess(data));
	};
}

SCRIPT_EXTENSIONS.push(baseJsLoad);
