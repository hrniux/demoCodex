export function toCamelCaseName(name) {
  return name.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
}

export function deriveBrowserCaptureEnv(name) {
  return `${name.replaceAll('-', '_').toUpperCase()}_CAPTURE`;
}

export function parseNodeScriptPath(command) {
  const match = String(command).match(/(?:^|\s)(scripts\/[^\s]+\.mjs)(?:\s|$)/);
  return match ? match[1] : null;
}

export function discoverBrowserSuitesFromScripts(scripts) {
  return Object.entries(scripts)
    .map(([scriptName, command]) => {
      const match = scriptName.match(/^test:([^:]+):browser$/);
      if (!match) {
        return null;
      }

      const script = parseNodeScriptPath(command);
      if (!script) {
        return null;
      }

      const name = match[1];
      return {
        key: toCamelCaseName(name),
        scriptName,
        script,
        captureEnv: deriveBrowserCaptureEnv(name),
      };
    })
    .filter(Boolean);
}
