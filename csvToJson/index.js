"use strict";

let migration = require("./migration.js");

const encodingOps = {
    utf8: 'utf8',
    ucs2: 'ucs2',
    utf16le: 'utf16le',
    latin1: 'latin1',
    ascii: 'ascii',
    base64: 'base64',
    hex: 'hex'
};

/**
 * Prints a digit as Number type (for example 32 instead of '32')
 */
exports.formatValueByType = function (active = true) {
  migration.formatValueByType(active);
  return this;
};

/**
 * Defines the field delimiter which will be used to split the fields
 */
exports.fieldDelimiter = function (delimiter) {
  migration.fieldDelimiter(delimiter);
  return this;
};

/**
 * Defines how to match and parse a sub array
 */
exports.parseSubArray = function (delimiter, separator) {
  migration.parseSubArray(delimiter, separator);
  return this;
};

/**
 * Defines a custom encoding to decode a file
 */
exports.customEncoding = function (encoding) {
  migration.encoding = encoding;
  return this;
};

/**
 * Defines a custom encoding to decode a file
 */
exports.utf8Encoding = function utf8Encoding() {
  migration.encoding = encodingOps.utf8;
  return this;
};

/**
 * Defines ucs2 encoding to decode a file
 */
exports.ucs2Encoding = function () {
  migration.encoding = encodingOps.ucs2;
  return this;
};

/**
 * Defines utf16le encoding to decode a file
 */
exports.utf16leEncoding = function () {
  migration.encoding = encodingOps.utf16le;
  return this;
};

/**
 * Defines latin1 encoding to decode a file
 */
exports.latin1Encoding = function () {
  migration.encoding = encodingOps.latin1;
  return this;
};

/**
 * Defines ascii encoding to decode a file
 */
exports.asciiEncoding = function () {
  migration.encoding = encodingOps.ascii;
  return this;
};

/**
 * Defines base64 encoding to decode a file
 */
exports.base64Encoding = function () {
  this.migration = encodingOps.base64;
  return this;
};

/**
 * Defines hex encoding to decode a file
 */
exports.hexEncoding = function () {
  this.migration = encodingOps.hex;
  return this;
};

/**
 * Parses .csv file and put its content into a file in json format.
 * @param {inputFileName} path/filename
 * @param {outputFileName} path/filename
 *
 */
exports.migrateCsvDataToDb = function(inputFileName, delimiter) {
  if (!inputFileName) {
    throw new Error("inputFileName is not defined!!!");
  }

  migration.migrateCsvDataToDb(inputFileName, delimiter);
};

/**
 * Parses .csv file and put its content into an Array of Object in json format.
 * @param {inputFileName} path/filename
 * @return {Array} Array of Object in json format
 *
 */
exports.getJsonFromCsv = function(inputFileName) {
  if (!inputFileName) {
    throw new Error("inputFileName is not defined!!!");
  }
  return migration.getJsonFromCsv(inputFileName);
};

exports.csvStringToJson = function(csvString) {
  return migration.csvStringToJson(csvString);
};

/**
 * Parses .csv file and put its content into a file in json format.
 * @param {inputFileName} path/filename
 * @param {outputFileName} path/filename
 *
 * @deprecated Use generateJsonFileFromCsv()
 */
exports.jsonToCsv = function(inputFileName, outputFileName) {
  migration.generateJsonFileFromCsv(inputFileName, outputFileName);
};
