// b20-JS: Delete all doors and windows
// Just what the title says, it deletes all doors and windows
// Since you can't select them all at once for deletion, this script does it for you

const doors = d20.Campaign.activePage().doors.models;
const windows = d20.Campaign.activePage().windows.models;
const portals = [].concat(doors, windows);
const length = portals.length;
for (let i = 0; i < length; i++) {
    setTimeout(() => {
        portals[i].destroy();
    }, i*10);
}