function d20plusArt () {
	d20plus.art = {
		button: () => {
			// add external art button was clicked
			const $art = $("#d20plus-artfolder");
			$art.dialog("open");
			const $artList = $art.find(`.list`);
			$artList.empty();

			if (d20plus.art.custom) {
				d20plus.art.custom.forEach(a => {
					const $liArt = getArtLi(a.name, a.url);
					$artList.append($liArt);
				});
			}

			// init list library
			const artList = new List("art-list-container", {
				valueNames: ["name"],
				listClass: "artlist"
			});

			const $btnAdd = $(`#art-list-add-btn`);
			const $iptAddName = $(`#art-list-add-name`);
			const $iptAddUrl = $(`#art-list-add-url`);
			$btnAdd.off("click");
			$btnAdd.on("click", () => {
				const name = $iptAddName.val().trim();
				const url = $iptAddUrl.val().trim();
				if (!name || !url) {
					alert("Missing required fields!")
				} else {
					artList.search();
					artList.filter();
					const $liArt = getArtLi(name, url);
					$artList.append($liArt);
					refreshCustomArtList();
				}
			});

			const $btnMassAdd = $(`#art-list-multi-add-btn`);
			$btnMassAdd.off("click");
			$btnMassAdd.on("click", () => {
				$("#d20plus-artmassadd").dialog("open");
				const $btnMassAddSubmit = $(`#art-list-multi-add-btn-submit`);
				$btnMassAddSubmit.off("click");
				$btnMassAddSubmit.on("click", () => {
					artList.search();
					artList.filter();
					const $iptUrls = $(`#art-list-multi-add-area`);
					const massUrls = $iptUrls.val();
					const spl = massUrls.split("\n").map(s => s.trim()).filter(s => s);
					if (!spl.length) return;
					else {
						const delim = "---";
						const toAdd = [];
						for (const s of spl) {
							if (!s.includes(delim)) {
								alert(`Badly formatted line: ${s}`)
								return;
							} else {
								const parts = s.split(delim);
								if (parts.length !== 2) {
									alert(`Badly formatted line: ${s}`)
									return;
								} else {
									toAdd.push({
										name: parts[0],
										url: parts[1]
									});
								}
							}
						}
						toAdd.forEach(a => {
							$artList.append(getArtLi(a.name, a.url));
						});
						refreshCustomArtList();
						$("#d20plus-artmassadd").dialog("close");
					}
				});
			});

			makeDraggables();
			d20plus.art.refreshList = refreshCustomArtList;

			function getArtLi (name, url) {
				const showImage = d20plus.cfg.get("interface", "showCustomArtPreview");
				const $liArt = $(`
						<li class="dd-item library-item draggableresult Vetools-draggable-art ui-draggable" data-fullsizeurl="${url}">
							${showImage ? `<img src="${url}" style="width: 30px; max-height: 30px; display: inline-block" draggable="false">` : ""}
							<div class="dd-content name" style="display: inline-block; width: 35%;" data-url="${url}">${name}</div>
							<a href="${url}"><span class="url" style="display: inline-block; width: ${showImage ? "40%" : "55%"};">${url}</span></a>
						</li>
					`);
				if (!showImage) {
					$liArt.on("mousedown", () => {
						const $loader = $(`<div class="temp-warning">Loading image - don't drop yet!</div>`);
						const $img = $(`<img src="${url}" style="width: 30px; max-height: 30px; display: none">`);
						if (!$img.prop("complete")) {
							$(`body`).append($loader);
							$img.on("load", () => {
								$loader.remove();
							});
							$loader.append($img);
						}
					});
				}

				const $btnDel = $(`<span class="delete btn btn-danger"><span class="pictos">#</span></span>`).on("click", () => {
					$liArt.remove();
					refreshCustomArtList();
				});
				$liArt.append($btnDel);
				return $liArt;
			}

			function refreshCustomArtList () {
				artList.reIndex();
				const custom = [];
				artList.items.forEach(i => {
					const $ele = $(i.elm);
					custom.push({
						name: $ele.find(`.name`).text(),
						url: $ele.find(`.url`).text()
					});
				});
				d20plus.art.custom = custom;
				makeDraggables();
				saveToHandout();
			}

			function makeDraggables () {
				$(`.Vetools-draggable-art`).draggable({
					handle: ".dd-content",
					revert: true,
					revertDuration: 0,
					helper: "clone",
					appendTo: "body"
				})
			}

			function saveToHandout () {
				const handout = d20plus.art.getArtHandout();
				if (!handout) {
					d20.Campaign.handouts.create({
						name: ART_HANDOUT,
						archived: true
					}, {
						success: function (handout) {
							notecontents = "This handout is used to store custom art URLs."

							const gmnotes = JSON.stringify(d20plus.art.custom);
							handout.updateBlobs({notes: notecontents, gmnotes: gmnotes});
							handout.save({notes: (new Date).getTime(), inplayerjournals: ""});
						}
					});
				} else {
					const gmnotes = JSON.stringify(d20plus.art.custom);
					handout.updateBlobs({gmnotes: gmnotes});
					handout.save({notes: (new Date).getTime()});
				}
			}
		},

		// TODO load a decent default art library from somewhere
		default: [
			{
				name: "Phoenix",
				url: "http://www.discgolfbirmingham.com/wordpress/wp-content/uploads/2014/04/phoenix-rising.jpg"
			}
		]
	};

	d20plus.art.getArtHandout = () => {
		return d20.Campaign.handouts.models.find((handout) => {
			return handout.attributes.name === ART_HANDOUT;
		});
	};

	d20plus.art.loadArt = (nextFn) => {
		d20plus.ut.log("Loading custom art");
		const handout = d20plus.art.getArtHandout();
		if (handout) {
			handout.view.render();
			handout._getLatestBlob("gmnotes", function (gmnotes) {
				const decoded = decodeURIComponent(gmnotes);
				try {
					d20plus.art.custom = JSON.parse(decoded);
					nextFn();
				} catch (e) {
					nextFn();
				}
			});
		} else {
			nextFn();
		}
	};

	d20plus.art.addCustomArtSearch = () => {
		d20plus.ut.log("Add custom art search");
		const $afterTo = $(`#libraryresults`);
		$afterTo.after(d20plus.artListHTML);

		const $olNone = $(`#image-search-none`);
		const $olHasResults = $(`#image-search-has-results`);

		const $olArt = $(`#custom-art-results`);
		const $srchImages = $(`#imagedialog .searchbox input.keywords`);
		$srchImages.on("keyup", () => {
			$olArt.empty();
			const searched = $srchImages.val().trim().toLowerCase();
			if (searched.length < 2) {
				$olNone.show();
				$olHasResults.hide();
				return;
			}

			let toShow = d20plus.art.default.filter(a => a.name.toLowerCase().includes(searched));
			if (d20plus.art.custom) toShow = toShow.concat(d20plus.art.custom.filter(a => a.name.toLowerCase().includes(searched)));

			if (!toShow.length) {
				$olNone.show();
				$olHasResults.hide();
			} else {
				$olNone.hide();
				$olHasResults.show();

				toShow.forEach(a => {
					$olArt.append(`
						<li class="dd-item library-item draggableresult Vetoolsresult ui-draggable" data-fullsizeurl="${a.url}">
							<div class="dd-content">
								<div class="token"><img src="${a.url}" draggable="false"></div>
								<div class="name">
									<div class="namecontainer"><a href="${a.url}" rel="external">${a.name}</a></div>
								</div>
							</div>
						</li>
					`);
				});
			}

			$("#imagedialog #Vetoolsresults .draggableresult").draggable({
				handle: ".dd-content",
				revert: true,
				revertDuration: 0,
				helper: "clone",
				appendTo: "body"
			}).addTouch();
		});
	};

	d20plus.art.initArtFromUrlButtons = () => {
		d20plus.ut.log("Add direct URL art buttons");
		// requires templates to be swapped, which happens ASAP during Init

		$(`.character-image-by-url`).live("click", function () {
			const cId = $(this).closest(`[data-characterid]`).attr(`data-characterid`);
			const url = window.prompt("Enter a URL", d20plus.art.getLastImageUrl());
			if (url) {
				d20plus.art.setLastImageUrl(url);
				d20.Campaign.characters.get(cId).set("avatar", url);
			}
		});

		$(`.handout-image-by-url`).live("click", function () {
			const hId = $(this).closest(`[data-handoutid]`).attr(`data-handoutid`);
			const url = window.prompt("Enter a URL", d20plus.art.getLastImageUrl());
			if (url) {
				d20plus.art.setLastImageUrl(url);
				d20.Campaign.handouts.get(hId).set("avatar", url);
			}
		});

		$(`.token-image-by-url`).live("click", function () {
			const cId = $(this).closest(`[data-characterid]`).attr(`data-characterid`);
			const url = window.prompt("Enter a URL", d20plus.art.getLastImageUrl());
			if (url) {
				d20plus.art.setLastImageUrl(url);
				const char = d20.Campaign.characters.get(cId);
				char._getLatestBlob("defaulttoken", (blob) => {
					blob = blob && blob.trim() ? JSON.parse(blob) : {};
					blob.imgsrc = url;
					char.updateBlobs({defaulttoken: JSON.stringify(blob)});
				});
			}
		});

		$(`.deck-image-by-url`).live("click", function () {
			const dId = $(this).attr("data-deck-id");
			const url = window.prompt("Enter a URL", d20plus.art.getLastImageUrl());
			if (url) {
				d20plus.art.setLastImageUrl(url);
				d20.Campaign.decks.get(dId).set("avatar", url)
			}
		});

		$(`.card-image-by-url`).live("click", function () {
			const cId = $(this).attr("data-card-id");
			const url = window.prompt("Enter a URL", d20plus.art.getLastImageUrl());
			if (url) {
				d20plus.art.setLastImageUrl(url);
				const card = d20.Campaign.decks.find(it => it.cards.find(c => c.id === cId)).cards.find(c => c.id === cId);
				card.set("avatar", url);
			}
		});

		$(`.deck-mass-cards-by-url`).live("click", function () {
			const dId = $(this).attr("data-deck-id");

			const deck = d20.Campaign.decks.get(dId);

			const cleanTemplate = d20plus.addArtMassAdderHTML.replace(/id="[^"]+"/gi, "");
			const $dialog = $(cleanTemplate).appendTo($("body"));
			const $iptTxt = $dialog.find(`textarea`);
			const $btnAdd = $dialog.find(`button`).click(() => {
				const lines = ($iptTxt.val() || "").split("\n");
				const toSaveAll = [];
				lines.filter(it => it && it.trim()).forEach(l => {
					const split = l.split("---").map(it => it.trim()).filter(Boolean);
					if (split.length >= 2) {
						const [name, url] = split;
						const toSave = deck.cards.push({
							avatar: url,
							id: d20plus.ut.generateRowId(),
							name,
							placement: 99
						});
						toSaveAll.push(toSave);
					}
				});
				$dialog.dialog("close");

				toSaveAll.forEach(s => s.save());
				deck.save();
			});

			$dialog.dialog({
				width: 800,
				height: 650
			});
		});
	};

	d20plus.art._lastImageUrl = "https://example.com/pic.png";
	d20plus.art.getLastImageUrl = () => {
		return d20plus.art._lastImageUrl;
	};
	d20plus.art.setLastImageUrl = (url) => {
		d20plus.art._lastImageUrl = url || d20plus.art._lastImageUrl;
	};

	// ART IMPORTER 2.0
	d20plus.art.initRepoBrowser = () => {
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
				return Object.values(index).filter(it => {
					if (search) {
						const searchVisible = it._set.toLowerCase().includes(search)
							|| it._artist.toLowerCase().includes(search)
							|| _searchFeatures(it);
						if (!searchVisible) return false;
					}
					return _filterProps(it);
				});
			}

			function applyFilterAndSearchToItem () {
				const cpy = MiscUtil.copy(currentItem);
				cpy.data = cpy.data.filter(it => {
					if (search) if (!_searchFeatures(it, true)) return false;
					return _filterProps(it);
				});
				return cpy;
			}

			$loadings.forEach($l => $l.remove());

			// SIDEBAR /////////////////////////////////////////////////////////////////////////////////////////
			const $sideHead = $(`<div class="split split--center p-2 artr__side__head"><div class="artr__side__head__title">Filters</div></div>`).appendTo($sidebar);
			// This functionality is contained in the filter buttons, but might need to be done here to improve performance in the future
			// $(`<button class="btn">Apply</button>`).click(() => {
			// 	if (currentItem) doRenderItem(applyFilterAndSearchToItem());
			// 	else doRenderIndex(applyFilterAndSearchToIndex())
			// }).appendTo($sideHead);

			const $sideBody = $(`<div class="artr__side__body"/>`).appendTo($sidebar);
			const addSidebarSection = prop => {
				const fullName = (() => {
					switch (prop) {
						case "imageType": return "Image Type";
						case "grid": return "Grid Type";
						case "monster": return "Monster Type";
						case "audience": return "Intended Audience";
						case "quality":
						case "view":
						case "style":
						case "terrain":
						case "setting":
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
				enums[prop].forEach(enm => {
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
			Object.keys(enums).forEach(k => addSidebarSection(k));

			// MAIN PAGE ///////////////////////////////////////////////////////////////////////////////////////
			const $mainHead = $(`<div class="split split--center p-2 artr__search"/>`).appendTo($mainPane);
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
				indexSlice.forEach(it => {
					const $item = $(`<div class="artr__item"/>`).appendTo($mainBodyInner).click(() => doLoadAndRenderItem(it));
					const $itemTop = $(`<div class="artr__item__top"><img class="artr__item__thumbnail" src="${GH_PATH}${it._key}--thumb-${it._sample}.jpg"></div>`).appendTo($item);
					const $itemBottom = $(`
						<div class="artr__item__bottom">
							<div class="artr__item__bottom__row" style="padding-bottom: 2px;" title="${it._set}">${it._set}</div>
							<div class="artr__item__bottom__row" style="padding-top: 2px;" title="${it._artist}"><i>By</i> ${it._artist}</div>
						</div>
					`).appendTo($item);
				});
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
				if (resetScroll) $itemBodyInner.scrollTop(0);
				const $itmUp = $(`<div class="artr__item artr__item--back"><div class="pictos">[</div></div>`)
					.click(() => doRenderIndex(applyFilterAndSearchToIndex()))
					.appendTo($itemBodyInner);
				file.data.sort((a, b) => SortUtil.ascSort(a.hash, b.hash)).forEach(it => {
					// "library-item" and "draggableresult" classes required for drag/drop
					const $item = $(`<div class="artr__item library-item draggableresult" data-fullsizeurl="${it.uri}"/>`)
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

			doRenderIndex(Object.values(index));
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

SCRIPT_EXTENSIONS.push(d20plusArt);
