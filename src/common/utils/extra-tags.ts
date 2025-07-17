import {tags} from "typia";

export namespace extraTags {
  export type RecordEntries<N extends number> = tags.TagBase<{
    kind: "singleEntry";
    target: "object";
    value: N;
    validate: `Object.keys($input).length === ${N}`;
  }>;
}
