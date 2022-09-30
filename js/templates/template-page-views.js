function initHTMLpageViews () {
	d20plus.html = d20plus.html || {};

	document.addEventListener("b20initTemplates", function initHTML () {
		d20plus.html.pageSettingsViews = `
		<div class='views tab-pane'>
			<div class="pagedetails">
				<div class="alert alert-info" role="alert">
					<p>Views are just another way to manage groups of items on your map
					. Each View can include different items - tokens (except PCs), paths & images, regardless of their layer.
					</p><p>Assign desired items to Views via the Context menu
					. Then you can easily hide or show those items using controls at the bottom of "Editing layer" dropdown
					. This may be useful to store and quickly switch between different states of your location - day/night, rooftops/interiors etc.
					</p><p>Players do not need betteR20 to see the effect of switching Views.</p>
				</div>
				<div class="row pagedetails__subheader">
					<div class="col-xs-7 pagedetails__header">
						<h4 class="page_title">Enable Views</h4>
					</div>
					<div class="col-xs-3">
						<label class="switch">
							<label class="sr-only" for="viewsEnable">toggle view one</label>
							<input name="viewsEnable" id="viewsEnable" type="checkbox">
							<span class="slider round"></span>
						</label>
					</div>
				</div>
				<div class="pagedetails__header">
					<h3 class="page_title">Default view</h3>
				</div>
				<div class="pagedetails__subheader">
					<h4>Custom name</h4>
					<a class="tipsy-w showtip pictos" original-title="Input your custom name for this view">?</a>
				</div>
				<div>
					<label class="sr-only">input custom name</label>
					<input class="page-input" name="views0Name" placeholder="Default">
				</div>
				<hr>
				<div class="pagedetails__header">
					<h3 class="page_title">View 1</h3>
				</div>
				<div class="row pagedetails__subheader">
					<div class="col-xs-7 pagedetails__header">
						<h4 class="page_title">Enable View 1</h4>
					</div>
					<div class="col-xs-3">
						<label class="switch">
							<label class="sr-only" for="views1Enable">toggle view one</label>
							<input name="views1Enable" id="views1Enable" type="checkbox">
							<span class="slider round"></span>
						</label>
					</div>
				</div>
				<div class="row pagedetails__subheader">
					<div class="col-xs-7 pagedetails__header">
						<h4 class="page_title">Mutually exclusive with previous</h4>
						<a class="tipsy-w showtip pictos" original-title="Check this, if enabling this or PREVIOUS view should disable another one of them">?</a>
					</div>
					<div class="col-xs-3">
						<label class="switch">
							<label class="sr-only" for="views1Exclusive">toggle view one</label>
							<input name="views1Exclusive" id="views1Exclusive" type="checkbox">
							<span class="slider round"></span>
						</label>
					</div>
				</div>
				<div class="pagedetails__subheader">
					<h4>Custom name</h4>
					<a class="tipsy-w showtip pictos" original-title="Input your custom name for this view">?</a>
				</div>
				<div>
					<label class="sr-only">input custom name</label>
					<input class="page-input" name="views1Name" placeholder="View 1">
				</div>
				<hr>
				<div class="pagedetails__header">
					<h3 class="page_title">View 2</h3>
				</div>
				<div class="row pagedetails__subheader">
					<div class="col-xs-7 pagedetails__header">
						<h4 class="page_title">Enable View 2</h4>
					</div>
					<div class="col-xs-3">
						<label class="switch">
							<label class="sr-only" for="views2Enable">toggle view one</label>
							<input name="views2Enable" id="views2Enable" type="checkbox">
							<span class="slider round"></span>
						</label>
					</div>
				</div>
				<div class="row pagedetails__subheader">
					<div class="col-xs-7 pagedetails__header">
						<h4 class="page_title">Mutually exclusive with previous</h4>
						<a class="tipsy-w showtip pictos" original-title="Check this, if enabling this or PREVIOUS view should disable another one of them">?</a>
					</div>
					<div class="col-xs-3">
						<label class="switch">
							<label class="sr-only" for="views2Exclusive">toggle view two</label>
							<input name="views2Exclusive" id="views2Exclusive" type="checkbox">
							<span class="slider round"></span>
						</label>
					</div>
				</div>
				<div class="pagedetails__subheader">
					<h4>Custom name</h4>
					<a class="tipsy-w showtip pictos" original-title="Input your custom name for this view">?</a>
				</div>
				<div>
					<label class="sr-only">input custom name</label>
					<input class="page-input" name="views2Name" placeholder="View 2">
				</div>
				<hr>
				<div class="pagedetails__header">
					<h3 class="page_title">View 3</h3>
				</div>
				<div class="row pagedetails__subheader">
					<div class="col-xs-7 pagedetails__header">
						<h4 class="page_title">Enable View 3</h4>
					</div>
					<div class="col-xs-3">
						<label class="switch">
							<label class="sr-only" for="views3Enable">toggle view three</label>
							<input name="views3Enable" id="views3Enable" type="checkbox" value="0">
							<span class="slider round"></span>
						</label>
					</div>
				</div>
				<div class="row pagedetails__subheader">
					<div class="col-xs-7 pagedetails__header">
						<h4 class="page_title">Mutually exclusive with previous</h4>
						<a class="tipsy-w showtip pictos" original-title="Check this, if enabling this or PREVIOUS view should disable another one of them">?</a>
					</div>
					<div class="col-xs-3">
						<label class="switch">
							<label class="sr-only" for="views3Exclusive">toggle view one</label>
							<input name="views3Exclusive" id="views3Exclusive" type="checkbox" value="0">
							<span class="slider round"></span>
						</label>
					</div>
				</div>
				<div class="pagedetails__subheader">
					<h4>Custom name</h4>
					<a class="tipsy-w showtip pictos" original-title="Input your custom name for this view">?</a>
				</div>
				<div>
					<label class="sr-only">input custom name</label>
					<input class="page-input" name="views3Name" placeholder="View 3">
				</div>
			</div>
		</div>
		`;
		document.removeEventListener("b20initTemplates", initHTML, false);
	});
}

SCRIPT_EXTENSIONS.push(initHTMLpageViews);
