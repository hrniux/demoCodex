import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('prism-relay');
console.log(JSON.stringify(result, null, 2));
