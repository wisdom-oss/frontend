// eslint-disable-next-line no-unused-vars
const {Plugin, PluginBuild} = require("esbuild");
const {readFile} = require("fs/promises");
const {join} = require("path");

const isTxtRegex = /\.txt$/;

/**
 * An esbuild plugin that a `.txt` file resolver.
 *
 * @param {object} _options Plugin options (currently unused, reserved for future extensions).
 * @returns {Plugin} The configured esbuild plugin.
 */
function loadTxtPlugin(_options = {}) {
  return {
    name: "load-txt-plugin",

    /**
     * Sets up the plugin to add the resolver.
     *
     * @param {PluginBuild} build The esbuild plugin build context.
     */
    setup(build) {
      build.onResolve({filter: isTxtRegex}, ({path, resolveDir}) => {
        return {path: join(resolveDir, path)};
      });
      build.onLoad({filter: isTxtRegex}, async ({path}) => {
        let contents = await readFile(path);
        return {contents, loader: "text"};
      });
    },
  };
}

module.exports = loadTxtPlugin;
