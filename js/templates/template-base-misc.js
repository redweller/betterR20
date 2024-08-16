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

	document.addEventListener("b20initTemplates", function initHTML () {
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
			#textchat-input.social-resized .social, #textchat-input.social-default .social {
				display: inline-block;
			}
			#textchat-input.social-default textarea {
				height: 19px;
				flex: auto;
			}
			.selectize.social {
				width: 100px;
			}
			select#speakingto, select#speakingin {
				height: 22px;
				padding: 0px 5px;
			}
			#socialswitch {
				height: 18px;
				margin-left: 5px;
			}
			#textchat-input.talkingtoself textarea {
				border: 2px solid rgba(255,0,0,0.4) !important;
				background-color: rgba(255,0,0,0.2) !important;
			}
		</style>
		`;
		document.removeEventListener("b20initTemplates", initHTML, false);
	});

	document.addEventListener("b20initTemplates", function initHTML () {
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
			#textchat-social-notifier.b20-in, #textchat-social-notifier.b20-to {
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
			#textchat-social-notifier.b20-in #textchat-social-notifier-in, #textchat-social-notifier.b20-to #textchat-social-notifier-to {
				display: inline-block;
			}
			#textchat-social-notifier-to::before {
				content: "TO: ";
			}
			#textchat-social-notifier-in::before {
				content: "IN: ";
			}
			#textchat-social-notifier::after, #textchat-notifier::after {
				content: "*";
				font-family: pictos;
				padding-left: 3px;
				vertical-align: top;
			}
			#textchat-notifier {
				float: right;
				position: unset;
				cursor: pointer;
			}
		</style>
		`;
		document.removeEventListener("b20initTemplates", initHTML, false);
	});

	document.addEventListener("b20initTemplates", function initHTML () {
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
		document.removeEventListener("b20initTemplates", initHTML, false);
	});

	document.addEventListener("b20initTemplates", function initHTML () {
		d20plus.html.bActionsMenu = `
		<div id="ba-panel">
			<button aria-disabled="false" type="button" style="" class="el-button large page-button">
				<span><span style="font-family: Pictos;font-size: 21px;">U</span></span>
			</button>
			<div class="ba-menu" style="display:none">
				<div class="ba-title">
				<span class="ba-token" data-action="findtoken"><img src="https://img.icons8.com/ios-glyphs/30/multicultural-people.png"></span>
					<span class="ba-name">Selected</span>
					<span class="ba-title-actions">
						<button data-action="collapsew" title="Collapse/expand"></button>
						<button data-action="expandh" title="Lock/unlock menu height"></button>
						<button data-action="close" title="Close this menu">*</button>
						<!--<button data-action="speakas" title="Speak as character">w</button>
						<button data-action="opensheet" title="Open character sheet">U</button>
						<button data-action="openchar" title="Open character settings">x</button><br>-->
					</span>
				</span>
				</div>
				<ul class="ba-tabs nav nav-tabs">
					<li class="nav-tabs active" data-tab="general"><a>
						<img src="https://img.icons8.com/ios-glyphs/30/pulse.png">
						<span>${__("ba_group_general")}</span></a>
					</li>
					<li class="nav-tabs" data-tab="stats" style="display:none;"><a>
						<img src="https://img.icons8.com/external-kmg-design-glyph-kmg-design/32/external-muscle-gym-kmg-design-glyph-kmg-design.png">
						<span>${__("ba_group_abilities")}</span></a>
					</li>
					<li class="nav-tabs" data-tab="skills" style="display:none;"><a>
						<img src="https://img.icons8.com/external-icongeek26-glyph-icongeek26/64/external-Lute-music-icongeek26-glyph-icongeek26.png">
						<span>${__("ba_group_skills")}</span></a>
					</li>
					<li class="nav-tabs" data-tab="attacks" style="display:none;"><a>
						<img src="https://img.icons8.com/external-prettycons-solid-prettycons/60/external-swords-games-prettycons-solid-prettycons.png">
						<span>${__("ba_group_attacks")}</span></a>
					</li>
					<li class="nav-tabs" data-tab="traits" style="display:none;"><a>
						<img src="https://img.icons8.com/ios-filled/50/exercise.png">
						<span>${__("ba_group_traits")}</span></a>
					</li>
					<li class="nav-tabs" data-tab="spells" style="display:none;"><a>
						<img src="https://img.icons8.com/ios-filled/50/fantasy.png">
						<span>${__("ba_group_spells")}</span></a>
					</li>
					<li class="nav-tabs" data-tab="items" style="display:none;"><a>
						<img src="https://img.icons8.com/ios-filled/50/red-purse.png">
						<span>${__("ba_group_items")}</span></a>
					</li>
					<li class="nav-tabs" data-tab="animations" style="float:right;display:none;"><a>
						<img src="https://img.icons8.com/ios-filled/50/service.png">
						<span>${__("ba_group_animations")}</span></a>
					</li>
				</ul>
				<div class="ba-main">
					<div class="ba-list content-left">
						<ul class="active" data-list="general"></ul>
						<ul data-list="stats"></ul>
						<ul class="uneven" data-list="skills"></ul>
						<ul data-list="attacks"></ul>
						<ul data-list="traits"></ul>
						<ul data-list="spells"></ul>
						<ul data-list="items"></ul>
						<ul data-list="animations"></ul>
					</div>
					<div class="ba-info content-right">
						<ul class="active" data-pane="general"><li>${__("ba_nothing_selected")}</li></ul>
						<ul data-pane="stats"><li> </li></ul>
						<ul data-pane="skills"><li> </li></ul>
						<ul data-pane="attacks"><li> </li></ul>
						<ul data-pane="traits"><li> </li></ul>
						<ul data-pane="spells"><li> </li></ul>
						<ul data-pane="items"><li> </li></ul>
						<ul data-pane="context" style="font-size: 12px; line-height: 15px; font-weight: 100;"><li> </li></ul>
						<ul data-pane="animations">
							<li>Animations are set in the betteR20 tools menu</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		`;
		document.removeEventListener("b20initTemplates", initHTML, false);
	});

	document.addEventListener("b20initTemplates", function initHTML () {
		d20plus.html.layerExtrasButton = `
		<div class="toolbar-button-outer b20" style="color: var(--vtt-toolbar-active-selection-color);" id="extra-layer-button">
			<div class="toolbar-button-mid">
				<div class="toolbar-button-inner" tabindex="0">
					<div style="" class="icon-slot icon-circle">
						<span style="font-size: 1.5em;font-family: Pictos;" class="grimoire__roll20-icon">|</span>
					</div>
					<div class="submenu-caret"></div>
				</div>
				<span class="label" style="">EXTRA</span>
			</div>
			<div class="toolbar-tooltip-outer" style="filter: initial; --0c2fd930: 6px;">
				<div class="toolbar-tooltip-caret"></div>
				<div  class="toolbar-tooltip-inner">
					<span class="toolbar-tooltip-label text-sm-medium">Extra editable layers</span>
					<span class="toolbar-shortcut-label">[b20]</span>
				</div>
			</div>
			<span class="decoration" style="color: inherit;"></span>
		</div>
		`;
		document.removeEventListener("b20initTemplates", initHTML, false);
	});

	d20plus.html.layerSecondaryPanel = (l) => `
		<div class="toolbar-button-outer b20" style="color: var(--vtt-toolbar-active-selection-color);" id="${l.name.toLowerCase()}-layer-button">
			<div class="toolbar-button-mid">
				<div class="toolbar-button-inner" data-layer="${l.id}" tabindex="0">
					<div style="" class="icon-slot icon-circle">
						<span style="font-size: 1.5em;font-family: Pictos;" class="grimoire__roll20-icon">${l.icon}</span>
					</div>
				</div>
				<span class="layer-toggle">E</span>
				<span class="label" style="">${l.name}</span>
			</div>
			<div class="toolbar-tooltip-outer" style="filter: initial; top: 6px;">
				<div class="toolbar-tooltip-caret"></div>
				<div  class="toolbar-tooltip-inner">
					<span class="toolbar-tooltip-label text-sm-medium">${l.tooltip}</span>
					<span class="toolbar-shortcut-label">[b20]</span>
				</div>
			</div>
		</div>
	`;
}

SCRIPT_EXTENSIONS.push(initHTMLbaseMisc);
