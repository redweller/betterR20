function initHTMLroll20EditorsMisc () {
	d20plus.html = d20plus.html || {};

	d20plus.html.characterEditor = `
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
									<h4 style="padding-bottom: 0px; marigin-bottom: 0px; color: #777;">Drop a file from your <br>Art Library or computer<small>(JPG, GIF, PNG, WEBM, WP4)</small></h4>
									<br /> or
									<button class="btn">Click to Upload</button>
									<input class="manual" type="file" />
									<$ } else { $>
									<$ if(/.+\\.webm(\\?.*)?$/i.test(this.get("avatar"))) { $>
									<video src="<$!this.get("avatar")$>" draggable="false" muted autoplay loop />
									<$ } else { $>
									<img src="<$!this.get("avatar")$>" draggable="false" />
									<$ } $>
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
							<div class="defaulttoken tokenslot <$! this.get("defaulttoken") !== "" ? "filled" : "" $> style=" width: 95%;">
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
							<select class='inplayerjournals selectize' multiple='true' style='width: 100%;'>
								<option value="all">All Players</option>
								<$ window.Campaign.players.each(function(player) { $>
								<option value="<$!player.id$>"><$!player.get("displayname")$></option>
								<$ }); $>
							</select>
							<div class='clear'></div>
							<label>
								<strong>Can Be Edited &amp; Controlled By</strong>
							</label>
							<select class='controlledby selectize' multiple='true' style='width: 100%;'>
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

	d20plus.html.handoutEditor = `
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
							<$ if(/.+\\.webm(\\?.*)?$/i.test(this.get("avatar"))) { $>
							<video src="<$!this.get("avatar")$>" draggable="false" muted autoplay loop />
							<$ } else { $>
							<img src="<$!this.get("avatar")$>" />
							<$ } $>
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
					<button class='duplicate btn' style='margin-right: 10px;'>
						Duplicate
					</button>
					<button class='archive btn'>
						<$ if(this.get("archived")) { $>Restore Handout from Archive<$ } else { $>Archive<$ } $>
					</button>
					<div class='clear'></div>
					<$ } $>
				</div>
			</div>
		</div>
	</script>
	<script id='tmpl_handoutviewer' type='text/html'>
		<div class='dialog largedialog handoutviewer' style='display: block;'>
			<div style='padding: 10px;'>
				<$ if(this.get("avatar") != "") { $>
				<div class='row-fluid'>
					<div class='span12'>
						<div class='avatar'>
							<a class="lightly" target="_blank" href="<$!(this.get("avatar").indexOf("d20.io/") !== -1 ? this.get("avatar").replace(/\\/med\\.(?!webm)/, "/max.") : this.get("avatar"))$>">
								<$ if(/.+\\.webm(\\?.*)?$/i.test(this.get("avatar"))) { $>
								<video src="<$!this.get("avatar")$>" draggable="false" loop muted autoplay />
								<$ } else { $>
								<img src="<$!this.get("avatar")$>" draggable="false" />
								<$ } $>
								<div class='mag-glass pictos'>s</div>
							</a>
							</a>
						</div>
						<div class='clear'></div>
					</div>
				</div>
				<$ } $>
				<div class='row-fluid'>
					<div class='span12'>
						<div class='content note-editor notes'></div>
						<div class='clear'></div>
					</div>
				</div>
				<$ if(window.is_gm) { $>
				<div class='row-fluid'>
					<div class='span12'>
						<hr>
						<label>
							<strong>GM Notes (Only visible to GM)</strong>
						</label>
						<div class='content note-editor gmnotes'></div>
						<div class='clear'></div>
					</div>
				</div>
				<$ } $>
			</div>
		</div>
	</script>
	`;

	d20plus.html.deckEditor = `
	<script id='tmpl_deckeditor' type='text/html'>
		<div class='dialog largedialog deckeditor' style='display: block;'>
			<label>Name</label>
			<input class='name' type='text'>
			<div class='clear' style='height: 14px;'></div>
			<label>
				<input class='showplayers' type='checkbox'>
				Show deck to players?
			</label>
			<div class='clear' style='height: 7px;'></div>
			<label>
				<input class='playerscandraw' type='checkbox'>
				Players can draw cards?
			</label>
			<div class='clear' style='height: 7px;'></div>
			<label>
				<input class='infinitecards' type='checkbox'>
				Cards in deck are infinite?
			</label>
			<p class='infinitecardstype'>
				<label>
					<input name='infinitecardstype' type='radio' value='random'>
					Always a random card
				</label>
				<label>
					<input name='infinitecardstype' type='radio' value='cycle'>
					Draw through deck, shuffle, repeat
				</label>
			</p>
			<div class='clear' style='height: 7px;'></div>
			<label>
				Allow choosing specific cards from deck:
				<select class='deckpilemode'>
					<option value='none'>Disabled</option>
					<option value='choosebacks_gm'>GM Choose: Show Backs</option>
					<option value='choosefronts_gm'>GM Choose: Show Fronts</option>
					<option value='choosebacks'>GM + Players Choose: Show Backs</option>
					<option value='choosefronts'>GM + Players Choose: Show Fronts</option>
				</select>
			</label>
			<div class='clear' style='height: 7px;'></div>
			<label>
				Discard Pile:
				<select class='discardpilemode'>
					<option value='none'>No discard pile</option>
					<option value='choosebacks'>Choose: Show Backs</option>
					<option value='choosefronts'>Choose: Show Fronts</option>
					<option value='drawtop'>Draw most recent/top card</option>
					<option value='drawbottom'>Draw oldest/bottom card</option>
				</select>
			</label>
			<div class='clear' style='height: 7px;'></div>
			<hr>
			<strong>When played to the tabletop...</strong>
			<div class='clear' style='height: 5px;'></div>
			<label>
				Played Facing:
				<select class='cardsplayed' style='display: inline-block; width: auto; position: relative; top: 3px;'>
					<option value='facedown'>Face Down</option>
					<option value='faceup'>Face Up</option>
				</select>
			</label>
			<div class='clear' style='height: 7px;'></div>
			<label>
				Considered:
				<select class='treatasdrawing' style='display: inline-block; width: auto; position: relative; top: 3px;'>
					<option value='true'>Drawings (No Bubbles/Stats)</option>
					<option value='false'>Tokens (Including Bubbles and Stats)</option>
				</select>
			</label>
			<div class='clear' style='height: 7px;'></div>
			<div class='inlineinputs'>
				Card Size:
				<input class='defaultwidth' type='text'>
				x
				<input class='defaultheight' type='text'>
				px
			</div>
			<small style='text-align: left; padding-left: 135px; width: auto;'>Leave blank for default auto-sizing</small>
			<div class='clear' style='height: 7px;'></div>
			<!-- %label -->
			<!-- %input.showalldrawn(type="checkbox") -->
			<!-- Everyone sees what card is drawn onto top of deck? -->
			<!-- .clear(style="height: 7px;") -->
			<hr>
			<strong>In other's hands...</strong>
			<div class='clear' style='height: 5px;'></div>
			<div class='inlineinputs'>
				<label style='width: 75px;'>Players see:</label>
				<label>
					<input class='players_seenumcards' type='checkbox'>
					Number of Cards
				</label>
				<label>
					<input class='players_seefrontofcards' type='checkbox'>
					Front of Cards
				</label>
			</div>
			<div class='clear' style='height: 5px;'></div>
			<div class='inlineinputs'>
				<label style='width: 75px;'>GM sees:</label>
				<label>
					<input class='gm_seenumcards' type='checkbox'>
					Number of Cards
				</label>
				<label>
					<input class='gm_seefrontofcards' type='checkbox'>
					Front of Cards
				</label>
			</div>
			<div class='clear' style='height: 5px;'></div>
			<hr>
			<!-- BEGIN MOD -->
			<button class='btn deck-mass-cards-by-url' style='float: right; margin-left: 5px;' data-deck-id="<$!this.id$>">
				Add Cards from URLs
			</button>
			<!-- END MOD -->
			<button class='addcard btn' style='float: right;'>
				<span class='pictos'>&</span>
				Add Card
			</button>
			<h3>Cards</h3>
			<div class='clear' style='height: 7px;'></div>
			<table class='table table-striped'>
				<tbody></tbody>
			</table>
			<div class='clear' style='height: 15px;'></div>
			<label>
				<strong>Card Backing (Required)</strong>
			</label>
			<div class='clear' style='height: 7px;'></div>
			<!-- BEGIN MOD -->
			<button class='btn deck-image-by-url' style="margin-bottom: 10px" data-deck-id="<$!this.id$>">Set image from URL...</button>
			<!-- END MOD -->
			<div class="avatar dropbox <$! this.get("avatar") != "" ? "filled" : "" $>">
				<div class='status'></div>
				<div class='inner'></div>
				<$ if(this.get("avatar") == "") { $>
				<h4 style='padding-bottom: 0px; marigin-bottom: 0px; color: #777;'>Drop a file</h4>
				<br>or</br>
				<button class='btn'>Choose a file...</button>
				<input class='manual' type='file'>
				<$ } else { $>
				<img src="<$!this.get("avatar")$>" />
				<div class='remove'>
					<a href='javascript:void(0);'>Remove</a>
				</div>
				<$ } $>
			</div>
		</div>
		<div class='clear' style='height: 20px;'></div>
		<p style='float: left;'>
			<button class='btn dupedeck'>Duplicate Deck</button>
		</p>
		<$ if(this.id != "A778E120-672D-49D0-BAF8-8646DA3D3FAC") { $>
		<p style='text-align: right;'>
			<button class='btn btn-danger deletedeck'>Delete Deck</button>
		</p>
		<$ } $>
		</div>
	</script>
	`;

	d20plus.html.cardEditor = `
	<script id='tmpl_cardeditor' type='text/html'>
		<div class='dialog largedialog cardeditor' style='display: block;'>
			<label>Name</label>
			<input class='name' type='text'>
			<div class='clear'></div>
			<!-- BEGIN MOD -->
			<button class='btn card-image-by-url' style="margin-bottom: 10px" data-card-id="<$!this.id$>">Set image from URL...</button>
			<!-- END MOD -->
			<div class="avatar dropbox <$! this.get("avatar") != "" ? "filled" : "" $>">
				<div class="status"></div>
				<div class="inner">
					<$ if(this.get("avatar") == "") { $>
					<h4 style='padding-bottom: 0px; marigin-bottom: 0px; color: #777;'>Drop a file</h4>
					<br>or</br>
					<button class='btn'>Choose a file...</button>
					<input class='manual' type='file'>
					<$ } else { $>
					<img src="<$!this.get("avatar")$>" />
					<div class='remove'>
						<a href='javascript:void(0);'>Remove</a>
					</div>
					<$ } $>
				</div>
			</div>
			<div class='clear'></div>
			<label>&nbsp;</label>
			<button class='deletecard btn btn-danger'>Delete Card</button>
		</div>
	</script>
	`;
}

SCRIPT_EXTENSIONS.push(initHTMLroll20EditorsMisc);
