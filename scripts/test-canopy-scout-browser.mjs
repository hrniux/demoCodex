import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('canopy-scout');
console.log(JSON.stringify(result, null, 2));
