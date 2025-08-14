import {SeparateByFunction, Import} from "pretty-ts-imports";

function hasGlobal(imp: Import) {
  return imp.source.name.toLowerCase().includes("global");
}

const separateGlobal: SeparateByFunction = function (
  leadingImport: Import,
  followingImport: Import,
) {
  return hasGlobal(leadingImport) != hasGlobal(followingImport);
};

export default separateGlobal;
