# Development

Node.js is required.

Usable scripts can be produced with `npm run build`; this output to the `dist/` directory:

- The "core" userscript includes generic improvements which can be used in all games.
- The "5etools" userscript includes the above, and various tools to import content from [5e.tools](https://5e.tools).

# PR Etiquette

- Do not commit/push modifications to the build output found in `dist/*.user.js`. These files should be updated only on final release, to avoid unnecessary diff churn.
- Include an explanation/description of your changes, preferably with screenshots, in your PR description. This speeds up review, and ensure an accurate summary of your changes are listed in the changelog!

# Code Style

Adhere to the code style defined in `.eslintrc.js`. ESLint is popular enough that most IDEs have plugins to support in-editor hinting/auto-formatting, should you want to use it.

Due to the nature of the codebase (which includes ancient relics, questionable hacks, `eval`s, and blocks of partially-minified code), `eslint-disable` is often used to temporarily disable the linter. This should only be done as a matter of absolute necessity. Where possible, rewrite code to avoid this (for instance, implement high-quality error handling which provides visible feedback to the user, instead of logging to the console). The main exception to this rule concerns modded minified Roll20 code--avoid changes here, to allow easier future "diffs" versus Roll20's live version.

# Read-Only/Library Files

The contents of `data/` and `lib/` are stored copies of 5etools files, and should be considered read-only. This is done so that updates to 5etools do not require a lock-step rollout of betteR20, when breaking changes are made.

Should modification to these files be required, a PR should be made against the [5etools repository](https://github.com/5etools-mirror-1/5etools-mirror-1.github.io).
