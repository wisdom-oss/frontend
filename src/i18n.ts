import {
  InterpolatableTranslationObject,
  TranslateService,
} from "@ngx-translate/core";

import {asserts} from "./common/asserts";
import core from "./core/i18n.toml";
import beWaterSmart from "./modules/be-water-smart/i18n.toml";

// add translations to this record
const modules: NestedStringRecord = {
  core,
  "be-water-smart": beWaterSmart,
};

export function configureTranslations(service: TranslateService) {
  let defaultLanguage = service.getBrowserLang() ?? "en";
  const transformed: NestedStringRecord = {};

  function traverse(record: object, path: string[] = []) {
    for (let [key, value] of Object.entries(record)) {
      if (typeof value === "object") traverse(value, path.concat(key));
      else {
        if (!transformed[key]) transformed[key] = {};
        let level = transformed[key];
        for (let entry of path.slice(0, -1)) {
          asserts.not.string(level);
          if (!level[entry]) level[entry] = {};
          level = level[entry];
        }
        let leaf = path.slice(-1)[0];
        asserts.not.string(level);
        level[leaf] = value;
      }
    }
  }

  traverse(modules);

  service.addLangs(Object.keys(transformed));
  for (let [key, translations] of Object.entries(transformed)) {
    service.setTranslation(
      key,
      translations as InterpolatableTranslationObject,
    );
  }

  service.setDefaultLang(defaultLanguage);
  service.use(defaultLanguage);
}

type NestedStringRecord = Record<
  string,
  | string
  | Record<
      string,
      | string
      | Record<
          string,
          | string
          | Record<
              string,
              | string
              | Record<
                  string,
                  string | Record<string, string | Record<string, string>>
                >
            >
        >
    >
>;
