import {signal} from "@angular/core";

import {s} from "./s.tag";

describe("s tagged template signal", () => {
  it("works with plain values", () => {
    const result = s`Hello ${"World"}!`;
    expect(result()).toBe("Hello World!");
  });

  it("works with signal values", () => {
    const name = signal("Alice");
    const result = s`Hello ${name}!`;
    expect(result()).toBe("Hello Alice!");
    name.set("Bob");
    expect(result()).toBe("Hello Bob!");
  });

  it("works with mixed types", () => {
    const count = signal(3);
    const active = true;
    const label = "Tasks";
    const result = s`${count} ${label}, active: ${active}`;
    expect(result()).toBe("3 Tasks, active: true");
    count.set(5);
    expect(result()).toBe("5 Tasks, active: true");
  });

  it("works with args at the start and end", () => {
    const start = signal(">>");
    const end = signal("<<");
    const mid = "middle";
    const result = s`${start} ${mid} ${end}`;
    expect(result()).toBe(">> middle <<");
    end.set("!!");
    expect(result()).toBe(">> middle !!");
  });
});
