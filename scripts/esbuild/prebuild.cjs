const {Plugin, PluginBuild} = require("esbuild");
const {readFile, writeFile, mkdir} = require("fs/promises");
const toml = require("smol-toml");
const xml = require("fast-xml-parser");
const sharp = require("sharp");

/**
 * An esbuild plugin that executes prebuild operations.
 *
 * @param {object} options Plugin options (currently unused, reserved for future extensions).
 * @returns {Plugin} The configured esbuild plugin.
 */
function prebuildPlugin(options = {}) {
  return {
    name: "prebuild-plugin",

    /**
     * Sets up the plugin to run the prebuild operations.
     *
     * @param {PluginBuild} build The esbuild plugin build context.
     */
    async setup(build) {
      await buildNlwknMeasurementClassificationColorSvgs();
    },
  };
}

module.exports = prebuildPlugin;

/**
 * Reads classification colors from a TOML file and applies them to an SVG template.
 * The generated SVGs are saved in `src/generated/groundwater-level-station-marker/`.
 *
 * @throws {Error} If the SVG template does not match the expected format.
 */
async function buildNlwknMeasurementClassificationColorSvgs() {
  let tomlContent = await readFile(
    "src/assets/nlwkn-measurement-classification-colors.toml",
    "utf-8",
  );
  let colors = toml.parse(tomlContent);

  let svgContent = await readFile(
    "src/modules/growl/map/groundwater-level-station-marker/groundwater-level-station-marker.component.svg",
    "utf-8",
  );
  let svgParser = new xml.XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    allowBooleanAttributes: true,
    processEntities: false,
    preserveOrder: true,
  });

  let svg = svgParser.parse(svgContent);
  let filler = svg[0].svg[1][":@"]; // expected position of the fillable element
  if (filler.id !== "filler") throw new Error("Unexpected SVG format");

  let svgBuilder = new xml.XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    preserveOrder: true,
    format: true,
    suppressEmptyNode: false,
  });

  await mkdir("public/generated/groundwater-level-station-marker", {
    recursive: true,
  });
  for (let [classification, color] of Object.entries(colors)) {
    let thisSvg = structuredClone(svg);
    thisSvg[0].svg[1][":@"].style = `fill:${color}`;
    let newSvg = svgBuilder.build(thisSvg);
    let svgBuffer = Buffer.from(newSvg, "utf-8");
    let path = `public/generated/groundwater-level-station-marker/${classification}.png`;
    await sharp(svgBuffer).resize(64).png().toFile(path);
  }
}
