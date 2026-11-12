import {expect} from "@jest/globals";
import dayjs from "dayjs";

describe("toBeSameDate", () => {
  const date = dayjs("2026-01-01T00:00:00Z");

  it("compares separate objects representing the same instant", () => {
    expect(date.clone()).toBeSameDate(date);
  });

  it("supports negation for different instants", () => {
    expect(date.add(1, "millisecond")).not.toBeSameDate(date);
  });

  it("fails for different instants", () => {
    expect(() => expect(date.add(1, "millisecond")).toBeSameDate(date)).toThrow(
      "Received:",
    );
  });

  it("fails when negated dates represent the same instant", () => {
    expect(() => expect(date.clone()).not.toBeSameDate(date)).toThrow(
      "Expected: not",
    );
  });

  it("rejects non-Day.js values even when negated", () => {
    expect(() => expect(null).toBeSameDate(date)).toThrow(TypeError);
    expect(() => expect(new Date()).not.toBeSameDate(date)).toThrow(TypeError);
  });

  it("does not consider invalid dates equal", () => {
    expect(dayjs("invalid")).not.toBeSameDate(dayjs("invalid"));
  });
});
