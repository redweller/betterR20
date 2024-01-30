// b20-JS: Delete all doors, windows and graphics in DL layer
// Just what the title says, it deletes all portals and walls
// Since you can't select multiple portals at once, this script does it for you

const doors = d20.Campaign.activePage().doors.models;
const windows = d20.Campaign.activePage().windows.models;
const portals = [].concat(doors, windows);
const lines = d20.Campaign.activePage().thepaths.models.filter(l => l.attributes.type === "path" && l.attributes.layer === "walls");

const lLength = lines.length;
const pLength = portals.length;

const inView = (obj) => {
    for (let i=0; i<6; i++) if (obj.attributes[`bR20_view${i}`]) return true;
    return false;
}

for (let i = 0; i < pLength; i++) {
    if (inView(portals[i])) continue;
    setTimeout(() => {
        portals[i].destroy();
    }, i*10);
}

for (let i = 0; i < lLength; i++) {
    if (inView(lines[i])) continue;
    setTimeout(() => {
        lines[i].destroy();
    }, i*10);
}