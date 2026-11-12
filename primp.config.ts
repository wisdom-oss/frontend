import {defineConfig, inverse} from "@primp/primp";
import {elementName, lowercase, nameSuffix} from "@primp/primp/rules/elements";
import {
  directoryName,
  namespaceImport,
  packageSource,
  sideEffect,
  sourceName,
} from "@primp/primp/rules/imports";
import * as separators from "@primp/primp/rules/separators";

import globalFirst from "./scripts/primp/globalFirst.ts";
import separateGlobal from "./scripts/primp/separateGlobal.ts";

// Preserve the pretty-ts-imports rules instead of adopting primp's new defaults.
export default defineConfig({
  sortImports: [
    globalFirst,
    inverse(sideEffect),
    packageSource,
    inverse(namespaceImport),
    directoryName,
    sourceName,
  ],
  sortImportElements: [lowercase, nameSuffix, elementName],
  separateBy: [
    separateGlobal,
    separators.sideEffect,
    separators.packageSource,
    separators.namespace,
  ],
  formatting: {
    bracketIndent: 0,
    indent: 2,
    maxColumns: 80,
    quoteStyle: "double",
    trailingComma: false,
    breakFrom: true,
  },
});
