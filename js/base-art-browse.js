function d20plusArtBrowser () {
	d20plus.artBrowse = {};

	// ART IMPORTER 2.0
	d20plus.artBrowse.initRepoBrowser = () => {
		const TIME = (new Date()).getTime();
		const STATES = ["0", "1", "2"]; // off, blue, red

		function pGetJson (url) { // avoid using the main site method's caching
			return new Promise(resolve => $.getJSON(url, data => resolve(data)));
		}

		const $win = $(`<div title="Art Repository" class="artr__win"/>`)
			.appendTo($(`body`)).dialog({
				autoOpen: false,
				resizable: true,
				width: 1,
				height: 1
			});

		async function doInit () {
			const $sidebar = $(`<div class="artr__side"/>`).appendTo($win);
			const $mainPane = $(`<div class="artr__main"/>`).appendTo($win);
			const $loadings = [
				$(`<div class="artr__side__loading" title="Caching repository data, this may take some time">Loading...</div>`).appendTo($sidebar),
				$(`<div class="artr__main__loading" title="Caching repository data, this may take some time">Loading...</div>`).appendTo($mainPane)
			];

			const start = (new Date()).getTime();
			const GH_PATH = `https://raw.githubusercontent.com/DMsGuild201/Roll20_resources/develop/ExternalArt/dist/`;
			const [enums, index] = await Promise.all([pGetJson(`${GH_PATH}_meta_enums.json`), pGetJson(`${GH_PATH}_meta_index.json`)]);
			d20plus.ut.log(`Loaded metadata in ${((new Date()).getTime() - start) / 1000} secs.`);

			Object.keys(index).forEach(k => index[k]._key = k);

			let filters = {};
			let search = "";
			let currentItem = null;
			let currentIndexKey = null;

			function _searchFeatures (item, doLowercase) {
				// features are lowercase in index
				return !!(item.features || []).find(x => (doLowercase ? x.toLowerCase() : x).includes(search));
			}

			function _filterProps (item) {
				if (Object.keys(filters).length) {
					const missingOrUnwanted = Object.keys(filters).find(prop => {
						if (!item[prop]) return true;
						const requiredVals = Object.keys(filters[prop]).filter(k => filters[prop][k]);
						const missingEnum = !!requiredVals.find(x => !item[prop].includes(x));
						const excludedVals = Object.keys(filters[prop]).filter(k => !filters[prop][k]);
						const unwantedEnum = !!excludedVals.find(x => item[prop].includes(x));
						return missingEnum || unwantedEnum;
					});
					if (missingOrUnwanted) return false;
				}
				return true;
			}

			function applyFilterAndSearchToIndex () {
				search = search.toLowerCase();

				// require the user to search or apply a filter before displaying any results
				if (Object.keys(filters).length === 0 && search.length < 2) return [];

				return Object.values(index).filter(it => {
					if (search) {
						const searchVisible = it._set.toLowerCase().includes(search)
							|| it._artist.toLowerCase().includes(search)
							|| _searchFeatures(it);
						if (!searchVisible) return false;
					}
					return _filterProps(it, 1);
				});
			}

			function applyFilterAndSearchToItem () {
				const cpy = MiscUtil.copy(currentItem);
				const filterItem = $cbMirrorFilters.prop("checked");
				cpy.data = cpy.data.filter(it => {
					if (search) if (!_searchFeatures(it, true)) return false;
					if (filterItem) return _filterProps(it);
					return true;
				});
				return cpy;
			}

			$loadings.forEach($l => $l.remove());

			// SIDEBAR /////////////////////////////////////////////////////////////////////////////////////////
			const $sideHead = $(`<div class="p-2 artr__side__head"><div class="artr__side__head__title">Filters</div></div>`).appendTo($sidebar);
			// This functionality is contained in the filter buttons, but might need to be done here to improve performance in the future
			// $(`<button class="btn">Apply</button>`).click(() => {
			// 	if (currentItem) doRenderItem(applyFilterAndSearchToItem());
			// 	else doRenderIndex(applyFilterAndSearchToIndex())
			// }).appendTo($sideHead);
			const $lbMirrorFilters = $(`<label class="split" title="Apply filters to results inside folders (as well as the index)"><span>Filter within folders</span></label>`).appendTo($sideHead);
			const $cbMirrorFilters = $(`<input type="checkbox" checked>`).appendTo($lbMirrorFilters).change(() => {
				if (currentItem) {
					doRenderItem(applyFilterAndSearchToItem());
				}
			});

			const $sideBody = $(`<div class="artr__side__body"/>`).appendTo($sidebar);
			const addSidebarSection = (prop, ix) => {
				const fullName = (() => {
					switch (prop) {
						case "imageType": return "Image Type";
						case "grid": return "Grid Type";
						case "monster": return "Monster Type";
						case "audience": return "Intended Audience";
						default:
							return prop.uppercaseFirst();
					}
				})();

				const $tagHead = $(`<div class="artr__side__tag_header"><div>${fullName}</div><div>[\u2013]</div></div>`).appendTo($sideBody).click(() => {
					$tagGrid.toggle();
					$tagHead.html($tagHead.html().replace(/\[.]/, (...m) => m[0] === "[+]" ? "[\u2013]" : "[+]"));
				});

				const $tagGrid = $(`<div class="artr__side__tag_grid"/>`).appendTo($sideBody);
				const getNextState = (state, dir) => {
					const ix = STATES.indexOf(state) + dir;
					if (ix > STATES.length - 1) return STATES[0];
					if (ix < 0) return STATES.last();
					return STATES[ix];
				};

				if (ix) $tagHead.click(); // hide by default

				enums[prop].sort((a, b) => SortUtil.ascSort(b.c, a.c)).forEach(enm => {
					const cycleState = dir => {
						const nxtState = getNextState($btn.attr("data-state"), dir);
						$btn.attr("data-state", nxtState);

						if (nxtState === "0") {
							delete filters[prop][enm.v];
							if (!Object.keys(filters[prop]).length) delete filters[prop];
						} else (filters[prop] = filters[prop] || {})[enm.v] = nxtState === "1";

						if (currentItem) doRenderItem(applyFilterAndSearchToItem());
						else doRenderIndex(applyFilterAndSearchToIndex());
					};

					const $btn = $(`<button class="btn artr__side__tag" data-state="0">${enm.v} (${enm.c})</button>`)
						.click(() => cycleState(1))
						.contextmenu((evt) => {
							if (!evt.ctrlKey) {
								evt.preventDefault();
								cycleState(-1);
							}
						})
						.appendTo($tagGrid);
				});
			};
			Object.keys(enums).forEach((k, i) => addSidebarSection(k, i));

			// MAIN PAGE ///////////////////////////////////////////////////////////////////////////////////////
			const $mainHead = $(`<div class="p-2 artr__search"/>`).appendTo($mainPane);

			const $wrpBread = $(`<div class="artr__bread"/>`).appendTo($mainHead);
			const updateCrumbs = () => {
				$wrpBread.empty();
				const $txtIndex = $(`<span class="artr__crumb">Index</span>`)
					.appendTo($wrpBread)
					.click(() => doRenderIndex(applyFilterAndSearchToIndex()));

				if (currentItem) {
					const $txtSlash = $(`<span class="artr__crumb artr__crumb--sep">/</span>`).appendTo($wrpBread);
					const $txtItem = $(`<span class="artr__crumb">${currentItem.set} | ${currentItem.artist}</span>`)
						.appendTo($wrpBread)
						.click(() => {
							$iptSearch.val("");
							search = "";
							doRenderItem(applyFilterAndSearchToItem(), true);
						});
				}
			};
			updateCrumbs();

			let searchTimeout;
			const doSearch = () => {
				search = ($iptSearch.val() || "").trim();
				if (currentItem) doRenderItem(applyFilterAndSearchToItem());
				else doRenderIndex(applyFilterAndSearchToIndex())
			};
			const $iptSearch = $(`<input placeholder="Search..." class="artr__search__field">`).on("keydown", (e) => {
				clearTimeout(searchTimeout);
				if (e.which === 13) {
					doSearch();
				} else {
					searchTimeout = setTimeout(() => {
						doSearch();
					}, 100);
				}
			}).appendTo($mainHead);

			const $mainBody = $(`<div class="artr__view"/>`).appendTo($mainPane);
			const $mainBodyInner = $(`<div class="artr__view_inner"/>`).appendTo($mainBody);

			const $itemBody = $(`<div class="artr__view"/>`).hide().appendTo($mainPane);
			const $itemBodyInner = $(`<div class="artr__view_inner"/>`).appendTo($itemBody);

			function doRenderIndex (indexSlice) {
				currentItem = false;
				currentIndexKey = false;
				$mainBody.show();
				$itemBody.hide();
				$mainBodyInner.empty();
				updateCrumbs();

				if (!indexSlice.length) {
					$(`<div class="artr__no_results_wrp"><div class="artr__no_results"><div class="text-center"><span class="artr__no_results_headline">No results found</span><br>Please adjust the filters (on the left) or refine your search (above).</div></div></div>`).appendTo($mainBodyInner)
				} else {
					indexSlice.forEach(it => {
						const $item = $(`<div class="artr__item artr__item--index"/>`).appendTo($mainBodyInner).click(() => doLoadAndRenderItem(it));
						const $itemTop = $(`
							<div class="artr__item__top artr__item__top--quart">
								${[...new Array(4)].map((_, i) => `<div class="atr__item__quart">${it._sample[i] ? `<img class="artr__item__thumbnail" src="${GH_PATH}${it._key}--thumb-${it._sample[i]}.jpg">` : ""}</div>`).join("")}								
							</div>
						`).appendTo($item);
						const $itemBottom = $(`
							<div class="artr__item__bottom">
								<div class="artr__item__bottom__row" style="padding-bottom: 2px;" title="${it._set}">${it._set}</div>
								<div class="artr__item__bottom__row" style="padding-top: 2px;" title="${it._artist}"><i>By</i> ${it._artist}</div>
							</div>
						`).appendTo($item);
					});
				}
			}

			function doLoadAndRenderItem (indexItem) {
				pGetJson(`${GH_PATH}${indexItem._key}.json`).then(file => {
					currentItem = file;
					currentIndexKey = indexItem._key;
					doRenderItem(applyFilterAndSearchToItem(), true);
				});
			}

			function doRenderItem (file, resetScroll) {
				$mainBody.hide();
				$itemBody.show();
				$itemBodyInner.empty();
				updateCrumbs();
				if (resetScroll) $itemBodyInner.scrollTop(0);
				const $itmUp = $(`<div class="artr__item artr__item--item artr__item--back"><div class="pictos">[</div></div>`)
					.click(() => doRenderIndex(applyFilterAndSearchToIndex()))
					.appendTo($itemBodyInner);
				file.data.sort((a, b) => SortUtil.ascSort(a.hash, b.hash)).forEach(it => {
					// "library-item" and "draggableresult" classes required for drag/drop
					const $item = $(`<div class="artr__item artr__item--item library-item draggableresult" data-fullsizeurl="${it.uri}"/>`)
						.appendTo($itemBodyInner)
						.click(() => {
							const $wrpBigImg = $(`<div class="artr__wrp_big_img"><img class="artr__big_img" src="${it.uri}"></div>`)
								.click(() => $wrpBigImg.remove()).appendTo($(`body`));
						});
					const $wrpImg = $(`<div class="artr__item__full"/>`).appendTo($item);
					const $img = $(`<img class="artr__item__thumbnail" src="${GH_PATH}${currentIndexKey}--thumb-${it.hash}.jpg">`).appendTo($wrpImg);

					$item.draggable({
						handle: ".artr__item",
						revert: true,
						revertDuration: 0,
						helper: "clone",
						appendTo: "body"
					});
				});
			}

			doRenderIndex(applyFilterAndSearchToIndex());
		}

		let firstClick = true;
		const calcWidth = () => {
			const base = d20.engine.canvasWidth * 0.66;
			return (Math.ceil((base - 300) / 190) * 190) + 320;
		};
		const $btnBrowse = $(`#button-browse-external-art`).click(() => {
			$win.dialog(
				"option",
				{
					width: calcWidth(),
					height: d20.engine.canvasHeight - 100,
					position: {
						my: "left top",
						at: "left+75 top+15",
						collision: "none"
					}
				}
			).dialog("open");

			if (firstClick) {
				doInit();
				firstClick = false;
			}
		});
	};
}

SCRIPT_EXTENSIONS.push(d20plusArtBrowser);
