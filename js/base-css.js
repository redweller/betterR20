function baseCss () {
	d20plus.css = {};

	d20plus.css.baseCssRules = [
		// generic
		{
			s: ".display-inline-block",
			r: "display: inline-block;"
		},
		// // fix Roll20's <p> margins in the text editor // FIXME make this configurable
		// {
		// 	s: ".note-editable p",
		// 	r: "margin-bottom: 0;"
		// },
		// page view enhancement
		{
			s: "#page-toolbar",
			r: "height: calc(90vh - 40px);"
		},
		{
			s: "#page-toolbar .container",
			r: "height: 100%; white-space: normal;"
		},
		{
			s: "#page-toolbar .pages .availablepage",
			r: "width: 100px; height: 100px;"
		},
		{
			s: "#page-toolbar .pages .availablepage img.pagethumb",
			r: "max-width: 60px; max-height: 60px;"
		},
		{
			s: "#page-toolbar .pages .availablepage span",
			r: "bottom: 1px;"
		},
		{
			s: "#page-toolbar",
			r: "background: #a8aaad80;"
		},
		// search
		{
			s: ".Vetoolsresult",
			r: "background: #ff8080;"
		},
		// config editor
		{
			s: "div.config-table-wrapper",
			r: "min-height: 200px; width: 100%; height: 100%; max-height: 460px; overflow-y: auto; transform: translateZ(0);"
		},
		{
			s: "table.config-table",
			r: "width: 100%; table-layout: fixed;"
		},
		{
			s: "table.config-table tbody tr:nth-child(odd)",
			r: "background-color: #f8f8f8;"
		},
		{
			s: "table.config-table tbody td > *",
			r: "vertical-align: middle; margin: 0;"
		},
		{
			s: ".config-name",
			r: "display: inline-block; line-height: 35px; width: 100%;"
		},
		// tool list
		{
			s: ".tools-list",
			r: "max-height: 70vh;"
		},
		{
			s: ".tool-row",
			r: "min-height: 40px; display: flex; flex-direction: row; align-items: center;"
		},
		{
			s: ".tool-row:nth-child(odd)",
			r: "background-color: #f0f0f0;"
		},
		{
			s: ".tool-row > *",
			r: "flex-shrink: 0;"
		},
		// warning overlay
		{
			s: ".temp-warning",
			r: "position: fixed; top: 12px; left: calc(50vw - 200px); z-index: 10000; width: 320px; background: transparent; color: red; font-weight: bold; font-size: 150%; font-variant: small-caps; border: 1px solid red; padding: 4px; text-align: center; border-radius: 4px;"
		},
		// GM hover text
		{
			s: ".Vetools-token-hover",
			r: "pointer-events: none; position: fixed; z-index: 100000; background: white; padding: 5px 5px 0 5px; border-radius: 5px;     border: 1px solid #ccc; max-width: 450px;"
		},
		// drawing tools bar
		{
			s: "#drawingtools.line_splitter .currentselection:after",
			r: "content: '✂️';"
		},
		// chat tag
		{
			s: ".userscript-hacker-chat",
			r: "margin-left: -45px; margin-right: -5px; margin-bottom: -7px; margin-top: -15px; display: inline-block; font-weight: bold; font-family: 'Lucida Console', Monaco, monospace; color: #20C20E; background: black; padding: 3px;"
		},
		{
			s: ".userscript-hacker-chat a",
			r: "color: white;"
		},
		{
			s: ".withoutavatars .userscript-hacker-chat",
			r: "margin-left: -15px;"
		},
		// Bootstrap-alikes
		{
			s: ".col-1",
			r: "width: 8.333%;"
		},
		{
			s: ".col-2",
			r: "width: 16.666%;"
		},
		{
			s: ".col-3",
			r: "width: 25%;"
		},
		{
			s: ".col-4",
			r: "width: 33.333%;"
		},
		{
			s: ".col-5",
			r: "width: 41.667%;"
		},
		{
			s: ".col-6",
			r: "width: 50%;"
		},
		{
			s: ".col-7",
			r: "width: 58.333%;"
		},
		{
			s: ".col-8",
			r: "width: 66.667%;"
		},
		{
			s: ".col-9",
			r: "width: 75%;"
		},
		{
			s: ".col-10",
			r: "width: 83.333%;"
		},
		{
			s: ".col-11",
			r: "width: 91.667%;"
		},
		{
			s: ".col-12",
			r: "width: 100%;"
		},
		{
			s: ".ib",
			r: "display: inline-block;"
		},
		{
			s: ".float-right",
			r: "float: right;"
		},
		// image rows
		{
			s: ".import-cb-label--img",
			r: "display: flex; height: 64px; align-items: center; padding: 4px;"
		},
		{
			s: ".import-label__img",
			r: "display: inline-block; width: 60px; height: 60px; padding: 0 5px;"
		},
		// importer
		{
			s: ".import-cb-label",
			r: "display: block; margin-right: -13px !important;"
		},
		{
			s: ".import-cb-label span",
			r: "display: inline-block; overflow: hidden; max-height: 18px; letter-spacing: -1px; font-size: 12px;"
		},
		{
			s: ".import-cb-label span.readable",
			r: "letter-spacing: initial"
		},
		{
			s: ".import-cb-label .source",
			r: "width: calc(16.667% - 28px);'"
		},
		// horizontal toolbar
		{
			s: "#secondary-toolbar:hover",
			r: "opacity: 1 !important;"
		},
	];

	d20plus.css.baseCssRulesPlayer = [
		{
			s: ".player-hidden",
			r: "display: none !important;"
		}
	];

	d20plus.css.cssRules = []; // other scripts should populate this
}

SCRIPT_EXTENSIONS.push(baseCss);
