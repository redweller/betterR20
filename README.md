**If you wish to use creatures with the Shaped sheet, import with your game using the OGL sheet, and then switch to the shaped sheet afterwards.** Due to the complexity of the process (read: it's a colossal hack), we are unable to support both sheets natively.

## How to import 5etools beasts/spells/items into Roll20
1. Get Greasemonkey (Firefox) or Tampermonkey (Chrome).

2. Click [here](https://github.com/astranauta/5etoolsR20/raw/master/5etoolsR20.user.js) and install the script.

3. Open the Roll20 game where you want the stuff imported.

4. Go to the gear icon and click on the things you want imported.

5. Let it run. The journal will start fill up with the stuff you selected. It's not too laggy but can take a long time depending on the amount of stuff you selected.

6. Bam. Done. If you are using the Shaped sheet, be sure to open up the NPC sheets and let them convert before using it.

## Development
Node.js is required.

Usable scripts can be produced with `npm run build`; output to the `build/` directory.

The "core" userscript includes generic improvements which can be used in all games.
The "5etools" userscript includes the above, and various tools to import content from [5e.tools](https://5e.tools) 