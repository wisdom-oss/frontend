import {EmptyPipe} from "./empty.pipe";

describe("EmptyPipe", () => {
  let pipe: EmptyPipe;

  beforeEach(() => {
    pipe = new EmptyPipe();
  });

  it("should return true for null", () => {
    expect(pipe.transform(null)).toBe(true);
  });

  it("should return true for undefined", () => {
    expect(pipe.transform(undefined)).toBe(true);
  });

  it("should return true for an empty string", () => {
    expect(pipe.transform("")).toBe(true);
  });

  it("should return false for a non-empty string", () => {
    expect(pipe.transform("hello")).toBe(false);
  });

  it("should return true for an empty array", () => {
    expect(pipe.transform([])).toBe(true);
  });

  it("should return false for a non-empty array", () => {
    expect(pipe.transform([1, 2, 3])).toBe(false);
  });

  it("should return true for an empty object", () => {
    expect(pipe.transform({})).toBe(true);
  });

  it("should return false for a non-empty object", () => {
    expect(pipe.transform({key: "value"})).toBe(false);
  });

  it("should return null for unsupported types", () => {
    // @ts-expect-error
    expect(pipe.transform(42)).toBeNull();
    // @ts-expect-error
    expect(pipe.transform(true)).toBeNull();
    // @ts-expect-error
    expect(pipe.transform(Symbol("test"))).toBeNull();
  });
});
