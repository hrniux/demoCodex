import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('lunar-lock');
console.log(JSON.stringify(result, null, 2));
