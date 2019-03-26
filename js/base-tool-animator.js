function baseToolAnimator () {
	// TODO each of these should have a function `animate` which accepts three parameters:
	//   token: the token object being animated
	//   alpha: the absolute time since the start of the animation
	//   delta; the time delta from the last time the animate function was run
    //   and returns "true" if the token needs to be saved
	// TODO each of these should have a function `hasRun` which returns true if the animation has run/completed
	//   this can be used to clean up completed animations, removing them from the animation queue
	// TODO each of these should have serialize/deserialize functions
	d20plus.anim = {
		Nop: function () {
			this.animate = function () {
			    return false;
            };

            this.hasRun = () => true;
		},
		Move: function (startTime, duration, x, y, z) {
			this._hasRun = false;

			this._progress = 0; // 0 - 1f

			this.animate = function (token, alpha, delta) {
				if (alpha >= startTime) {
					if (this._progress < (1 - Number.EPSILON)) {
						if (this._progress === 0) delta = alpha - startTime;

						const mProcess = delta / duration;

						// handle movement
						const mvX = mProcess * x;
						const mvY = mProcess * y;

                        token.attributes.left += mvX;
                        token.attributes.top -= mvY;

						if (z != null) {
							const mvZ = mProcess * z;
							// TODO move token
						}

						// update progress
						this._progress += mProcess;

						return true;
					} else this._hasRun = true;
				}
				return false;
			};

			this.hasRun = () => this._hasRun;
		},
		Copy: function (startTime, childAnimation = false) {
			this._hasRun = false;

			this.animate = function (token, alpha, delta) {
				if (!this._hasRun && alpha >= startTime) {
					this._hasRun = true;

					// TODO copy token

					if (childAnimation) {
						const nxt = d20plus.anim.TriggerAnimation(startTime, childAnimation);
						const doSaveChild = nxt.animate(childToken, alpha, delta);
						if (doSaveChild) childToken.save();
					}
				}
				return false;
			};

			this.hasRun = () => this._hasRun;
		},
		Rotate: function (startTime, duration, degrees) {
            this._hasRun = false;
            const rads = degrees * (180 / Math.PI);

            this._progress = 0; // 0 - 1f

            this.animate = function (token, alpha, delta) {
                if (alpha >= startTime) {
                    if (this._progress < (1 - Number.EPSILON)) {
                        if (this._progress === 0) delta = alpha - startTime;

                        const mProcess = delta / duration;

                        // handle rotation
                        const rot = mProcess * rads;

                        // TODO rotate token

                        // update progress
                        this._progress += mProcess;

                        return true;
                    } else this._hasRun = true;
                }
                return false;
            };

            this.hasRun = () => this._hasRun;
		},
		Flip: function (startTime, isHorizontal, isVertical) {
            this._hasRun = false;

            this.animate = function (token, alpha) {
                if (!this._hasRun && alpha >= startTime) {
                    this._hasRun = true;

                    if (isHorizontal) token.attributes.fliph = !token.attributes.fliph;
                    if (isVertical) token.attributes.flipv = !token.attributes.flipv;

                    return true;
                }
                return false;
            };

            this.hasRun = () => this._hasRun;
		},
		Scale: function (startTime, duration, scaleFactorX, scaleFactorY) {
            this._hasRun = false;

            this._progress = 0; // 0 - 1f

            this.animate = function (token, alpha, delta) {
                if (alpha >= startTime) {
                    if (this._progress < (1 - Number.EPSILON)) {
                        if (this._progress === 0) delta = alpha - startTime;

                        const mProcess = delta / duration;

                        // handle scaling
                        const mScaleX = mProcess * scaleFactorX;
                        const mScaleY = mProcess * scaleFactorY;

                        // TODO scale token

                        // update progress
                        this._progress += mProcess;

                        return true;
                    } else this._hasRun = true;
                }
                return false;
            };

            this.hasRun = () => this._hasRun;
		},
		Layer: function (startTime, layer) {
            this._hasRun = false;

            this.animate = function (token, alpha) {
                if (!this._hasRun && alpha >= startTime) {
                    this._hasRun = true;

                    // TODO move token to layer
                }
                return false;
            };

            this.hasRun = () => this._hasRun;
		},
        // TODO consider making an alternate version which sets a property on the character
        // TODO consider the ability to set properties on _other_ tokens -- might not be performant enough?
		SetProperty: function (startTime, prop, value) {
            this._hasRun = false;

            this.animate = function (token, alpha) {
                if (!this._hasRun && alpha >= startTime) {
                    this._hasRun = true;

                    // TODO set property on token

                    return true;
                }
                return false;
            };

            this.hasRun = () => this._hasRun;
		},
		Lighting: function (startTime, duration, lightRadius, dimStart, degrees) {
            this._hasRun = false;

            this._progress = 0; // 0 - 1f

            this.animate = function (token, alpha, delta) {
                if (alpha >= startTime) {
                    if (this._progress < (1 - Number.EPSILON)) {
                        if (this._progress === 0) delta = alpha - startTime;

                        const mProcess = delta / duration;

                        // handle lighting changes
                        const mLightRadius = mProcess * lightRadius;
                        const mDimStart = mProcess * dimStart;

                        // TODO update token

                        if (z != null) {
                            const mvZ = mProcess * z;
                            // TODO move token
                        }

                        // update progress
                        this._progress += mProcess;

                        return true;
                    } else this._hasRun = true;
                }
                return false;
            };

            this.hasRun = () => this._hasRun;
		},
		TriggerMacro: function (startTime, macroName) {
            this._hasRun = false;

            const macro = null; // TODO fetch macro here, in advance

            this.animate = function (token, alpha) {
                if (!this._hasRun && alpha >= startTime) {
                    this._hasRun = true;

                    // TODO trigger macro
                }
                return false;
            };

            this.hasRun = () => this._hasRun;
		},
		TriggerAnimation: function (startTime, animationName) {
            this._hasRun = false;

            const anim = null; // TODO fetch animation here, in advance

            this.animate = function (token, alpha, delta) {
                if (!this._hasRun && alpha >= startTime) {
                    this._hasRun = true;

                    return anim.animate(token, alpha, delta);
                }
                return false;
            };

            this.hasRun = () => this._hasRun;
		}
	};

	const animatorTool = {
		name: "Token Animator",
		desc: "Manage token animations",
		html: `
			<div id="d20plus-token-animator" title="Token Animator" class="anm__win">
				<p>
					<button class="btn" name="btn-add">Add Animation</button>
					<button class="btn mr-2" name="btn-import">Import Animation</button>
					<button class="btn" name="btn-rescue">Rescue Token</button>
				</p>
				
				<div class="anm__wrp-sel-all">
					<label class="flex-label"><input type="checkbox" title="Select all" name="cb-all" class="mr-2"> <span>Select All</span></label>
					<div>
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
			this._anims = Campaign.attributes.bR20tool__anim_anims || {};
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

			const $btnSelExport = this.$win.find(`[name="btn-export"]`);
			const $btnSelDelete = this.$win.find(`[name="btn-delete"]`);

			const $cbAll = this.$win.find(`[name="cb-all"]`);
			this._$list = this.$win.find(`.list`);

			$btnAdd.click(() => this.__addAnim(this.__getNewAnim()));

			$btnImport.click(() => {
				// TODO ensure the name and uid are unique - prompt for rename?
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

			Object.values(this._anims).forEach(anim => {
				this._$list.append(this.__getAnimListRow(anim));
			});

			this._animList = new List("token-animator-list-container", {
				valueNames: ["name", "uid"]
			});

		},
		__addAnim (anim) {
			const lastSearch = ListUtil.getSearchTermAndReset(this._animList);
			this._anims[anim.uid] = anim;
			this._$list.append(this.__getAnimListRow(anim));

			this._animList.reIndex();
			if (lastSearch) this._animList.search(lastSearch);
			this._animList.sort("name");

			this._doSaveStateDebounced();
		},
		__getNewAnim () {
			let nxtName = "new_animation";
			let suffix = 1;
			while (Object.values(this._anims).find(it => it.name === nxtName)) nxtName = `new_animation_${suffix++}`;
			return {
				uid: this._animId++,
				name: nxtName,
				lines: []
			}
		},
		__getAnimListRow (anim) {
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
					// TODO convert to JSON; download (__exportAnim)
				});

			const $btnDelete = $(`<div class="btn anm__row-btn btn-danger pictos anm__btn-delete mr-2" title="Delete">#</div>`)
				.click(evt => {
					evt.stopPropagation();
					delete this._anims[anim.uid];
					this._animList.remove("uid", anim.uid);
					this._doSaveStateDebounced();
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
			//   Should reset to 1.0 scale; reset flipping, place on GM layer?
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
				// TODO share logic with "Export to File" list button (__exportAnim)
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
			const sameName = Object.values(this._anims).filter(it => it.uid !== anim.uid).find(it => it.name === anim.name);
			if (sameName) return "Name must be unique!";

			// validate lines
			// TODO use __getParsedCommand
		},
		__importAnim () {
			// TODO
		},
		__exportAnim () {
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
	};

	d20plus.tool.tools.push(animatorTool);

	d20plus.anim.animator = {
        // {tokenId: {token: {...}, animationQueue: [...]}}
		_active: {},
		_tickRate: 1,

		__tickCount: 0,

		onPageChange () {
			// TODO nothing?
		},

		startAnimation (token, animUid) {
			this._active[animUid] = this._active[animUid] || [];
			this._active[animUid][token.id] = {
				token,
				tick: 0
			}
		},

		endAnimation (token, animUid) {
			if (this._active[animUid]) {
				delete this._active[animUid][token.id];
				const hasKeys = (() => { for (const _ in this._active[animUid]) return true; return false; })();
				if (!hasKeys) delete this._active[animUid];
			}
		},

		setTickRate (tickRate) {
			this._tickRate = tickRate;
		},

		doTick () {
			if (this._hasAnyActive()) {
				this._doTick();
			} else {
				// sleep for 1.5 seconds
				setTimeout(() => this.doTick(), 1500)
			}
		},

		getSaveableState () {
			// TODO export this._active -- remove token objects, replace them with ID strings?
			//   convert animation queue into saveable states
		},

		loadStateFrom () {
			// TODO reload saved state, replacing token ID string with token objects
			//   reload animation queue from saveable states
		},

		_hasAnyActive () {
            // fastest implementation
			for (const _ in this._active) return true;
			return false;
		},

		_doTick () {
			// higher tick rate = slower
            // {tokenId: {token: {...}, animationQueue: [...], startTime}}
			if (++this.__tickCount === this._tickRate) {
			    const time = (new Date()).getTime();

				for (const tokenId in this._active) {
					const tokenMeta = this._active[tokenId];

                    const l = tokenMeta.animationQueue.length;
                    let anyModification = false;
                    for (let i = 0; i < l; ++i) {
                        anyModification = tokenMeta.animationQueue[i].animate(
                            tokenMeta.token,
                            tokenMeta.startTime,
                            tokenMeta.startTime - time
                        ) || anyModification;
                    }

                    // save after applying animations
                    if (anyModification) tokenMeta.token.save();
				}
				this.__tickCount = 0;
			}

			requestAnimationFrame(this.doTick())
		},

		init () {
			setTimeout(() => this.doTick(), this._tickRate)
		}
	};
}

SCRIPT_EXTENSIONS.push(baseToolAnimator);
