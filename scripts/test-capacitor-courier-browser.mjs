import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('capacitor-courier');
console.log(JSON.stringify(result, null, 2));
