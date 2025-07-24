import {Injectable} from "@angular/core";
import typia from "typia";

import {api} from "../common/api";

const URL = "/api/status" as const;

@Injectable({
  providedIn: "root",
})
export class StatusService {
  private statusSocket?: api.Socket<any, any, any>;

  get socket() {
    if (this.statusSocket) return this.statusSocket;

    this.statusSocket = api.socket({
      url: `${URL}/v1/testing`,
      validate: typia.createValidate<any>(),
    });

    return this.statusSocket;
  }
}
