// Borrowed with <3 from Stormy's JukeboxIO
function baseJukebox () {
	d20plus.jukebox = {
		getJukeboxFileStructure () {
			d20plus.jukebox.forceJukeboxRefresh();
			return window.d20.jukebox.lastFolderStructure;
		},

		getTrackById (id) {
			return window.Jukebox.playlist.get(id);
		},

		getJukeboxPlaylists () {
			const fs = d20plus.jukebox.getJukeboxFileStructure();
			const retVals = [];

			for (const fsItem of fs) {
				if (typeof(fsItem) === "string") continue;

				const rawPlaylist = fsItem;

				const playlist = {
					name: rawPlaylist.n,
					mode: rawPlaylist.s,
					tracks: [],
				};

				for (const trackId of rawPlaylist.i) {
					const track = d20plus.jukebox.getTrackById(trackId);
					if (!track) {
						console.warn(`Tried to get track id ${trackId} but the query returned a falsy value. Skipping`);
						continue;
					}

					playlist.tracks.push(track);
				}

				retVals.push(playlist);
			}

			return retVals;
		},

		getJukeboxTracks () {
			const fs = d20plus.jukebox.getJukeboxFileStructure();

			const retVals = [];

			for (const fsItem of fs) {
				if (typeof(fsItem) !== "string") continue;

				const track = d20plus.jukebox.getTrackById(fsItem);
				if (!track) {
					console.warn(`Tried to get track id ${fsItem} but the query returned a falsy value. Skipping`);
					continue;
				}

				retVals.push(track);
			}

			return retVals;
		},

		_getExportableTrack (s) {
			return {
				loop: s.attributes.loop,
				playing: s.attributes.playing,
				softstop: s.attributes.softstop,
				source: s.attributes.source,
				tags: s.attributes.tags,
				title: s.attributes.title,
				track_id: s.attributes.track_id,
				volume: s.attributes.volume,
			};
		},

		getExportablePlaylists () {
			return d20plus.jukebox.getJukeboxPlaylists().map(p => {
				return {
					name: p.name,
					mode: p.mode,
					tracks: p.tracks.map(d20plus.jukebox._getExportableTrack),
				};
			});
		},

		getExportableTracks () {
			return d20plus.jukebox.getJukeboxTracks().map(d20plus.jukebox._getExportableTrack)
		},

		importWrappedData (data) {
			d20plus.jukebox.forceJukeboxRefresh();

			const tracks = (data.tracks || []).map(t => d20plus.jukebox.createTrack(t).id);

			const playlists = (data.playlists || []).map(p => {
				const trackIds = p.tracks.map(s => d20plus.jukebox.createTrack(s).id);
				return d20plus.jukebox.makePlaylistStructure(p.name, p.mode, trackIds);
			});

			let fs = JSON.parse(d20.Campaign.attributes.jukeboxfolder);
			fs = fs.concat(tracks, playlists);

			d20.Campaign.save({
				jukeboxfolder: JSON.stringify(fs)
			});
		},

		createTrack (data) {
			return window.Jukebox.playlist.create(data);
		},

		makePlaylistStructure (name, mode, trackIds) {
			return {
				id: window.generateUUID(),
				n: name,
				s: mode,
				i: trackIds || []
			};
		},

		forceJukeboxRefresh () {
			const $jukebox = $("#jukebox");
			const serializable = $jukebox.find("#jukeboxfolderroot").nestable("serialize");
			serializable && d20.Campaign.save({
				jukeboxfolder: JSON.stringify(serializable)
			})
		}
	};
}


SCRIPT_EXTENSIONS.push(baseJukebox);
