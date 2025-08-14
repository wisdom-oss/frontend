import {Injectable} from "@angular/core";
import dayjs, {Dayjs} from "dayjs";
import {Duration} from "dayjs/plugin/duration";
import typia, {tags} from "typia";

import {typeUtils} from "../common/utils/type-utils";
import {api} from "../common/api";

const URL = "/api/status" as const;

@Injectable({
  providedIn: "root",
})
export class StatusService extends api.service(URL) {
  private statusSocket?: api.Socket<Self.Status, Self.Subscribe>;

  get socket() {
    if (this.statusSocket) return this.statusSocket;

    let parse = (input: RawStatus): Self.Status =>
      input.map(element => ({
        ...element,
        lastUpdate: dayjs(element.lastUpdate),
      }));

    let serialize = (input: Self.Subscribe): SerializedSubscribe => ({
      ...input,
      data: {
        ...input.data,
        paths: input.data.paths,
        updateInterval: input.data.updateInterval.toISOString(),
      },
    });

    this.statusSocket = api.socket({
      url: `${URL}/v1/`,
      validateRaw: typia.createValidate<RawStatus>(),
      validate: typia.createValidate<Self.Status>(),
      parse,
      serialize,
    });

    return this.statusSocket;
  }
}

type RawStatus = Array<{
  path: string;
  lastUpdate: string & tags.Format<"date-time">;
  status: "ok" | "down" | "limited";
}>;

type SerializedSubscribe = {
  command: "subscribe";
  id: string | number;
  data: {
    paths: string[];
    updateInterval: string & tags.Format<"duration">;
  };
};

export namespace StatusService {
  export type Status = typeUtils.UpdateElements<
    RawStatus,
    "lastUpdate",
    {lastUpdate: Dayjs}
  >;

  export type Subscribe = typeUtils.Overwrite<
    SerializedSubscribe,
    {
      data: typeUtils.Overwrite<
        SerializedSubscribe["data"],
        {updateInterval: Duration}
      >;
    }
  >;
}

import Self = StatusService;
