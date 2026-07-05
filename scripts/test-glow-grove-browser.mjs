import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('glow-grove');
console.log(JSON.stringify(result, null, 2));
