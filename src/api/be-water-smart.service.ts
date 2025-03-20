import {HttpClient, HttpContext} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {firstValueFrom} from "rxjs";
import {JTDDataType} from "ajv/dist/core";

import {httpContexts} from "../common/http-contexts";

const URL = "/api/bws" as const;

@Injectable({
  providedIn: "root",
})
export class BeWaterSmartService {
  constructor(private http: HttpClient) {}

  fetchPhysicalMeters(): Promise<BeWaterSmartService.PhysicalMeters> {
    return firstValueFrom(
      this.http.get<BeWaterSmartService.PhysicalMeters>(`${URL}/physical-meters`, 
        {
          context: new HttpContext().set(
            httpContexts.validateSchema,
            PHYSICAL_METERS,
          ),
        },
      ),
    );
  }

  fetchVirtualMeters(): Promise<BeWaterSmartService.VirtualMeters> {
    return firstValueFrom(
      this.http.get<BeWaterSmartService.VirtualMeters>(`${URL}/virtual-meters`,
        {
          context: new HttpContext().set(
            httpContexts.validateSchema,
            VIRTUAL_METERS,
          )
        },
      ),
    );
  }

  fetchAlgorithms(): Promise<BeWaterSmartService.Algorithms> {
    return firstValueFrom(
      this.http.get<BeWaterSmartService.Algorithms>(`${URL}/algorithms`,
        {
          context: new HttpContext().set(
            httpContexts.validateSchema,
            ALGORITHMS,
          )
        },
      ),
    );
  }

  fetchModels(): Promise<BeWaterSmartService.Models> {
    return firstValueFrom(
      this.http.get<BeWaterSmartService.Models>(`${URL}/models`,
        {
          context: new HttpContext().set(
            httpContexts.validateSchema,
            MODELS,
          )
        },
      ),
    );
  }

  getCreateForecast(meterId: string, algId: string): Promise<BeWaterSmartService.ForeCasts> {
    return firstValueFrom(
      this.http.get<BeWaterSmartService.ForeCasts>(`${URL}/meters/${meterId}/forecast?algorithm=${algId}`,
        {
          context: new HttpContext().set(
            httpContexts.validateSchema,
            FORECASTS
          )
        },
      ),
    );
  }

  /**
   * posts a request to bws api in order to create a new virtual meter
   * @param id name of the virtual meter
   * @param submeters all physical meters contained by the virtual meter
   * @returns observable containing a success or http error msg
   */
  addVirtualMeterWithId(id: string, submeters: any) {
    let url = "/virtual-meters?name=" + id;

    return //this.sendRequest<AllVirtualMeters>("post", url, submeters);
  }

  /**
   * deletes virtual meter per id from the bws api
   * @param input the name of virtual meter to be deleted
   * @returns observable containing success or http error msg
   */
  delVirtualMeterById(input: string) {
    let url = "/virtual-meters/" + input;

    return //this.sendRequest("delete", url);
  }

  /**
   * train a new model via bws api using loading bar in http context,
   * because of long execution time.
   * -> every virtual meter can only hold a single model in combination with a
   * algorithm
   * @param meter virtual meter to be used as training data
   * @param input the algorithm to train
   * @param comment string to identify the trained model afterwards
   * @returns observable containing all training data in a list
   */
  putTrainModel(meter: BeWaterSmartService.VirtualMeter, input: Algorithm, comment?: string) {
    let virt = meter.id.toString();
    let alg = input.name.toString();

    let url = "/meters/" + virt + "/models/" + alg;

    if (comment) {
      url = url + "?comment=" + comment;
    }

    return //this.sendRequest<AllModels>("put", url);
  }

  /**
   * delete request for the bws api.
   * as requested by the api itself, you cant reference a model directly, but rather have to type in the
   * virtual meter and algorithm used and the api tracks down, which model it could be. Don't know why.
   * @param meter name of the virtual meter which got used to train the model
   * @param alg algorithm trained in the model
   * @returns observable containing success or http error msg
   */
  delModel(meter: string, alg: string) {
    let url = "/models/" + meter + ":MLModel:" + alg;

    return //this.sendRequest("delete", url);
  }
}

