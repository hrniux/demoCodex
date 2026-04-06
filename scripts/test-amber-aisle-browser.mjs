import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('amber-aisle');
console.log(JSON.stringify(result, null, 2));
