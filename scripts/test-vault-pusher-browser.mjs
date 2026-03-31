import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('vault-pusher');
console.log(JSON.stringify(result, null, 2));
