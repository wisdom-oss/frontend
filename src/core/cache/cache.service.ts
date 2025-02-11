import {Injectable} from "@angular/core";
import dayjs from "dayjs";
import {Duration} from "dayjs/plugin/duration";
import Dexie from "dexie";

/**
 * A simple caching service using IndexedDB via Dexie.
 *
 * # Warning
 * Although the `value` field is typed as `any`, only JSON serializable data
 * should be stored.
 * This means data must be able to be converted to JSON and then parsed back
 * without issues.
 * This is safe for use in the cache interceptor since all received data is
 * naturally JSON serializable.
 */
@Injectable({
  providedIn: "root",
})
export class CacheService extends Dexie {
  private cache: Dexie.Table<
    {
      key: string;
      value: any;
      expire: string; // store iso date strings provided by Dayjs.toJSON
    },
    string
  >;

  constructor() {
    super("CacheDB");
    this.version(1).stores({
      cache: "key", // use "key" as primary key
    });
    this.cache = this.table("cache");
  }

  /**
   * Save a value in the cache with a specific time-to-live (TTL).
   *
   * @param value The value to store (must be JSON serializable).
   * @param ttl Time to live (duration) for the cache entry. Defaults to 1 day.
   */
  async set(
    key: string,
    value: any,
    ttl: Duration = dayjs.duration(1, "day"),
  ): Promise<void> {
    let expire = dayjs().add(ttl);
    await this.cache.put({key, value, expire: expire.toJSON()});
  }

  /**
   * Retrieve a value from the cache by its key.
   *
   * @returns The stored value if it exists and is valid, otherwise null.
   */
  async get(key: string): Promise<any | null> {
    let entry = await this.cache.get(key);

    if (entry && dayjs(entry.expire).isAfter(dayjs())) {
      return entry.value;
    }

    await this.cache.delete(key);
    return null;
  }

  /** Clears all entries from the cache. */
  async clear(): Promise<void> {
    await this.cache.clear();
  }
}
