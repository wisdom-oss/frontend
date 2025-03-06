import {Scopes} from "./scopes";

describe("Scopes", () => {
  it("should return true if no scopes are required", () => {
    let scopes = new Scopes([]);
    expect(scopes.has()).toBe(true);
  });

  it("should return true if all required scopes are present", () => {
    let scopes = new Scopes(["service:read"]);
    expect(scopes.has("service:read")).toBe(true);
  });

  it("should return false if all required permissions are missing", () => {
    let scopes = new Scopes(["service:write"]);
    expect(scopes.has("service:read")).toBe(false);
  });

  it("should return true if total wildcard is applied", () => {
    let scopes = new Scopes(["*:*"]);
    expect(scopes.has("service:read")).toBe(true);
  });

  it("should return false if scopes has wildcard but wrong level", () => {
    let scopes = new Scopes(["*:write"]);
    expect(scopes.has("service:read")).toBe(false);
  });

  it("should return true if all required permissions are present", () => {
    let scopes = new Scopes(["service:read", "service:write"]);
    expect(scopes.has("service:read", "service:write")).toBe(true);
  });

  it("should return false if some required scopes are missing", () => {
    let scopes = new Scopes(["service:read"]);
    expect(scopes.has("service:read", "service:write")).toBe(false);
  });
});
