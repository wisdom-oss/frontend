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

  static assertColorChannel(value: number, channelName: string) {
    if (value < 0 || value > 255) {
      throw new Error(
        `${value} is not a valid value for the ${channelName} channel`,
      );
    }
  }

  static assertAlphaChannel(value: number) {
    if (value < 0 || value > 1) {
      throw new Error(`${value} is not a valid value for the alpha channel`);
    }
  }

  toString(): string {
    let {r, g, b, a} = this;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  /**
   * Creates a copy of this color with one channel changed.
   *
   * @returns A new `RgbaColor` with the updated channel
   */
  with(channel: "red" | "green" | "blue" | "alpha", value: number): RgbaColor {
    let {r, g, b, a} = this;
    switch (channel) {
      case "red":
        return new RgbaColor(value, g, b, a);
      case "green":
        return new RgbaColor(r, value, b, a);
      case "blue":
        return new RgbaColor(r, g, value, a);
      case "alpha":
        return new RgbaColor(r, g, b, value);
    }
  }
}
