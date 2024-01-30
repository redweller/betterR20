{
	const params = [
		{sId: "a1", id: "showplayers_aura1", inv: false, },
		{sId: "a2", id: "showplayers_aura2", inv: false, },
		{sId: "b1", id: "showplayers_bar1", inv: false, },
		{sId: "b2", id: "showplayers_bar2", inv: false, },
		{sId: "b3", id: "showplayers_bar3", inv: false, },
		{sId: "n", id: "showname", inv: false, },
		{sId: "i", id: "imgsrc", inv: "https://s3.amazonaws.com/files.d20.io/images/4277467/iQYjFOsYC5JsuOPUCI9RGA/thumb.png?1401938659", },
	];    
	const token = d20.engine.selected()[0]?.model;
	const toInvisible = !token?.attributes.b20_invisible || token?.attributes.b20_invisible === "{}";
	const apply = {};
	const stash = toInvisible ? {} : JSON.parse(token?.attributes.b20_invisible);
	params.forEach(p => {
		if (!toInvisible) stash[p.sId] !== undefined && (apply[p.id] = stash[p.sId]);
		else if (token.attributes[p.id] !== p.inv) {
			stash[p.sId] = token.attributes[p.id];
			apply[p.id] = p.inv;
		}
	})
	console.log(JSON.stringify(stash));
	if (toInvisible) apply.b20_invisible = JSON.stringify(stash);
	else apply.b20_invisible = null;
    token?.save(apply);
}