(() => {
	const menuFirst = $("#journalitemmenu ul li").first();
	menuFirst.after(`<li class="b20-change-avatar" data-action-type="changeavatar">Set avatar</li>`);
	$(`body`).on("mouseup", ".journalitem.character, .journalitem.handout", (evt) => {
		d20plus.engine._lastJournalContext = $(evt.target).closest(".journalitem").attr("data-itemid");
	})
	$("#journalitemmenu ul").on(window.mousedowntype, "li[data-action-type=changeavatar]", function () {
		const id = d20plus.engine._lastJournalContext;
		const item = d20.Campaign.characters.get(id) || d20.Campaign.handouts.get(id);
		const name = item?.attributes.name || "Unnamed";
		if (!item?.attributes.hasOwnProperty("name") || !item?.attributes.hasOwnProperty("avatar")) return;
		d20plus.ut.log("Setting avatar for " + name);
		const $dialog = $(`
			<div class="dialog largedialog journalavatareditor">
				<button class="btn avatar-image-by-url" style="margin-bottom: 10px">Set image from URL...</button>
				<div class="avatar dropbox" style="background: white; min-height:100px;">
					<div class="status"></div>
					<div class="inner"></div>
				</div>
			</div>
		`);
		const avatar = {url: item?.attributes.avatar || ""};
		const $dropbox = $dialog.find(".dropbox");
		const setImagePreview = (img) => {
			const $inner = $dropbox.find(".inner");
			if (img) {
				$dropbox.addClass("filled");
				avatar.url = img;
				$inner.html(`<img src="${img}"><div class="remove"><a href="javascript:void(0);">Remove</a></div>`);
			} else {
				$dropbox.removeClass("filled");
				avatar.url = "";
				$inner.html(`<h4 style="padding-bottom: 0px; marigin-bottom: 0px; color: #777;">Drop a file</h4><br>`);
			}
		};
		$dialog.dialog({
			resizable: true,
			autoopen: true,
			title: "Set avatar from URL",
			open: () => {
				setImagePreview(avatar.url);
				$dropbox.droppable({
					accept: ".resultimage, .library-item",
					greedy: true,
					scope: "default",
					tolerance: "pointer",
					classes: {
						"ui-droppable": "drop-highlight",
					},
					drop: (e, d) => {
						e.originalEvent.dropHandled = !0,
						e.stopPropagation();
						e.preventDefault();
						setImagePreview(d.draggable.data("fullsizeurl") || d.draggable.data("url"));
					}
				}).on("click", ".remove", () => {
					setImagePreview();
				});
				$dialog.find(".avatar-image-by-url").on("click", function () {
					const url = window.prompt("Enter a URL", d20plus.art.getLastImageUrl());
					if (url) {
						d20plus.art.setLastImageUrl(url);
						setImagePreview(url);
					}
				});
			},
			close: () => {
				$dialog.off();
				$dialog.dialog("destroy").remove();
			},
			buttons: {
				OK: () => {
					item.save({avatar: avatar.url});
					$dialog.off();
					$dialog.dialog("destroy").remove();
				},
				Cancel: () => {
					$dialog.off();
					$dialog.dialog("destroy").remove();
				},
			}
		});
	})
})()