import { defaults } from "./defaults";

describe("defaults", () => {
  it("returns existing values, uses generator for missing ones", () => {
    let initial: Record<string, string> = {a: "initial"};
    let gen = () => "generated";
    let record = defaults(initial, gen);

    expect(record["a"]).toEqual("initial");
    expect(record["b"]).toEqual("generated");
  });

  it("returns existing values or empty object for missing ones", () => {
    let initial: Record<string, {value: number}> = {a: {value: 5}};
    let record = defaults(initial);
    
    expect(record["a"]).toEqual({value: 5});
    expect(record["b"]).toEqual({});
  });
});