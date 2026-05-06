import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('copper-crossing');
console.log(JSON.stringify(result, null, 2));
