# Spells

Roll20's JSON for spells, as mirrored by the `roll20.json` spell file in 5etools data, can be found e.g. [here](https://app.roll20.net/compendium/dnd5e/Spells%3AFireball.json?plaintext=true). Simply change the name of the spell to view others (provided they are part of the SRD).

# Importing
If you want to import import from the main site instead of the script's data, there's a hidden option `d20plus.debug.forceExternalRequests` that causes the script to pull from the main site (or external URLs) no matter what if set to true. It is false by default. This option can be set both by altering the script and by typing `d20plus.debug.forceExternalRequests = true` in console.