function initCanvasHandlerDefaultOverwrite() {

	var A = !1,
		M = !1,
		R = function(e) {
			var i, n;
			if (d20.tddice && d20.tddice.handleInteraction && d20.tddice.handleInteraction(), e.touches) {
				if ("pan" == d20.engine.mode) return;
				e.touches.length > 1 && (A = d20.engine.mode, d20.engine.mode = "pan", d20.engine.leftMouseIsDown = !0), d20.engine.lastTouchStarted = (new Date).getTime(), i = e.touches[0].pageX, n = e.touches[0].pageY, e.preventDefault()
			} else i = e.pageX, n = e.pageY;
			for (var o = d20.engine.showLastPaths.length; o--;) "selected" == d20.engine.showLastPaths[o].type && d20.engine.showLastPaths.splice(o, 1);
			d20.engine.handleMetaKeys(e), "select" != d20.engine.mode && "path" != d20.engine.mode || l.__onMouseDown(e), (0 === e.button || e.touches && 1 == e.touches.length) && (d20.engine.leftMouseIsDown = !0), 2 === e.button && (d20.engine.rightMouseIsDown = !0);
			var r = Math.floor(i / d20.engine.canvasZoom + d20.engine.currentCanvasOffset[0] - d20.engine.paddingOffset[0] / d20.engine.canvasZoom),
				a = Math.floor(n / d20.engine.canvasZoom + d20.engine.currentCanvasOffset[1] - d20.engine.paddingOffset[1] / d20.engine.canvasZoom);
			if (d20.engine.lastMousePos = [r, a], d20.engine.mousePos = [r, a], !d20.engine.leftMouseIsDown || "fog-reveal" != d20.engine.mode && "fog-hide" != d20.engine.mode && "gridalign" != d20.engine.mode) {
				if (d20.engine.leftMouseIsDown && "fog-polygonreveal" == d20.engine.mode) {
					var s = r,
						c = a;
					0 != d20.engine.snapTo && (e.shiftKey && !d20.Campaign.activePage().get("adv_fow_enabled") || !e.shiftKey && d20.Campaign.activePage().get("adv_fow_enabled")) && (s = d20.engine.snapToIncrement(s, d20.engine.snapTo), c = d20.engine.snapToIncrement(c, d20.engine.snapTo)), d20.engine.fog.points.length > 0 && Math.abs(d20.engine.fog.points[0][0] - s) + Math.abs(d20.engine.fog.points[0][1] - c) < 15 ? (d20.engine.fog.points.push([d20.engine.fog.points[0][0], d20.engine.fog.points[0][1]]), d20.engine.finishPolygonReveal()) : d20.engine.fog.points.push([s, c]), d20.engine.redrawScreenNextTick(!0)
				} else if (d20.engine.leftMouseIsDown && "measure" == d20.engine.mode)
					if (2 === e.button) d20.engine.addWaypoint(e);
					else {
						d20.engine.measure.sticky && d20.engine.endMeasure(), d20.engine.measure.down[0] = r, d20.engine.measure.down[1] = a, d20.engine.measure.sticky = e.shiftKey;
						const t = d20.Campaign.activePage().get("grid_type");
						let i = "snap_center" === d20.engine.ruler_snapping && !e.altKey;
						if (i |= "no_snap" === d20.engine.ruler_snapping && e.altKey, i &= 0 !== d20.engine.snapTo)
							if ("square" === t) d20.engine.measure.down[1] = d20.engine.snapToIncrement(d20.engine.measure.down[1] + Math.floor(d20.engine.snapTo / 2), d20.engine.snapTo) - Math.floor(d20.engine.snapTo / 2), d20.engine.measure.down[0] = d20.engine.snapToIncrement(d20.engine.measure.down[0] + Math.floor(d20.engine.snapTo / 2), d20.engine.snapTo) - Math.floor(d20.engine.snapTo / 2);
							else {
								const e = d20.canvas_overlay.activeHexGrid.GetHexAt({
									X: d20.engine.measure.down[0],
									Y: d20.engine.measure.down[1]
								});
								e && (d20.engine.measure.down[1] = e.MidPoint.Y, d20.engine.measure.down[0] = e.MidPoint.X)
							}
						else if (0 === d20.engine.snapTo || "snap_corner" !== d20.engine.ruler_snapping || e.altKey) d20.engine.measure.flags |= 1;
						else {
							if ("square" === t) d20.engine.measure.down[0] = d20.engine.snapToIncrement(d20.engine.measure.down[0], d20.engine.snapTo), d20.engine.measure.down[1] = d20.engine.snapToIncrement(d20.engine.measure.down[1], d20.engine.snapTo);
							else {
								const e = d20.engine.snapToHexCorner([d20.engine.measure.down[0], d20.engine.measure.down[1]]);
								e && (d20.engine.measure.down[0] = e[0], d20.engine.measure.down[1] = e[1])
							}
							d20.engine.measure.flags |= 1
						}
					}
				else if (d20.engine.leftMouseIsDown && "fxtools" == d20.engine.mode) d20.engine.fx.current || (d20.engine.fx.current = d20.fx.handleClick(r, a));
				else if (d20.engine.leftMouseIsDown && "text" == d20.engine.mode) {
					const e = {
							fontFamily: $("#font-family").val(),
							fontSize: $("#font-size").val(),
							fill: $("#font-color").val(),
							text: "",
							left: r,
							top: a
						},
						t = d20.Campaign.activePage().addText(e);
					$("body").on("mouseup.create_text_editor", () => {
						$("body").off("mouseup.create_text_editor"), d20.engine.editText(t.view.graphic, e.top, e.left), $(".texteditor").focus()
					})
				} else if (d20.engine.leftMouseIsDown && "rect" == d20.engine.mode) {
					var d = parseInt($("#path_width").val(), 10),
						h = d20.engine.drawshape.shape = {
							strokewidth: d,
							x: 0,
							y: 0,
							width: 10,
							height: 10,
							type: e.altKey ? "circle" : "rect"
						};
					s = r, c = a;
					0 != d20.engine.snapTo && e.shiftKey && (s = d20.engine.snapToIncrement(s, d20.engine.snapTo), c = d20.engine.snapToIncrement(c, d20.engine.snapTo)), h.x = s, h.y = c, h.fill = $("#path_fillcolor").val(), h.stroke = $("#path_strokecolor").val(), d20.engine.drawshape.start = [i + d20.engine.currentCanvasOffset[0] - d20.engine.paddingOffset[0], n + d20.engine.currentCanvasOffset[1] - d20.engine.paddingOffset[1]], d20.engine.redrawScreenNextTick()
				} else if (d20.engine.leftMouseIsDown && "polygon" == d20.engine.mode) {
					if (d20.engine.drawshape.shape) h = d20.engine.drawshape.shape;
					else {
						d = parseInt($("#path_width").val(), 10);
						(h = d20.engine.drawshape.shape = {
							strokewidth: d,
							points: [],
							type: "polygon"
						}).fill = $("#path_fillcolor").val(), h.stroke = $("#path_strokecolor").val()
					}
					s = r, c = a;
					0 != d20.engine.snapTo && e.shiftKey && (s = d20.engine.snapToIncrement(s, d20.engine.snapTo), c = d20.engine.snapToIncrement(c, d20.engine.snapTo)), h.points.length > 0 && Math.abs(h.points[0][0] - s) + Math.abs(h.points[0][1] - c) < 15 ? (h.points.push([h.points[0][0], h.points[0][1]]), d20.engine.finishCurrentPolygon()) : h.points.push([s, c]), d20.engine.redrawScreenNextTick()
				} else if (d20.engine.leftMouseIsDown && "targeting" === d20.engine.mode) {
					var p = d20.engine.canvas.findTarget(e, !0, !0);
					return void(p !== undefined && "image" === p.type && p.model && d20.engine.nextTargetCallback(p))
				}
			} else d20.engine.fog.down[0] = r, d20.engine.fog.down[1] = a, 0 != d20.engine.snapTo && "square" == d20.Campaign.activePage().get("grid_type") && ("gridalign" == d20.engine.mode ? e.shiftKey && (d20.engine.fog.down[0] = d20.engine.snapToIncrement(d20.engine.fog.down[0], d20.engine.snapTo), d20.engine.fog.down[1] = d20.engine.snapToIncrement(d20.engine.fog.down[1], d20.engine.snapTo)) : (e.shiftKey && !d20.Campaign.activePage().get("adv_fow_enabled") || !e.shiftKey && d20.Campaign.activePage().get("adv_fow_enabled")) && (d20.engine.fog.down[0] = d20.engine.snapToIncrement(d20.engine.fog.down[0], d20.engine.snapTo), d20.engine.fog.down[1] = d20.engine.snapToIncrement(d20.engine.fog.down[1], d20.engine.snapTo)));
			if (window.currentPlayer && d20.engine.leftMouseIsDown && "select" == d20.engine.mode) {
				if (2 === e.button && d20.engine.addWaypoint(e), d20.engine.pings[window.currentPlayer.id] && d20.engine.pings[window.currentPlayer.id].radius > 20) return;
				var f = {
					left: r,
					top: a,
					radius: -5,
					player: window.currentPlayer.id,
					pageid: d20.Campaign.activePage().id,
					currentLayer: window.currentEditingLayer
				};
				window.is_gm && e.shiftKey && (f.scrollto = !0), d20.engine.pings[window.currentPlayer.id] = f, d20.engine.pinging = {
					downx: i,
					downy: n
				}, d20.engine.redrawScreenNextTick(!0)
			}
			const g = ["select", "path", "text", "fxtools", "measure", "fxtools", "rect"];
			d20.engine.rightMouseIsDown && g.includes(d20.engine.mode) || d20.engine.leftMouseIsDown && "pan" === d20.engine.mode ? (d20.engine.pan.beginPos = [u.scrollLeft(), u.scrollTop()], d20.engine.pan.panXY = [i, n], d20.engine.pan.panning = !0, t.css("cursor", "grabbing")) : d20.engine.pan.panning = !1, 2 === e.button && !d20.engine.leftMouseIsDown && d20.engine.measurements[window.currentPlayer.id] && d20.engine.measurements[window.currentPlayer.id].sticky && (d20.engine.endMeasure(), d20.engine.announceEndMeasure({
				player: window.currentPlayer.id
			})), t.hasClass("hasfocus") || t.focus()
		},
		I = function(e) {
			var t, i;
			if (e.changedTouches ? ((e.changedTouches.length > 1 || "pan" == d20.engine.mode) && (delete d20.engine.pings[window.currentPlayer.id], d20.engine.pinging = !1), e.preventDefault(), t = e.changedTouches[0].pageX, i = e.changedTouches[0].pageY) : (t = e.pageX, i = e.pageY), "select" != d20.engine.mode && "path" != d20.engine.mode && "targeting" != d20.engine.mode || l.__onMouseMove(e), d20.engine.leftMouseIsDown || d20.engine.rightMouseIsDown) {
				var n = Math.floor(t / d20.engine.canvasZoom + d20.engine.currentCanvasOffset[0] - d20.engine.paddingOffset[0] / d20.engine.canvasZoom),
					o = Math.floor(i / d20.engine.canvasZoom + d20.engine.currentCanvasOffset[1] - d20.engine.paddingOffset[1] / d20.engine.canvasZoom);
				if (d20.engine.mousePos = [n, o], !d20.engine.leftMouseIsDown || "fog-reveal" !== d20.engine.mode && "fog-hide" !== d20.engine.mode && "gridalign" !== d20.engine.mode) {
					if (d20.engine.leftMouseIsDown && "measure" == d20.engine.mode && d20.engine.measure.down[0] !== undefined && d20.engine.measure.down[1] !== undefined) {
						d20.engine.measure.down[2] = n, d20.engine.measure.down[3] = o, d20.engine.measure.sticky |= e.shiftKey;
						const t = d20.Campaign.activePage().get("grid_type"),
							i = "snap_corner" === d20.engine.ruler_snapping && !e.altKey && 0 !== d20.engine.snapTo;
						let a = "snap_center" === d20.engine.ruler_snapping && !e.altKey;
						if (a |= "no_snap" === d20.engine.ruler_snapping && e.altKey, a &= 0 !== d20.engine.snapTo) {
							if ("square" === t) d20.engine.measure.down[2] = d20.engine.snapToIncrement(d20.engine.measure.down[2] + Math.floor(d20.engine.snapTo / 2), d20.engine.snapTo) - Math.floor(d20.engine.snapTo / 2), d20.engine.measure.down[3] = d20.engine.snapToIncrement(d20.engine.measure.down[3] + Math.floor(d20.engine.snapTo / 2), d20.engine.snapTo) - Math.floor(d20.engine.snapTo / 2);
							else {
								const e = d20.canvas_overlay.activeHexGrid.GetHexAt({
									X: d20.engine.measure.down[2],
									Y: d20.engine.measure.down[3]
								});
								e && (d20.engine.measure.down[3] = e.MidPoint.Y, d20.engine.measure.down[2] = e.MidPoint.X)
							}
							d20.engine.measure.flags &= -3
						} else if (i) {
							if ("square" === t) d20.engine.measure.down[2] = d20.engine.snapToIncrement(d20.engine.measure.down[2], d20.engine.snapTo), d20.engine.measure.down[3] = d20.engine.snapToIncrement(d20.engine.measure.down[3], d20.engine.snapTo);
							else {
								const e = d20.engine.snapToHexCorner([d20.engine.measure.down[2], d20.engine.measure.down[3]]);
								e && (d20.engine.measure.down[2] = e[0], d20.engine.measure.down[3] = e[1])
							}
							d20.engine.measure.flags |= 2
						} else d20.engine.measure.flags |= 2;
						var r = {
							x: d20.engine.measure.down[0],
							y: d20.engine.measure.down[1],
							to_x: d20.engine.measure.down[2],
							to_y: d20.engine.measure.down[3],
							player: window.currentPlayer.id,
							pageid: d20.Campaign.activePage().id,
							currentLayer: window.currentEditingLayer,
							waypoints: d20.engine.measure.waypoints,
							sticky: d20.engine.measure.sticky,
							flags: d20.engine.measure.flags,
							hide: d20.engine.measure.hide
						};
						d20.engine.announceMeasure(r)
					} else if (d20.engine.leftMouseIsDown && "fxtools" == d20.engine.mode) {
						if (d20.engine.fx.current) {
							var a = (new Date).getTime();
							a - d20.engine.fx.lastMoveBroadcast > d20.engine.fx.MOVE_BROADCAST_FREQ ? (d20.fx.moveFx(d20.engine.fx.current, n, o), d20.engine.fx.lastMoveBroadcast = a) : d20.fx.moveFx(d20.engine.fx.current, n, o, !0)
						}
					} else if (d20.engine.leftMouseIsDown && "rect" == d20.engine.mode) {
						var s = (t + d20.engine.currentCanvasOffset[0] - d20.engine.paddingOffset[0] - d20.engine.drawshape.start[0]) / d20.engine.canvasZoom,
							c = (i + d20.engine.currentCanvasOffset[1] - d20.engine.paddingOffset[1] - d20.engine.drawshape.start[1]) / d20.engine.canvasZoom;
						0 != d20.engine.snapTo && e.shiftKey && (s = d20.engine.snapToIncrement(s, d20.engine.snapTo), c = d20.engine.snapToIncrement(c, d20.engine.snapTo));
						var d = d20.engine.drawshape.shape;
						d.width = s, d.height = c, d20.engine.redrawScreenNextTick()
					}
				} else d20.engine.fog.down[2] = n, d20.engine.fog.down[3] = o, 0 !== d20.engine.snapTo && "square" === d20.Campaign.activePage().get("grid_type") && ("gridalign" === d20.engine.mode ? e.shiftKey && (d20.engine.fog.down[2] = d20.engine.snapToIncrement(d20.engine.fog.down[2], d20.engine.snapTo), d20.engine.fog.down[3] = d20.engine.snapToIncrement(d20.engine.fog.down[3], d20.engine.snapTo)) : (e.shiftKey && !d20.Campaign.activePage().get("adv_fow_enabled") || !e.shiftKey && d20.Campaign.activePage().get("adv_fow_enabled")) && (d20.engine.fog.down[2] = d20.engine.snapToIncrement(d20.engine.fog.down[2], d20.engine.snapTo), d20.engine.fog.down[3] = d20.engine.snapToIncrement(d20.engine.fog.down[3], d20.engine.snapTo))), d20.engine.redrawScreenNextTick(!0);
				if (d20.engine.pinging)(s = Math.abs(d20.engine.pinging.downx - t)) + (c = Math.abs(d20.engine.pinging.downy - i)) > 10 && (delete d20.engine.pings[window.currentPlayer.id], d20.engine.pinging = !1);
				if (d20.engine.pan.panning) {
					s = 2 * (t - d20.engine.pan.panXY[0]), c = 2 * (i - d20.engine.pan.panXY[1]);
					if (d20.engine.pan.lastPanDist += Math.abs(s) + Math.abs(c), d20.engine.pan.lastPanDist < 10) return;
					var h = d20.engine.pan.beginPos[0] - s,
						p = d20.engine.pan.beginPos[1] - c;
					u.stop().animate({
						scrollLeft: h,
						scrollTop: p
					}, {
						duration: 1,
						easing: "linear",
						queue: !1
					})
				}
			}
		},
		P = function(e) {
			var i, n;
			d20.engine.handleMetaKeys(e), e.changedTouches && e.changedTouches.length > 0 ? (i = e.changedTouches[0].pageX, n = e.changedTouches[0].pageY) : (i = e.pageX, n = e.pageY), "path" != d20.engine.mode && ("select" != d20.engine.mode || Object.keys(d20.engine.movingShadows).length > 0 && 2 === e.button) || l.__onMouseUp(e);
			var o = Math.floor(i / d20.engine.canvasZoom + d20.engine.currentCanvasOffset[0] - d20.engine.paddingOffset[0] / d20.engine.canvasZoom),
				r = Math.floor(n / d20.engine.canvasZoom + d20.engine.currentCanvasOffset[1] - d20.engine.paddingOffset[1] / d20.engine.canvasZoom),
				a = 0;
			if (e.changedTouches && e.changedTouches.length > 0 && (a = Math.abs(o - d20.engine.lastMousePos[0]) + Math.abs(r - d20.engine.lastMousePos[1])), 0 === e.button && Object.keys(d20.engine.movingShadows).length > 0 && (d20.engine.movingShadows = {}), "fog-reveal" == d20.engine.mode || "fog-hide" == d20.engine.mode) {
				var s = {
					x: d20.engine.fog.down[0] < d20.engine.fog.down[2] ? d20.engine.fog.down[0] : d20.engine.fog.down[2],
					y: d20.engine.fog.down[1] < d20.engine.fog.down[3] ? d20.engine.fog.down[1] : d20.engine.fog.down[3],
					width: Math.abs(d20.engine.fog.down[2] - d20.engine.fog.down[0]),
					height: Math.abs(d20.engine.fog.down[3] - d20.engine.fog.down[1]),
					type: d20.engine.mode.replace("fog-", ""),
					ctrlKey: e.ctrlKey,
					altKey: e.altKey
				};
				s.x !== undefined && s.y !== undefined && (d20.canvas_overlay.revealOrHideArea(s), d20.tutorial && d20.tutorial.active && ("fog-reveal" == d20.engine.mode ? $(document).trigger("fogReveal") : "fog-hide" == d20.engine.mode && $(document).trigger("fogHide"))), !d20.Campaign.activePage().get("showdarkness") && d20.engine.clearCanvasOnRedraw("fog")
			} else if (0 !== e.button || "measure" != d20.engine.mode || d20.engine.measure.sticky) {
				if ("fxtools" == d20.engine.mode) d20.engine.fx.current && (d20.fx.killFx(d20.engine.fx.current), delete d20.engine.fx.current);
				else if ("rect" == d20.engine.mode && d20.engine.drawshape.shape) {
					var c = d20.engine.drawshape.shape;
					if (c.width < 0 && (c.x = c.x + c.width, c.width = -c.width),
						c.height < 0 && (c.y = c.y + c.height, c.height = -c.height), c.width > 5 || c.height > 5) {
						var u;
						if ("rect" == c.type) u = "M0,0 L" + c.width + ",0 L" + c.width + "," + c.height + " L0," + c.height + " L0,0";
						else {
							var d = .5522848,
								h = Math.floor(c.width / 2),
								p = Math.floor(c.height / 2),
								f = h * d,
								g = p * d,
								m = h + h,
								y = p + p;
							u = "M" + (h - h) + "," + p + " C" + (h - h) + "," + (p - g) + " " + (h - f) + "," + (p - p) + " " + h + "," + (p - p) + " C" + (h + f) + "," + (p - p) + " " + m + "," + (p - g) + " " + m + "," + p + " C" + m + "," + (p + g) + " " + (h + f) + "," + y + " " + h + "," + y + " C" + (h - f) + "," + y + " " + (h - h) + "," + (p + g) + " " + (h - h) + "," + p
						}
						var v = new fabric.Path(u, {
							strokeWidth: c.strokewidth
						});
						v.set({
							top: Math.floor(c.y + c.height / 2),
							left: Math.floor(c.x + c.width / 2),
							fill: c.fill,
							stroke: c.stroke
						}), d20.Campaign.activePage().addPath(v)
					}
				} else if (window.currentPlayer && "select" == d20.engine.mode && d20.engine.pings[window.currentPlayer.id] && d20.engine.pings[window.currentPlayer.id].radius < 20) delete d20.engine.pings[window.currentPlayer.id];
				else if ("gridalign" == d20.engine.mode) {
					d20.engine.clearCanvasOnRedraw("fog");
					var b = {
							width: Math.abs(d20.engine.fog.down[2] - d20.engine.fog.down[0]) / 3,
							height: Math.abs(d20.engine.fog.down[3] - d20.engine.fog.down[1]) / 3,
							x: d20.engine.fog.down[0],
							y: d20.engine.fog.down[1]
						},
						w = $("<div class='gridalignconfirmation'>Okay, it looks like your grid cells are: <br /> <input class='resultwidth' value='" + Math.round(b.width) + "' /> x <input class='resultheight' value='" + Math.round(b.height) + "' /> pixels <br /> We'll resize the map image so that it matches your page's current grid size. Proceed?</div>");
					w.dialog({
						zIndex: 10800,
						buttons: {
							"Align to Grid!": function() {
								var e = d20.Campaign.activePage().get("snapping_increment") * window.dpi,
									t = d20.Campaign.activePage().get("snapping_increment") * window.dpi,
									i = e / parseInt(w.find(".resultwidth").val(), 10),
									n = t / parseInt(w.find(".resultheight").val(), 10);
								d20.engine.gridaligner.target.model.save({
									width: d20.engine.gridaligner.target.get("width") * i,
									height: d20.engine.gridaligner.target.get("height") * n
								}), _.defer(function() {
									d20.engine.canvas.fire("object:modified", {
										target: d20.engine.gridaligner.target,
										force_snap: !0
									})
								}), w.dialog("destroy")
							},
							"Try Again": function() {
								setMode("gridalign"), w.dialog("destroy")
							},
							Cancel: function() {
								w.dialog("destroy")
							}
						},
						beforeClose: function() {
							w.dialog("destroy")
						},
						title: "Proceed with Alignment?",
						modal: !0,
						width: 400
					}), setMode("select")
				}
			} else d20.engine.endMeasure(), d20.engine.announceEndMeasure({
				player: window.currentPlayer.id
			});
			if ((d20.engine.rightMouseIsDown || fabric.isTouchSupported && d20.engine.leftMouseIsDown && (new Date).getTime() - d20.engine.lastTouchStarted > 500 && a < 25) && (!d20.engine.pan.panning || d20.engine.pan.lastPanDist < 10)) {
				let t = !1;
				if ("polygon" == d20.engine.mode) d20.engine.finishCurrentPolygon();
				else if ("fog-polygonreveal" == d20.engine.mode) d20.engine.finishPolygonReveal();
				else if (t |= "measure" === d20.engine.mode, t |= "select" === d20.engine.mode && d20.engine.leftMouseIsDown && d20.engine.selected().length > 0, d20.engine.pinging && (d20.engine.pings[window.currentPlayer.id] && d20.engine.pings[window.currentPlayer.id].radius > 20 ? t = !0 : (delete d20.engine.pings[window.currentPlayer.id], d20.engine.pinging = !1)), !t) {
					var x = d20.engine.canvas.findTarget(e);
					x && d20.engine.canvas.setActiveObject(x, e), d20.token_editor.showContextMenu(e)
				}
			}(0 === e.button || e.changedTouches && 1 !== e.touches.length) && (d20.engine.leftMouseIsDown = !1), 2 === e.button && (d20.engine.rightMouseIsDown = !1), d20.engine.pinging = !1, d20.engine.fog.down = [], d20.engine.pan.panning = !1, d20.engine.pan.lastPanDist = 0, "polygon" != d20.engine.mode && (d20.engine.drawshape.shape = !1), A && (M && clearTimeout(M), M = setTimeout(function() {
				d20.engine.mode = A, A = !1, M = !1
			}, 500)), t.css("cursor", "inherit")
		};

	d20plus.overwrites.canvasHandlerDefaultDown = R
	d20plus.overwrites.canvasHandlerDefaultMove = I
	d20plus.overwrites.canvasHandlerDefaultUp = P
}
SCRIPT_EXTENSIONS.push(initCanvasHandlerDefaultOverwrite);
