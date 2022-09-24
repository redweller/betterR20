function css5eTool () {
	d20plus.css.cssRules = d20plus.css.cssRules.concat([
		{
			s: ".no-shrink",
			r: "flex-shrink: 0;",
		},
		{
			s: "#initiativewindow ul li span.initiative,#initiativewindow ul li span.tracker-col,#initiativewindow ul li span.initmacro",
			r: "font-size: 25px;font-weight: bold;text-align: right;float: right;padding: 2px 5px;width: 10%;min-height: 20px;display: block;",
		},
		{
			s: "#initiativewindow ul li span.editable input",
			r: "width: 100%; box-sizing: border-box;height: 100%;",
		},
		{
			s: "#initiativewindow div.header",
			r: "height: 30px;",
		},
		{
			s: "#initiativewindow div.header span",
			r: "cursor: default;font-size: 15px;font-weight: bold;text-align: right;float: right;width: 10%;min-height: 20px;padding: 5px;",
		},
		{
			s: ".ui-dialog-buttonpane span.difficulty",
			r: "display: inline-block;padding: 5px 4px 6px;margin: .5em .4em .5em 0;font-size: 18px;",
		},
		{
			s: ".ui-dialog-buttonpane.buttonpane-absolute-position",
			r: "position: absolute;bottom: 0;box-sizing: border-box;width: 100%;",
		},
		{
			s: ".ui-dialog.dialog-collapsed .ui-dialog-buttonpane",
			r: "position: initial;",
		},
		{
			s: ".token .cr,.header .cr",
			r: "display: none!important;",
		},
		{
			s: "li.handout.compendium-item .namecontainer",
			r: "box-shadow: inset 0px 0px 25px 2px rgb(195, 239, 184);",
		},
		{
			s: ".bind-drop-locations:active",
			r: "box-shadow: inset 0px 0px 25px 2px rgb(195, 239, 184);",
		},
		{
			s: "del.userscript-hidden",
			r: "display: none;",
		},
		{
			s: ".importer-section",
			r: "display: none;",
		},
		{
			s: ".userscript-rd__h",
			r: "font-weight: bold;",
		},
		{
			s: ".userscript-rd__h--0",
			r: "font-weight: bold; font-size: 1.5em;",
		},
		{
			s: ".userscript-rd__h--2",
			r: "font-weight: bold; font-size: 1.3em;",
		},
		{
			s: ".userscript-rd__h--3, .userscript-rd__h--4",
			r: "font-style: italic",
		},
		{
			s: ".userscript-rd__b-inset--readaloud",
			r: "background: #cbd6c688 !important",
		},
		// "No character sheet" message
		{
			s: ".ve-nosheet__body",
			r: "overflow: hidden !important;",
		},
		{
			s: ".ve-nosheet__overlay",
			r: `
			background: darkred;
			position: fixed;
			z-index: 99999;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			color: white;
			font-family: monospace;`,
		},
		{
			s: ".ve-nosheet__title",
			r: "font-size: 72px;",
		},
		{
			s: ".ve-nosheet__btn-close",
			r: `position: absolute;
			top: 8px;
			right: 8px;
			font-size: 16px;`,
		},
	]);
}
SCRIPT_EXTENSIONS.push(css5eTool);
