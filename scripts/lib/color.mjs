const HEX = /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;

export function parseHex(value) {
  if (typeof value !== 'string' || !HEX.test(value))
    throw new TypeError(`Invalid hex color: ${value}`);
  let digits = value.slice(1);
  if (digits.length < 5) digits = [...digits].map((c) => c + c).join('');
  if (digits.length === 6) digits += 'FF';
  return [0, 2, 4, 6].map((i) => parseInt(digits.slice(i, i + 2), 16) / 255);
}

export function composite(top, bottom) {
  const alpha = top[3] + bottom[3] * (1 - top[3]);
  if (alpha === 0) return [0, 0, 0, 0];
  return [
    ...top.slice(0, 3).map((c, i) => (c * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / alpha),
    alpha,
  ];
}

export function flatten(layers) {
  if (!Array.isArray(layers) || !layers.length)
    throw new TypeError('At least one background layer is required');
  const colors = layers.map(parseHex);
  let result = colors.pop();
  if (result[3] !== 1) throw new Error('Bottom layer must be opaque');
  for (const color of colors.reverse()) result = composite(color, result);
  return result;
}

export function luminance(color) {
  const channels = color
    .slice(0, 3)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrast(foreground, layers) {
  const background = flatten(layers);
  const a = luminance(composite(parseHex(foreground), background));
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
