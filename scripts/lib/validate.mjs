import { parseHex } from './color.mjs';

export function validateTheme(theme, registry, contract) {
  const errors = [];
  const require = (condition, message) => {
    if (!condition) errors.push(message);
  };
  const color = (value, where) => {
    try {
      return parseHex(value);
    } catch {
      errors.push(`${where}: invalid color ${value}`);
      return undefined;
    }
  };
  const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  require(theme.$schema === 'vscode://schemas/color-theme', 'Missing theme schema');
  require(theme.semanticHighlighting === true, 'Semantic highlighting must be enabled');
  if (
    !object(theme.colors) ||
    !Array.isArray(theme.tokenColors) ||
    !object(theme.semanticTokenColors)
  )
    return [...errors, 'Invalid theme structure'];
  for (const [key, value] of Object.entries(theme.colors)) {
    const registration = registry.colors[key];
    require(registration !== undefined, `Unknown VS Code color: ${key}`);
    require(!registration?.deprecationMessage, `Deprecated VS Code color: ${key}`);
    const parsed = color(value, key);
    if (parsed && registry.colors[key]?.requiresTransparency)
      require(parsed[3] < 1, `${key} must be translucent`);
  }
  for (const [index, rule] of theme.tokenColors.entries()) {
    if (!object(rule) || !object(rule.settings)) {
      errors.push(`Invalid TextMate rule ${index}`);
      continue;
    }
    require(typeof rule.name === 'string' &&
      rule.name.length > 0, `TextMate rule ${index} needs a name`);
    if (index !== 0 || rule.scope !== undefined)
      require((typeof rule.scope === 'string' && rule.scope.length > 0) ||
        (Array.isArray(rule.scope) &&
          rule.scope.length > 0 &&
          rule.scope.every(
            (s) => typeof s === 'string' && s.length > 0,
          )), `${rule.name}: invalid scope`);
    if (rule.settings.foreground !== undefined) color(rule.settings.foreground, rule.name);
    require(rule.settings.background ===
      undefined, `${rule.name}: per-token backgrounds are not supported by the editor`);
    require(typeof rule.settings.fontStyle === 'string' &&
      rule.settings.fontStyle
        .split(/\s+/)
        .every((s) =>
          ['', 'bold', 'underline', 'strikethrough'].includes(s),
        ), `${rule.name}: invalid or italic fontStyle`);
  }
  for (const [selector, style] of Object.entries(theme.semanticTokenColors)) {
    require(/^(?:\*|[\w-]+)(?:\.[\w-]+)*(?::[\w-]+)?$/.test(
      selector,
    ), `Invalid semantic selector: ${selector}`);
    if (!object(style)) {
      errors.push(`${selector}: use explicit semantic style objects`);
      continue;
    }
    require(style.italic === false, `${selector}: semantic italic must be explicitly false`);
    require(style.fontStyle === undefined, `${selector}: use boolean semantic style properties`);
    for (const [key, value] of Object.entries(style)) {
      require(['foreground', 'italic', 'bold', 'underline', 'strikethrough'].includes(
        key,
      ), `${selector}: unknown semantic style ${key}`);
      if (key === 'foreground') color(value, selector);
      else require(typeof value === 'boolean', `${selector}.${key}: expected a boolean`);
    }
  }
  const covered = new Set();
  for (const pair of contract.pairs) {
    require(['text', 'indicator'].includes(pair.kind), `${pair.foreground}: invalid contrast kind`);
    require(pair.minimum ===
      (pair.kind === 'text' ? 4.5 : 3), `${pair.foreground}: incorrect contrast threshold`);
    for (const key of [pair.foreground, ...pair.backgrounds]) {
      covered.add(key);
      require(key in theme.colors, `Missing contracted color: ${key}`);
    }
  }
  for (const surface of contract.syntaxSurfaces)
    for (const key of surface.backgrounds) {
      covered.add(key);
      require(key in theme.colors, `Missing syntax background: ${key}`);
    }
  for (const [key, reason] of Object.entries(contract.exclusions)) {
    require(key in theme.colors, `Stale exclusion: ${key}`);
    require(typeof reason === 'string' &&
      reason.length > 20, `${key}: exclusion requires a reason`);
    require(!covered.has(key), `${key}: audited color should not also be excluded`);
  }
  for (const key of Object.keys(theme.colors))
    require(covered.has(key) || key in contract.exclusions, `Unclassified color: ${key}`);
  return errors;
}

export function validateParity(dark, light) {
  const errors = [];
  const keys = (object) => Object.keys(object).sort();
  for (const field of ['colors', 'semanticTokenColors']) {
    if (JSON.stringify(keys(dark[field])) !== JSON.stringify(keys(light[field])))
      errors.push(`${field}: dark/light parity mismatch`);
  }
  const rules = (theme) =>
    theme.tokenColors.map(({ name, scope, settings }) => ({
      name,
      scope,
      fontStyle: settings.fontStyle,
    }));
  if (JSON.stringify(rules(dark)) !== JSON.stringify(rules(light)))
    errors.push('TextMate scope/order/style parity mismatch');
  return errors;
}
