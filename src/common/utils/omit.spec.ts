import { omit } from "./omit";

describe("omit", () => {
  it("removes a single key", () => {
    const user = { name: "Alice", age: 30, admin: true };
    const result = omit(user, "admin");
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  it("removes multiple keys", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = omit(obj, "a", "c");
    expect(result).toEqual({ b: 2 });
  });

  it("returns the same object if no keys are omitted", () => {
    const obj = { a: 1, b: 2 };
    const result = omit(obj);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it("ignores keys that don't exist", () => {
    const obj = { a: 1, b: 2 };
    const result = omit(obj, "c" as any);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it("works with an empty object", () => {
    const result = omit({}, "a");
    expect(result).toEqual({});
  });
});
