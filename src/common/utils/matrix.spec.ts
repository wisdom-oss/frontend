import {matrix} from "./matrix";

describe("matrix", () => {
  it("should work with a simple list", () => {
    expect(matrix({a: [1, 2, 3]})).toEqual([{a: 1}, {a: 2}, {a: 3}]);
  });

  it("should work with two dimensions", () => {
    expect(matrix({a: [1, 2], b: [1, 2, 3]})).toEqual([
      {a: 1, b: 1},
      {a: 2, b: 1},
      {a: 1, b: 2},
      {a: 2, b: 2},
      {a: 1, b: 3},
      {a: 2, b: 3},
    ]);
  });

  it("should work lazily", () => {
    let gen = matrix.lazy({a: [1, 2]});
    expect(gen.next()).toEqual({value: {a: 1}, done: false});
    expect(gen.next()).toEqual({value: {a: 2}, done: false});
    expect(gen.next()).toEqual({value: undefined, done: true});
  });

  it("should handle three dimensions correctly", () => {
    const result = matrix({
      a: [1, 2],
      b: ["x"],
      c: [true, false],
    });
    expect(result).toEqual([
      {a: 1, b: "x", c: true},
      {a: 2, b: "x", c: true},
      {a: 1, b: "x", c: false},
      {a: 2, b: "x", c: false},
    ]);
  });

  it("should return the same results for eager and lazy", () => {
    const input = {a: [1, 2], b: ["x", "y"]} as const;
    const eagerResult = matrix(input);
    const lazyResult = [...matrix.lazy(input)];
    expect(lazyResult).toEqual(eagerResult);
  });

  it("should yield values in the correct order lazily", () => {
    const gen = matrix.lazy({x: ["a", "b"], y: [1, 2]});
    const values = Array.from(gen);
    expect(values).toEqual([
      {x: "a", y: 1},
      {x: "b", y: 1},
      {x: "a", y: 2},
      {x: "b", y: 2},
    ]);
  });
});
