(() => {
	const tag = "?roll20_token_size=";
	const stag = "?roll20_skip_token=";
	d20plus.html.tokenImageEditor = `
	<div class="dialog largedialog edittokenimages">
		<h4 class="edittitle">Token name</h4>
		<span class="editlabel">
			Currently this token is represented by a single image. Add more images to convert it to multi-sided token
		</span>
		<div class="tokenlist"></div>
		<hr>
		<button class="addimageurl btn" style="float: right;margin-left:5px;">Add From URL...</button>
		<h4>Images</h4>
		You can drop a file or a character below
		<div class="clear" style="height: 7px;"></div>
		<table class="table table-striped tokenimagelist"><tbody>
		</tbody></table>
		<style>
			.tokenimage img {
				max-width: 70px;
				max-height: 70px;
			}
			.tokenimage select {
				width: 100px;
				margin-right: 10px;
			}
			.tokenimage input {
				width: 25px;
			}
			.tokenimage input.face {
				margin: 30px 0px 0px 5px;
				width: unset;
			}
			.tokenimage input.face:indeterminate {
				opacity: 0.8;
				filter: grayscale(0.7);
			}
			.tokenimage .btn {
				font-family: pictos;
				margin-top: 26px;
			}
			.tokenimage .dropbox {
				height: 70px;
				width: 70px;
				padding: 0px;
				box-sizing: content-box;
			}
			.tokenimage .inner {
				display: inline-block;
				vertical-align: middle;
				line-height: 67px;
			}
			.tokenimage .remove {
				background: none;
			}
			.tokenimage .remove span {
				line-height: initial;
				display: inline-block;
				font-weight: bold;
				background: white;
				vertical-align: bottom;
			}
			.tokenimage .dropbox.filled {
				border: 4px solid transparent;
			}
			.ui-dropping .dropbox.filled {
				border: 4px dashed #d1d1d1;
			}
			.tokenimagelist .ui-dropping .tokenimage {
				background: rgba(155, 155, 155, 0.5);
			}
			.tokenimagelist .ui-dropping .dropbox {
				background: gray;
				border: 4px dashed rgba(155, 155, 155, 0.5);
			}
			.tokenimage .ui-droppable.drop-highlight {
				border: 4px dashed;
			}
			.tokenimage.lastone .face,
			.tokenimage.lastone .skippable,
			.tokenimage.lastone .btn.delete {
				display: none;
			}
			.tokenimage .custom {
				visibility: hidden;
			}
			.tokenimage .custom.set {
				visibility: visible;
			}
			.tokenimage input.toskip {
				margin: 0px;
				width: unset;
			}
			.tokenimage .skippable {
				display: block;
				margin: 0px;
			}
			.tokenimagelist .tokenimage:not(.lastone).skipped td {
				background-color: rgba(155, 0, 0, 0.1);
			}
			.tokenlist {
				position: sticky;
				top: -11px;
				padding: 5px 0px;
				background: inherit;
				z-index: 1;
				overflow-x: auto;
				white-space: nowrap;
			}
			.tokenlist .tokenbox {
				display: inline-block;
				position: relative;
				border: 4px solid transparent;
				width: 60px;
				height: 60px;
				cursor: pointer;
				vertical-align: bottom;
			}
			.tokenlist .tokenbox img {
				max-width: 60px;
				max-height: 60px;
			}
			.tokenlist .tokenbox .inner {
				text-align: center;
			}
			.tokenbox .name {
				display: none;
				position: absolute;
				bottom: 0px;
				background-color: rgba(155, 155, 155, 0.7);
				padding: 3px;
				text-overflow: ellipsis;
				overflow: hidden;
				white-space: nowrap;
				box-sizing: border-box;
				color: white;
				width: 100%;
			}
			.tokenbox:hover .name {
				display: block;
			}
			.tokenbox.selected {
				border: 4px solid gray;
			}
		</style>
	</div>
	`;

	
	const selection = d20.engine.selected().filter(t => t.type === "image");
	if (!selection.length) return;
	const images = [];
	const added = [];
	const $dialog = $(d20plus.html.tokenImageEditor);
	const $list = $dialog.find(".tokenimagelist tbody");
	const $tokenList = $dialog.find(".tokenlist");
	const sizes = [["tiny", "0.5"], ["small", "1.0"], ["medium", "1"], ["large", "2"], ["huge", "3"], ["gargantuan", "4"], ["colossal", "5"], ["custom", "0"]];
	const findStandardSize = (w, h) => {
		return (w === h && sizes.find(s => s[1] === `${w / 70}`)?.last()) || "0";
	}
	const addImageOnInit = (img, add) => {
		const sizeChanged = img.w !== images.last()?.w || img.h !== images.last()?.h;
		if (images.length && sizeChanged) $list.variedSizes = true;
		images.push(img);
		added.push(add || img.url);
	}
	selection.forEach(t => {
		const sides = t.model.attributes.sides?.split("|");
		const token = t.model.attributes.imgsrc;
		const {width: tw, height: th} = t.model.attributes;
		if (sides.length > 1) {
			const curSide = sides[t.model.attributes.currentSide] || token;
			sides.forEach((s, k) => {
				const checked = unescape(s);
				const listed = added.indexOf(checked);
				const [url, size] = checked.split(tag);
				const [sw, sh] = (size || "").split("x");
				const image = {
					url: url.replaceAll(stag, ""),
					skip: url.includes(stag),
					face: unescape(curSide).includes(url),
					w: tw,
					h: th,
				};
				if (listed !== -1) {
					if (k === t.model.attributes.currentSide) images[listed].face = true;
					return;
				} else if (!isNaN(size)) {
					Object.merge(image, {size, w: size * 70, h: size * 70});
				} else if (!isNaN(sw) && !isNaN(sh)) {
					Object.merge(image, {size: "0", w: sw, h: sh});
				}
				addImageOnInit(image, checked);
			});
		} else {
			const listed = added.indexOf(t.model.attributes.imgsrc);
			if (listed !== -1) images[listed].face = true;
			else addImageOnInit({url: t.model.attributes.imgsrc, face: true, w: tw, h: th});
		}
	});
	if ($list.variedSizes) images.forEach(i => {
		if (i.size === undefined) i.size = findStandardSize(i.w, i.h);
	});
	const name = selection.length > 1 ? "You are editing multiple tokens" : selection[0].model?.attributes?.name || "Unnamed token";
	const description = selection.length > 1 ? `
		If you press "Save", the changes will be applied to each of the selected tokens, making them multi-sided if you have multiple images on the list below
	` : selection[0].model.attributes.sides ? `
		You are currently editing images for multi-sided token. Add or remove as many sides as you want. If only one image remains, the token will become a single-sided one
	` : `
		Currently this token is represented by a single image. Add more images to convert it to multi-sided token
	`;
	const tokenList = selection.length <= 1 ? "" : selection.reduce((r, t) => `${r}
		<div class="tokenbox selected" data-tokenid="${t.model.id}" data-tokenimg="${t.model.attributes.imgsrc}">
			<div class="inner">
				<img src="${t.model.attributes.imgsrc}">
				<div class="name">${t.model.attributes.name}</div>
			</div>
		</div>
	`, "");
	const resetTokens = () => {
		$tokenList.find(".selected").each((k, t) => {
			const $token = $(t);
			const $tokenimage = $token.find("img");
			$tokenimage.attr("src", $token.data("tokenimg"));
		});
	}
	const buildList = () => {
		if (images.length === 1) {
			$list.someImageSelected = true;
			images[0].selected = true;
		}
		$list.html(images.reduce((r, i, k) => `${r}
			<tr class="tokenimage${images.length === 1 ? " lastone" : ""}${i.skip ? " skipped" : ""}" data-index="${(i.id = k, k)}">
				<td style="padding:0px;" title="Current image">
					<input class="face" type="checkbox"${i.selected ? " checked" : ""}>
				</td>
				<td>
					<div class="dropbox filled">
					<div class="inner"><img src="${i.url}"><div class="remove"><span>Drop a file</span></div></div>
					</div>
				</td>
				<td>
					<label>Select size:</label><select>${sizes.reduce((o, s) => `${o}
						<option value="${s[1]}"${s[1] === i.size ? " selected" : ""}>${s[0]}</option>
					`, `<option>default (keep as is)</option>`)}</select>
					<span class="custom${i.size === "0" ? " set" : ""}"><input class="w" value="${i.w}"> X <input class="h" value="${i.h}">px</span>
					<label class="skippable"><input class="toskip" type="checkbox"${i.skip ? " checked" : ""}> Skip side on randomize</label>
				</td>
				<td style="padding:0px;">
					<span class="btn url" title="Edit URL...">j</span>
					<span class="btn delete" title="Delete">#</span>
				</td>
			</tr>
		`, ""));
		if (!$list.someImageSelected) {
			images.forEach((i, k) => {
				if (i.face) $list.find("input.face").eq(k).prop({indeterminate: true});
			});
		}
	}
	$dialog.dialog({
		autoopen: true,
		title: "Edit token image(s)",
		width: 450,
		open: () => {
			buildList();
			$tokenList.html(tokenList);
			$dialog.parent().css("maxHeight", "80vh").css("top", "10vh");
			$dialog.find(".edittitle").text(name);
			$dialog.find(".editlabel").text(description);
			$list.droppable({
				greedy: true,
				tolerance: "pointer",
				hoverClass: "ui-dropping",
				scope: "default",
				accept: ".resultimage, .library-item, .journalitem.character",
				drop: (evt, $d) => {
					evt.originalEvent.dropHandled = !0;
					evt.stopPropagation();
					evt.preventDefault();
					$d.helper.detach();
					const char = d20.Campaign.characters.get($d.draggable.data("itemid"));
					const dtoken = JSON.parse(char?._blobcache.defaulttoken || "{}");
					const url = $d.draggable.data("fullsizeurl")
						|| $d.draggable.data("url")
						|| dtoken.imgsrc;
					const img = document.elementFromPoint(evt.clientX, evt.clientY);
					const id = img.tagName === "IMG" ? $(img).closest(".tokenimage").data("index") : undefined;
					if (images[id]?.url && url) {
						images[id].url = url;
						$list.find(".dropbox img").eq(id).attr("src", url);
						if (images[id].selected) $tokenList.find(".selected img").attr("src", images[id].url);
					} else if (url) {
						if ($list.variedSizes && dtoken.width) {
							const [w, h] = [dtoken.width, dtoken.height];
							const size = findStandardSize(w, h);
							images.push({url, size, w, h});
						} else {
							images.push({url, w: 70, h: 70});
						}
						buildList();
					}
				},
			});
			$dialog.on(window.mousedowntype, ".tokenbox", evt => {
				const $token = $(evt.currentTarget);
				if ($token.hasClass("selected")) {
					if ($tokenList.find(".selected").length > 1) {
						$token.removeClass("selected");
						$token.find("img").attr("src", $token.data("tokenimg"));
					}
				} else {
					$token.addClass("selected");
					if ($list.someImageSelected) $token.find("img").attr("src", images.find(i => i.selected)?.url);
				}
			}).on("change", "select", evt => {
				const $changed = $(evt.target);
				const $token = $changed.parent();
				const $custom = $token.find(".custom").removeClass("set");
				const newSize = $changed.val();
				const id = $changed.closest(".tokenimage").data("index");
				if (newSize > 0) {
					$token.find(".w, .h").val(newSize * 70);
					images[id].size = newSize;
					$list.variedSizes = true;
				} else {
					delete images[id].size;
					if (newSize === "0") {
						$list.variedSizes = true;
						images[id].size = newSize;
						images[id].w = $token.find(".w").val();
						images[id].h = $token.find(".h").val();
						$custom.addClass("set");
					}
				}
			}).on("change", "input.face", evt => {
				const id = $(evt.target).closest(".tokenimage").data("index");
				const isChecked = $(evt.target).prop("checked");
				const $allBoxes = $list.find("input.face");
				if (isChecked) {
					$list.someImageSelected = true;
					$allBoxes.prop({checked: false}).prop({indeterminate: false});
					$(evt.target).prop({checked: true});
					$tokenList.find(".selected img").attr("src", images[id].url);
					images.forEach((i, k) => {
						if (k === id) i.selected = true;
						else i.selected = false;
					});
				} else {
					$list.someImageSelected = false;
					images[id].selected = false;
					resetTokens();
					images.forEach((i, k) => {
						if (i.face) $allBoxes.eq(k).prop({indeterminate: true});
					});
				}
			}).on("change", "input.toskip", evt => {
				const $token = $(evt.target).closest(".tokenimage");
				const id = $token.data("index");
				const isChecked = $(evt.target).prop("checked");
				if (isChecked) {
					$token.addClass("skipped");
					images[id].skip = true;
				} else {
					$token.removeClass("skipped");
					images[id].skip = false;
				}
			}).on("change", "input .w, input.h", evt => {
				const $token = $(evt.target).closest(".tokenimage");
				const id = $token.data("index");
				const set = {w: $token.find(".w").val(), h: $token.find(".h").val()};
				if (isNaN(set.w) || isNaN(set.h)) return;
				images[id].w = set.w;
				images[id].h = set.h;
			}).on(window.mousedowntype, ".url", evt => {
				const $token = $(evt.target).closest(".tokenimage");
				const $image = $token.find("img");
				const id = $token.data("index");
				const url = window.prompt("Edit URL", $image.attr("src"));
				if (!url) return;
				d20plus.art.setLastImageUrl(url);
				images[id].url = url;
				$image.attr("src", url);
			}).on(window.mousedowntype, ".delete", evt => {
				const $deleted = $(evt.target).closest(".tokenimage");
				const id = $deleted.data("index");
				if (images.length <= 1) return;
				if (images[id].selected) {
					$list.someImageSelected = false;
					resetTokens();
				}
				images.splice(id, 1);
				buildList();
				if (images.length === 1) {
					$list.someImageSelected = true;
					$list.find("input.face").prop({checked: true});
					$tokenList.find(".selected img").attr("src", images[0].url);
				}
			}).on(window.mousedowntype, ".addimageurl", () => {
				const url = window.prompt("Enter a URL", d20plus.art.getLastImageUrl());
				if (!url) return;
				d20plus.art.setLastImageUrl(url);
				images.push({url, w: 70, h: 70});
				buildList();
			})
		},
		close: () => {
			$dialog.off();
			$dialog.dialog("destroy").remove();
		},
		buttons: {
			"Save changes": () => {
				const save = {};
				if (images.length > 1) {
					save.sides = images.map(i => {
						const skipped = i.skip ? stag : "";
						const size = i.size ? tag + (i.size === "0" ? `${i.w}x${i.h}` : i.size) : "";
						return escape(i.url + skipped + size);
					}).join("|");
				} else {
					save.sides = "";
				}
				if ($list.someImageSelected) {
					const selected = images.find(i => i.selected);
					if (selected) {
						save.imgsrc = selected.url;
						save.currentSide = selected.id;
						if (selected.size === "0") {
							save.width = Number(selected.w);
							save.height = Number(selected.h);
						} else if (selected.size) {
							save.width = selected.size * 70;
							save.height = selected.size * 70;
						}
					}
				}
				if (selection.length > 1) {
					d20.engine.unselect();
				}
				selection.forEach(t => {
					if (selection.length === 1
						|| $tokenList.find(`[data-tokenid=${t.model.id}]`).hasClass("selected"))
						t.model.save(save);
				});
				$dialog.off();
				$dialog.dialog("destroy").remove();
				d20.textchat.$textarea.focus();
			},
			"Cancel": () => {
				$dialog.off();
				$dialog.dialog("destroy").remove();
			},
		},
	});
})();