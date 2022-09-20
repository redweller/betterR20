const baseTemplate = function () {
	d20plus.template = {};

	d20plus.template.swapTemplates = () => {
		document.dispatchEvent(new Event(`b20initTemplates`));
		d20plus.ut.log("Swapping templates...");
		$("#tmpl_charactereditor").html($(d20plus.html.characterEditor).html());
		$("#tmpl_handouteditor").html($(d20plus.html.handoutEditor).html());
		$("#tmpl_deckeditor").html($(d20plus.html.deckEditor).html());
		$("#tmpl_cardeditor").html($(d20plus.html.cardEditor).html());
		// ensure tokens have editable sight
		$("#tmpl_tokeneditor").replaceWith(d20plus.html.tokenEditor);
		// show dynamic lighting/etc page settings
		$("#tmpl_pagesettings").replaceWith(d20plus.template._makePageSettingsTemplate());
	};

	d20plus.template._makePageSettingsTemplate = () => {
		return `<script id='tmpl_pagesettings' type='text/html'>
			<ul class='nav nav-tabs pagedetails_navigation'>
				${d20plus.html.pageSettingsNavTabs}
			</ul>
			<div class='tab-content'>
				${d20plus.html.roll20pageSettings}
				${d20plus.html.pageSettingsWeather}
				${d20plus.html.pageSettingsViews}
			</div>
		</script>`;
	};

	d20plus.template.processPageOptions = () => {
		if (!d20plus.engine._lastSettingsPageId) return;
		const page = d20.Campaign.pages.get(d20plus.engine._lastSettingsPageId);
		if (page && page.get) {
			const $dialog = $(`.pagedetails_navigation:visible`).closest(`.ui-dialog`);
			// if editing active page then close pages list and add Apply button
			if (d20.Campaign.activePage().id === d20plus.engine._lastSettingsPageId) {
				const $barPage = $(`#page-toolbar`);
				const $overlay = $(`.ui-widget-overlay`);
				const templateApply = `<button type="button" class="btn btn-apply" title="Apply settings for current page">Apply</button>`;
				if (!$barPage.hasClass("closed")) {
					$barPage.find(`.handle`).click();
					$overlay.remove();
				}
				$dialog.find(`.btn-primary:visible`).before(templateApply);
				$(`.btn-apply`).on("click", d20plus.template._applySettings);
			}
			// process options within open dialog
			if ($dialog[0]) {
				const $pageTitle = $dialog.find(`.ui-dialog-title:visible`);
				d20plus.template._handleCustomOptions($dialog.find(`.dialog .tab-content`));
				if ($pageTitle[0] && !$(".ui-dialog-pagename:visible")[0]) {
					$pageTitle.after(`<span class="ui-dialog-pagename">${page.get("name")}</span>`);
					$dialog.find(`.btn-primary:visible`).on("mousedown", () => {
						d20plus.template._handleCustomOptions($dialog.find(`.dialog .tab-content`), "save");
					});
					// closed editors behave strangely, so replace Close with Cancel
					$dialog.find(`.ui-dialog-titlebar-close:visible`).on("mousedown", () => {
						$dialog.find(`.ui-dialog-buttonpane .btn:not(.btn-apply):not(.btn-primary)`).click();
					});
				}
			}
		}
	}

	d20plus.template._applySettings = () => {
		const $dialog = $(`.pagedetails_navigation:visible`).closest(".ui-dialog");
		const activeTab = $(`li.active:visible:not(.dl) > a`).data("tab");
		const activeTabScroll = $dialog.find(`.ui-dialog-content`).scrollTop();
		const pageid = d20plus.engine._lastSettingsPageId;
		if ($dialog[0]) {
			$(`#page-toolbar`).css("visibility", "hidden");
			d20plus.template._handleCustomOptions($dialog.find(`.dialog .tab-content`), "save");
			setTimeout(() => {
				$dialog.find(`.btn-primary:visible`).click();
				$(`#page-toolbar .handle`).click();
				$(`.chooseablepage[data-pageid=${pageid}] .js__settings-page`).click();
				$(`.nav-tabs:visible [data-tab=${activeTab}]`).click();
				$(`.ui-dialog-content:visible`).scrollTop(activeTabScroll);
				setTimeout(() => {
					$(`#page-toolbar`).css("visibility", "unset");
				}, 1000);
			}, 10);
		}
	}

	d20plus.template._handleCustomOptions = (dialog, doSave) => {
		const page = d20.Campaign.pages.get(d20plus.engine._lastSettingsPageId);
		if (!page || !page.get) return;
		[
			"weather",
			"views",
		].forEach(category => $.each(d20plus[category].props, (name, deflt) => {
			if (doSave) {
				d20plus.template._saveOption(page, dialog, {name, deflt});
			} else {
				d20plus.template._getOption(page, dialog, {name, deflt});
			}
		}));
		if (doSave) {
			page.save();
		}
	}

	d20plus.template._saveOption = (page, dialog, prop) => {
		const $e = dialog.find(`[name="${prop.name}"]`);
		const val = $e.is(":checkbox") ? !!$e.prop("checked") : $e.val();
		if (val && val !== prop.deflt) {
			page.attributes[`bR20cfg_${prop.name}`] = val;
		} else {
			if (page.attributes.hasOwnProperty(`bR20cfg_${prop.name}`)) {
				page.attributes[`bR20cfg_${prop.name}`] = null;
			}
		}
	}

	d20plus.template._getOption = (page, dialog, prop) => {
		const val = page.get(`bR20cfg_${prop.name}`) || prop.deflt;
		dialog.find(`[name="${prop.name}"]`).each((i, e) => {
			const $e = $(e);
			if ($e.is(":checkbox")) {
				$e.prop("checked", !!val);
			} else if ($e.is("input[type=range]")) {
				$(`.${prop.name}`).val(val);
				$e.val(val);
			} else {
				$e.val(val);
			}
		});
	}
};

SCRIPT_EXTENSIONS.push(baseTemplate);
