function baseToolAnimator () {
	d20plus.anim = {
		Nop: function () {

		},
		Move: function (startTime, duration, x, y, z) {
			// TODO
		},
		Copy: function (startTime, childAnimation = false) {
			// TODO
		},
		Rotate: function (startTime, duration, degrees) {
			// TODO
		},
		Flip: function (startTime, isHorizontal, isVertical) {
			// TODO
		},
		Scale: function (startTime, duration, scaleFactor) {
			// TODO
		},
		Layer: function (startTime, layer) {
			// TODO
		},
		SetProperty: function (startTime, prop, value) {
			// TODO
		},
		Lighting: function (startTime, duration, lightRadius, dimStart, degrees) {
			// TODO
		},
		TriggerMacro: function (startTime, macroName) {
			// TODO
		},
		TriggerAnimation: function (startTime, animationName) {
			// TODO
		}
	};

	d20plus.tool.tools.push({
		name: "Token Animator",
		desc: "Manage token animations",
		html: `
			<div id="d20plus-token-animator" title="Token Animator" class="anm__win">
				<p>
					<button class="btn" name="btn-add">Add</button>
					<button class="btn" name="btn-import">Import</button>
					<button class="btn" name="btn-rescue">Rescue</button>
				</p>
				
				<div class="anm__wrp-sel-all">
					<label class="flex-label"><input type="checkbox" title="Select all" name="cb-all" class="mr-2"> <span>Select All</span></label>
					<div>
						<button class="btn" name="btn-active">Toggle Selected Active</button>
						<button class="btn" name="btn-inactive">Toggle Selected Inactive</button>
						<button class="btn" name="btn-export">Export Selected</button>
						<button class="btn btn-danger" name="btn-delete">Delete Selected</button>
					</div>
				</div>
				
				<div id="token-animator-list-container">
					<input class="search" autocomplete="off" placeholder="Search list..." style="width: 100%;">
					<br><br>
					<ul class="list" style="max-height: 420px; overflow-y: auto; display: block; margin: 0;"></ul>
				</div>
			</div>
			
			<div id="d20plus-token-animator-rescue" title="Token Rescue" class="anm__win">
				<p>
					<button class="btn" name="btn-refresh">Refresh</button>
				</p>
				
				<p class="anm__wrp-sel-all">
					<label class="flex-label"><input type="checkbox" title="Select all" name="cb-all" class="mr-2"> <span>Select All</span></label> 
					<button class="btn" name="btn-rescue">Rescue Selected</button>
				</p>
				
				<div id="token-animator-rescue-list-container">
					<input class="search" autocomplete="off" placeholder="Search list..." style="width: 100%;">
					<br><br>
					<ul class="list" style="max-height: 420px; overflow-y: auto; display: block; margin: 0;"></ul>
				</div>
			</div>
			
			<div id="d20plus-token-animator-editor" title="Animation Editor" class="anm__win flex-col">
				<div class="mb-2 no-shrink split">
					<input name="ipt-name" placeholder="Name">
					
					<div>
						<button class="btn" name="btn-save">Save</button>
						<button class="btn" name="btn-help">View Help</button>
						<button class="btn" name="btn-export-file">Export to File</button>
						<button class="btn" name="btn-validate">Validate</button>
					</div>
				</div>
				<div class="anm-edit__ipt-lines-wrp">
					<textarea name="ipt-lines" placeholder="mv 0 100 50 -50" class="anm-edit__ipt-lines"></textarea>
				</div>
			</div>
		`,
		dialogFn () {
			$("#d20plus-token-animator").dialog({
				autoOpen: false,
				resizable: true,
				width: 800,
				height: 600,
			}).data("initialised", false);

			$("#d20plus-token-animator-rescue").dialog({
				autoOpen: false,
				resizable: true,
				width: 800,
				height: 600,
			});

			$("#d20plus-token-animator-editor").dialog({
				autoOpen: false,
				resizable: true,
				width: 800,
				height: 600,
			});

			// FIXME temp code; remove
			window.addEventListener("keypress", (evt) => {
				if (evt.shiftKey && !evt.ctrlKey) {
					if (evt.key === "G") this.openFn();
				}
			})
		},
		openFn () {
			this.$win = this.$win || $("#d20plus-token-animator");
			if (!this.$win.data("initialised")) this._init();
			this.$win.dialog("open");
		},
		__doSaveState () {
			Campaign.save({
				bR20tool__anim_id: this._animId,
				bR20tool__anim_anims: this._anims,
			});
		},
		_doLoadState () {
			this._animId = Campaign.attributes.bR20tool__anim_id || 1;
			this._anims = Campaign.attributes.bR20tool__anim_anims || [];
		},
		_init () {
			window._B20ANIM = this; // debug use only

			this._doLoadState();
			this._doSaveStateDebounced = MiscUtil.debounce(this.__doSaveState, 100);

			this._$winRescue = $(`#d20plus-token-animator-rescue`);
			this._$winEditor = $(`#d20plus-token-animator-editor`);

			this._initMain();
			this._initRescue();
			this._initEditor();
			this.$win.data("initialised", true);
		},
		_initMain () {
			const $btnAdd = this.$win.find(`[name="btn-add"]`);
			const $btnImport = this.$win.find(`[name="btn-import"]`);
			const $btnRescue = this.$win.find(`[name="btn-rescue"]`);

			const $btSelActivate = this.$win.find(`[name="btn-active"]`);
			const $btSelDeactivate = this.$win.find(`[name="btn-inactive"]`);
			const $btnSelExport = this.$win.find(`[name="btn-export"]`);
			const $btnSelDelete = this.$win.find(`[name="btn-delete"]`);

			const $cbAll = this.$win.find(`[name="cb-all"]`);
			this._$list = this.$win.find(`.list`);

			$btnAdd.click(() => this.__addAnim(this.__getNewAnim()));

			$btnImport.click(() => {
				// TODO
			});

			$btnRescue.click(() => {
				this._$winRescue.dialog("open");
			});

			const getSelButtons = ofClass => {
				return this._animList.items
					.map(it => $(it.elm))
					.filter($it => $it.find(`input`).prop("checked"))
					.map($it => $it.find(`.${ofClass}`));
			};

			const doSetSelActiveInactive = val => {
				getSelButtons(`anm__btn-active`).forEach($btn => {
					if (val) if (!$btn.hasClass("btn-info")) $btn.click();
					else if ($btn.hasClass("btn-info")) $btn.click();
				});
			};

			$btSelActivate.click(() => doSetSelActiveInactive(true));

			$btSelDeactivate.click(() => doSetSelActiveInactive(false));

			$btnSelExport.click(() => {
				// TODO collect all; convert to JSON; download
			});

			$cbAll.click(() => {
				const val = $cbAll.prop("checked");
				this._animList.items.forEach(it => {
					$(it.elm.children[0].children[0]).prop("checked", val);
				})
			});

			$btnSelDelete.click(() => confirm("Are you sure?") && getSelButtons(`.anm__btn-delete`).forEach($btn => $btn.click()));

			this._anims.forEach(anim => {
				this._$list.append(this.__getAnimListRow(anim));
			});

			this._animList = new List("token-animator-list-container", {
				valueNames: ["name", "uid"]
			});

		},
		__addAnim (anim) {
			const lastSearch = ListUtil.getSearchTermAndReset(this._animList);
			this._anims.push(anim);
			this._$list.append(this.__getAnimListRow(anim));

			this._animList.reIndex();
			if (lastSearch) this._animList.search(lastSearch);
			this._animList.sort("name");

			this._doSaveStateDebounced();
		},
		__getNewAnim () {
			let nxtName = "new_animation";
			let suffix = 1;
			while (this._anims.find(it => it.name === nxtName)) nxtName = `new_animation_${suffix++}`;
			return {
				uid: this._animId++,
				name: nxtName,
				active: true,
				lines: []
			}
		},
		__getAnimListRow (anim) {
			const setActive = val => {
				val = !!val;
				anim.active = val;
				$btnActive.toggleClass("btn-info", val);
				this._doSaveStateDebounced();
			};

			const $name = $(`<div class="name readable col-8 clickable" title="Edit Animation">${anim.name}</div>`)
				.click(evt => {
					evt.stopPropagation();
					this.__edit(anim);
				});

			const $btnDuplicate = $(`<div class="btn anm__row-btn pictos mr-2" title="Duplicate">F</div>`)
				.click(evt => {
					evt.stopPropagation();
					const copy = MiscUtil.copy(anim);
					copy.name = `${copy.name}_copy`;
					copy.uid = this._animId++;
					this.__addAnim(copy);
				});
			const $btnExport = $(`<div class="btn anm__row-btn pictos mr-2" title="Export to File">I</div>`)
				.click(evt => {
					evt.stopPropagation();
					// TODO convert to JSON; download
				});
			const $btnActive = $(`<div class="btn anm__row-btn pictos ${anim.active ? "btn-info" : ""} anm__btn-active mr-2" title="Toggle Active">e</div>`)
				.click(evt => {
					evt.stopPropagation();
					setActive(!anim.active);
					this._doSaveStateDebounced();
				});
			const $btnDelete = $(`<div class="btn anm__row-btn btn-danger pictos anm__btn-delete mr-2" title="Delete">#</div>`)
				.click(evt => {
					evt.stopPropagation();
					const ix = this._anims.indexOf(anim);
					if (~ix) {
						this._anims.splice(ix, 1);
						this._animList.remove("uid", anim.uid);
						this._doSaveStateDebounced();
					} else throw new Error(`Could not find animation in list!`);
				});

			return $$`<label class="import-cb-label anm__row">
				<div class="col-1 anm__row-wrp-cb"><input type="checkbox"></div>
				${$name}
				<div class="anm__row-controls col-3 text-center"">
					${$btnDuplicate}
					${$btnExport}
					${$btnActive}
					${$btnDelete}
				</div>
				<div class="hidden uid">${anim.uid}</div>
			</label>`;
		},
		_initRescue () {
			// TODO a tool for rescuing tokens which have been moved off the map
		},
		_initEditor () {
			this._$ed_iptName = this.$win.find(`[name="ipt-name"]`).disableSpellcheck();
			this._$ed_btnSave = this.$win.find(`[name="btn-save"]`);
			this._$ed_btnHelp = this.$win.find(`[name="btn-help"]`);
			this._$ed_btnExportFile = this.$win.find(`[name="btn-export-file"]`);
			this._$ed_btnValidate = this.$win.find(`[name="btn-validate"]`);
			this._$ed_iptLines = this.$win.find(`[name="ipt-lines"]`);

			this._$ed_btnHelp.click(() => {
				// TODO link to a wiki page
				alert("Coming soon to a Wiki near you");

			});
		},
		__edit (anim) {
			anim.lines = anim.lines || [];

			this._$winEditor.dialog("open");
			const $iptLines = this._$winEditor.find(`[name="ipt-lines"]`);
			$iptLines.val(anim.lines.join("\n"));

			const getValidationMessage = () => {
				// create a fake animation object, and check it for errors
				const toValidate = {
					uid: anim.uid, // pass out UID, so the validator can ignore our old data when checking duplicate names
					name: this._$ed_iptName.val(),
					lines: this._$ed_iptLines.val().split("\n")
				};
				return this.__getValidationMessage(toValidate);
			};

			this._$ed_btnSave.off("click").click(() => {
				const msg = getValidationMessage();
				if (msg) return alert(msg);

				// we passed validation
				anim.name = this._$ed_iptName.val();
				anim.lines = this._$ed_iptLines.val().split("\n");
				this._doSaveStateDebounced();
				alert("Saved!");
			});

			this._$ed_btnExportFile.off("click").click(() => {
				// TODO
			});

			this._$ed_btnValidate.off("click").click(() => {
				const msg = getValidationMessage();
				if (msg) return alert(msg);
			});
		},
		/**
		 * Returns `null` if valid, or an error message if invalid.
		 * @private
		 */
		__getValidationMessage (anim) {
			// validate name
			if (!anim.name.length) return "Did not have a name!";
			const illegalNameChars = anim.name.split(/[_0-9a-zA-Z]/g).filter(Boolean);
			if (illegalNameChars.length) return `Illegal characters in name: ${illegalNameChars.map(it => `"${it}"`).join(", ")}`;
			const sameName = this._anims.filter(it => it.uid !== anim.uid).find(it => it.name === anim.name);
			if (sameName) return "Name must be unique!";

			// validate lines
			// TODO use __getParsedCommand
		},
		__importAnim () {
			// TODO
		},
		// command parsing
		__getParsedCommand (line) {
			// TODO return null if can't parse
			line = line.split("/\/\//g")[0]; // handle comments
			const tokens = line.split(/ +/g).filter(Boolean);
			if (!tokens.length) return new d20plus.anim.Nop();

			const op = tokens.shift();
			// TODO
			switch (op) {
				case "mv": {

				}
				case "cp": {

				}
				case "flip": {

				}
				case "scale": {

				}
				case "layer": {

				}
				case "light": {
					if (tokens.length < 3 || tokens.length > 5) return null;
					// a dash ("-") indicates "no value/clear field"
					break;
				}
				case "prop": {

				}
				case "macro": {

				}
				case "anim": {

				}
			}
		}
	})
}

SCRIPT_EXTENSIONS.push(baseToolAnimator);
