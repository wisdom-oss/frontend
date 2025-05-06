import {HttpClient, HttpContext} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {firstValueFrom} from "rxjs";
import typia from "typia";

import {httpContexts} from "../common/http-contexts";

const URL = "/api/bws" as const;

@Injectable({
  providedIn: "root",
})
export class BeWaterSmartService {
  constructor(private http: HttpClient) {}

  fetchPhysicalMeters(): Promise<BeWaterSmartService.PhysicalMeters> {
    return firstValueFrom(
      this.http.get<BeWaterSmartService.PhysicalMeters>(
        `${URL}/physical-meters`,
        {
          context: new HttpContext().set(
            httpContexts.validateType,
            typia.createValidate<BeWaterSmartService.PhysicalMeters>(),
          ),
        },
      ),
    );
  }

  fetchVirtualMeters(): Promise<BeWaterSmartService.VirtualMeters> {
    return firstValueFrom(
      this.http.get<BeWaterSmartService.VirtualMeters>(
        `${URL}/virtual-meters`,
        {
          context: new HttpContext().set(
            httpContexts.validateType,
            typia.createValidate<BeWaterSmartService.VirtualMeters>(),
          ),
        },
      ),
    );
  }

  fetchAlgorithms(): Promise<BeWaterSmartService.Algorithms> {
    return firstValueFrom(
      this.http.get<BeWaterSmartService.Algorithms>(`${URL}/algorithms`, {
        context: new HttpContext().set(
          httpContexts.validateType,
          typia.createValidate<BeWaterSmartService.Algorithms>(),
        ),
      }),
    );
  }

  fetchModels(): Promise<BeWaterSmartService.Models> {
    return firstValueFrom(
      this.http.get<BeWaterSmartService.Models>(`${URL}/models`, {
        context: new HttpContext().set(
          httpContexts.validateType,
          typia.createValidate<BeWaterSmartService.Models>(),
        ),
      }),
    );
  }

  getCreateForecast(
    meterId: string,
    algId: string,
  ): Promise<BeWaterSmartService.Forecasts> {
    return firstValueFrom(
      this.http.get<BeWaterSmartService.Forecasts>(
        `${URL}/meters/${meterId}/forecast?algorithm=${algId}`,
        {
          context: new HttpContext().set(
            httpContexts.validateType,
            typia.createValidate<BeWaterSmartService.Forecasts>(),
          ),
        },
      ),
    );
  }

  addVirtualMeterWithId(id: string, submeters: {submeterIds: string[]}) {
    return firstValueFrom(
      this.http.post(`${URL}/virtual-meters?name=${id}`, submeters),
    );
  }

  delVirtualMeterById(id: string) {
    return firstValueFrom(this.http.delete(`${URL}/virtual-meters/${id}`));
  }

  /**
   * train a new model via bws api -> every virtual meter can only hold a single model in combination with a algorithm
   */
  putTrainModel(
    meter: BeWaterSmartService.VirtualMeter,
    input: Algorithm,
    comment?: string,
  ) {
    let virt = meter.id.toString();
    let alg = input.name.toString();

    let url = `${URL}/meters/${virt}/models/${alg}`;
    if (comment) {
      url = `${url}?comment=${comment}`;
    }

    return firstValueFrom(this.http.put<BeWaterSmartService.Models>(url, null));
  }

  delModel(meter: string, alg: string) {
    return firstValueFrom(
      this.http.delete(`${URL}/models/${meter}:MLModel:${alg}`),
    );
  }
}

export namespace BeWaterSmartService {
  export type PhysicalMeter = {
    address: {
      addressCountry: string;
      addressLocality: string;
      streetAddress: string;
    };
    category: string;
    date: string;
    description: string;
    id: string;
    type: string;
  };

  export type PhysicalMeters = {
    meters: PhysicalMeter[];
  };

  export type VirtualMeter = {
    dateCreated: string;
    description: string;
    id: string;
    submeterIds: string[];
    supermeterIds: string[];
  };

  export type VirtualMeters = {
    virtualMeters: VirtualMeter[];
  };

  export type Algorithm = {
    description: string;
    estimatedTrainingTime: (number & typia.tags.Type<"uint32">) | null;
    name: string;
  };

  export type Algorithms = {
    algorithms: Algorithm[];
  };

  export type Model = {
    algorithm: string;
    comment: string;
    dateCreated: string;
    dateModified: string;
    description: string;
    evaluation: {
      actualTestConsumption: (number & typia.tags.Type<"float">)[];
      metrics: Record<
        "mape" | "mse" | "rmse" | "smape",
        number & typia.tags.Type<"float">
      >;
      predictedTestConsumption: (number & typia.tags.Type<"float">)[];
      testCovariates: {
        day: (number & typia.tags.Type<"float">)[];
        is_holiday: (number & typia.tags.Type<"int32">)[];
        is_weekend: (number & typia.tags.Type<"int32">)[];
        month: (number & typia.tags.Type<"float">)[];
        "precipitation (mm)": (number & typia.tags.Type<"float">)[];
        year: (number & typia.tags.Type<"int32">)[];
      };
      testTimestamps: string[];
    };
    hyperparameters: Partial<{
      country_holidays: string;
      daily_seasonality: number & typia.tags.Type<"int32">;
      weekly_seasonality: number & typia.tags.Type<"int32">;
      yearly_seasonality: number & typia.tags.Type<"int32">;
      colsample_bytree: number & typia.tags.Type<"float">;
      eval_metric: string;
      gamma: number & typia.tags.Type<"int32">;
      lags: number & typia.tags.Type<"int32">;
      lags_future_covariates: (number & typia.tags.Type<"int32">)[];
      learning_rate: number & typia.tags.Type<"float">;
      max_depth: number & typia.tags.Type<"int32">;
      min_child_weight: number & typia.tags.Type<"int32">;
      objective: string;
      verbose: number & typia.tags.Type<"int32">;
      verbosity: number & typia.tags.Type<"int32">;
    }>;
    id: string;
    inputAttributes: string[];
    isModelValid: boolean;
    mlFramework: string;
    refMeter: string;
    isDefault?: boolean;
  };

  export type Models = {
    MLModels: Model[];
  };

  export type Forecast = {
    covariateValues: {
      day: number & typia.tags.Type<"int32">;
      is_holiday: number & typia.tags.Type<"int32">;
      is_weekend: number & typia.tags.Type<"int32">;
      month: number & typia.tags.Type<"float">;
      "precipitation (mm)": number & typia.tags.Type<"int32">;
      year: number & typia.tags.Type<"int32">;
    };
    datePredicted: string;
    histRefValues: {};
    id: string;
    numValue: number & typia.tags.Type<"float">;
    refDevice: string;
    type: string;
    unit: string;
  };

  export type Forecasts = Forecast[];
}
