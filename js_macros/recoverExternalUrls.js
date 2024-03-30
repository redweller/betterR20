// b20-JS: check and recover broken token images
// Run the macro, and it will show the list of supposedly broken tokens
// and you'll be able to select one of the actions
// (delete, recover url or set default placeholder token image)
{
	const tokens = {};
	const page = d20.Campaign.activePage();

	const $dialog = $(`
		<div><h4 class="ui-dialog-buttonpane" style="margin: 0px;padding: 0px 0px 20px 0px;">
			Tokens with issues
			<button type="button" class="toggle-cors" style="float: right;height: 25px;margin:0px 0px 0px 7px;padding: 5px;box-sizing: border-box;position: relative;top: -4px;">
				Toggle CORS
			</button>
			<a class="tipsy-n-right showtip pictos" style="float:right" title="
				<div style=&quot;background:black;width:250px;margin:-5px;padding:5px;&quot;>
					<p style=&quot;font-size:11px;line-height:16px&quot;>CORS stands for Cross-Origin Resource Sharing and is meant to prevent potential exploits of resources hosted on different sites.</p>
					<p style=&quot;font-size:11px;line-height:16px&quot;>We can't verify images hosted on sites that block CORS requests (typically every service not meant to be used as CDN), so each such image is listed when you press Toggle CORS.</p>
				</div>
			">?</a>
		</h4><style>.tokenlist .cors {display:none} .tokenlist.show-cors .cors {display:block}</style></div>`);
	const $list = $(`<div class="tokenlist">No tokens found</div>`);
	$dialog.append($list);

	const addToken = (token) => {
		const name = token.name
			? `<span style="font-family:Pictos">U</span> ${token.name}`
			: token.filename;
		const mode = $list.find("select").length
			? "append"
			: $list.html(`<p class="cors" style="white-space:break-spaces;">Showing CORS-blocked tokens. If you see them in the map - no need to change anything</p>`);
		const $item = $(`<p class="${token.cors ? "cors" : ""}">
			<label>
				<img src="${token.filesrc}" alt="Token" style="max-width:32px;max-height:32px;">
				<span style="
					display:inline-block;
					width: ${token.cors ? `160px` : `175px`};
					text-overflow: ellipsis;
					overflow: hidden;
					vertical-align: middle;
				">${name}</span>
				${token.cors ? `<a class="tipsy-n-right showtip pictos" title="Can't verify due to CORS">?</a>` : ""}
				<a class="tipsy-n-right showtip pictos" title="URL: ${token.src}">A</a>
				<select data-id="${token.id}" style="width:125px">
					<option value="skip">-Skip (don't do anything)</option>
					<option value="delete">Delete token</option>
					${token.reset ? `<option value="reset">Set placeholder image</option>` : ""}
					${token.restore ? `<option value="restore" ${token.forceRestore ? "selected" : ""}>Restore proxied URL</option>` : ""}
				</select>
			</label>
		</p>`);
		tokens[token.id] = token;
		$list.append($item);
	}

	page
		.thegraphics.models
		.forEach(t => {
			if (t.attributes.type !== "image") return;
			const token = {
				id: t.id,
				atr: t.attributes,
				src: t.attributes.imgsrc,
				name: t.attributes.name,
				ref: t,
			}
			if (token.src.includes("imgsrv.roll20.net/?src=")) {
				token.filesrc = decodeURIComponent(token.src.split("?src=")[1]?.split("&cb=")[0]);
				token.filename = token.src.split("?src=")[1]?.split("&cb=")[0]?.split("/").last();
				$.get(token.filesrc).done(function (evt) {
					token.restore = true;
					token.forceRestore = true;
					addToken(token);
				}).fail(function (evt) {
					if (!evt.status) token.restore = true;
					token.reset = true;
					addToken(token);
				});
			} else {
				$.get(token.src).fail(function (evt) {
					if (!evt.status) token.cors = true;
					token.filesrc = !evt.status ? token.src : "/images/character.png";
					token.filename = token.src?.split("/").last()?.split("?")[0];
					token.reset = true;
					addToken(token);
				});
			}
		});

	$dialog.dialog({
		autoopen: true,
		width: 400,
		title: page.attributes.name || "Review found tokens",
		buttons: {
			"Apply": () => {
				const actions = $list.find("select");
				actions.each((i, t) => {
					const item = $(t);
					const id = item.data("id");
					const action = item.val();
					switch (action) {
						case "delete": tokens[id]?.ref.destroy(); break;
						case "reset": tokens[id]?.ref.save({imgsrc: "/images/character.png"}); break;
						case "restore": tokens[id]?.ref.save({imgsrc: tokens[id].filesrc}); break;
					}
				});
				$dialog.off();
				$dialog.dialog("destroy").remove();
				d20.engine.redrawScreenNextTick();
			},
			"Cancel": () => { $dialog.off(); $dialog.dialog("destroy").remove() },
		},
		open: () => {
			$dialog.on("click", ".toggle-cors", () => {
				$list.toggleClass("show-cors");
			})
		},
		close: () => { $dialog.off(); $dialog.dialog("destroy").remove() },
	})
}