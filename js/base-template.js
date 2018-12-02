const baseTemplate = function () {
	d20plus.template = {};

	d20plus.settingsHtmlPtFooter = `<p>
			<a class="btn " href="#" id="button-edit-config" style="margin-top: 3px; width: calc(100% - 22px);">Edit Config</a>
			</p>
			<p>
			For help, advice, and updates, <a href="https://discord.gg/AzyBjtQ" target="_blank" style="color: #08c;">join our Discord!</a>
			</p>
			<p>
			<a class="btn player-hidden" href="#" id="button-view-tools" style="margin-top: 3px; margin-right: 7px;">Open Tools List</a>
			<a class="btn" href="#" id="button-manage-qpi" style="margin-top: 3px;" title="It's like the Roll20 API, but even less useful">Manage QPI Scripts</a>
			</p>
			<style id="dynamicStyle"></style>
		`;

	d20plus.artTabHtml = `
	<p style="display: flex; width: 100%; justify-content: space-between;">
		<button class="btn" id="button-add-external-art" style="margin-right: 5px;">Manage External Art</button>
		<button class="btn" id="button-browse-external-art" title="Warning: phat data">Browse Repo</button>
	</p>
	`;

	d20plus.addArtHTML = `
	<div id="d20plus-artfolder" title="External Art" style="position: relative">
	<p>Add external images by URL. Any direct link to an image should work.</p>
	<p>
	<input placeholder="Name*" id="art-list-add-name">
	<input placeholder="URL*" id="art-list-add-url">
	<a class="btn" href="#" id="art-list-add-btn">Add URL</a>
	<a class="btn" href="#" id="art-list-multi-add-btn">Add Multiple URLs...</a>
	<p/>
	<hr>
	<div id="art-list-container">
	<input class="search" autocomplete="off" placeholder="Search list..." style="width: 100%;">
	<br>
	<p>
		<span style="display: inline-block; width: 40%; font-weight: bold;">Name</span>
		<span style="display: inline-block; font-weight: bold;">URL</span>
	</p>
	<ul class="list artlist" style="max-height: 600px; overflow-y: scroll; display: block; margin: 0; transform: translateZ(0);"></ul>
	</div>
	</div>`;

	d20plus.addArtMassAdderHTML = `
	<div id="d20plus-artmassadd" title="Mass Add Art URLs">
	<p>One entry per line; entry format: <b>[name]---[URL (direct link to image)]</b> <a class="btn" href="#" id="art-list-multi-add-btn-submit">Add URLs</a></p>
	<p><textarea id="art-list-multi-add-area" style="width: 100%; height: 100%; min-height: 500px;" placeholder="My Image---http://pics.me/img1.png"></textarea></p>
	</div>`;

	d20plus.artListHTML = `
	<div id="Vetoolsresults">
	<ol class="dd-list" id="image-search-none"><div class="alert white">No results found in 5etools for those keywords.</div></ol>
	
	<ol class="dd-list" id="image-search-has-results">
		<li class="dd-item dd-folder Vetoolsresult">
			<div class="dd-content">
				<div class="folder-title">From 5etools</div>
			</div>
	
			<ol class="dd-list Vetoolsresultfolder" id="custom-art-results"></ol>
		</li>
	</ol>
	</div>`;

	d20plus.configEditorHTML = `
	<div id="d20plus-configeditor" title="Config Editor" style="position: relative">
	<!-- populate with js -->
	</div>`;

	d20plus.configEditorButtonBarHTML = `
	<div class="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix">
	<div class="ui-dialog-buttonset">
		<button type="button" id="configsave" alt="Save" title="Save Config" class="btn" role="button" aria-disabled="false">
			<span>Save</span>
		</button>
	</div>
	</div>
	`;

	d20plus.tool.toolsListHtml = `
		<div id="d20-tools-list" title="Tools List" style="position: relative">
		<div class="tools-list">
		<!-- populate with js -->
		</div>
		</div>
		`;

	d20plus.template_TokenEditor = `
	 <script id='tmpl_tokeneditor' type='text/html'>
      <div class='dialog largedialog tokeneditor' style='display: block;'>
        <ul class='nav nav-tabs'>
          <li class='active'>
            <a data-tab='basic' href='javascript:void(0);'>Basic</a>
          </li>
          <li>
            <a data-tab='advanced' href='javascript:void(0);'>Advanced</a>
          </li>
        </ul>
        <div class='tab-content'>
          <div class='basic tab-pane'>
            <div style='float: left; width: 300px;'>
              <div style='float: right; margin-right: 85px; font-size: 1.2em; position: relative; top: -4px; cursor: help;'>
                <a class='showtip pictos' title="You can choose to have the token represent a Character from the Journal. If you do, the token's name, controlling players, and bar values will be based on the Character. Most times you'll just leave this set to None/Generic.">?</a>
              </div>
              <label>Represents Character</label>
              <select class='represents'>
                <option value=''>None/Generic Token</option>
                <$ _.each(window.Campaign.activeCharacters(), function(char) { $>
                <option value="<$!char.id$>"><$!char.get("name")$></option>
                <$ }); $>
              </select>
              <div class='clear'></div>
              <div style='float: right; margin-right: 75px;'>
                <label>
                  <input class='showname' type='checkbox' value='1'>
                  Show nameplate?
                </label>
              </div>
              <label>Name</label>
              <input class='name' style='width: 210px;' type='text'>
              <div class='clear'></div>
              <label>Controlled By</label>
              <$ if(this.character) { $>
              <p>(Determined by Character settings)</p>
              <$ } else { $>
              <select class='controlledby chosen' multiple='true'>
                <option value='all'>All Players</option>
                <$ window.Campaign.players.each(function(player) { $>
                <option value="<$!player.id$>"><$!player.get("displayname")$></option>
                <$ }); $>
              </select>
              <$ } $>
              <div class='clear' style='height: 10px;'></div>
              <label>
                Tint Color
              </label>
              <input class='tint_color colorpicker' type='text'>
              <div class='clear'></div>
            </div>
            <div style='float: left; width: 300px;'>
              <label>
                <span class='bar_color_indicator' style='background-color: <$!window.Campaign.get('bar1_color')$>'></span>
                Bar 1
              </label>
              <div class='clear' style='height: 1px;'></div>
              <div class='inlineinputs' style='margin-top: 5px; margin-bottom: 5px;'>
                <input class='bar1_value' type='text'>
                /
                <input class='bar1_max' type='text'>
                <$ if(this.character) { $>
                <div style='float: right;'>
                  <select class='bar1_link' style='width: 125px;'>
                    <option value=''>None</option>
                    <$ _.each(this.tokensettingsview.availAttribs(), function(attrib) { $>
                    <option value="<$!attrib.id$>"><$!attrib.name$>
                    <$ }); $>
                  </select>
                  <a class='pictos showtip' style='font-size: 1.2em; position: relative; top: -5px; margin-left: 10px; cursor: help;' title='You can choose an Attribute from the Character this token represents. The values for this bar will be synced to the values of that Attribute.'>?</a>
                </div>
                <$ } $>
              </div>
              <span style='color: #888;'>(Leave blank for no bar)</span>
              <div class='clear'></div>
              <label>
                <span class='bar_color_indicator' style='background-color: <$!window.Campaign.get('bar2_color')$>'></span>
                Bar 2
              </label>
              <div class='inlineinputs' style='margin-top: 5px; margin-bottom: 5px;'>
                <input class='bar2_value' type='text'>
                /
                <input class='bar2_max' type='text'>
                <$ if(this.character) { $>
                <div style='float: right; margin-right: 30px;'>
                  <select class='bar2_link' style='width: 125px;'>
                    <option value=''>None</option>
                    <$ _.each(this.tokensettingsview.availAttribs(), function(attrib) { $>
                    <option value="<$!attrib.id$>"><$!attrib.name$>
                    <$ }); $>
                  </select>
                </div>
                <$ } $>
              </div>
              <span style='color: #888;'>(Leave blank for no bar)</span>
              <div class='clear'></div>
              <label>
                <span class='bar_color_indicator' style='background-color: <$!window.Campaign.get('bar3_color')$>'></span>
                Bar 3
              </label>
              <div class='inlineinputs' style='margin-top: 5px; margin-bottom: 5px;'>
                <input class='bar3_value' type='text'>
                /
                <input class='bar3_max' type='text'>
                <$ if(this.character) { $>
                <div style='float: right; margin-right: 30px;'>
                  <select class='bar3_link' style='width: 125px;'>
                    <option value=''>None</option>
                    <$ _.each(this.tokensettingsview.availAttribs(), function(attrib) { $>
                    <option value="<$!attrib.id$>"><$!attrib.name$>
                    <$ }); $>
                  </select>
                </div>
                <$ } $>
              </div>
              <span style='color: #888;'>(Leave blank for no bar)</span>
              <div class='clear' style='height: 10px;'></div>
              <div style='float: left; width: 130px;'>
                <div style='float: right;'>
                  <label>
                    <input class='aura1_square' type='checkbox'>
                    Square
                  </label>
                </div>
                <label>
                  Aura 1
                </label>
                <div class='inlineinputs' style='margin-top: 5px;'>
                  <input class='aura1_radius' type='text'>
                  <$!window.Campaign.activePage().get("scale_units")$>.
                  <input class='aura1_color colorpicker' type='text'>
                </div>
              </div>
              <div style='float: left; width: 130px; margin-left: 20px;'>
                <div style='float: right;'>
                  <label>
                    <input class='aura2_square' type='checkbox'>
                    Square
                  </label>
                </div>
                <label>
                  Aura 2
                </label>
                <div class='inlineinputs' style='margin-top: 5px;'>
                  <input class='aura2_radius' type='text'>
                  <$!window.Campaign.activePage().get("scale_units")$>.
                  <input class='aura2_color colorpicker' type='text'>
                </div>
              </div>
              <div class='clear'></div>
            </div>
            <div class='clear'></div>
            <hr>
            <h4>
              GM Notes
              <span style='font-weight: regular; font-size: 0.9em;'>(Only visible to GMs)</span>
            </h4>
            <textarea class='gmnotes summernote'></textarea>
            <div class='clear'></div>
            <label>&nbsp;</label>
          </div>
          <div class='advanced tab-pane'>
            <div class='row-fluid'>
              <div class='span6'>
                <h4>Player Permissions</h4>
                <div style='margin-left: 5px;'>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Name</label>
                    <label>
                      <input class='showplayers_name' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_name' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 5px;'></div>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Bar 1</label>
                    <label>
                      <input class='showplayers_bar1' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_bar1' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 5px;'></div>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Bar 2</label>
                    <label>
                      <input class='showplayers_bar2' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_bar2' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 5px;'></div>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Bar 3</label>
                    <label>
                      <input class='showplayers_bar3' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_bar3' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 5px;'></div>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Aura 1</label>
                    <label>
                      <input class='showplayers_aura1' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_aura1' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 5px;'></div>
                  <div class='inlineinputs'>
                    <label style='width: 40px;'>Aura 2</label>
                    <label>
                      <input class='showplayers_aura2' type='checkbox'>
                      See
                    </label>
                    <label>
                      <input class='playersedit_aura2' type='checkbox'>
                      Edit
                    </label>
                  </div>
                  <div class='clear' style='height: 10px;'></div>
                  <small style='text-align: left; font-size: 0.9em;'>
                    See: All Players can view
                    <br>
                    Edit: Controlling players can view and change
                  </small>
                </div>
                <div class='clear'></div>
              </div>
              <div class='span6'>
                <h4>Emits Light</h4>
                <div class='inlineinputs' style='margin-top: 5px; margin-bottom: 5px;'>
                  <input class='light_radius' type='text'>
                  <$!window.Campaign.activePage().get("scale_units")$>.
                  <input class='light_dimradius' type='text'>
                  <$!window.Campaign.activePage().get("scale_units")$>.
                  <input class='light_angle' placeholder='360' type='text'>
                  <span style='font-size: 2.0em;'>&deg;</span>
                </div>
                <span style='color: #888; padding-left: 5px;'>Light Radius / (optional) Start of Dim / Angle</span>
                <div class='inlineinputs' style='margin-top: 5px;'>
                  <label style='margin-left: 7px;'>
                    <input class='light_otherplayers' type='checkbox'>
                    All Players See Light
                  </label>
                </div>
                <div class='inlineinputs' style='margin-top: 2px;'>
                  <label style='margin-left: 7px;'>
                    <input class='light_hassight' type='checkbox'>
                    Has Sight
                  </label>
                  <span style="margin-left: 9px; margin-right: 28px;">/</span>
                  Angle:
                  <input class='light_losangle' placeholder='360' type='text'>
                  <span style='font-size: 2.0em;'>&deg;</span>
                </div>
                <div class='inlineinputs' style='margin-left: 90px; margin-top: 5px;'>
                  <span style="margin-left: 8px; margin-right: 12px;">/</span>
                  Multiplyer:
                  <input class='light_multiplier' placeholder='1.0' style='margin-right: 10px;' type='text'>x</input>
                </div>
                <h4>Advanced Fog of War</h4>
                <div class='inlineinputs' style='margin-top: 5px; margin-bottom: 5px;'>
                  <input class='advfow_viewdistance' type='text'>
                  <$!window.Campaign.activePage().get("scale_units")$>.
                </div>
                <span style='color: #888; padding-left: 5px;'>View Distance</span>
                <!-- %h4 -->
                <!-- Token Actions -->
                <!-- %a.pictos.showtip(style="margin-left: 15px; cursor: help; font-size: 1.1em; position: relative; top: -2px;" title="Choose from Macros and Abilities of linked Character to show when token is selected") ? -->
                <!-- %p -->
                <!-- %strong Add New Token Action: -->
                <!-- %br -->
                <!-- %select.chosen(placeholder="Choose from the list...") -->
                <!-- %option(value="") Choose from the list... -->
                <!-- <$ if(this.character) { $> -->
                <!-- <optgroup label="Abilities"> -->
                <!-- <$ this.character.abilities.each(function(abil) { $> -->
                <!-- <option value="ability|<$!abil.get('id')$>"><$!abil.get('name')$></option> -->
                <!-- <$ }); $> -->
                <!-- </optgroup> -->
                <!-- <$ } $> -->
              </div>
            </div>
          </div>
        </div>
      </div>
	</script>
	`;

	d20plus.template_pageSettings = `
	<script id="tmpl_pagesettings" type="text/html">
		<label style='padding-top: 4px;'>
			<strong>Page Size</strong>
		</label>
		X: <input type="number" class="width" style="width: 50px;" value="<$!this.model.get("width")$>" /> un. (<$!this.model.get("width") * 70$> px)
		<div style="margin-left: 110px; margin-top: 2px;">Y: <input type="number" class="height" style="width: 50px;" value="<$!this.model.get("height")$>" /> un. (<$!this.model.get("height") * 70$> px)</div>
		<small style='display: block; font-size: 0.9em; margin-left: 110px;'>width by height, 1 unit = 70 pixels</small>
		<div class='clear' style='height: 15px;'></div>
		<label style='margin-left: 55px; position: relative; top: 6px;'><strong>Scale:</strong> 1 unit =</label>
		<input type="number" class="scale_number" style="width: 35px;" value="<$!this.model.get("scale_number")$>" />
		<select class='scale_units' style='width: 65px; position: relative;'>
			<option value='ft'>ft.</option>
			<option value='m'>m.</option>
			<option value='km'>km.</option>
			<option value='mi'>mi.</option>
			<option value='in'>in.</option>
			<option value='cm'>cm.</option>
			<option value='un'>un.</option>
			<option value='hex'>hex</option>
			<option value='sq'>sq.</option>
			<option value='custom'>Custom...</option>
		</select>
		<div class='hidden' id='custom_scale_units'>
			<label style='margin-left: 55px; position: relative; top: 6px;'><strong>Custom Unit</strong></label>
			<input style='width: 60px;' type='text'>
		</div>
		<div class='clear' style='height: 15px;'></div>
		<label>
			<strong>Background</strong>
		</label>
		<input class='pagebackground' type='text'>
		
		<hr>
		
		<label style='position: relative; top: 8px;'>
			<strong>Grid</strong>
		</label>
		<label class='checkbox'>
			<input class='gridenabled' type='checkbox' value='1'>
			Enabled, Size:
		</label>
		<input type="number" class="snappingincrement" style="width: 35px;" value="<$!this.model.get("snapping_increment")$>" /> units
		<div class='clear' style='height: 7px;'></div>
		<label style='margin-left: 55px; position: relative; top: 4px;'>Type</label>
		<select id='gridtype' style='width: 100px;'>
			<option selected value='square'>Square</option>
			<option value='hex'>Hex (V)</option>
			<option value='hexr'>Hex (H)</option>
		</select>
		<div class='clear' style='height: 7px;'></div>
		<label class='checkbox' id='hexlabels' style='margin-left: 130px;'>
			<input class='gridlabels' type='checkbox' value='1'>&nbsp; Show Labels</input>
		</label>
		<div class='clear' style='height: 2px;'></div>
		<label style='margin-left: 55px; position: relative; top: 4px;'>
			<a class='showtip pictos' href='https://wiki.roll20.net/Ruler' target='_blank'>?</a>
			Measurement
		</label>
		<select id='diagonaltype' style='width: 100px;'>
			<option class='squareonly' selected value='foure'>D&D 5E/4E Compatible</option>
			<option class='squareonly' value='threefive'>Pathfinder/3.5E Compatible</option>
			<option class='squareonly' value='manhattan'>Manhattan</option>
			<option class='hexonly' value='hex'>Hex Path</option>
			<option value='pythagorean'>Euclidean</option>
		</select>
		<div class='clear' style='height: 10px;'></div>
		<label style='margin-left: 55px;'>Color</label>
		<input class='gridcolor' type='text'>
		<div class='clear' style='height: 7px;'></div>
		<label style='margin-left: 55px;'>Opacity</label>
		<div class='gridopacity'></div>
		<div class='clear' style='height: 10px'></div>
		
		<hr>
		
		<label style='position: relative; top: -2px;'>
			<strong>Fog of War</strong>
		</label>
		<label class='checkbox'>
			<input class='darknessenabled' type='checkbox' value='1'>&nbsp; Enabled</input>
		</label>
		
		<hr>
		
		<label style='position: relative; top: -2px;'>
			<strong>Weather</strong>
		</label>
		<button class='btn Ve-btn-weather'>
			Configure
		</button>
		
		<hr>
		
		<strong style="display: block;"><i>Requires a paid subscription or all players to use a betteR20 script</i></strong>
		<label style='position: relative; top: 3px; width: 85px; padding-left: 15px;'>
			<strong>Advanced Fog of War</strong>
		</label>
		<label class='checkbox'>
			<input class='advancedfowenabled showtip' style='margin-top: 8px; margin-bottom: 8px;' type='checkbox' value='1'>&nbsp; Enabled</input>
		</label>
		<span class='no_grid' style='display: none;'>
			, Size:
			<input type="number" class="advancedfowgridsize" style="width: 30px;" value="<$!this.model.get("adv_fow_grid_size")$>" /> units
		</span>
		<br>
		<label class='checkbox'>
			<input class='advancedfowshowgrid showtip' title='By default the Advanced Fog of War hides the map grid anywhere revealed but the player can no longer see because of Dynamic Lighting. This option makes the grid always visible.' type='checkbox' value='1'>&nbsp; Show Grid</input>
		</label>
		<br>
		<label class='checkbox' style='margin-left: 110px;'>
			<input class='dimlightreveals showtip' title='By default the Advanced Fog of War will not be permanently revealed by Dynamic Lighting that is not bright. This option allows dim lighting to also reveal the fog.' type='checkbox' value='1'>&nbsp; Dim Light Reveals</input>
		</label>
		<br>
		<br>
		<label style='position: relative; top: -2px;'>
			<strong>Dynamic Lighting</strong>
		</label>
		<label class='checkbox'>
			<input class='lightingenabled showtip' type='checkbox' value='1'>&nbsp; Enabled</input>
		</label>
		<br>
		<label class='checkbox'>
			<input class='lightenforcelos showtip' title="Player's line of sight set by what tokens they can control." type='checkbox' value='1'>&nbsp; Enforce Line of Sight</input>
		</label>
		<br>
		<br>
		<label class='checkbox' style='margin-left: 110px;'>
			<input class='lightingupdate' type='checkbox' value='1'>&nbsp; Only Update on Drop</input>
		</label>
		<br>
		<label class='checkbox' style='margin-left: 110px;'>
			<input class='lightrestrictmove' title="Don't allow player tokens to move through Dynamic Lighting walls. Can be enabled even if lighting is not used." type='checkbox' value='1'>&nbsp; Restrict Movement</input>
		</label>
		<br>
		<label class='checkbox' style='margin-left: 110px;'>
			<input class='lightglobalillum' title='Instead of darkness show light in all places players can see.' type='checkbox' value='1'>&nbsp; Global Illumination</input>
		</label>
		<hr>
		<label style='font-weight: bold;'>GM Opacity</label>
		<div class='fogopacity'></div>
		<div class='clear'></div>
		
		<hr>
		
		<label style='font-weight: bold;'>Play on Load</label>
		<select class='pagejukeboxtrigger' style='width: 180px;'></select>
		<div class='clear'></div>
		
		<hr>
		
		<button class='delete btn btn-danger' style='float: right;'>
			Delete Page
		</button>
		<button class='archive btn'>
			Archive Page
		</button>
		<div class='clear'></div>
	</script>
	`;

	d20plus.template_actionsMenu = `
		<script id='tmpl_actions_menu' type='text/html'>
			<div class='actions_menu d20contextmenu'>
				<ul>
					<$ if (Object.keys(this).length === 0) { $>
						<li data-action-type='unlock-tokens'>Unlock...</li>
					<$ } $>
					<$ if(this.view && this.view.graphic.type == "image" && this.get("cardid") !== "") { $>
						<li class='head hasSub' data-action-type='takecard'>Take Card</li>
						<li class='head hasSub' data-action-type='flipcard'>Flip Card</li>
					<$ } $>
					<$ if(window.is_gm) { $>
						<$ if(this.view && this.get("isdrawing") === false && window.currentEditingLayer != "map") { $>
							<!-- BEGIN MOD -->
							<li class='head hasSub' data-menuname='massroll'>
								Mass Roll &raquo;
								<ul class='submenu' data-menuname='massroll'>
									<li class='head hasSub' data-action-type='rollinit'>Initiative</li>
									<li class='head hasSub' data-action-type='rollsaves'>Save</li>
									<li class='head hasSub' data-action-type='rollskills'>Skill</li>
								</ul>
							</li>
							<!-- END MOD -->
							<li class='head hasSub' data-action-type='addturn'>Add Turn</li>
						<$ } $>
						<!-- BEGIN MOD -->
						<!-- <li class='head'>Edit</li> -->
						<!-- END MOD -->
						<$ if(this.view) { $>
							<li data-action-type='delete'>Delete</li>
							<li data-action-type='copy'>Copy</li>
						<$ } $>
						<li data-action-type='paste'>Paste</li>
						<!-- BEGIN MOD -->
						<$ if(!this.view) { $>
							<li data-action-type='undo'>Undo</li>
						<$ } $>
						<!-- END MOD -->
						
						<!-- BEGIN MOD -->          
						<$ if(this.view) { $>
							<li class='head hasSub' data-menuname='move'>
							Move &raquo;
								<ul class='submenu' data-menuname='move'>
									<li data-action-type='tofront'>To Front</li>
									<li data-action-type='forward-one'>Forward One<!-- (B-F)--></li>
									<li data-action-type='back-one'>Back One<!-- (B-B)--></li>
									<li data-action-type='toback'>To Back</li>    
								</ul>
							</li>
						<$ } $>
						
						<$ if(this.get && this.get("type") == "image") { $>
							<li class='head hasSub' data-menuname='VeUtil'>
								Utilities &raquo;
								<ul class='submenu' data-menuname='VeUtil'>
									<li data-action-type='token-fly'>Set&nbsp;Flight&nbsp;Height</li>        
									<li data-action-type='token-light'>Set&nbsp;Light</li>
								</ul>
							</li>        
						<$ } $>      
						<!-- END MOD -->
						
						<li class='head hasSub' data-menuname='advanced'>
							Advanced &raquo;
							<ul class='submenu' data-menuname='advanced'>
								<li data-action-type='group'>Group</li>
								<li data-action-type='ungroup'>Ungroup</li>
								<$ if(this.get && this.get("type") == "image") { $>
									<li class="<$ if (this && this.get("isdrawing")) { $>active<$ } $>" data-action-type="toggledrawing">Is Drawing</li>
									<li class="<$ if (this && this.get("fliph")) { $>active<$ } $>" data-action-type="togglefliph">Flip Horizontal</li>
									<li class="<$ if (this && this.get("flipv")) { $>active<$ } $>" data-action-type="toggleflipv">Flip Vertical</li>
									<li data-action-type='setdimensions'>Set Dimensions</li>
									<$ if(window.currentEditingLayer == "map") { $>
										<li data-action-type='aligntogrid'>Align to Grid</li>
									<$ } $>
								<$ } $>
								
								<$ if(this.view) { $>
									<li data-action-type='lock-token'>Lock Position</li>
								<$ } $>
								
								<$ if(this.get && this.get("type") == "image") { $>
									<li data-action-type='copy-tokenid'>View Token ID</li>
								<$ } $>
							</ul>
						</li>

						<li class='head hasSub' data-menuname='positioning'>
							Layer &raquo;
							<ul class='submenu' data-menuname='positioning'>
								<li data-action-type="tolayer_map" class='<$ if(this && this.get && this.get("layer") == "map") { $>active<$ } $>'>Map Layer</li>
								<li data-action-type="tolayer_objects" class='<$ if(this && this.get && this.get("layer") == "objects") { $>active<$ } $>'>Token Layer</li>
								<!-- BEGIN MOD -->
								<li data-action-type="tolayer_foreground" class='<$ if(this && this.get && this.get("layer") == "foreground") { $>active<$ } $>'>Foreground Layer</li>
								<!-- END MOD -->
								<li data-action-type="tolayer_gmlayer" class='<$ if(this && this.get && this.get("layer") == "gmlayer") { $>active<$ } $>'>GM Layer</li>
								<li data-action-type="tolayer_walls" class='<$ if(this && this.get && this.get("layer") == "walls") { $>active<$ } $>'>Lighting Layer</li>
								<!-- BEGIN MOD -->
								<li data-action-type="tolayer_weather" class='<$ if(this && this.get && this.get("layer") == "weather") { $>active<$ } $>'>Weather Layer</li>
								<!-- END MOD -->
							</ul>
						</li>
					<$ } $>

					<$ if(this.view && this.get && this.get("sides") !== "" && this.get("cardid") === "") { $>
						<li class='head hasSub' data-menuname='mutliside'>
							Multi-Sided &raquo;
							<ul class='submenu' data-menuname='multiside'>
								<li data-action-type='side_random'>Random Side</li>
								<li data-action-type='side_choose'>Choose Side</li>
								<li data-action-type='rollertokenresize'>Set Side Size</li>
							</ul>
						</li>
					<$ } $>
				</ul>
			</div>
		</script>
		`;

	d20plus.template_charactereditor = `
 <script id='tmpl_charactereditor' type='text/html'>
     <div class='dialog largedialog charactereditor' style='display: block;'>
        <div class='tab-content'>
          <div class='bioinfo tab-pane'>
            <div class='row-fluid'>
              <div class='span5'>
                <label>
                  <strong>Avatar</strong>
                </label>
                <$ if(true) { $>
                <div class="avatar dropbox <$! this.get("avatar") != "" ? "filled" : "" $>" style="width: 95%;">
                <div class="status"></div>
                <div class="inner">
                <$ if(this.get("avatar") == "") { $>
                <h4 style="padding-bottom: 0px; marigin-bottom: 0px; color: #777;">Drop a file<small>(JPG, PNG, GIF)</small></h4>
                <br /> or
                <button class="btn">Choose a file...</button>
                <input class="manual" type="file" />
                <$ } else { $>
                <img src="<$!this.get("avatar")$>" draggable="false" />
                <div class='remove'><a href='#'>Remove</a></div>
                <$ } $>
                </div>
                </div>
                <$ } else { $>
                <div class='avatar'>
                <$ if(this.get("avatar") != "") { $>
                <img src="<$!this.get("avatar")$>" draggable="false" />
                <$ } $>
                </div>
                <$ } $>
                <div class='clear'></div>
                <!-- BEGIN MOD -->
                <button class="btn character-image-by-url">Set Image from URL</button>
                <div class='clear'></div>
                <!-- END MOD -->
                <$ if (window.is_gm) { $>
                <label>
                  <strong>Default Token (Optional)</strong>
                </label>
                <div class="defaulttoken tokenslot <$! this.get("defaulttoken") !== "" ? "filled" : "" $> style="width: 95%;">
                <$ if(this.get("defaulttoken") !== "") { $>
                <img src="" draggable="false" />
                <div class="remove"><a href="#">Remove</a></div>
                <$ } else { $>
                <button class="btn">Use Selected Token</button>
                <small>Select a token on the tabletop to use as the Default Token</small>
                <$ } $>
                </div>
                <!-- BEGIN MOD -->
                <button class="btn token-image-by-url">Set Token Image from URL</button>
                <small style="text-align: left;">(Update will only be visible upon re-opening the sheet)</small>
                <div class='clear'></div>
                <!-- END MOD -->
                <$ } $>
              </div>
              <div class='span7'>
                <label>
                  <strong>Name</strong>
                </label>
                <input class='name' type='text'>
                <div class='clear'></div>
                <$ if(window.is_gm) { $>
                <label>
                  <strong>In Player's Journals</strong>
                </label>
                <select class='inplayerjournals chosen' multiple='true' style='width: 100%;'>
                  <option value="all">All Players</option>
                  <$ window.Campaign.players.each(function(player) { $>
                  <option value="<$!player.id$>"><$!player.get("displayname")$></option>
                  <$ }); $>
                </select>
                <div class='clear'></div>
                <label>
                  <strong>Can Be Edited &amp; Controlled By</strong>
                </label>
                <select class='controlledby chosen' multiple='true' style='width: 100%;'>
                  <option value="all">All Players</option>
                  <$ window.Campaign.players.each(function(player) { $>
                  <option value="<$!player.id$>"><$!player.get("displayname")$></option>
                  <$ }); $>
                </select>
                <div class='clear'></div>
                <label>
                  <strong>Tags</strong>
                </label>
                <input class='tags'>
                <div class='clear'></div>
                <hr>
                <button class='delete btn btn-danger' style='float: right;'>
                  Delete
                </button>
                <button class='duplicate btn' style='margin-right: 10px;'>
                  Duplicate
                </button>
                <button class='archive btn'>
                  <$ if(this.get("archived")) { $>Restore from Archive<$ } else { $>Archive<$ } $>
                </button>
                <div class='clear'></div>
                <$ } $>
                <div class='clear'></div>
              </div>
            </div>
            <div class='row-fluid'>
              <div class='span12'>
                <hr>
                <label>
                  <strong>Bio & Info</strong>
                </label>
                <textarea class='bio'></textarea>
                <div class='clear'></div>
                <$ if(window.is_gm) { $>
                <label>
                  <strong>GM Notes (Only visible to GM)</strong>
                </label>
                <textarea class='gmnotes'></textarea>
                <div class='clear'></div>
                <$ } $>
              </div>
            </div>
          </div>
        </div>
      </div>
    </script>		
		`;

	d20plus.template_handouteditor = `
			<script id='tmpl_handouteditor' type='text/html'>
      <div class='dialog largedialog handouteditor' style='display: block;'>
        <div class='row-fluid'>
          <div class='span12'>
            <label>
              <strong>Name</strong>
            </label>
            <input class='name' type='text'>
            <div class='clear'></div>
            <$ if (window.is_gm) { $>
            <label>
              <strong>In Player's Journals</strong>
            </label>
            <select class='inplayerjournals chosen' multiple='true' style='width: 100%;'>
              <option value="all">All Players</option>
              <$ window.Campaign.players.each(function(player) { $>
              <option value="<$!player.id$>"><$!player.get("displayname")$></option>
              <$ }); $>
            </select>
            <div class='clear'></div>
            <label>
              <strong>Can Be Edited By</strong>
            </label>
            <select class='controlledby chosen' multiple='true' style='width: 100%;'>
              <option value="all">All Players</option>
              <$ window.Campaign.players.each(function(player) { $>
              <option value="<$!player.id$>"><$!player.get("displayname")$></option>
              <$ }); $>
            </select>
            <div class='clear'></div>
            <label>
              <strong>Tags</strong>
            </label>
            <input class='tags'>
            <div class='clear'></div>
            <$ } $>
          </div>
        </div>
        <div class='row-fluid'>
          <div class='span12'>
            <div class="avatar dropbox <$! this.get("avatar") != "" ? "filled" : "" $>">
            <div class="status"></div>
            <div class="inner">
            <$ if(this.get("avatar") == "") { $>
            <h4 style="padding-bottom: 0px; marigin-bottom: 0px; color: #777;">Drop a file</h4>
            <br /> or
            <button class="btn">Choose a file...</button>
            <input class="manual" type="file" />
            <$ } else { $>
            <img src="<$!this.get("avatar")$>" />
            <div class='remove'><a href='#'>Remove</a></div>
            <$ } $>
            </div>
            </div>
            <div class='clear'></div>
          </div>
        </div>
        <!-- BEGIN MOD -->
        <div class='row-fluid'>
		<button class="btn handout-image-by-url">Set Image from URL</button>
		<div class='clear'></div>
		</div>
		<!-- END MOD -->
        <div class='row-fluid'>
          <div class='span12'>
            <label>
              <strong>Description & Notes</strong>
            </label>
            <textarea class='notes'></textarea>
            <div class='clear'></div>
            <$ if(window.is_gm) { $>
            <label>
              <strong>GM Notes (Only visible to GM)</strong>
            </label>
            <textarea class='gmnotes'></textarea>
            <div class='clear'></div>
            <hr>
            <button class='delete btn btn-danger' style='float: right;'>
              Delete Handout
            </button>
            <button class='archive btn'>
              <$ if(this.get("archived")) { $>Restore Handout from Archive<$ } else { $>Archive Handout<$ } $>
            </button>
            <div class='clear'></div>
            <$ } $>
          </div>
        </div>
      </div>
    </script>
	`;
};

SCRIPT_EXTENSIONS.push(baseTemplate);
