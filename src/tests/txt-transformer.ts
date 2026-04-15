import type {Transformer} from "@jest/transform";

const txtTransformer: Transformer = {
  process(sourceText) {
    return {code: `module.exports = "${sourceText}";`};
  },
};

export default txtTransformer;
