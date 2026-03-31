import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('ember-shift');
console.log(JSON.stringify(result, null, 2));
