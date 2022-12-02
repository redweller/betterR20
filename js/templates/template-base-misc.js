function initHTMLbaseMisc () {
	d20plus.html = d20plus.html || {};

	document.addEventListener("b20initTemplates", function initHTML () {
		d20plus.html.settingsHtmlPtFooter = `
		<p>
			<a class="btn " href="#" id="button-edit-config" style="margin-top: 3px; width: calc(100% - 22px);">Edit Config</a>
		</p>
		<p>
			<a class="btn btn player-hidden" href="#" id="button-view-tools" style="margin-top: 3px; width: calc(100% - 22px);">Open Tools List</a>
		</p>
		<p>
			For help, advice, and updates, <a href="https://discord.gg/nGvRCDs" target="_blank" style="color: #08c;">join our Discord!</a>
		</p>
		<style id="dynamicStyle"></style>
		`;
		document.removeEventListener("b20initTemplates", initHTML, false);
	});

	document.addEventListener("b20initTemplates", function initHTML () {
		d20plus.html.artTabHtml = `
		<div>
			<h3 style="margin-bottom: 4px;">BetteR20</h3>
			<p style="display: flex; width: 100%; justify-content: space-between;">
				<button class="btn" id="button-add-external-art" style="margin-right: 5px;">Manage External Art</button>
				<button class="btn" id="button-browse-external-art">Browse Repo</button>
			</p>
		</div>
		`;
		document.removeEventListener("b20initTemplates", initHTML, false);
	});

	document.addEventListener("b20initTemplates", function initHTML () {
		d20plus.html.addArtHTML = `
		<div id="d20plus-artfolder" title="BetteR20 - External Art" style="position: relative; background: inherit;">
			<p>Add external images by URL. Any direct link to an image should work.</p>
			<p>
			<input placeholder="Name*" id="art-list-add-name">
			<input placeholder="URL*" id="art-list-add-url">
			<a class="btn" href="#" id="art-list-add-btn">Add URL</a>
			<a class="btn" href="#" id="art-list-multi-add-btn">Add Multiple URLs...</a>
			<a class="btn btn-danger" href="#" id="art-list-delete-all-btn" style="margin-left: 12px;">Delete All</a>
			<p/>
			<hr>
			<div id="art-list-container" style="background: inherit;">
				<p style="position: sticky; top: -10px; background: inherit; z-index: 100;">
					<span style="display: inline-block; width: calc( 35% + 35px ); font-weight: bold;">
						Name
						<input class="search" autocomplete="off" placeholder="Search list..." style="width: 60%; margin: 10px;">
					</span>
					<span style="display: inline-block; font-weight: bold;">URL</span>
				</p>
				<ul class="list artlist" style="display: block; margin: 0; transform: translateZ(0);"></ul>
			</div>
		</div>
		<br>
		`;
		document.removeEventListener("b20initTemplates", initHTML, false);
	});

	document.addEventListener("b20initTemplates", function initHTML () {
		d20plus.html.addArtMassAdderHTML = `
		<div id="d20plus-artmassadd" title="Mass Add Art URLs">
			<p>One entry per line; entry format: <b>[name]---[URL (direct link to image)]</b> <button class="btn" id="art-list-multi-add-btn-submit">Add URLs</button></p>
			<p><textarea id="art-list-multi-add-area" style="width: 100%; height: 100%; min-height: 500px;" placeholder="My Image---http://example.com/img1.png"></textarea></p>
		</div>
		`;
		document.removeEventListener("b20initTemplates", initHTML, false);
	});

	document.addEventListener("b20initTemplates", function initHTML () {
		d20plus.html.artListHTML = `
		<div id="Vetoolsresults">
		<ol class="dd-list" id="image-search-none">
			<div class="alert white">No results found in 5etools for those keywords.</div>
		</ol>
		<ol class="dd-list" id="image-search-has-results">
			<li class="dd-item dd-folder Vetoolsresult">
				<div class="dd-content">
					<div class="folder-title">From 5etools</div>
				</div>
				<ol class="dd-list Vetoolsresultfolder" id="custom-art-results"></ol>
			</li>
		</ol>
		</div>
		`;
		document.removeEventListener("b20initTemplates", initHTML, false);
	});

	document.addEventListener("b20initTemplates", function initHTML () {
		d20plus.html.configEditorHTML = `
		<div id="d20plus-configeditor" title="Better20 - Config Editor" style="position: relative">
			<!-- populate with js -->
		</div>
		`;
		document.removeEventListener("b20initTemplates", initHTML, false);
	});

	document.addEventListener("b20initTemplates", function initHTML () {
		d20plus.html.configEditorButtonBarHTML = `
		<div class="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix">
			<div class="ui-dialog-buttonset">
				<button type="button" id="configsave" alt="Save" title="Save Config" class="btn" role="button" aria-disabled="false">
					<span>${__("ui_cfg_save")}</span>
				</button>
			</div>
		</div>
		`;
		document.removeEventListener("b20initTemplates", initHTML, false);
	});

	document.addEventListener("b20initTemplates", function initHTML () {
		d20plus.html.toolsListHtml = `
		<div id="d20-tools-list" title="BetteR20 - Tools List" style="position: relative">
			<div class="tools-list">
			<!-- populate with js -->
			</div>
		</div>
		`;
		document.removeEventListener("b20initTemplates", initHTML, false);
	});

	document.addEventListener("b20initTemplates", function initHTML () {
		d20plus.html.pageSettingsNavTabs = `
		<li class="nav-tabs active">
			<a data-tab="pagedetails" href="javascript:void(0);">
				<h2>General</h2>
			</a>
		</li>
		<li class="nav-tabs">
			<a data-tab="lighting" href="javascript:void(0);">
				<h2>Lighting</h2>
			</a>
		</li>
		<li class="nav-tabs--beta">
			<span class="label label-info">bR20</span>
			<a data-tab="weather" href="javascript:void(0);">
				<h2>Weather</h2>
			</a>
		</li>
		<li class="nav-tabs--beta">
			<span class="label label-info">bR20</span>
			<a data-tab="views" href="javascript:void(0);">
				<h2>Views</h2>
			</a>
		</li>
		`;
		document.removeEventListener("b20initTemplates", initHTML, false);
	});
}

SCRIPT_EXTENSIONS.push(initHTMLbaseMisc);
