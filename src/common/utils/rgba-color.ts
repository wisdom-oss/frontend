// prettier-ignore
type HexChar = 
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "a" | "b" | "c" | "d" | "e" | "f"
  | "A" | "B" | "C" | "D" | "E" | "F";

/**
 * Represents an immutable RGBA color.
 *
 * All channel values are checked at construction:
 * - Red, green, and blue must be between 0 and 255.
 * - Alpha must be between 0 and 1.
 *
 * Use `toString()` to get a CSS-compatible `rgba()` string.
 * Use `with()` to create a modified copy with one channel changed.
 */
export class RgbaColor {
  // Named CSS Colors
  // https://developer.mozilla.org/en-US/docs/Web/CSS/named-color
  static readonly BLACK = RgbaColor.fromHex("#000000");
  static readonly SILVER = RgbaColor.fromHex("#c0c0c0");
  static readonly GRAY = RgbaColor.fromHex("#808080");
  static readonly WHITE = RgbaColor.fromHex("#ffffff");
  static readonly MAROON = RgbaColor.fromHex("#800000");
  static readonly RED = RgbaColor.fromHex("#ff0000");
  static readonly PURPLE = RgbaColor.fromHex("#800080");
  static readonly FUCHSIA = RgbaColor.fromHex("#ff00ff");
  static readonly GREEN = RgbaColor.fromHex("#008000");
  static readonly LIME = RgbaColor.fromHex("#00ff00");
  static readonly OLIVE = RgbaColor.fromHex("#808000");
  static readonly YELLOW = RgbaColor.fromHex("#ffff00");
  static readonly NAVY = RgbaColor.fromHex("#000080");
  static readonly BLUE = RgbaColor.fromHex("#0000ff");
  static readonly TEAL = RgbaColor.fromHex("#008080");
  static readonly AQUA = RgbaColor.fromHex("#00ffff");

  constructor(
    readonly r: number,
    readonly g: number,
    readonly b: number,
    readonly a: number = 1.0,
  ) {
    RgbaColor.assertColorChannel(r, "red");
    RgbaColor.assertColorChannel(g, "green");
    RgbaColor.assertColorChannel(b, "blue");
    RgbaColor.assertAlphaChannel(a);
  }

  private static assertColorChannel(value: number, channelName: string) {
    if (value < 0 || value > 255) {
      throw new Error(
        `${value} is not a valid value for the ${channelName} channel`,
      );
    }
  }

  private static assertAlphaChannel(value: number) {
    if (value < 0 || value > 1) {
      throw new Error(`${value} is not a valid value for the alpha channel`);
    }
  }

  /**
   * Creates a color from a hex string in the form "#rrggbb".
   *
   * TypeScript enforces that only valid hex strings are allowed via a template
   * literal type.
   * If you pass in something invalid, the compiler may try to expand the
   * allowed character union and complain about a "too complex union type".
   * In that case, check that the string really matches the "#rrggbb" format
   * with only 0–9, a–f, or A–F characters.
   *
   * @example
   * const red = RgbaColor.fromHex("#ff0000");
   * const green = RgbaColor.fromHex("#00ff00");
   */
  static fromHex<
    R0 extends HexChar,
    R1 extends HexChar,
    G0 extends HexChar,
    G1 extends HexChar,
    B0 extends HexChar,
    B1 extends HexChar,
  >(hex: `#${R0}${R1}${G0}${G1}${B0}${B1}`): RgbaColor {
    // @ts-ignore don't try to check the union type for hex, it's too complex
    const n = parseInt(hex.slice(1), 16);
    return new RgbaColor((n >> 16) & 255, (n >> 8) & 255, n & 255);
  }

  /**
   * Creates a color from a string by hashing its characters
   * into RGB values in the range 0–255.
   * You can also provide a map of overrides for certain keys.
   *
   * @example
   * const overrides = {
   *   error: RgbaColor.fromHex("#ff0000"),
   *   success: RgbaColor.fromHex("#00ff00"),
   * };
   *
   * const c1 = RgbaColor.fromString("hello");   // hashed color
   * const c2 = RgbaColor.fromString("error", overrides); // -> red
   */
  static fromString(input: string, map?: Record<string, RgbaColor>): RgbaColor {
    if (map && map[input]) return map[input];

    let hash = 0;
    for (let s of input) {
      hash = s.charCodeAt(0) + ((hash << 5) - hash);
    }

    const r = (hash >> 0) & 0xff;
    const g = (hash >> 8) & 0xff;
    const b = (hash >> 16) & 0xff;

    return new RgbaColor(r, g, b, 1.0);
  }

  toString(): string {
    let {r, g, b, a} = this;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  /**
   * Returns this color as a hex string (#rrggbb).
   *
   * This ignores the alpha channel.
   */
  toHex(): string {
    const {r, g, b} = this;
    const hex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  }

  /**
   * Creates a copy of this color with one channel changed.
   *
   * @returns A new `RgbaColor` with the updated channel
   */
  with(channel: "red" | "green" | "blue" | "alpha", value: number): RgbaColor {
    let {r, g, b, a} = this;
    // prettier-ignore
    switch (channel) {
      case "red": return new RgbaColor(value, g, b, a);
      case "green": return new RgbaColor(r, value, b, a);
      case "blue": return new RgbaColor(r, g, value, a);
      case "alpha": return new RgbaColor(r, g, b, value);
    }
  }
}
