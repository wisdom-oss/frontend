import {ImportCompareFunction, Import} from "pretty-ts-imports";

function hasGlobal(imp: Import) {
  return imp.source.name.toLowerCase().includes("global");
}

const globalFirst: ImportCompareFunction = function (
  importA: Import,
  importB: Import,
): number {
  const importAValue = Number(hasGlobal(importA));
  const importBValue = Number(hasGlobal(importB));
  return importBValue - importAValue;
};

export default globalFirst;
