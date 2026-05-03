import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('echo-bazaar');
console.log(JSON.stringify(result, null, 2));
