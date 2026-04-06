import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('aurora-breach');
console.log(JSON.stringify(result, null, 2));
