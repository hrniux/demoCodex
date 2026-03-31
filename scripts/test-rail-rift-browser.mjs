import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('rail-rift');
console.log(JSON.stringify(result, null, 2));
