# Contributing to DemoCodex

DemoCodex values contributions that make the repository more playable, more reusable, and more watchable from a GitHub visitor's point of view.

## High-leverage contributions

- Add a new browser-playable mini game with a clear hook in the first 10 seconds.
- Refine an existing page so the mechanic, UI, and code structure all become easier to understand.
- Improve GitHub-facing assets such as screenshots, social preview images, demos, and clearer documentation.
- Strengthen low-cost validation without breaking the repository's Chrome-only browser test rule.

## Before you open a pull request

1. Keep HTML pages skeletal when possible; move styling into `src/css` and logic into `src/js`.
2. If you add a new featured page, wire it into `index.html` and update the README.
3. Run the repository checks that apply to your change:

```bash
npm run check:manifest
npm test
npm run test:browser
```

## If you want to pitch a new page

Open an issue or PR with:

- the one-line hook
- the core interaction loop
- the controls
- why it deserves to be a featured entry instead of an experiment page

## Style expectations

- Prefer vanilla browser APIs over extra dependencies.
- Favor small, comprehensible mechanics over bloated systems.
- Make pages instantly understandable from screenshots and short recordings.
- Build things that are fun to click, easy to fork, and worth starring.