export namespace BeWaterSmartService {
  export type PhysicalMeter =  JTDDataType<typeof PHYSICAL_METER>;
  export type PhysicalMeters =  JTDDataType<typeof PHYSICAL_METERS>;
  export type VirtualMeter = JTDDataType<typeof VIRTUAL_METER>;
  export type VirtualMeters = JTDDataType<typeof VIRTUAL_METERS>;
  export type Algorithm = JTDDataType<typeof ALGORITHM>;
  export type Algorithms = JTDDataType<typeof ALGORITHMS>;
  export type Model = JTDDataType<typeof MODEL>;
  export type Models = JTDDataType<typeof MODELS>;
  export type ForeCast = JTDDataType<typeof FORECAST>;
  export type ForeCasts = JTDDataType<typeof FORECASTS>;
}

const PHYSICAL_METER = {
  properties: {
    address: {
      properties: {
        addressCountry: {type: "string"},
        addressLocality: {type: "string"},
        streetAddress: {type: "string"},
      },
    },
    category: {type: "string"},
    date: {type: "string"},
    description: {type: "string"},
    id: {type: "string"},
    type: {type: "string"},
  },
} as const;

const PHYSICAL_METERS = {
  properties: {
    meters: {
      elements: PHYSICAL_METER,
    },
  },
} as const;

const VIRTUAL_METER = {
  properties: {
    dateCreated: {type: "string"},
    description: {type: "string"},
     id: {type: "string"},
     submeterIds: {
      elements: {type: "string"},
     },
     supermeterIds: {
      elements: {type: "string"},
     },
  },
} as const;

const VIRTUAL_METERS = {
  properties: {
    virtualMeters: {
      elements: VIRTUAL_METER,
    },
  },
} as const;

const ALGORITHM = {
  properties: {
    description: {type: "string"},
    estimatedTrainingTime: {type: "int32", nullable: true},
    name: {type: "string"},
  },
} as const;

const ALGORITHMS = {
  properties: {
    algorithms: {
      elements: ALGORITHM,
    },
  },
} as const;

const MODEL = {
  properties: {
    algorithm: {type: "string"},
    comment: {type: "string"},
    dateCreated: {type: "string"},
    dateModified: {type: "string"},
    description: {type: "string"},
    evaluation: {
      properties: {
        actualTestConsumption: {
          elements: {type: "float32"},
        },
        metrics: {
          properties: {
            mape: {type: "float32"},
            mse: {type: "float32"},
            rmse: {type: "float32"},
            smape: {type: "float32"},
          },
        },
        predictedTestConsumption: {
          elements: {type: "float32"},
        },
        testCovariates: {
          properties: {
            day: {
              elements: {type: "float32"},
            },
            is_holiday: {
              elements: {type: "int32"},
            },
            is_weekend: {
              elements: {type: "int32"},
            },
            month: {
              elements: {type: "float32"},
            },
            "precipitation (mm)": {
              elements: {type: "float32"},
            },
            year: {
              elements: {type: "int32"},
            },
          },
        },
        testTimestamps: {
          elements: {type: "string"},
        },
      },
    },
    hyperparameters: {
      optionalProperties: {
        country_holidays: {type: "string"},
        daily_seasonality: {type: "int32"},
        weekly_seasonality: {type: "int32"},
        yearly_seasonality: {type: "int32"},
        colsample_bytree: {type: "float32"},
        eval_metric: {type: "string"},
        gamma: {type: "int32"},
        lags: {type: "int32"},
        lags_future_covariates: {
          elements: {type: "int32"},
        },
        learning_rate: {type: "float32"},
        max_depth: {type: "int32"},
        min_child_weight: {type: "int32"},
        objective: {type: "string"}, 
        verbose: {type: "int32"},
        verbosity: {type: "int32"},
      },
    },
    id: {type: "string"},
    inputAttributes: {
      elements: {type: "string"},
    },
    isDefault: {type: "boolean"},
    isModelValid: {type: "boolean"},
    mlFramework: {type: "string"},
    refMeter: {type: "string"},
  },
} as const;

const MODELS = {
  properties: {
    MLModels: {
      elements: MODEL,
    },
  },
} as const;

const FORECAST = {
  properties: {
    covariateValues: {
      properties: {
        day: {type: "int32"},
        is_holiday: {type: "int32"},
        is_weekend: {type: "int32"},
        month: {type: "float32"},
        "precipitation (mm)": {type: "int32"},
        year: {type: "int32"},
      },
    },
    datePredicted: {type: "string"},
    histRefValues: {},
    id: {type: "string"},
    numValue: {type: "float32"},
    refDevice: {type: "string"},
    type: {type: "string"},
    unit: {type: "string"},
  },
} as const;

const FORECASTS = {
    elements: FORECAST,
} as const;