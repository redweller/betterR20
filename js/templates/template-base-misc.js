function initHTMLbaseMisc () {
	d20plus.html = d20plus.html || {};

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

	d20plus.html.artTabHtml = `
	<div>
		<h3 style="margin-bottom: 4px;">BetteR20</h3>
		<p style="display: flex; width: 100%; justify-content: space-between;">
			<button class="btn" id="button-add-external-art" style="margin-right: 5px; width: 100%;">Manage External Art</button>
			<button class="btn" id="button-browse-external-art" style="width: 100%;">Browse Repo</button>
		</p>
	</div>
	`;

	d20plus.html.addArtHTML = `
	<div id="d20plus-artfolder" title="BetteR20 - External Art" style="position: relative; background: inherit;">
		<p>Add external images by URL. Any direct link to an image should work.</p>
		<p>
			<input placeholder="Name*" id="art-list-add-name">
			<input placeholder="URL*" id="art-list-add-url">
			<a class="btn" href="#" id="art-list-add-btn">Add URL</a>
			<a class="btn" href="#" id="art-list-multi-add-btn">Add Multiple URLs...</a>
			<a class="btn btn-danger" href="#" id="art-list-delete-all-btn" style="margin-left: 12px;">Delete All</a>
			<p />
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

	d20plus.html.addArtMassAdderHTML = `
	<div id="d20plus-artmassadd" title="Mass Add Art URLs">
		<p>One entry per line; entry format: <b>[name]---[URL (direct link to image)]</b> <button class="btn" id="art-list-multi-add-btn-submit">Add URLs</button></p>
		<p><textarea id="art-list-multi-add-area" style="width: 100%; height: 100%; min-height: 500px;" placeholder="My Image---http://example.com/img1.png"></textarea></p>
	</div>
	`;

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

	d20plus.html.configEditorHTML = `
	<div id="d20plus-configeditor" title="Better20 - Config Editor" style="position: relative">
		<!-- populate with js -->
	</div>
	`;

	d20plus.html.configEditorButtonBarHTML = `
	<div class="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix">
		<div class="ui-dialog-buttonset">
			<button type="button" id="configsave" alt="Save" title="Save Config" class="btn" role="button" aria-disabled="false">
				<span>Save</span>
			</button>
		</div>
	</div>
	`;

	d20plus.html.toolsListHtml = `
	<div id="d20-tools-list" title="BetteR20 - Tools List" style="position: relative">
		<div class="tools-list">
			<!-- populate with js -->
		</div>
	</div>
	`;

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
	`;

	d20plus.html.chatSocial = `
	<div class="btn" id="socialswitch">
		<span class="pictos">w</span>
	</div>
	<div style="float: left;" class="social">
		<label for="speakingto">To:</label>
		<select id="speakingto" class="selectize social">
			<option value="">All</option>
		</select>
		<span id="langpanel">
			<label for="speakingin">In:</label>
			<select class="selectize social" id="speakingin">
				<option value=""></option>
			</select>
		</span>
	</div>
	<style type="text/css">
		#textchat-input .social {
			display: none;
		}

		#textchat-input.social-resized .social,
		#textchat-input.social-default .social {
			display: inline-block;
		}

		#textchat-input.social-default textarea {
			height: 19px;
			flex: auto;
		}

		.selectize.social {
			width: 100px;
		}

		select#speakingto,
		select#speakingin {
			height: 22px;
			padding: 0px 5px;
		}

		#socialswitch {
			height: 18px;
			margin-left: 5px;
		}

		#textchat-input.talkingtoself textarea {
			border: 2px solid rgba(255, 0, 0, 0.4) !important;
			background-color: rgba(255, 0, 0, 0.2) !important;
		}
	</style>
	`;

	d20plus.html.chatSocialNotifier = `
	<div id="textchat-note-container">
		<div id="textchat-social-notifier" title="Click to reset">
			<span id="textchat-social-notifier-to"></span>
			<span id="textchat-social-notifier-in"></span>
		</div>
	</div>
	<style type="text/css">
		#textchat-note-container {
			position: absolute;
			right: 0px;
			top: -5px;
		}

		#textchat-social-notifier {
			background-color: rgba(70, 50, 70, 0.8);
			color: white;
			opacity: 0.6;
			font-size: 0.9em;
			font-weight: bold;
			height: 17px;
			padding: 5px;
			float: right;
			cursor: pointer;
			display: none;
		}

		#textchat-social-notifier.b20-in,
		#textchat-social-notifier.b20-to {
			display: block;
		}

		#textchat-social-notifier span {
			padding-left: 5px;
			display: none;
			max-width: 70px;
			text-overflow: ellipsis;
			white-space: nowrap;
			overflow: hidden;
			vertical-align: baseline;
		}

		#textchat-social-notifier.b20-in #textchat-social-notifier-in,
		#textchat-social-notifier.b20-to #textchat-social-notifier-to {
			display: inline-block;
		}

		#textchat-social-notifier-to::before {
			content: "TO: ";
		}

		#textchat-social-notifier-in::before {
			content: "IN: ";
		}

		#textchat-social-notifier::after {
			content: "*";
			font-family: pictos;
			padding-left: 3px;
			vertical-align: top;
		}

		#textchat-notifier {
			float: right;
			position: unset;
		}
	</style>
	`;
}

SCRIPT_EXTENSIONS.push(initHTMLbaseMisc);
