import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('frostbite-freight');
console.log(JSON.stringify(result, null, 2));
