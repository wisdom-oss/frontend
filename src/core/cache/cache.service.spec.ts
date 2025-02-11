import {TestBed} from "@angular/core/testing";
import dayjs from "dayjs";

import {CacheService} from "./cache.service";

describe("CacheService", () => {
  let service: CacheService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [CacheService],
    });

    service = TestBed.inject(CacheService);
    await service.clear(); // ensure fresh state before each test
  });

  afterEach(async () => {
    await service.clear(); // cleanup after tests
  });

  it("should store and retrieve a value before expiration", async () => {
    await service.set("testKey", "testValue", dayjs.duration(1, "hour"));
    const value = await service.get("testKey");
    expect(value).toBe("testValue");
  });

  it("should return null for expired values and remove them", async () => {
    const expiredTime = dayjs.duration(-1, "minute"); // Set in the past
    await service.set("expiredKey", "expiredValue", expiredTime);
    const value = await service.get("expiredKey");

    expect(value).toBeNull();

    // Ensure the entry is removed
    const dbValue = await service["cache"].get("expiredKey");
    expect(dbValue).toBeUndefined();
  });

  it("should delete an entry after expiration", async () => {
    await service.set("tempKey", "tempValue", dayjs.duration(1, "second"));
    await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for expiration
    const value = await service.get("tempKey");

    expect(value).toBeNull();

    const dbValue = await service["cache"].get("tempKey");
    expect(dbValue).toBeUndefined();
  });

  it("should clear all cache entries", async () => {
    await service.set("key1", "value1", dayjs.duration(1, "day"));
    await service.set("key2", "value2", dayjs.duration(1, "day"));

    await service.clear();

    const value1 = await service.get("key1");
    const value2 = await service.get("key2");

    expect(value1).toBeNull();
    expect(value2).toBeNull();
  });

  it("should overwrite an existing key", async () => {
    await service.set("overwriteKey", "oldValue", dayjs.duration(1, "day"));
    await service.set("overwriteKey", "newValue", dayjs.duration(1, "day"));

    const value = await service.get("overwriteKey");
    expect(value).toBe("newValue");
  });

  it("should store and retrieve objects", async () => {
    const obj = {name: "test", value: 42};
    await service.set("objectKey", obj, dayjs.duration(1, "day"));

    const value = await service.get("objectKey");
    expect(value).toEqual(obj);
  });
});
