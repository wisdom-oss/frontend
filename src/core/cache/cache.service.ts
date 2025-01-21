import {Injectable} from "@angular/core";
import dayjs, {Dayjs} from "dayjs";
import {Duration} from "dayjs/plugin/duration";
import Dexie from "dexie";

@Injectable({
  providedIn: "root",
})
export class CacheService extends Dexie {
  private cache: Dexie.Table<
    {
      key: string;
      value: any;
      expire: Dayjs;
    },
    string
  >;

  constructor() {
    super("HttpCacheDB");
    this.version(1).stores({
      cache: "key", // use "key" as primary key
    });
    this.cache = this.table("cache");
  }

  async set(
    key: string,
    value: any,
    ttl: Duration = dayjs.duration(1, "day"),
  ): Promise<void> {
    let expire = dayjs().add(ttl);
    await this.cache.put({key, value, expire});
  }

  async get(key: string): Promise<any | null> {
    let entry = await this.cache.get(key);
    if (entry && entry.expire.isAfter(dayjs())) {
      return entry.value;
    }

    await this.cache.delete(key);
    return null;
  }

  async clear(): Promise<void> {
    await this.cache.clear();
  }
}
