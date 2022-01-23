const parseSvg = require('./lib/parser/parseSvg')
const parseJson = require('./lib/parser/parseJson')
const parseSvgfont = require('./lib/parser/parseSvgfont')
const parsePath = require('./lib/parser/parsePath')
const parseFormat = require('./lib/parser/parseFormat')
const parse = require('./lib/helpers/parse')
const fileHelper = require('./lib/helpers/file')

/**
 * @param {string/file} input : the path to file or string as data
 * @param {boolean} outputFormat: the version of outputed data : svg, json, fontSVG
 * @param {string} filename: the name of file the data should be written on
 * @param {boolean} unifySvg: Whether the SVG specific tags should be all converted to PATH or not
 * @param {boolean} pathFormat: To declare whether you would like to set the pathes all to absolute or relative or no change
 */
function convert(opt) {
  const options = prepare(opt);
  // check if the data is a file path, then read the file, otherwise, return the string of data(input)
  return fileHelper.getData(options)
  // execute the parsePath process
  .then(data => parsePath(data, options))
  // Transform the result again to the custom format if requested
  .then(data => assign(data, options))
  // store result
  .then(data => fileHelper.createfile(data, options))
}

function prepare(opts) {
  if(!opts.input) throw 'No Input declared'
  // default
  if(!opts.unifySvg) opts.unifySvg = false;
  // default
  if(!opts.outputFormat) opts.outputFormat = 'json';
  // activate the parsePath process if it's 'fontsvg'
  if(opts.outputFormat.toLowerCase() == 'fontsvg') opts.unifySvg = true;

  return opts;
}

function parseFormatHandler(opt, requestedFormat) {
  return fileHelper.getData(opt)
  .then(parseJson)
  .then(parse.parseContourSvg)
  .then(svgJsonWithContour => parseFormat.parseFormat(svgJsonWithContour, requestedFormat))
  .then(parse.useContourStr)
  .then(transformedSvg => assign(transformedSvg, opt))
  .then(data => fileHelper.createfile(data, opt))
}

function assign(svg, {outputFormat}) {
  // skip if there is no outputFormat set
  if(!outputFormat) return svg;

  switch(outputFormat.toLowerCase()) {
    case 'svg': return parseSvg(svg)
    case 'json': return parseJson(svg)
    case 'fontsvg': return parseSvgfont(svg)
    default: return svg;
  }
}


function parsePointsParserPrepare(path) {
  return parseJson(path)
  .then(path => parseFormat.parseFormat(path, 'absolute'))
  .then(parse.pathParser)
}

function getPathType(path, regExp) {
  const indexes = [];
  let match;
  while ((match = regExp.exec(path)) != null) indexes.push(match.index);
  return indexes;
}

module.exports = {
  convert,
  parsePoints: parsePointsParserPrepare,
  parseAbsolute: opt => parseFormatHandler(prepare(opt), 'absolute'),
  parseRelative: opt => parseFormatHandler(prepare(opt), 'relative'),
  parsePath: opt => parsePath(opt.code, {unifySvg: true}),
  parseJson,
  parseSvg,
  parseSvgfont,
  parseAbsoluteDirectly: path => parseFormat.parseFormat(path, 'absolute'),
  parseRelativeDirectly: path => parseFormat.parseFormat(path, 'relative'),
  direcltParseContour: parse.parseContourPath,
  pathGotRelatives: path => getPathType(path, /[n{a-z}]/g),
  pathGotAbsolutes: path => getPathType(path, /[n{A-Z}]/g),
};
