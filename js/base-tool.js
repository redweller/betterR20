function baseTool() {
	d20plus.tool = {};

	d20plus.tool.tools = [
		{
			name: "Journal Cleaner",
			desc: "Quickly select and delete journal items, especially useful for cleaning up loose items after deleting a folder.",
			html: `
				<div id="d20plus-quickdelete" title="Journal Root Cleaner">
				<p>A list of characters and handouts in the journal folder root, which allows them to be quickly deleted.</p>
				<label style="font-weight: bold">Root Only <input type="checkbox" class="cb-deep" checked></label>
				<hr>
				<p style="display: flex; justify-content: space-between"><label><input type="checkbox" title="Select all" id="deletelist-selectall"> Select All</label> <a class="btn" href="#" id="quickdelete-btn-submit">Delete Selected</a></p>
				<div id="delete-list-container">
					<input class="search" autocomplete="off" placeholder="Search list..." style="width: 100%;">
					<br><br>
					<ul class="list deletelist" style="max-height: 420px; overflow-y: scroll; display: block; margin: 0;"></ul>
				</div>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-quickdelete").dialog({
					autoOpen: false,
					resizable: true,
					width: 800,
					height: 700,
				});
			},
			openFn: () => {
				const $win = $("#d20plus-quickdelete");
				$win.dialog("open");
				const $cbDeep = $win.find(`.cb-deep`);

				const $cbAll = $("#deletelist-selectall").unbind("click");

				const $btnDel = $(`#quickdelete-btn-submit`).off("click");

				$cbDeep.off("change").on("change", () => populateList());

				populateList();

				function populateList () {
					// collect a list of all journal items
					function getAllJournalItems () {
						const out = [];

						function recurse (entry, pos, isRoot) {
							if (entry.i) {
								if (!isRoot) pos.push(entry.n);
								entry.i.forEach(nxt => recurse(nxt, pos));
								pos.pop();
							} else out.push({id: entry, path: MiscUtil.copy(pos)});
						}

						const root = {i: d20plus.ut.getJournalFolderObj()};
						recurse(root, [], true);
						return out.map(it => getItemFromId(it.id, it.path.join(" / ")));
					}

					function getRootJournalItems () {
						const rootItems = [];
						const journal = d20plus.ut.getJournalFolderObj();
						journal.forEach(it => {
							if (it.i) return; // skip folders
							rootItems.push(getItemFromId(it));
						});
						return rootItems;
					}

					function getItemFromId (itId, path = "") {
						const handout = d20.Campaign.handouts.get(itId);
						if (handout && (handout.get("name") === CONFIG_HANDOUT || handout.get("name") === ART_HANDOUT)) return null; // skip 5etools handouts
						const character = d20.Campaign.characters.get(itId);
						if (handout) return {type: "handouts", id: itId, name: handout.get("name"), path: path};
						if (character) return {type: "characters", id: itId, name: character.get("name"), path: path};
					}

					function getJournalItems () {
						if ($cbDeep.prop("checked")) return getRootJournalItems().filter(it => it);
						else return getAllJournalItems().filter(it => it);
					}

					const journalItems = getJournalItems();

					const $delList = $win.find(`.list`);
					$delList.empty();

					journalItems.forEach((it, i) => {
						$delList.append(`
							<label class="import-cb-label" data-listid="${i}">
								<input type="checkbox">
								<span class="name readable">${it.path ? `${it.path} / ` : ""}${it.name}</span>
							</label>
						`);
					});

					// init list library
					const delList = new List("delete-list-container", {
						valueNames: ["name"],
						listClass: "deletelist"
					});

					$cbAll.prop("checked", false);
					$cbAll.off("click").click(() => d20plus.importer._importToggleSelectAll(delList, $cbAll));

					$btnDel.off("click").on("click", () => {
						const sel = delList.items
							.filter(it => $(it.elm).find(`input`).prop("checked"))
							.map(it => journalItems[$(it.elm).attr("data-listid")]);

						if (!sel.length) {
							alert("No items selected!");
						} else if (confirm(`Are you sure you want to delete the ${sel.length} selected item${sel.length > 1 ? "s" : ""}?`)) {
							$win.dialog("close");
							$("a.ui-tabs-anchor[href='#journal']").trigger("click");
							sel.forEach(toDel => {
								d20.Campaign[toDel.type].get(toDel.id).destroy();
							});
							$("#journalfolderroot").trigger("change");
						}
					});
				}
			}
		},
		{
			name: "SVG Draw",
			desc: "Paste SVG data as text to automatically draw the paths.",
			html: `
				<div id="d20plus-svgdraw" title="SVG Drawing Tool">
				<p>Paste SVG data as text to automatically draw any included &lt;path&gt;s. Draws to the current layer, in the top-left corner, with no scaling. Takes colour information from &quot;stroke&quot; attributes.</p>
				<p>Line width (px; default values are 1, 3, 5, 8, 14): <input name="stroke-width" placeholder="5" value="5" type="number"></p>
				<textarea rows="10" cols="100" placeholder="Paste SVG data here"></textarea>
				<br>
				<button class="btn">Draw</button>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-svgdraw").dialog({
					autoOpen: false,
					resizable: true,
					width: 800,
					height: 650,
				});
			},
			openFn: () => {
				// adapted from `d20.engine.finishCurrentPolygon`
				function addShape(path, pathStroke, strokeWidth) {
					let i = d20.engine.convertAbsolutePathStringtoFabric(path);
					i = _.extend(i, {
						strokeWidth: strokeWidth,
						fill: "transparent",
						stroke: pathStroke,
						path: JSON.parse(i.path)
					});
					d20.Campaign.activePage().addPath(i);
					d20.engine.debounced_renderTop();
				}

				const $win = $("#d20plus-svgdraw");
				$win.dialog("open");

				$win.find(`button`).off("click").on("click", () => {
					d20plus.ut.log("Drawing paths");
					const input = $win.find(`textarea`).val();
					const svg = $.parseXML(input);

					const toDraw = $(svg).find("path").map((i, e) => {
						const $e = $(e);
						return {stroke: $e.attr("stroke") || "black", d: $e.attr("d")}
					}).get();

					const strokeWidth = Math.max(1, Number($win.find(`input[name="stroke-width"]`).val()));

					toDraw.forEach(it => {
						addShape(it.d, it.stroke, strokeWidth)
					});
				});
			}
		},
		{
			name: "Multi-Whisper",
			desc: "Send whispers to multiple players ",
			html: `
				<div id="d20plus-whispers" title="Multi-Whisper Tool">
				<div>
					<button class="btn toggle-dc">Show Disconnected Players</button>
					<button class="btn send-all">Send All Messages</button>
					<button class="btn clear-all">Clear All Messages</button>
				</div>
				<hr>
				<div class="messages" style="max-height: 600px; overflow-y: auto; overflow-x: hidden; transform: translateZ(0)">
					<!-- populate with JS -->
				</div>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-whispers").dialog({
					autoOpen: false,
					resizable: true,
					width: 1000,
					height: 760,
				});
			},
			openFn: () => {
				$("a.ui-tabs-anchor[href='#textchat']").trigger("click");

				const $win = $("#d20plus-whispers");
				$win.dialog("open");

				const $btnToggleDc = $win.find(`.toggle-dc`).off("click").text("Show Disconnected Players");
				const $btnSendAll = $win.find(`.send-all`).off("click");
				const $btnClearAll = $win.find(`.clear-all`).off("click");

				const $pnlMessages = $win.find(`.messages`).empty();
				const players = d20.Campaign.players.toJSON();
				players.forEach((p, i) => {
					const $btnSend = $(`<button class="btn send" style="margin-right: 5px;">Send</button>`).on("click", function () {
						const $btn = $(this);
						const $wrp = $btn.closest(`.wrp-message`);
						const toMsg = $wrp.find(`input[data-player-id]:checked`).filter(":visible").map((ii, e) => $(e).attr("data-player-id")).get();
						const content = $wrp.find(`.message`).val().trim();
						toMsg.forEach(targetId => {
							d20.textchat.doChatInput(`/w ${d20.Campaign.players.get(targetId).get("displayname").split(" ")[0]} ${content}`);

							// This only posts to local player's chat, sadly
							// d20.textchat.incoming(
							// 	false,
							// 	{
							// 		avatar: `/users/avatar/${window.currentPlayer.get("d20userid")}/30`,
							// 		who: d20.textchat.$speakingas.find("option:first-child").text(),
							// 		type: "whisper",
							// 		content: content,
							// 		playerid: window.currentPlayer.id,
							// 		id: d20plus.ut.generateRowId(),
							// 		target: targetId,
							// 		target_name: d20.Campaign.players.get(targetId).get("displayname") || ""
							// 	}
							// );
						})
					});

					const $btnClear =  $(`<button class="btn msg-clear">Clear</button>`).on("click", function () {
						$(this).closest(`.wrp-message`).find(`.message`).val("");
					});

					$pnlMessages.append($(`
							<div ${p.online || `style="display: none;"`} data-online="${p.online}" class="wrp-message">
								<div>
									${players.map((pp, ii) => `<label style="margin-right: 10px; ${pp.online || ` display: none;`}" data-online="${pp.online}" class="display-inline-block">${pp.displayname} <input data-player-id="${pp.id}" type="checkbox" ${i === ii ? `checked="true"` : ""}></label>`).join("")}
								</div>
								<textarea style="display: block; width: 95%;" placeholder="Enter whisper" class="message"></textarea>
							</div>						
						`).append($btnSend).append($btnClear).append(`<hr>`));
				});

				$btnToggleDc.on("click", () => {
					$btnToggleDc.text($btnToggleDc.text().startsWith("Show") ? "Hide Disconnected Players" : "Show Disconnected Players");
					$pnlMessages.find(`[data-online="false"]`).toggle();
				});

				$btnSendAll.on("click", () => {
					$pnlMessages.find(`button.send`).click();
				});

				$btnClearAll.on("click", () => $pnlMessages.find(`button.msg-clear`).click());
			}
		},
		{
			name: "Table Importer",
			desc: "Import TableExport data",
			html: `
				<div id="d20plus-tables" title="Table Importer">
					<div>
					<button class="btn paste-clipboard">Paste from Clipboard</button> <i>Accepts <a href="https://app.roll20.net/forum/post/1144568/script-tableexport-a-script-for-exporting-and-importing-rollable-tables-between-accounts">TableExport</a> format.</i>
					</div>
					<br>
					<div id="table-list">
						<input type="search" class="search" placeholder="Search tables...">
						<div class="list" style="transform: translateZ(0); max-height: 490px; overflow-y: scroll; overflow-x: hidden;"><i>Loading...</i></div>
					</div>
				<br>
				<button class="btn start-import">Import</button>
				</div>
				
				<div id="d20plus-tables-clipboard" title="Paste from Clipboard"/>
				`,
			dialogFn: () => {
				$("#d20plus-tables").dialog({
					autoOpen: false,
					resizable: true,
					width: 650,
					height: 720,
				});
				$(`#d20plus-tables-clipboard`).dialog({
					autoOpen: false,
					resizable: true,
					width: 640,
					height: 480,
				});
			},
			openFn: () => {
				const $win = $("#d20plus-tables");
				$win.dialog("open");

				const $btnImport = $win.find(`.start-import`).off("click");
				const $btnClipboard = $win.find(`.paste-clipboard`).off("click");

				const url = `${BASE_SITE_URL}/data/roll20-tables.json`;
				DataUtil.loadJSON(url).then((data) => {
					function createTable (t) {
						const r20t = d20.Campaign.rollabletables.create({
							name: t.name.replace(/\s+/g, "-"),
							showplayers: t.isShown,
							id: d20plus.ut.generateRowId()
						});

						r20t.tableitems.reset(t.items.map(i => {
							const out = {
								id: d20plus.ut.generateRowId(),
								name: i.row
							};
							if (i.weight !== undefined) out.weight = i.weight;
							if (i.avatar) out.avatar = i.avatar;
							return out;
						}));
						r20t.tableitems.forEach(it => it.save());
					}

					// Allow pasting of custom tables
					$btnClipboard.on("click", () => {
						const $wrpClip = $(`#d20plus-tables-clipboard`);
						const $iptClip = $(`<textarea placeholder="Paste TableExport data here" style="display: block; width: 600px; height: 340px;"/>`).appendTo($wrpClip);
						const $btnCheck = $(`<button class="btn" style="margin-right: 5px;">Check if Valid</button>`).on("click", () => {
							let error = false;
							try {
								getFromPaste($iptClip.val());
							} catch (e) {
								console.error(e);
								window.alert(e.message);
								error = true;
							}
							if (!error) window.alert("Looking good!");
						}).appendTo($wrpClip);
						const $btnImport = $(`<button class="btn">Import</button>`).on("click", () => {
							$("a.ui-tabs-anchor[href='#deckstables']").trigger("click");
							const ts = getFromPaste($iptClip.val());
							ts.forEach(t => createTable(t));
							window.alert("Import complete");
						}).appendTo($wrpClip);

						$wrpClip.dialog("open");
					});

					function getFromPaste (paste) {
						const tables = [];
						let tbl = null;

						paste.split("\n").forEach(line => parseLine(line.trim()));
						parseLine(""); // ensure trailing newline
						return tables;

						function parseLine (line) {
							if (line.startsWith("!import-table-item")) {
								if (!tbl) {
									throw new Error("No !import-table statement found");
								}
								const [junk, tblName, row, weight, avatar] = line.split("--").map(it => it.trim());
								tbl.items.push({
									row,
									weight,
									avatar
								})
							} else if (line.startsWith("!import-table")) {
								if (tbl) {
									throw new Error("No blank line found between tables")
								}
								const [junk, tblName,showHide] = line.split("--").map(it => it.trim());
								tbl = {
									name: tblName,
									isShown: showHide.toLowerCase() === "show"
								};
								tbl.items = [];
							} else if (line.trim()) {
								throw new Error("Non-empty line which didn't match !import-table or !import-table-item")
							} else {
								if (tbl) {
									tables.push(tbl);
									tbl = null;
								}
							}
						}
					}

					// Official tables
					const $lst = $win.find(`.list`);
					const tables = data.table.sort((a, b) => SortUtil.ascSort(a.name, b.name));
					let tmp = "";
					tables.forEach((t, i) => {
						tmp += `
								<label class="import-cb-label" data-listid="${i}">
									<input type="checkbox">
									<span class="name col-10">${t.name}</span>
									<span title="${t.source ? Parser.sourceJsonToFull(t.source) : "Unknown Source"}" class="source">SRC[${t.source ? Parser.sourceJsonToAbv(t.source) : "UNK"}]</span>
								</label>
							`;
					});
					$lst.html(tmp);
					tmp = null;

					const tableList = new List("table-list", {
						valueNames: ["name", "source"]
					});

					$btnImport.on("click", () => {
						$("a.ui-tabs-anchor[href='#deckstables']").trigger("click");
						const sel = tableList.items
							.filter(it => $(it.elm).find(`input`).prop("checked"))
							.map(it => tables[$(it.elm).attr("data-listid")]);

						sel.forEach(t => createTable(t));
					});
				});
			}
		},
		{
			name: "Token Avatar URL Fixer",
			desc: "Change the root URL for tokens en-masse.",
			html: `
				<div id="d20plus-avatar-fixer" title="Avatar Fixer">
				<p><b>Warning:</b> this thing doesn't really work.</p>
				<p>Current URLs (view only): <select class="view-only"></select></p>
				<p><label>Replace:<br><input name="search" value="https://5etools.com/"></label></p>
				<p><label>With:<br><input name="replace" value="https://thegiddylimit.github.io/"></label></p>
				<p><button class="btn">Go!</button></p>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-avatar-fixer").dialog({
					autoOpen: false,
					resizable: true,
					width: 400,
					height: 400,
				});
			},
			openFn: () => {
				// FIXME this doesn't work, because it saves a nonsensical blob (imgsrc) instead of defaulttoken
				// see the working code in `initArtFromUrlButtons` for how this _should_ be done

				function replaceAll (str, search, replacement) {
					return str.split(search).join(replacement);
				}

				const $win = $("#d20plus-avatar-fixer");
				$win.dialog("open");

				const $selView = $win.find(`.view-only`);
				const toView = [];
				d20.Campaign.characters.toJSON().forEach(c => {
					if (c.avatar && c.avatar.trim()) {
						toView.push(c.avatar);
					}
				});
				toView.sort(SortUtil.ascSort).forEach(url => $selView.append(`<option disabled>${url}</option>`));

				const $btnGo = $win.find(`button`).off("click");
				$btnGo.on("click", () => {
					let count = 0;
					$("a.ui-tabs-anchor[href='#journal']").trigger("click");

					const search = $win.find(`[name="search"]`).val();
					const replace = $win.find(`[name="replace"]`).val();

					d20.Campaign.characters.toJSON().forEach(c => {
						const id = c.id;

						const realC = d20.Campaign.characters.get(id);

						const curr = realC.get("avatar");
						let toSave = false;
						if (curr.includes(search)) {
							count++;
							realC.set("avatar", replaceAll(curr, search, replace));
							toSave = true;
						}
						if (realC.get("defaulttoken")) {
							realC._getLatestBlob("defaulttoken", (bl) => {
								if (bl && bl.imgsrc && bl.imgsrc.includes(search)) {
									count++;
									realC.updateBlobs({imgsrc: replaceAll(bl.imgsrc, search, replace)});
									toSave = true;
								}
							});
						}
						if (toSave) {
							realC.save();
						}
					});
					window.alert(`Replaced ${count} item${count === 0 || count > 1 ? "s" : ""}.`)
				});
			}
		},
		{
			name: "Mass-Delete Pages",
			desc: "Quickly delete multiple pages.",
			html: `
				<div id="d20plus-mass-page-delete" title="Mass-Delete Pages">
					<div id="del-pages-list">
						<div class="list" style="transform: translateZ(0); max-height: 490px; overflow-y: scroll; overflow-x: hidden; margin-bottom: 10px;"><i>Loading...</i></div>
					</div>
					<hr>
					<p><label class="ib"><input type="checkbox" class="select-all"> Select All</label> | <button class="btn btn-danger deleter">Delete</button></p>
					<p><i>This tool will delete neither your active page, nor a page active for players.</i></p>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-mass-page-delete").dialog({
					autoOpen: false,
					resizable: true,
					width: 600,
					height: 800,
				});
			},
			openFn: () => {
				function deletePage (model, pageList) {
					if ($("#page-toolbar .availablepage[data-pageid=" + model.id + "]").remove()) {
						var n = d20.Campaign.getPageIndex(model.id);
						if (model.thegraphics) {
							model.thegraphics.massdelete = true;
							model.thegraphics.backboneFirebase.reference.set(null);
						}
						if (model.thetexts) {
							model.thetexts.massdelete = true;
							model.thetexts.backboneFirebase.reference.set(null);
						}
						if (model.thepaths) {
							model.thepaths.backboneFirebase.reference.set(null);
							model.thepaths.massdelete = true;
						}
						let i = d20.Campaign.get("playerspecificpages");
						let o = false;
						_.each(i, function(e, n) {
							if (e === model.id) {
								delete i[n];
								o = true;
							}
						});
						o && d20.Campaign.save({
							playerspecificpages: i
						});
						model.destroy();
						d20.Campaign.activePageIndex > n && (d20.Campaign.activePageIndex -= 1);

						pageList.remove("page-id", model.id);
					}
				}

				const $win = $("#d20plus-mass-page-delete");
				$win.dialog("open");

				const $lst = $win.find(`.list`).empty();

				d20.Campaign.pages.models.forEach(m => {
					$lst.append(`
							<label class="import-cb-label import-cb-label--img" data-listid="${m.id}">
								<input type="checkbox">
								<img class="import-label__img" src="${m.attributes.thumbnail}">
								<span class="name col-9">${m.attributes.name}</span>
								<span style="display: none;" class="page-id">${m.id}</span>
							</label>
						`);
				});

				const pageList = new List("del-pages-list", {
					valueNames: ["name", "page-id"]
				});

				const $cbAll = $win.find(`.select-all`).off("click").click(() => {
					pageList.items.forEach(it => {
						$(it.elm).find(`input[type="checkbox"]`).prop("checked", $cbAll.prop("checked"));
					});
				});

				const $btnDel = $win.find(`.deleter`).off("click").click(() => {
					const sel = pageList.items
						.filter(it => $(it.elm).find(`input`).prop("checked"))
						.map(it => $(it.elm).attr("data-listid"))
						.map(pId => d20.Campaign.pages.models.find(it => it.id === pId))
						.filter(it => it);

					sel.forEach(m => {
						if (m.id !== d20.Campaign.get("playerpageid") && m.id !== d20.Campaign.activePage().id) {
							deletePage(m, pageList);
						}
					});
					$cbAll.prop("checked", false);
				});
			}
		},
		{
			name: "Quantum Token Entangler",
			desc: "Connect tokens between pages, linking their positions.",
			html: `
				<div id="d20plus-token-entangle" title="Quantum Token Entangler">
					<p><i>Please note that this feature is highly experimental.
					<br>
					You can learn Token IDs by rightclicking a token -> "Advanced" -> "View Token ID."</i></p>
					<hr>
					<input id="token-entangle-id-1" placeholder="Master Token ID">
					<input id="token-entangle-id-2" placeholder="Slave Token ID">
					<br>
					<button class="btn btn-default" id="token-entangle-go">Entangle</button>
					<hr>
					<input id="token-clear-entangles" placeholder="Token ID to Clear">
					<button class="btn btn-default" id="token-entangle-clear">Clear Entangles</button>
				</div>
				`,
			dialogFn: () => {
				const $win = $("#d20plus-token-entangle");

				const entangleTracker = {};
				const SYNCABLE_ATTRS = [
					"rotation",
					"width",
					"height",
					"top",
					"left",
					"scaleX",
					"scaleY",
					"fliph",
					"flipv"
				];

				$win.data("VE_DO_ENTANGLE", (master) => {
					// prevent double-binding
					if (entangleTracker[master.id]) return;

					master.on("change", (it) => {
						if (master.attributes.entangled && master.attributes.entangled.length) {
							if (SYNCABLE_ATTRS.filter(attr => it.changed !== undefined).length) {
								let anyUpdates = false;

								master.attributes.entangled = master.attributes.entangled.filter(id => {
									const slave = d20plus.ut.getTokenFromId(id);
									if (slave) {
										SYNCABLE_ATTRS.forEach(attr => slave.attributes[attr] = master.attributes[attr]);
										slave.save();
										return true;
									} else {
										console.warn(`Cound not find entangled token with ID "${id}", removing...`);
										anyUpdates = true;
									}
								});

								if (anyUpdates) master.save();
							}
						}
					})
				});

				// do initial entangles
				const runInitial = () => {
					const pages = d20.Campaign.pages;
					if (pages && pages.models) {
						console.log("Initial existing entangles...");
						d20.Campaign.pages.models
							.filter(model => model.thegraphics && model.thegraphics.models)
							.forEach(model => model.thegraphics.models.filter(it => it.attributes.entangled && it.attributes.entangled.length)
							.forEach(it => {
								$win.data("VE_DO_ENTANGLE")(it);
							}));
					} else {
						console.log("Pages uninitialised, waiting...");
						setTimeout(runInitial, 1000);
					}
				};

				runInitial();

				$win.dialog({
					autoOpen: false,
					resizable: true,
					width: 300,
					height: 400,
				});
			},
			openFn: () => {
				const notFound = (id) => alert(`Token with ID ${id} didn't exist!`);

				const $win = $("#d20plus-token-entangle");
				$win.dialog("open");

				const $ipt1 = $(`#token-entangle-id-1`);
				const $ipt2 = $(`#token-entangle-id-2`);

				const $btnGo = $(`#token-entangle-go`)
					.off("click")
					.click(() => {
						const tkId1 = $ipt1.val();
						const tkId2 = $ipt2.val();
						const checkExisting = (a, b) => {
							if (a.attributes.entangled && a.attributes.entangled.includes(b.id)) return `"${a.id}" is already entangled to "${b.id}"!`;
							else if (b.attributes.entangled && b.attributes.entangled.includes(a.id)) return `"${b.id}" is already entangled to "${a.id}"!`;
							else return false;
						};

						const token1 = d20plus.ut.getTokenFromId(tkId1);
						const token2 = d20plus.ut.getTokenFromId(tkId2);

						if (!token1) return notFound(tkId1);
						if (!token2) return notFound(tkId2);

						const existing = checkExisting(token1, token2);
						if (existing) return alert(existing);

						(token1.attributes.entangled = token1.attributes.entangled || []).push(tkId2);
						token1.save();
						(token2.attributes.entangled = token2.attributes.entangled || []).push(tkId1);
						token2.save();

						$win.data("VE_DO_ENTANGLE")(token1);
						$win.data("VE_DO_ENTANGLE")(token2);
						alert("Tokens entangled!");
					});

				const $iptClear = $(`#token-clear-entangles`);

				const $btnClear = $(`#token-entangle-clear`)
					.off("click")
					.click(() => {
						const tkId = $iptClear.val();
						const token = d20plus.ut.getTokenFromId(tkId);
						if (!token) return notFound(tkId);

						const count = token.attributes.entangled ? token.attributes.entangled.length : 0;
						(token.attributes.entangled || []).forEach(eId => {
							const ent = d20plus.ut.getTokenFromId(eId);
							if (ent && ent.attributes.entangled && ent.attributes.entangled.includes(tkId)) {
								ent.attributes.entangled.splice(ent.attributes.entangled.indexOf(tkId), 1);
								ent.save();
							}
						});
						token.attributes.entangled = [];
						token.save();
						alert(`${count} entangle${count === 1 ? "" : "s"} cleared.`);
					});
			}
		},
		{
			toolId: "MODULES",
			name: "Module Importer/Exporter",
			desc: "Import Full Games (Modules), or Import/Export Custom Games",
			html: `
				<div id="d20plus-module-importer" title="Module Importer/Exporter">
				<p style="margin-bottom: 4px;"><b style="font-size: 110%;">Exporter: </b> <button class="btn" name="export">Export Game to File</button> <i>The exported file can later be used with the "Upload File" option, below.</i></p>
				<hr style="margin: 4px;">
				<p style="margin-bottom: 4px;">
					<b style="font-size: 110%;">Importer:</b>
					<button class="btn readme" style="float: right;">Help/README</button>
					<div style="clear: both;"></div>
				</p>
				<div style="border-bottom: 1px solid #ccc; margin-bottom: 3px; padding-bottom: 3px;">
					<button class="btn" name="load-Vetools">Load from 5etools</button>
					<button class="btn" name="load-file">Upload File</button>
				</div>
				<div>
					<div name="data-loading-message"></div>
					<select name="data-type" disabled style="margin-bottom: 0;">
						<option value="characters">Characters</option>
						<option value="decks">Decks</option>
						<option value="handouts">Handouts</option>
						<option value="maps">Maps</option>
						<option value="rolltables">Rollable Tables</option>
					</select>
					<button class="btn" name="view-select-entrues">View/Select Entries</button>
					<div name="selection-summary" style="margin-top: 5px;"></div>
				</div>
				<hr>
				<p><button class="btn" style="float: right;" name="import">Import Selected</button></p>
				</div>
				
				<div id="d20plus-module-importer-list" title="Select Entries">					
					<div id="module-importer-list">
						<input type="search" class="search" placeholder="Search..." disabled>
						<div class="list" style="transform: translateZ(0); max-height: 650px; overflow-y: auto; overflow-x: hidden; margin-bottom: 10px;">
						<i>Load a file to view the contents here</i>
						</div>
					</div>
					<div>
						<label class="ib"><input type="checkbox" class="select-all"> Select All</label>
						<button class="btn" style="float: right;" name="confirm-selection">Confirm Selection</button>
					</div>
				</div>
				
				<div id="d20plus-module-importer-progress" title="Import Progress">					
					<h3 class="name"></h3>
					<span class="remaining"></span> 
					<p>Errors: <span class="errors">0</span> <span class="error-names"></span></p>
					<p><button class="btn cancel">Cancel</button></p>
				</div>
				
				<div id="d20plus-module-importer-help" title="Readme">
					<p>First, either load a module from 5etools, or upload one from a file. Then, choose the category you wish to import, and "View/Select Entries." Once you've selected everything you wish to import from the module, hit "Import Selected." This ensures entries are imported in the correct order.</p>
					<p><b>Note:</b> The script-wide configurable "rest time" options affect how quickly each category of entries is imported (tables and decks use the "Handout" rest time).</p>
					<p><b>Note:</b> Configuration options (aside from "rest time" as detailed above) <i>do not</i> affect the module importer. It effectively "clones" the content as-exported from the original module, including any whisper/advantage/etc settings.</p>
				</div>
				
				<div id="d20plus-module-importer-5etools" title="Select Module">
					<div id="module-importer-list-5etools">
						<input type="search" class="search" placeholder="Search modules...">
						<div class="list" style="transform: translateZ(0); max-height: 480px; overflow-y: auto; overflow-x: hidden; margin-bottom: 10px;">
						<i>Loading...</i>
						</div>
					</div>
					<p><button class="btn load">Load Module Data</button></p>
				</div>
				
				<div id="d20plus-module-importer-select-exports-p1" title="Select Categories to Export">
					<div>
						<label>Characters <input type="checkbox" class="float-right" name="cb-characters"></label>
						<label>Decks <input type="checkbox" class="float-right" name="cb-decks"></label>
						<label>Handouts <input type="checkbox" class="float-right" name="cb-handouts"></label>
						<label>Maps <input type="checkbox" class="float-right" name="cb-maps"></label>
						<label>Rollable Tables <input type="checkbox" class="float-right" name="cb-rolltables"></label>
					</div>
					<div class="clear" style="width: 100%; border-bottom: #ccc solid 1px;"></div>
					<p style="margin-top: 5px;"><label>Select All <input type="checkbox" class="float-right" name="cb-all"></label></p>
					<p><button class="btn">Export</button></p>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-module-importer").dialog({
					autoOpen: false,
					resizable: true,
					width: 750,
					height: 360,
				});
				$(`#d20plus-module-importer-progress`).dialog({
					autoOpen: false,
					resizable: false
				});
				$("#d20plus-module-importer-5etools").dialog({
					autoOpen: false,
					resizable: true,
					width: 800,
					height: 600,
				});
				$("#d20plus-module-importer-help").dialog({
					autoOpen: false,
					resizable: true,
					width: 600,
					height: 400,
				});
				$("#d20plus-module-importer-select-exports-p1").dialog({
					autoOpen: false,
					resizable: true,
					width: 400,
					height: 260,
				});
				$("#d20plus-module-importer-list").dialog({
					autoOpen: false,
					resizable: true,
					width: 600,
					height: 800,
				});
			},
			openFn: () => {
				const DISPLAY_NAMES = {
					maps: "Maps",
					rolltables: "Rollable Tables",
					decks: "Decks",
					handouts: "Handouts",
					characters: "Characters",
				}

				const $win = $("#d20plus-module-importer");
				$win.dialog("open");

				const $winProgress = $(`#d20plus-module-importer-progress`);
				const $btnCancel = $winProgress.find(".cancel").off("click");

				const $win5etools = $(`#d20plus-module-importer-5etools`);

				const $winHelp = $(`#d20plus-module-importer-help`);
				const $btnHelp = $win.find(`.readme`).off("click").click(() => $winHelp.dialog("open"));

				const $winList = $(`#d20plus-module-importer-list`);
				const $wrpLst = $(`#module-importer-list`);
				const $lst = $winList.find(`.list`).empty();
				const $cbAll = $winList.find(`.select-all`).off("click").prop("disabled", true);
				const $iptSearch = $winList.find(`.search`).prop("disabled", true);
				const $btnConfirmSel = $winList.find(`[name="confirm-selection"]`).off("click");

				const $wrpSummary = $win.find(`[name="selection-summary"]`);
				const $wrpDataLoadingMessage = $win.find(`[name="data-loading-message"]`);

				const $btnImport = $win.find(`[name="import"]`).off("click").prop("disabled", true);
				const $btnViewCat = $win.find(`[name="view-select-entrues"]`).off("click").prop("disabled", true);

				const $selDataType = $win.find(`[name="data-type"]`).prop("disabled", true);
				let lastDataType = $selDataType.val();
				let genericFolder;
				let lastLoadedData = null;

				const getFreshSelected = () => ({
					characters: [],
					decks: [],
					handouts: [],
					maps: [],
					rolltables: []
				})

				let selected = getFreshSelected();

				function handleLoadedData (data) {
					lastLoadedData = data;
					selected = getFreshSelected();
					$selDataType.prop("disabled", false);

					$btnViewCat.prop("disabled", false);
					$btnViewCat.off("click").click(() => {
						$winList.dialog("open");
						$iptSearch.prop("disabled", false);

						let prop = "";
						switch (lastDataType) {
							case "maps": {
								prop = "maps";
								break;
							}
							case "rolltables": {
								prop = "rolltables";
								break;
							}
							case "decks": {
								prop = "decks";
								break;
							}
							case "handouts": {
								prop = "handouts";
								genericFolder = d20plus.importer.makeDirTree(`Handouts`);
								break;
							}
							case "characters": {
								prop = "characters";
								genericFolder = d20plus.importer.makeDirTree(`Characters`);
								break;
							}
							default: throw new Error(`Unhandled data type: ${lastDataType}`);
						}

						const moduleData = data[prop];
						data[prop].sort((a, b) => SortUtil.ascSortLower(a.attributes.name || "", b.attributes.name || ""));

						$lst.empty();
						moduleData.forEach((m, i) => {
							const img = lastDataType === "maps" ? m.attributes.thumbnail :
								(lastDataType === "characters" || lastDataType === "handouts" || lastDataType === "decks") ? m.attributes.avatar : "";

							$lst.append(`
									<label class="import-cb-label ${img ? `import-cb-label--img` : ""}" data-listid="${i}">
										<input type="checkbox">
										${img && img.trim() ? `<img class="import-label__img" src="${img}">` : ""}
										<span class="name col-9 readable">${m.attributes.name}</span>
									</label>
								`);
						});

						const entryList = new List("module-importer-list", {
							valueNames: ["name"]
						});

						$cbAll.prop("disabled", false).off("click").click(() => {
							entryList.items.forEach(it => {
								$(it.elm).find(`input[type="checkbox"]`).prop("checked", $cbAll.prop("checked"));
							});
						});

						$btnConfirmSel.off("click").click(() => {
							const sel = entryList.items
								.filter(it => $(it.elm).find(`input`).prop("checked"))
								.map(it => moduleData[$(it.elm).attr("data-listid")]);

							if (!sel.length) return alert("No entries selected!");

							$cbAll.prop("checked", false);
							$winList.dialog("close");
							selected[prop] = sel;
							$wrpSummary.text(Object.entries(selected).filter(([prop, ents]) => ents.length).map(([prop, ents]) => `${DISPLAY_NAMES[prop]}: ${ents.length} selected`).join("; "));
						});
					});

					$btnImport.prop("disabled", false).off("click").click(() => {
						const totalSelected = Object.values(selected).map(it => it.length).reduce((a, b) => a + b, 0);
						if (!totalSelected) return alert("No entries selected!");

						const $name = $winProgress.find(`.name`);
						const $remain = $winProgress.find(`.remaining`).text(`${totalSelected} remaining...`);
						const $errCount = $winProgress.find(`.errors`);
						const $errReasons = $winProgress.find(`.error-names`);
						let errCount = 0;

						$winProgress.dialog("open");

						const journal = data.journal ? MiscUtil.copy(data.journal).reverse() : null;

						let queue = [];
						Object.entries(selected).filter(([k, v]) => v.length).forEach(([prop, ents]) => {
							ents = MiscUtil.copy(ents);

							// if importing journal items, make sure they get put back in the right order
							if (journal && (prop === "characters" || prop === "handouts")) {
								const nuQueue = [];

								journal.forEach(jIt => {
									const qIx = ents.findIndex(qIt => qIt.attributes.id === jIt.id);
									if (~qIx) nuQueue.push(ents.splice(qIx, 1)[0]);
								});
								ents.forEach(qIt => nuQueue.push(qIt)); // add anything that wasn't in the journal to the end of the queue
								ents = nuQueue;
							}

							const toAdd = ents.map(entry => ({entry, prop}));
							// do maps first
							if (prop === "maps") queue = toAdd.concat(queue);
							else queue = queue.concat(toAdd);
						});

						selected = getFreshSelected();
						$wrpSummary.text("");

						let isCancelled = false;
						let lastTimeout = null;
						$btnCancel.off("click").click(() => {
							isCancelled = true;
							if (lastTimeout != null) {
								clearTimeout(lastTimeout);
								doImport();
							}
						});
						const mapTimeout = d20plus.cfg.get("import", "importIntervalMap") || d20plus.cfg.getDefault("import", "importIntervalMap");
						const charTimeout = d20plus.cfg.get("import", "importIntervalCharacter") || d20plus.cfg.getDefault("import", "importIntervalCharacter");
						const handoutTimeout = d20plus.cfg.get("import", "importIntervalHandout") || d20plus.cfg.getDefault("import", "importIntervalHandout");
						const timeouts = {
							characters: charTimeout,
							decks: handoutTimeout,
							handouts: handoutTimeout,
							maps: mapTimeout,
							rolltables: handoutTimeout
						}

						const addToJournal = (originalId, itId) => {
							let handled = false;
							if (journal) {
								const found = journal.find(it => it.id === originalId);
								if (found) {
									const rawPath = found.path;
									const cleanPath = rawPath.slice(1); // paths start with "Root"
									const folder = d20plus.importer.makeDirTree(...cleanPath);
									d20.journal.addItemToFolderStructure(itId, folder.id);
									handled = true;
								}
							}

							if (!handled) d20.journal.addItemToFolderStructure(itId, genericFolder.id);
						};

						const doImport = () => {
							if (isCancelled) {
								$name.text("Import cancelled.");
								$remain.text(`Cancelled with ${queue.length} remaining.`);
							} else if (queue.length && !isCancelled) {
								$remain.text(`${queue.length} remaining...`);
								const {entry, prop} = queue.shift();
								const timeout = timeouts[prop];
								const name = entry.attributes.name;
								try {
									$name.text(`Importing ${name}`);

									switch (prop) {
										case "maps": {
											const map = d20.Campaign.pages.create(entry.attributes);
											entry.graphics.forEach(it => map.thegraphics.create(it));
											entry.paths.forEach(it => map.thepaths.create(it));
											entry.text.forEach(it => map.thetexts.create(it));
											map.save();
											break;
										}
										case "rolltables": {
											const table = d20.Campaign.rollabletables.create(entry.attributes);
											table.tableitems.reset();
											const toSave = entry.tableitems.map(it => table.tableitems.push(it));
											toSave.forEach(s => s.save());
											table.save();
											break;
										}
										case "decks": {
											const deck = d20.Campaign.decks.create(entry.attributes);
											deck.cards.reset();
											const toSave = entry.cards.map(it => deck.cards.push(it));
											toSave.forEach(s => s.save());
											deck.save();
											break;
										}
										case "handouts": {
											d20.Campaign.handouts.create(entry.attributes,
												{
													success: function (handout) {
														handout.updateBlobs({
															notes: entry.blobNotes,
															gmnotes: entry.blobGmNotes
														});

														addToJournal(entry.attributes.id, handout.id);
													}
												}
											);
											break;
										}
										case "characters": {
											d20.Campaign.characters.create(entry.attributes,
												{
													success: function (character) {
														character.attribs.reset();
														const toSave = entry.attribs.map(a => character.attribs.push(a));
														toSave.forEach(s => s.syncedSave());

														character.abilities.reset();
														if (entry.abilities) entry.abilities.map(a => character.abilities.push(a)).forEach(s => s.save());

														character.updateBlobs({
															bio: entry.blobBio,
															gmnotes: entry.blobGmNotes,
															defaulttoken: entry.blobDefaultToken
														});

														addToJournal(entry.attributes.id, character.id);
													}
												}
											);
											break;
										}
										default: throw new Error(`Unhandled data type: ${prop}`);
									}
								} catch (e) {
									console.error(e);

									errCount++;
									$errCount.text(errCount);
									const prevReasons = $errReasons.text().trim();
									$errReasons.append(`${prevReasons.length ? ", " : ""}${name}: "${e.message}"`)
								}

								// queue up the next import
								lastTimeout = setTimeout(doImport, timeout);
							} else {
								$name.text("Import complete!");
								$remain.text(`${queue.length} remaining.`);
							}
						};

						doImport();
					});
				}

				$selDataType.off("change").on("change", () => {
					lastDataType = $selDataType.val();
				});

				const $btnLoadVetools = $win.find(`[name="load-Vetools"]`);
				$btnLoadVetools.off("click").click(() => {
					$win5etools.dialog("open");
					const $btnLoad = $win5etools.find(`.load`).off("click");

					DataUtil.loadJSON(`${DATA_URL}roll20-module/roll20-module-index.json`).then(data => {
						const $lst = $win5etools.find(`.list`);
						const modules = data.map.sort((a, b) => SortUtil.ascSortLower(a.name, b.name));
						let tmp = "";
						modules.forEach((t, i) => {
							tmp += `
								<label class="import-cb-label" data-listid="${i}">
									<input type="radio" name="map-5etools">
									<span class="name col-7 readable">${t.name}</span>
									<span class="name col-3 readable" style="text-align: right;">${d20plus.ut.getReadableFileSizeString(t.size)}</span>
									<span title="${Parser.sourceJsonToFull(t.id)}" class="source readable" style="text-align: right;">SRC[${Parser.sourceJsonToAbv(t.id)}]</span>
								</label>
							`;
						});
						$lst.html(tmp);
						tmp = null;

						const list5etools = new List("module-importer-list-5etools", {
							valueNames: ["name"]
						});

						$btnLoad.on("click", () => {
							const sel = list5etools.items
								.filter(it => $(it.elm).find(`input`).prop("checked"))
								.map(it => modules[$(it.elm).attr("data-listid")])[0];

							$win5etools.dialog("close");
							$win.dialog("open");
							$wrpDataLoadingMessage.html("<i>Loading...</i>");
							DataUtil.loadJSON(`${DATA_URL}roll20-module/roll20-module-${sel.id.toLowerCase()}.json`)
								.then(moduleFile => {
									$wrpDataLoadingMessage.html("");
									return handleLoadedData(moduleFile);
								})
								.catch(e => {
									$wrpDataLoadingMessage.html("");
									console.error(e);
									alert(`Failed to load data! See the console for more information.`);
								});
						});
					}).catch(e => {
						console.error(e);
						alert(`Failed to load data! See the console for more information.`);
					});
				});

				const $btnLoadFile = $win.find(`[name="load-file"]`);
				$btnLoadFile.off("click").click(() => {
					DataUtil.userUpload((data) => handleLoadedData(data));
				});

				const $winExportP1 = $("#d20plus-module-importer-select-exports-p1");
				const $cbAllExport = $winExportP1.find(`[name="cb-all"]`);

				const $btnExport = $win.find(`[name="export"]`);
				$btnExport.off("click").click(() => {
					const CATS = [
						"characters",
						"decks",
						"handouts",
						"maps",
						"rolltables",
					];

					$winExportP1.dialog("open");

					$cbAllExport.off("change").on("change", () => {
						CATS.forEach(cat => $winExportP1.find(`input[name="cb-${cat}"]`).prop("checked", $cbAllExport.prop("checked")))
					});

					$winExportP1.find("button").off("click").click(() => {
						const isCatSelected = (name) => $winExportP1.find(`input[name="cb-${name}"]`).prop("checked");

						const catsToExport = new Set(CATS.filter(it => isCatSelected(it)));

						console.log("Exporting journal...");
						const journal = d20plus.importer.getExportableJournal();

						let maps;
						if (catsToExport.has("maps")) {
							console.log("Exporting maps...");
							maps = d20.Campaign.pages.models.map(map => ({ // shoutouts to Stormy
								attributes: map.attributes,
								graphics: (map.thegraphics || []).map(g => g.attributes),
								text: (map.thetexts || []).map(t => t.attributes),
								paths: (map.thepaths || []).map(p => p.attributes)
							}));
						}

						let rolltables;
						if (catsToExport.has("rolltables")) {
							console.log("Exporting rolltables...");
							rolltables = d20.Campaign.rollabletables.models.map(rolltable => ({
								attributes: rolltable.attributes,
								tableitems: (rolltable.tableitems.models || []).map(tableitem => tableitem.attributes)
							}));
						}

						let decks;
						if (catsToExport.has("decks")) {
							console.log("Exporting decks...");
							decks = d20.Campaign.decks.models.map(deck => {
								if (deck.name && deck.name.toLowerCase() === "playing cards") return;
								return {
									attributes: deck.attributes,
									cards: (deck.cards.models || []).map(card => card.attributes)
								};
							}).filter(it => it);
						}

						let blobCount = 0;
						let onBlobsReady = null;
						let anyBlobs = false;

						const handleBlob = (addTo, asKey, data) => {
							addTo[asKey] = data;
							blobCount--;
							if (onBlobsReady && blobCount === 0) onBlobsReady();
						};

						let characters;
						if (catsToExport.has("characters")) {
							anyBlobs = true;
							console.log("Exporting characters...");
							characters = d20.Campaign.characters.models.map(character => {
								const out = {
									attributes: character.attributes,
									attribs: character.attribs,
								};
								const abilities = (character.abilities || {models: []}).models.map(ability => ability.attributes);
								if (abilities && abilities.length) out.abilities = abilities;
								blobCount += 3;
								character._getLatestBlob("bio", (data) => handleBlob(out, "blobBio", data));
								character._getLatestBlob("gmnotes", (data) => handleBlob(out, "blobGmNotes", data));
								character._getLatestBlob("defaulttoken", (data) => handleBlob(out, "blobDefaultToken", data));
								return out;
							});
						}

						let handouts;
						if (catsToExport.has("handouts")) {
							anyBlobs = true;
							console.log("Exporting handouts...");
							handouts = d20.Campaign.handouts.models.map(handout => {
								if (handout.attributes.name === ART_HANDOUT || handout.attributes.name === CONFIG_HANDOUT) return;

								const out = {
									attributes: handout.attributes
								};
								blobCount += 2;
								handout._getLatestBlob("notes", (data) => handleBlob(out, "blobNotes", data));
								handout._getLatestBlob("gmnotes", (data) => handleBlob(out, "blobGmNotes", data));
								return out;
							}).filter(it => it);
						}

						if (anyBlobs) console.log("Waiting for blobs...");
						onBlobsReady = () => {
							if (anyBlobs) console.log("Blobs are ready!");

							console.log("Preparing payload");

							const payload = {
								schema_version: 1, // version number from r20es
							};
							if (maps) payload.maps = maps;
							if (rolltables) payload.rolltables = rolltables;
							if (decks) payload.decks = decks;
							if (journal) payload.journal = journal;
							if (handouts) payload.handouts = handouts;
							if (characters) payload.characters = characters;

							const filename = document.title.replace(/\|\s*Roll20$/i, "").trim().replace(/[^\w\-]/g, "_");
							const data = JSON.stringify(payload, null, "\t");

							console.log("Saving");
							const blob = new Blob([data], {type: "application/json"});
							d20plus.ut.saveAs(blob, `${filename}.json`);
						};
						if (!anyBlobs) onBlobsReady();
					});


					// TODO
					/*
					macro
					jukebox track
					 */
				});
			}
		}
	];

	d20plus.tool.get = (toolId) => {
		return d20plus.tool.tools.find(it => it.toolId === toolId);
	};

	d20plus.tool.addTools = () => {
		const $body = $(`body`);
		const $tools = $(`#d20-tools-list`);
		const $toolsList = $tools.find(`.tools-list`);
		d20plus.tool.tools.sort((a, b) => SortUtil.ascSortLower(a.name || "", b.name || "")).forEach(t => {
			$body.append(t.html); // add HTML
			try {
				t.dialogFn(); // init window
				// add tool row
				const $wrp = $(`<div class="tool-row"/>`);
				$wrp.append(`<span style="width: 20%; padding: 4px;">${t.name}</span>`);
				$wrp.append(`<span style="width: calc(60% - 8px); padding: 4px;">${t.desc}</span>`);
				$(`<a style="width: 15%;" class="btn" href="#">Open</a>`).on(mousedowntype, () => {
					t.openFn.bind(t)();
					$tools.dialog("close");
				}).appendTo($wrp);
				$toolsList.append($wrp);
			} catch (e) {
				console.error(`Failed to initialise tool "${t.name}"`);
				setTimeout(() => {
					throw e;
				}, 1);
			}
		});

		$tools.dialog({
			autoOpen: false,
			resizable: true,
			width: 800,
			height: 650,
		});
		$(`#button-view-tools`).on(mousedowntype, () => {
			$tools.dialog("open");
		});
	};
}

SCRIPT_EXTENSIONS.push(baseTool);
