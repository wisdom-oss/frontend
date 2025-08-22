import {computed, signal, Signal as CoreSignal} from "@angular/core";

import {api} from "./api";

describe("api.require", () => {
  it("returns the full record when all fields are defined (plain values)", () => {
    const out = api.require({a: 1, b: "x"});
    expect(out()).toEqual({a: 1, b: "x"});
  });

  it("stays undefined until all signals are defined, then yields the object", () => {
    const a = signal<number | undefined>(undefined);
    const b = signal("x");
    const out = api.require({a, b});

    expect(out()).toBeUndefined();

    a.set(42);
    expect(out()).toEqual({a: 42, b: "x"});
  });

  it("goes back to undefined if a field becomes undefined again", () => {
    const a = signal<number | undefined>(1);
    const b = signal("x");
    const out = api.require({a, b});

    expect(out()).toEqual({a: 1, b: "x"});
    a.set(undefined);
    expect(out()).toBeUndefined();
  });

  it("treats only undefined as missing; falsy values pass through", () => {
    const out = api.require({
      n: 0,
      s: "",
      f: false,
      nll: null,
    });
    expect(out()).toEqual({n: 0, s: "", f: false, nll: null});
  });

  it("works with mixed signals and plain values", () => {
    const id = signal<number | undefined>(10);
    const kind = "user";
    const out = api.require({id, kind});

    expect(out()).toEqual({id: 10, kind: "user"});
    id.set(undefined);
    expect(out()).toBeUndefined();
    id.set(11);
    expect(out()).toEqual({id: 11, kind: "user"});
  });

  it("accepts computed signals too", () => {
    const a = signal<number | undefined>(2);
    const b = computed(() => (a() === undefined ? undefined : a()! * 2));
    const out = api.require({a, b});

    expect(out()).toEqual({a: 2, b: 4});
    a.set(undefined);
    expect(out()).toBeUndefined();
  });
});
