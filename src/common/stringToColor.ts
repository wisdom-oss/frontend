
/**
 * Generates deterministically a hex color code from any string.
 *
 * This is a modernized version of this
 * [StackOverflow reply](https://stackoverflow.com/a/16348977/15800714).
 * @param str A string to generate a hex color for
 * @param map A color map for predefined strings
 *
 * @returns A hex color code in the style of '#abc123'
 */
export function stringToColor(str: string, map?: Record<string, string>): string {
  if (map && map[str]) {
    return map[str];
  }
  let hash = 0;
  for (let s of str) {
    hash = s.charCodeAt(0) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).slice(-2);
  }
  return color;
}

