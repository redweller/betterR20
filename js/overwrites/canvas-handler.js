function initCanvasHandlerOverwrite() {

	const canvasHandlerDown = function(e) {
		// BEGIN MOD
		var cnv = d20.engine.canvas;
		var wrp = $("#editor-wrapper");
		// END MOD
		var ii, nn;
		if (d20.tddice && d20.tddice.handleInteraction && d20.tddice.handleInteraction(), e.touches) {
			if ("pan" == d20.engine.mode) return;
			e.touches.length > 1 && (A = d20.engine.mode, d20.engine.mode = "pan", d20.engine.leftMouseIsDown = !0), d20.engine.lastTouchStarted = (new Date).getTime(), ii = e.touches[0].pageX, nn = e.touches[0].pageY, e.preventDefault()
		} else ii = e.pageX, nn = e.pageY;
		for (var o = d20.engine.showLastPaths.length; o--;) "selected" == d20.engine.showLastPaths[o].type && d20.engine.showLastPaths.splice(o, 1);
		d20.engine.handleMetaKeys(e), "select" != d20.engine.mode && "path" != d20.engine.mode || cnv.__onMouseDown(e), (0 === e.button || e.touches && 1 == e.touches.length) && (d20.engine.leftMouseIsDown = !0), 2 === e.button && (d20.engine.rightMouseIsDown = !0);
		var r = Math.floor(ii / d20.engine.canvasZoom + d20.engine.currentCanvasOffset[0] - d20.engine.paddingOffset[0] / d20.engine.canvasZoom),
			a = Math.floor(nn / d20.engine.canvasZoom + d20.engine.currentCanvasOffset[1] - d20.engine.paddingOffset[1] / d20.engine.canvasZoom);
		if (d20.engine.lastMousePos = [r, a], d20.engine.mousePos = [r, a],
			!d20.engine.leftMouseIsDown || "fog-reveal" != d20.engine.mode && "fog-hide" != d20.engine.mode && "gridalign" != d20.engine.mode) {
			if (d20.engine.leftMouseIsDown && "fog-polygonreveal" == d20.engine.mode) {
				// BEGIN MOD
				var c = r,
					u = a;

				if (0 != d20.engine.snapTo && (e.shiftKey && !d20.Campaign.activePage().get("adv_fow_enabled") || !e.shiftKey && d20.Campaign.activePage().get("adv_fow_enabled"))) {
					if ("square" == d20.Campaign.activePage().get("grid_type")) {
						c = d20.engine.snapToIncrement(c, d20.engine.snapTo);
						u = d20.engine.snapToIncrement(u, d20.engine.snapTo);
					} else {
						const minPoint = getClosestHexPoint(c, u);
						c = minPoint[0];
						u = minPoint[1];
					}
				}

				d20.engine.fog.points.length > 0 && Math.abs(d20.engine.fog.points[0][0] - c) + Math.abs(d20.engine.fog.points[0][1] - u) < 15 ? (d20.engine.fog.points.push([d20.engine.fog.points[0][0], d20.engine.fog.points[0][1]]),
						d20.engine.finishPolygonReveal()) : d20.engine.fog.points.push([c, u]),
					d20.engine.redrawScreenNextTick(!0)
				// END MOD
			} else if (d20.engine.leftMouseIsDown && "measure" == d20.engine.mode)
				if (2 === e.button) d20.engine.addWaypoint(e);
				else {
					d20.engine.measure.sticky && d20.engine.endMeasure(), d20.engine.measure.down[0] = r, d20.engine.measure.down[1] = a, d20.engine.measure.sticky = e.shiftKey;
					const t = d20.Campaign.activePage().get("grid_type");
					let ii = "snap_center" === d20.engine.ruler_snapping && !e.altKey;
					if (ii |= "no_snap" === d20.engine.ruler_snapping && e.altKey, ii &= 0 !== d20.engine.snapTo)
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
				0 != d20.engine.snapTo && e.shiftKey && (s = d20.engine.snapToIncrement(s, d20.engine.snapTo), c = d20.engine.snapToIncrement(c, d20.engine.snapTo)), h.x = s, h.y = c, h.fill = $("#path_fillcolor").val(), h.stroke = $("#path_strokecolor").val(), d20.engine.drawshape.start = [ii + d20.engine.currentCanvasOffset[0] - d20.engine.paddingOffset[0], nn + d20.engine.currentCanvasOffset[1] - d20.engine.paddingOffset[1]], d20.engine.redrawScreenNextTick()
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
				// BEGIN  MOD
				c = s, u = l;

				if (0 != d20.engine.snapTo && e.shiftKey) {
					if ("square" == d20.Campaign.activePage().get("grid_type")) {
						s = d20.engine.snapToIncrement(s, d20.engine.snapTo);
						c = d20.engine.snapToIncrement(c, d20.engine.snapTo);
					} else {
						const minPoint = getClosestHexPoint(s, c);
						s = minPoint[0];
						c = minPoint[1];
					}
				}

				f.points.length > 0 && Math.abs(f.points[0][0] - s) + Math.abs(f.points[0][1] - c) < 15 ? (f.points.push([f.points[0][0], f.points[0][1]]),
						d20.engine.finishCurrentPolygon()) : f.points.push([s, c]),
					d20.engine.redrawScreenNextTick()
				// END MOD
			} else if (d20.engine.leftMouseIsDown && "targeting" === d20.engine.mode) {
				var p = d20.engine.canvas.findTarget(e, !0, !0);
				return void(p !== undefined && "image" === p.type && p.model && d20.engine.nextTargetCallback(p))
			} // BEGIN MOD
			else if (d20.engine.leftMouseIsDown && "line_splitter" === d20.engine.mode) {
				const lastPoint = {
					x: d20.engine.lastMousePos[0],
					y: d20.engine.lastMousePos[1]
				};
				(d20.engine.canvas._objects || []).forEach(o => {
					if (o.type === "path" && o.containsPoint(lastPoint)) {
						const asObj = o.toObject();
						const anyCurves = asObj.path.filter(it => it instanceof Array && it.length > 0 && it[0] === "C");
						if (!anyCurves.length) {
							// PathMath expects these
							o.model.set("_pageid", d20.Campaign.activePage().get("id"));
							o.model.set("_path", JSON.stringify(o.path));

							console.log("SPLITTING PATH: ", o.model.toJSON());
							const mainPath = o.model;

							// BEGIN PathSplitter CODE
							let mainSegments = PathMath.toSegments(mainPath);
							// BEGIN MOD
							// fake a tiny diagonal line
							const SLICE_LEN = 10;
							const slicePoint1 = [lastPoint.x + (SLICE_LEN / 2), lastPoint.y + (SLICE_LEN / 2), 1];
							const slicePoint2 = [lastPoint.x - (SLICE_LEN / 2), lastPoint.y - (SLICE_LEN / 2), 1];
							const nuId = d20plus.ut.generateRowId();
							d20plus.engine._tempTopRenderLines[nuId] = {
								ticks: 2,
								x: slicePoint1[0],
								y: slicePoint1[1],
								to_x: slicePoint2[0],
								to_y: slicePoint2[1],
								offset: [...d20.engine.currentCanvasOffset]
							};
							setTimeout(() => {
								d20.engine.redrawScreenNextTick();
							}, 1);
							let splitSegments = [
								[slicePoint1, slicePoint2]
							];
							// END MOD
							let segmentPaths = _getSplitSegmentPaths(mainSegments, splitSegments);

							// (function moved into this scope)
							function _getSplitSegmentPaths(mainSegments, splitSegments) {
								let resultSegPaths = [];
								let curPathSegs = [];

								_.each(mainSegments, seg1 => {

									// Find the points of intersection and their parametric coefficients.
									let intersections = [];
									_.each(splitSegments, seg2 => {
										let i = PathMath.segmentIntersection(seg1, seg2);
										if (i) intersections.push(i);
									});

									if (intersections.length > 0) {
										// Sort the intersections in the order that they appear along seg1.
										intersections.sort((a, b) => {
											return a[1] - b[1];
										});

										let lastPt = seg1[0];
										_.each(intersections, i => {
											// Complete the current segment path.
											curPathSegs.push([lastPt, i[0]]);
											resultSegPaths.push(curPathSegs);

											// Start a new segment path.
											curPathSegs = [];
											lastPt = i[0];
										});
										curPathSegs.push([lastPt, seg1[1]]);
									} else {
										curPathSegs.push(seg1);
									}
								});
								resultSegPaths.push(curPathSegs);

								return resultSegPaths;
							};
							// (end function moved into this scope)

							// Convert the list of segment paths into paths.
							let _pageid = mainPath.get('_pageid');
							let controlledby = mainPath.get('controlledby');
							let fill = mainPath.get('fill');
							let layer = mainPath.get('layer');
							let stroke = mainPath.get('stroke');
							let stroke_width = mainPath.get('stroke_width');

							let results = [];
							_.each(segmentPaths, segments => {
								// BEGIN MOD
								if (!segments) {
									d20plus.chatLog(`A path had no segments! This is probably a bug. Please report it.`);
									return;
								}
								// END MOD

								let pathData = PathMath.segmentsToPath(segments);
								_.extend(pathData, {
									_pageid,
									controlledby,
									fill,
									layer,
									stroke,
									stroke_width
								});
								let path = createObj('path', pathData);
								results.push(path);
							});

							// Remove the original path and the splitPath.
							// BEGIN MOD
							mainPath.destroy();
							// END MOD
							// END PathSplitter CODE
						}
					}
				});
			}
			// END MOD
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
				downx: ii,
				downy: nn
			}, d20.engine.redrawScreenNextTick(!0)
		}
		const g = ["select", "path", "text", "fxtools", "measure", "fxtools", "rect"];
		d20.engine.rightMouseIsDown && g.includes(d20.engine.mode) || d20.engine.leftMouseIsDown && "pan" === d20.engine.mode ? (d20.engine.pan.beginPos = [wrp.scrollLeft(), wrp.scrollTop()], d20.engine.pan.panXY = [ii, nn], d20.engine.pan.panning = !0, $(`#finalcanvas`).css("cursor", "grabbing")) : d20.engine.pan.panning = !1, 2 === e.button && !d20.engine.leftMouseIsDown && d20.engine.measurements[window.currentPlayer.id] && d20.engine.measurements[window.currentPlayer.id].sticky && (d20.engine.endMeasure(), d20.engine.announceEndMeasure({
			player: window.currentPlayer.id
		}))
		
        $(`#finalcanvas`).hasClass("hasfocus") || $(`#finalcanvas`).focus()
	}
	
	
	const canvasHandlerMove = function(e) {
		// BEGIN MOD
		var cnv = d20.engine.canvas;
		var wrp = $("#editor-wrapper");
		// END MOD
		var t, i;
		if (e.changedTouches ? ((e.changedTouches.length > 1 || "pan" == d20.engine.mode) && (delete d20.engine.pings[window.currentPlayer.id], d20.engine.pinging = !1), e.preventDefault(), t = e.changedTouches[0].pageX, i = e.changedTouches[0].pageY) : (t = e.pageX, i = e.pageY), "select" != d20.engine.mode && "path" != d20.engine.mode && "targeting" != d20.engine.mode || cnv.__onMouseMove(e), d20.engine.leftMouseIsDown || d20.engine.rightMouseIsDown) {
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
						// BEGIN MOD
						,
						Ve: {
							mode: $selMeasureMode.val(),
							radius: {
								mode: $selRadMode.val()
							},
							cone: {
								arc: $iptConeWidth.val(),
								mode: $selConeMode.val()
							},
							box: {
								mode: $selBoxMode.val(),
							},
							line: {
								mode: $selLineMode.val(),
								width: $iptLineWidth.val()
							}
						}
						// END MOD
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
				wrp.stop().animate({
					scrollLeft: h,
					scrollTop: p
				}, {
					duration: 1,
					easing: "linear",
					queue: !1
				})
			}
		}
	}

	d20plus.overwrites.canvasHandlerDown = canvasHandlerDown
	d20plus.overwrites.canvasHandlerMove = canvasHandlerMove
}
SCRIPT_EXTENSIONS.push(initCanvasHandlerOverwrite);
