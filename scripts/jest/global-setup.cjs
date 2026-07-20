const {storeGitCommitSHA} = require("../esbuild/prebuild.cjs");

module.exports = async () => {
  await storeGitCommitSHA();
};
