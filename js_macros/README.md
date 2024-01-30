# roll20 JavaScript Macros (requires betteR20)

Since v1.35.0 betteR20 allows executing JavaScript code in roll20 chat macros. 
The system uses regular JS syntax that may significantly extend roll20 functionality without confines of roll20 chat commands or its paid API.

> Please **DO NOT** post about these scripts or any related content in official channels, including the Roll20 forums.
> For help regarding betteR20 or js macros, pls visit official [5etools Discord](https://discord.gg/nGvRCDs) server


## Usage

To use js macro follow these steps:

1. Create a new macro and tick the `Execute as JS` checkbox in the bottom of the dialog.
2. Paste whole js script to macro editor and press `Save`. You can test it without saving if you need.
3. You can also use this macro as a Token Action, if you tick the corresponding checkbox.
4. You can share this macro with other players, but they will need to select `"Run all scripts"` in betteR20 config in order to use it.

## Prerequisites

- You will need betteR20 script for [TamperMonkey](https://www.tampermonkey.net/).
You can get help installing betteR20 on [5etools wiki](https://wiki.tercept.net/en/betteR20/betteR20_Installation)
- betteR20 in turn requires [VTTES](https://justas-d.github.io/roll20-enhancement-suite/) addon to operate properly.
GM and the players both need it to use betteR20

Your players will also need betteR20 to use these macros. Otherwise, when they try to run such macro, the obfuscated code will be simply output to chat as is.
