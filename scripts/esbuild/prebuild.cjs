// eslint-disable-next-line no-unused-vars
const {Plugin, PluginBuild} = require("esbuild");
const {readFile, writeFile, mkdir} = require("fs/promises");
const toml = require("smol-toml");
const xml = require("fast-xml-parser");
const sharp = require("sharp");
const {exec} = require("child_process");
const {promisify} = require("util");

/**
 * An esbuild plugin that executes prebuild operations.
 *
 * @param {object} _options Plugin options (currently unused, reserved for future extensions).
 * @returns {Plugin} The configured esbuild plugin.
 */
function prebuildPlugin(_options = {}) {
  return {
    name: "prebuild-plugin",

    /**
     * Sets up the plugin to run the prebuild operations.
     *
     * @param {PluginBuild} _build The esbuild plugin build context.
     */
    async setup(_build) {
      await Promise.all([
        buildNlwknMeasurementClassificationColorSvgs(),
        extractRemixicons().then(buildSpritesheets),
        storeGitCommitSHA(),
      ]);
    },
  };
}

module.exports = Object.assign(prebuildPlugin, {
  buildNlwknMeasurementClassificationColorSvgs,
  extractRemixicons,
  buildSpritesheets,
  storeGitCommitSHA,
});

// ------------------------------------
// Prebuild Subroutines
// ------------------------------------

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
    "src/assets/growl/groundwater-level-station-marker/groundwater-level-station-marker.svg",
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

/**
 * Extracts Remix Icons from npm package and saves them in
 * `src/assets/generated/remixicon/`.
 */
async function extractRemixicons() {
  const remixicon = await import("@ng-icons/remixicon");
  await mkdir("src/assets/generated/remixicon", {recursive: true});
  for (let [key, svg] of Object.entries(remixicon)) {
    let name = toKebabCase(key.slice("remix".length));
    let path = `src/assets/generated/remixicon/${name}.svg`;
    await writeFile(path, svg);
  }
}

/**
 * Generates sprite sheets from extracted Remix Icons.
 *
 * This function utilizes `@cptpiepmatz/spreet` to create distance field (SDF) spritesheets.
 * The generated spritesheets are saved in the `public/generated/remixicon/` directory.
 *
 * Two versions are created:
 * - `public/generated/remixicon/`: Standard spritesheet.
 * - `public/generated/remixicon@2x/`: Retina version with higher resolution.
 *
 * @throws {Error} If the sprite sheet generation fails.
 */
async function buildSpritesheets() {
  try {
    const {spreet} = await import("@cptpiepmatz/spreet");
    await spreet(
      "src/assets/generated/remixicon",
      "public/generated/remixicon",
      {sdf: true},
    );
    await spreet(
      "src/assets/generated/remixicon",
      "public/generated/remixicon@2x",
      {sdf: true, retina: true},
    );
  } catch (e) {
    // TODO: let it throw when underlying errors becomes real error
    console.error(e);
    throw e;
  }
}

/** Stores the current git commit sha in `src/assets/generated/revision.txt`. */
async function storeGitCommitSHA() {
  let sha = process.env.GIT_COMMIT_SHA?.trim();
  if (!sha) {
    const execAsync = promisify(exec);
    await execAsync("git rev-parse HEAD").then(({stdout}) => (sha = stdout));
  }

  await writeFile("src/assets/generated/revision.txt", sha.trim());
}

// ------------------------------------
// Helper Functions
// ------------------------------------

/**
 * Converts a camelCase or PascalCase string into kebab-case.
 *
 * @param {string} str The input string.
 * @returns {string} The kebab-case version of the string.
 */
function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z0-9])/g, "$1-$2") // insert dash between lowercase and uppercase/number
    .replace(/([0-9])([A-Za-z])/g, "$1-$2") // insert dash between number and letter
    .toLowerCase();
}
