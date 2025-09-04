import { zip } from "./zip";

describe("zip (eager)", () => {
  it("zips two arrays", () => {
    const a = ["x", "y", "z"];
    const b = [1, 2, 3];
    const out = zip(a, b);
    expect(out).toEqual([["x", 1], ["y", 2], ["z", 3]]);
  });

  it("zips multiple arrays", () => {
    const a = ["x", "y"];
    const b = [1, 2];
    const c = [true, false];
    const d = ["a", "b"];
    const out = zip(a, b, c, d);
    expect(out).toEqual([["x", 1, true, "a"], ["y", 2, false, "b"]]);
  });

  it("stops at the shortest input by default", () => {
    const a = ["x"];
    const b = [1, 2];
    const out = zip(a, b);
    expect(out).toEqual([["x", 1]]);
  });

  it("pads to the longest with undefined", () => {
    const a = ["x"];
    const b = [1, 2];
    const out = zip({ longest: true }, a, b);
    expect(out).toEqual([
      ["x", 1],
      [undefined, 2],
    ]);
  });

  it("pads to the longest with custom fallback", () => {
    const a = ["x"];
    const b = [1, 2];
    const out = zip({ longest: true, fallback: 0 }, a, b);
    expect(out).toEqual([
      ["x", 1],
      [0, 2],
    ]);
  });

  it("works with zero iterables (returns empty array)", () => {
    const out = zip();
    expect(out).toEqual([]);
  });

  it("works with non-array iterables (Set, string)", () => {
    const s = new Set([10, 20]);
    const t = "ab";
    const out = zip(s, t);
    expect(out).toEqual([
      [10, "a"],
      [20, "b"],
    ]);
  });

  it("works with generators", () => {
    function* gen(n: number) {
      for (let i = 0; i < n; i++) yield i;
    }
    const out = zip(gen(1), gen(3)); // shortest wins
    expect(out).toEqual([[0, 0]]);
  });

  it("handles mixed lengths across 3+ iterables", () => {
    const a = [1, 2, 3];
    const b = ["a"];
    const c = [true, false];
    const out = zip({ longest: true, fallback: null }, a, b, c);
    expect(out).toEqual([
      [1, "a", true],
      [2, null, false],
      [3, null, null],
    ]);
  });

  it("does not mutate inputs", () => {
    const a = [1, 2];
    const b = [3, 4, 5];
    const snapshotA = [...a];
    const snapshotB = [...b];
    zip({ longest: true }, a, b);
    expect(a).toEqual(snapshotA);
    expect(b).toEqual(snapshotB);
  });

  it("handles empty inputs among non-empty with padding", () => {
    const a: number[] = [];
    const b = ["x", "y"];
    const out = zip({ longest: true }, a, b);
    expect(out).toEqual([[undefined, "x"], [undefined, "y"]]);
  });

  it("keeps column alignment with heterogeneous types", () => {
    const names = ["Ada", "Linus"];
    const ages = [36];
    const ids = new Set([1, 2, 3]);
    const out = zip({ longest: true, fallback: null }, names, ages, ids);
    expect(out).toEqual([
      ["Ada", 36, 1],
      ["Linus", null, 2],
      [null, null, 3],
    ]);
  });
});
