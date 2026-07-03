"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/fast-xml-parser/src/util.js
var require_util = __commonJS({
  "node_modules/fast-xml-parser/src/util.js"(exports2) {
    "use strict";
    var nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
    var nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
    var nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
    var regexName = new RegExp("^" + nameRegexp + "$");
    var getAllMatches = function(string, regex) {
      const matches = [];
      let match = regex.exec(string);
      while (match) {
        const allmatches = [];
        allmatches.startIndex = regex.lastIndex - match[0].length;
        const len = match.length;
        for (let index = 0; index < len; index++) {
          allmatches.push(match[index]);
        }
        matches.push(allmatches);
        match = regex.exec(string);
      }
      return matches;
    };
    var isName = function(string) {
      const match = regexName.exec(string);
      return !(match === null || typeof match === "undefined");
    };
    exports2.isExist = function(v) {
      return typeof v !== "undefined";
    };
    exports2.isEmptyObject = function(obj) {
      return Object.keys(obj).length === 0;
    };
    exports2.merge = function(target, a, arrayMode) {
      if (a) {
        const keys = Object.keys(a);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
          if (arrayMode === "strict") {
            target[keys[i]] = [a[keys[i]]];
          } else {
            target[keys[i]] = a[keys[i]];
          }
        }
      }
    };
    exports2.getValue = function(v) {
      if (exports2.isExist(v)) {
        return v;
      } else {
        return "";
      }
    };
    var DANGEROUS_PROPERTY_NAMES = [
      // '__proto__',
      // 'constructor',
      // 'prototype',
      "hasOwnProperty",
      "toString",
      "valueOf",
      "__defineGetter__",
      "__defineSetter__",
      "__lookupGetter__",
      "__lookupSetter__"
    ];
    var criticalProperties = ["__proto__", "constructor", "prototype"];
    exports2.isName = isName;
    exports2.getAllMatches = getAllMatches;
    exports2.nameRegexp = nameRegexp;
    exports2.DANGEROUS_PROPERTY_NAMES = DANGEROUS_PROPERTY_NAMES;
    exports2.criticalProperties = criticalProperties;
  }
});

// node_modules/fast-xml-parser/src/validator.js
var require_validator = __commonJS({
  "node_modules/fast-xml-parser/src/validator.js"(exports2) {
    "use strict";
    var util = require_util();
    var defaultOptions = {
      allowBooleanAttributes: false,
      //A tag can have attributes without any value
      unpairedTags: []
    };
    exports2.validate = function(xmlData, options) {
      options = Object.assign({}, defaultOptions, options);
      const tags = [];
      let tagFound = false;
      let reachedRoot = false;
      if (xmlData[0] === "\uFEFF") {
        xmlData = xmlData.substr(1);
      }
      for (let i = 0; i < xmlData.length; i++) {
        if (xmlData[i] === "<" && xmlData[i + 1] === "?") {
          i += 2;
          i = readPI(xmlData, i);
          if (i.err) return i;
        } else if (xmlData[i] === "<") {
          let tagStartPos = i;
          i++;
          if (xmlData[i] === "!") {
            i = readCommentAndCDATA(xmlData, i);
            continue;
          } else {
            let closingTag = false;
            if (xmlData[i] === "/") {
              closingTag = true;
              i++;
            }
            let tagName = "";
            for (; i < xmlData.length && xmlData[i] !== ">" && xmlData[i] !== " " && xmlData[i] !== "	" && xmlData[i] !== "\n" && xmlData[i] !== "\r"; i++) {
              tagName += xmlData[i];
            }
            tagName = tagName.trim();
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substring(0, tagName.length - 1);
              i--;
            }
            if (!validateTagName(tagName)) {
              let msg;
              if (tagName.trim().length === 0) {
                msg = "Invalid space after '<'.";
              } else {
                msg = "Tag '" + tagName + "' is an invalid name.";
              }
              return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i));
            }
            const result = readAttributeStr(xmlData, i);
            if (result === false) {
              return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
            }
            let attrStr = result.value;
            i = result.index;
            if (attrStr[attrStr.length - 1] === "/") {
              const attrStrStart = i - attrStr.length;
              attrStr = attrStr.substring(0, attrStr.length - 1);
              const isValid = validateAttributeString(attrStr, options);
              if (isValid === true) {
                tagFound = true;
              } else {
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
              }
            } else if (closingTag) {
              if (!result.tagClosed) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
              } else if (attrStr.trim().length > 0) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
              } else if (tags.length === 0) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
              } else {
                const otg = tags.pop();
                if (tagName !== otg.tagName) {
                  let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
                  return getErrorObject(
                    "InvalidTag",
                    "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.",
                    getLineNumberForPosition(xmlData, tagStartPos)
                  );
                }
                if (tags.length == 0) {
                  reachedRoot = true;
                }
              }
            } else {
              const isValid = validateAttributeString(attrStr, options);
              if (isValid !== true) {
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
              }
              if (reachedRoot === true) {
                return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i));
              } else if (options.unpairedTags.indexOf(tagName) !== -1) {
              } else {
                tags.push({ tagName, tagStartPos });
              }
              tagFound = true;
            }
            for (i++; i < xmlData.length; i++) {
              if (xmlData[i] === "<") {
                if (xmlData[i + 1] === "!") {
                  i++;
                  i = readCommentAndCDATA(xmlData, i);
                  continue;
                } else if (xmlData[i + 1] === "?") {
                  i = readPI(xmlData, ++i);
                  if (i.err) return i;
                } else {
                  break;
                }
              } else if (xmlData[i] === "&") {
                const afterAmp = validateAmpersand(xmlData, i);
                if (afterAmp == -1)
                  return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
                i = afterAmp;
              } else {
                if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
                  return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i));
                }
              }
            }
            if (xmlData[i] === "<") {
              i--;
            }
          }
        } else {
          if (isWhiteSpace(xmlData[i])) {
            continue;
          }
          return getErrorObject("InvalidChar", "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
        }
      }
      if (!tagFound) {
        return getErrorObject("InvalidXml", "Start tag expected.", 1);
      } else if (tags.length == 1) {
        return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
      } else if (tags.length > 0) {
        return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t) => t.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
      }
      return true;
    };
    function isWhiteSpace(char) {
      return char === " " || char === "	" || char === "\n" || char === "\r";
    }
    function readPI(xmlData, i) {
      const start = i;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] == "?" || xmlData[i] == " ") {
          const tagname = xmlData.substr(start, i - start);
          if (i > 5 && tagname === "xml") {
            return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i));
          } else if (xmlData[i] == "?" && xmlData[i + 1] == ">") {
            i++;
            break;
          } else {
            continue;
          }
        }
      }
      return i;
    }
    function readCommentAndCDATA(xmlData, i) {
      if (xmlData.length > i + 5 && xmlData[i + 1] === "-" && xmlData[i + 2] === "-") {
        for (i += 3; i < xmlData.length; i++) {
          if (xmlData[i] === "-" && xmlData[i + 1] === "-" && xmlData[i + 2] === ">") {
            i += 2;
            break;
          }
        }
      } else if (xmlData.length > i + 8 && xmlData[i + 1] === "D" && xmlData[i + 2] === "O" && xmlData[i + 3] === "C" && xmlData[i + 4] === "T" && xmlData[i + 5] === "Y" && xmlData[i + 6] === "P" && xmlData[i + 7] === "E") {
        let angleBracketsCount = 1;
        for (i += 8; i < xmlData.length; i++) {
          if (xmlData[i] === "<") {
            angleBracketsCount++;
          } else if (xmlData[i] === ">") {
            angleBracketsCount--;
            if (angleBracketsCount === 0) {
              break;
            }
          }
        }
      } else if (xmlData.length > i + 9 && xmlData[i + 1] === "[" && xmlData[i + 2] === "C" && xmlData[i + 3] === "D" && xmlData[i + 4] === "A" && xmlData[i + 5] === "T" && xmlData[i + 6] === "A" && xmlData[i + 7] === "[") {
        for (i += 8; i < xmlData.length; i++) {
          if (xmlData[i] === "]" && xmlData[i + 1] === "]" && xmlData[i + 2] === ">") {
            i += 2;
            break;
          }
        }
      }
      return i;
    }
    var doubleQuote = '"';
    var singleQuote = "'";
    function readAttributeStr(xmlData, i) {
      let attrStr = "";
      let startChar = "";
      let tagClosed = false;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
          if (startChar === "") {
            startChar = xmlData[i];
          } else if (startChar !== xmlData[i]) {
          } else {
            startChar = "";
          }
        } else if (xmlData[i] === ">") {
          if (startChar === "") {
            tagClosed = true;
            break;
          }
        }
        attrStr += xmlData[i];
      }
      if (startChar !== "") {
        return false;
      }
      return {
        value: attrStr,
        index: i,
        tagClosed
      };
    }
    var validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
    function validateAttributeString(attrStr, options) {
      const matches = util.getAllMatches(attrStr, validAttrStrRegxp);
      const attrNames = {};
      for (let i = 0; i < matches.length; i++) {
        if (matches[i][1].length === 0) {
          return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' has no space in starting.", getPositionFromMatch(matches[i]));
        } else if (matches[i][3] !== void 0 && matches[i][4] === void 0) {
          return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' is without value.", getPositionFromMatch(matches[i]));
        } else if (matches[i][3] === void 0 && !options.allowBooleanAttributes) {
          return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i][2] + "' is not allowed.", getPositionFromMatch(matches[i]));
        }
        const attrName = matches[i][2];
        if (!validateAttrName(attrName)) {
          return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i]));
        }
        if (!attrNames.hasOwnProperty(attrName)) {
          attrNames[attrName] = 1;
        } else {
          return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i]));
        }
      }
      return true;
    }
    function validateNumberAmpersand(xmlData, i) {
      let re = /\d/;
      if (xmlData[i] === "x") {
        i++;
        re = /[\da-fA-F]/;
      }
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === ";")
          return i;
        if (!xmlData[i].match(re))
          break;
      }
      return -1;
    }
    function validateAmpersand(xmlData, i) {
      i++;
      if (xmlData[i] === ";")
        return -1;
      if (xmlData[i] === "#") {
        i++;
        return validateNumberAmpersand(xmlData, i);
      }
      let count = 0;
      for (; i < xmlData.length; i++, count++) {
        if (xmlData[i].match(/\w/) && count < 20)
          continue;
        if (xmlData[i] === ";")
          break;
        return -1;
      }
      return i;
    }
    function getErrorObject(code, message, lineNumber) {
      return {
        err: {
          code,
          msg: message,
          line: lineNumber.line || lineNumber,
          col: lineNumber.col
        }
      };
    }
    function validateAttrName(attrName) {
      return util.isName(attrName);
    }
    function validateTagName(tagname) {
      return util.isName(tagname);
    }
    function getLineNumberForPosition(xmlData, index) {
      const lines = xmlData.substring(0, index).split(/\r?\n/);
      return {
        line: lines.length,
        // column number is last line's length + 1, because column numbering starts at 1:
        col: lines[lines.length - 1].length + 1
      };
    }
    function getPositionFromMatch(match) {
      return match.startIndex + match[1].length;
    }
  }
});

// node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
var require_OptionsBuilder = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js"(exports2) {
    var { DANGEROUS_PROPERTY_NAMES, criticalProperties } = require_util();
    var defaultOnDangerousProperty = (name) => {
      if (DANGEROUS_PROPERTY_NAMES.includes(name)) {
        return "__" + name;
      }
      return name;
    };
    var defaultOptions = {
      preserveOrder: false,
      attributeNamePrefix: "@_",
      attributesGroupName: false,
      textNodeName: "#text",
      ignoreAttributes: true,
      removeNSPrefix: false,
      // remove NS from tag name or attribute name if true
      allowBooleanAttributes: false,
      //a tag can have attributes without any value
      //ignoreRootElement : false,
      parseTagValue: true,
      parseAttributeValue: false,
      trimValues: true,
      //Trim string values of tag and attributes
      cdataPropName: false,
      numberParseOptions: {
        hex: true,
        leadingZeros: true,
        eNotation: true
      },
      tagValueProcessor: function(tagName, val) {
        return val;
      },
      attributeValueProcessor: function(attrName, val) {
        return val;
      },
      stopNodes: [],
      //nested tags will not be parsed even for errors
      alwaysCreateTextNode: false,
      isArray: () => false,
      commentPropName: false,
      unpairedTags: [],
      processEntities: true,
      htmlEntities: false,
      ignoreDeclaration: false,
      ignorePiTags: false,
      transformTagName: false,
      transformAttributeName: false,
      updateTag: function(tagName, jPath, attrs) {
        return tagName;
      },
      // skipEmptyListItem: false
      captureMetaData: false,
      maxNestedTags: 100,
      strictReservedNames: true,
      onDangerousProperty: defaultOnDangerousProperty
    };
    function validatePropertyName(propertyName, optionName) {
      if (typeof propertyName !== "string") {
        return;
      }
      const normalized = propertyName.toLowerCase();
      if (DANGEROUS_PROPERTY_NAMES.some((dangerous) => normalized === dangerous.toLowerCase())) {
        throw new Error(
          `[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`
        );
      }
      if (criticalProperties.some((dangerous) => normalized === dangerous.toLowerCase())) {
        throw new Error(
          `[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`
        );
      }
    }
    function normalizeProcessEntities(value) {
      if (typeof value === "boolean") {
        return {
          enabled: value,
          // true or false
          maxEntitySize: 1e4,
          maxExpansionDepth: 10,
          maxTotalExpansions: 1e3,
          maxExpandedLength: 1e5,
          allowedTags: null,
          tagFilter: null
        };
      }
      if (typeof value === "object" && value !== null) {
        return {
          enabled: value.enabled !== false,
          maxEntitySize: Math.max(1, value.maxEntitySize ?? 1e4),
          maxExpansionDepth: Math.max(1, value.maxExpansionDepth ?? 1e4),
          maxTotalExpansions: Math.max(1, value.maxTotalExpansions ?? Infinity),
          maxExpandedLength: Math.max(1, value.maxExpandedLength ?? 1e5),
          maxEntityCount: Math.max(1, value.maxEntityCount ?? 1e3),
          allowedTags: value.allowedTags ?? null,
          tagFilter: value.tagFilter ?? null
        };
      }
      return normalizeProcessEntities(true);
    }
    var buildOptions = function(options) {
      const built = Object.assign({}, defaultOptions, options);
      const propertyNameOptions = [
        { value: built.attributeNamePrefix, name: "attributeNamePrefix" },
        { value: built.attributesGroupName, name: "attributesGroupName" },
        { value: built.textNodeName, name: "textNodeName" },
        { value: built.cdataPropName, name: "cdataPropName" },
        { value: built.commentPropName, name: "commentPropName" }
      ];
      for (const { value, name } of propertyNameOptions) {
        if (value) {
          validatePropertyName(value, name);
        }
      }
      if (built.onDangerousProperty === null) {
        built.onDangerousProperty = defaultOnDangerousProperty;
      }
      built.processEntities = normalizeProcessEntities(built.processEntities);
      return built;
    };
    exports2.buildOptions = buildOptions;
    exports2.defaultOptions = defaultOptions;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
var require_xmlNode = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/xmlNode.js"(exports2, module2) {
    "use strict";
    var XmlNode = class {
      constructor(tagname) {
        this.tagname = tagname;
        this.child = [];
        this[":@"] = {};
      }
      add(key, val) {
        if (key === "__proto__") key = "#__proto__";
        this.child.push({ [key]: val });
      }
      addChild(node) {
        if (node.tagname === "__proto__") node.tagname = "#__proto__";
        if (node[":@"] && Object.keys(node[":@"]).length > 0) {
          this.child.push({ [node.tagname]: node.child, [":@"]: node[":@"] });
        } else {
          this.child.push({ [node.tagname]: node.child });
        }
      }
    };
    module2.exports = XmlNode;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
var require_DocTypeReader = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js"(exports2, module2) {
    var util = require_util();
    var DocTypeReader = class {
      constructor(options) {
        this.suppressValidationErr = !options;
        this.options = options || {};
      }
      readDocType(xmlData, i) {
        const entities = /* @__PURE__ */ Object.create(null);
        let entityCount = 0;
        if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
          i = i + 9;
          let angleBracketsCount = 1;
          let hasBody = false, comment = false;
          let exp = "";
          for (; i < xmlData.length; i++) {
            if (xmlData[i] === "<" && !comment) {
              if (hasBody && hasSeq(xmlData, "!ENTITY", i)) {
                i += 7;
                let entityName, val;
                [entityName, val, i] = this.readEntityExp(xmlData, i + 1, this.suppressValidationErr);
                if (val.indexOf("&") === -1) {
                  if (this.options.enabled !== false && this.options.maxEntityCount != null && entityCount >= this.options.maxEntityCount) {
                    throw new Error(
                      `Entity count (${entityCount + 1}) exceeds maximum allowed (${this.options.maxEntityCount})`
                    );
                  }
                  const escaped = entityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                  entities[entityName] = {
                    regx: RegExp(`&${escaped};`, "g"),
                    val
                  };
                  entityCount++;
                }
              } else if (hasBody && hasSeq(xmlData, "!ELEMENT", i)) {
                i += 8;
                const { index } = this.readElementExp(xmlData, i + 1);
                i = index;
              } else if (hasBody && hasSeq(xmlData, "!ATTLIST", i)) {
                i += 8;
              } else if (hasBody && hasSeq(xmlData, "!NOTATION", i)) {
                i += 9;
                const { index } = this.readNotationExp(xmlData, i + 1, this.suppressValidationErr);
                i = index;
              } else if (hasSeq(xmlData, "!--", i)) {
                comment = true;
              } else {
                throw new Error(`Invalid DOCTYPE`);
              }
              angleBracketsCount++;
              exp = "";
            } else if (xmlData[i] === ">") {
              if (comment) {
                if (xmlData[i - 1] === "-" && xmlData[i - 2] === "-") {
                  comment = false;
                  angleBracketsCount--;
                }
              } else {
                angleBracketsCount--;
              }
              if (angleBracketsCount === 0) {
                break;
              }
            } else if (xmlData[i] === "[") {
              hasBody = true;
            } else {
              exp += xmlData[i];
            }
          }
          if (angleBracketsCount !== 0) {
            throw new Error(`Unclosed DOCTYPE`);
          }
        } else {
          throw new Error(`Invalid Tag instead of DOCTYPE`);
        }
        return { entities, i };
      }
      readEntityExp(xmlData, i) {
        i = skipWhitespace(xmlData, i);
        let entityName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i]) && xmlData[i] !== '"' && xmlData[i] !== "'") {
          entityName += xmlData[i];
          i++;
        }
        validateEntityName(entityName);
        i = skipWhitespace(xmlData, i);
        if (!this.suppressValidationErr) {
          if (xmlData.substring(i, i + 6).toUpperCase() === "SYSTEM") {
            throw new Error("External entities are not supported");
          } else if (xmlData[i] === "%") {
            throw new Error("Parameter entities are not supported");
          }
        }
        let entityValue = "";
        [i, entityValue] = this.readIdentifierVal(xmlData, i, "entity");
        if (this.options.enabled !== false && this.options.maxEntitySize != null && entityValue.length > this.options.maxEntitySize) {
          throw new Error(
            `Entity "${entityName}" size (${entityValue.length}) exceeds maximum allowed size (${this.options.maxEntitySize})`
          );
        }
        i--;
        return [entityName, entityValue, i];
      }
      readNotationExp(xmlData, i) {
        i = skipWhitespace(xmlData, i);
        let notationName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
          notationName += xmlData[i];
          i++;
        }
        !this.suppressValidationErr && validateEntityName(notationName);
        i = skipWhitespace(xmlData, i);
        const identifierType = xmlData.substring(i, i + 6).toUpperCase();
        if (!this.suppressValidationErr && identifierType !== "SYSTEM" && identifierType !== "PUBLIC") {
          throw new Error(`Expected SYSTEM or PUBLIC, found "${identifierType}"`);
        }
        i += identifierType.length;
        i = skipWhitespace(xmlData, i);
        let publicIdentifier = null;
        let systemIdentifier = null;
        if (identifierType === "PUBLIC") {
          [i, publicIdentifier] = this.readIdentifierVal(xmlData, i, "publicIdentifier");
          i = skipWhitespace(xmlData, i);
          if (xmlData[i] === '"' || xmlData[i] === "'") {
            [i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
          }
        } else if (identifierType === "SYSTEM") {
          [i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
          if (!this.suppressValidationErr && !systemIdentifier) {
            throw new Error("Missing mandatory system identifier for SYSTEM notation");
          }
        }
        return { notationName, publicIdentifier, systemIdentifier, index: --i };
      }
      readIdentifierVal(xmlData, i, type) {
        let identifierVal = "";
        const startChar = xmlData[i];
        if (startChar !== '"' && startChar !== "'") {
          throw new Error(`Expected quoted string, found "${startChar}"`);
        }
        i++;
        while (i < xmlData.length && xmlData[i] !== startChar) {
          identifierVal += xmlData[i];
          i++;
        }
        if (xmlData[i] !== startChar) {
          throw new Error(`Unterminated ${type} value`);
        }
        i++;
        return [i, identifierVal];
      }
      readElementExp(xmlData, i) {
        i = skipWhitespace(xmlData, i);
        let elementName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
          elementName += xmlData[i];
          i++;
        }
        if (!this.suppressValidationErr && !util.isName(elementName)) {
          throw new Error(`Invalid element name: "${elementName}"`);
        }
        i = skipWhitespace(xmlData, i);
        let contentModel = "";
        if (xmlData[i] === "E" && hasSeq(xmlData, "MPTY", i)) {
          i += 4;
        } else if (xmlData[i] === "A" && hasSeq(xmlData, "NY", i)) {
          i += 2;
        } else if (xmlData[i] === "(") {
          i++;
          while (i < xmlData.length && xmlData[i] !== ")") {
            contentModel += xmlData[i];
            i++;
          }
          if (xmlData[i] !== ")") {
            throw new Error("Unterminated content model");
          }
        } else if (!this.suppressValidationErr) {
          throw new Error(`Invalid Element Expression, found "${xmlData[i]}"`);
        }
        return {
          elementName,
          contentModel: contentModel.trim(),
          index: i
        };
      }
      readAttlistExp(xmlData, i) {
        i = skipWhitespace(xmlData, i);
        let elementName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
          elementName += xmlData[i];
          i++;
        }
        validateEntityName(elementName);
        i = skipWhitespace(xmlData, i);
        let attributeName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
          attributeName += xmlData[i];
          i++;
        }
        if (!validateEntityName(attributeName)) {
          throw new Error(`Invalid attribute name: "${attributeName}"`);
        }
        i = skipWhitespace(xmlData, i);
        let attributeType = "";
        if (xmlData.substring(i, i + 8).toUpperCase() === "NOTATION") {
          attributeType = "NOTATION";
          i += 8;
          i = skipWhitespace(xmlData, i);
          if (xmlData[i] !== "(") {
            throw new Error(`Expected '(', found "${xmlData[i]}"`);
          }
          i++;
          let allowedNotations = [];
          while (i < xmlData.length && xmlData[i] !== ")") {
            let notation = "";
            while (i < xmlData.length && xmlData[i] !== "|" && xmlData[i] !== ")") {
              notation += xmlData[i];
              i++;
            }
            notation = notation.trim();
            if (!validateEntityName(notation)) {
              throw new Error(`Invalid notation name: "${notation}"`);
            }
            allowedNotations.push(notation);
            if (xmlData[i] === "|") {
              i++;
              i = skipWhitespace(xmlData, i);
            }
          }
          if (xmlData[i] !== ")") {
            throw new Error("Unterminated list of notations");
          }
          i++;
          attributeType += " (" + allowedNotations.join("|") + ")";
        } else {
          while (i < xmlData.length && !/\s/.test(xmlData[i])) {
            attributeType += xmlData[i];
            i++;
          }
          const validTypes = ["CDATA", "ID", "IDREF", "IDREFS", "ENTITY", "ENTITIES", "NMTOKEN", "NMTOKENS"];
          if (!this.suppressValidationErr && !validTypes.includes(attributeType.toUpperCase())) {
            throw new Error(`Invalid attribute type: "${attributeType}"`);
          }
        }
        i = skipWhitespace(xmlData, i);
        let defaultValue = "";
        if (xmlData.substring(i, i + 8).toUpperCase() === "#REQUIRED") {
          defaultValue = "#REQUIRED";
          i += 8;
        } else if (xmlData.substring(i, i + 7).toUpperCase() === "#IMPLIED") {
          defaultValue = "#IMPLIED";
          i += 7;
        } else {
          [i, defaultValue] = this.readIdentifierVal(xmlData, i, "ATTLIST");
        }
        return {
          elementName,
          attributeName,
          attributeType,
          defaultValue,
          index: i
        };
      }
    };
    var skipWhitespace = (data, index) => {
      while (index < data.length && /\s/.test(data[index])) {
        index++;
      }
      return index;
    };
    function hasSeq(data, seq, i) {
      for (let j = 0; j < seq.length; j++) {
        if (seq[j] !== data[i + j + 1]) return false;
      }
      return true;
    }
    function validateEntityName(name) {
      if (util.isName(name))
        return name;
      else
        throw new Error(`Invalid entity name ${name}`);
    }
    module2.exports = DocTypeReader;
  }
});

// node_modules/strnum/strnum.js
var require_strnum = __commonJS({
  "node_modules/strnum/strnum.js"(exports2, module2) {
    var hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
    var numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
    var consider = {
      hex: true,
      // oct: false,
      leadingZeros: true,
      decimalPoint: ".",
      eNotation: true
      //skipLike: /regex/
    };
    function toNumber(str, options = {}) {
      options = Object.assign({}, consider, options);
      if (!str || typeof str !== "string") return str;
      let trimmedStr = str.trim();
      if (options.skipLike !== void 0 && options.skipLike.test(trimmedStr)) return str;
      else if (str === "0") return 0;
      else if (options.hex && hexRegex.test(trimmedStr)) {
        return parse_int(trimmedStr, 16);
      } else if (trimmedStr.search(/[eE]/) !== -1) {
        const notation = trimmedStr.match(/^([-\+])?(0*)([0-9]*(\.[0-9]*)?[eE][-\+]?[0-9]+)$/);
        if (notation) {
          if (options.leadingZeros) {
            trimmedStr = (notation[1] || "") + notation[3];
          } else {
            if (notation[2] === "0" && notation[3][0] === ".") {
            } else {
              return str;
            }
          }
          return options.eNotation ? Number(trimmedStr) : str;
        } else {
          return str;
        }
      } else {
        const match = numRegex.exec(trimmedStr);
        if (match) {
          const sign = match[1];
          const leadingZeros = match[2];
          let numTrimmedByZeros = trimZeros(match[3]);
          if (!options.leadingZeros && leadingZeros.length > 0 && sign && trimmedStr[2] !== ".") return str;
          else if (!options.leadingZeros && leadingZeros.length > 0 && !sign && trimmedStr[1] !== ".") return str;
          else if (options.leadingZeros && leadingZeros === str) return 0;
          else {
            const num = Number(trimmedStr);
            const numStr = "" + num;
            if (numStr.search(/[eE]/) !== -1) {
              if (options.eNotation) return num;
              else return str;
            } else if (trimmedStr.indexOf(".") !== -1) {
              if (numStr === "0" && numTrimmedByZeros === "") return num;
              else if (numStr === numTrimmedByZeros) return num;
              else if (sign && numStr === "-" + numTrimmedByZeros) return num;
              else return str;
            }
            if (leadingZeros) {
              return numTrimmedByZeros === numStr || sign + numTrimmedByZeros === numStr ? num : str;
            } else {
              return trimmedStr === numStr || trimmedStr === sign + numStr ? num : str;
            }
          }
        } else {
          return str;
        }
      }
    }
    function trimZeros(numStr) {
      if (numStr && numStr.indexOf(".") !== -1) {
        numStr = numStr.replace(/0+$/, "");
        if (numStr === ".") numStr = "0";
        else if (numStr[0] === ".") numStr = "0" + numStr;
        else if (numStr[numStr.length - 1] === ".") numStr = numStr.substr(0, numStr.length - 1);
        return numStr;
      }
      return numStr;
    }
    function parse_int(numStr, base) {
      if (parseInt) return parseInt(numStr, base);
      else if (Number.parseInt) return Number.parseInt(numStr, base);
      else if (window && window.parseInt) return window.parseInt(numStr, base);
      else throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
    }
    module2.exports = toNumber;
  }
});

// node_modules/fast-xml-parser/src/ignoreAttributes.js
var require_ignoreAttributes = __commonJS({
  "node_modules/fast-xml-parser/src/ignoreAttributes.js"(exports2, module2) {
    function getIgnoreAttributesFn(ignoreAttributes) {
      if (typeof ignoreAttributes === "function") {
        return ignoreAttributes;
      }
      if (Array.isArray(ignoreAttributes)) {
        return (attrName) => {
          for (const pattern of ignoreAttributes) {
            if (typeof pattern === "string" && attrName === pattern) {
              return true;
            }
            if (pattern instanceof RegExp && pattern.test(attrName)) {
              return true;
            }
          }
        };
      }
      return () => false;
    }
    module2.exports = getIgnoreAttributesFn;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
var require_OrderedObjParser = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js"(exports2, module2) {
    "use strict";
    var util = require_util();
    var xmlNode = require_xmlNode();
    var DocTypeReader = require_DocTypeReader();
    var toNumber = require_strnum();
    var getIgnoreAttributesFn = require_ignoreAttributes();
    var OrderedObjParser = class {
      constructor(options) {
        this.options = options;
        this.currentNode = null;
        this.tagsNodeStack = [];
        this.docTypeEntities = {};
        this.lastEntities = {
          "apos": { regex: /&(apos|#39|#x27);/g, val: "'" },
          "gt": { regex: /&(gt|#62|#x3E);/g, val: ">" },
          "lt": { regex: /&(lt|#60|#x3C);/g, val: "<" },
          "quot": { regex: /&(quot|#34|#x22);/g, val: '"' }
        };
        this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" };
        this.htmlEntities = {
          "space": { regex: /&(nbsp|#160);/g, val: " " },
          // "lt" : { regex: /&(lt|#60);/g, val: "<" },
          // "gt" : { regex: /&(gt|#62);/g, val: ">" },
          // "amp" : { regex: /&(amp|#38);/g, val: "&" },
          // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
          // "apos" : { regex: /&(apos|#39);/g, val: "'" },
          "cent": { regex: /&(cent|#162);/g, val: "\xA2" },
          "pound": { regex: /&(pound|#163);/g, val: "\xA3" },
          "yen": { regex: /&(yen|#165);/g, val: "\xA5" },
          "euro": { regex: /&(euro|#8364);/g, val: "\u20AC" },
          "copyright": { regex: /&(copy|#169);/g, val: "\xA9" },
          "reg": { regex: /&(reg|#174);/g, val: "\xAE" },
          "inr": { regex: /&(inr|#8377);/g, val: "\u20B9" },
          "num_dec": { regex: /&#([0-9]{1,7});/g, val: (_, str) => fromCodePoint(str, 10, "&#") },
          "num_hex": { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (_, str) => fromCodePoint(str, 16, "&#x") }
        };
        this.addExternalEntities = addExternalEntities;
        this.parseXml = parseXml;
        this.parseTextData = parseTextData;
        this.resolveNameSpace = resolveNameSpace;
        this.buildAttributesMap = buildAttributesMap;
        this.isItStopNode = isItStopNode;
        this.replaceEntitiesValue = replaceEntitiesValue;
        this.readStopNodeData = readStopNodeData;
        this.saveTextToParentTag = saveTextToParentTag;
        this.addChild = addChild;
        this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
        this.entityExpansionCount = 0;
        this.currentExpandedLength = 0;
        if (this.options.stopNodes && this.options.stopNodes.length > 0) {
          this.stopNodesExact = /* @__PURE__ */ new Set();
          this.stopNodesWildcard = /* @__PURE__ */ new Set();
          for (let i = 0; i < this.options.stopNodes.length; i++) {
            const stopNodeExp = this.options.stopNodes[i];
            if (typeof stopNodeExp !== "string") continue;
            if (stopNodeExp.startsWith("*.")) {
              this.stopNodesWildcard.add(stopNodeExp.substring(2));
            } else {
              this.stopNodesExact.add(stopNodeExp);
            }
          }
        }
      }
    };
    function addExternalEntities(externalEntities) {
      const entKeys = Object.keys(externalEntities);
      for (let i = 0; i < entKeys.length; i++) {
        const ent = entKeys[i];
        const escaped = ent.replace(/[.\-+*:]/g, "\\.");
        this.lastEntities[ent] = {
          regex: new RegExp("&" + escaped + ";", "g"),
          val: externalEntities[ent]
        };
      }
    }
    function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
      if (val !== void 0) {
        if (this.options.trimValues && !dontTrim) {
          val = val.trim();
        }
        if (val.length > 0) {
          if (!escapeEntities) val = this.replaceEntitiesValue(val, tagName, jPath);
          const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
          if (newval === null || newval === void 0) {
            return val;
          } else if (typeof newval !== typeof val || newval !== val) {
            return newval;
          } else if (this.options.trimValues) {
            return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
          } else {
            const trimmedVal = val.trim();
            if (trimmedVal === val) {
              return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
            } else {
              return val;
            }
          }
        }
      }
    }
    function resolveNameSpace(tagname) {
      if (this.options.removeNSPrefix) {
        const tags = tagname.split(":");
        const prefix = tagname.charAt(0) === "/" ? "/" : "";
        if (tags[0] === "xmlns") {
          return "";
        }
        if (tags.length === 2) {
          tagname = prefix + tags[1];
        }
      }
      return tagname;
    }
    var attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
    function buildAttributesMap(attrStr, jPath, tagName) {
      if (this.options.ignoreAttributes !== true && typeof attrStr === "string") {
        const matches = util.getAllMatches(attrStr, attrsRegx);
        const len = matches.length;
        const attrs = {};
        for (let i = 0; i < len; i++) {
          const attrName = this.resolveNameSpace(matches[i][1]);
          if (this.ignoreAttributesFn(attrName, jPath)) {
            continue;
          }
          let oldVal = matches[i][4];
          let aName = this.options.attributeNamePrefix + attrName;
          if (attrName.length) {
            if (this.options.transformAttributeName) {
              aName = this.options.transformAttributeName(aName);
            }
            aName = sanitizeName(aName, this.options);
            if (oldVal !== void 0) {
              if (this.options.trimValues) {
                oldVal = oldVal.trim();
              }
              oldVal = this.replaceEntitiesValue(oldVal, tagName, jPath);
              const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
              if (newVal === null || newVal === void 0) {
                attrs[aName] = oldVal;
              } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
                attrs[aName] = newVal;
              } else {
                attrs[aName] = parseValue(
                  oldVal,
                  this.options.parseAttributeValue,
                  this.options.numberParseOptions
                );
              }
            } else if (this.options.allowBooleanAttributes) {
              attrs[aName] = true;
            }
          }
        }
        if (!Object.keys(attrs).length) {
          return;
        }
        if (this.options.attributesGroupName) {
          const attrCollection = {};
          attrCollection[this.options.attributesGroupName] = attrs;
          return attrCollection;
        }
        return attrs;
      }
    }
    var parseXml = function(xmlData) {
      xmlData = xmlData.replace(/\r\n?/g, "\n");
      const xmlObj = new xmlNode("!xml");
      let currentNode = xmlObj;
      let textData = "";
      let jPath = "";
      this.entityExpansionCount = 0;
      this.currentExpandedLength = 0;
      const docTypeReader = new DocTypeReader(this.options.processEntities);
      for (let i = 0; i < xmlData.length; i++) {
        const ch = xmlData[i];
        if (ch === "<") {
          if (xmlData[i + 1] === "/") {
            const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
            let tagName = xmlData.substring(i + 2, closeIndex).trim();
            if (this.options.removeNSPrefix) {
              const colonIndex = tagName.indexOf(":");
              if (colonIndex !== -1) {
                tagName = tagName.substr(colonIndex + 1);
              }
            }
            if (this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }
            if (currentNode) {
              textData = this.saveTextToParentTag(textData, currentNode, jPath);
            }
            const lastTagName = jPath.substring(jPath.lastIndexOf(".") + 1);
            if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) {
              throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
            }
            let propIndex = 0;
            if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
              propIndex = jPath.lastIndexOf(".", jPath.lastIndexOf(".") - 1);
              this.tagsNodeStack.pop();
            } else {
              propIndex = jPath.lastIndexOf(".");
            }
            jPath = jPath.substring(0, propIndex);
            currentNode = this.tagsNodeStack.pop();
            textData = "";
            i = closeIndex;
          } else if (xmlData[i + 1] === "?") {
            let tagData = readTagExp(xmlData, i, false, "?>");
            if (!tagData) throw new Error("Pi Tag is not closed.");
            textData = this.saveTextToParentTag(textData, currentNode, jPath);
            if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags) {
            } else {
              const childNode = new xmlNode(tagData.tagName);
              childNode.add(this.options.textNodeName, "");
              if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
                childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
              }
              this.addChild(currentNode, childNode, jPath, i);
            }
            i = tagData.closeIndex + 1;
          } else if (xmlData.substr(i + 1, 3) === "!--") {
            const endIndex = findClosingIndex(xmlData, "-->", i + 4, "Comment is not closed.");
            if (this.options.commentPropName) {
              const comment = xmlData.substring(i + 4, endIndex - 2);
              textData = this.saveTextToParentTag(textData, currentNode, jPath);
              currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
            }
            i = endIndex;
          } else if (xmlData.substr(i + 1, 2) === "!D") {
            const result = docTypeReader.readDocType(xmlData, i);
            this.docTypeEntities = result.entities;
            i = result.i;
          } else if (xmlData.substr(i + 1, 2) === "![") {
            const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
            const tagExp = xmlData.substring(i + 9, closeIndex);
            textData = this.saveTextToParentTag(textData, currentNode, jPath);
            let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
            if (val == void 0) val = "";
            if (this.options.cdataPropName) {
              currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
            } else {
              currentNode.add(this.options.textNodeName, val);
            }
            i = closeIndex + 2;
          } else {
            let result = readTagExp(xmlData, i, this.options.removeNSPrefix);
            let tagName = result.tagName;
            const rawTagName = result.rawTagName;
            let tagExp = result.tagExp;
            let attrExpPresent = result.attrExpPresent;
            let closeIndex = result.closeIndex;
            if (this.options.transformTagName) {
              const newTagName = this.options.transformTagName(tagName);
              if (tagExp === tagName) {
                tagExp = newTagName;
              }
              tagName = newTagName;
            }
            if (this.options.strictReservedNames && (tagName === this.options.commentPropName || tagName === this.options.cdataPropName || tagName === this.options.textNodeName || tagName === this.options.attributesGroupName)) {
              throw new Error(`Invalid tag name: ${tagName}`);
            }
            if (currentNode && textData) {
              if (currentNode.tagname !== "!xml") {
                textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
              }
            }
            const lastTag = currentNode;
            if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
              currentNode = this.tagsNodeStack.pop();
              jPath = jPath.substring(0, jPath.lastIndexOf("."));
            }
            if (tagName !== xmlObj.tagname) {
              jPath += jPath ? "." + tagName : tagName;
            }
            const startIndex = i;
            if (this.isItStopNode(this.stopNodesExact, this.stopNodesWildcard, jPath, tagName)) {
              let tagContent = "";
              if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
                if (tagName[tagName.length - 1] === "/") {
                  tagName = tagName.substr(0, tagName.length - 1);
                  jPath = jPath.substr(0, jPath.length - 1);
                  tagExp = tagName;
                } else {
                  tagExp = tagExp.substr(0, tagExp.length - 1);
                }
                i = result.closeIndex;
              } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
                i = result.closeIndex;
              } else {
                const result2 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
                if (!result2) throw new Error(`Unexpected end of ${rawTagName}`);
                i = result2.i;
                tagContent = result2.tagContent;
              }
              const childNode = new xmlNode(tagName);
              if (tagName !== tagExp && attrExpPresent) {
                childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
              }
              if (tagContent) {
                tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
              }
              jPath = jPath.substr(0, jPath.lastIndexOf("."));
              childNode.add(this.options.textNodeName, tagContent);
              this.addChild(currentNode, childNode, jPath, startIndex);
            } else {
              if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
                if (tagName[tagName.length - 1] === "/") {
                  tagName = tagName.substr(0, tagName.length - 1);
                  jPath = jPath.substr(0, jPath.length - 1);
                  tagExp = tagName;
                } else {
                  tagExp = tagExp.substr(0, tagExp.length - 1);
                }
                if (this.options.transformTagName) {
                  const newTagName = this.options.transformTagName(tagName);
                  if (tagExp === tagName) {
                    tagExp = newTagName;
                  }
                  tagName = newTagName;
                }
                const childNode = new xmlNode(tagName);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                this.addChild(currentNode, childNode, jPath, startIndex);
                jPath = jPath.substr(0, jPath.lastIndexOf("."));
              } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
                const childNode = new xmlNode(tagName);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath);
                }
                this.addChild(currentNode, childNode, jPath, startIndex);
                jPath = jPath.substr(0, jPath.lastIndexOf("."));
                i = result.closeIndex;
                continue;
              } else {
                const childNode = new xmlNode(tagName);
                if (this.tagsNodeStack.length > this.options.maxNestedTags) {
                  throw new Error("Maximum nested tags exceeded");
                }
                this.tagsNodeStack.push(currentNode);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                this.addChild(currentNode, childNode, jPath);
                currentNode = childNode;
              }
              textData = "";
              i = closeIndex;
            }
          }
        } else {
          textData += xmlData[i];
        }
      }
      return xmlObj.child;
    };
    function addChild(currentNode, childNode, jPath, startIndex) {
      if (!this.options.captureMetaData) startIndex = void 0;
      const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
      if (result === false) {
      } else if (typeof result === "string") {
        childNode.tagname = result;
        currentNode.addChild(childNode, startIndex);
      } else {
        currentNode.addChild(childNode, startIndex);
      }
    }
    var replaceEntitiesValue = function(val, tagName, jPath) {
      if (val.indexOf("&") === -1) {
        return val;
      }
      const entityConfig = this.options.processEntities;
      if (!entityConfig.enabled) {
        return val;
      }
      if (entityConfig.allowedTags) {
        if (!entityConfig.allowedTags.includes(tagName)) {
          return val;
        }
      }
      if (entityConfig.tagFilter) {
        if (!entityConfig.tagFilter(tagName, jPath)) {
          return val;
        }
      }
      for (let entityName in this.docTypeEntities) {
        const entity = this.docTypeEntities[entityName];
        const matches = val.match(entity.regx);
        if (matches) {
          this.entityExpansionCount += matches.length;
          if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
            throw new Error(
              `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
            );
          }
          const lengthBefore = val.length;
          val = val.replace(entity.regx, entity.val);
          if (entityConfig.maxExpandedLength) {
            this.currentExpandedLength += val.length - lengthBefore;
            if (this.currentExpandedLength > entityConfig.maxExpandedLength) {
              throw new Error(
                `Total expanded content size exceeded: ${this.currentExpandedLength} > ${entityConfig.maxExpandedLength}`
              );
            }
          }
        }
      }
      if (val.indexOf("&") === -1) return val;
      for (const entityName of Object.keys(this.lastEntities)) {
        const entity = this.lastEntities[entityName];
        const matches = val.match(entity.regex);
        if (matches) {
          this.entityExpansionCount += matches.length;
          if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
            throw new Error(
              `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
            );
          }
        }
        val = val.replace(entity.regex, entity.val);
      }
      if (val.indexOf("&") === -1) return val;
      if (this.options.htmlEntities) {
        for (const entityName of Object.keys(this.htmlEntities)) {
          const entity = this.htmlEntities[entityName];
          const matches = val.match(entity.regex);
          if (matches) {
            this.entityExpansionCount += matches.length;
            if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
              throw new Error(
                `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
              );
            }
          }
          val = val.replace(entity.regex, entity.val);
        }
      }
      val = val.replace(this.ampEntity.regex, this.ampEntity.val);
      return val;
    };
    function saveTextToParentTag(textData, parentNode, jPath, isLeafNode) {
      if (textData) {
        if (isLeafNode === void 0) isLeafNode = parentNode.child.length === 0;
        textData = this.parseTextData(
          textData,
          parentNode.tagname,
          jPath,
          false,
          parentNode[":@"] ? Object.keys(parentNode[":@"]).length !== 0 : false,
          isLeafNode
        );
        if (textData !== void 0 && textData !== "")
          parentNode.add(this.options.textNodeName, textData);
        textData = "";
      }
      return textData;
    }
    function isItStopNode(stopNodesExact, stopNodesWildcard, jPath, currentTagName) {
      if (stopNodesWildcard && stopNodesWildcard.has(currentTagName)) return true;
      if (stopNodesExact && stopNodesExact.has(jPath)) return true;
      return false;
    }
    function tagExpWithClosingIndex(xmlData, i, closingChar = ">") {
      let attrBoundary;
      let tagExp = "";
      for (let index = i; index < xmlData.length; index++) {
        let ch = xmlData[index];
        if (attrBoundary) {
          if (ch === attrBoundary) attrBoundary = "";
        } else if (ch === '"' || ch === "'") {
          attrBoundary = ch;
        } else if (ch === closingChar[0]) {
          if (closingChar[1]) {
            if (xmlData[index + 1] === closingChar[1]) {
              return {
                data: tagExp,
                index
              };
            }
          } else {
            return {
              data: tagExp,
              index
            };
          }
        } else if (ch === "	") {
          ch = " ";
        }
        tagExp += ch;
      }
    }
    function findClosingIndex(xmlData, str, i, errMsg) {
      const closingIndex = xmlData.indexOf(str, i);
      if (closingIndex === -1) {
        throw new Error(errMsg);
      } else {
        return closingIndex + str.length - 1;
      }
    }
    function readTagExp(xmlData, i, removeNSPrefix, closingChar = ">") {
      const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
      if (!result) return;
      let tagExp = result.data;
      const closeIndex = result.index;
      const separatorIndex = tagExp.search(/\s/);
      let tagName = tagExp;
      let attrExpPresent = true;
      if (separatorIndex !== -1) {
        tagName = tagExp.substring(0, separatorIndex);
        tagExp = tagExp.substring(separatorIndex + 1).trimStart();
      }
      const rawTagName = tagName;
      if (removeNSPrefix) {
        const colonIndex = tagName.indexOf(":");
        if (colonIndex !== -1) {
          tagName = tagName.substr(colonIndex + 1);
          attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
        }
      }
      return {
        tagName,
        tagExp,
        closeIndex,
        attrExpPresent,
        rawTagName
      };
    }
    function readStopNodeData(xmlData, tagName, i) {
      const startIndex = i;
      let openTagCount = 1;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === "<") {
          if (xmlData[i + 1] === "/") {
            const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
            let closeTagName = xmlData.substring(i + 2, closeIndex).trim();
            if (closeTagName === tagName) {
              openTagCount--;
              if (openTagCount === 0) {
                return {
                  tagContent: xmlData.substring(startIndex, i),
                  i: closeIndex
                };
              }
            }
            i = closeIndex;
          } else if (xmlData[i + 1] === "?") {
            const closeIndex = findClosingIndex(xmlData, "?>", i + 1, "StopNode is not closed.");
            i = closeIndex;
          } else if (xmlData.substr(i + 1, 3) === "!--") {
            const closeIndex = findClosingIndex(xmlData, "-->", i + 3, "StopNode is not closed.");
            i = closeIndex;
          } else if (xmlData.substr(i + 1, 2) === "![") {
            const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
            i = closeIndex;
          } else {
            const tagData = readTagExp(xmlData, i, ">");
            if (tagData) {
              const openTagName = tagData && tagData.tagName;
              if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") {
                openTagCount++;
              }
              i = tagData.closeIndex;
            }
          }
        }
      }
    }
    function parseValue(val, shouldParse, options) {
      if (shouldParse && typeof val === "string") {
        const newval = val.trim();
        if (newval === "true") return true;
        else if (newval === "false") return false;
        else return toNumber(val, options);
      } else {
        if (util.isExist(val)) {
          return val;
        } else {
          return "";
        }
      }
    }
    function fromCodePoint(str, base, prefix) {
      const codePoint = Number.parseInt(str, base);
      if (codePoint >= 0 && codePoint <= 1114111) {
        return String.fromCodePoint(codePoint);
      } else {
        return prefix + str + ";";
      }
    }
    function sanitizeName(name, options) {
      if (util.criticalProperties.includes(name)) {
        throw new Error(`[SECURITY] Invalid name: "${name}" is a reserved JavaScript keyword that could cause prototype pollution`);
      } else if (util.DANGEROUS_PROPERTY_NAMES.includes(name)) {
        return options.onDangerousProperty(name);
      }
      return name;
    }
    module2.exports = OrderedObjParser;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/node2json.js
var require_node2json = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/node2json.js"(exports2) {
    "use strict";
    function prettify(node, options) {
      return compress(node, options);
    }
    function compress(arr, options, jPath) {
      let text;
      const compressedObj = {};
      for (let i = 0; i < arr.length; i++) {
        const tagObj = arr[i];
        const property = propName(tagObj);
        let newJpath = "";
        if (jPath === void 0) newJpath = property;
        else newJpath = jPath + "." + property;
        if (property === options.textNodeName) {
          if (text === void 0) text = tagObj[property];
          else text += "" + tagObj[property];
        } else if (property === void 0) {
          continue;
        } else if (tagObj[property]) {
          let val = compress(tagObj[property], options, newJpath);
          const isLeaf = isLeafTag(val, options);
          if (tagObj[":@"]) {
            assignAttributes(val, tagObj[":@"], newJpath, options);
          } else if (Object.keys(val).length === 1 && val[options.textNodeName] !== void 0 && !options.alwaysCreateTextNode) {
            val = val[options.textNodeName];
          } else if (Object.keys(val).length === 0) {
            if (options.alwaysCreateTextNode) val[options.textNodeName] = "";
            else val = "";
          }
          if (compressedObj[property] !== void 0 && compressedObj.hasOwnProperty(property)) {
            if (!Array.isArray(compressedObj[property])) {
              compressedObj[property] = [compressedObj[property]];
            }
            compressedObj[property].push(val);
          } else {
            if (options.isArray(property, newJpath, isLeaf)) {
              compressedObj[property] = [val];
            } else {
              compressedObj[property] = val;
            }
          }
        }
      }
      if (typeof text === "string") {
        if (text.length > 0) compressedObj[options.textNodeName] = text;
      } else if (text !== void 0) compressedObj[options.textNodeName] = text;
      return compressedObj;
    }
    function propName(obj) {
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key !== ":@") return key;
      }
    }
    function assignAttributes(obj, attrMap, jpath, options) {
      if (attrMap) {
        const keys = Object.keys(attrMap);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
          const atrrName = keys[i];
          if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
            obj[atrrName] = [attrMap[atrrName]];
          } else {
            obj[atrrName] = attrMap[atrrName];
          }
        }
      }
    }
    function isLeafTag(obj, options) {
      const { textNodeName } = options;
      const propCount = Object.keys(obj).length;
      if (propCount === 0) {
        return true;
      }
      if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
        return true;
      }
      return false;
    }
    exports2.prettify = prettify;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
var require_XMLParser = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/XMLParser.js"(exports2, module2) {
    var { buildOptions } = require_OptionsBuilder();
    var OrderedObjParser = require_OrderedObjParser();
    var { prettify } = require_node2json();
    var validator = require_validator();
    var XMLParser2 = class {
      constructor(options) {
        this.externalEntities = {};
        this.options = buildOptions(options);
      }
      /**
       * Parse XML dats to JS object 
       * @param {string|Buffer} xmlData 
       * @param {boolean|Object} validationOption 
       */
      parse(xmlData, validationOption) {
        if (typeof xmlData === "string") {
        } else if (xmlData.toString) {
          xmlData = xmlData.toString();
        } else {
          throw new Error("XML data is accepted in String or Bytes[] form.");
        }
        if (validationOption) {
          if (validationOption === true) validationOption = {};
          const result = validator.validate(xmlData, validationOption);
          if (result !== true) {
            throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
          }
        }
        const orderedObjParser = new OrderedObjParser(this.options);
        orderedObjParser.addExternalEntities(this.externalEntities);
        const orderedResult = orderedObjParser.parseXml(xmlData);
        if (this.options.preserveOrder || orderedResult === void 0) return orderedResult;
        else return prettify(orderedResult, this.options);
      }
      /**
       * Add Entity which is not by default supported by this library
       * @param {string} key 
       * @param {string} value 
       */
      addEntity(key, value) {
        if (value.indexOf("&") !== -1) {
          throw new Error("Entity value can't have '&'");
        } else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) {
          throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
        } else if (value === "&") {
          throw new Error("An entity with value '&' is not permitted");
        } else {
          this.externalEntities[key] = value;
        }
      }
    };
    module2.exports = XMLParser2;
  }
});

// node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js
var require_orderedJs2Xml = __commonJS({
  "node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js"(exports2, module2) {
    var EOL = "\n";
    function toXml(jArray, options) {
      let indentation = "";
      if (options.format && options.indentBy.length > 0) {
        indentation = EOL;
      }
      return arrToStr(jArray, options, "", indentation);
    }
    function arrToStr(arr, options, jPath, indentation) {
      let xmlStr = "";
      let isPreviousElementTag = false;
      if (!Array.isArray(arr)) {
        if (arr !== void 0 && arr !== null) {
          let text = arr.toString();
          text = replaceEntitiesValue(text, options);
          return text;
        }
        return "";
      }
      for (let i = 0; i < arr.length; i++) {
        const tagObj = arr[i];
        const tagName = propName(tagObj);
        if (tagName === void 0) continue;
        let newJPath = "";
        if (jPath.length === 0) newJPath = tagName;
        else newJPath = `${jPath}.${tagName}`;
        if (tagName === options.textNodeName) {
          let tagText = tagObj[tagName];
          if (!isStopNode(newJPath, options)) {
            tagText = options.tagValueProcessor(tagName, tagText);
            tagText = replaceEntitiesValue(tagText, options);
          }
          if (isPreviousElementTag) {
            xmlStr += indentation;
          }
          xmlStr += tagText;
          isPreviousElementTag = false;
          continue;
        } else if (tagName === options.cdataPropName) {
          if (isPreviousElementTag) {
            xmlStr += indentation;
          }
          xmlStr += `<![CDATA[${tagObj[tagName][0][options.textNodeName]}]]>`;
          isPreviousElementTag = false;
          continue;
        } else if (tagName === options.commentPropName) {
          xmlStr += indentation + `<!--${tagObj[tagName][0][options.textNodeName]}-->`;
          isPreviousElementTag = true;
          continue;
        } else if (tagName[0] === "?") {
          const attStr2 = attr_to_str(tagObj[":@"], options);
          const tempInd = tagName === "?xml" ? "" : indentation;
          let piTextNodeName = tagObj[tagName][0][options.textNodeName];
          piTextNodeName = piTextNodeName.length !== 0 ? " " + piTextNodeName : "";
          xmlStr += tempInd + `<${tagName}${piTextNodeName}${attStr2}?>`;
          isPreviousElementTag = true;
          continue;
        }
        let newIdentation = indentation;
        if (newIdentation !== "") {
          newIdentation += options.indentBy;
        }
        const attStr = attr_to_str(tagObj[":@"], options);
        const tagStart = indentation + `<${tagName}${attStr}`;
        const tagValue = arrToStr(tagObj[tagName], options, newJPath, newIdentation);
        if (options.unpairedTags.indexOf(tagName) !== -1) {
          if (options.suppressUnpairedNode) xmlStr += tagStart + ">";
          else xmlStr += tagStart + "/>";
        } else if ((!tagValue || tagValue.length === 0) && options.suppressEmptyNode) {
          xmlStr += tagStart + "/>";
        } else if (tagValue && tagValue.endsWith(">")) {
          xmlStr += tagStart + `>${tagValue}${indentation}</${tagName}>`;
        } else {
          xmlStr += tagStart + ">";
          if (tagValue && indentation !== "" && (tagValue.includes("/>") || tagValue.includes("</"))) {
            xmlStr += indentation + options.indentBy + tagValue + indentation;
          } else {
            xmlStr += tagValue;
          }
          xmlStr += `</${tagName}>`;
        }
        isPreviousElementTag = true;
      }
      return xmlStr;
    }
    function propName(obj) {
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        if (key !== ":@") return key;
      }
    }
    function attr_to_str(attrMap, options) {
      let attrStr = "";
      if (attrMap && !options.ignoreAttributes) {
        for (let attr in attrMap) {
          if (!Object.prototype.hasOwnProperty.call(attrMap, attr)) continue;
          let attrVal = options.attributeValueProcessor(attr, attrMap[attr]);
          attrVal = replaceEntitiesValue(attrVal, options);
          if (attrVal === true && options.suppressBooleanAttributes) {
            attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
          } else {
            attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
          }
        }
      }
      return attrStr;
    }
    function isStopNode(jPath, options) {
      jPath = jPath.substr(0, jPath.length - options.textNodeName.length - 1);
      let tagName = jPath.substr(jPath.lastIndexOf(".") + 1);
      for (let index in options.stopNodes) {
        if (options.stopNodes[index] === jPath || options.stopNodes[index] === "*." + tagName) return true;
      }
      return false;
    }
    function replaceEntitiesValue(textValue, options) {
      if (textValue && textValue.length > 0 && options.processEntities) {
        for (let i = 0; i < options.entities.length; i++) {
          const entity = options.entities[i];
          textValue = textValue.replace(entity.regex, entity.val);
        }
      }
      return textValue;
    }
    module2.exports = toXml;
  }
});

// node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js
var require_json2xml = __commonJS({
  "node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js"(exports2, module2) {
    "use strict";
    var buildFromOrderedJs = require_orderedJs2Xml();
    var getIgnoreAttributesFn = require_ignoreAttributes();
    var defaultOptions = {
      attributeNamePrefix: "@_",
      attributesGroupName: false,
      textNodeName: "#text",
      ignoreAttributes: true,
      cdataPropName: false,
      format: false,
      indentBy: "  ",
      suppressEmptyNode: false,
      suppressUnpairedNode: true,
      suppressBooleanAttributes: true,
      tagValueProcessor: function(key, a) {
        return a;
      },
      attributeValueProcessor: function(attrName, a) {
        return a;
      },
      preserveOrder: false,
      commentPropName: false,
      unpairedTags: [],
      entities: [
        { regex: new RegExp("&", "g"), val: "&amp;" },
        //it must be on top
        { regex: new RegExp(">", "g"), val: "&gt;" },
        { regex: new RegExp("<", "g"), val: "&lt;" },
        { regex: new RegExp("'", "g"), val: "&apos;" },
        { regex: new RegExp('"', "g"), val: "&quot;" }
      ],
      processEntities: true,
      stopNodes: [],
      // transformTagName: false,
      // transformAttributeName: false,
      oneListGroup: false
    };
    function Builder(options) {
      this.options = Object.assign({}, defaultOptions, options);
      if (this.options.ignoreAttributes === true || this.options.attributesGroupName) {
        this.isAttribute = function() {
          return false;
        };
      } else {
        this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
        this.attrPrefixLen = this.options.attributeNamePrefix.length;
        this.isAttribute = isAttribute;
      }
      this.processTextOrObjNode = processTextOrObjNode;
      if (this.options.format) {
        this.indentate = indentate;
        this.tagEndChar = ">\n";
        this.newLine = "\n";
      } else {
        this.indentate = function() {
          return "";
        };
        this.tagEndChar = ">";
        this.newLine = "";
      }
    }
    Builder.prototype.build = function(jObj) {
      if (this.options.preserveOrder) {
        return buildFromOrderedJs(jObj, this.options);
      } else {
        if (Array.isArray(jObj) && this.options.arrayNodeName && this.options.arrayNodeName.length > 1) {
          jObj = {
            [this.options.arrayNodeName]: jObj
          };
        }
        return this.j2x(jObj, 0, []).val;
      }
    };
    Builder.prototype.j2x = function(jObj, level, ajPath) {
      let attrStr = "";
      let val = "";
      const jPath = ajPath.join(".");
      for (let key in jObj) {
        if (!Object.prototype.hasOwnProperty.call(jObj, key)) continue;
        if (typeof jObj[key] === "undefined") {
          if (this.isAttribute(key)) {
            val += "";
          }
        } else if (jObj[key] === null) {
          if (this.isAttribute(key)) {
            val += "";
          } else if (key === this.options.cdataPropName) {
            val += "";
          } else if (key[0] === "?") {
            val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
          } else {
            val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
          }
        } else if (jObj[key] instanceof Date) {
          val += this.buildTextValNode(jObj[key], key, "", level);
        } else if (typeof jObj[key] !== "object") {
          const attr = this.isAttribute(key);
          if (attr && !this.ignoreAttributesFn(attr, jPath)) {
            attrStr += this.buildAttrPairStr(attr, "" + jObj[key]);
          } else if (!attr) {
            if (key === this.options.textNodeName) {
              let newval = this.options.tagValueProcessor(key, "" + jObj[key]);
              val += this.replaceEntitiesValue(newval);
            } else {
              val += this.buildTextValNode(jObj[key], key, "", level);
            }
          }
        } else if (Array.isArray(jObj[key])) {
          const arrLen = jObj[key].length;
          let listTagVal = "";
          let listTagAttr = "";
          for (let j = 0; j < arrLen; j++) {
            const item = jObj[key][j];
            if (typeof item === "undefined") {
            } else if (item === null) {
              if (key[0] === "?") val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
              else val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
            } else if (typeof item === "object") {
              if (this.options.oneListGroup) {
                const result = this.j2x(item, level + 1, ajPath.concat(key));
                listTagVal += result.val;
                if (this.options.attributesGroupName && item.hasOwnProperty(this.options.attributesGroupName)) {
                  listTagAttr += result.attrStr;
                }
              } else {
                listTagVal += this.processTextOrObjNode(item, key, level, ajPath);
              }
            } else {
              if (this.options.oneListGroup) {
                let textValue = this.options.tagValueProcessor(key, item);
                textValue = this.replaceEntitiesValue(textValue);
                listTagVal += textValue;
              } else {
                listTagVal += this.buildTextValNode(item, key, "", level);
              }
            }
          }
          if (this.options.oneListGroup) {
            listTagVal = this.buildObjectNode(listTagVal, key, listTagAttr, level);
          }
          val += listTagVal;
        } else {
          if (this.options.attributesGroupName && key === this.options.attributesGroupName) {
            const Ks = Object.keys(jObj[key]);
            const L = Ks.length;
            for (let j = 0; j < L; j++) {
              attrStr += this.buildAttrPairStr(Ks[j], "" + jObj[key][Ks[j]]);
            }
          } else {
            val += this.processTextOrObjNode(jObj[key], key, level, ajPath);
          }
        }
      }
      return { attrStr, val };
    };
    Builder.prototype.buildAttrPairStr = function(attrName, val) {
      val = this.options.attributeValueProcessor(attrName, "" + val);
      val = this.replaceEntitiesValue(val);
      if (this.options.suppressBooleanAttributes && val === "true") {
        return " " + attrName;
      } else return " " + attrName + '="' + val + '"';
    };
    function processTextOrObjNode(object, key, level, ajPath) {
      const result = this.j2x(object, level + 1, ajPath.concat(key));
      if (object[this.options.textNodeName] !== void 0 && Object.keys(object).length === 1) {
        return this.buildTextValNode(object[this.options.textNodeName], key, result.attrStr, level);
      } else {
        return this.buildObjectNode(result.val, key, result.attrStr, level);
      }
    }
    Builder.prototype.buildObjectNode = function(val, key, attrStr, level) {
      if (val === "") {
        if (key[0] === "?") return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
        else {
          return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
        }
      } else {
        let tagEndExp = "</" + key + this.tagEndChar;
        let piClosingChar = "";
        if (key[0] === "?") {
          piClosingChar = "?";
          tagEndExp = "";
        }
        if ((attrStr || attrStr === "") && val.indexOf("<") === -1) {
          return this.indentate(level) + "<" + key + attrStr + piClosingChar + ">" + val + tagEndExp;
        } else if (this.options.commentPropName !== false && key === this.options.commentPropName && piClosingChar.length === 0) {
          return this.indentate(level) + `<!--${val}-->` + this.newLine;
        } else {
          return this.indentate(level) + "<" + key + attrStr + piClosingChar + this.tagEndChar + val + this.indentate(level) + tagEndExp;
        }
      }
    };
    Builder.prototype.closeTag = function(key) {
      let closeTag = "";
      if (this.options.unpairedTags.indexOf(key) !== -1) {
        if (!this.options.suppressUnpairedNode) closeTag = "/";
      } else if (this.options.suppressEmptyNode) {
        closeTag = "/";
      } else {
        closeTag = `></${key}`;
      }
      return closeTag;
    };
    Builder.prototype.buildTextValNode = function(val, key, attrStr, level) {
      if (this.options.cdataPropName !== false && key === this.options.cdataPropName) {
        return this.indentate(level) + `<![CDATA[${val}]]>` + this.newLine;
      } else if (this.options.commentPropName !== false && key === this.options.commentPropName) {
        return this.indentate(level) + `<!--${val}-->` + this.newLine;
      } else if (key[0] === "?") {
        return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
      } else {
        let textValue = this.options.tagValueProcessor(key, val);
        textValue = this.replaceEntitiesValue(textValue);
        if (textValue === "") {
          return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
        } else {
          return this.indentate(level) + "<" + key + attrStr + ">" + textValue + "</" + key + this.tagEndChar;
        }
      }
    };
    Builder.prototype.replaceEntitiesValue = function(textValue) {
      if (textValue && textValue.length > 0 && this.options.processEntities) {
        for (let i = 0; i < this.options.entities.length; i++) {
          const entity = this.options.entities[i];
          textValue = textValue.replace(entity.regex, entity.val);
        }
      }
      return textValue;
    };
    function indentate(level) {
      return this.options.indentBy.repeat(level);
    }
    function isAttribute(name) {
      if (name.startsWith(this.options.attributeNamePrefix) && name !== this.options.textNodeName) {
        return name.substr(this.attrPrefixLen);
      } else {
        return false;
      }
    }
    module2.exports = Builder;
  }
});

// node_modules/fast-xml-parser/src/fxp.js
var require_fxp = __commonJS({
  "node_modules/fast-xml-parser/src/fxp.js"(exports2, module2) {
    "use strict";
    var validator = require_validator();
    var XMLParser2 = require_XMLParser();
    var XMLBuilder = require_json2xml();
    module2.exports = {
      XMLParser: XMLParser2,
      XMLValidator: validator,
      XMLBuilder
    };
  }
});

// src/main/main.ts
var import_electron4 = require("electron");
var import_node_fs5 = __toESM(require("node:fs"));
var import_node_path5 = __toESM(require("node:path"));

// src/shared/ipc.ts
var IPC = {
  watchlistGet: "watchlist:get",
  watchlistAdd: "watchlist:add",
  watchlistRemove: "watchlist:remove",
  symbolsSearch: "symbols:search",
  quotesGet: "quotes:get",
  holdingsGet: "holdings:get",
  newsGet: "news:get",
  earningsGet: "earnings:get",
  chartGet: "chart:get",
  pivotNewsGet: "chart:pivot-news",
  macroOverlayGet: "chart:macro-overlay",
  chartSnapshotCapture: "chart:capture-snapshot",
  quantAnalyze: "quant:analyze",
  quantInsightsGet: "quant:insights-get",
  llmSettingsGet: "llm-settings:get",
  llmSettingsSave: "llm-settings:save",
  valuationGet: "valuation:get",
  openExternal: "shell:open-external"
};

// src/shared/types.ts
var CHART_RANGES = ["1d", "1w", "1m", "6m", "1y", "5y", "max"];

// src/main/services/dataFiles.ts
var import_node_fs = __toESM(require("node:fs"));
var import_node_path = __toESM(require("node:path"));
function readJson(fileName) {
  try {
    const filePath = import_node_path.default.join(__dirname, "data", fileName);
    return JSON.parse(import_node_fs.default.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`[data] failed to read ${fileName}:`, err);
    return null;
  }
}
var etfBundleCache = null;
function getEtfBundle() {
  if (etfBundleCache) return etfBundleCache;
  const raw = readJson("etf-holdings.json");
  const etfs = {};
  if (raw && typeof raw === "object" && raw.etfs && typeof raw.etfs === "object") {
    for (const [symbol, entry] of Object.entries(raw.etfs)) {
      if (!entry || typeof entry.name !== "string" || !Array.isArray(entry.holdings)) continue;
      const holdings = [];
      for (const h of entry.holdings) {
        if (!h || typeof h.symbol !== "string" || typeof h.name !== "string") continue;
        holdings.push({
          symbol: h.symbol.toUpperCase(),
          name: h.name,
          weightPercent: typeof h.weightPercent === "number" ? h.weightPercent : null
        });
      }
      etfs[symbol.toUpperCase()] = { name: entry.name, holdings };
    }
  }
  etfBundleCache = {
    _meta: raw?._meta,
    etfs
  };
  return etfBundleCache;
}
function getBundleAsOf() {
  return getEtfBundle()._meta?.asOf ?? "2026-06";
}
var directoryCache = null;
function getSymbolDirectory() {
  if (directoryCache) return directoryCache;
  const raw = readJson("symbol-directory.json");
  const out = [];
  if (raw && Array.isArray(raw.symbols)) {
    for (const entry of raw.symbols) {
      const e = entry;
      if (typeof e.symbol === "string" && typeof e.name === "string" && (e.type === "etf" || e.type === "stock")) {
        out.push({
          symbol: e.symbol.toUpperCase(),
          name: e.name,
          type: e.type,
          exchange: typeof e.exchange === "string" ? e.exchange : void 0
        });
      }
    }
  }
  directoryCache = out;
  return directoryCache;
}
function directoryLookup(symbol) {
  const sym = symbol.toUpperCase();
  return getSymbolDirectory().find((e) => e.symbol === sym);
}
function lookupName(symbol) {
  const dir = directoryLookup(symbol);
  if (dir) return dir.name;
  const bundle = getEtfBundle();
  const etf = bundle.etfs[symbol.toUpperCase()];
  if (etf) return etf.name;
  for (const entry of Object.values(bundle.etfs)) {
    const hit = entry.holdings.find((h) => h.symbol === symbol.toUpperCase());
    if (hit) return hit.name;
  }
  return void 0;
}

// src/main/services/util.ts
var SYMBOL_RE = /^[A-Z0-9.^-]{1,12}$/i;
function normalizeSymbol(raw) {
  if (typeof raw !== "string") return null;
  const sym = raw.trim().toUpperCase();
  return sym.length > 0 && SYMBOL_RE.test(sym) ? sym : null;
}
function cleanSymbolList(raw, max) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const entry of raw) {
    const sym = normalizeSymbol(entry);
    if (sym && !out.includes(sym)) {
      out.push(sym);
      if (out.length >= max) break;
    }
  }
  return out;
}
function fnv1a(input, seed = 2166136261) {
  let h = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function stableHash(input) {
  return fnv1a(input);
}
function hashId(input) {
  return fnv1a(input).toString(36) + fnv1a(input, 2538058380).toString(36);
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function pLimit(concurrency) {
  let active = 0;
  const queue = [];
  const next = () => {
    active--;
    const run = queue.shift();
    if (run) run();
  };
  return (fn) => new Promise((resolve, reject) => {
    const run = () => {
      active++;
      fn().then(
        (value) => {
          next();
          resolve(value);
        },
        (err) => {
          next();
          reject(err);
        }
      );
    };
    if (active < concurrency) run();
    else queue.push(run);
  });
}
function toYmd(d) {
  return d.toISOString().slice(0, 10);
}
function todayYmd() {
  return toYmd(/* @__PURE__ */ new Date());
}
function parseDateMs(value) {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}
function normalizeTitle(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function stripHtml(input) {
  return input.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
function clampInt(raw, min, max, fallback) {
  const n = typeof raw === "number" && Number.isFinite(raw) ? Math.round(raw) : fallback;
  return Math.min(max, Math.max(min, n));
}
function round2(n) {
  return Math.round(n * 100) / 100;
}

// src/main/services/sample.ts
var BASE_PRICES = {
  SPY: 620,
  VOO: 570,
  IVV: 623,
  VTI: 305,
  QQQ: 560,
  DIA: 445,
  IWM: 225,
  XLK: 265,
  XLF: 53,
  XLE: 92,
  XLV: 135,
  SMH: 290,
  SOXX: 245,
  ARKK: 75,
  SCHD: 27,
  JEPI: 56,
  VGT: 700,
  VUG: 460,
  VTV: 175,
  RSP: 185,
  AAPL: 230,
  MSFT: 500,
  NVDA: 170,
  AMZN: 220,
  GOOGL: 185,
  GOOG: 187,
  META: 720,
  TSLA: 320,
  AVGO: 270,
  "BRK-B": 490,
  JPM: 290,
  V: 355,
  MA: 560,
  UNH: 310,
  XOM: 115,
  LLY: 780,
  JNJ: 155,
  PG: 160,
  HD: 365,
  COST: 985,
  WMT: 98,
  NFLX: 1250,
  CRM: 270,
  ORCL: 210,
  AMD: 140,
  ADBE: 390,
  PEP: 132,
  KO: 70,
  CSCO: 66,
  INTC: 22,
  TSM: 230,
  ASML: 790,
  QCOM: 155,
  TXN: 195,
  MU: 120,
  AMAT: 185,
  LRCX: 95,
  KLAC: 880,
  PLTR: 140,
  COIN: 350,
  HOOD: 80,
  SHOP: 110,
  DIS: 120,
  BA: 210,
  CAT: 390,
  GS: 700,
  MS: 140,
  BAC: 47,
  WFC: 80,
  IBM: 290,
  GE: 250,
  MCD: 300,
  NKE: 72,
  T: 28,
  VZ: 43,
  PFE: 25,
  MRK: 82,
  ABBV: 190,
  TMO: 490,
  CVX: 155,
  COP: 95,
  UBER: 90,
  NOW: 1e3,
  ISRG: 530,
  INTU: 760,
  AMGN: 290,
  HON: 220,
  GILD: 110,
  BMY: 55,
  SBUX: 95,
  PYPL: 75
};
function basePriceFor(symbol) {
  return BASE_PRICES[symbol.toUpperCase()] ?? 100;
}
var SAMPLE_RANGE = {
  "1d": { interval: "5m", count: 78, kind: "intraday", stepSec: 300, vol: 12e-4, baseVolume: 9e5 },
  "1w": { interval: "15m", count: 130, kind: "intraday", stepSec: 900, vol: 2e-3, baseVolume: 26e5 },
  "1m": { interval: "60m", count: 154, kind: "intraday", stepSec: 3600, vol: 4e-3, baseVolume: 9e6 },
  "6m": { interval: "1d", count: 126, kind: "daily", stepSec: 86400, vol: 0.012, baseVolume: 55e6 },
  "1y": { interval: "1d", count: 252, kind: "daily", stepSec: 86400, vol: 0.012, baseVolume: 55e6 },
  "5y": { interval: "1wk", count: 260, kind: "weekly", stepSec: 7 * 86400, vol: 0.028, baseVolume: 26e7 },
  max: { interval: "1mo", count: 240, kind: "monthly", stepSec: 30 * 86400, vol: 0.05, baseVolume: 11e8 }
};
var SESSION_OPEN_SEC = 13.5 * 3600;
var SESSION_CLOSE_SEC = 20 * 3600;
function lastWeekdayUtc(fromMs) {
  const d = new Date(fromMs);
  d.setUTCHours(0, 0, 0, 0);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return Math.floor(d.getTime() / 1e3);
}
function buildTimes(spec, count) {
  const times = [];
  if (spec.kind === "intraday") {
    let day = lastWeekdayUtc(Date.now());
    while (times.length < count) {
      const dayBars = [];
      for (let t = SESSION_OPEN_SEC; t < SESSION_CLOSE_SEC; t += spec.stepSec) {
        dayBars.push(day + t);
      }
      times.unshift(...dayBars);
      day = lastWeekdayUtc((day - 86400) * 1e3);
    }
    return times.slice(times.length - count);
  }
  if (spec.kind === "daily") {
    let day = lastWeekdayUtc(Date.now());
    while (times.length < count) {
      times.unshift(day + SESSION_OPEN_SEC);
      day = lastWeekdayUtc((day - 86400) * 1e3);
    }
    return times;
  }
  if (spec.kind === "weekly") {
    const anchor = lastWeekdayUtc(Date.now());
    for (let i = count - 1; i >= 0; i--) {
      times.push(anchor - i * 7 * 86400 + SESSION_OPEN_SEC);
    }
    return times;
  }
  const d = /* @__PURE__ */ new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(1);
  for (let i = 0; i < count; i++) {
    times.unshift(Math.floor(d.getTime() / 1e3) + SESSION_OPEN_SEC);
    d.setUTCMonth(d.getUTCMonth() - 1);
  }
  return times;
}
function sampleChart(symbol, range) {
  const sym = symbol.toUpperCase();
  const spec = SAMPLE_RANGE[range];
  const rng = mulberry32(stableHash(`${sym}|${range}`));
  const base = basePriceFor(sym);
  const times = buildTimes(spec, spec.count);
  const n = times.length;
  const closes = new Array(n);
  closes[n - 1] = base;
  for (let i = n - 2; i >= 0; i--) {
    const drift = (rng() - 0.495) * 2 * spec.vol;
    closes[i] = closes[i + 1] / (1 + drift);
  }
  const candles = [];
  let prevClose = closes[0] * (1 + (rng() - 0.5) * spec.vol);
  for (let i = 0; i < n; i++) {
    const open = prevClose;
    const close = closes[i];
    const wick = Math.max(Math.abs(close - open), close * spec.vol * 0.5);
    const high = Math.max(open, close) + rng() * wick * 0.6;
    const low = Math.min(open, close) - rng() * wick * 0.6;
    candles.push({
      time: times[i],
      open: round2(open),
      high: round2(high),
      low: round2(Math.max(low, 0.01)),
      close: round2(close),
      volume: Math.round(spec.baseVolume * (0.4 + rng() * 1.2))
    });
    prevClose = close;
  }
  const previousClose = range === "1d" ? round2(candles[0].open) : round2(candles[Math.max(0, n - 2)].close);
  return {
    symbol: sym,
    range,
    interval: spec.interval,
    candles,
    currency: "USD",
    exchangeName: void 0,
    regularMarketPrice: round2(candles[n - 1].close),
    previousClose,
    source: "sample"
  };
}
function sampleQuote(symbol) {
  const sym = symbol.toUpperCase();
  const chart = sampleChart(sym, "1d");
  const last = chart.candles[chart.candles.length - 1];
  const price = last.close;
  const previousClose = chart.previousClose ?? null;
  const change = previousClose !== null ? round2(price - previousClose) : null;
  const changePercent = previousClose !== null && previousClose !== 0 && change !== null ? round2(change / previousClose * 100) : null;
  return {
    symbol: sym,
    price,
    change,
    changePercent,
    previousClose,
    currency: "USD",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: "sample"
  };
}
var NEWS_TEMPLATES = [
  (name) => `${name} in focus as investors weigh the sector outlook`,
  (name, sym) => `Analysts revisit ${name} (${sym}) price targets after recent moves`,
  (name, sym) => `What the latest market swings mean for ${sym} holders`,
  (name) => `${name}: three things to watch this quarter`
];
function sampleNews(symbols, perSymbol = 3) {
  const items2 = [];
  const nowHour = Math.floor(Date.now() / 36e5) * 36e5;
  for (const symbol of symbols.slice(0, 12)) {
    const sym = symbol.toUpperCase();
    const rng = mulberry32(stableHash(`news|${sym}`));
    const name = lookupName(sym) ?? sym;
    for (let i = 0; i < Math.min(perSymbol, NEWS_TEMPLATES.length); i++) {
      const ageHours = 2 + Math.floor(rng() * 20) + i * 24;
      items2.push({
        id: `sample-${sym.toLowerCase()}-${i}`,
        title: NEWS_TEMPLATES[i](name, sym),
        url: `https://finance.yahoo.com/quote/${encodeURIComponent(sym)}`,
        sourceName: "Sample Data",
        publishedAt: new Date(nowHour - ageHours * 36e5).toISOString(),
        relatedSymbol: sym,
        summary: "Offline sample headline \u2014 live news was unavailable when this was generated."
      });
    }
  }
  items2.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return items2;
}
function sampleEarnings(symbol) {
  const sym = symbol.toUpperCase();
  const hash = stableHash(sym);
  const daysOut = hash % 28 + 2;
  const date = /* @__PURE__ */ new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + daysOut);
  return {
    symbol: sym,
    companyName: lookupName(sym) ?? sym,
    date: toYmd(date),
    time: hash % 2 === 0 ? "bmo" : "amc",
    epsEstimate: Math.round((hash % 450 / 100 + 0.4) * 100) / 100,
    epsActual: Math.round((hash % 470 / 100 + 0.35) * 100) / 100,
    epsSurprisePercent: Math.round((hash % 21 - 8) / 100 * 1e3) / 10,
    latestReportedDate: toYmd(new Date(Date.now() - 90 * 864e5)),
    source: "sample"
  };
}

// src/main/services/cache.ts
var TtlCache = class {
  constructor(maxEntries = 800) {
    this.maxEntries = maxEntries;
  }
  map = /* @__PURE__ */ new Map();
  get(key) {
    const entry = this.map.get(key);
    if (!entry) return void 0;
    if (entry.expires <= Date.now()) {
      this.map.delete(key);
      return void 0;
    }
    return entry.value;
  }
  set(key, value, ttlMs) {
    if (ttlMs <= 0) return;
    if (this.map.size >= this.maxEntries) this.prune();
    this.map.set(key, { expires: Date.now() + ttlMs, value });
  }
  delete(key) {
    this.map.delete(key);
  }
  prune() {
    const now = Date.now();
    for (const [key, entry] of this.map) {
      if (entry.expires <= now) this.map.delete(key);
    }
    while (this.map.size >= this.maxEntries) {
      const oldest = this.map.keys().next();
      if (oldest.done) break;
      this.map.delete(oldest.value);
    }
  }
};

// src/main/services/http.ts
var BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
var HttpError = class extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
};
var DEFAULT_TIMEOUT_MS = 12e3;
var MAX_ATTEMPTS = 3;
var RETRY_DELAYS_MS = [500, 1400];
var HostLimiter = class {
  constructor(maxConcurrent, spacingMs) {
    this.maxConcurrent = maxConcurrent;
    this.spacingMs = spacingMs;
  }
  active = 0;
  nextSlot = 0;
  waiting = [];
  async run(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
  acquire() {
    return new Promise((resolve) => {
      const attempt = () => {
        if (this.active >= this.maxConcurrent) {
          this.waiting.push(attempt);
          return;
        }
        const now = Date.now();
        const wait = this.nextSlot - now;
        if (wait > 0) {
          setTimeout(attempt, wait);
          return;
        }
        this.active++;
        this.nextSlot = now + this.spacingMs;
        resolve();
      };
      attempt();
    });
  }
  release() {
    this.active--;
    const next = this.waiting.shift();
    if (next) next();
  }
};
var limiters = /* @__PURE__ */ new Map();
function limiterFor(host) {
  let limiter = limiters.get(host);
  if (!limiter) {
    const spacing = host === "query1.finance.yahoo.com" ? 250 : 0;
    limiter = new HostLimiter(4, spacing);
    limiters.set(host, limiter);
  }
  return limiter;
}
var bodyCache = new TtlCache(600);
var inFlight = /* @__PURE__ */ new Map();
async function doFetch(url, host, headers, timeoutMs) {
  const res = await fetch(url, {
    headers: { "User-Agent": BROWSER_UA, ...headers },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!res.ok) {
    throw new HttpError(`HTTP ${res.status} from ${host}`, res.status);
  }
  return res.text();
}
async function fetchWithRetry(url, headers, timeoutMs) {
  const host = new URL(url).hostname;
  let lastErr;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await limiterFor(host).run(() => doFetch(url, host, headers, timeoutMs));
    } catch (err) {
      lastErr = err;
      const status = err instanceof HttpError ? err.status : void 0;
      const retryable = status === void 0 || status === 429 || status >= 500;
      if (!retryable || attempt === MAX_ATTEMPTS - 1) throw err;
      await sleep(RETRY_DELAYS_MS[attempt] ?? 1500);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`fetch failed: ${url}`);
}
async function fetchText(url, opts = {}) {
  const ttlMs = opts.ttlMs ?? 0;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (ttlMs > 0) {
    const cached = bodyCache.get(url);
    if (cached !== void 0) return cached;
    const pending = inFlight.get(url);
    if (pending) return pending;
  }
  const promise = fetchWithRetry(url, opts.headers, timeoutMs).then((body) => {
    if (ttlMs > 0) bodyCache.set(url, body, ttlMs);
    return body;
  }).finally(() => {
    inFlight.delete(url);
  });
  if (ttlMs > 0) inFlight.set(url, promise);
  return promise;
}
async function fetchJson(url, opts = {}) {
  const body = await fetchText(url, opts);
  try {
    return JSON.parse(body);
  } catch {
    bodyCache.delete(url);
    throw new Error(`Invalid JSON from ${new URL(url).hostname}`);
  }
}

// src/main/services/yahoo.ts
function rawNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object") {
    const raw = value.raw;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  }
  return null;
}
async function fetchYahooChart(symbol, yahooRange, interval, ttlMs) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${encodeURIComponent(yahooRange)}&interval=${encodeURIComponent(interval)}&includePrePost=false`;
  const json = await fetchJson(url, { ttlMs });
  const result = json.chart?.result?.[0];
  if (!result || !result.meta) {
    const desc = json.chart?.error?.description ?? "empty chart result";
    throw new Error(`Yahoo chart failed for ${symbol}: ${desc}`);
  }
  return result;
}
async function searchYahoo(query) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`;
  const json = await fetchJson(url, { ttlMs: 10 * 6e4 });
  return Array.isArray(json.quotes) ? json.quotes : [];
}
var CRUMB_TTL_MS = 30 * 6e4;
var crumbState = null;
var crumbPromise = null;
function invalidateCrumb() {
  crumbState = null;
}
async function fetchCookie() {
  const res = await fetch("https://fc.yahoo.com/", {
    headers: { "User-Agent": BROWSER_UA },
    redirect: "manual",
    signal: AbortSignal.timeout(12e3)
  });
  let cookies = [];
  try {
    cookies = res.headers.getSetCookie();
  } catch {
  }
  if (cookies.length === 0) {
    const single = res.headers.get("set-cookie");
    if (single) cookies = [single];
  }
  const parts = cookies.map((c) => c.split(";")[0].trim()).filter((c) => c.includes("="));
  if (parts.length === 0) throw new Error("Yahoo returned no cookie");
  return parts.join("; ");
}
async function fetchCrumbState() {
  const cookie = await fetchCookie();
  const res = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: { "User-Agent": BROWSER_UA, Cookie: cookie },
    signal: AbortSignal.timeout(12e3)
  });
  if (!res.ok) throw new HttpError(`getcrumb HTTP ${res.status}`, res.status);
  const crumb = (await res.text()).trim();
  if (!crumb || crumb.length > 64 || crumb.includes("<") || crumb.includes("{")) {
    throw new Error("Yahoo returned an invalid crumb");
  }
  return { cookie, crumb, fetchedAt: Date.now() };
}
async function getCrumb(force = false) {
  if (force) invalidateCrumb();
  if (crumbState && Date.now() - crumbState.fetchedAt < CRUMB_TTL_MS) {
    return crumbState;
  }
  if (!crumbPromise) {
    crumbPromise = fetchCrumbState().then((state) => {
      crumbState = state;
      return state;
    }).finally(() => {
      crumbPromise = null;
    });
  }
  return crumbPromise;
}
async function quoteSummary(symbol, modules) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const { cookie, crumb } = await getCrumb(attempt > 0);
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${encodeURIComponent(modules.join(","))}&crumb=${encodeURIComponent(crumb)}`;
    try {
      const json = await fetchJson(url, {
        ttlMs: 0,
        headers: { Cookie: cookie }
      });
      const result = json.quoteSummary?.result?.[0];
      if (!result) {
        const desc = json.quoteSummary?.error?.description ?? "empty result";
        throw new Error(`quoteSummary failed for ${symbol}: ${desc}`);
      }
      return result;
    } catch (err) {
      lastErr = err;
      const status = err instanceof HttpError ? err.status : void 0;
      if ((status === 401 || status === 403) && attempt === 0) {
        invalidateCrumb();
        continue;
      }
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`quoteSummary failed for ${symbol}`);
}

// src/main/services/chart.ts
var INTRADAY_TTL = 6e4;
var DAILY_TTL = 10 * 6e4;
var RANGE_MAP = {
  "1d": { yahooRange: "1d", interval: "5m", ttlMs: INTRADAY_TTL },
  "1w": { yahooRange: "5d", interval: "15m", ttlMs: INTRADAY_TTL },
  "1m": { yahooRange: "1mo", interval: "60m", ttlMs: INTRADAY_TTL },
  "6m": { yahooRange: "6mo", interval: "1d", ttlMs: DAILY_TTL },
  "1y": { yahooRange: "1y", interval: "1d", ttlMs: DAILY_TTL },
  "5y": { yahooRange: "5y", interval: "1wk", ttlMs: DAILY_TTL },
  max: { yahooRange: "max", interval: "1mo", ttlMs: DAILY_TTL }
};
function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}
async function getChart(symbol, range) {
  const spec = RANGE_MAP[range];
  try {
    const result = await fetchYahooChart(symbol, spec.yahooRange, spec.interval, spec.ttlMs);
    const meta = result.meta ?? {};
    const timestamps = Array.isArray(result.timestamp) ? result.timestamp : [];
    const quote = result.indicators?.quote?.[0] ?? {};
    const opens = quote.open ?? [];
    const highs = quote.high ?? [];
    const lows = quote.low ?? [];
    const closes = quote.close ?? [];
    const volumes = quote.volume ?? [];
    const bySecond = /* @__PURE__ */ new Map();
    for (let i = 0; i < timestamps.length; i++) {
      const time = timestamps[i];
      const close = closes[i];
      if (!isFiniteNumber(time) || !isFiniteNumber(close)) continue;
      const rawOpen = opens[i];
      const rawHigh = highs[i];
      const rawLow = lows[i];
      const rawVolume = volumes[i];
      const open = isFiniteNumber(rawOpen) ? rawOpen : close;
      let high = isFiniteNumber(rawHigh) ? rawHigh : Math.max(open, close);
      let low = isFiniteNumber(rawLow) ? rawLow : Math.min(open, close);
      high = Math.max(high, open, close);
      low = Math.min(low, open, close);
      const volume = isFiniteNumber(rawVolume) ? rawVolume : 0;
      bySecond.set(Math.floor(time), { time: Math.floor(time), open, high, low, close, volume });
    }
    const candles = [...bySecond.values()].sort((a, b) => a.time - b.time);
    if (candles.length === 0) throw new Error(`no usable candles for ${symbol} ${range}`);
    return {
      symbol,
      range,
      interval: spec.interval,
      candles,
      currency: typeof meta.currency === "string" && meta.currency ? meta.currency : "USD",
      exchangeName: typeof meta.exchangeName === "string" && meta.exchangeName ? meta.exchangeName : void 0,
      regularMarketPrice: isFiniteNumber(meta.regularMarketPrice) ? meta.regularMarketPrice : null,
      previousClose: isFiniteNumber(meta.chartPreviousClose) ? meta.chartPreviousClose : isFiniteNumber(meta.previousClose) ? meta.previousClose : null,
      source: "live"
    };
  } catch {
    return sampleChart(symbol, range);
  }
}

// src/main/services/earnings.ts
var LIVE_TTL_MS = 6 * 60 * 6e4;
var SAMPLE_TTL_MS = 10 * 6e4;
var WINDOW_DAYS = 120;
var limit = pLimit(3);
var cache = new TtlCache(400);
function toEpochMs(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1e3;
  }
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
  }
  if (value && typeof value === "object") {
    const raw = value.raw;
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return raw > 1e12 ? raw : raw * 1e3;
    }
    const fmt = value.fmt;
    if (typeof fmt === "string") {
      const ms = Date.parse(fmt);
      return Number.isNaN(ms) ? null : ms;
    }
  }
  return null;
}
function detectTime(candidates) {
  for (const c of candidates) {
    if (typeof c !== "string") continue;
    const v = c.toLowerCase();
    if (v.includes("bmo") || v.includes("before")) return "bmo";
    if (v.includes("amc") || v.includes("after")) return "amc";
  }
  return "unknown";
}
async function fetchLiveEvent(symbol) {
  const summary = await quoteSummary(symbol, ["calendarEvents", "earningsHistory", "price"]);
  const earnings = summary.calendarEvents?.earnings;
  const latestHistory = summary.earningsHistory?.history?.[0];
  const companyName = summary.price?.longName || summary.price?.shortName || lookupName(symbol) || symbol;
  const dates = Array.isArray(earnings?.earningsDate) ? earnings.earningsDate : [];
  const startOfToday = Date.parse(`${toYmd(/* @__PURE__ */ new Date())}T00:00:00Z`);
  const windowEnd = startOfToday + WINDOW_DAYS * 864e5;
  let nextMs = null;
  for (const d of dates) {
    const ms = toEpochMs(d);
    if (ms === null || ms < startOfToday || ms > windowEnd) continue;
    if (nextMs === null || ms < nextMs) nextMs = ms;
  }
  if (nextMs === null) return null;
  return {
    symbol,
    companyName,
    date: toYmd(new Date(nextMs)),
    time: detectTime([earnings?.earningsCallTime, earnings?.callTime]),
    epsEstimate: rawNumber(earnings?.earningsAverage),
    epsActual: rawNumber(latestHistory?.epsActual),
    epsSurprisePercent: rawNumber(latestHistory?.surprisePercent),
    latestReportedDate: latestHistory?.quarter === void 0 ? null : (() => {
      const ms = toEpochMs(latestHistory.quarter);
      return ms === null ? null : toYmd(new Date(ms));
    })(),
    source: "live"
  };
}
async function eventFor(symbol) {
  const cached = cache.get(symbol);
  if (cached !== void 0) return cached;
  try {
    const event = await limit(() => fetchLiveEvent(symbol));
    cache.set(symbol, event, LIVE_TTL_MS);
    return event;
  } catch {
    const event = sampleEarnings(symbol);
    cache.set(symbol, event, SAMPLE_TTL_MS);
    return event;
  }
}
async function getEarnings(symbols) {
  const results = await Promise.all(symbols.map((s) => eventFor(s)));
  const events = results.filter((e) => e !== null);
  events.sort((a, b) => a.date.localeCompare(b.date) || a.symbol.localeCompare(b.symbol));
  return events;
}

// src/main/services/holdings.ts
var LIVE_TTL_MS2 = 12 * 60 * 6e4;
var SAMPLE_TTL_MS2 = 15 * 6e4;
var MAX_HOLDINGS = 20;
var cache2 = new TtlCache(200);
var inFlight2 = /* @__PURE__ */ new Map();
function bundledResult(etfSymbol) {
  const entry = getEtfBundle().etfs[etfSymbol];
  return {
    etfSymbol,
    asOf: getBundleAsOf(),
    holdings: entry ? entry.holdings.slice(0, MAX_HOLDINGS) : [],
    source: "sample"
  };
}
async function fetchLiveHoldings(etfSymbol) {
  const summary = await quoteSummary(etfSymbol, ["topHoldings"]);
  const raw = summary.topHoldings?.holdings;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(`no live topHoldings for ${etfSymbol}`);
  }
  const out = [];
  for (const h of raw) {
    const symbol = typeof h.symbol === "string" ? h.symbol.toUpperCase().trim() : "";
    if (!symbol || out.some((x) => x.symbol === symbol)) continue;
    const fraction = rawNumber(h.holdingPercent);
    out.push({
      symbol,
      name: typeof h.holdingName === "string" && h.holdingName ? h.holdingName : symbol,
      weightPercent: fraction === null ? null : round2(fraction * 100)
    });
  }
  if (out.length === 0) throw new Error(`unusable live topHoldings for ${etfSymbol}`);
  return out;
}
function mergeWithBundle(etfSymbol, live) {
  const merged = [...live];
  const bundle = getEtfBundle().etfs[etfSymbol];
  if (bundle) {
    for (const h of bundle.holdings) {
      if (merged.length >= MAX_HOLDINGS) break;
      if (merged.some((x) => x.symbol === h.symbol)) continue;
      merged.push(h);
    }
    for (const item of merged) {
      if (item.name === item.symbol) {
        const known = bundle.holdings.find((x) => x.symbol === item.symbol);
        if (known) item.name = known.name;
      }
    }
  }
  merged.sort((a, b) => (b.weightPercent ?? -1) - (a.weightPercent ?? -1));
  return merged.slice(0, MAX_HOLDINGS);
}
async function getHoldings(etfSymbol) {
  const sym = etfSymbol.toUpperCase();
  const cached = cache2.get(sym);
  if (cached) return cached;
  const pending = inFlight2.get(sym);
  if (pending) return pending;
  const promise = (async () => {
    try {
      const live = await fetchLiveHoldings(sym);
      const result = {
        etfSymbol: sym,
        asOf: todayYmd(),
        holdings: mergeWithBundle(sym, live),
        source: "live"
      };
      cache2.set(sym, result, LIVE_TTL_MS2);
      return result;
    } catch {
      const result = bundledResult(sym);
      cache2.set(sym, result, SAMPLE_TTL_MS2);
      return result;
    }
  })().finally(() => {
    inFlight2.delete(sym);
  });
  inFlight2.set(sym, promise);
  return promise;
}

// src/main/services/llmSettings.ts
var import_electron = require("electron");
var import_node_fs2 = __toESM(require("node:fs"));
var import_node_path2 = __toESM(require("node:path"));
var DEFAULT_BASE_URL = process.env.QUANT_LLM_BASE_URL ?? "http://127.0.0.1:8080";
var DEFAULT_MODEL = process.env.QUANT_LLM_MODEL ?? "gemma-4-e4b";
function envEnabled() {
  return /^(1|true|yes)$/i.test(process.env.QUANT_LLM_ENABLED ?? "") || Boolean(process.env.QUANT_LLM_BASE_URL);
}
function storePath() {
  return import_node_path2.default.join(import_electron.app.getPath("userData"), "llm-settings.json");
}
function normalizeSettings(raw) {
  return {
    enabled: raw?.enabled === true || raw?.enabled === void 0 && envEnabled(),
    baseUrl: typeof raw?.baseUrl === "string" && raw.baseUrl.trim() ? raw.baseUrl.trim().replace(/\/+$/, "") : DEFAULT_BASE_URL,
    model: typeof raw?.model === "string" && raw.model.trim() ? raw.model.trim() : DEFAULT_MODEL
  };
}
function getLlmSettings() {
  try {
    const raw = import_node_fs2.default.readFileSync(storePath(), "utf8");
    const parsed = JSON.parse(raw);
    return normalizeSettings(parsed);
  } catch {
    return normalizeSettings(null);
  }
}
function saveLlmSettings(raw) {
  const settings = normalizeSettings({
    enabled: raw.enabled === true,
    baseUrl: raw.baseUrl,
    model: raw.model
  });
  const file = storePath();
  import_node_fs2.default.mkdirSync(import_node_path2.default.dirname(file), { recursive: true });
  import_node_fs2.default.writeFileSync(file, JSON.stringify(settings, null, 2), "utf8");
  return settings;
}

// src/main/services/macro.ts
var FRED_TTL_MS = 6 * 60 * 6e4;
var MARKET_TTL_MS = 2 * 6e4;
var SPECS = {
  jobs: {
    label: "US job growth",
    unit: "monthly payroll change, thousands",
    fredId: "PAYEMS"
  },
  unemployment: {
    label: "US unemployment",
    unit: "percent",
    fredId: "UNRATE"
  },
  inflation: {
    label: "US inflation",
    unit: "CPI year-over-year, percent",
    fredId: "CPIAUCSL"
  },
  treasury10y: {
    label: "10Y Treasury yield",
    unit: "percent",
    fredId: "DGS10"
  }
};
function rangeStartMs(range) {
  const now = Date.now();
  const day = 864e5;
  switch (range) {
    case "1d":
      return now - 14 * day;
    case "1w":
      return now - 35 * day;
    case "1m":
      return now - 90 * day;
    case "6m":
      return now - 240 * day;
    case "1y":
      return now - 500 * day;
    case "5y":
      return now - 6 * 365 * day;
    case "max":
      return now - 20 * 365 * day;
  }
}
function parseFredCsv(csv) {
  const rows = csv.trim().split(/\r?\n/).slice(1);
  const out = [];
  for (const row of rows) {
    const [date, rawValue] = row.split(",");
    const value = Number(rawValue);
    const ms = Date.parse(`${date}T13:30:00Z`);
    if (!Number.isFinite(value) || !Number.isFinite(ms)) continue;
    out.push({ time: Math.floor(ms / 1e3), value });
  }
  return out;
}
function monthlyChanges(points) {
  const out = [];
  for (let i = 1; i < points.length; i++) {
    out.push({ time: points[i].time, value: Math.round((points[i].value - points[i - 1].value) * 10) / 10 });
  }
  return out;
}
function yearOverYearPercent(points) {
  const out = [];
  for (let i = 12; i < points.length; i++) {
    const prev = points[i - 12].value;
    if (prev === 0) continue;
    out.push({
      time: points[i].time,
      value: Math.round((points[i].value - prev) / prev * 1e4) / 100
    });
  }
  return out;
}
function fallbackSeries(key, range) {
  const chart = sampleChart(key === "vix" ? "VIX" : key === "oil" ? "USO" : "SPY", range);
  const base = key === "jobs" ? 175 : key === "unemployment" ? 4.1 : key === "inflation" ? 3.2 : key === "treasury10y" ? 4.1 : key === "oil" ? 78 : 18;
  const label = key === "jobs" ? "US job growth" : key === "unemployment" ? "US unemployment" : key === "inflation" ? "US inflation" : key === "treasury10y" ? "10Y Treasury yield" : key === "oil" ? "WTI crude oil" : "VIX volatility";
  const unit = key === "jobs" ? "monthly payroll change, thousands" : key === "oil" ? "USD/barrel" : key === "vix" ? "index" : "percent";
  return {
    key,
    label,
    unit,
    sourceName: "Sample Data",
    source: "sample",
    points: chart.candles.filter((_, i) => i % Math.max(1, Math.floor(chart.candles.length / 60)) === 0).map((c, i) => ({
      time: c.time,
      value: Math.round(
        (base + Math.sin(i / 4) * (key === "jobs" ? 70 : key === "vix" ? 4 : key === "oil" ? 8 : 0.25)) * 100
      ) / 100
    }))
  };
}
async function getFredOverlay(key, range) {
  const spec = SPECS[key];
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(spec.fredId)}`;
  const csv = await fetchText(url, { ttlMs: FRED_TTL_MS, timeoutMs: 12e3 });
  const startSec = Math.floor(rangeStartMs(range) / 1e3);
  const parsed = parseFredCsv(csv);
  const points = key === "jobs" ? monthlyChanges(parsed) : key === "inflation" ? yearOverYearPercent(parsed) : parsed.map((p) => ({ time: p.time, value: p.value }));
  return {
    key,
    label: spec.label,
    unit: spec.unit,
    sourceName: "FRED",
    source: "live",
    points: points.filter((p) => p.time >= startSec)
  };
}
function yahooRangeFor(range) {
  const yahooRange = range === "1w" ? "5d" : range === "1m" ? "1mo" : range === "max" ? "10y" : range;
  const interval = range === "1d" ? "5m" : range === "1w" ? "15m" : range === "1m" ? "60m" : "1d";
  return { yahooRange, interval };
}
async function getYahooOverlay(key, range) {
  const { yahooRange, interval } = yahooRangeFor(range);
  const result = await fetchYahooChart(key === "vix" ? "^VIX" : "CL=F", yahooRange, interval, MARKET_TTL_MS);
  const quote = result.indicators?.quote?.[0];
  const timestamps = result.timestamp ?? [];
  const closes = quote?.close ?? [];
  const points = [];
  for (let i = 0; i < timestamps.length; i++) {
    const time = timestamps[i];
    const value = closes[i];
    if (typeof time === "number" && typeof value === "number" && Number.isFinite(value)) {
      points.push({ time: Math.floor(time), value: Math.round(value * 100) / 100 });
    }
  }
  if (points.length === 0) throw new Error(`${key} overlay returned no points`);
  return {
    key,
    label: key === "vix" ? "VIX volatility" : "WTI crude oil",
    unit: key === "vix" ? "index" : "USD/barrel",
    sourceName: "Yahoo Finance",
    source: "live",
    points
  };
}
async function getMacroOverlay(key, range) {
  try {
    if (key === "vix" || key === "oil") return await getYahooOverlay(key, range);
    return await getFredOverlay(key, range);
  } catch {
    return fallbackSeries(key, range);
  }
}

// src/main/services/insightStore.ts
var import_electron2 = require("electron");
var import_node_fs3 = __toESM(require("node:fs"));
var import_node_path3 = __toESM(require("node:path"));
var MAX_RECORDS = 200;
function storePath2() {
  return import_node_path3.default.join(import_electron2.app.getPath("userData"), "quant-insights.json");
}
function readAll() {
  try {
    const raw = import_node_fs3.default.readFileSync(storePath2(), "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecord);
  } catch {
    return [];
  }
}
function writeAll(records) {
  const file = storePath2();
  import_node_fs3.default.mkdirSync(import_node_path3.default.dirname(file), { recursive: true });
  import_node_fs3.default.writeFileSync(file, JSON.stringify(records.slice(0, MAX_RECORDS), null, 2));
}
function isRecord(value) {
  if (!value || typeof value !== "object") return false;
  const r = value;
  return typeof r.id === "string" && typeof r.symbol === "string" && typeof r.range === "string" && typeof r.answer === "string" && typeof r.generatedAt === "string";
}
function saveQuantInsight(request, response) {
  const record = {
    ...response,
    id: `${request.symbol}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    symbol: request.symbol,
    range: request.range,
    question: request.question,
    decision: request.evaluation.decision,
    setupType: request.evaluation.setupType,
    confidence: request.evaluation.confidence
  };
  const records = [record, ...readAll()].slice(0, MAX_RECORDS);
  writeAll(records);
  return record;
}
function getQuantInsights(symbol, range) {
  const normalized = symbol.toUpperCase();
  return readAll().filter((record) => record.symbol === normalized && (!range || record.range === range)).slice(0, 20);
}

// src/main/services/rss.ts
var import_fast_xml_parser = __toESM(require_fxp());
var parser = new import_fast_xml_parser.XMLParser({
  ignoreAttributes: false,
  isArray: (name) => name === "item",
  parseTagValue: false,
  trimValues: true
});
function textOf(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const text = value["#text"];
    if (typeof text === "string") return text.trim();
    if (typeof text === "number") return String(text);
  }
  return "";
}
function parseRssItems(xml) {
  let doc;
  try {
    doc = parser.parse(xml);
  } catch {
    return [];
  }
  const channel = doc.rss?.channel;
  const rawItems = channel?.item;
  if (!Array.isArray(rawItems)) return [];
  const out = [];
  for (const raw of rawItems) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw;
    const title = textOf(item.title);
    const link = textOf(item.link);
    if (!title || !link) continue;
    const pubDate = textOf(item.pubDate);
    const description = textOf(item.description);
    const sourceName = textOf(item.source);
    out.push({
      title,
      link,
      pubDate: pubDate || void 0,
      description: description || void 0,
      sourceName: sourceName || void 0
    });
  }
  return out;
}

// src/main/services/googleNews.ts
function cleanTitle(title, publisher) {
  const idx = title.lastIndexOf(" - ");
  if (idx <= 0) return title;
  const suffix = title.slice(idx + 3).trim();
  if (publisher && suffix.toLowerCase() === publisher.toLowerCase()) {
    return title.slice(0, idx).trim();
  }
  if (!publisher && suffix.length <= 40 && !suffix.includes(" - ")) {
    return title.slice(0, idx).trim();
  }
  return title;
}
async function searchGoogleNews(symbol, afterYmd, beforeYmd, ttlMs) {
  const query = `${symbol} stock after:${afterYmd} before:${beforeYmd}`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const xml = await fetchText(url, { ttlMs });
  const items2 = parseRssItems(xml);
  const out = [];
  for (const item of items2) {
    const publishedMs = parseDateMs(item.pubDate);
    if (publishedMs === null) continue;
    const publisher = item.sourceName;
    out.push({
      id: `g-${hashId(`${item.link}|${item.title}`)}`,
      title: cleanTitle(item.title, publisher),
      url: item.link,
      sourceName: publisher || "Google News",
      publishedAt: new Date(publishedMs).toISOString(),
      relatedSymbol: symbol
    });
  }
  return out;
}
async function searchKoreanFinanceNews(symbol, ttlMs, afterYmd, beforeYmd) {
  const dateClause = afterYmd && beforeYmd ? ` after:${afterYmd} before:${beforeYmd}` : "";
  const query = `site:finance.naver.com ${symbol} \uC8FC\uC2DD OR \uC99D\uAD8C${dateClause}`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
  const xml = await fetchText(url, { ttlMs });
  const items2 = parseRssItems(xml);
  const out = [];
  for (const item of items2) {
    const publishedMs = parseDateMs(item.pubDate);
    if (publishedMs === null) continue;
    const publisher = item.sourceName;
    out.push({
      id: `kr-${hashId(`${item.link}|${item.title}`)}`,
      title: cleanTitle(item.title, publisher),
      url: item.link,
      sourceName: publisher ? `KR \xB7 ${publisher}` : "KR \xB7 Naver Finance",
      publishedAt: new Date(publishedMs).toISOString(),
      relatedSymbol: symbol
    });
  }
  return out;
}

// src/main/services/news.ts
var FEED_TTL_MS = 10 * 6e4;
var MAX_SYMBOLS = 40;
var MAX_TOTAL = 100;
var limit2 = pLimit(4);
async function fetchSymbolFeed(symbol) {
  const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(symbol)}&region=US&lang=en-US`;
  const xml = await fetchText(url, { ttlMs: FEED_TTL_MS });
  const items2 = parseRssItems(xml);
  const out = [];
  for (const item of items2) {
    const publishedMs = parseDateMs(item.pubDate);
    const summary = item.description ? stripHtml(item.description).slice(0, 300) : void 0;
    out.push({
      id: `y-${hashId(`${item.link}|${item.title}`)}`,
      title: item.title,
      url: item.link,
      sourceName: item.sourceName || "Yahoo Finance",
      publishedAt: new Date(publishedMs ?? Date.now()).toISOString(),
      relatedSymbol: symbol,
      summary: summary && summary !== item.title ? summary : void 0
    });
  }
  return out;
}
async function getNews(symbols, limitPerSymbol = 6) {
  const requested = symbols.slice(0, MAX_SYMBOLS);
  if (requested.length === 0) return [];
  const perSymbol = await Promise.all(
    requested.map(
      (symbol) => limit2(async () => {
        const [yahoo, korean] = await Promise.all([
          fetchSymbolFeed(symbol).catch(() => []),
          searchKoreanFinanceNews(symbol, FEED_TTL_MS).catch(() => [])
        ]);
        return [...yahoo.slice(0, limitPerSymbol), ...korean.slice(0, 2)];
      }).catch(() => null)
    )
  );
  const allFailed = perSymbol.every((r) => r === null);
  if (allFailed) return sampleNews(requested);
  const seenTitles = /* @__PURE__ */ new Set();
  const merged = [];
  for (const feed of perSymbol) {
    if (!feed) continue;
    for (const item of feed.slice(0, limitPerSymbol + 2)) {
      const key = normalizeTitle(item.title);
      if (!key || seenTitles.has(key)) continue;
      seenTitles.add(key);
      merged.push(item);
    }
  }
  merged.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return merged.slice(0, MAX_TOTAL);
}

// src/main/services/pivotNews.ts
var WINDOW_DAYS2 = 5;
var DAY_MS = 864e5;
var GOOGLE_TTL_MS = 30 * 6e4;
var MAX_ITEMS_PER_PIVOT = 4;
var MAX_PIVOTS = 12;
var limit3 = pLimit(3);
async function newsForPivot(symbol, pivot, yahooItems) {
  const pivotMs = pivot.time * 1e3;
  const startMs = pivotMs - WINDOW_DAYS2 * DAY_MS;
  let endMs = pivotMs + WINDOW_DAYS2 * DAY_MS;
  const nowMs = Date.now();
  if (endMs > nowMs) endMs = nowMs;
  const afterYmd = toYmd(new Date(Math.min(startMs, endMs - DAY_MS)));
  const beforeYmd = toYmd(new Date(endMs));
  const [google, korean] = await Promise.all([
    searchGoogleNews(symbol, afterYmd, beforeYmd, GOOGLE_TTL_MS).catch(() => []),
    searchKoreanFinanceNews(symbol, GOOGLE_TTL_MS, afterYmd, beforeYmd).catch(
      () => []
    )
  ]);
  const inWindow = (item) => {
    const ms = Date.parse(item.publishedAt);
    return !Number.isNaN(ms) && ms >= startMs - DAY_MS && ms <= endMs + DAY_MS;
  };
  const merged = [];
  const seen = /* @__PURE__ */ new Set();
  for (const item of [...google, ...korean, ...yahooItems.filter(inWindow)]) {
    const key = normalizeTitle(item.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  merged.sort(
    (a, b) => Math.abs(Date.parse(a.publishedAt) - pivotMs) - Math.abs(Date.parse(b.publishedAt) - pivotMs)
  );
  return merged.slice(0, MAX_ITEMS_PER_PIVOT);
}
async function getPivotNews(symbol, pivots) {
  const bounded = pivots.slice(0, MAX_PIVOTS);
  if (bounded.length === 0) return [];
  const yahooItems = await fetchSymbolFeed(symbol).catch(() => []);
  const results = await Promise.all(
    bounded.map(
      (pivot) => limit3(() => newsForPivot(symbol, pivot, yahooItems)).catch(() => []).then((items2) => ({ pivot, items: items2 }))
    )
  );
  return results;
}

// src/main/services/quantAi.ts
async function isReady(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}
function compactRequest(req) {
  const e = req.evaluation;
  const news = req.news.slice(0, 8).map((item) => `- [${item.relatedSymbol}] ${item.title} (${item.sourceName}, ${item.publishedAt})`).join("\n");
  const components = e.components.map((c) => `- ${c.name}: ${c.status}, ${c.score >= 0 ? "+" : ""}${c.score}. ${c.explanation}`).join("\n");
  const earnings = req.earnings ? `- Upcoming date: ${req.earnings.date} ${req.earnings.time}
- Analyst expected EPS: ${req.earnings.epsEstimate ?? "n/a"}
- Latest actual EPS: ${req.earnings.epsActual ?? "n/a"}
- Latest surprise: ${req.earnings.epsSurprisePercent ?? "n/a"}%
- Latest reported date: ${req.earnings.latestReportedDate ?? "n/a"}` : "- none";
  const valuation = req.valuation ? `- Price: ${req.valuation.price ?? "n/a"}
- Market cap: ${req.valuation.marketCap ?? "n/a"}
- Revenue: ${req.valuation.totalRevenue ?? "n/a"}
- Gross profit: ${req.valuation.grossProfit ?? "n/a"}
- EBITDA: ${req.valuation.ebitda ?? "n/a"}
- Net income: ${req.valuation.netIncomeToCommon ?? "n/a"}
- Profit margin: ${req.valuation.profitMargin ?? "n/a"}
- Revenue growth: ${req.valuation.revenueGrowth ?? "n/a"}
- P/E: ${req.valuation.trailingPe ?? "n/a"}
- Forward P/E: ${req.valuation.forwardPe ?? "n/a"}
- P/S: ${req.valuation.priceToSales ?? "n/a"}
- EV/Revenue: ${req.valuation.enterpriseToRevenue ?? "n/a"}
- EV/EBITDA: ${req.valuation.enterpriseToEbitda ?? "n/a"}
- Formula estimates:
${req.valuation.estimates.map((x) => `  - ${x.label}: fair value ${x.fairValue ?? "n/a"}, upside ${x.upsidePercent ?? "n/a"}%, formula: ${x.formula}`).join("\n")}` : "- none";
  const macro = req.macroOverlays?.length ? req.macroOverlays.map((series) => {
    const last = series.points[series.points.length - 1];
    return `- ${series.label}: ${last ? `${last.value} ${series.unit}` : "n/a"} (${series.sourceName})`;
  }).join("\n") : "- no active macro overlays";
  return `
Symbol: ${req.symbol}
Range: ${req.range}
Question: ${req.question ?? "Analyze the current setup and explain the best decision."}
Snapshot captured: ${req.snapshotDataUrl ? "yes" : "no"}

Signal:
- Decision: ${e.decision}
- Setup: ${e.setupType}
- Regime: ${e.regime}
- Confidence: ${e.confidence}/100
- Reason: ${e.reason}
- No-trade reasons: ${e.noTradeReasons.join("; ") || "none"}

Risk plan:
- Direction: ${e.risk.direction}
- Entry: ${e.risk.entry}
- Stop: ${e.risk.stop}
- Target 1: ${e.risk.target1}
- Target 2: ${e.risk.target2}
- R/R target 1: ${e.risk.rewardRisk1}
- Position size: ${e.risk.positionSize}
- Max loss: ${e.risk.maxDollarLoss}

Analytics:
- Last close: ${e.analytics.lastClose}
- Change: ${e.analytics.changePercent}%
- SMA20: ${e.analytics.sma20 ?? "n/a"}
- SMA50: ${e.analytics.sma50 ?? "n/a"}
- ATR14: ${e.analytics.atr14 ?? "n/a"} (${e.analytics.atrPercent ?? "n/a"}%)
- Volume ratio: ${e.analytics.volumeRatio ?? "n/a"}
- Support: ${e.analytics.support ?? "n/a"}
- Resistance: ${e.analytics.resistance ?? "n/a"}

Backtest summary:
- Strategy: ${e.backtest.strategyName} ${e.backtest.strategyVersion}
- Trades: ${e.backtest.totalTrades}
- Win rate: ${e.backtest.winRate}%
- Expectancy: ${e.backtest.expectancy}R
- Profit factor: ${e.backtest.profitFactor}
- Max drawdown: ${e.backtest.maxDrawdown}R

Components:
${components}

Earnings context:
${earnings}

Valuation context:
${valuation}

Macro overlays active on chart:
${macro}

Recent scraped news:
${news || "- none"}
`.trim();
}
function deterministicFallback(req, error) {
  const e = req.evaluation;
  const lines = [
    `### Quant memo: ${e.decision.replaceAll("-", " ")}`,
    ``,
    `- **Setup:** ${e.setupType.replaceAll("-", " ")}`,
    `- **Regime:** ${e.regime.replaceAll("-", " ")}`,
    `- **Confidence:** ${e.confidence}/100`,
    `- **Risk plan:** entry \`${e.risk.entry}\`, stop \`${e.risk.stop}\`, target 1 \`${e.risk.target1}\`, target 2 \`${e.risk.target2}\``,
    `- **Position:** ${e.risk.positionSize} units, max loss \`${e.risk.maxDollarLoss}\`, target 1 reward \`${e.risk.rewardRisk1}R\``
  ];
  if (e.noTradeReasons.length) {
    lines.push(`- **Primary blocker:** ${e.noTradeReasons[0]}`);
  } else {
    lines.push(`- **Action:** ${e.reason}`);
  }
  const strongest = [...e.components].sort((a, b) => b.score - a.score)[0];
  const weakest = [...e.components].sort((a, b) => a.score - b.score)[0];
  if (strongest) lines.push(`- **Best evidence:** ${strongest.name} - ${strongest.explanation}`);
  if (weakest && weakest.score < 0) lines.push(`- **Risk evidence:** ${weakest.name} - ${weakest.explanation}`);
  if (error) lines.push(`
_Local LLM note: ${error}_`);
  return {
    ok: false,
    source: "deterministic-fallback",
    answer: lines.join("\n"),
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    error
  };
}
async function analyzeQuant(req) {
  const settings = getLlmSettings();
  if (!settings.enabled) {
    return deterministicFallback(
      req,
      "Local LLM is disabled. Enable it in onboarding or set QUANT_LLM_ENABLED=1 and QUANT_LLM_BASE_URL to use an OpenAI-compatible local server."
    );
  }
  try {
    if (!await isReady(settings.baseUrl)) {
      return deterministicFallback(req, "Local LLM server is not ready.");
    }
    const prompt = compactRequest(req);
    const res = await fetch(`${settings.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(28e3),
      body: JSON.stringify({
        model: settings.model,
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content: "You are QuantDesk, a strict personal quant trading assistant for the Quant app. Think like a senior quant trader and risk manager. Explain signals in disciplined trading language. Separate setup, evidence, invalidation, risk, and action. Do not give certainty, do not hype, do not recommend oversized trades, and do not ignore no-trade blockers. Return concise GitHub-flavored Markdown with headings, bullets, bold labels, and inline code for exact prices."
          },
          {
            role: "user",
            content: req.thinkingMode ? `Use thinking mode internally, then provide only the concise final decision memo.

${prompt}` : prompt
          }
        ]
      })
    });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const json = await res.json();
    const answer = json.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error("LLM returned an empty answer");
    return {
      ok: true,
      source: "local-llm",
      model: settings.model,
      answer,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Local LLM request failed.";
    return deterministicFallback(req, message);
  }
}

// src/main/services/quotes.ts
var QUOTE_TTL_MS = 45e3;
var limit4 = pLimit(4);
async function fetchQuote(symbol) {
  const result = await fetchYahooChart(symbol, "1d", "5m", QUOTE_TTL_MS);
  const meta = result.meta ?? {};
  const price = typeof meta.regularMarketPrice === "number" && Number.isFinite(meta.regularMarketPrice) ? meta.regularMarketPrice : null;
  const prevRaw = meta.chartPreviousClose ?? meta.previousClose;
  const previousClose = typeof prevRaw === "number" && Number.isFinite(prevRaw) ? prevRaw : null;
  let change = null;
  let changePercent = null;
  if (price !== null && previousClose !== null) {
    change = round2(price - previousClose);
    changePercent = previousClose !== 0 ? round2(change / previousClose * 100) : null;
  }
  return {
    symbol,
    price,
    change,
    changePercent,
    previousClose,
    currency: typeof meta.currency === "string" && meta.currency ? meta.currency : "USD",
    marketState: typeof meta.marketState === "string" && meta.marketState ? meta.marketState : void 0,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: "live"
  };
}
async function getQuotes(symbols) {
  return Promise.all(
    symbols.map(
      (symbol) => limit4(() => fetchQuote(symbol)).catch(() => sampleQuote(symbol))
    )
  );
}

// src/main/services/valuation.ts
var TTL_MS = 6 * 60 * 6e4;
var cache3 = new TtlCache(300);
function round(value, digits = 2) {
  if (value === null || !Number.isFinite(value)) return null;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
function pct(fairValue, price) {
  if (fairValue === null || price === null || price === 0) return null;
  return round((fairValue - price) / price * 100, 1);
}
function estimate(label, fairValue, price, formula) {
  return {
    label,
    fairValue: round(fairValue),
    upsidePercent: pct(fairValue, price),
    formula
  };
}
function sampleValuation(symbol) {
  const sym = symbol.toUpperCase();
  const price = basePriceFor(sym);
  const revenue = price * 1e9;
  const margin = 0.18;
  const shares = 1e9;
  const netIncome = revenue * margin;
  const fairEarnings = netIncome * 24 / shares;
  const fairSales = revenue * 5 / shares;
  return {
    symbol: sym,
    companyName: lookupName(sym) ?? sym,
    price,
    marketCap: price * shares,
    enterpriseValue: price * shares * 1.05,
    totalRevenue: revenue,
    grossProfit: revenue * 0.52,
    ebitda: revenue * 0.25,
    netIncomeToCommon: netIncome,
    profitMargin: margin,
    revenueGrowth: 0.08,
    trailingPe: 24,
    forwardPe: 21,
    priceToSales: 5,
    priceToBook: 7,
    enterpriseToRevenue: 5.2,
    enterpriseToEbitda: 18,
    forwardEps: price / 21,
    targetMeanPrice: price * 1.08,
    sharesOutstanding: shares,
    estimates: [
      estimate("Forward earnings value", fairEarnings, price, "net income x 24 P/E / shares outstanding"),
      estimate("Sales multiple value", fairSales, price, "revenue x 5 P/S / shares outstanding"),
      estimate("Analyst target value", price * 1.08, price, "Yahoo analyst mean target price")
    ],
    source: "sample"
  };
}
async function getValuation(symbol) {
  const sym = symbol.toUpperCase();
  const cached = cache3.get(sym);
  if (cached) return cached;
  try {
    const summary = await quoteSummary(sym, [
      "price",
      "summaryDetail",
      "defaultKeyStatistics",
      "financialData"
    ]);
    const price = rawNumber(summary.price?.regularMarketPrice) ?? rawNumber(summary.financialData?.targetMeanPrice) ?? null;
    const marketCap = rawNumber(summary.price?.marketCap);
    const shares = rawNumber(summary.defaultKeyStatistics?.sharesOutstanding);
    const revenue = rawNumber(summary.financialData?.totalRevenue);
    const netIncome = rawNumber(summary.financialData?.netIncomeToCommon);
    const priceToSales = rawNumber(summary.summaryDetail?.priceToSalesTrailing12Months);
    const trailingPe = rawNumber(summary.summaryDetail?.trailingPE);
    const targetMean = rawNumber(summary.financialData?.targetMeanPrice);
    const fairForwardEarnings = netIncome !== null && shares !== null && trailingPe !== null && shares > 0 ? netIncome * trailingPe / shares : null;
    const fairSales = revenue !== null && shares !== null && priceToSales !== null && shares > 0 ? revenue * priceToSales / shares : null;
    const snapshot = {
      symbol: sym,
      companyName: summary.price?.longName || summary.price?.shortName || lookupName(sym) || sym,
      price: round(price),
      marketCap: round(marketCap, 0),
      enterpriseValue: round(rawNumber(summary.defaultKeyStatistics?.enterpriseValue), 0),
      totalRevenue: round(revenue, 0),
      grossProfit: round(rawNumber(summary.financialData?.grossProfits), 0),
      ebitda: round(rawNumber(summary.financialData?.ebitda), 0),
      netIncomeToCommon: round(netIncome, 0),
      profitMargin: round(rawNumber(summary.financialData?.profitMargins), 4),
      revenueGrowth: round(rawNumber(summary.financialData?.revenueGrowth), 4),
      trailingPe: round(trailingPe),
      forwardPe: round(rawNumber(summary.summaryDetail?.forwardPE)),
      priceToSales: round(priceToSales),
      priceToBook: round(rawNumber(summary.summaryDetail?.priceToBook)),
      enterpriseToRevenue: round(rawNumber(summary.defaultKeyStatistics?.enterpriseToRevenue)),
      enterpriseToEbitda: round(rawNumber(summary.defaultKeyStatistics?.enterpriseToEbitda)),
      forwardEps: round(rawNumber(summary.defaultKeyStatistics?.forwardEps)),
      targetMeanPrice: round(targetMean),
      sharesOutstanding: round(shares, 0),
      estimates: [
        estimate("Forward earnings value", fairForwardEarnings, price, "net income x trailing P/E / shares outstanding"),
        estimate("Sales multiple value", fairSales, price, "revenue x trailing P/S / shares outstanding"),
        estimate("Analyst target value", targetMean, price, "Yahoo analyst mean target price")
      ],
      source: "live"
    };
    cache3.set(sym, snapshot, TTL_MS);
    return snapshot;
  } catch {
    const sample = sampleValuation(sym);
    cache3.set(sym, sample, 10 * 6e4);
    return sample;
  }
}

// src/main/services/symbols.ts
var MAX_RESULTS = 8;
function mapQuoteType(quoteType) {
  const t = (quoteType ?? "").toUpperCase();
  if (t === "ETF") return "etf";
  if (t === "EQUITY") return "stock";
  return null;
}
function searchDirectory(query) {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const qLower = query.trim().toLowerCase();
  const dir = getSymbolDirectory();
  const scored = dir.map((entry) => {
    let score = -1;
    if (entry.symbol === q) score = 3;
    else if (entry.symbol.startsWith(q)) score = 2;
    else if (entry.name.toLowerCase().includes(qLower)) score = 1;
    return { entry, score };
  }).filter((s) => s.score > 0).sort((a, b) => b.score - a.score || a.entry.symbol.localeCompare(b.entry.symbol));
  return scored.slice(0, MAX_RESULTS).map(({ entry }) => ({
    symbol: entry.symbol,
    name: entry.name,
    type: entry.type,
    exchange: entry.exchange
  }));
}
async function searchSymbols(query) {
  const q = query.trim().slice(0, 48);
  if (!q) return [];
  try {
    const quotes = await searchYahoo(q);
    const out = [];
    for (const quote of quotes) {
      const type = mapQuoteType(quote.quoteType);
      if (!type) continue;
      const symbol = typeof quote.symbol === "string" ? quote.symbol.toUpperCase() : "";
      if (!symbol || out.some((s) => s.symbol === symbol)) continue;
      out.push({
        symbol,
        name: quote.longname || quote.shortname || symbol,
        type,
        exchange: quote.exchDisp || void 0
      });
      if (out.length >= MAX_RESULTS) break;
    }
    return out.length > 0 ? out : searchDirectory(q);
  } catch {
    return searchDirectory(q);
  }
}

// src/main/services/watchlistStore.ts
var import_electron3 = require("electron");
var import_node_fs4 = __toESM(require("node:fs"));
var import_node_path4 = __toESM(require("node:path"));
var SEED = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", type: "etf" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", type: "etf" },
  { symbol: "SMH", name: "VanEck Semiconductor ETF", type: "etf" },
  { symbol: "AAPL", name: "Apple Inc.", type: "stock" },
  { symbol: "NVDA", name: "NVIDIA Corporation", type: "stock" },
  { symbol: "TSLA", name: "Tesla, Inc.", type: "stock" }
];
var items = null;
function storePath3() {
  return import_node_path4.default.join(import_electron3.app.getPath("userData"), "watchlist.json");
}
function seedItems() {
  const addedAt = (/* @__PURE__ */ new Date()).toISOString();
  return SEED.map((s) => ({ ...s, addedAt }));
}
function isValidItem(value) {
  if (!value || typeof value !== "object") return false;
  const item = value;
  return typeof item.symbol === "string" && normalizeSymbol(item.symbol) !== null && typeof item.name === "string" && item.name.length > 0 && (item.type === "etf" || item.type === "stock") && typeof item.addedAt === "string";
}
function save(list) {
  try {
    const file = storePath3();
    import_node_fs4.default.mkdirSync(import_node_path4.default.dirname(file), { recursive: true });
    import_node_fs4.default.writeFileSync(file, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.error("[watchlist] failed to persist:", err);
  }
}
function load() {
  if (items) return items;
  try {
    const raw = import_node_fs4.default.readFileSync(storePath3(), "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const valid = parsed.filter(isValidItem).map((item) => ({
        ...item,
        symbol: item.symbol.toUpperCase()
      }));
      if (valid.length > 0 || parsed.length === 0) {
        items = valid;
        return items;
      }
    }
    throw new Error("unrecognized watchlist file shape");
  } catch (err) {
    const code = err.code;
    if (code !== "ENOENT") console.error("[watchlist] reseeding after load error:", err);
    items = seedItems();
    save(items);
    return items;
  }
}
function getWatchlist() {
  return [...load()];
}
function removeFromWatchlist(symbol) {
  const sym = symbol.toUpperCase();
  const list = load().filter((item) => item.symbol !== sym);
  items = list;
  save(list);
  return [...list];
}
async function resolveSymbol(symbol) {
  try {
    const suggestions = await searchSymbols(symbol);
    const exact = suggestions.find((s) => s.symbol.toUpperCase() === symbol);
    if (exact) return { name: exact.name, type: exact.type };
  } catch {
  }
  const entry = directoryLookup(symbol);
  if (entry) return { name: entry.name, type: entry.type };
  return null;
}
async function addToWatchlist(rawSymbol) {
  const symbol = normalizeSymbol(rawSymbol);
  if (!symbol) return { ok: false, error: "Invalid symbol" };
  const list = load();
  if (list.some((item2) => item2.symbol === symbol)) {
    return { ok: false, error: "Already in watchlist" };
  }
  const resolved = await resolveSymbol(symbol);
  if (!resolved) return { ok: false, error: "Symbol not found" };
  const item = {
    symbol,
    name: resolved.name,
    type: resolved.type,
    addedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const next = [...list, item];
  items = next;
  save(next);
  return { ok: true, item, watchlist: [...next] };
}

// src/main/main.ts
var MAX_QUOTE_SYMBOLS = 60;
var MAX_NEWS_SYMBOLS = 40;
var MAX_EARNINGS_SYMBOLS = 60;
var MAX_PIVOTS2 = 12;
var isSmoke = process.argv.includes("--smoke");
var forceOnboarding = process.argv.includes("--onboarding") || process.argv.includes("--smoke-onboarding");
var smokeModalArg = process.argv.find((arg) => arg.startsWith("--smoke-modal="));
var smokeModalSymbol = smokeModalArg ? normalizeSymbol(smokeModalArg.slice("--smoke-modal=".length)) : null;
function cleanPivots(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const p = entry;
    if (typeof p.time !== "number" || !Number.isFinite(p.time)) continue;
    if (typeof p.price !== "number" || !Number.isFinite(p.price)) continue;
    if (p.kind !== "high" && p.kind !== "low") continue;
    out.push({ time: p.time, price: p.price, kind: p.kind });
    if (out.length >= MAX_PIVOTS2) break;
  }
  return out;
}
function cleanRange(raw) {
  return CHART_RANGES.includes(raw) ? raw : "6m";
}
function cleanMacroOverlayKey(raw) {
  return raw === "jobs" || raw === "unemployment" || raw === "inflation" || raw === "treasury10y" || raw === "oil" || raw === "vix" ? raw : "jobs";
}
function cleanQuantInsightRequest(raw) {
  if (!raw || typeof raw !== "object") return null;
  const r = raw;
  const symbol = normalizeSymbol(r.symbol);
  if (!symbol) return null;
  if (!r.evaluation || typeof r.evaluation !== "object") return null;
  return {
    symbol,
    range: cleanRange(r.range),
    evaluation: r.evaluation,
    news: Array.isArray(r.news) ? r.news.slice(0, 12) : [],
    earnings: r.earnings && typeof r.earnings === "object" ? r.earnings : null,
    valuation: r.valuation && typeof r.valuation === "object" ? r.valuation : null,
    macroOverlays: Array.isArray(r.macroOverlays) ? r.macroOverlays.slice(0, 8).map((series) => ({
      ...series,
      points: Array.isArray(series.points) ? series.points.slice(-60) : []
    })) : [],
    snapshotDataUrl: typeof r.snapshotDataUrl === "string" ? r.snapshotDataUrl.slice(0, 1e6) : void 0,
    question: typeof r.question === "string" ? r.question.slice(0, 1200) : void 0,
    thinkingMode: r.thinkingMode === true
  };
}
function registerIpcHandlers() {
  import_electron4.ipcMain.handle(IPC.watchlistGet, () => {
    try {
      return getWatchlist();
    } catch {
      return [];
    }
  });
  import_electron4.ipcMain.handle(IPC.watchlistAdd, async (_e, rawSymbol) => {
    try {
      if (typeof rawSymbol !== "string") return { ok: false, error: "Invalid symbol" };
      return await addToWatchlist(rawSymbol);
    } catch {
      return { ok: false, error: "Could not add symbol" };
    }
  });
  import_electron4.ipcMain.handle(IPC.watchlistRemove, (_e, rawSymbol) => {
    try {
      const symbol = normalizeSymbol(rawSymbol);
      return symbol ? removeFromWatchlist(symbol) : getWatchlist();
    } catch {
      return [];
    }
  });
  import_electron4.ipcMain.handle(IPC.symbolsSearch, async (_e, rawQuery) => {
    try {
      if (typeof rawQuery !== "string") return [];
      return await searchSymbols(rawQuery);
    } catch {
      return [];
    }
  });
  import_electron4.ipcMain.handle(IPC.quotesGet, async (_e, rawSymbols) => {
    const symbols = cleanSymbolList(rawSymbols, MAX_QUOTE_SYMBOLS);
    try {
      return await getQuotes(symbols);
    } catch {
      return symbols.map((s) => sampleQuote(s));
    }
  });
  import_electron4.ipcMain.handle(IPC.holdingsGet, async (_e, rawSymbol) => {
    const symbol = normalizeSymbol(rawSymbol);
    if (!symbol) {
      return { etfSymbol: "", asOf: todayYmd(), holdings: [], source: "sample" };
    }
    try {
      return await getHoldings(symbol);
    } catch {
      return { etfSymbol: symbol, asOf: todayYmd(), holdings: [], source: "sample" };
    }
  });
  import_electron4.ipcMain.handle(IPC.newsGet, async (_e, rawSymbols, rawLimit) => {
    const symbols = cleanSymbolList(rawSymbols, MAX_NEWS_SYMBOLS);
    const limitPerSymbol = clampInt(rawLimit, 1, 20, 6);
    try {
      return await getNews(symbols, limitPerSymbol);
    } catch {
      return sampleNews(symbols);
    }
  });
  import_electron4.ipcMain.handle(IPC.earningsGet, async (_e, rawSymbols) => {
    const symbols = cleanSymbolList(rawSymbols, MAX_EARNINGS_SYMBOLS);
    try {
      return await getEarnings(symbols);
    } catch {
      return symbols.map((s) => sampleEarnings(s));
    }
  });
  import_electron4.ipcMain.handle(IPC.chartGet, async (_e, rawSymbol, rawRange) => {
    const symbol = normalizeSymbol(rawSymbol) ?? "SPY";
    const range = cleanRange(rawRange);
    try {
      return await getChart(symbol, range);
    } catch {
      return sampleChart(symbol, range);
    }
  });
  import_electron4.ipcMain.handle(IPC.pivotNewsGet, async (_e, rawSymbol, rawPivots) => {
    const pivots = cleanPivots(rawPivots);
    const symbol = normalizeSymbol(rawSymbol);
    if (!symbol) return pivots.map((pivot) => ({ pivot, items: [] }));
    try {
      return await getPivotNews(symbol, pivots);
    } catch {
      return pivots.map((pivot) => ({ pivot, items: [] }));
    }
  });
  import_electron4.ipcMain.handle(IPC.macroOverlayGet, async (_e, rawKey, rawRange) => {
    const key = cleanMacroOverlayKey(rawKey);
    const range = cleanRange(rawRange);
    return getMacroOverlay(key, range);
  });
  import_electron4.ipcMain.handle(IPC.chartSnapshotCapture, async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return null;
    try {
      const image = await mainWindow.webContents.capturePage();
      return {
        dataUrl: image.toDataURL(),
        capturedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch {
      return null;
    }
  });
  import_electron4.ipcMain.handle(IPC.quantAnalyze, async (_e, rawRequest) => {
    const request = cleanQuantInsightRequest(rawRequest);
    if (!request) {
      return {
        ok: false,
        source: "deterministic-fallback",
        answer: "Quant analysis could not run because the request payload was invalid.",
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        error: "Invalid request"
      };
    }
    const response = await analyzeQuant(request);
    try {
      saveQuantInsight(request, response);
    } catch (err) {
      console.error("[quant] save insight failed:", err);
    }
    return response;
  });
  import_electron4.ipcMain.handle(IPC.quantInsightsGet, async (_e, rawSymbol, rawRange) => {
    const symbol = normalizeSymbol(rawSymbol);
    if (!symbol) return [];
    return getQuantInsights(symbol, CHART_RANGES.includes(rawRange) ? rawRange : void 0);
  });
  import_electron4.ipcMain.handle(IPC.llmSettingsGet, () => getLlmSettings());
  import_electron4.ipcMain.handle(IPC.llmSettingsSave, (_e, rawSettings) => {
    const s = rawSettings && typeof rawSettings === "object" ? rawSettings : {};
    return saveLlmSettings({
      enabled: s.enabled === true,
      baseUrl: typeof s.baseUrl === "string" ? s.baseUrl : void 0,
      model: typeof s.model === "string" ? s.model : void 0
    });
  });
  import_electron4.ipcMain.handle(IPC.valuationGet, async (_e, rawSymbol) => {
    const symbol = normalizeSymbol(rawSymbol);
    return getValuation(symbol ?? "SPY");
  });
  import_electron4.ipcMain.handle(IPC.openExternal, async (_e, rawUrl) => {
    if (typeof rawUrl !== "string") return;
    let parsed;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
    try {
      await import_electron4.shell.openExternal(parsed.toString());
    } catch (err) {
      console.error("[shell] openExternal failed:", err);
    }
  });
}
function armSmokeMode(win) {
  win.setIgnoreMouseEvents(true);
  win.setFocusable(false);
  win.webContents.on("console-message", (_event, _level, message) => {
    console.log("[renderer] " + message);
  });
  win.webContents.on("render-process-gone", (_event, details) => {
    console.error("[renderer] process gone: " + details.reason);
  });
  win.webContents.on("did-start-navigation", (_event, url, isInPlace, isMainFrame) => {
    if (isMainFrame && !isInPlace) console.log("[smoke] main-frame navigation: " + url);
  });
  const killer = setTimeout(() => {
    console.error("SMOKE_FAIL hard timeout after 45s");
    import_electron4.app.exit(1);
  }, 45e3);
  killer.unref();
  win.webContents.once("did-finish-load", () => {
    const envDelay = Number(process.env.QUANT_SMOKE_DELAY_MS);
    const delayMs = Number.isFinite(envDelay) && envDelay > 0 ? Math.min(envDelay, 4e4) : smokeModalSymbol ? 16e3 : 13e3;
    setTimeout(async () => {
      try {
        const image = await win.webContents.capturePage();
        const outPath = process.env.QUANT_SMOKE_OUT || import_node_path5.default.join(
          import_electron4.app.getAppPath(),
          smokeModalSymbol ? "dist/smoke-modal.png" : "dist/smoke.png"
        );
        import_node_fs5.default.mkdirSync(import_node_path5.default.dirname(outPath), { recursive: true });
        import_node_fs5.default.writeFileSync(outPath, image.toPNG());
        clearTimeout(killer);
        console.log("SMOKE_OK " + outPath);
        import_electron4.app.quit();
      } catch (err) {
        console.error("SMOKE_FAIL", err);
        process.exitCode = 1;
        import_electron4.app.quit();
      }
    }, delayMs);
  });
}
var mainWindow = null;
function createWindow() {
  const win = new import_electron4.BrowserWindow({
    width: 1560,
    height: 940,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: "#0a0e16",
    autoHideMenuBar: true,
    title: "Quant",
    webPreferences: {
      preload: import_node_path5.default.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mainWindow = win;
  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event) => event.preventDefault());
  if (isSmoke) armSmokeMode(win);
  const indexPath = import_node_path5.default.join(__dirname, "../renderer/index.html");
  const query = {};
  if (smokeModalSymbol) query.smokeModal = smokeModalSymbol;
  if (forceOnboarding) query.onboarding = "1";
  if (Object.keys(query).length) {
    void win.loadFile(indexPath, { query });
  } else {
    void win.loadFile(indexPath);
  }
}
var gotLock = import_electron4.app.requestSingleInstanceLock();
if (!gotLock) {
  import_electron4.app.quit();
} else {
  import_electron4.app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  process.on("unhandledRejection", (reason) => {
    console.error("[main] unhandled rejection:", reason);
  });
  import_electron4.app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();
    import_electron4.app.on("activate", () => {
      if (import_electron4.BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
  import_electron4.app.on("window-all-closed", () => {
    import_electron4.app.quit();
  });
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbm9kZV9tb2R1bGVzL2Zhc3QteG1sLXBhcnNlci9zcmMvdXRpbC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvZmFzdC14bWwtcGFyc2VyL3NyYy92YWxpZGF0b3IuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2Zhc3QteG1sLXBhcnNlci9zcmMveG1scGFyc2VyL09wdGlvbnNCdWlsZGVyLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9mYXN0LXhtbC1wYXJzZXIvc3JjL3htbHBhcnNlci94bWxOb2RlLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9mYXN0LXhtbC1wYXJzZXIvc3JjL3htbHBhcnNlci9Eb2NUeXBlUmVhZGVyLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9zdHJudW0vc3RybnVtLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9mYXN0LXhtbC1wYXJzZXIvc3JjL2lnbm9yZUF0dHJpYnV0ZXMuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2Zhc3QteG1sLXBhcnNlci9zcmMveG1scGFyc2VyL09yZGVyZWRPYmpQYXJzZXIuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2Zhc3QteG1sLXBhcnNlci9zcmMveG1scGFyc2VyL25vZGUyanNvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvZmFzdC14bWwtcGFyc2VyL3NyYy94bWxwYXJzZXIvWE1MUGFyc2VyLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9mYXN0LXhtbC1wYXJzZXIvc3JjL3htbGJ1aWxkZXIvb3JkZXJlZEpzMlhtbC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvZmFzdC14bWwtcGFyc2VyL3NyYy94bWxidWlsZGVyL2pzb24yeG1sLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9mYXN0LXhtbC1wYXJzZXIvc3JjL2Z4cC5qcyIsICIuLi8uLi9zcmMvbWFpbi9tYWluLnRzIiwgIi4uLy4uL3NyYy9zaGFyZWQvaXBjLnRzIiwgIi4uLy4uL3NyYy9zaGFyZWQvdHlwZXMudHMiLCAiLi4vLi4vc3JjL21haW4vc2VydmljZXMvZGF0YUZpbGVzLnRzIiwgIi4uLy4uL3NyYy9tYWluL3NlcnZpY2VzL3V0aWwudHMiLCAiLi4vLi4vc3JjL21haW4vc2VydmljZXMvc2FtcGxlLnRzIiwgIi4uLy4uL3NyYy9tYWluL3NlcnZpY2VzL2NhY2hlLnRzIiwgIi4uLy4uL3NyYy9tYWluL3NlcnZpY2VzL2h0dHAudHMiLCAiLi4vLi4vc3JjL21haW4vc2VydmljZXMveWFob28udHMiLCAiLi4vLi4vc3JjL21haW4vc2VydmljZXMvY2hhcnQudHMiLCAiLi4vLi4vc3JjL21haW4vc2VydmljZXMvZWFybmluZ3MudHMiLCAiLi4vLi4vc3JjL21haW4vc2VydmljZXMvaG9sZGluZ3MudHMiLCAiLi4vLi4vc3JjL21haW4vc2VydmljZXMvbGxtU2V0dGluZ3MudHMiLCAiLi4vLi4vc3JjL21haW4vc2VydmljZXMvbWFjcm8udHMiLCAiLi4vLi4vc3JjL21haW4vc2VydmljZXMvaW5zaWdodFN0b3JlLnRzIiwgIi4uLy4uL3NyYy9tYWluL3NlcnZpY2VzL3Jzcy50cyIsICIuLi8uLi9zcmMvbWFpbi9zZXJ2aWNlcy9nb29nbGVOZXdzLnRzIiwgIi4uLy4uL3NyYy9tYWluL3NlcnZpY2VzL25ld3MudHMiLCAiLi4vLi4vc3JjL21haW4vc2VydmljZXMvcGl2b3ROZXdzLnRzIiwgIi4uLy4uL3NyYy9tYWluL3NlcnZpY2VzL3F1YW50QWkudHMiLCAiLi4vLi4vc3JjL21haW4vc2VydmljZXMvcXVvdGVzLnRzIiwgIi4uLy4uL3NyYy9tYWluL3NlcnZpY2VzL3ZhbHVhdGlvbi50cyIsICIuLi8uLi9zcmMvbWFpbi9zZXJ2aWNlcy9zeW1ib2xzLnRzIiwgIi4uLy4uL3NyYy9tYWluL3NlcnZpY2VzL3dhdGNobGlzdFN0b3JlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIndXNlIHN0cmljdCc7XG5cbmNvbnN0IG5hbWVTdGFydENoYXIgPSAnOkEtWmEtel9cXFxcdTAwQzAtXFxcXHUwMEQ2XFxcXHUwMEQ4LVxcXFx1MDBGNlxcXFx1MDBGOC1cXFxcdTAyRkZcXFxcdTAzNzAtXFxcXHUwMzdEXFxcXHUwMzdGLVxcXFx1MUZGRlxcXFx1MjAwQy1cXFxcdTIwMERcXFxcdTIwNzAtXFxcXHUyMThGXFxcXHUyQzAwLVxcXFx1MkZFRlxcXFx1MzAwMS1cXFxcdUQ3RkZcXFxcdUY5MDAtXFxcXHVGRENGXFxcXHVGREYwLVxcXFx1RkZGRCc7XG5jb25zdCBuYW1lQ2hhciA9IG5hbWVTdGFydENoYXIgKyAnXFxcXC0uXFxcXGRcXFxcdTAwQjdcXFxcdTAzMDAtXFxcXHUwMzZGXFxcXHUyMDNGLVxcXFx1MjA0MCc7XG5jb25zdCBuYW1lUmVnZXhwID0gJ1snICsgbmFtZVN0YXJ0Q2hhciArICddWycgKyBuYW1lQ2hhciArICddKidcbmNvbnN0IHJlZ2V4TmFtZSA9IG5ldyBSZWdFeHAoJ14nICsgbmFtZVJlZ2V4cCArICckJyk7XG5cbmNvbnN0IGdldEFsbE1hdGNoZXMgPSBmdW5jdGlvbiAoc3RyaW5nLCByZWdleCkge1xuICBjb25zdCBtYXRjaGVzID0gW107XG4gIGxldCBtYXRjaCA9IHJlZ2V4LmV4ZWMoc3RyaW5nKTtcbiAgd2hpbGUgKG1hdGNoKSB7XG4gICAgY29uc3QgYWxsbWF0Y2hlcyA9IFtdO1xuICAgIGFsbG1hdGNoZXMuc3RhcnRJbmRleCA9IHJlZ2V4Lmxhc3RJbmRleCAtIG1hdGNoWzBdLmxlbmd0aDtcbiAgICBjb25zdCBsZW4gPSBtYXRjaC5sZW5ndGg7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGxlbjsgaW5kZXgrKykge1xuICAgICAgYWxsbWF0Y2hlcy5wdXNoKG1hdGNoW2luZGV4XSk7XG4gICAgfVxuICAgIG1hdGNoZXMucHVzaChhbGxtYXRjaGVzKTtcbiAgICBtYXRjaCA9IHJlZ2V4LmV4ZWMoc3RyaW5nKTtcbiAgfVxuICByZXR1cm4gbWF0Y2hlcztcbn07XG5cbmNvbnN0IGlzTmFtZSA9IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgY29uc3QgbWF0Y2ggPSByZWdleE5hbWUuZXhlYyhzdHJpbmcpO1xuICByZXR1cm4gIShtYXRjaCA9PT0gbnVsbCB8fCB0eXBlb2YgbWF0Y2ggPT09ICd1bmRlZmluZWQnKTtcbn07XG5cbmV4cG9ydHMuaXNFeGlzdCA9IGZ1bmN0aW9uICh2KSB7XG4gIHJldHVybiB0eXBlb2YgdiAhPT0gJ3VuZGVmaW5lZCc7XG59O1xuXG5leHBvcnRzLmlzRW1wdHlPYmplY3QgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMDtcbn07XG5cbi8qKlxuICogQ29weSBhbGwgdGhlIHByb3BlcnRpZXMgb2YgYSBpbnRvIGIuXG4gKiBAcGFyYW0geyp9IHRhcmdldFxuICogQHBhcmFtIHsqfSBhXG4gKi9cbmV4cG9ydHMubWVyZ2UgPSBmdW5jdGlvbiAodGFyZ2V0LCBhLCBhcnJheU1vZGUpIHtcbiAgaWYgKGEpIHtcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoYSk7IC8vIHdpbGwgcmV0dXJuIGFuIGFycmF5IG9mIG93biBwcm9wZXJ0aWVzXG4gICAgY29uc3QgbGVuID0ga2V5cy5sZW5ndGg7IC8vZG9uJ3QgbWFrZSBpdCBpbmxpbmVcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBpZiAoYXJyYXlNb2RlID09PSAnc3RyaWN0Jykge1xuICAgICAgICB0YXJnZXRba2V5c1tpXV0gPSBbYVtrZXlzW2ldXV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YXJnZXRba2V5c1tpXV0gPSBhW2tleXNbaV1dO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcbi8qIGV4cG9ydHMubWVyZ2UgPWZ1bmN0aW9uIChiLGEpe1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbihiLGEpO1xufSAqL1xuXG5leHBvcnRzLmdldFZhbHVlID0gZnVuY3Rpb24gKHYpIHtcbiAgaWYgKGV4cG9ydHMuaXNFeGlzdCh2KSkge1xuICAgIHJldHVybiB2O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAnJztcbiAgfVxufTtcblxuLyoqXG4gKiBEYW5nZXJvdXMgcHJvcGVydHkgbmFtZXMgdGhhdCBjb3VsZCBsZWFkIHRvIHByb3RvdHlwZSBwb2xsdXRpb24gb3Igc2VjdXJpdHkgaXNzdWVzXG4gKi9cbmNvbnN0IERBTkdFUk9VU19QUk9QRVJUWV9OQU1FUyA9IFtcbiAgLy8gJ19fcHJvdG9fXycsXG4gIC8vICdjb25zdHJ1Y3RvcicsXG4gIC8vICdwcm90b3R5cGUnLFxuICAnaGFzT3duUHJvcGVydHknLFxuICAndG9TdHJpbmcnLFxuICAndmFsdWVPZicsXG4gICdfX2RlZmluZUdldHRlcl9fJyxcbiAgJ19fZGVmaW5lU2V0dGVyX18nLFxuICAnX19sb29rdXBHZXR0ZXJfXycsXG4gICdfX2xvb2t1cFNldHRlcl9fJ1xuXTtcblxuY29uc3QgY3JpdGljYWxQcm9wZXJ0aWVzID0gW1wiX19wcm90b19fXCIsIFwiY29uc3RydWN0b3JcIiwgXCJwcm90b3R5cGVcIl07XG5cbmV4cG9ydHMuaXNOYW1lID0gaXNOYW1lO1xuZXhwb3J0cy5nZXRBbGxNYXRjaGVzID0gZ2V0QWxsTWF0Y2hlcztcbmV4cG9ydHMubmFtZVJlZ2V4cCA9IG5hbWVSZWdleHA7XG5leHBvcnRzLkRBTkdFUk9VU19QUk9QRVJUWV9OQU1FUyA9IERBTkdFUk9VU19QUk9QRVJUWV9OQU1FUztcbmV4cG9ydHMuY3JpdGljYWxQcm9wZXJ0aWVzID0gY3JpdGljYWxQcm9wZXJ0aWVzO1xuIiwgIid1c2Ugc3RyaWN0JztcblxuY29uc3QgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG5jb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgYWxsb3dCb29sZWFuQXR0cmlidXRlczogZmFsc2UsIC8vQSB0YWcgY2FuIGhhdmUgYXR0cmlidXRlcyB3aXRob3V0IGFueSB2YWx1ZVxuICB1bnBhaXJlZFRhZ3M6IFtdXG59O1xuXG4vL2NvbnN0IHRhZ3NQYXR0ZXJuID0gbmV3IFJlZ0V4cChcIjxcXFxcLz8oW1xcXFx3OlxcXFwtX1xcLl0rKVxcXFxzKlxcLz8+XCIsXCJnXCIpO1xuZXhwb3J0cy52YWxpZGF0ZSA9IGZ1bmN0aW9uICh4bWxEYXRhLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgLy94bWxEYXRhID0geG1sRGF0YS5yZXBsYWNlKC8oXFxyXFxufFxcbnxcXHIpL2dtLFwiXCIpOy8vbWFrZSBpdCBzaW5nbGUgbGluZVxuICAvL3htbERhdGEgPSB4bWxEYXRhLnJlcGxhY2UoLyheXFxzKjxcXD94bWwuKj9cXD8+KS9nLFwiXCIpOy8vUmVtb3ZlIFhNTCBzdGFydGluZyB0YWdcbiAgLy94bWxEYXRhID0geG1sRGF0YS5yZXBsYWNlKC8oPCFET0NUWVBFW1xcc1xcd1xcXCJcXC5cXC9cXC1cXDpdKyhcXFsuKlxcXSkqXFxzKj4pL2csXCJcIik7Ly9SZW1vdmUgRE9DVFlQRVxuICBjb25zdCB0YWdzID0gW107XG4gIGxldCB0YWdGb3VuZCA9IGZhbHNlO1xuXG4gIC8vaW5kaWNhdGVzIHRoYXQgdGhlIHJvb3QgdGFnIGhhcyBiZWVuIGNsb3NlZCAoYWthLiBkZXB0aCAwIGhhcyBiZWVuIHJlYWNoZWQpXG4gIGxldCByZWFjaGVkUm9vdCA9IGZhbHNlO1xuXG4gIGlmICh4bWxEYXRhWzBdID09PSAnXFx1ZmVmZicpIHtcbiAgICAvLyBjaGVjayBmb3IgYnl0ZSBvcmRlciBtYXJrIChCT00pXG4gICAgeG1sRGF0YSA9IHhtbERhdGEuc3Vic3RyKDEpO1xuICB9XG4gIFxuICBmb3IgKGxldCBpID0gMDsgaSA8IHhtbERhdGEubGVuZ3RoOyBpKyspIHtcblxuICAgIGlmICh4bWxEYXRhW2ldID09PSAnPCcgJiYgeG1sRGF0YVtpKzFdID09PSAnPycpIHtcbiAgICAgIGkrPTI7XG4gICAgICBpID0gcmVhZFBJKHhtbERhdGEsaSk7XG4gICAgICBpZiAoaS5lcnIpIHJldHVybiBpO1xuICAgIH1lbHNlIGlmICh4bWxEYXRhW2ldID09PSAnPCcpIHtcbiAgICAgIC8vc3RhcnRpbmcgb2YgdGFnXG4gICAgICAvL3JlYWQgdW50aWwgeW91IHJlYWNoIHRvICc+JyBhdm9pZGluZyBhbnkgJz4nIGluIGF0dHJpYnV0ZSB2YWx1ZVxuICAgICAgbGV0IHRhZ1N0YXJ0UG9zID0gaTtcbiAgICAgIGkrKztcbiAgICAgIFxuICAgICAgaWYgKHhtbERhdGFbaV0gPT09ICchJykge1xuICAgICAgICBpID0gcmVhZENvbW1lbnRBbmRDREFUQSh4bWxEYXRhLCBpKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgY2xvc2luZ1RhZyA9IGZhbHNlO1xuICAgICAgICBpZiAoeG1sRGF0YVtpXSA9PT0gJy8nKSB7XG4gICAgICAgICAgLy9jbG9zaW5nIHRhZ1xuICAgICAgICAgIGNsb3NpbmdUYWcgPSB0cnVlO1xuICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgICAvL3JlYWQgdGFnbmFtZVxuICAgICAgICBsZXQgdGFnTmFtZSA9ICcnO1xuICAgICAgICBmb3IgKDsgaSA8IHhtbERhdGEubGVuZ3RoICYmXG4gICAgICAgICAgeG1sRGF0YVtpXSAhPT0gJz4nICYmXG4gICAgICAgICAgeG1sRGF0YVtpXSAhPT0gJyAnICYmXG4gICAgICAgICAgeG1sRGF0YVtpXSAhPT0gJ1xcdCcgJiZcbiAgICAgICAgICB4bWxEYXRhW2ldICE9PSAnXFxuJyAmJlxuICAgICAgICAgIHhtbERhdGFbaV0gIT09ICdcXHInOyBpKytcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGFnTmFtZSArPSB4bWxEYXRhW2ldO1xuICAgICAgICB9XG4gICAgICAgIHRhZ05hbWUgPSB0YWdOYW1lLnRyaW0oKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZyh0YWdOYW1lKTtcblxuICAgICAgICBpZiAodGFnTmFtZVt0YWdOYW1lLmxlbmd0aCAtIDFdID09PSAnLycpIHtcbiAgICAgICAgICAvL3NlbGYgY2xvc2luZyB0YWcgd2l0aG91dCBhdHRyaWJ1dGVzXG4gICAgICAgICAgdGFnTmFtZSA9IHRhZ05hbWUuc3Vic3RyaW5nKDAsIHRhZ05hbWUubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgLy9jb250aW51ZTtcbiAgICAgICAgICBpLS07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF2YWxpZGF0ZVRhZ05hbWUodGFnTmFtZSkpIHtcbiAgICAgICAgICBsZXQgbXNnO1xuICAgICAgICAgIGlmICh0YWdOYW1lLnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIG1zZyA9IFwiSW52YWxpZCBzcGFjZSBhZnRlciAnPCcuXCI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1zZyA9IFwiVGFnICdcIit0YWdOYW1lK1wiJyBpcyBhbiBpbnZhbGlkIG5hbWUuXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBnZXRFcnJvck9iamVjdCgnSW52YWxpZFRhZycsIG1zZywgZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIGkpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHJlYWRBdHRyaWJ1dGVTdHIoeG1sRGF0YSwgaSk7XG4gICAgICAgIGlmIChyZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkQXR0cicsIFwiQXR0cmlidXRlcyBmb3IgJ1wiK3RhZ05hbWUrXCInIGhhdmUgb3BlbiBxdW90ZS5cIiwgZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIGkpKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgYXR0clN0ciA9IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgaSA9IHJlc3VsdC5pbmRleDtcblxuICAgICAgICBpZiAoYXR0clN0clthdHRyU3RyLmxlbmd0aCAtIDFdID09PSAnLycpIHtcbiAgICAgICAgICAvL3NlbGYgY2xvc2luZyB0YWdcbiAgICAgICAgICBjb25zdCBhdHRyU3RyU3RhcnQgPSBpIC0gYXR0clN0ci5sZW5ndGg7XG4gICAgICAgICAgYXR0clN0ciA9IGF0dHJTdHIuc3Vic3RyaW5nKDAsIGF0dHJTdHIubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgY29uc3QgaXNWYWxpZCA9IHZhbGlkYXRlQXR0cmlidXRlU3RyaW5nKGF0dHJTdHIsIG9wdGlvbnMpO1xuICAgICAgICAgIGlmIChpc1ZhbGlkID09PSB0cnVlKSB7XG4gICAgICAgICAgICB0YWdGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAvL2NvbnRpbnVlOyAvL3RleHQgbWF5IHByZXNlbnRzIGFmdGVyIHNlbGYgY2xvc2luZyB0YWdcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy90aGUgcmVzdWx0IGZyb20gdGhlIG5lc3RlZCBmdW5jdGlvbiByZXR1cm5zIHRoZSBwb3NpdGlvbiBvZiB0aGUgZXJyb3Igd2l0aGluIHRoZSBhdHRyaWJ1dGVcbiAgICAgICAgICAgIC8vaW4gb3JkZXIgdG8gZ2V0IHRoZSAndHJ1ZScgZXJyb3IgbGluZSwgd2UgbmVlZCB0byBjYWxjdWxhdGUgdGhlIHBvc2l0aW9uIHdoZXJlIHRoZSBhdHRyaWJ1dGUgYmVnaW5zIChpIC0gYXR0clN0ci5sZW5ndGgpIGFuZCB0aGVuIGFkZCB0aGUgcG9zaXRpb24gd2l0aGluIHRoZSBhdHRyaWJ1dGVcbiAgICAgICAgICAgIC8vdGhpcyBnaXZlcyB1cyB0aGUgYWJzb2x1dGUgaW5kZXggaW4gdGhlIGVudGlyZSB4bWwsIHdoaWNoIHdlIGNhbiB1c2UgdG8gZmluZCB0aGUgbGluZSBhdCBsYXN0XG4gICAgICAgICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoaXNWYWxpZC5lcnIuY29kZSwgaXNWYWxpZC5lcnIubXNnLCBnZXRMaW5lTnVtYmVyRm9yUG9zaXRpb24oeG1sRGF0YSwgYXR0clN0clN0YXJ0ICsgaXNWYWxpZC5lcnIubGluZSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChjbG9zaW5nVGFnKSB7XG4gICAgICAgICAgaWYgKCFyZXN1bHQudGFnQ2xvc2VkKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRUYWcnLCBcIkNsb3NpbmcgdGFnICdcIit0YWdOYW1lK1wiJyBkb2Vzbid0IGhhdmUgcHJvcGVyIGNsb3NpbmcuXCIsIGdldExpbmVOdW1iZXJGb3JQb3NpdGlvbih4bWxEYXRhLCBpKSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChhdHRyU3RyLnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRUYWcnLCBcIkNsb3NpbmcgdGFnICdcIit0YWdOYW1lK1wiJyBjYW4ndCBoYXZlIGF0dHJpYnV0ZXMgb3IgaW52YWxpZCBzdGFydGluZy5cIiwgZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIHRhZ1N0YXJ0UG9zKSk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0YWdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkVGFnJywgXCJDbG9zaW5nIHRhZyAnXCIrdGFnTmFtZStcIicgaGFzIG5vdCBiZWVuIG9wZW5lZC5cIiwgZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIHRhZ1N0YXJ0UG9zKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IG90ZyA9IHRhZ3MucG9wKCk7XG4gICAgICAgICAgICBpZiAodGFnTmFtZSAhPT0gb3RnLnRhZ05hbWUpIHtcbiAgICAgICAgICAgICAgbGV0IG9wZW5Qb3MgPSBnZXRMaW5lTnVtYmVyRm9yUG9zaXRpb24oeG1sRGF0YSwgb3RnLnRhZ1N0YXJ0UG9zKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkVGFnJyxcbiAgICAgICAgICAgICAgICBcIkV4cGVjdGVkIGNsb3NpbmcgdGFnICdcIitvdGcudGFnTmFtZStcIicgKG9wZW5lZCBpbiBsaW5lIFwiK29wZW5Qb3MubGluZStcIiwgY29sIFwiK29wZW5Qb3MuY29sK1wiKSBpbnN0ZWFkIG9mIGNsb3NpbmcgdGFnICdcIit0YWdOYW1lK1wiJy5cIixcbiAgICAgICAgICAgICAgICBnZXRMaW5lTnVtYmVyRm9yUG9zaXRpb24oeG1sRGF0YSwgdGFnU3RhcnRQb3MpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy93aGVuIHRoZXJlIGFyZSBubyBtb3JlIHRhZ3MsIHdlIHJlYWNoZWQgdGhlIHJvb3QgbGV2ZWwuXG4gICAgICAgICAgICBpZiAodGFncy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgICByZWFjaGVkUm9vdCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGlzVmFsaWQgPSB2YWxpZGF0ZUF0dHJpYnV0ZVN0cmluZyhhdHRyU3RyLCBvcHRpb25zKTtcbiAgICAgICAgICBpZiAoaXNWYWxpZCAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgLy90aGUgcmVzdWx0IGZyb20gdGhlIG5lc3RlZCBmdW5jdGlvbiByZXR1cm5zIHRoZSBwb3NpdGlvbiBvZiB0aGUgZXJyb3Igd2l0aGluIHRoZSBhdHRyaWJ1dGVcbiAgICAgICAgICAgIC8vaW4gb3JkZXIgdG8gZ2V0IHRoZSAndHJ1ZScgZXJyb3IgbGluZSwgd2UgbmVlZCB0byBjYWxjdWxhdGUgdGhlIHBvc2l0aW9uIHdoZXJlIHRoZSBhdHRyaWJ1dGUgYmVnaW5zIChpIC0gYXR0clN0ci5sZW5ndGgpIGFuZCB0aGVuIGFkZCB0aGUgcG9zaXRpb24gd2l0aGluIHRoZSBhdHRyaWJ1dGVcbiAgICAgICAgICAgIC8vdGhpcyBnaXZlcyB1cyB0aGUgYWJzb2x1dGUgaW5kZXggaW4gdGhlIGVudGlyZSB4bWwsIHdoaWNoIHdlIGNhbiB1c2UgdG8gZmluZCB0aGUgbGluZSBhdCBsYXN0XG4gICAgICAgICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoaXNWYWxpZC5lcnIuY29kZSwgaXNWYWxpZC5lcnIubXNnLCBnZXRMaW5lTnVtYmVyRm9yUG9zaXRpb24oeG1sRGF0YSwgaSAtIGF0dHJTdHIubGVuZ3RoICsgaXNWYWxpZC5lcnIubGluZSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vaWYgdGhlIHJvb3QgbGV2ZWwgaGFzIGJlZW4gcmVhY2hlZCBiZWZvcmUgLi4uXG4gICAgICAgICAgaWYgKHJlYWNoZWRSb290ID09PSB0cnVlKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRYbWwnLCAnTXVsdGlwbGUgcG9zc2libGUgcm9vdCBub2RlcyBmb3VuZC4nLCBnZXRMaW5lTnVtYmVyRm9yUG9zaXRpb24oeG1sRGF0YSwgaSkpO1xuICAgICAgICAgIH0gZWxzZSBpZihvcHRpb25zLnVucGFpcmVkVGFncy5pbmRleE9mKHRhZ05hbWUpICE9PSAtMSl7XG4gICAgICAgICAgICAvL2Rvbid0IHB1c2ggaW50byBzdGFja1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0YWdzLnB1c2goe3RhZ05hbWUsIHRhZ1N0YXJ0UG9zfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRhZ0ZvdW5kID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vc2tpcCB0YWcgdGV4dCB2YWx1ZVxuICAgICAgICAvL0l0IG1heSBpbmNsdWRlIGNvbW1lbnRzIGFuZCBDREFUQSB2YWx1ZVxuICAgICAgICBmb3IgKGkrKzsgaSA8IHhtbERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoeG1sRGF0YVtpXSA9PT0gJzwnKSB7XG4gICAgICAgICAgICBpZiAoeG1sRGF0YVtpICsgMV0gPT09ICchJykge1xuICAgICAgICAgICAgICAvL2NvbW1lbnQgb3IgQ0FEQVRBXG4gICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgaSA9IHJlYWRDb21tZW50QW5kQ0RBVEEoeG1sRGF0YSwgaSk7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh4bWxEYXRhW2krMV0gPT09ICc/Jykge1xuICAgICAgICAgICAgICBpID0gcmVhZFBJKHhtbERhdGEsICsraSk7XG4gICAgICAgICAgICAgIGlmIChpLmVycikgcmV0dXJuIGk7XG4gICAgICAgICAgICB9IGVsc2V7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoeG1sRGF0YVtpXSA9PT0gJyYnKSB7XG4gICAgICAgICAgICBjb25zdCBhZnRlckFtcCA9IHZhbGlkYXRlQW1wZXJzYW5kKHhtbERhdGEsIGkpO1xuICAgICAgICAgICAgaWYgKGFmdGVyQW1wID09IC0xKVxuICAgICAgICAgICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRDaGFyJywgXCJjaGFyICcmJyBpcyBub3QgZXhwZWN0ZWQuXCIsIGdldExpbmVOdW1iZXJGb3JQb3NpdGlvbih4bWxEYXRhLCBpKSk7XG4gICAgICAgICAgICBpID0gYWZ0ZXJBbXA7XG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBpZiAocmVhY2hlZFJvb3QgPT09IHRydWUgJiYgIWlzV2hpdGVTcGFjZSh4bWxEYXRhW2ldKSkge1xuICAgICAgICAgICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRYbWwnLCBcIkV4dHJhIHRleHQgYXQgdGhlIGVuZFwiLCBnZXRMaW5lTnVtYmVyRm9yUG9zaXRpb24oeG1sRGF0YSwgaSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSAvL2VuZCBvZiByZWFkaW5nIHRhZyB0ZXh0IHZhbHVlXG4gICAgICAgIGlmICh4bWxEYXRhW2ldID09PSAnPCcpIHtcbiAgICAgICAgICBpLS07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCBpc1doaXRlU3BhY2UoeG1sRGF0YVtpXSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRDaGFyJywgXCJjaGFyICdcIit4bWxEYXRhW2ldK1wiJyBpcyBub3QgZXhwZWN0ZWQuXCIsIGdldExpbmVOdW1iZXJGb3JQb3NpdGlvbih4bWxEYXRhLCBpKSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCF0YWdGb3VuZCkge1xuICAgIHJldHVybiBnZXRFcnJvck9iamVjdCgnSW52YWxpZFhtbCcsICdTdGFydCB0YWcgZXhwZWN0ZWQuJywgMSk7XG4gIH1lbHNlIGlmICh0YWdzLmxlbmd0aCA9PSAxKSB7XG4gICAgICByZXR1cm4gZ2V0RXJyb3JPYmplY3QoJ0ludmFsaWRUYWcnLCBcIlVuY2xvc2VkIHRhZyAnXCIrdGFnc1swXS50YWdOYW1lK1wiJy5cIiwgZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIHRhZ3NbMF0udGFnU3RhcnRQb3MpKTtcbiAgfWVsc2UgaWYgKHRhZ3MubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkWG1sJywgXCJJbnZhbGlkICdcIitcbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh0YWdzLm1hcCh0ID0+IHQudGFnTmFtZSksIG51bGwsIDQpLnJlcGxhY2UoL1xccj9cXG4vZywgJycpK1xuICAgICAgICAgIFwiJyBmb3VuZC5cIiwge2xpbmU6IDEsIGNvbDogMX0pO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5mdW5jdGlvbiBpc1doaXRlU3BhY2UoY2hhcil7XG4gIHJldHVybiBjaGFyID09PSAnICcgfHwgY2hhciA9PT0gJ1xcdCcgfHwgY2hhciA9PT0gJ1xcbicgIHx8IGNoYXIgPT09ICdcXHInO1xufVxuLyoqXG4gKiBSZWFkIFByb2Nlc3NpbmcgaW5zc3RydWN0aW9ucyBhbmQgc2tpcFxuICogQHBhcmFtIHsqfSB4bWxEYXRhXG4gKiBAcGFyYW0geyp9IGlcbiAqL1xuZnVuY3Rpb24gcmVhZFBJKHhtbERhdGEsIGkpIHtcbiAgY29uc3Qgc3RhcnQgPSBpO1xuICBmb3IgKDsgaSA8IHhtbERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoeG1sRGF0YVtpXSA9PSAnPycgfHwgeG1sRGF0YVtpXSA9PSAnICcpIHtcbiAgICAgIC8vdGFnbmFtZVxuICAgICAgY29uc3QgdGFnbmFtZSA9IHhtbERhdGEuc3Vic3RyKHN0YXJ0LCBpIC0gc3RhcnQpO1xuICAgICAgaWYgKGkgPiA1ICYmIHRhZ25hbWUgPT09ICd4bWwnKSB7XG4gICAgICAgIHJldHVybiBnZXRFcnJvck9iamVjdCgnSW52YWxpZFhtbCcsICdYTUwgZGVjbGFyYXRpb24gYWxsb3dlZCBvbmx5IGF0IHRoZSBzdGFydCBvZiB0aGUgZG9jdW1lbnQuJywgZ2V0TGluZU51bWJlckZvclBvc2l0aW9uKHhtbERhdGEsIGkpKTtcbiAgICAgIH0gZWxzZSBpZiAoeG1sRGF0YVtpXSA9PSAnPycgJiYgeG1sRGF0YVtpICsgMV0gPT0gJz4nKSB7XG4gICAgICAgIC8vY2hlY2sgaWYgdmFsaWQgYXR0cmlidXQgc3RyaW5nXG4gICAgICAgIGkrKztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGk7XG59XG5cbmZ1bmN0aW9uIHJlYWRDb21tZW50QW5kQ0RBVEEoeG1sRGF0YSwgaSkge1xuICBpZiAoeG1sRGF0YS5sZW5ndGggPiBpICsgNSAmJiB4bWxEYXRhW2kgKyAxXSA9PT0gJy0nICYmIHhtbERhdGFbaSArIDJdID09PSAnLScpIHtcbiAgICAvL2NvbW1lbnRcbiAgICBmb3IgKGkgKz0gMzsgaSA8IHhtbERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh4bWxEYXRhW2ldID09PSAnLScgJiYgeG1sRGF0YVtpICsgMV0gPT09ICctJyAmJiB4bWxEYXRhW2kgKyAyXSA9PT0gJz4nKSB7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKFxuICAgIHhtbERhdGEubGVuZ3RoID4gaSArIDggJiZcbiAgICB4bWxEYXRhW2kgKyAxXSA9PT0gJ0QnICYmXG4gICAgeG1sRGF0YVtpICsgMl0gPT09ICdPJyAmJlxuICAgIHhtbERhdGFbaSArIDNdID09PSAnQycgJiZcbiAgICB4bWxEYXRhW2kgKyA0XSA9PT0gJ1QnICYmXG4gICAgeG1sRGF0YVtpICsgNV0gPT09ICdZJyAmJlxuICAgIHhtbERhdGFbaSArIDZdID09PSAnUCcgJiZcbiAgICB4bWxEYXRhW2kgKyA3XSA9PT0gJ0UnXG4gICkge1xuICAgIGxldCBhbmdsZUJyYWNrZXRzQ291bnQgPSAxO1xuICAgIGZvciAoaSArPSA4OyBpIDwgeG1sRGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHhtbERhdGFbaV0gPT09ICc8Jykge1xuICAgICAgICBhbmdsZUJyYWNrZXRzQ291bnQrKztcbiAgICAgIH0gZWxzZSBpZiAoeG1sRGF0YVtpXSA9PT0gJz4nKSB7XG4gICAgICAgIGFuZ2xlQnJhY2tldHNDb3VudC0tO1xuICAgICAgICBpZiAoYW5nbGVCcmFja2V0c0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoXG4gICAgeG1sRGF0YS5sZW5ndGggPiBpICsgOSAmJlxuICAgIHhtbERhdGFbaSArIDFdID09PSAnWycgJiZcbiAgICB4bWxEYXRhW2kgKyAyXSA9PT0gJ0MnICYmXG4gICAgeG1sRGF0YVtpICsgM10gPT09ICdEJyAmJlxuICAgIHhtbERhdGFbaSArIDRdID09PSAnQScgJiZcbiAgICB4bWxEYXRhW2kgKyA1XSA9PT0gJ1QnICYmXG4gICAgeG1sRGF0YVtpICsgNl0gPT09ICdBJyAmJlxuICAgIHhtbERhdGFbaSArIDddID09PSAnWydcbiAgKSB7XG4gICAgZm9yIChpICs9IDg7IGkgPCB4bWxEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoeG1sRGF0YVtpXSA9PT0gJ10nICYmIHhtbERhdGFbaSArIDFdID09PSAnXScgJiYgeG1sRGF0YVtpICsgMl0gPT09ICc+Jykge1xuICAgICAgICBpICs9IDI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpO1xufVxuXG5jb25zdCBkb3VibGVRdW90ZSA9ICdcIic7XG5jb25zdCBzaW5nbGVRdW90ZSA9IFwiJ1wiO1xuXG4vKipcbiAqIEtlZXAgcmVhZGluZyB4bWxEYXRhIHVudGlsICc8JyBpcyBmb3VuZCBvdXRzaWRlIHRoZSBhdHRyaWJ1dGUgdmFsdWUuXG4gKiBAcGFyYW0ge3N0cmluZ30geG1sRGF0YVxuICogQHBhcmFtIHtudW1iZXJ9IGlcbiAqL1xuZnVuY3Rpb24gcmVhZEF0dHJpYnV0ZVN0cih4bWxEYXRhLCBpKSB7XG4gIGxldCBhdHRyU3RyID0gJyc7XG4gIGxldCBzdGFydENoYXIgPSAnJztcbiAgbGV0IHRhZ0Nsb3NlZCA9IGZhbHNlO1xuICBmb3IgKDsgaSA8IHhtbERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoeG1sRGF0YVtpXSA9PT0gZG91YmxlUXVvdGUgfHwgeG1sRGF0YVtpXSA9PT0gc2luZ2xlUXVvdGUpIHtcbiAgICAgIGlmIChzdGFydENoYXIgPT09ICcnKSB7XG4gICAgICAgIHN0YXJ0Q2hhciA9IHhtbERhdGFbaV07XG4gICAgICB9IGVsc2UgaWYgKHN0YXJ0Q2hhciAhPT0geG1sRGF0YVtpXSkge1xuICAgICAgICAvL2lmIHZhdWUgaXMgZW5jbG9zZWQgd2l0aCBkb3VibGUgcXVvdGUgdGhlbiBzaW5nbGUgcXVvdGVzIGFyZSBhbGxvd2VkIGluc2lkZSB0aGUgdmFsdWUgYW5kIHZpY2UgdmVyc2FcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXJ0Q2hhciA9ICcnO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoeG1sRGF0YVtpXSA9PT0gJz4nKSB7XG4gICAgICBpZiAoc3RhcnRDaGFyID09PSAnJykge1xuICAgICAgICB0YWdDbG9zZWQgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgYXR0clN0ciArPSB4bWxEYXRhW2ldO1xuICB9XG4gIGlmIChzdGFydENoYXIgIT09ICcnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB2YWx1ZTogYXR0clN0cixcbiAgICBpbmRleDogaSxcbiAgICB0YWdDbG9zZWQ6IHRhZ0Nsb3NlZFxuICB9O1xufVxuXG4vKipcbiAqIFNlbGVjdCBhbGwgdGhlIGF0dHJpYnV0ZXMgd2hldGhlciB2YWxpZCBvciBpbnZhbGlkLlxuICovXG5jb25zdCB2YWxpZEF0dHJTdHJSZWd4cCA9IG5ldyBSZWdFeHAoJyhcXFxccyopKFteXFxcXHM9XSspKFxcXFxzKj0pPyhcXFxccyooW1xcJ1wiXSkoKFtcXFxcc1xcXFxTXSkqPylcXFxcNSk/JywgJ2cnKTtcblxuLy9hdHRyLCA9XCJzZFwiLCBhPVwiYW1pdCdzXCIsIGE9XCJzZFwiYj1cInNhZlwiLCBhYiAgY2Q9XCJcIlxuXG5mdW5jdGlvbiB2YWxpZGF0ZUF0dHJpYnV0ZVN0cmluZyhhdHRyU3RyLCBvcHRpb25zKSB7XG4gIC8vY29uc29sZS5sb2coXCJzdGFydDpcIithdHRyU3RyK1wiOmVuZFwiKTtcblxuICAvL2lmKGF0dHJTdHIudHJpbSgpLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWU7IC8vZW1wdHkgc3RyaW5nXG5cbiAgY29uc3QgbWF0Y2hlcyA9IHV0aWwuZ2V0QWxsTWF0Y2hlcyhhdHRyU3RyLCB2YWxpZEF0dHJTdHJSZWd4cCk7XG4gIGNvbnN0IGF0dHJOYW1lcyA9IHt9O1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbWF0Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChtYXRjaGVzW2ldWzFdLmxlbmd0aCA9PT0gMCkge1xuICAgICAgLy9ub3NwYWNlIGJlZm9yZSBhdHRyaWJ1dGUgbmFtZTogYT1cInNkXCJiPVwic2FmXCJcbiAgICAgIHJldHVybiBnZXRFcnJvck9iamVjdCgnSW52YWxpZEF0dHInLCBcIkF0dHJpYnV0ZSAnXCIrbWF0Y2hlc1tpXVsyXStcIicgaGFzIG5vIHNwYWNlIGluIHN0YXJ0aW5nLlwiLCBnZXRQb3NpdGlvbkZyb21NYXRjaChtYXRjaGVzW2ldKSlcbiAgICB9IGVsc2UgaWYgKG1hdGNoZXNbaV1bM10gIT09IHVuZGVmaW5lZCAmJiBtYXRjaGVzW2ldWzRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBnZXRFcnJvck9iamVjdCgnSW52YWxpZEF0dHInLCBcIkF0dHJpYnV0ZSAnXCIrbWF0Y2hlc1tpXVsyXStcIicgaXMgd2l0aG91dCB2YWx1ZS5cIiwgZ2V0UG9zaXRpb25Gcm9tTWF0Y2gobWF0Y2hlc1tpXSkpO1xuICAgIH0gZWxzZSBpZiAobWF0Y2hlc1tpXVszXSA9PT0gdW5kZWZpbmVkICYmICFvcHRpb25zLmFsbG93Qm9vbGVhbkF0dHJpYnV0ZXMpIHtcbiAgICAgIC8vaW5kZXBlbmRlbnQgYXR0cmlidXRlOiBhYlxuICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkQXR0cicsIFwiYm9vbGVhbiBhdHRyaWJ1dGUgJ1wiK21hdGNoZXNbaV1bMl0rXCInIGlzIG5vdCBhbGxvd2VkLlwiLCBnZXRQb3NpdGlvbkZyb21NYXRjaChtYXRjaGVzW2ldKSk7XG4gICAgfVxuICAgIC8qIGVsc2UgaWYobWF0Y2hlc1tpXVs2XSA9PT0gdW5kZWZpbmVkKXsvL2F0dHJpYnV0ZSB3aXRob3V0IHZhbHVlOiBhYj1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgZXJyOiB7IGNvZGU6XCJJbnZhbGlkQXR0clwiLG1zZzpcImF0dHJpYnV0ZSBcIiArIG1hdGNoZXNbaV1bMl0gKyBcIiBoYXMgbm8gdmFsdWUgYXNzaWduZWQuXCJ9fTtcbiAgICAgICAgICAgICAgICB9ICovXG4gICAgY29uc3QgYXR0ck5hbWUgPSBtYXRjaGVzW2ldWzJdO1xuICAgIGlmICghdmFsaWRhdGVBdHRyTmFtZShhdHRyTmFtZSkpIHtcbiAgICAgIHJldHVybiBnZXRFcnJvck9iamVjdCgnSW52YWxpZEF0dHInLCBcIkF0dHJpYnV0ZSAnXCIrYXR0ck5hbWUrXCInIGlzIGFuIGludmFsaWQgbmFtZS5cIiwgZ2V0UG9zaXRpb25Gcm9tTWF0Y2gobWF0Y2hlc1tpXSkpO1xuICAgIH1cbiAgICBpZiAoIWF0dHJOYW1lcy5oYXNPd25Qcm9wZXJ0eShhdHRyTmFtZSkpIHtcbiAgICAgIC8vY2hlY2sgZm9yIGR1cGxpY2F0ZSBhdHRyaWJ1dGUuXG4gICAgICBhdHRyTmFtZXNbYXR0ck5hbWVdID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGdldEVycm9yT2JqZWN0KCdJbnZhbGlkQXR0cicsIFwiQXR0cmlidXRlICdcIithdHRyTmFtZStcIicgaXMgcmVwZWF0ZWQuXCIsIGdldFBvc2l0aW9uRnJvbU1hdGNoKG1hdGNoZXNbaV0pKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVOdW1iZXJBbXBlcnNhbmQoeG1sRGF0YSwgaSkge1xuICBsZXQgcmUgPSAvXFxkLztcbiAgaWYgKHhtbERhdGFbaV0gPT09ICd4Jykge1xuICAgIGkrKztcbiAgICByZSA9IC9bXFxkYS1mQS1GXS87XG4gIH1cbiAgZm9yICg7IGkgPCB4bWxEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHhtbERhdGFbaV0gPT09ICc7JylcbiAgICAgIHJldHVybiBpO1xuICAgIGlmICgheG1sRGF0YVtpXS5tYXRjaChyZSkpXG4gICAgICBicmVhaztcbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlQW1wZXJzYW5kKHhtbERhdGEsIGkpIHtcbiAgLy8gaHR0cHM6Ly93d3cudzMub3JnL1RSL3htbC8jZHQtY2hhcnJlZlxuICBpKys7XG4gIGlmICh4bWxEYXRhW2ldID09PSAnOycpXG4gICAgcmV0dXJuIC0xO1xuICBpZiAoeG1sRGF0YVtpXSA9PT0gJyMnKSB7XG4gICAgaSsrO1xuICAgIHJldHVybiB2YWxpZGF0ZU51bWJlckFtcGVyc2FuZCh4bWxEYXRhLCBpKTtcbiAgfVxuICBsZXQgY291bnQgPSAwO1xuICBmb3IgKDsgaSA8IHhtbERhdGEubGVuZ3RoOyBpKyssIGNvdW50KyspIHtcbiAgICBpZiAoeG1sRGF0YVtpXS5tYXRjaCgvXFx3LykgJiYgY291bnQgPCAyMClcbiAgICAgIGNvbnRpbnVlO1xuICAgIGlmICh4bWxEYXRhW2ldID09PSAnOycpXG4gICAgICBicmVhaztcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgcmV0dXJuIGk7XG59XG5cbmZ1bmN0aW9uIGdldEVycm9yT2JqZWN0KGNvZGUsIG1lc3NhZ2UsIGxpbmVOdW1iZXIpIHtcbiAgcmV0dXJuIHtcbiAgICBlcnI6IHtcbiAgICAgIGNvZGU6IGNvZGUsXG4gICAgICBtc2c6IG1lc3NhZ2UsXG4gICAgICBsaW5lOiBsaW5lTnVtYmVyLmxpbmUgfHwgbGluZU51bWJlcixcbiAgICAgIGNvbDogbGluZU51bWJlci5jb2wsXG4gICAgfSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVBdHRyTmFtZShhdHRyTmFtZSkge1xuICByZXR1cm4gdXRpbC5pc05hbWUoYXR0ck5hbWUpO1xufVxuXG4vLyBjb25zdCBzdGFydHNXaXRoWE1MID0gL154bWwvaTtcblxuZnVuY3Rpb24gdmFsaWRhdGVUYWdOYW1lKHRhZ25hbWUpIHtcbiAgcmV0dXJuIHV0aWwuaXNOYW1lKHRhZ25hbWUpIC8qICYmICF0YWduYW1lLm1hdGNoKHN0YXJ0c1dpdGhYTUwpICovO1xufVxuXG4vL3RoaXMgZnVuY3Rpb24gcmV0dXJucyB0aGUgbGluZSBudW1iZXIgZm9yIHRoZSBjaGFyYWN0ZXIgYXQgdGhlIGdpdmVuIGluZGV4XG5mdW5jdGlvbiBnZXRMaW5lTnVtYmVyRm9yUG9zaXRpb24oeG1sRGF0YSwgaW5kZXgpIHtcbiAgY29uc3QgbGluZXMgPSB4bWxEYXRhLnN1YnN0cmluZygwLCBpbmRleCkuc3BsaXQoL1xccj9cXG4vKTtcbiAgcmV0dXJuIHtcbiAgICBsaW5lOiBsaW5lcy5sZW5ndGgsXG5cbiAgICAvLyBjb2x1bW4gbnVtYmVyIGlzIGxhc3QgbGluZSdzIGxlbmd0aCArIDEsIGJlY2F1c2UgY29sdW1uIG51bWJlcmluZyBzdGFydHMgYXQgMTpcbiAgICBjb2w6IGxpbmVzW2xpbmVzLmxlbmd0aCAtIDFdLmxlbmd0aCArIDFcbiAgfTtcbn1cblxuLy90aGlzIGZ1bmN0aW9uIHJldHVybnMgdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb2YgbWF0Y2ggd2l0aGluIGF0dHJTdHJcbmZ1bmN0aW9uIGdldFBvc2l0aW9uRnJvbU1hdGNoKG1hdGNoKSB7XG4gIHJldHVybiBtYXRjaC5zdGFydEluZGV4ICsgbWF0Y2hbMV0ubGVuZ3RoO1xufVxuIiwgIlxuY29uc3QgeyBEQU5HRVJPVVNfUFJPUEVSVFlfTkFNRVMsIGNyaXRpY2FsUHJvcGVydGllcyB9ID0gcmVxdWlyZShcIi4uL3V0aWxcIik7XG5cbmNvbnN0IGRlZmF1bHRPbkRhbmdlcm91c1Byb3BlcnR5ID0gKG5hbWUpID0+IHtcbiAgaWYgKERBTkdFUk9VU19QUk9QRVJUWV9OQU1FUy5pbmNsdWRlcyhuYW1lKSkge1xuICAgIHJldHVybiBcIl9fXCIgKyBuYW1lO1xuICB9XG4gIHJldHVybiBuYW1lO1xufTtcbmNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICBwcmVzZXJ2ZU9yZGVyOiBmYWxzZSxcbiAgYXR0cmlidXRlTmFtZVByZWZpeDogJ0BfJyxcbiAgYXR0cmlidXRlc0dyb3VwTmFtZTogZmFsc2UsXG4gIHRleHROb2RlTmFtZTogJyN0ZXh0JyxcbiAgaWdub3JlQXR0cmlidXRlczogdHJ1ZSxcbiAgcmVtb3ZlTlNQcmVmaXg6IGZhbHNlLCAvLyByZW1vdmUgTlMgZnJvbSB0YWcgbmFtZSBvciBhdHRyaWJ1dGUgbmFtZSBpZiB0cnVlXG4gIGFsbG93Qm9vbGVhbkF0dHJpYnV0ZXM6IGZhbHNlLCAvL2EgdGFnIGNhbiBoYXZlIGF0dHJpYnV0ZXMgd2l0aG91dCBhbnkgdmFsdWVcbiAgLy9pZ25vcmVSb290RWxlbWVudCA6IGZhbHNlLFxuICBwYXJzZVRhZ1ZhbHVlOiB0cnVlLFxuICBwYXJzZUF0dHJpYnV0ZVZhbHVlOiBmYWxzZSxcbiAgdHJpbVZhbHVlczogdHJ1ZSwgLy9UcmltIHN0cmluZyB2YWx1ZXMgb2YgdGFnIGFuZCBhdHRyaWJ1dGVzXG4gIGNkYXRhUHJvcE5hbWU6IGZhbHNlLFxuICBudW1iZXJQYXJzZU9wdGlvbnM6IHtcbiAgICBoZXg6IHRydWUsXG4gICAgbGVhZGluZ1plcm9zOiB0cnVlLFxuICAgIGVOb3RhdGlvbjogdHJ1ZVxuICB9LFxuICB0YWdWYWx1ZVByb2Nlc3NvcjogZnVuY3Rpb24gKHRhZ05hbWUsIHZhbCkge1xuICAgIHJldHVybiB2YWw7XG4gIH0sXG4gIGF0dHJpYnV0ZVZhbHVlUHJvY2Vzc29yOiBmdW5jdGlvbiAoYXR0ck5hbWUsIHZhbCkge1xuICAgIHJldHVybiB2YWw7XG4gIH0sXG4gIHN0b3BOb2RlczogW10sIC8vbmVzdGVkIHRhZ3Mgd2lsbCBub3QgYmUgcGFyc2VkIGV2ZW4gZm9yIGVycm9yc1xuICBhbHdheXNDcmVhdGVUZXh0Tm9kZTogZmFsc2UsXG4gIGlzQXJyYXk6ICgpID0+IGZhbHNlLFxuICBjb21tZW50UHJvcE5hbWU6IGZhbHNlLFxuICB1bnBhaXJlZFRhZ3M6IFtdLFxuICBwcm9jZXNzRW50aXRpZXM6IHRydWUsXG4gIGh0bWxFbnRpdGllczogZmFsc2UsXG4gIGlnbm9yZURlY2xhcmF0aW9uOiBmYWxzZSxcbiAgaWdub3JlUGlUYWdzOiBmYWxzZSxcbiAgdHJhbnNmb3JtVGFnTmFtZTogZmFsc2UsXG4gIHRyYW5zZm9ybUF0dHJpYnV0ZU5hbWU6IGZhbHNlLFxuICB1cGRhdGVUYWc6IGZ1bmN0aW9uICh0YWdOYW1lLCBqUGF0aCwgYXR0cnMpIHtcbiAgICByZXR1cm4gdGFnTmFtZVxuICB9LFxuICAvLyBza2lwRW1wdHlMaXN0SXRlbTogZmFsc2VcbiAgY2FwdHVyZU1ldGFEYXRhOiBmYWxzZSxcbiAgbWF4TmVzdGVkVGFnczogMTAwLFxuICBzdHJpY3RSZXNlcnZlZE5hbWVzOiB0cnVlLFxuICBvbkRhbmdlcm91c1Byb3BlcnR5OiBkZWZhdWx0T25EYW5nZXJvdXNQcm9wZXJ0eVxufTtcbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgYSBwcm9wZXJ0eSBuYW1lIGlzIHNhZmUgdG8gdXNlXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHlOYW1lIC0gVGhlIHByb3BlcnR5IG5hbWUgdG8gdmFsaWRhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25OYW1lIC0gVGhlIG9wdGlvbiBmaWVsZCBuYW1lIChmb3IgZXJyb3IgbWVzc2FnZSlcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBwcm9wZXJ0eSBuYW1lIGlzIGRhbmdlcm91c1xuICovXG5mdW5jdGlvbiB2YWxpZGF0ZVByb3BlcnR5TmFtZShwcm9wZXJ0eU5hbWUsIG9wdGlvbk5hbWUpIHtcbiAgaWYgKHR5cGVvZiBwcm9wZXJ0eU5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuOyAvLyBPbmx5IHZhbGlkYXRlIHN0cmluZyBwcm9wZXJ0eSBuYW1lc1xuICB9XG5cbiAgY29uc3Qgbm9ybWFsaXplZCA9IHByb3BlcnR5TmFtZS50b0xvd2VyQ2FzZSgpO1xuICBpZiAoREFOR0VST1VTX1BST1BFUlRZX05BTUVTLnNvbWUoZGFuZ2Vyb3VzID0+IG5vcm1hbGl6ZWQgPT09IGRhbmdlcm91cy50b0xvd2VyQ2FzZSgpKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBbU0VDVVJJVFldIEludmFsaWQgJHtvcHRpb25OYW1lfTogXCIke3Byb3BlcnR5TmFtZX1cIiBpcyBhIHJlc2VydmVkIEphdmFTY3JpcHQga2V5d29yZCB0aGF0IGNvdWxkIGNhdXNlIHByb3RvdHlwZSBwb2xsdXRpb25gXG4gICAgKTtcbiAgfVxuXG4gIGlmIChjcml0aWNhbFByb3BlcnRpZXMuc29tZShkYW5nZXJvdXMgPT4gbm9ybWFsaXplZCA9PT0gZGFuZ2Vyb3VzLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYFtTRUNVUklUWV0gSW52YWxpZCAke29wdGlvbk5hbWV9OiBcIiR7cHJvcGVydHlOYW1lfVwiIGlzIGEgcmVzZXJ2ZWQgSmF2YVNjcmlwdCBrZXl3b3JkIHRoYXQgY291bGQgY2F1c2UgcHJvdG90eXBlIHBvbGx1dGlvbmBcbiAgICApO1xuICB9XG59XG5cbi8qKlxuICogTm9ybWFsaXplcyBwcm9jZXNzRW50aXRpZXMgb3B0aW9uIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XG4gKiBAcGFyYW0ge2Jvb2xlYW58b2JqZWN0fSB2YWx1ZSBcbiAqIEByZXR1cm5zIHtvYmplY3R9IEFsd2F5cyByZXR1cm5zIG5vcm1hbGl6ZWQgb2JqZWN0XG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZVByb2Nlc3NFbnRpdGllcyh2YWx1ZSkge1xuICAvLyBCb29sZWFuIGJhY2t3YXJkIGNvbXBhdGliaWxpdHlcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVuYWJsZWQ6IHZhbHVlLCAvLyB0cnVlIG9yIGZhbHNlXG4gICAgICBtYXhFbnRpdHlTaXplOiAxMDAwMCxcbiAgICAgIG1heEV4cGFuc2lvbkRlcHRoOiAxMCxcbiAgICAgIG1heFRvdGFsRXhwYW5zaW9uczogMTAwMCxcbiAgICAgIG1heEV4cGFuZGVkTGVuZ3RoOiAxMDAwMDAsXG4gICAgICBhbGxvd2VkVGFnczogbnVsbCxcbiAgICAgIHRhZ0ZpbHRlcjogbnVsbFxuICAgIH07XG4gIH1cblxuICAvLyBPYmplY3QgY29uZmlnIC0gbWVyZ2Ugd2l0aCBkZWZhdWx0c1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgIHJldHVybiB7XG4gICAgICBlbmFibGVkOiB2YWx1ZS5lbmFibGVkICE9PSBmYWxzZSxcbiAgICAgIG1heEVudGl0eVNpemU6IE1hdGgubWF4KDEsIHZhbHVlLm1heEVudGl0eVNpemUgPz8gMTAwMDApLFxuICAgICAgbWF4RXhwYW5zaW9uRGVwdGg6IE1hdGgubWF4KDEsIHZhbHVlLm1heEV4cGFuc2lvbkRlcHRoID8/IDEwMDAwKSxcbiAgICAgIG1heFRvdGFsRXhwYW5zaW9uczogTWF0aC5tYXgoMSwgdmFsdWUubWF4VG90YWxFeHBhbnNpb25zID8/IEluZmluaXR5KSxcbiAgICAgIG1heEV4cGFuZGVkTGVuZ3RoOiBNYXRoLm1heCgxLCB2YWx1ZS5tYXhFeHBhbmRlZExlbmd0aCA/PyAxMDAwMDApLFxuICAgICAgbWF4RW50aXR5Q291bnQ6IE1hdGgubWF4KDEsIHZhbHVlLm1heEVudGl0eUNvdW50ID8/IDEwMDApLFxuICAgICAgYWxsb3dlZFRhZ3M6IHZhbHVlLmFsbG93ZWRUYWdzID8/IG51bGwsXG4gICAgICB0YWdGaWx0ZXI6IHZhbHVlLnRhZ0ZpbHRlciA/PyBudWxsXG4gICAgfTtcbiAgfVxuXG4gIC8vIERlZmF1bHQgdG8gZW5hYmxlZCB3aXRoIGxpbWl0c1xuICByZXR1cm4gbm9ybWFsaXplUHJvY2Vzc0VudGl0aWVzKHRydWUpO1xufVxuXG5jb25zdCBidWlsZE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICBjb25zdCBidWlsdCA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcblxuXG4gIC8vIFZhbGlkYXRlIHByb3BlcnR5IG5hbWVzIHRvIHByZXZlbnQgcHJvdG90eXBlIHBvbGx1dGlvblxuICBjb25zdCBwcm9wZXJ0eU5hbWVPcHRpb25zID0gW1xuICAgIHsgdmFsdWU6IGJ1aWx0LmF0dHJpYnV0ZU5hbWVQcmVmaXgsIG5hbWU6ICdhdHRyaWJ1dGVOYW1lUHJlZml4JyB9LFxuICAgIHsgdmFsdWU6IGJ1aWx0LmF0dHJpYnV0ZXNHcm91cE5hbWUsIG5hbWU6ICdhdHRyaWJ1dGVzR3JvdXBOYW1lJyB9LFxuICAgIHsgdmFsdWU6IGJ1aWx0LnRleHROb2RlTmFtZSwgbmFtZTogJ3RleHROb2RlTmFtZScgfSxcbiAgICB7IHZhbHVlOiBidWlsdC5jZGF0YVByb3BOYW1lLCBuYW1lOiAnY2RhdGFQcm9wTmFtZScgfSxcbiAgICB7IHZhbHVlOiBidWlsdC5jb21tZW50UHJvcE5hbWUsIG5hbWU6ICdjb21tZW50UHJvcE5hbWUnIH1cbiAgXTtcblxuICBmb3IgKGNvbnN0IHsgdmFsdWUsIG5hbWUgfSBvZiBwcm9wZXJ0eU5hbWVPcHRpb25zKSB7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICB2YWxpZGF0ZVByb3BlcnR5TmFtZSh2YWx1ZSwgbmFtZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGJ1aWx0Lm9uRGFuZ2Vyb3VzUHJvcGVydHkgPT09IG51bGwpIHtcbiAgICBidWlsdC5vbkRhbmdlcm91c1Byb3BlcnR5ID0gZGVmYXVsdE9uRGFuZ2Vyb3VzUHJvcGVydHk7XG4gIH1cblxuICAvLyBBbHdheXMgbm9ybWFsaXplIHByb2Nlc3NFbnRpdGllcyBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSBhbmQgdmFsaWRhdGlvblxuICBidWlsdC5wcm9jZXNzRW50aXRpZXMgPSBub3JtYWxpemVQcm9jZXNzRW50aXRpZXMoYnVpbHQucHJvY2Vzc0VudGl0aWVzKTtcbiAgLy9jb25zb2xlLmRlYnVnKGJ1aWx0LnByb2Nlc3NFbnRpdGllcylcbiAgcmV0dXJuIGJ1aWx0O1xufTtcblxuZXhwb3J0cy5idWlsZE9wdGlvbnMgPSBidWlsZE9wdGlvbnM7XG5leHBvcnRzLmRlZmF1bHRPcHRpb25zID0gZGVmYXVsdE9wdGlvbnM7IiwgIid1c2Ugc3RyaWN0JztcblxuY2xhc3MgWG1sTm9kZXtcbiAgY29uc3RydWN0b3IodGFnbmFtZSkge1xuICAgIHRoaXMudGFnbmFtZSA9IHRhZ25hbWU7XG4gICAgdGhpcy5jaGlsZCA9IFtdOyAvL25lc3RlZCB0YWdzLCB0ZXh0LCBjZGF0YSwgY29tbWVudHMgaW4gb3JkZXJcbiAgICB0aGlzW1wiOkBcIl0gPSB7fTsgLy9hdHRyaWJ1dGVzIG1hcFxuICB9XG4gIGFkZChrZXksdmFsKXtcbiAgICAvLyB0aGlzLmNoaWxkLnB1c2goIHtuYW1lIDoga2V5LCB2YWw6IHZhbCwgaXNDZGF0YTogaXNDZGF0YSB9KTtcbiAgICBpZihrZXkgPT09IFwiX19wcm90b19fXCIpIGtleSA9IFwiI19fcHJvdG9fX1wiO1xuICAgIHRoaXMuY2hpbGQucHVzaCgge1trZXldOiB2YWwgfSk7XG4gIH1cbiAgYWRkQ2hpbGQobm9kZSkge1xuICAgIGlmKG5vZGUudGFnbmFtZSA9PT0gXCJfX3Byb3RvX19cIikgbm9kZS50YWduYW1lID0gXCIjX19wcm90b19fXCI7XG4gICAgaWYobm9kZVtcIjpAXCJdICYmIE9iamVjdC5rZXlzKG5vZGVbXCI6QFwiXSkubGVuZ3RoID4gMCl7XG4gICAgICB0aGlzLmNoaWxkLnB1c2goIHsgW25vZGUudGFnbmFtZV06IG5vZGUuY2hpbGQsIFtcIjpAXCJdOiBub2RlW1wiOkBcIl0gfSk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLmNoaWxkLnB1c2goIHsgW25vZGUudGFnbmFtZV06IG5vZGUuY2hpbGQgfSk7XG4gICAgfVxuICB9O1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFhtbE5vZGU7IiwgImNvbnN0IHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbmNsYXNzIERvY1R5cGVSZWFkZXIge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5zdXBwcmVzc1ZhbGlkYXRpb25FcnIgPSAhb3B0aW9ucztcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB9XG5cbiAgICByZWFkRG9jVHlwZSh4bWxEYXRhLCBpKSB7XG4gICAgICAgIGNvbnN0IGVudGl0aWVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgbGV0IGVudGl0eUNvdW50ID0gMDtcblxuICAgICAgICBpZiAoeG1sRGF0YVtpICsgM10gPT09ICdPJyAmJlxuICAgICAgICAgICAgeG1sRGF0YVtpICsgNF0gPT09ICdDJyAmJlxuICAgICAgICAgICAgeG1sRGF0YVtpICsgNV0gPT09ICdUJyAmJlxuICAgICAgICAgICAgeG1sRGF0YVtpICsgNl0gPT09ICdZJyAmJlxuICAgICAgICAgICAgeG1sRGF0YVtpICsgN10gPT09ICdQJyAmJlxuICAgICAgICAgICAgeG1sRGF0YVtpICsgOF0gPT09ICdFJykge1xuXG4gICAgICAgICAgICBpID0gaSArIDk7XG4gICAgICAgICAgICBsZXQgYW5nbGVCcmFja2V0c0NvdW50ID0gMTtcbiAgICAgICAgICAgIGxldCBoYXNCb2R5ID0gZmFsc2UsIGNvbW1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgIGxldCBleHAgPSBcIlwiO1xuXG4gICAgICAgICAgICBmb3IgKDsgaSA8IHhtbERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoeG1sRGF0YVtpXSA9PT0gJzwnICYmICFjb21tZW50KSB7IC8vRGV0ZXJtaW5lIHRoZSB0YWcgdHlwZVxuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzQm9keSAmJiBoYXNTZXEoeG1sRGF0YSwgXCIhRU5USVRZXCIsIGkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpICs9IDc7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZW50aXR5TmFtZSwgdmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgW2VudGl0eU5hbWUsIHZhbCwgaV0gPSB0aGlzLnJlYWRFbnRpdHlFeHAoeG1sRGF0YSwgaSArIDEsIHRoaXMuc3VwcHJlc3NWYWxpZGF0aW9uRXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWwuaW5kZXhPZihcIiZcIikgPT09IC0xKSB7IC8vUGFyYW1ldGVyIGVudGl0aWVzIGFyZSBub3Qgc3VwcG9ydGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5lbmFibGVkICE9PSBmYWxzZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMubWF4RW50aXR5Q291bnQgIT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRpdHlDb3VudCA+PSB0aGlzLm9wdGlvbnMubWF4RW50aXR5Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYEVudGl0eSBjb3VudCAoJHtlbnRpdHlDb3VudCArIDF9KSBleGNlZWRzIG1heGltdW0gYWxsb3dlZCAoJHt0aGlzLm9wdGlvbnMubWF4RW50aXR5Q291bnR9KWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zdCBlc2NhcGVkID0gZW50aXR5TmFtZS5yZXBsYWNlKC9bLlxcLSsqOl0vZywgJ1xcXFwuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXNjYXBlZCA9IGVudGl0eU5hbWUucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csICdcXFxcJCYnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRpdGllc1tlbnRpdHlOYW1lXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVneDogUmVnRXhwKGAmJHtlc2NhcGVkfTtgLCBcImdcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbDogdmFsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRpdHlDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGhhc0JvZHkgJiYgaGFzU2VxKHhtbERhdGEsIFwiIUVMRU1FTlRcIiwgaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgKz0gODsgLy9Ob3Qgc3VwcG9ydGVkXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGluZGV4IH0gPSB0aGlzLnJlYWRFbGVtZW50RXhwKHhtbERhdGEsIGkgKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChoYXNCb2R5ICYmIGhhc1NlcSh4bWxEYXRhLCBcIiFBVFRMSVNUXCIsIGkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpICs9IDg7IC8vTm90IHN1cHBvcnRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc3Qge2luZGV4fSA9IHRoaXMucmVhZEF0dGxpc3RFeHAoeG1sRGF0YSxpKzEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaSA9IGluZGV4O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGhhc0JvZHkgJiYgaGFzU2VxKHhtbERhdGEsIFwiIU5PVEFUSU9OXCIsIGkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpICs9IDk7IC8vTm90IHN1cHBvcnRlZFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBpbmRleCB9ID0gdGhpcy5yZWFkTm90YXRpb25FeHAoeG1sRGF0YSwgaSArIDEsIHRoaXMuc3VwcHJlc3NWYWxpZGF0aW9uRXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChoYXNTZXEoeG1sRGF0YSwgXCIhLS1cIiwgaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIERPQ1RZUEVgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGFuZ2xlQnJhY2tldHNDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICBleHAgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeG1sRGF0YVtpXSA9PT0gJz4nKSB7IC8vUmVhZCB0YWcgY29udGVudFxuICAgICAgICAgICAgICAgICAgICBpZiAoY29tbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHhtbERhdGFbaSAtIDFdID09PSBcIi1cIiAmJiB4bWxEYXRhW2kgLSAyXSA9PT0gXCItXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5nbGVCcmFja2V0c0NvdW50LS07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmdsZUJyYWNrZXRzQ291bnQtLTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoYW5nbGVCcmFja2V0c0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeG1sRGF0YVtpXSA9PT0gJ1snKSB7XG4gICAgICAgICAgICAgICAgICAgIGhhc0JvZHkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGV4cCArPSB4bWxEYXRhW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGFuZ2xlQnJhY2tldHNDb3VudCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5jbG9zZWQgRE9DVFlQRWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFRhZyBpbnN0ZWFkIG9mIERPQ1RZUEVgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7IGVudGl0aWVzLCBpIH07XG4gICAgfVxuXG4gICAgcmVhZEVudGl0eUV4cCh4bWxEYXRhLCBpKSB7XG4gICAgICAgIC8vRXh0ZXJuYWwgZW50aXRpZXMgYXJlIG5vdCBzdXBwb3J0ZWRcbiAgICAgICAgLy8gICAgPCFFTlRJVFkgZXh0IFNZU1RFTSBcImh0dHA6Ly9ub3JtYWwtd2Vic2l0ZS5jb21cIiA+XG5cbiAgICAgICAgLy9QYXJhbWV0ZXIgZW50aXRpZXMgYXJlIG5vdCBzdXBwb3J0ZWRcbiAgICAgICAgLy8gICAgPCFFTlRJVFkgZW50aXR5bmFtZSBcIiZhbm90aGVyRWxlbWVudDtcIj5cblxuICAgICAgICAvL0ludGVybmFsIGVudGl0aWVzIGFyZSBzdXBwb3J0ZWRcbiAgICAgICAgLy8gICAgPCFFTlRJVFkgZW50aXR5bmFtZSBcInJlcGxhY2VtZW50IHRleHRcIj5cblxuICAgICAgICAvLyBTa2lwIGxlYWRpbmcgd2hpdGVzcGFjZSBhZnRlciA8IUVOVElUWVxuICAgICAgICBpID0gc2tpcFdoaXRlc3BhY2UoeG1sRGF0YSwgaSk7XG5cbiAgICAgICAgLy8gUmVhZCBlbnRpdHkgbmFtZVxuICAgICAgICBsZXQgZW50aXR5TmFtZSA9IFwiXCI7XG4gICAgICAgIHdoaWxlIChpIDwgeG1sRGF0YS5sZW5ndGggJiYgIS9cXHMvLnRlc3QoeG1sRGF0YVtpXSkgJiYgeG1sRGF0YVtpXSAhPT0gJ1wiJyAmJiB4bWxEYXRhW2ldICE9PSBcIidcIikge1xuICAgICAgICAgICAgZW50aXR5TmFtZSArPSB4bWxEYXRhW2ldO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHZhbGlkYXRlRW50aXR5TmFtZShlbnRpdHlOYW1lKTtcblxuICAgICAgICAvLyBTa2lwIHdoaXRlc3BhY2UgYWZ0ZXIgZW50aXR5IG5hbWVcbiAgICAgICAgaSA9IHNraXBXaGl0ZXNwYWNlKHhtbERhdGEsIGkpO1xuXG4gICAgICAgIC8vIENoZWNrIGZvciB1bnN1cHBvcnRlZCBjb25zdHJ1Y3RzIChleHRlcm5hbCBlbnRpdGllcyBvciBwYXJhbWV0ZXIgZW50aXRpZXMpXG4gICAgICAgIGlmICghdGhpcy5zdXBwcmVzc1ZhbGlkYXRpb25FcnIpIHtcbiAgICAgICAgICAgIGlmICh4bWxEYXRhLnN1YnN0cmluZyhpLCBpICsgNikudG9VcHBlckNhc2UoKSA9PT0gXCJTWVNURU1cIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4dGVybmFsIGVudGl0aWVzIGFyZSBub3Qgc3VwcG9ydGVkXCIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh4bWxEYXRhW2ldID09PSBcIiVcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlBhcmFtZXRlciBlbnRpdGllcyBhcmUgbm90IHN1cHBvcnRlZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlYWQgZW50aXR5IHZhbHVlIChpbnRlcm5hbCBlbnRpdHkpXG4gICAgICAgIGxldCBlbnRpdHlWYWx1ZSA9IFwiXCI7XG4gICAgICAgIFtpLCBlbnRpdHlWYWx1ZV0gPSB0aGlzLnJlYWRJZGVudGlmaWVyVmFsKHhtbERhdGEsIGksIFwiZW50aXR5XCIpO1xuXG4gICAgICAgIC8vIFZhbGlkYXRlIGVudGl0eSBzaXplXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZW5hYmxlZCAhPT0gZmFsc2UgJiZcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5tYXhFbnRpdHlTaXplICE9IG51bGwgJiZcbiAgICAgICAgICAgIGVudGl0eVZhbHVlLmxlbmd0aCA+IHRoaXMub3B0aW9ucy5tYXhFbnRpdHlTaXplKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgYEVudGl0eSBcIiR7ZW50aXR5TmFtZX1cIiBzaXplICgke2VudGl0eVZhbHVlLmxlbmd0aH0pIGV4Y2VlZHMgbWF4aW11bSBhbGxvd2VkIHNpemUgKCR7dGhpcy5vcHRpb25zLm1heEVudGl0eVNpemV9KWBcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpLS07XG4gICAgICAgIHJldHVybiBbZW50aXR5TmFtZSwgZW50aXR5VmFsdWUsIGldO1xuICAgIH1cblxuICAgIHJlYWROb3RhdGlvbkV4cCh4bWxEYXRhLCBpKSB7XG4gICAgICAgIC8vIFNraXAgbGVhZGluZyB3aGl0ZXNwYWNlIGFmdGVyIDwhTk9UQVRJT05cbiAgICAgICAgaSA9IHNraXBXaGl0ZXNwYWNlKHhtbERhdGEsIGkpO1xuXG4gICAgICAgIC8vIFJlYWQgbm90YXRpb24gbmFtZVxuICAgICAgICBsZXQgbm90YXRpb25OYW1lID0gXCJcIjtcbiAgICAgICAgd2hpbGUgKGkgPCB4bWxEYXRhLmxlbmd0aCAmJiAhL1xccy8udGVzdCh4bWxEYXRhW2ldKSkge1xuICAgICAgICAgICAgbm90YXRpb25OYW1lICs9IHhtbERhdGFbaV07XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgIXRoaXMuc3VwcHJlc3NWYWxpZGF0aW9uRXJyICYmIHZhbGlkYXRlRW50aXR5TmFtZShub3RhdGlvbk5hbWUpO1xuXG4gICAgICAgIC8vIFNraXAgd2hpdGVzcGFjZSBhZnRlciBub3RhdGlvbiBuYW1lXG4gICAgICAgIGkgPSBza2lwV2hpdGVzcGFjZSh4bWxEYXRhLCBpKTtcblxuICAgICAgICAvLyBDaGVjayBpZGVudGlmaWVyIHR5cGUgKFNZU1RFTSBvciBQVUJMSUMpXG4gICAgICAgIGNvbnN0IGlkZW50aWZpZXJUeXBlID0geG1sRGF0YS5zdWJzdHJpbmcoaSwgaSArIDYpLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIGlmICghdGhpcy5zdXBwcmVzc1ZhbGlkYXRpb25FcnIgJiYgaWRlbnRpZmllclR5cGUgIT09IFwiU1lTVEVNXCIgJiYgaWRlbnRpZmllclR5cGUgIT09IFwiUFVCTElDXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgU1lTVEVNIG9yIFBVQkxJQywgZm91bmQgXCIke2lkZW50aWZpZXJUeXBlfVwiYCk7XG4gICAgICAgIH1cbiAgICAgICAgaSArPSBpZGVudGlmaWVyVHlwZS5sZW5ndGg7XG5cbiAgICAgICAgLy8gU2tpcCB3aGl0ZXNwYWNlIGFmdGVyIGlkZW50aWZpZXIgdHlwZVxuICAgICAgICBpID0gc2tpcFdoaXRlc3BhY2UoeG1sRGF0YSwgaSk7XG5cbiAgICAgICAgLy8gUmVhZCBwdWJsaWMgaWRlbnRpZmllciAoaWYgUFVCTElDKVxuICAgICAgICBsZXQgcHVibGljSWRlbnRpZmllciA9IG51bGw7XG4gICAgICAgIGxldCBzeXN0ZW1JZGVudGlmaWVyID0gbnVsbDtcblxuICAgICAgICBpZiAoaWRlbnRpZmllclR5cGUgPT09IFwiUFVCTElDXCIpIHtcbiAgICAgICAgICAgIFtpLCBwdWJsaWNJZGVudGlmaWVyXSA9IHRoaXMucmVhZElkZW50aWZpZXJWYWwoeG1sRGF0YSwgaSwgXCJwdWJsaWNJZGVudGlmaWVyXCIpO1xuXG4gICAgICAgICAgICAvLyBTa2lwIHdoaXRlc3BhY2UgYWZ0ZXIgcHVibGljIGlkZW50aWZpZXJcbiAgICAgICAgICAgIGkgPSBza2lwV2hpdGVzcGFjZSh4bWxEYXRhLCBpKTtcblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSByZWFkIHN5c3RlbSBpZGVudGlmaWVyXG4gICAgICAgICAgICBpZiAoeG1sRGF0YVtpXSA9PT0gJ1wiJyB8fCB4bWxEYXRhW2ldID09PSBcIidcIikge1xuICAgICAgICAgICAgICAgIFtpLCBzeXN0ZW1JZGVudGlmaWVyXSA9IHRoaXMucmVhZElkZW50aWZpZXJWYWwoeG1sRGF0YSwgaSwgXCJzeXN0ZW1JZGVudGlmaWVyXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGlkZW50aWZpZXJUeXBlID09PSBcIlNZU1RFTVwiKSB7XG4gICAgICAgICAgICAvLyBSZWFkIHN5c3RlbSBpZGVudGlmaWVyIChtYW5kYXRvcnkgZm9yIFNZU1RFTSlcbiAgICAgICAgICAgIFtpLCBzeXN0ZW1JZGVudGlmaWVyXSA9IHRoaXMucmVhZElkZW50aWZpZXJWYWwoeG1sRGF0YSwgaSwgXCJzeXN0ZW1JZGVudGlmaWVyXCIpO1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMuc3VwcHJlc3NWYWxpZGF0aW9uRXJyICYmICFzeXN0ZW1JZGVudGlmaWVyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyBtYW5kYXRvcnkgc3lzdGVtIGlkZW50aWZpZXIgZm9yIFNZU1RFTSBub3RhdGlvblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7IG5vdGF0aW9uTmFtZSwgcHVibGljSWRlbnRpZmllciwgc3lzdGVtSWRlbnRpZmllciwgaW5kZXg6IC0taSB9O1xuICAgIH1cblxuICAgIHJlYWRJZGVudGlmaWVyVmFsKHhtbERhdGEsIGksIHR5cGUpIHtcbiAgICAgICAgbGV0IGlkZW50aWZpZXJWYWwgPSBcIlwiO1xuICAgICAgICBjb25zdCBzdGFydENoYXIgPSB4bWxEYXRhW2ldO1xuICAgICAgICBpZiAoc3RhcnRDaGFyICE9PSAnXCInICYmIHN0YXJ0Q2hhciAhPT0gXCInXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgcXVvdGVkIHN0cmluZywgZm91bmQgXCIke3N0YXJ0Q2hhcn1cImApO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcblxuICAgICAgICB3aGlsZSAoaSA8IHhtbERhdGEubGVuZ3RoICYmIHhtbERhdGFbaV0gIT09IHN0YXJ0Q2hhcikge1xuICAgICAgICAgICAgaWRlbnRpZmllclZhbCArPSB4bWxEYXRhW2ldO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHhtbERhdGFbaV0gIT09IHN0YXJ0Q2hhcikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnRlcm1pbmF0ZWQgJHt0eXBlfSB2YWx1ZWApO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICAgICAgcmV0dXJuIFtpLCBpZGVudGlmaWVyVmFsXTtcbiAgICB9XG5cbiAgICByZWFkRWxlbWVudEV4cCh4bWxEYXRhLCBpKSB7XG4gICAgICAgIC8vIDwhRUxFTUVOVCBiciBFTVBUWT5cbiAgICAgICAgLy8gPCFFTEVNRU5UIGRpdiBBTlk+XG4gICAgICAgIC8vIDwhRUxFTUVOVCB0aXRsZSAoI1BDREFUQSk+XG4gICAgICAgIC8vIDwhRUxFTUVOVCBib29rICh0aXRsZSwgYXV0aG9yKyk+XG4gICAgICAgIC8vIDwhRUxFTUVOVCBuYW1lIChjb250ZW50LW1vZGVsKT5cblxuICAgICAgICAvLyBTa2lwIGxlYWRpbmcgd2hpdGVzcGFjZSBhZnRlciA8IUVMRU1FTlRcbiAgICAgICAgaSA9IHNraXBXaGl0ZXNwYWNlKHhtbERhdGEsIGkpO1xuXG4gICAgICAgIC8vIFJlYWQgZWxlbWVudCBuYW1lXG4gICAgICAgIGxldCBlbGVtZW50TmFtZSA9IFwiXCI7XG4gICAgICAgIHdoaWxlIChpIDwgeG1sRGF0YS5sZW5ndGggJiYgIS9cXHMvLnRlc3QoeG1sRGF0YVtpXSkpIHtcbiAgICAgICAgICAgIGVsZW1lbnROYW1lICs9IHhtbERhdGFbaV07XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWxpZGF0ZSBlbGVtZW50IG5hbWVcbiAgICAgICAgaWYgKCF0aGlzLnN1cHByZXNzVmFsaWRhdGlvbkVyciAmJiAhdXRpbC5pc05hbWUoZWxlbWVudE5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZWxlbWVudCBuYW1lOiBcIiR7ZWxlbWVudE5hbWV9XCJgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNraXAgd2hpdGVzcGFjZSBhZnRlciBlbGVtZW50IG5hbWVcbiAgICAgICAgaSA9IHNraXBXaGl0ZXNwYWNlKHhtbERhdGEsIGkpO1xuICAgICAgICBsZXQgY29udGVudE1vZGVsID0gXCJcIjtcblxuICAgICAgICAvLyBFeHBlY3QgJygnIHRvIHN0YXJ0IGNvbnRlbnQgbW9kZWxcbiAgICAgICAgaWYgKHhtbERhdGFbaV0gPT09IFwiRVwiICYmIGhhc1NlcSh4bWxEYXRhLCBcIk1QVFlcIiwgaSkpIHtcbiAgICAgICAgICAgIGkgKz0gNDtcbiAgICAgICAgfSBlbHNlIGlmICh4bWxEYXRhW2ldID09PSBcIkFcIiAmJiBoYXNTZXEoeG1sRGF0YSwgXCJOWVwiLCBpKSkge1xuICAgICAgICAgICAgaSArPSAyO1xuICAgICAgICB9IGVsc2UgaWYgKHhtbERhdGFbaV0gPT09IFwiKFwiKSB7XG4gICAgICAgICAgICBpKys7IC8vIE1vdmUgcGFzdCAnKCdcblxuICAgICAgICAgICAgLy8gUmVhZCBjb250ZW50IG1vZGVsXG4gICAgICAgICAgICB3aGlsZSAoaSA8IHhtbERhdGEubGVuZ3RoICYmIHhtbERhdGFbaV0gIT09IFwiKVwiKSB7XG4gICAgICAgICAgICAgICAgY29udGVudE1vZGVsICs9IHhtbERhdGFbaV07XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHhtbERhdGFbaV0gIT09IFwiKVwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW50ZXJtaW5hdGVkIGNvbnRlbnQgbW9kZWxcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuc3VwcHJlc3NWYWxpZGF0aW9uRXJyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgRWxlbWVudCBFeHByZXNzaW9uLCBmb3VuZCBcIiR7eG1sRGF0YVtpXX1cImApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGVsZW1lbnROYW1lLFxuICAgICAgICAgICAgY29udGVudE1vZGVsOiBjb250ZW50TW9kZWwudHJpbSgpLFxuICAgICAgICAgICAgaW5kZXg6IGlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZWFkQXR0bGlzdEV4cCh4bWxEYXRhLCBpKSB7XG4gICAgICAgIC8vIFNraXAgbGVhZGluZyB3aGl0ZXNwYWNlIGFmdGVyIDwhQVRUTElTVFxuICAgICAgICBpID0gc2tpcFdoaXRlc3BhY2UoeG1sRGF0YSwgaSk7XG5cbiAgICAgICAgLy8gUmVhZCBlbGVtZW50IG5hbWVcbiAgICAgICAgbGV0IGVsZW1lbnROYW1lID0gXCJcIjtcbiAgICAgICAgd2hpbGUgKGkgPCB4bWxEYXRhLmxlbmd0aCAmJiAhL1xccy8udGVzdCh4bWxEYXRhW2ldKSkge1xuICAgICAgICAgICAgZWxlbWVudE5hbWUgKz0geG1sRGF0YVtpXTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbGlkYXRlIGVsZW1lbnQgbmFtZVxuICAgICAgICB2YWxpZGF0ZUVudGl0eU5hbWUoZWxlbWVudE5hbWUpO1xuXG4gICAgICAgIC8vIFNraXAgd2hpdGVzcGFjZSBhZnRlciBlbGVtZW50IG5hbWVcbiAgICAgICAgaSA9IHNraXBXaGl0ZXNwYWNlKHhtbERhdGEsIGkpO1xuXG4gICAgICAgIC8vIFJlYWQgYXR0cmlidXRlIG5hbWVcbiAgICAgICAgbGV0IGF0dHJpYnV0ZU5hbWUgPSBcIlwiO1xuICAgICAgICB3aGlsZSAoaSA8IHhtbERhdGEubGVuZ3RoICYmICEvXFxzLy50ZXN0KHhtbERhdGFbaV0pKSB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVOYW1lICs9IHhtbERhdGFbaV07XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWxpZGF0ZSBhdHRyaWJ1dGUgbmFtZVxuICAgICAgICBpZiAoIXZhbGlkYXRlRW50aXR5TmFtZShhdHRyaWJ1dGVOYW1lKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGF0dHJpYnV0ZSBuYW1lOiBcIiR7YXR0cmlidXRlTmFtZX1cImApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2tpcCB3aGl0ZXNwYWNlIGFmdGVyIGF0dHJpYnV0ZSBuYW1lXG4gICAgICAgIGkgPSBza2lwV2hpdGVzcGFjZSh4bWxEYXRhLCBpKTtcblxuICAgICAgICAvLyBSZWFkIGF0dHJpYnV0ZSB0eXBlXG4gICAgICAgIGxldCBhdHRyaWJ1dGVUeXBlID0gXCJcIjtcbiAgICAgICAgaWYgKHhtbERhdGEuc3Vic3RyaW5nKGksIGkgKyA4KS50b1VwcGVyQ2FzZSgpID09PSBcIk5PVEFUSU9OXCIpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZVR5cGUgPSBcIk5PVEFUSU9OXCI7XG4gICAgICAgICAgICBpICs9IDg7IC8vIE1vdmUgcGFzdCBcIk5PVEFUSU9OXCJcblxuICAgICAgICAgICAgLy8gU2tpcCB3aGl0ZXNwYWNlIGFmdGVyIFwiTk9UQVRJT05cIlxuICAgICAgICAgICAgaSA9IHNraXBXaGl0ZXNwYWNlKHhtbERhdGEsIGkpO1xuXG4gICAgICAgICAgICAvLyBFeHBlY3QgJygnIHRvIHN0YXJ0IHRoZSBsaXN0IG9mIG5vdGF0aW9uc1xuICAgICAgICAgICAgaWYgKHhtbERhdGFbaV0gIT09IFwiKFwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCAnKCcsIGZvdW5kIFwiJHt4bWxEYXRhW2ldfVwiYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7IC8vIE1vdmUgcGFzdCAnKCdcblxuICAgICAgICAgICAgLy8gUmVhZCB0aGUgbGlzdCBvZiBhbGxvd2VkIG5vdGF0aW9uc1xuICAgICAgICAgICAgbGV0IGFsbG93ZWROb3RhdGlvbnMgPSBbXTtcbiAgICAgICAgICAgIHdoaWxlIChpIDwgeG1sRGF0YS5sZW5ndGggJiYgeG1sRGF0YVtpXSAhPT0gXCIpXCIpIHtcbiAgICAgICAgICAgICAgICBsZXQgbm90YXRpb24gPSBcIlwiO1xuICAgICAgICAgICAgICAgIHdoaWxlIChpIDwgeG1sRGF0YS5sZW5ndGggJiYgeG1sRGF0YVtpXSAhPT0gXCJ8XCIgJiYgeG1sRGF0YVtpXSAhPT0gXCIpXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbm90YXRpb24gKz0geG1sRGF0YVtpXTtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFZhbGlkYXRlIG5vdGF0aW9uIG5hbWVcbiAgICAgICAgICAgICAgICBub3RhdGlvbiA9IG5vdGF0aW9uLnRyaW0oKTtcbiAgICAgICAgICAgICAgICBpZiAoIXZhbGlkYXRlRW50aXR5TmFtZShub3RhdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIG5vdGF0aW9uIG5hbWU6IFwiJHtub3RhdGlvbn1cImApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGFsbG93ZWROb3RhdGlvbnMucHVzaChub3RhdGlvbik7XG5cbiAgICAgICAgICAgICAgICAvLyBTa2lwICd8JyBzZXBhcmF0b3Igb3IgZXhpdCBsb29wXG4gICAgICAgICAgICAgICAgaWYgKHhtbERhdGFbaV0gPT09IFwifFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGkrKzsgLy8gTW92ZSBwYXN0ICd8J1xuICAgICAgICAgICAgICAgICAgICBpID0gc2tpcFdoaXRlc3BhY2UoeG1sRGF0YSwgaSk7IC8vIFNraXAgb3B0aW9uYWwgd2hpdGVzcGFjZSBhZnRlciAnfCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh4bWxEYXRhW2ldICE9PSBcIilcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVudGVybWluYXRlZCBsaXN0IG9mIG5vdGF0aW9uc1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkrKzsgLy8gTW92ZSBwYXN0ICcpJ1xuXG4gICAgICAgICAgICAvLyBTdG9yZSB0aGUgYWxsb3dlZCBub3RhdGlvbnMgYXMgcGFydCBvZiB0aGUgYXR0cmlidXRlIHR5cGVcbiAgICAgICAgICAgIGF0dHJpYnV0ZVR5cGUgKz0gXCIgKFwiICsgYWxsb3dlZE5vdGF0aW9ucy5qb2luKFwifFwiKSArIFwiKVwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gSGFuZGxlIHNpbXBsZSB0eXBlcyAoZS5nLiwgQ0RBVEEsIElELCBJRFJFRiwgZXRjLilcbiAgICAgICAgICAgIHdoaWxlIChpIDwgeG1sRGF0YS5sZW5ndGggJiYgIS9cXHMvLnRlc3QoeG1sRGF0YVtpXSkpIHtcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVUeXBlICs9IHhtbERhdGFbaV07XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBWYWxpZGF0ZSBzaW1wbGUgYXR0cmlidXRlIHR5cGVcbiAgICAgICAgICAgIGNvbnN0IHZhbGlkVHlwZXMgPSBbXCJDREFUQVwiLCBcIklEXCIsIFwiSURSRUZcIiwgXCJJRFJFRlNcIiwgXCJFTlRJVFlcIiwgXCJFTlRJVElFU1wiLCBcIk5NVE9LRU5cIiwgXCJOTVRPS0VOU1wiXTtcbiAgICAgICAgICAgIGlmICghdGhpcy5zdXBwcmVzc1ZhbGlkYXRpb25FcnIgJiYgIXZhbGlkVHlwZXMuaW5jbHVkZXMoYXR0cmlidXRlVHlwZS50b1VwcGVyQ2FzZSgpKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBhdHRyaWJ1dGUgdHlwZTogXCIke2F0dHJpYnV0ZVR5cGV9XCJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNraXAgd2hpdGVzcGFjZSBhZnRlciBhdHRyaWJ1dGUgdHlwZVxuICAgICAgICBpID0gc2tpcFdoaXRlc3BhY2UoeG1sRGF0YSwgaSk7XG5cbiAgICAgICAgLy8gUmVhZCBkZWZhdWx0IHZhbHVlXG4gICAgICAgIGxldCBkZWZhdWx0VmFsdWUgPSBcIlwiO1xuICAgICAgICBpZiAoeG1sRGF0YS5zdWJzdHJpbmcoaSwgaSArIDgpLnRvVXBwZXJDYXNlKCkgPT09IFwiI1JFUVVJUkVEXCIpIHtcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSA9IFwiI1JFUVVJUkVEXCI7XG4gICAgICAgICAgICBpICs9IDg7XG4gICAgICAgIH0gZWxzZSBpZiAoeG1sRGF0YS5zdWJzdHJpbmcoaSwgaSArIDcpLnRvVXBwZXJDYXNlKCkgPT09IFwiI0lNUExJRURcIikge1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlID0gXCIjSU1QTElFRFwiO1xuICAgICAgICAgICAgaSArPSA3O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgW2ksIGRlZmF1bHRWYWx1ZV0gPSB0aGlzLnJlYWRJZGVudGlmaWVyVmFsKHhtbERhdGEsIGksIFwiQVRUTElTVFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlbGVtZW50TmFtZSxcbiAgICAgICAgICAgIGF0dHJpYnV0ZU5hbWUsXG4gICAgICAgICAgICBhdHRyaWJ1dGVUeXBlLFxuICAgICAgICAgICAgZGVmYXVsdFZhbHVlLFxuICAgICAgICAgICAgaW5kZXg6IGlcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbi8vIEhlbHBlciBmdW5jdGlvbnNcbmNvbnN0IHNraXBXaGl0ZXNwYWNlID0gKGRhdGEsIGluZGV4KSA9PiB7XG4gICAgd2hpbGUgKGluZGV4IDwgZGF0YS5sZW5ndGggJiYgL1xccy8udGVzdChkYXRhW2luZGV4XSkpIHtcbiAgICAgICAgaW5kZXgrKztcbiAgICB9XG4gICAgcmV0dXJuIGluZGV4O1xufTtcblxuZnVuY3Rpb24gaGFzU2VxKGRhdGEsIHNlcSwgaSkge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgc2VxLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChzZXFbal0gIT09IGRhdGFbaSArIGogKyAxXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVFbnRpdHlOYW1lKG5hbWUpIHtcbiAgICBpZiAodXRpbC5pc05hbWUobmFtZSkpXG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIGVsc2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGVudGl0eSBuYW1lICR7bmFtZX1gKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBEb2NUeXBlUmVhZGVyOyIsICJjb25zdCBoZXhSZWdleCA9IC9eWy0rXT8weFthLWZBLUYwLTldKyQvO1xuY29uc3QgbnVtUmVnZXggPSAvXihbXFwtXFwrXSk/KDAqKShbMC05XSooXFwuWzAtOV0qKT8pJC87XG4vLyBjb25zdCBvY3RSZWdleCA9IC9eMHhbYS16MC05XSsvO1xuLy8gY29uc3QgYmluUmVnZXggPSAvMHhbYS16MC05XSsvO1xuXG4gXG5jb25zdCBjb25zaWRlciA9IHtcbiAgICBoZXggOiAgdHJ1ZSxcbiAgICAvLyBvY3Q6IGZhbHNlLFxuICAgIGxlYWRpbmdaZXJvczogdHJ1ZSxcbiAgICBkZWNpbWFsUG9pbnQ6IFwiXFwuXCIsXG4gICAgZU5vdGF0aW9uOiB0cnVlLFxuICAgIC8vc2tpcExpa2U6IC9yZWdleC9cbn07XG5cbmZ1bmN0aW9uIHRvTnVtYmVyKHN0ciwgb3B0aW9ucyA9IHt9KXtcbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgY29uc2lkZXIsIG9wdGlvbnMgKTtcbiAgICBpZighc3RyIHx8IHR5cGVvZiBzdHIgIT09IFwic3RyaW5nXCIgKSByZXR1cm4gc3RyO1xuICAgIFxuICAgIGxldCB0cmltbWVkU3RyICA9IHN0ci50cmltKCk7XG4gICAgXG4gICAgaWYob3B0aW9ucy5za2lwTGlrZSAhPT0gdW5kZWZpbmVkICYmIG9wdGlvbnMuc2tpcExpa2UudGVzdCh0cmltbWVkU3RyKSkgcmV0dXJuIHN0cjtcbiAgICBlbHNlIGlmKHN0cj09PVwiMFwiKSByZXR1cm4gMDtcbiAgICBlbHNlIGlmIChvcHRpb25zLmhleCAmJiBoZXhSZWdleC50ZXN0KHRyaW1tZWRTdHIpKSB7XG4gICAgICAgIHJldHVybiBwYXJzZV9pbnQodHJpbW1lZFN0ciwgMTYpO1xuICAgIC8vIH1lbHNlIGlmIChvcHRpb25zLm9jdCAmJiBvY3RSZWdleC50ZXN0KHN0cikpIHtcbiAgICAvLyAgICAgcmV0dXJuIE51bWJlci5wYXJzZUludCh2YWwsIDgpO1xuICAgIH1lbHNlIGlmICh0cmltbWVkU3RyLnNlYXJjaCgvW2VFXS8pIT09IC0xKSB7IC8vZU5vdGF0aW9uXG4gICAgICAgIGNvbnN0IG5vdGF0aW9uID0gdHJpbW1lZFN0ci5tYXRjaCgvXihbLVxcK10pPygwKikoWzAtOV0qKFxcLlswLTldKik/W2VFXVstXFwrXT9bMC05XSspJC8pOyBcbiAgICAgICAgLy8gKzAwLjEyMyA9PiBbICwgJysnLCAnMDAnLCAnLjEyMycsIC4uXG4gICAgICAgIGlmKG5vdGF0aW9uKXtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKG5vdGF0aW9uKVxuICAgICAgICAgICAgaWYob3B0aW9ucy5sZWFkaW5nWmVyb3MpeyAvL2FjY2VwdCB3aXRoIGxlYWRpbmcgemVyb3NcbiAgICAgICAgICAgICAgICB0cmltbWVkU3RyID0gKG5vdGF0aW9uWzFdIHx8IFwiXCIpICsgbm90YXRpb25bM107XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBpZihub3RhdGlvblsyXSA9PT0gXCIwXCIgJiYgbm90YXRpb25bM11bMF09PT0gXCIuXCIpeyAvL3ZhbGlkIG51bWJlclxuICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmVOb3RhdGlvbiA/IE51bWJlcih0cmltbWVkU3RyKSA6IHN0cjtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgLy8gfWVsc2UgaWYgKG9wdGlvbnMucGFyc2VCaW4gJiYgYmluUmVnZXgudGVzdChzdHIpKSB7XG4gICAgLy8gICAgIHJldHVybiBOdW1iZXIucGFyc2VJbnQodmFsLCAyKTtcbiAgICB9ZWxzZXtcbiAgICAgICAgLy9zZXBhcmF0ZSBuZWdhdGl2ZSBzaWduLCBsZWFkaW5nIHplcm9zLCBhbmQgcmVzdCBudW1iZXJcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBudW1SZWdleC5leGVjKHRyaW1tZWRTdHIpO1xuICAgICAgICAvLyArMDAuMTIzID0+IFsgLCAnKycsICcwMCcsICcuMTIzJywgLi5cbiAgICAgICAgaWYobWF0Y2gpe1xuICAgICAgICAgICAgY29uc3Qgc2lnbiA9IG1hdGNoWzFdO1xuICAgICAgICAgICAgY29uc3QgbGVhZGluZ1plcm9zID0gbWF0Y2hbMl07XG4gICAgICAgICAgICBsZXQgbnVtVHJpbW1lZEJ5WmVyb3MgPSB0cmltWmVyb3MobWF0Y2hbM10pOyAvL2NvbXBsZXRlIG51bSB3aXRob3V0IGxlYWRpbmcgemVyb3NcbiAgICAgICAgICAgIC8vdHJpbSBlbmRpbmcgemVyb3MgZm9yIGZsb2F0aW5nIG51bWJlclxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZighb3B0aW9ucy5sZWFkaW5nWmVyb3MgJiYgbGVhZGluZ1plcm9zLmxlbmd0aCA+IDAgJiYgc2lnbiAmJiB0cmltbWVkU3RyWzJdICE9PSBcIi5cIikgcmV0dXJuIHN0cjsgLy8tMDEyM1xuICAgICAgICAgICAgZWxzZSBpZighb3B0aW9ucy5sZWFkaW5nWmVyb3MgJiYgbGVhZGluZ1plcm9zLmxlbmd0aCA+IDAgJiYgIXNpZ24gJiYgdHJpbW1lZFN0clsxXSAhPT0gXCIuXCIpIHJldHVybiBzdHI7IC8vMDEyM1xuICAgICAgICAgICAgZWxzZSBpZihvcHRpb25zLmxlYWRpbmdaZXJvcyAmJiBsZWFkaW5nWmVyb3M9PT1zdHIpIHJldHVybiAwOyAvLzAwXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGVsc2V7Ly9ubyBsZWFkaW5nIHplcm9zIG9yIGxlYWRpbmcgemVyb3MgYXJlIGFsbG93ZWRcbiAgICAgICAgICAgICAgICBjb25zdCBudW0gPSBOdW1iZXIodHJpbW1lZFN0cik7XG4gICAgICAgICAgICAgICAgY29uc3QgbnVtU3RyID0gXCJcIiArIG51bTtcblxuICAgICAgICAgICAgICAgIGlmKG51bVN0ci5zZWFyY2goL1tlRV0vKSAhPT0gLTEpeyAvL2dpdmVuIG51bWJlciBpcyBsb25nIGFuZCBwYXJzZWQgdG8gZU5vdGF0aW9uXG4gICAgICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMuZU5vdGF0aW9uKSByZXR1cm4gbnVtO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIHJldHVybiBzdHI7XG4gICAgICAgICAgICAgICAgfWVsc2UgaWYodHJpbW1lZFN0ci5pbmRleE9mKFwiLlwiKSAhPT0gLTEpeyAvL2Zsb2F0aW5nIG51bWJlclxuICAgICAgICAgICAgICAgICAgICBpZihudW1TdHIgPT09IFwiMFwiICYmIChudW1UcmltbWVkQnlaZXJvcyA9PT0gXCJcIikgKSByZXR1cm4gbnVtOyAvLzAuMFxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmKG51bVN0ciA9PT0gbnVtVHJpbW1lZEJ5WmVyb3MpIHJldHVybiBudW07IC8vMC40NTYuIDAuNzkwMDBcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiggc2lnbiAmJiBudW1TdHIgPT09IFwiLVwiK251bVRyaW1tZWRCeVplcm9zKSByZXR1cm4gbnVtO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIHJldHVybiBzdHI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmKGxlYWRpbmdaZXJvcyl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAobnVtVHJpbW1lZEJ5WmVyb3MgPT09IG51bVN0cikgfHwgKHNpZ24rbnVtVHJpbW1lZEJ5WmVyb3MgPT09IG51bVN0cikgPyBudW0gOiBzdHJcbiAgICAgICAgICAgICAgICB9ZWxzZSAge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHRyaW1tZWRTdHIgPT09IG51bVN0cikgfHwgKHRyaW1tZWRTdHIgPT09IHNpZ24rbnVtU3RyKSA/IG51bSA6IHN0clxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfWVsc2V7IC8vbm9uLW51bWVyaWMgc3RyaW5nXG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIFxuICogQHBhcmFtIHtzdHJpbmd9IG51bVN0ciB3aXRob3V0IGxlYWRpbmcgemVyb3NcbiAqIEByZXR1cm5zIFxuICovXG5mdW5jdGlvbiB0cmltWmVyb3MobnVtU3RyKXtcbiAgICBpZihudW1TdHIgJiYgbnVtU3RyLmluZGV4T2YoXCIuXCIpICE9PSAtMSl7Ly9mbG9hdFxuICAgICAgICBudW1TdHIgPSBudW1TdHIucmVwbGFjZSgvMCskLywgXCJcIik7IC8vcmVtb3ZlIGVuZGluZyB6ZXJvc1xuICAgICAgICBpZihudW1TdHIgPT09IFwiLlwiKSAgbnVtU3RyID0gXCIwXCI7XG4gICAgICAgIGVsc2UgaWYobnVtU3RyWzBdID09PSBcIi5cIikgIG51bVN0ciA9IFwiMFwiK251bVN0cjtcbiAgICAgICAgZWxzZSBpZihudW1TdHJbbnVtU3RyLmxlbmd0aC0xXSA9PT0gXCIuXCIpICBudW1TdHIgPSBudW1TdHIuc3Vic3RyKDAsbnVtU3RyLmxlbmd0aC0xKTtcbiAgICAgICAgcmV0dXJuIG51bVN0cjtcbiAgICB9XG4gICAgcmV0dXJuIG51bVN0cjtcbn1cblxuZnVuY3Rpb24gcGFyc2VfaW50KG51bVN0ciwgYmFzZSl7XG4gICAgLy9wb2x5ZmlsbFxuICAgIGlmKHBhcnNlSW50KSByZXR1cm4gcGFyc2VJbnQobnVtU3RyLCBiYXNlKTtcbiAgICBlbHNlIGlmKE51bWJlci5wYXJzZUludCkgcmV0dXJuIE51bWJlci5wYXJzZUludChudW1TdHIsIGJhc2UpO1xuICAgIGVsc2UgaWYod2luZG93ICYmIHdpbmRvdy5wYXJzZUludCkgcmV0dXJuIHdpbmRvdy5wYXJzZUludChudW1TdHIsIGJhc2UpO1xuICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKFwicGFyc2VJbnQsIE51bWJlci5wYXJzZUludCwgd2luZG93LnBhcnNlSW50IGFyZSBub3Qgc3VwcG9ydGVkXCIpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gdG9OdW1iZXI7IiwgImZ1bmN0aW9uIGdldElnbm9yZUF0dHJpYnV0ZXNGbihpZ25vcmVBdHRyaWJ1dGVzKSB7XG4gICAgaWYgKHR5cGVvZiBpZ25vcmVBdHRyaWJ1dGVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBpZ25vcmVBdHRyaWJ1dGVzXG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGlnbm9yZUF0dHJpYnV0ZXMpKSB7XG4gICAgICAgIHJldHVybiAoYXR0ck5hbWUpID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBpZ25vcmVBdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXR0ZXJuID09PSAnc3RyaW5nJyAmJiBhdHRyTmFtZSA9PT0gcGF0dGVybikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocGF0dGVybiBpbnN0YW5jZW9mIFJlZ0V4cCAmJiBwYXR0ZXJuLnRlc3QoYXR0ck5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiAoKSA9PiBmYWxzZVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldElnbm9yZUF0dHJpYnV0ZXNGbiIsICIndXNlIHN0cmljdCc7XG4vLy9AdHMtY2hlY2tcblxuY29uc3QgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcbmNvbnN0IHhtbE5vZGUgPSByZXF1aXJlKCcuL3htbE5vZGUnKTtcbmNvbnN0IERvY1R5cGVSZWFkZXIgPSByZXF1aXJlKCcuL0RvY1R5cGVSZWFkZXInKTtcbmNvbnN0IHRvTnVtYmVyID0gcmVxdWlyZShcInN0cm51bVwiKTtcbmNvbnN0IGdldElnbm9yZUF0dHJpYnV0ZXNGbiA9IHJlcXVpcmUoJy4uL2lnbm9yZUF0dHJpYnV0ZXMnKVxuXG4vLyBjb25zdCByZWd4ID1cbi8vICAgJzwoKCFcXFxcW0NEQVRBXFxcXFsoW1xcXFxzXFxcXFNdKj8pKF1dPikpfCgoTkFNRTopPyhOQU1FKSkoW14+XSopPnwoKFxcXFwvKShOQU1FKVxcXFxzKj4pKShbXjxdKiknXG4vLyAgIC5yZXBsYWNlKC9OQU1FL2csIHV0aWwubmFtZVJlZ2V4cCk7XG5cbi8vY29uc3QgdGFnc1JlZ3ggPSBuZXcgUmVnRXhwKFwiPChcXFxcLz9bXFxcXHc6XFxcXC1cXC5fXSspKFtePl0qKT4oXFxcXHMqXCIrY2RhdGFSZWd4K1wiKSooW148XSspP1wiLFwiZ1wiKTtcbi8vY29uc3QgdGFnc1JlZ3ggPSBuZXcgUmVnRXhwKFwiPChcXFxcLz8pKChcXFxcdyo6KT8oW1xcXFx3OlxcXFwtXFwuX10rKSkoW14+XSopPihbXjxdKikoXCIrY2RhdGFSZWd4K1wiKFtePF0qKSkqKFtePF0rKT9cIixcImdcIik7XG5cbmNsYXNzIE9yZGVyZWRPYmpQYXJzZXIge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmN1cnJlbnROb2RlID0gbnVsbDtcbiAgICB0aGlzLnRhZ3NOb2RlU3RhY2sgPSBbXTtcbiAgICB0aGlzLmRvY1R5cGVFbnRpdGllcyA9IHt9O1xuICAgIHRoaXMubGFzdEVudGl0aWVzID0ge1xuICAgICAgXCJhcG9zXCI6IHsgcmVnZXg6IC8mKGFwb3N8IzM5fCN4MjcpOy9nLCB2YWw6IFwiJ1wiIH0sXG4gICAgICBcImd0XCI6IHsgcmVnZXg6IC8mKGd0fCM2MnwjeDNFKTsvZywgdmFsOiBcIj5cIiB9LFxuICAgICAgXCJsdFwiOiB7IHJlZ2V4OiAvJihsdHwjNjB8I3gzQyk7L2csIHZhbDogXCI8XCIgfSxcbiAgICAgIFwicXVvdFwiOiB7IHJlZ2V4OiAvJihxdW90fCMzNHwjeDIyKTsvZywgdmFsOiBcIlxcXCJcIiB9LFxuICAgIH07XG4gICAgdGhpcy5hbXBFbnRpdHkgPSB7IHJlZ2V4OiAvJihhbXB8IzM4fCN4MjYpOy9nLCB2YWw6IFwiJlwiIH07XG4gICAgdGhpcy5odG1sRW50aXRpZXMgPSB7XG4gICAgICBcInNwYWNlXCI6IHsgcmVnZXg6IC8mKG5ic3B8IzE2MCk7L2csIHZhbDogXCIgXCIgfSxcbiAgICAgIC8vIFwibHRcIiA6IHsgcmVnZXg6IC8mKGx0fCM2MCk7L2csIHZhbDogXCI8XCIgfSxcbiAgICAgIC8vIFwiZ3RcIiA6IHsgcmVnZXg6IC8mKGd0fCM2Mik7L2csIHZhbDogXCI+XCIgfSxcbiAgICAgIC8vIFwiYW1wXCIgOiB7IHJlZ2V4OiAvJihhbXB8IzM4KTsvZywgdmFsOiBcIiZcIiB9LFxuICAgICAgLy8gXCJxdW90XCIgOiB7IHJlZ2V4OiAvJihxdW90fCMzNCk7L2csIHZhbDogXCJcXFwiXCIgfSxcbiAgICAgIC8vIFwiYXBvc1wiIDogeyByZWdleDogLyYoYXBvc3wjMzkpOy9nLCB2YWw6IFwiJ1wiIH0sXG4gICAgICBcImNlbnRcIjogeyByZWdleDogLyYoY2VudHwjMTYyKTsvZywgdmFsOiBcIlx1MDBBMlwiIH0sXG4gICAgICBcInBvdW5kXCI6IHsgcmVnZXg6IC8mKHBvdW5kfCMxNjMpOy9nLCB2YWw6IFwiXHUwMEEzXCIgfSxcbiAgICAgIFwieWVuXCI6IHsgcmVnZXg6IC8mKHllbnwjMTY1KTsvZywgdmFsOiBcIlx1MDBBNVwiIH0sXG4gICAgICBcImV1cm9cIjogeyByZWdleDogLyYoZXVyb3wjODM2NCk7L2csIHZhbDogXCJcdTIwQUNcIiB9LFxuICAgICAgXCJjb3B5cmlnaHRcIjogeyByZWdleDogLyYoY29weXwjMTY5KTsvZywgdmFsOiBcIlx1MDBBOVwiIH0sXG4gICAgICBcInJlZ1wiOiB7IHJlZ2V4OiAvJihyZWd8IzE3NCk7L2csIHZhbDogXCJcdTAwQUVcIiB9LFxuICAgICAgXCJpbnJcIjogeyByZWdleDogLyYoaW5yfCM4Mzc3KTsvZywgdmFsOiBcIlx1MjBCOVwiIH0sXG4gICAgICBcIm51bV9kZWNcIjogeyByZWdleDogLyYjKFswLTldezEsN30pOy9nLCB2YWw6IChfLCBzdHIpID0+IGZyb21Db2RlUG9pbnQoc3RyLCAxMCwgXCImI1wiKSB9LFxuICAgICAgXCJudW1faGV4XCI6IHsgcmVnZXg6IC8mI3goWzAtOWEtZkEtRl17MSw2fSk7L2csIHZhbDogKF8sIHN0cikgPT4gZnJvbUNvZGVQb2ludChzdHIsIDE2LCBcIiYjeFwiKSB9LFxuICAgIH07XG4gICAgdGhpcy5hZGRFeHRlcm5hbEVudGl0aWVzID0gYWRkRXh0ZXJuYWxFbnRpdGllcztcbiAgICB0aGlzLnBhcnNlWG1sID0gcGFyc2VYbWw7XG4gICAgdGhpcy5wYXJzZVRleHREYXRhID0gcGFyc2VUZXh0RGF0YTtcbiAgICB0aGlzLnJlc29sdmVOYW1lU3BhY2UgPSByZXNvbHZlTmFtZVNwYWNlO1xuICAgIHRoaXMuYnVpbGRBdHRyaWJ1dGVzTWFwID0gYnVpbGRBdHRyaWJ1dGVzTWFwO1xuICAgIHRoaXMuaXNJdFN0b3BOb2RlID0gaXNJdFN0b3BOb2RlO1xuICAgIHRoaXMucmVwbGFjZUVudGl0aWVzVmFsdWUgPSByZXBsYWNlRW50aXRpZXNWYWx1ZTtcbiAgICB0aGlzLnJlYWRTdG9wTm9kZURhdGEgPSByZWFkU3RvcE5vZGVEYXRhO1xuICAgIHRoaXMuc2F2ZVRleHRUb1BhcmVudFRhZyA9IHNhdmVUZXh0VG9QYXJlbnRUYWc7XG4gICAgdGhpcy5hZGRDaGlsZCA9IGFkZENoaWxkO1xuICAgIHRoaXMuaWdub3JlQXR0cmlidXRlc0ZuID0gZ2V0SWdub3JlQXR0cmlidXRlc0ZuKHRoaXMub3B0aW9ucy5pZ25vcmVBdHRyaWJ1dGVzKVxuICAgIHRoaXMuZW50aXR5RXhwYW5zaW9uQ291bnQgPSAwO1xuICAgIHRoaXMuY3VycmVudEV4cGFuZGVkTGVuZ3RoID0gMDtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuc3RvcE5vZGVzICYmIHRoaXMub3B0aW9ucy5zdG9wTm9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5zdG9wTm9kZXNFeGFjdCA9IG5ldyBTZXQoKTtcbiAgICAgIHRoaXMuc3RvcE5vZGVzV2lsZGNhcmQgPSBuZXcgU2V0KCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy5zdG9wTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qgc3RvcE5vZGVFeHAgPSB0aGlzLm9wdGlvbnMuc3RvcE5vZGVzW2ldO1xuICAgICAgICBpZiAodHlwZW9mIHN0b3BOb2RlRXhwICE9PSAnc3RyaW5nJykgY29udGludWU7XG4gICAgICAgIGlmIChzdG9wTm9kZUV4cC5zdGFydHNXaXRoKFwiKi5cIikpIHtcbiAgICAgICAgICB0aGlzLnN0b3BOb2Rlc1dpbGRjYXJkLmFkZChzdG9wTm9kZUV4cC5zdWJzdHJpbmcoMikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuc3RvcE5vZGVzRXhhY3QuYWRkKHN0b3BOb2RlRXhwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG59XG5cbmZ1bmN0aW9uIGFkZEV4dGVybmFsRW50aXRpZXMoZXh0ZXJuYWxFbnRpdGllcykge1xuICBjb25zdCBlbnRLZXlzID0gT2JqZWN0LmtleXMoZXh0ZXJuYWxFbnRpdGllcyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZW50S2V5cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGVudCA9IGVudEtleXNbaV07XG4gICAgY29uc3QgZXNjYXBlZCA9IGVudC5yZXBsYWNlKC9bLlxcLSsqOl0vZywgJ1xcXFwuJyk7XG4gICAgdGhpcy5sYXN0RW50aXRpZXNbZW50XSA9IHtcbiAgICAgIHJlZ2V4OiBuZXcgUmVnRXhwKFwiJlwiICsgZXNjYXBlZCArIFwiO1wiLCBcImdcIiksXG4gICAgICB2YWw6IGV4dGVybmFsRW50aXRpZXNbZW50XVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWxcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWdOYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30galBhdGhcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gZG9udFRyaW1cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaGFzQXR0cmlidXRlc1xuICogQHBhcmFtIHtib29sZWFufSBpc0xlYWZOb2RlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGVzY2FwZUVudGl0aWVzXG4gKi9cbmZ1bmN0aW9uIHBhcnNlVGV4dERhdGEodmFsLCB0YWdOYW1lLCBqUGF0aCwgZG9udFRyaW0sIGhhc0F0dHJpYnV0ZXMsIGlzTGVhZk5vZGUsIGVzY2FwZUVudGl0aWVzKSB7XG4gIGlmICh2YWwgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMudHJpbVZhbHVlcyAmJiAhZG9udFRyaW0pIHtcbiAgICAgIHZhbCA9IHZhbC50cmltKCk7XG4gICAgfVxuICAgIGlmICh2YWwubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKCFlc2NhcGVFbnRpdGllcykgdmFsID0gdGhpcy5yZXBsYWNlRW50aXRpZXNWYWx1ZSh2YWwsIHRhZ05hbWUsIGpQYXRoKTtcblxuICAgICAgY29uc3QgbmV3dmFsID0gdGhpcy5vcHRpb25zLnRhZ1ZhbHVlUHJvY2Vzc29yKHRhZ05hbWUsIHZhbCwgalBhdGgsIGhhc0F0dHJpYnV0ZXMsIGlzTGVhZk5vZGUpO1xuICAgICAgaWYgKG5ld3ZhbCA9PT0gbnVsbCB8fCBuZXd2YWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvL2Rvbid0IHBhcnNlXG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBuZXd2YWwgIT09IHR5cGVvZiB2YWwgfHwgbmV3dmFsICE9PSB2YWwpIHtcbiAgICAgICAgLy9vdmVyd3JpdGVcbiAgICAgICAgcmV0dXJuIG5ld3ZhbDtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnRyaW1WYWx1ZXMpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlVmFsdWUodmFsLCB0aGlzLm9wdGlvbnMucGFyc2VUYWdWYWx1ZSwgdGhpcy5vcHRpb25zLm51bWJlclBhcnNlT3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB0cmltbWVkVmFsID0gdmFsLnRyaW0oKTtcbiAgICAgICAgaWYgKHRyaW1tZWRWYWwgPT09IHZhbCkge1xuICAgICAgICAgIHJldHVybiBwYXJzZVZhbHVlKHZhbCwgdGhpcy5vcHRpb25zLnBhcnNlVGFnVmFsdWUsIHRoaXMub3B0aW9ucy5udW1iZXJQYXJzZU9wdGlvbnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU5hbWVTcGFjZSh0YWduYW1lKSB7XG4gIGlmICh0aGlzLm9wdGlvbnMucmVtb3ZlTlNQcmVmaXgpIHtcbiAgICBjb25zdCB0YWdzID0gdGFnbmFtZS5zcGxpdCgnOicpO1xuICAgIGNvbnN0IHByZWZpeCA9IHRhZ25hbWUuY2hhckF0KDApID09PSAnLycgPyAnLycgOiAnJztcbiAgICBpZiAodGFnc1swXSA9PT0gJ3htbG5zJykge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICBpZiAodGFncy5sZW5ndGggPT09IDIpIHtcbiAgICAgIHRhZ25hbWUgPSBwcmVmaXggKyB0YWdzWzFdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGFnbmFtZTtcbn1cblxuLy9UT0RPOiBjaGFuZ2UgcmVnZXggdG8gY2FwdHVyZSBOU1xuLy9jb25zdCBhdHRyc1JlZ3ggPSBuZXcgUmVnRXhwKFwiKFtcXFxcd1xcXFwtXFxcXC5cXFxcOl0rKVxcXFxzKj1cXFxccyooWydcXFwiXSkoKC58XFxuKSo/KVxcXFwyXCIsXCJnbVwiKTtcbmNvbnN0IGF0dHJzUmVneCA9IG5ldyBSZWdFeHAoJyhbXlxcXFxzPV0rKVxcXFxzKig9XFxcXHMqKFtcXCdcIl0pKFtcXFxcc1xcXFxTXSo/KVxcXFwzKT8nLCAnZ20nKTtcblxuZnVuY3Rpb24gYnVpbGRBdHRyaWJ1dGVzTWFwKGF0dHJTdHIsIGpQYXRoLCB0YWdOYW1lKSB7XG4gIGlmICh0aGlzLm9wdGlvbnMuaWdub3JlQXR0cmlidXRlcyAhPT0gdHJ1ZSAmJiB0eXBlb2YgYXR0clN0ciA9PT0gJ3N0cmluZycpIHtcbiAgICAvLyBhdHRyU3RyID0gYXR0clN0ci5yZXBsYWNlKC9cXHI/XFxuL2csICcgJyk7XG4gICAgLy9hdHRyU3RyID0gYXR0clN0ciB8fCBhdHRyU3RyLnRyaW0oKTtcblxuICAgIGNvbnN0IG1hdGNoZXMgPSB1dGlsLmdldEFsbE1hdGNoZXMoYXR0clN0ciwgYXR0cnNSZWd4KTtcbiAgICBjb25zdCBsZW4gPSBtYXRjaGVzLmxlbmd0aDsgLy9kb24ndCBtYWtlIGl0IGlubGluZVxuICAgIGNvbnN0IGF0dHJzID0ge307XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSB0aGlzLnJlc29sdmVOYW1lU3BhY2UobWF0Y2hlc1tpXVsxXSk7XG4gICAgICBpZiAodGhpcy5pZ25vcmVBdHRyaWJ1dGVzRm4oYXR0ck5hbWUsIGpQYXRoKSkge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgbGV0IG9sZFZhbCA9IG1hdGNoZXNbaV1bNF07XG4gICAgICBsZXQgYU5hbWUgPSB0aGlzLm9wdGlvbnMuYXR0cmlidXRlTmFtZVByZWZpeCArIGF0dHJOYW1lO1xuICAgICAgaWYgKGF0dHJOYW1lLmxlbmd0aCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRyYW5zZm9ybUF0dHJpYnV0ZU5hbWUpIHtcbiAgICAgICAgICBhTmFtZSA9IHRoaXMub3B0aW9ucy50cmFuc2Zvcm1BdHRyaWJ1dGVOYW1lKGFOYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBhTmFtZSA9IHNhbml0aXplTmFtZShhTmFtZSwgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgaWYgKG9sZFZhbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50cmltVmFsdWVzKSB7XG4gICAgICAgICAgICBvbGRWYWwgPSBvbGRWYWwudHJpbSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBvbGRWYWwgPSB0aGlzLnJlcGxhY2VFbnRpdGllc1ZhbHVlKG9sZFZhbCwgdGFnTmFtZSwgalBhdGgpO1xuICAgICAgICAgIGNvbnN0IG5ld1ZhbCA9IHRoaXMub3B0aW9ucy5hdHRyaWJ1dGVWYWx1ZVByb2Nlc3NvcihhdHRyTmFtZSwgb2xkVmFsLCBqUGF0aCk7XG4gICAgICAgICAgaWYgKG5ld1ZhbCA9PT0gbnVsbCB8fCBuZXdWYWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy9kb24ndCBwYXJzZVxuICAgICAgICAgICAgYXR0cnNbYU5hbWVdID0gb2xkVmFsO1xuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG5ld1ZhbCAhPT0gdHlwZW9mIG9sZFZhbCB8fCBuZXdWYWwgIT09IG9sZFZhbCkge1xuICAgICAgICAgICAgLy9vdmVyd3JpdGVcbiAgICAgICAgICAgIGF0dHJzW2FOYW1lXSA9IG5ld1ZhbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy9wYXJzZVxuICAgICAgICAgICAgYXR0cnNbYU5hbWVdID0gcGFyc2VWYWx1ZShcbiAgICAgICAgICAgICAgb2xkVmFsLFxuICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucGFyc2VBdHRyaWJ1dGVWYWx1ZSxcbiAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLm51bWJlclBhcnNlT3B0aW9uc1xuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmFsbG93Qm9vbGVhbkF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICBhdHRyc1thTmFtZV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghT2JqZWN0LmtleXMoYXR0cnMpLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmF0dHJpYnV0ZXNHcm91cE5hbWUpIHtcbiAgICAgIGNvbnN0IGF0dHJDb2xsZWN0aW9uID0ge307XG4gICAgICBhdHRyQ29sbGVjdGlvblt0aGlzLm9wdGlvbnMuYXR0cmlidXRlc0dyb3VwTmFtZV0gPSBhdHRycztcbiAgICAgIHJldHVybiBhdHRyQ29sbGVjdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIGF0dHJzXG4gIH1cbn1cblxuY29uc3QgcGFyc2VYbWwgPSBmdW5jdGlvbiAoeG1sRGF0YSkge1xuICB4bWxEYXRhID0geG1sRGF0YS5yZXBsYWNlKC9cXHJcXG4/L2csIFwiXFxuXCIpOyAvL1RPRE86IHJlbW92ZSB0aGlzIGxpbmVcbiAgY29uc3QgeG1sT2JqID0gbmV3IHhtbE5vZGUoJyF4bWwnKTtcbiAgbGV0IGN1cnJlbnROb2RlID0geG1sT2JqO1xuICBsZXQgdGV4dERhdGEgPSBcIlwiO1xuICBsZXQgalBhdGggPSBcIlwiO1xuXG4gIC8vIFJlc2V0IGVudGl0eSBleHBhbnNpb24gY291bnRlcnMgZm9yIHRoaXMgZG9jdW1lbnRcbiAgdGhpcy5lbnRpdHlFeHBhbnNpb25Db3VudCA9IDA7XG4gIHRoaXMuY3VycmVudEV4cGFuZGVkTGVuZ3RoID0gMDtcblxuICBjb25zdCBkb2NUeXBlUmVhZGVyID0gbmV3IERvY1R5cGVSZWFkZXIodGhpcy5vcHRpb25zLnByb2Nlc3NFbnRpdGllcyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgeG1sRGF0YS5sZW5ndGg7IGkrKykgey8vZm9yIGVhY2ggY2hhciBpbiBYTUwgZGF0YVxuICAgIGNvbnN0IGNoID0geG1sRGF0YVtpXTtcbiAgICBpZiAoY2ggPT09ICc8Jykge1xuICAgICAgLy8gY29uc3QgbmV4dEluZGV4ID0gaSsxO1xuICAgICAgLy8gY29uc3QgXzJuZENoYXIgPSB4bWxEYXRhW25leHRJbmRleF07XG4gICAgICBpZiAoeG1sRGF0YVtpICsgMV0gPT09ICcvJykgey8vQ2xvc2luZyBUYWdcbiAgICAgICAgY29uc3QgY2xvc2VJbmRleCA9IGZpbmRDbG9zaW5nSW5kZXgoeG1sRGF0YSwgXCI+XCIsIGksIFwiQ2xvc2luZyBUYWcgaXMgbm90IGNsb3NlZC5cIilcbiAgICAgICAgbGV0IHRhZ05hbWUgPSB4bWxEYXRhLnN1YnN0cmluZyhpICsgMiwgY2xvc2VJbmRleCkudHJpbSgpO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVtb3ZlTlNQcmVmaXgpIHtcbiAgICAgICAgICBjb25zdCBjb2xvbkluZGV4ID0gdGFnTmFtZS5pbmRleE9mKFwiOlwiKTtcbiAgICAgICAgICBpZiAoY29sb25JbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIHRhZ05hbWUgPSB0YWdOYW1lLnN1YnN0cihjb2xvbkluZGV4ICsgMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50cmFuc2Zvcm1UYWdOYW1lKSB7XG4gICAgICAgICAgdGFnTmFtZSA9IHRoaXMub3B0aW9ucy50cmFuc2Zvcm1UYWdOYW1lKHRhZ05hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGN1cnJlbnROb2RlKSB7XG4gICAgICAgICAgdGV4dERhdGEgPSB0aGlzLnNhdmVUZXh0VG9QYXJlbnRUYWcodGV4dERhdGEsIGN1cnJlbnROb2RlLCBqUGF0aCk7XG4gICAgICAgIH1cblxuICAgICAgICAvL2NoZWNrIGlmIGxhc3QgdGFnIG9mIG5lc3RlZCB0YWcgd2FzIHVucGFpcmVkIHRhZ1xuICAgICAgICBjb25zdCBsYXN0VGFnTmFtZSA9IGpQYXRoLnN1YnN0cmluZyhqUGF0aC5sYXN0SW5kZXhPZihcIi5cIikgKyAxKTtcbiAgICAgICAgaWYgKHRhZ05hbWUgJiYgdGhpcy5vcHRpb25zLnVucGFpcmVkVGFncy5pbmRleE9mKHRhZ05hbWUpICE9PSAtMSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5wYWlyZWQgdGFnIGNhbiBub3QgYmUgdXNlZCBhcyBjbG9zaW5nIHRhZzogPC8ke3RhZ05hbWV9PmApO1xuICAgICAgICB9XG4gICAgICAgIGxldCBwcm9wSW5kZXggPSAwXG4gICAgICAgIGlmIChsYXN0VGFnTmFtZSAmJiB0aGlzLm9wdGlvbnMudW5wYWlyZWRUYWdzLmluZGV4T2YobGFzdFRhZ05hbWUpICE9PSAtMSkge1xuICAgICAgICAgIHByb3BJbmRleCA9IGpQYXRoLmxhc3RJbmRleE9mKCcuJywgalBhdGgubGFzdEluZGV4T2YoJy4nKSAtIDEpXG4gICAgICAgICAgdGhpcy50YWdzTm9kZVN0YWNrLnBvcCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb3BJbmRleCA9IGpQYXRoLmxhc3RJbmRleE9mKFwiLlwiKTtcbiAgICAgICAgfVxuICAgICAgICBqUGF0aCA9IGpQYXRoLnN1YnN0cmluZygwLCBwcm9wSW5kZXgpO1xuXG4gICAgICAgIGN1cnJlbnROb2RlID0gdGhpcy50YWdzTm9kZVN0YWNrLnBvcCgpOy8vYXZvaWQgcmVjdXJzaW9uLCBzZXQgdGhlIHBhcmVudCB0YWcgc2NvcGVcbiAgICAgICAgdGV4dERhdGEgPSBcIlwiO1xuICAgICAgICBpID0gY2xvc2VJbmRleDtcbiAgICAgIH0gZWxzZSBpZiAoeG1sRGF0YVtpICsgMV0gPT09ICc/Jykge1xuXG4gICAgICAgIGxldCB0YWdEYXRhID0gcmVhZFRhZ0V4cCh4bWxEYXRhLCBpLCBmYWxzZSwgXCI/PlwiKTtcbiAgICAgICAgaWYgKCF0YWdEYXRhKSB0aHJvdyBuZXcgRXJyb3IoXCJQaSBUYWcgaXMgbm90IGNsb3NlZC5cIik7XG5cbiAgICAgICAgdGV4dERhdGEgPSB0aGlzLnNhdmVUZXh0VG9QYXJlbnRUYWcodGV4dERhdGEsIGN1cnJlbnROb2RlLCBqUGF0aCk7XG4gICAgICAgIGlmICgodGhpcy5vcHRpb25zLmlnbm9yZURlY2xhcmF0aW9uICYmIHRhZ0RhdGEudGFnTmFtZSA9PT0gXCI/eG1sXCIpIHx8IHRoaXMub3B0aW9ucy5pZ25vcmVQaVRhZ3MpIHtcbiAgICAgICAgICAvL2RvIG5vdGhpbmdcbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIGNvbnN0IGNoaWxkTm9kZSA9IG5ldyB4bWxOb2RlKHRhZ0RhdGEudGFnTmFtZSk7XG4gICAgICAgICAgY2hpbGROb2RlLmFkZCh0aGlzLm9wdGlvbnMudGV4dE5vZGVOYW1lLCBcIlwiKTtcblxuICAgICAgICAgIGlmICh0YWdEYXRhLnRhZ05hbWUgIT09IHRhZ0RhdGEudGFnRXhwICYmIHRhZ0RhdGEuYXR0ckV4cFByZXNlbnQpIHtcbiAgICAgICAgICAgIGNoaWxkTm9kZVtcIjpAXCJdID0gdGhpcy5idWlsZEF0dHJpYnV0ZXNNYXAodGFnRGF0YS50YWdFeHAsIGpQYXRoLCB0YWdEYXRhLnRhZ05hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmFkZENoaWxkKGN1cnJlbnROb2RlLCBjaGlsZE5vZGUsIGpQYXRoLCBpKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgaSA9IHRhZ0RhdGEuY2xvc2VJbmRleCArIDE7XG4gICAgICB9IGVsc2UgaWYgKHhtbERhdGEuc3Vic3RyKGkgKyAxLCAzKSA9PT0gJyEtLScpIHtcbiAgICAgICAgY29uc3QgZW5kSW5kZXggPSBmaW5kQ2xvc2luZ0luZGV4KHhtbERhdGEsIFwiLS0+XCIsIGkgKyA0LCBcIkNvbW1lbnQgaXMgbm90IGNsb3NlZC5cIilcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jb21tZW50UHJvcE5hbWUpIHtcbiAgICAgICAgICBjb25zdCBjb21tZW50ID0geG1sRGF0YS5zdWJzdHJpbmcoaSArIDQsIGVuZEluZGV4IC0gMik7XG5cbiAgICAgICAgICB0ZXh0RGF0YSA9IHRoaXMuc2F2ZVRleHRUb1BhcmVudFRhZyh0ZXh0RGF0YSwgY3VycmVudE5vZGUsIGpQYXRoKTtcblxuICAgICAgICAgIGN1cnJlbnROb2RlLmFkZCh0aGlzLm9wdGlvbnMuY29tbWVudFByb3BOYW1lLCBbeyBbdGhpcy5vcHRpb25zLnRleHROb2RlTmFtZV06IGNvbW1lbnQgfV0pO1xuICAgICAgICB9XG4gICAgICAgIGkgPSBlbmRJbmRleDtcbiAgICAgIH0gZWxzZSBpZiAoeG1sRGF0YS5zdWJzdHIoaSArIDEsIDIpID09PSAnIUQnKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGRvY1R5cGVSZWFkZXIucmVhZERvY1R5cGUoeG1sRGF0YSwgaSk7XG4gICAgICAgIHRoaXMuZG9jVHlwZUVudGl0aWVzID0gcmVzdWx0LmVudGl0aWVzO1xuICAgICAgICBpID0gcmVzdWx0Lmk7XG4gICAgICB9IGVsc2UgaWYgKHhtbERhdGEuc3Vic3RyKGkgKyAxLCAyKSA9PT0gJyFbJykge1xuICAgICAgICBjb25zdCBjbG9zZUluZGV4ID0gZmluZENsb3NpbmdJbmRleCh4bWxEYXRhLCBcIl1dPlwiLCBpLCBcIkNEQVRBIGlzIG5vdCBjbG9zZWQuXCIpIC0gMjtcbiAgICAgICAgY29uc3QgdGFnRXhwID0geG1sRGF0YS5zdWJzdHJpbmcoaSArIDksIGNsb3NlSW5kZXgpO1xuXG4gICAgICAgIHRleHREYXRhID0gdGhpcy5zYXZlVGV4dFRvUGFyZW50VGFnKHRleHREYXRhLCBjdXJyZW50Tm9kZSwgalBhdGgpO1xuXG4gICAgICAgIGxldCB2YWwgPSB0aGlzLnBhcnNlVGV4dERhdGEodGFnRXhwLCBjdXJyZW50Tm9kZS50YWduYW1lLCBqUGF0aCwgdHJ1ZSwgZmFsc2UsIHRydWUsIHRydWUpO1xuICAgICAgICBpZiAodmFsID09IHVuZGVmaW5lZCkgdmFsID0gXCJcIjtcblxuICAgICAgICAvL2NkYXRhIHNob3VsZCBiZSBzZXQgZXZlbiBpZiBpdCBpcyAwIGxlbmd0aCBzdHJpbmdcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jZGF0YVByb3BOYW1lKSB7XG4gICAgICAgICAgY3VycmVudE5vZGUuYWRkKHRoaXMub3B0aW9ucy5jZGF0YVByb3BOYW1lLCBbeyBbdGhpcy5vcHRpb25zLnRleHROb2RlTmFtZV06IHRhZ0V4cCB9XSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VycmVudE5vZGUuYWRkKHRoaXMub3B0aW9ucy50ZXh0Tm9kZU5hbWUsIHZhbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpID0gY2xvc2VJbmRleCArIDI7XG4gICAgICB9IGVsc2Ugey8vT3BlbmluZyB0YWdcbiAgICAgICAgbGV0IHJlc3VsdCA9IHJlYWRUYWdFeHAoeG1sRGF0YSwgaSwgdGhpcy5vcHRpb25zLnJlbW92ZU5TUHJlZml4KTtcbiAgICAgICAgbGV0IHRhZ05hbWUgPSByZXN1bHQudGFnTmFtZTtcbiAgICAgICAgY29uc3QgcmF3VGFnTmFtZSA9IHJlc3VsdC5yYXdUYWdOYW1lO1xuICAgICAgICBsZXQgdGFnRXhwID0gcmVzdWx0LnRhZ0V4cDtcbiAgICAgICAgbGV0IGF0dHJFeHBQcmVzZW50ID0gcmVzdWx0LmF0dHJFeHBQcmVzZW50O1xuICAgICAgICBsZXQgY2xvc2VJbmRleCA9IHJlc3VsdC5jbG9zZUluZGV4O1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMudHJhbnNmb3JtVGFnTmFtZSkge1xuICAgICAgICAgIC8vY29uc29sZS5sb2codGFnRXhwLCB0YWdOYW1lKVxuICAgICAgICAgIGNvbnN0IG5ld1RhZ05hbWUgPSB0aGlzLm9wdGlvbnMudHJhbnNmb3JtVGFnTmFtZSh0YWdOYW1lKTtcbiAgICAgICAgICBpZiAodGFnRXhwID09PSB0YWdOYW1lKSB7XG4gICAgICAgICAgICB0YWdFeHAgPSBuZXdUYWdOYW1lXG4gICAgICAgICAgfVxuICAgICAgICAgIHRhZ05hbWUgPSBuZXdUYWdOYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zdHJpY3RSZXNlcnZlZE5hbWVzICYmXG4gICAgICAgICAgKHRhZ05hbWUgPT09IHRoaXMub3B0aW9ucy5jb21tZW50UHJvcE5hbWVcbiAgICAgICAgICAgIHx8IHRhZ05hbWUgPT09IHRoaXMub3B0aW9ucy5jZGF0YVByb3BOYW1lXG4gICAgICAgICAgICB8fCB0YWdOYW1lID09PSB0aGlzLm9wdGlvbnMudGV4dE5vZGVOYW1lXG4gICAgICAgICAgICB8fCB0YWdOYW1lID09PSB0aGlzLm9wdGlvbnMuYXR0cmlidXRlc0dyb3VwTmFtZVxuICAgICAgICAgICkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdGFnIG5hbWU6ICR7dGFnTmFtZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vc2F2ZSB0ZXh0IGFzIGNoaWxkIG5vZGVcbiAgICAgICAgaWYgKGN1cnJlbnROb2RlICYmIHRleHREYXRhKSB7XG4gICAgICAgICAgaWYgKGN1cnJlbnROb2RlLnRhZ25hbWUgIT09ICcheG1sJykge1xuICAgICAgICAgICAgLy93aGVuIG5lc3RlZCB0YWcgaXMgZm91bmRcbiAgICAgICAgICAgIHRleHREYXRhID0gdGhpcy5zYXZlVGV4dFRvUGFyZW50VGFnKHRleHREYXRhLCBjdXJyZW50Tm9kZSwgalBhdGgsIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvL2NoZWNrIGlmIGxhc3QgdGFnIHdhcyB1bnBhaXJlZCB0YWdcbiAgICAgICAgY29uc3QgbGFzdFRhZyA9IGN1cnJlbnROb2RlO1xuICAgICAgICBpZiAobGFzdFRhZyAmJiB0aGlzLm9wdGlvbnMudW5wYWlyZWRUYWdzLmluZGV4T2YobGFzdFRhZy50YWduYW1lKSAhPT0gLTEpIHtcbiAgICAgICAgICBjdXJyZW50Tm9kZSA9IHRoaXMudGFnc05vZGVTdGFjay5wb3AoKTtcbiAgICAgICAgICBqUGF0aCA9IGpQYXRoLnN1YnN0cmluZygwLCBqUGF0aC5sYXN0SW5kZXhPZihcIi5cIikpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0YWdOYW1lICE9PSB4bWxPYmoudGFnbmFtZSkge1xuICAgICAgICAgIGpQYXRoICs9IGpQYXRoID8gXCIuXCIgKyB0YWdOYW1lIDogdGFnTmFtZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdGFydEluZGV4ID0gaTtcbiAgICAgICAgaWYgKHRoaXMuaXNJdFN0b3BOb2RlKHRoaXMuc3RvcE5vZGVzRXhhY3QsIHRoaXMuc3RvcE5vZGVzV2lsZGNhcmQsIGpQYXRoLCB0YWdOYW1lKSkge1xuICAgICAgICAgIGxldCB0YWdDb250ZW50ID0gXCJcIjtcbiAgICAgICAgICAvL3NlbGYtY2xvc2luZyB0YWdcbiAgICAgICAgICBpZiAodGFnRXhwLmxlbmd0aCA+IDAgJiYgdGFnRXhwLmxhc3RJbmRleE9mKFwiL1wiKSA9PT0gdGFnRXhwLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIGlmICh0YWdOYW1lW3RhZ05hbWUubGVuZ3RoIC0gMV0gPT09IFwiL1wiKSB7IC8vcmVtb3ZlIHRyYWlsaW5nICcvJ1xuICAgICAgICAgICAgICB0YWdOYW1lID0gdGFnTmFtZS5zdWJzdHIoMCwgdGFnTmFtZS5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgICAgalBhdGggPSBqUGF0aC5zdWJzdHIoMCwgalBhdGgubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICAgIHRhZ0V4cCA9IHRhZ05hbWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0YWdFeHAgPSB0YWdFeHAuc3Vic3RyKDAsIHRhZ0V4cC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkgPSByZXN1bHQuY2xvc2VJbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy91bnBhaXJlZCB0YWdcbiAgICAgICAgICBlbHNlIGlmICh0aGlzLm9wdGlvbnMudW5wYWlyZWRUYWdzLmluZGV4T2YodGFnTmFtZSkgIT09IC0xKSB7XG5cbiAgICAgICAgICAgIGkgPSByZXN1bHQuY2xvc2VJbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy9ub3JtYWwgdGFnXG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvL3JlYWQgdW50aWwgY2xvc2luZyB0YWcgaXMgZm91bmRcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMucmVhZFN0b3BOb2RlRGF0YSh4bWxEYXRhLCByYXdUYWdOYW1lLCBjbG9zZUluZGV4ICsgMSk7XG4gICAgICAgICAgICBpZiAoIXJlc3VsdCkgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIGVuZCBvZiAke3Jhd1RhZ05hbWV9YCk7XG4gICAgICAgICAgICBpID0gcmVzdWx0Lmk7XG4gICAgICAgICAgICB0YWdDb250ZW50ID0gcmVzdWx0LnRhZ0NvbnRlbnQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgY2hpbGROb2RlID0gbmV3IHhtbE5vZGUodGFnTmFtZSk7XG4gICAgICAgICAgaWYgKHRhZ05hbWUgIT09IHRhZ0V4cCAmJiBhdHRyRXhwUHJlc2VudCkge1xuICAgICAgICAgICAgY2hpbGROb2RlW1wiOkBcIl0gPSB0aGlzLmJ1aWxkQXR0cmlidXRlc01hcCh0YWdFeHAsIGpQYXRoLCB0YWdOYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRhZ0NvbnRlbnQpIHtcbiAgICAgICAgICAgIHRhZ0NvbnRlbnQgPSB0aGlzLnBhcnNlVGV4dERhdGEodGFnQ29udGVudCwgdGFnTmFtZSwgalBhdGgsIHRydWUsIGF0dHJFeHBQcmVzZW50LCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBqUGF0aCA9IGpQYXRoLnN1YnN0cigwLCBqUGF0aC5sYXN0SW5kZXhPZihcIi5cIikpO1xuICAgICAgICAgIGNoaWxkTm9kZS5hZGQodGhpcy5vcHRpb25zLnRleHROb2RlTmFtZSwgdGFnQ29udGVudCk7XG5cbiAgICAgICAgICB0aGlzLmFkZENoaWxkKGN1cnJlbnROb2RlLCBjaGlsZE5vZGUsIGpQYXRoLCBzdGFydEluZGV4KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvL3NlbGZDbG9zaW5nIHRhZ1xuICAgICAgICAgIGlmICh0YWdFeHAubGVuZ3RoID4gMCAmJiB0YWdFeHAubGFzdEluZGV4T2YoXCIvXCIpID09PSB0YWdFeHAubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgaWYgKHRhZ05hbWVbdGFnTmFtZS5sZW5ndGggLSAxXSA9PT0gXCIvXCIpIHsgLy9yZW1vdmUgdHJhaWxpbmcgJy8nXG4gICAgICAgICAgICAgIHRhZ05hbWUgPSB0YWdOYW1lLnN1YnN0cigwLCB0YWdOYW1lLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgICBqUGF0aCA9IGpQYXRoLnN1YnN0cigwLCBqUGF0aC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgICAgdGFnRXhwID0gdGFnTmFtZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRhZ0V4cCA9IHRhZ0V4cC5zdWJzdHIoMCwgdGFnRXhwLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRyYW5zZm9ybVRhZ05hbWUpIHtcbiAgICAgICAgICAgICAgY29uc3QgbmV3VGFnTmFtZSA9IHRoaXMub3B0aW9ucy50cmFuc2Zvcm1UYWdOYW1lKHRhZ05hbWUpO1xuICAgICAgICAgICAgICBpZiAodGFnRXhwID09PSB0YWdOYW1lKSB7XG4gICAgICAgICAgICAgICAgdGFnRXhwID0gbmV3VGFnTmFtZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRhZ05hbWUgPSBuZXdUYWdOYW1lO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjaGlsZE5vZGUgPSBuZXcgeG1sTm9kZSh0YWdOYW1lKTtcbiAgICAgICAgICAgIGlmICh0YWdOYW1lICE9PSB0YWdFeHAgJiYgYXR0ckV4cFByZXNlbnQpIHtcbiAgICAgICAgICAgICAgY2hpbGROb2RlW1wiOkBcIl0gPSB0aGlzLmJ1aWxkQXR0cmlidXRlc01hcCh0YWdFeHAsIGpQYXRoLCB0YWdOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuYWRkQ2hpbGQoY3VycmVudE5vZGUsIGNoaWxkTm9kZSwgalBhdGgsIHN0YXJ0SW5kZXgpO1xuICAgICAgICAgICAgalBhdGggPSBqUGF0aC5zdWJzdHIoMCwgalBhdGgubGFzdEluZGV4T2YoXCIuXCIpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAodGhpcy5vcHRpb25zLnVucGFpcmVkVGFncy5pbmRleE9mKHRhZ05hbWUpICE9PSAtMSkgey8vdW5wYWlyZWQgdGFnXG4gICAgICAgICAgICBjb25zdCBjaGlsZE5vZGUgPSBuZXcgeG1sTm9kZSh0YWdOYW1lKTtcbiAgICAgICAgICAgIGlmICh0YWdOYW1lICE9PSB0YWdFeHAgJiYgYXR0ckV4cFByZXNlbnQpIHtcbiAgICAgICAgICAgICAgY2hpbGROb2RlW1wiOkBcIl0gPSB0aGlzLmJ1aWxkQXR0cmlidXRlc01hcCh0YWdFeHAsIGpQYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuYWRkQ2hpbGQoY3VycmVudE5vZGUsIGNoaWxkTm9kZSwgalBhdGgsIHN0YXJ0SW5kZXgpO1xuICAgICAgICAgICAgalBhdGggPSBqUGF0aC5zdWJzdHIoMCwgalBhdGgubGFzdEluZGV4T2YoXCIuXCIpKTtcbiAgICAgICAgICAgIGkgPSByZXN1bHQuY2xvc2VJbmRleDtcbiAgICAgICAgICAgIC8vIENvbnRpbnVlIHRvIG5leHQgaXRlcmF0aW9uIHdpdGhvdXQgY2hhbmdpbmcgY3VycmVudE5vZGVcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvL29wZW5pbmcgdGFnXG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZE5vZGUgPSBuZXcgeG1sTm9kZSh0YWdOYW1lKTtcbiAgICAgICAgICAgIGlmICh0aGlzLnRhZ3NOb2RlU3RhY2subGVuZ3RoID4gdGhpcy5vcHRpb25zLm1heE5lc3RlZFRhZ3MpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWF4aW11bSBuZXN0ZWQgdGFncyBleGNlZWRlZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudGFnc05vZGVTdGFjay5wdXNoKGN1cnJlbnROb2RlKTtcblxuICAgICAgICAgICAgaWYgKHRhZ05hbWUgIT09IHRhZ0V4cCAmJiBhdHRyRXhwUHJlc2VudCkge1xuICAgICAgICAgICAgICBjaGlsZE5vZGVbXCI6QFwiXSA9IHRoaXMuYnVpbGRBdHRyaWJ1dGVzTWFwKHRhZ0V4cCwgalBhdGgsIHRhZ05hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5hZGRDaGlsZChjdXJyZW50Tm9kZSwgY2hpbGROb2RlLCBqUGF0aClcbiAgICAgICAgICAgIGN1cnJlbnROb2RlID0gY2hpbGROb2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0ZXh0RGF0YSA9IFwiXCI7XG4gICAgICAgICAgaSA9IGNsb3NlSW5kZXg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGV4dERhdGEgKz0geG1sRGF0YVtpXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHhtbE9iai5jaGlsZDtcbn1cblxuZnVuY3Rpb24gYWRkQ2hpbGQoY3VycmVudE5vZGUsIGNoaWxkTm9kZSwgalBhdGgsIHN0YXJ0SW5kZXgpIHtcbiAgLy8gdW5zZXQgc3RhcnRJbmRleCBpZiBub3QgcmVxdWVzdGVkXG4gIGlmICghdGhpcy5vcHRpb25zLmNhcHR1cmVNZXRhRGF0YSkgc3RhcnRJbmRleCA9IHVuZGVmaW5lZDtcbiAgY29uc3QgcmVzdWx0ID0gdGhpcy5vcHRpb25zLnVwZGF0ZVRhZyhjaGlsZE5vZGUudGFnbmFtZSwgalBhdGgsIGNoaWxkTm9kZVtcIjpAXCJdKVxuICBpZiAocmVzdWx0ID09PSBmYWxzZSkge1xuICAgIC8vZG8gbm90aGluZ1xuICB9IGVsc2UgaWYgKHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIpIHtcbiAgICBjaGlsZE5vZGUudGFnbmFtZSA9IHJlc3VsdFxuICAgIGN1cnJlbnROb2RlLmFkZENoaWxkKGNoaWxkTm9kZSwgc3RhcnRJbmRleCk7XG4gIH0gZWxzZSB7XG4gICAgY3VycmVudE5vZGUuYWRkQ2hpbGQoY2hpbGROb2RlLCBzdGFydEluZGV4KTtcbiAgfVxufVxuXG5jb25zdCByZXBsYWNlRW50aXRpZXNWYWx1ZSA9IGZ1bmN0aW9uICh2YWwsIHRhZ05hbWUsIGpQYXRoKSB7XG4gIC8vIFBlcmZvcm1hbmNlIG9wdGltaXphdGlvbjogRWFybHkgcmV0dXJuIGlmIG5vIGVudGl0aWVzIHRvIHJlcGxhY2VcbiAgaWYgKHZhbC5pbmRleE9mKCcmJykgPT09IC0xKSB7XG4gICAgcmV0dXJuIHZhbDtcbiAgfVxuXG4gIGNvbnN0IGVudGl0eUNvbmZpZyA9IHRoaXMub3B0aW9ucy5wcm9jZXNzRW50aXRpZXM7XG5cbiAgaWYgKCFlbnRpdHlDb25maWcuZW5hYmxlZCkge1xuICAgIHJldHVybiB2YWw7XG4gIH1cblxuICAvLyBDaGVjayB0YWctc3BlY2lmaWMgZmlsdGVyaW5nXG4gIGlmIChlbnRpdHlDb25maWcuYWxsb3dlZFRhZ3MpIHtcbiAgICBpZiAoIWVudGl0eUNvbmZpZy5hbGxvd2VkVGFncy5pbmNsdWRlcyh0YWdOYW1lKSkge1xuICAgICAgcmV0dXJuIHZhbDsgLy8gU2tpcCBlbnRpdHkgcmVwbGFjZW1lbnQgZm9yIGN1cnJlbnQgdGFnIGFzIG5vdCBzZXRcbiAgICB9XG4gIH1cblxuICBpZiAoZW50aXR5Q29uZmlnLnRhZ0ZpbHRlcikge1xuICAgIGlmICghZW50aXR5Q29uZmlnLnRhZ0ZpbHRlcih0YWdOYW1lLCBqUGF0aCkpIHtcbiAgICAgIHJldHVybiB2YWw7IC8vIFNraXAgYmFzZWQgb24gY3VzdG9tIGZpbHRlclxuICAgIH1cbiAgfVxuXG4gIC8vIFJlcGxhY2UgRE9DVFlQRSBlbnRpdGllc1xuICBmb3IgKGxldCBlbnRpdHlOYW1lIGluIHRoaXMuZG9jVHlwZUVudGl0aWVzKSB7XG4gICAgY29uc3QgZW50aXR5ID0gdGhpcy5kb2NUeXBlRW50aXRpZXNbZW50aXR5TmFtZV07XG4gICAgY29uc3QgbWF0Y2hlcyA9IHZhbC5tYXRjaChlbnRpdHkucmVneCk7XG5cbiAgICBpZiAobWF0Y2hlcykge1xuICAgICAgLy8gVHJhY2sgZXhwYW5zaW9uc1xuICAgICAgdGhpcy5lbnRpdHlFeHBhbnNpb25Db3VudCArPSBtYXRjaGVzLmxlbmd0aDtcblxuICAgICAgLy8gQ2hlY2sgZXhwYW5zaW9uIGxpbWl0XG4gICAgICBpZiAoZW50aXR5Q29uZmlnLm1heFRvdGFsRXhwYW5zaW9ucyAmJlxuICAgICAgICB0aGlzLmVudGl0eUV4cGFuc2lvbkNvdW50ID4gZW50aXR5Q29uZmlnLm1heFRvdGFsRXhwYW5zaW9ucykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYEVudGl0eSBleHBhbnNpb24gbGltaXQgZXhjZWVkZWQ6ICR7dGhpcy5lbnRpdHlFeHBhbnNpb25Db3VudH0gPiAke2VudGl0eUNvbmZpZy5tYXhUb3RhbEV4cGFuc2lvbnN9YFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICAvLyBTdG9yZSBsZW5ndGggYmVmb3JlIHJlcGxhY2VtZW50XG4gICAgICBjb25zdCBsZW5ndGhCZWZvcmUgPSB2YWwubGVuZ3RoO1xuICAgICAgdmFsID0gdmFsLnJlcGxhY2UoZW50aXR5LnJlZ3gsIGVudGl0eS52YWwpO1xuXG4gICAgICAvLyBDaGVjayBleHBhbmRlZCBsZW5ndGggaW1tZWRpYXRlbHkgYWZ0ZXIgcmVwbGFjZW1lbnRcbiAgICAgIGlmIChlbnRpdHlDb25maWcubWF4RXhwYW5kZWRMZW5ndGgpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50RXhwYW5kZWRMZW5ndGggKz0gKHZhbC5sZW5ndGggLSBsZW5ndGhCZWZvcmUpO1xuXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRFeHBhbmRlZExlbmd0aCA+IGVudGl0eUNvbmZpZy5tYXhFeHBhbmRlZExlbmd0aCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBUb3RhbCBleHBhbmRlZCBjb250ZW50IHNpemUgZXhjZWVkZWQ6ICR7dGhpcy5jdXJyZW50RXhwYW5kZWRMZW5ndGh9ID4gJHtlbnRpdHlDb25maWcubWF4RXhwYW5kZWRMZW5ndGh9YFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKHZhbC5pbmRleE9mKCcmJykgPT09IC0xKSByZXR1cm4gdmFsOyAgLy8gRWFybHkgZXhpdFxuXG4gIC8vIFJlcGxhY2Ugc3RhbmRhcmQgZW50aXRpZXNcbiAgZm9yIChjb25zdCBlbnRpdHlOYW1lIG9mIE9iamVjdC5rZXlzKHRoaXMubGFzdEVudGl0aWVzKSkge1xuICAgIGNvbnN0IGVudGl0eSA9IHRoaXMubGFzdEVudGl0aWVzW2VudGl0eU5hbWVdO1xuICAgIGNvbnN0IG1hdGNoZXMgPSB2YWwubWF0Y2goZW50aXR5LnJlZ2V4KTtcbiAgICBpZiAobWF0Y2hlcykge1xuICAgICAgdGhpcy5lbnRpdHlFeHBhbnNpb25Db3VudCArPSBtYXRjaGVzLmxlbmd0aDtcbiAgICAgIGlmIChlbnRpdHlDb25maWcubWF4VG90YWxFeHBhbnNpb25zICYmXG4gICAgICAgIHRoaXMuZW50aXR5RXhwYW5zaW9uQ291bnQgPiBlbnRpdHlDb25maWcubWF4VG90YWxFeHBhbnNpb25zKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgRW50aXR5IGV4cGFuc2lvbiBsaW1pdCBleGNlZWRlZDogJHt0aGlzLmVudGl0eUV4cGFuc2lvbkNvdW50fSA+ICR7ZW50aXR5Q29uZmlnLm1heFRvdGFsRXhwYW5zaW9uc31gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICAgIHZhbCA9IHZhbC5yZXBsYWNlKGVudGl0eS5yZWdleCwgZW50aXR5LnZhbCk7XG4gIH1cbiAgaWYgKHZhbC5pbmRleE9mKCcmJykgPT09IC0xKSByZXR1cm4gdmFsOyAgLy8gRWFybHkgZXhpdFxuXG4gIC8vIFJlcGxhY2UgSFRNTCBlbnRpdGllcyBpZiBlbmFibGVkXG4gIGlmICh0aGlzLm9wdGlvbnMuaHRtbEVudGl0aWVzKSB7XG4gICAgZm9yIChjb25zdCBlbnRpdHlOYW1lIG9mIE9iamVjdC5rZXlzKHRoaXMuaHRtbEVudGl0aWVzKSkge1xuICAgICAgY29uc3QgZW50aXR5ID0gdGhpcy5odG1sRW50aXRpZXNbZW50aXR5TmFtZV07XG4gICAgICBjb25zdCBtYXRjaGVzID0gdmFsLm1hdGNoKGVudGl0eS5yZWdleCk7XG4gICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICAvL2NvbnNvbGUubG9nKG1hdGNoZXMpO1xuICAgICAgICB0aGlzLmVudGl0eUV4cGFuc2lvbkNvdW50ICs9IG1hdGNoZXMubGVuZ3RoO1xuICAgICAgICBpZiAoZW50aXR5Q29uZmlnLm1heFRvdGFsRXhwYW5zaW9ucyAmJlxuICAgICAgICAgIHRoaXMuZW50aXR5RXhwYW5zaW9uQ291bnQgPiBlbnRpdHlDb25maWcubWF4VG90YWxFeHBhbnNpb25zKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYEVudGl0eSBleHBhbnNpb24gbGltaXQgZXhjZWVkZWQ6ICR7dGhpcy5lbnRpdHlFeHBhbnNpb25Db3VudH0gPiAke2VudGl0eUNvbmZpZy5tYXhUb3RhbEV4cGFuc2lvbnN9YFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhbCA9IHZhbC5yZXBsYWNlKGVudGl0eS5yZWdleCwgZW50aXR5LnZhbCk7XG4gICAgfVxuICB9XG5cbiAgLy8gUmVwbGFjZSBhbXBlcnNhbmQgZW50aXR5IGxhc3RcbiAgdmFsID0gdmFsLnJlcGxhY2UodGhpcy5hbXBFbnRpdHkucmVnZXgsIHRoaXMuYW1wRW50aXR5LnZhbCk7XG5cbiAgcmV0dXJuIHZhbDtcbn1cblxuZnVuY3Rpb24gc2F2ZVRleHRUb1BhcmVudFRhZyh0ZXh0RGF0YSwgcGFyZW50Tm9kZSwgalBhdGgsIGlzTGVhZk5vZGUpIHtcbiAgaWYgKHRleHREYXRhKSB7IC8vc3RvcmUgcHJldmlvdXNseSBjb2xsZWN0ZWQgZGF0YSBhcyB0ZXh0Tm9kZVxuICAgIGlmIChpc0xlYWZOb2RlID09PSB1bmRlZmluZWQpIGlzTGVhZk5vZGUgPSBwYXJlbnROb2RlLmNoaWxkLmxlbmd0aCA9PT0gMFxuXG4gICAgdGV4dERhdGEgPSB0aGlzLnBhcnNlVGV4dERhdGEodGV4dERhdGEsXG4gICAgICBwYXJlbnROb2RlLnRhZ25hbWUsXG4gICAgICBqUGF0aCxcbiAgICAgIGZhbHNlLFxuICAgICAgcGFyZW50Tm9kZVtcIjpAXCJdID8gT2JqZWN0LmtleXMocGFyZW50Tm9kZVtcIjpAXCJdKS5sZW5ndGggIT09IDAgOiBmYWxzZSxcbiAgICAgIGlzTGVhZk5vZGUpO1xuXG4gICAgaWYgKHRleHREYXRhICE9PSB1bmRlZmluZWQgJiYgdGV4dERhdGEgIT09IFwiXCIpXG4gICAgICBwYXJlbnROb2RlLmFkZCh0aGlzLm9wdGlvbnMudGV4dE5vZGVOYW1lLCB0ZXh0RGF0YSk7XG4gICAgdGV4dERhdGEgPSBcIlwiO1xuICB9XG4gIHJldHVybiB0ZXh0RGF0YTtcbn1cblxuLy9UT0RPOiB1c2UgalBhdGggdG8gc2ltcGxpZnkgdGhlIGxvZ2ljXG4vKipcbiAqIEBwYXJhbSB7U2V0fSBzdG9wTm9kZXNFeGFjdFxuICogQHBhcmFtIHtTZXR9IHN0b3BOb2Rlc1dpbGRjYXJkXG4gKiBAcGFyYW0ge3N0cmluZ30galBhdGhcbiAqIEBwYXJhbSB7c3RyaW5nfSBjdXJyZW50VGFnTmFtZVxuICovXG5mdW5jdGlvbiBpc0l0U3RvcE5vZGUoc3RvcE5vZGVzRXhhY3QsIHN0b3BOb2Rlc1dpbGRjYXJkLCBqUGF0aCwgY3VycmVudFRhZ05hbWUpIHtcbiAgaWYgKHN0b3BOb2Rlc1dpbGRjYXJkICYmIHN0b3BOb2Rlc1dpbGRjYXJkLmhhcyhjdXJyZW50VGFnTmFtZSkpIHJldHVybiB0cnVlO1xuICBpZiAoc3RvcE5vZGVzRXhhY3QgJiYgc3RvcE5vZGVzRXhhY3QuaGFzKGpQYXRoKSkgcmV0dXJuIHRydWU7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB0YWcgRXhwcmVzc2lvbiBhbmQgd2hlcmUgaXQgaXMgZW5kaW5nIGhhbmRsaW5nIHNpbmdsZS1kb3VibGUgcXVvdGVzIHNpdHVhdGlvblxuICogQHBhcmFtIHtzdHJpbmd9IHhtbERhdGEgXG4gKiBAcGFyYW0ge251bWJlcn0gaSBzdGFydGluZyBpbmRleFxuICogQHJldHVybnMgXG4gKi9cbmZ1bmN0aW9uIHRhZ0V4cFdpdGhDbG9zaW5nSW5kZXgoeG1sRGF0YSwgaSwgY2xvc2luZ0NoYXIgPSBcIj5cIikge1xuICBsZXQgYXR0ckJvdW5kYXJ5O1xuICBsZXQgdGFnRXhwID0gXCJcIjtcbiAgZm9yIChsZXQgaW5kZXggPSBpOyBpbmRleCA8IHhtbERhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgbGV0IGNoID0geG1sRGF0YVtpbmRleF07XG4gICAgaWYgKGF0dHJCb3VuZGFyeSkge1xuICAgICAgaWYgKGNoID09PSBhdHRyQm91bmRhcnkpIGF0dHJCb3VuZGFyeSA9IFwiXCI7Ly9yZXNldFxuICAgIH0gZWxzZSBpZiAoY2ggPT09ICdcIicgfHwgY2ggPT09IFwiJ1wiKSB7XG4gICAgICBhdHRyQm91bmRhcnkgPSBjaDtcbiAgICB9IGVsc2UgaWYgKGNoID09PSBjbG9zaW5nQ2hhclswXSkge1xuICAgICAgaWYgKGNsb3NpbmdDaGFyWzFdKSB7XG4gICAgICAgIGlmICh4bWxEYXRhW2luZGV4ICsgMV0gPT09IGNsb3NpbmdDaGFyWzFdKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRhdGE6IHRhZ0V4cCxcbiAgICAgICAgICAgIGluZGV4OiBpbmRleFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkYXRhOiB0YWdFeHAsXG4gICAgICAgICAgaW5kZXg6IGluZGV4XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNoID09PSAnXFx0Jykge1xuICAgICAgY2ggPSBcIiBcIlxuICAgIH1cbiAgICB0YWdFeHAgKz0gY2g7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmluZENsb3NpbmdJbmRleCh4bWxEYXRhLCBzdHIsIGksIGVyck1zZykge1xuICBjb25zdCBjbG9zaW5nSW5kZXggPSB4bWxEYXRhLmluZGV4T2Yoc3RyLCBpKTtcbiAgaWYgKGNsb3NpbmdJbmRleCA9PT0gLTEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZXJyTXNnKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBjbG9zaW5nSW5kZXggKyBzdHIubGVuZ3RoIC0gMTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZWFkVGFnRXhwKHhtbERhdGEsIGksIHJlbW92ZU5TUHJlZml4LCBjbG9zaW5nQ2hhciA9IFwiPlwiKSB7XG4gIGNvbnN0IHJlc3VsdCA9IHRhZ0V4cFdpdGhDbG9zaW5nSW5kZXgoeG1sRGF0YSwgaSArIDEsIGNsb3NpbmdDaGFyKTtcbiAgaWYgKCFyZXN1bHQpIHJldHVybjtcbiAgbGV0IHRhZ0V4cCA9IHJlc3VsdC5kYXRhO1xuICBjb25zdCBjbG9zZUluZGV4ID0gcmVzdWx0LmluZGV4O1xuICBjb25zdCBzZXBhcmF0b3JJbmRleCA9IHRhZ0V4cC5zZWFyY2goL1xccy8pO1xuICBsZXQgdGFnTmFtZSA9IHRhZ0V4cDtcbiAgbGV0IGF0dHJFeHBQcmVzZW50ID0gdHJ1ZTtcbiAgaWYgKHNlcGFyYXRvckluZGV4ICE9PSAtMSkgey8vc2VwYXJhdGUgdGFnIG5hbWUgYW5kIGF0dHJpYnV0ZXMgZXhwcmVzc2lvblxuICAgIHRhZ05hbWUgPSB0YWdFeHAuc3Vic3RyaW5nKDAsIHNlcGFyYXRvckluZGV4KTtcbiAgICB0YWdFeHAgPSB0YWdFeHAuc3Vic3RyaW5nKHNlcGFyYXRvckluZGV4ICsgMSkudHJpbVN0YXJ0KCk7XG4gIH1cblxuICBjb25zdCByYXdUYWdOYW1lID0gdGFnTmFtZTtcbiAgaWYgKHJlbW92ZU5TUHJlZml4KSB7XG4gICAgY29uc3QgY29sb25JbmRleCA9IHRhZ05hbWUuaW5kZXhPZihcIjpcIik7XG4gICAgaWYgKGNvbG9uSW5kZXggIT09IC0xKSB7XG4gICAgICB0YWdOYW1lID0gdGFnTmFtZS5zdWJzdHIoY29sb25JbmRleCArIDEpO1xuICAgICAgYXR0ckV4cFByZXNlbnQgPSB0YWdOYW1lICE9PSByZXN1bHQuZGF0YS5zdWJzdHIoY29sb25JbmRleCArIDEpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgdGFnTmFtZTogdGFnTmFtZSxcbiAgICB0YWdFeHA6IHRhZ0V4cCxcbiAgICBjbG9zZUluZGV4OiBjbG9zZUluZGV4LFxuICAgIGF0dHJFeHBQcmVzZW50OiBhdHRyRXhwUHJlc2VudCxcbiAgICByYXdUYWdOYW1lOiByYXdUYWdOYW1lLFxuICB9XG59XG4vKipcbiAqIGZpbmQgcGFpcmVkIHRhZyBmb3IgYSBzdG9wIG5vZGVcbiAqIEBwYXJhbSB7c3RyaW5nfSB4bWxEYXRhIFxuICogQHBhcmFtIHtzdHJpbmd9IHRhZ05hbWUgXG4gKiBAcGFyYW0ge251bWJlcn0gaSBcbiAqL1xuZnVuY3Rpb24gcmVhZFN0b3BOb2RlRGF0YSh4bWxEYXRhLCB0YWdOYW1lLCBpKSB7XG4gIGNvbnN0IHN0YXJ0SW5kZXggPSBpO1xuICAvLyBTdGFydGluZyBhdCAxIHNpbmNlIHdlIGFscmVhZHkgaGF2ZSBhbiBvcGVuIHRhZ1xuICBsZXQgb3BlblRhZ0NvdW50ID0gMTtcblxuICBmb3IgKDsgaSA8IHhtbERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoeG1sRGF0YVtpXSA9PT0gXCI8XCIpIHtcbiAgICAgIGlmICh4bWxEYXRhW2kgKyAxXSA9PT0gXCIvXCIpIHsvL2Nsb3NlIHRhZ1xuICAgICAgICBjb25zdCBjbG9zZUluZGV4ID0gZmluZENsb3NpbmdJbmRleCh4bWxEYXRhLCBcIj5cIiwgaSwgYCR7dGFnTmFtZX0gaXMgbm90IGNsb3NlZGApO1xuICAgICAgICBsZXQgY2xvc2VUYWdOYW1lID0geG1sRGF0YS5zdWJzdHJpbmcoaSArIDIsIGNsb3NlSW5kZXgpLnRyaW0oKTtcbiAgICAgICAgaWYgKGNsb3NlVGFnTmFtZSA9PT0gdGFnTmFtZSkge1xuICAgICAgICAgIG9wZW5UYWdDb3VudC0tO1xuICAgICAgICAgIGlmIChvcGVuVGFnQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHRhZ0NvbnRlbnQ6IHhtbERhdGEuc3Vic3RyaW5nKHN0YXJ0SW5kZXgsIGkpLFxuICAgICAgICAgICAgICBpOiBjbG9zZUluZGV4XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGkgPSBjbG9zZUluZGV4O1xuICAgICAgfSBlbHNlIGlmICh4bWxEYXRhW2kgKyAxXSA9PT0gJz8nKSB7XG4gICAgICAgIGNvbnN0IGNsb3NlSW5kZXggPSBmaW5kQ2xvc2luZ0luZGV4KHhtbERhdGEsIFwiPz5cIiwgaSArIDEsIFwiU3RvcE5vZGUgaXMgbm90IGNsb3NlZC5cIilcbiAgICAgICAgaSA9IGNsb3NlSW5kZXg7XG4gICAgICB9IGVsc2UgaWYgKHhtbERhdGEuc3Vic3RyKGkgKyAxLCAzKSA9PT0gJyEtLScpIHtcbiAgICAgICAgY29uc3QgY2xvc2VJbmRleCA9IGZpbmRDbG9zaW5nSW5kZXgoeG1sRGF0YSwgXCItLT5cIiwgaSArIDMsIFwiU3RvcE5vZGUgaXMgbm90IGNsb3NlZC5cIilcbiAgICAgICAgaSA9IGNsb3NlSW5kZXg7XG4gICAgICB9IGVsc2UgaWYgKHhtbERhdGEuc3Vic3RyKGkgKyAxLCAyKSA9PT0gJyFbJykge1xuICAgICAgICBjb25zdCBjbG9zZUluZGV4ID0gZmluZENsb3NpbmdJbmRleCh4bWxEYXRhLCBcIl1dPlwiLCBpLCBcIlN0b3BOb2RlIGlzIG5vdCBjbG9zZWQuXCIpIC0gMjtcbiAgICAgICAgaSA9IGNsb3NlSW5kZXg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB0YWdEYXRhID0gcmVhZFRhZ0V4cCh4bWxEYXRhLCBpLCAnPicpXG5cbiAgICAgICAgaWYgKHRhZ0RhdGEpIHtcbiAgICAgICAgICBjb25zdCBvcGVuVGFnTmFtZSA9IHRhZ0RhdGEgJiYgdGFnRGF0YS50YWdOYW1lO1xuICAgICAgICAgIGlmIChvcGVuVGFnTmFtZSA9PT0gdGFnTmFtZSAmJiB0YWdEYXRhLnRhZ0V4cFt0YWdEYXRhLnRhZ0V4cC5sZW5ndGggLSAxXSAhPT0gXCIvXCIpIHtcbiAgICAgICAgICAgIG9wZW5UYWdDb3VudCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpID0gdGFnRGF0YS5jbG9zZUluZGV4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9Ly9lbmQgZm9yIGxvb3Bcbn1cblxuZnVuY3Rpb24gcGFyc2VWYWx1ZSh2YWwsIHNob3VsZFBhcnNlLCBvcHRpb25zKSB7XG4gIGlmIChzaG91bGRQYXJzZSAmJiB0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIC8vY29uc29sZS5sb2cob3B0aW9ucylcbiAgICBjb25zdCBuZXd2YWwgPSB2YWwudHJpbSgpO1xuICAgIGlmIChuZXd2YWwgPT09ICd0cnVlJykgcmV0dXJuIHRydWU7XG4gICAgZWxzZSBpZiAobmV3dmFsID09PSAnZmFsc2UnKSByZXR1cm4gZmFsc2U7XG4gICAgZWxzZSByZXR1cm4gdG9OdW1iZXIodmFsLCBvcHRpb25zKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAodXRpbC5pc0V4aXN0KHZhbCkpIHtcbiAgICAgIHJldHVybiB2YWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZnJvbUNvZGVQb2ludChzdHIsIGJhc2UsIHByZWZpeCkge1xuICBjb25zdCBjb2RlUG9pbnQgPSBOdW1iZXIucGFyc2VJbnQoc3RyLCBiYXNlKTtcblxuICBpZiAoY29kZVBvaW50ID49IDAgJiYgY29kZVBvaW50IDw9IDB4MTBGRkZGKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ29kZVBvaW50KGNvZGVQb2ludCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHByZWZpeCArIHN0ciArIFwiO1wiO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNhbml0aXplTmFtZShuYW1lLCBvcHRpb25zKSB7XG4gIGlmICh1dGlsLmNyaXRpY2FsUHJvcGVydGllcy5pbmNsdWRlcyhuYW1lKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgW1NFQ1VSSVRZXSBJbnZhbGlkIG5hbWU6IFwiJHtuYW1lfVwiIGlzIGEgcmVzZXJ2ZWQgSmF2YVNjcmlwdCBrZXl3b3JkIHRoYXQgY291bGQgY2F1c2UgcHJvdG90eXBlIHBvbGx1dGlvbmApO1xuICB9IGVsc2UgaWYgKHV0aWwuREFOR0VST1VTX1BST1BFUlRZX05BTUVTLmluY2x1ZGVzKG5hbWUpKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMub25EYW5nZXJvdXNQcm9wZXJ0eShuYW1lKTtcbiAgfVxuICByZXR1cm4gbmFtZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBPcmRlcmVkT2JqUGFyc2VyO1xuXG4iLCAiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFxuICogQHBhcmFtIHthcnJheX0gbm9kZSBcbiAqIEBwYXJhbSB7YW55fSBvcHRpb25zIFxuICogQHJldHVybnMgXG4gKi9cbmZ1bmN0aW9uIHByZXR0aWZ5KG5vZGUsIG9wdGlvbnMpe1xuICByZXR1cm4gY29tcHJlc3MoIG5vZGUsIG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIFxuICogQHBhcmFtIHthcnJheX0gYXJyIFxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgXG4gKiBAcGFyYW0ge3N0cmluZ30galBhdGggXG4gKiBAcmV0dXJucyBvYmplY3RcbiAqL1xuZnVuY3Rpb24gY29tcHJlc3MoYXJyLCBvcHRpb25zLCBqUGF0aCl7XG4gIGxldCB0ZXh0O1xuICBjb25zdCBjb21wcmVzc2VkT2JqID0ge307XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdGFnT2JqID0gYXJyW2ldO1xuICAgIGNvbnN0IHByb3BlcnR5ID0gcHJvcE5hbWUodGFnT2JqKTtcbiAgICBsZXQgbmV3SnBhdGggPSBcIlwiO1xuICAgIGlmKGpQYXRoID09PSB1bmRlZmluZWQpIG5ld0pwYXRoID0gcHJvcGVydHk7XG4gICAgZWxzZSBuZXdKcGF0aCA9IGpQYXRoICsgXCIuXCIgKyBwcm9wZXJ0eTtcblxuICAgIGlmKHByb3BlcnR5ID09PSBvcHRpb25zLnRleHROb2RlTmFtZSl7XG4gICAgICBpZih0ZXh0ID09PSB1bmRlZmluZWQpIHRleHQgPSB0YWdPYmpbcHJvcGVydHldO1xuICAgICAgZWxzZSB0ZXh0ICs9IFwiXCIgKyB0YWdPYmpbcHJvcGVydHldO1xuICAgIH1lbHNlIGlmKHByb3BlcnR5ID09PSB1bmRlZmluZWQpe1xuICAgICAgY29udGludWU7XG4gICAgfWVsc2UgaWYodGFnT2JqW3Byb3BlcnR5XSl7XG4gICAgICBcbiAgICAgIGxldCB2YWwgPSBjb21wcmVzcyh0YWdPYmpbcHJvcGVydHldLCBvcHRpb25zLCBuZXdKcGF0aCk7XG4gICAgICBjb25zdCBpc0xlYWYgPSBpc0xlYWZUYWcodmFsLCBvcHRpb25zKTtcblxuICAgICAgaWYodGFnT2JqW1wiOkBcIl0pe1xuICAgICAgICBhc3NpZ25BdHRyaWJ1dGVzKCB2YWwsIHRhZ09ialtcIjpAXCJdLCBuZXdKcGF0aCwgb3B0aW9ucyk7XG4gICAgICB9ZWxzZSBpZihPYmplY3Qua2V5cyh2YWwpLmxlbmd0aCA9PT0gMSAmJiB2YWxbb3B0aW9ucy50ZXh0Tm9kZU5hbWVdICE9PSB1bmRlZmluZWQgJiYgIW9wdGlvbnMuYWx3YXlzQ3JlYXRlVGV4dE5vZGUpe1xuICAgICAgICB2YWwgPSB2YWxbb3B0aW9ucy50ZXh0Tm9kZU5hbWVdO1xuICAgICAgfWVsc2UgaWYoT2JqZWN0LmtleXModmFsKS5sZW5ndGggPT09IDApe1xuICAgICAgICBpZihvcHRpb25zLmFsd2F5c0NyZWF0ZVRleHROb2RlKSB2YWxbb3B0aW9ucy50ZXh0Tm9kZU5hbWVdID0gXCJcIjtcbiAgICAgICAgZWxzZSB2YWwgPSBcIlwiO1xuICAgICAgfVxuXG4gICAgICBpZihjb21wcmVzc2VkT2JqW3Byb3BlcnR5XSAhPT0gdW5kZWZpbmVkICYmIGNvbXByZXNzZWRPYmouaGFzT3duUHJvcGVydHkocHJvcGVydHkpKSB7XG4gICAgICAgIGlmKCFBcnJheS5pc0FycmF5KGNvbXByZXNzZWRPYmpbcHJvcGVydHldKSkge1xuICAgICAgICAgICAgY29tcHJlc3NlZE9ialtwcm9wZXJ0eV0gPSBbIGNvbXByZXNzZWRPYmpbcHJvcGVydHldIF07XG4gICAgICAgIH1cbiAgICAgICAgY29tcHJlc3NlZE9ialtwcm9wZXJ0eV0ucHVzaCh2YWwpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIC8vVE9ETzogaWYgYSBub2RlIGlzIG5vdCBhbiBhcnJheSwgdGhlbiBjaGVjayBpZiBpdCBzaG91bGQgYmUgYW4gYXJyYXlcbiAgICAgICAgLy9hbHNvIGRldGVybWluZSBpZiBpdCBpcyBhIGxlYWYgbm9kZVxuICAgICAgICBpZiAob3B0aW9ucy5pc0FycmF5KHByb3BlcnR5LCBuZXdKcGF0aCwgaXNMZWFmICkpIHtcbiAgICAgICAgICBjb21wcmVzc2VkT2JqW3Byb3BlcnR5XSA9IFt2YWxdO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICBjb21wcmVzc2VkT2JqW3Byb3BlcnR5XSA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgfVxuICAvLyBpZih0ZXh0ICYmIHRleHQubGVuZ3RoID4gMCkgY29tcHJlc3NlZE9ialtvcHRpb25zLnRleHROb2RlTmFtZV0gPSB0ZXh0O1xuICBpZih0eXBlb2YgdGV4dCA9PT0gXCJzdHJpbmdcIil7XG4gICAgaWYodGV4dC5sZW5ndGggPiAwKSBjb21wcmVzc2VkT2JqW29wdGlvbnMudGV4dE5vZGVOYW1lXSA9IHRleHQ7XG4gIH1lbHNlIGlmKHRleHQgIT09IHVuZGVmaW5lZCkgY29tcHJlc3NlZE9ialtvcHRpb25zLnRleHROb2RlTmFtZV0gPSB0ZXh0O1xuICByZXR1cm4gY29tcHJlc3NlZE9iajtcbn1cblxuZnVuY3Rpb24gcHJvcE5hbWUob2JqKXtcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGtleSA9IGtleXNbaV07XG4gICAgaWYoa2V5ICE9PSBcIjpAXCIpIHJldHVybiBrZXk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXNzaWduQXR0cmlidXRlcyhvYmosIGF0dHJNYXAsIGpwYXRoLCBvcHRpb25zKXtcbiAgaWYgKGF0dHJNYXApIHtcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoYXR0ck1hcCk7XG4gICAgY29uc3QgbGVuID0ga2V5cy5sZW5ndGg7IC8vZG9uJ3QgbWFrZSBpdCBpbmxpbmVcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBjb25zdCBhdHJyTmFtZSA9IGtleXNbaV07XG4gICAgICBpZiAob3B0aW9ucy5pc0FycmF5KGF0cnJOYW1lLCBqcGF0aCArIFwiLlwiICsgYXRyck5hbWUsIHRydWUsIHRydWUpKSB7XG4gICAgICAgIG9ialthdHJyTmFtZV0gPSBbIGF0dHJNYXBbYXRyck5hbWVdIF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvYmpbYXRyck5hbWVdID0gYXR0ck1hcFthdHJyTmFtZV07XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGlzTGVhZlRhZyhvYmosIG9wdGlvbnMpe1xuICBjb25zdCB7IHRleHROb2RlTmFtZSB9ID0gb3B0aW9ucztcbiAgY29uc3QgcHJvcENvdW50ID0gT2JqZWN0LmtleXMob2JqKS5sZW5ndGg7XG4gIFxuICBpZiAocHJvcENvdW50ID09PSAwKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpZiAoXG4gICAgcHJvcENvdW50ID09PSAxICYmXG4gICAgKG9ialt0ZXh0Tm9kZU5hbWVdIHx8IHR5cGVvZiBvYmpbdGV4dE5vZGVOYW1lXSA9PT0gXCJib29sZWFuXCIgfHwgb2JqW3RleHROb2RlTmFtZV0gPT09IDApXG4gICkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuZXhwb3J0cy5wcmV0dGlmeSA9IHByZXR0aWZ5O1xuIiwgImNvbnN0IHsgYnVpbGRPcHRpb25zfSA9IHJlcXVpcmUoXCIuL09wdGlvbnNCdWlsZGVyXCIpO1xuY29uc3QgT3JkZXJlZE9ialBhcnNlciA9IHJlcXVpcmUoXCIuL09yZGVyZWRPYmpQYXJzZXJcIik7XG5jb25zdCB7IHByZXR0aWZ5fSA9IHJlcXVpcmUoXCIuL25vZGUyanNvblwiKTtcbmNvbnN0IHZhbGlkYXRvciA9IHJlcXVpcmUoJy4uL3ZhbGlkYXRvcicpO1xuXG5jbGFzcyBYTUxQYXJzZXJ7XG4gICAgXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucyl7XG4gICAgICAgIHRoaXMuZXh0ZXJuYWxFbnRpdGllcyA9IHt9O1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBidWlsZE9wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgIFxuICAgIH1cbiAgICAvKipcbiAgICAgKiBQYXJzZSBYTUwgZGF0cyB0byBKUyBvYmplY3QgXG4gICAgICogQHBhcmFtIHtzdHJpbmd8QnVmZmVyfSB4bWxEYXRhIFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbnxPYmplY3R9IHZhbGlkYXRpb25PcHRpb24gXG4gICAgICovXG4gICAgcGFyc2UoeG1sRGF0YSx2YWxpZGF0aW9uT3B0aW9uKXtcbiAgICAgICAgaWYodHlwZW9mIHhtbERhdGEgPT09IFwic3RyaW5nXCIpe1xuICAgICAgICB9ZWxzZSBpZiggeG1sRGF0YS50b1N0cmluZyl7XG4gICAgICAgICAgICB4bWxEYXRhID0geG1sRGF0YS50b1N0cmluZygpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlhNTCBkYXRhIGlzIGFjY2VwdGVkIGluIFN0cmluZyBvciBCeXRlc1tdIGZvcm0uXCIpXG4gICAgICAgIH1cbiAgICAgICAgaWYoIHZhbGlkYXRpb25PcHRpb24pe1xuICAgICAgICAgICAgaWYodmFsaWRhdGlvbk9wdGlvbiA9PT0gdHJ1ZSkgdmFsaWRhdGlvbk9wdGlvbiA9IHt9OyAvL3ZhbGlkYXRlIHdpdGggZGVmYXVsdCBvcHRpb25zXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRvci52YWxpZGF0ZSh4bWxEYXRhLCB2YWxpZGF0aW9uT3B0aW9uKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoIGAke3Jlc3VsdC5lcnIubXNnfToke3Jlc3VsdC5lcnIubGluZX06JHtyZXN1bHQuZXJyLmNvbH1gIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9yZGVyZWRPYmpQYXJzZXIgPSBuZXcgT3JkZXJlZE9ialBhcnNlcih0aGlzLm9wdGlvbnMpO1xuICAgICAgICBvcmRlcmVkT2JqUGFyc2VyLmFkZEV4dGVybmFsRW50aXRpZXModGhpcy5leHRlcm5hbEVudGl0aWVzKTtcbiAgICAgICAgY29uc3Qgb3JkZXJlZFJlc3VsdCA9IG9yZGVyZWRPYmpQYXJzZXIucGFyc2VYbWwoeG1sRGF0YSk7XG4gICAgICAgIGlmKHRoaXMub3B0aW9ucy5wcmVzZXJ2ZU9yZGVyIHx8IG9yZGVyZWRSZXN1bHQgPT09IHVuZGVmaW5lZCkgcmV0dXJuIG9yZGVyZWRSZXN1bHQ7XG4gICAgICAgIGVsc2UgcmV0dXJuIHByZXR0aWZ5KG9yZGVyZWRSZXN1bHQsIHRoaXMub3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIEVudGl0eSB3aGljaCBpcyBub3QgYnkgZGVmYXVsdCBzdXBwb3J0ZWQgYnkgdGhpcyBsaWJyYXJ5XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgXG4gICAgICovXG4gICAgYWRkRW50aXR5KGtleSwgdmFsdWUpe1xuICAgICAgICBpZih2YWx1ZS5pbmRleE9mKFwiJlwiKSAhPT0gLTEpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRW50aXR5IHZhbHVlIGNhbid0IGhhdmUgJyYnXCIpXG4gICAgICAgIH1lbHNlIGlmKGtleS5pbmRleE9mKFwiJlwiKSAhPT0gLTEgfHwga2V5LmluZGV4T2YoXCI7XCIpICE9PSAtMSl7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBbiBlbnRpdHkgbXVzdCBiZSBzZXQgd2l0aG91dCAnJicgYW5kICc7Jy4gRWcuIHVzZSAnI3hEJyBmb3IgJyYjeEQ7J1wiKVxuICAgICAgICB9ZWxzZSBpZih2YWx1ZSA9PT0gXCImXCIpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQW4gZW50aXR5IHdpdGggdmFsdWUgJyYnIGlzIG5vdCBwZXJtaXR0ZWRcIik7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgdGhpcy5leHRlcm5hbEVudGl0aWVzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBYTUxQYXJzZXI7IiwgImNvbnN0IEVPTCA9IFwiXFxuXCI7XG5cbi8qKlxuICogXG4gKiBAcGFyYW0ge2FycmF5fSBqQXJyYXkgXG4gKiBAcGFyYW0ge2FueX0gb3B0aW9ucyBcbiAqIEByZXR1cm5zIFxuICovXG5mdW5jdGlvbiB0b1htbChqQXJyYXksIG9wdGlvbnMpIHtcbiAgICBsZXQgaW5kZW50YXRpb24gPSBcIlwiO1xuICAgIGlmIChvcHRpb25zLmZvcm1hdCAmJiBvcHRpb25zLmluZGVudEJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgaW5kZW50YXRpb24gPSBFT0w7XG4gICAgfVxuICAgIHJldHVybiBhcnJUb1N0cihqQXJyYXksIG9wdGlvbnMsIFwiXCIsIGluZGVudGF0aW9uKTtcbn1cblxuZnVuY3Rpb24gYXJyVG9TdHIoYXJyLCBvcHRpb25zLCBqUGF0aCwgaW5kZW50YXRpb24pIHtcbiAgICBsZXQgeG1sU3RyID0gXCJcIjtcbiAgICBsZXQgaXNQcmV2aW91c0VsZW1lbnRUYWcgPSBmYWxzZTtcblxuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGFycikpIHtcbiAgICAgICAgLy8gTm9uLWFycmF5IHZhbHVlcyAoZS5nLiBzdHJpbmcgdGFnIHZhbHVlcykgc2hvdWxkIGJlIHRyZWF0ZWQgYXMgdGV4dCBjb250ZW50XG4gICAgICAgIGlmIChhcnIgIT09IHVuZGVmaW5lZCAmJiBhcnIgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGxldCB0ZXh0ID0gYXJyLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB0ZXh0ID0gcmVwbGFjZUVudGl0aWVzVmFsdWUodGV4dCwgb3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gdGV4dDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCB0YWdPYmogPSBhcnJbaV07XG4gICAgICAgIGNvbnN0IHRhZ05hbWUgPSBwcm9wTmFtZSh0YWdPYmopO1xuICAgICAgICBpZiAodGFnTmFtZSA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcblxuICAgICAgICBsZXQgbmV3SlBhdGggPSBcIlwiO1xuICAgICAgICBpZiAoalBhdGgubGVuZ3RoID09PSAwKSBuZXdKUGF0aCA9IHRhZ05hbWVcbiAgICAgICAgZWxzZSBuZXdKUGF0aCA9IGAke2pQYXRofS4ke3RhZ05hbWV9YDtcblxuICAgICAgICBpZiAodGFnTmFtZSA9PT0gb3B0aW9ucy50ZXh0Tm9kZU5hbWUpIHtcbiAgICAgICAgICAgIGxldCB0YWdUZXh0ID0gdGFnT2JqW3RhZ05hbWVdO1xuICAgICAgICAgICAgaWYgKCFpc1N0b3BOb2RlKG5ld0pQYXRoLCBvcHRpb25zKSkge1xuICAgICAgICAgICAgICAgIHRhZ1RleHQgPSBvcHRpb25zLnRhZ1ZhbHVlUHJvY2Vzc29yKHRhZ05hbWUsIHRhZ1RleHQpO1xuICAgICAgICAgICAgICAgIHRhZ1RleHQgPSByZXBsYWNlRW50aXRpZXNWYWx1ZSh0YWdUZXh0LCBvcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc1ByZXZpb3VzRWxlbWVudFRhZykge1xuICAgICAgICAgICAgICAgIHhtbFN0ciArPSBpbmRlbnRhdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHhtbFN0ciArPSB0YWdUZXh0O1xuICAgICAgICAgICAgaXNQcmV2aW91c0VsZW1lbnRUYWcgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2UgaWYgKHRhZ05hbWUgPT09IG9wdGlvbnMuY2RhdGFQcm9wTmFtZSkge1xuICAgICAgICAgICAgaWYgKGlzUHJldmlvdXNFbGVtZW50VGFnKSB7XG4gICAgICAgICAgICAgICAgeG1sU3RyICs9IGluZGVudGF0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeG1sU3RyICs9IGA8IVtDREFUQVske3RhZ09ialt0YWdOYW1lXVswXVtvcHRpb25zLnRleHROb2RlTmFtZV19XV0+YDtcbiAgICAgICAgICAgIGlzUHJldmlvdXNFbGVtZW50VGFnID0gZmFsc2U7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0YWdOYW1lID09PSBvcHRpb25zLmNvbW1lbnRQcm9wTmFtZSkge1xuICAgICAgICAgICAgeG1sU3RyICs9IGluZGVudGF0aW9uICsgYDwhLS0ke3RhZ09ialt0YWdOYW1lXVswXVtvcHRpb25zLnRleHROb2RlTmFtZV19LS0+YDtcbiAgICAgICAgICAgIGlzUHJldmlvdXNFbGVtZW50VGFnID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2UgaWYgKHRhZ05hbWVbMF0gPT09IFwiP1wiKSB7XG4gICAgICAgICAgICBjb25zdCBhdHRTdHIgPSBhdHRyX3RvX3N0cih0YWdPYmpbXCI6QFwiXSwgb3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCB0ZW1wSW5kID0gdGFnTmFtZSA9PT0gXCI/eG1sXCIgPyBcIlwiIDogaW5kZW50YXRpb247XG4gICAgICAgICAgICBsZXQgcGlUZXh0Tm9kZU5hbWUgPSB0YWdPYmpbdGFnTmFtZV1bMF1bb3B0aW9ucy50ZXh0Tm9kZU5hbWVdO1xuICAgICAgICAgICAgcGlUZXh0Tm9kZU5hbWUgPSBwaVRleHROb2RlTmFtZS5sZW5ndGggIT09IDAgPyBcIiBcIiArIHBpVGV4dE5vZGVOYW1lIDogXCJcIjsgLy9yZW1vdmUgZXh0cmEgc3BhY2luZ1xuICAgICAgICAgICAgeG1sU3RyICs9IHRlbXBJbmQgKyBgPCR7dGFnTmFtZX0ke3BpVGV4dE5vZGVOYW1lfSR7YXR0U3RyfT8+YDtcbiAgICAgICAgICAgIGlzUHJldmlvdXNFbGVtZW50VGFnID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBuZXdJZGVudGF0aW9uID0gaW5kZW50YXRpb247XG4gICAgICAgIGlmIChuZXdJZGVudGF0aW9uICE9PSBcIlwiKSB7XG4gICAgICAgICAgICBuZXdJZGVudGF0aW9uICs9IG9wdGlvbnMuaW5kZW50Qnk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXR0U3RyID0gYXR0cl90b19zdHIodGFnT2JqW1wiOkBcIl0sIG9wdGlvbnMpO1xuICAgICAgICBjb25zdCB0YWdTdGFydCA9IGluZGVudGF0aW9uICsgYDwke3RhZ05hbWV9JHthdHRTdHJ9YDtcbiAgICAgICAgY29uc3QgdGFnVmFsdWUgPSBhcnJUb1N0cih0YWdPYmpbdGFnTmFtZV0sIG9wdGlvbnMsIG5ld0pQYXRoLCBuZXdJZGVudGF0aW9uKTtcbiAgICAgICAgaWYgKG9wdGlvbnMudW5wYWlyZWRUYWdzLmluZGV4T2YodGFnTmFtZSkgIT09IC0xKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zdXBwcmVzc1VucGFpcmVkTm9kZSkgeG1sU3RyICs9IHRhZ1N0YXJ0ICsgXCI+XCI7XG4gICAgICAgICAgICBlbHNlIHhtbFN0ciArPSB0YWdTdGFydCArIFwiLz5cIjtcbiAgICAgICAgfSBlbHNlIGlmICgoIXRhZ1ZhbHVlIHx8IHRhZ1ZhbHVlLmxlbmd0aCA9PT0gMCkgJiYgb3B0aW9ucy5zdXBwcmVzc0VtcHR5Tm9kZSkge1xuICAgICAgICAgICAgeG1sU3RyICs9IHRhZ1N0YXJ0ICsgXCIvPlwiO1xuICAgICAgICB9IGVsc2UgaWYgKHRhZ1ZhbHVlICYmIHRhZ1ZhbHVlLmVuZHNXaXRoKFwiPlwiKSkge1xuICAgICAgICAgICAgeG1sU3RyICs9IHRhZ1N0YXJ0ICsgYD4ke3RhZ1ZhbHVlfSR7aW5kZW50YXRpb259PC8ke3RhZ05hbWV9PmA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB4bWxTdHIgKz0gdGFnU3RhcnQgKyBcIj5cIjtcbiAgICAgICAgICAgIGlmICh0YWdWYWx1ZSAmJiBpbmRlbnRhdGlvbiAhPT0gXCJcIiAmJiAodGFnVmFsdWUuaW5jbHVkZXMoXCIvPlwiKSB8fCB0YWdWYWx1ZS5pbmNsdWRlcyhcIjwvXCIpKSkge1xuICAgICAgICAgICAgICAgIHhtbFN0ciArPSBpbmRlbnRhdGlvbiArIG9wdGlvbnMuaW5kZW50QnkgKyB0YWdWYWx1ZSArIGluZGVudGF0aW9uO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB4bWxTdHIgKz0gdGFnVmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4bWxTdHIgKz0gYDwvJHt0YWdOYW1lfT5gO1xuICAgICAgICB9XG4gICAgICAgIGlzUHJldmlvdXNFbGVtZW50VGFnID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4geG1sU3RyO1xufVxuXG5mdW5jdGlvbiBwcm9wTmFtZShvYmopIHtcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSBjb250aW51ZTtcbiAgICAgICAgaWYgKGtleSAhPT0gXCI6QFwiKSByZXR1cm4ga2V5O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYXR0cl90b19zdHIoYXR0ck1hcCwgb3B0aW9ucykge1xuICAgIGxldCBhdHRyU3RyID0gXCJcIjtcbiAgICBpZiAoYXR0ck1hcCAmJiAhb3B0aW9ucy5pZ25vcmVBdHRyaWJ1dGVzKSB7XG4gICAgICAgIGZvciAobGV0IGF0dHIgaW4gYXR0ck1hcCkge1xuICAgICAgICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYXR0ck1hcCwgYXR0cikpIGNvbnRpbnVlO1xuICAgICAgICAgICAgbGV0IGF0dHJWYWwgPSBvcHRpb25zLmF0dHJpYnV0ZVZhbHVlUHJvY2Vzc29yKGF0dHIsIGF0dHJNYXBbYXR0cl0pO1xuICAgICAgICAgICAgYXR0clZhbCA9IHJlcGxhY2VFbnRpdGllc1ZhbHVlKGF0dHJWYWwsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKGF0dHJWYWwgPT09IHRydWUgJiYgb3B0aW9ucy5zdXBwcmVzc0Jvb2xlYW5BdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICAgICAgYXR0clN0ciArPSBgICR7YXR0ci5zdWJzdHIob3B0aW9ucy5hdHRyaWJ1dGVOYW1lUHJlZml4Lmxlbmd0aCl9YDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXR0clN0ciArPSBgICR7YXR0ci5zdWJzdHIob3B0aW9ucy5hdHRyaWJ1dGVOYW1lUHJlZml4Lmxlbmd0aCl9PVwiJHthdHRyVmFsfVwiYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXR0clN0cjtcbn1cblxuZnVuY3Rpb24gaXNTdG9wTm9kZShqUGF0aCwgb3B0aW9ucykge1xuICAgIGpQYXRoID0galBhdGguc3Vic3RyKDAsIGpQYXRoLmxlbmd0aCAtIG9wdGlvbnMudGV4dE5vZGVOYW1lLmxlbmd0aCAtIDEpO1xuICAgIGxldCB0YWdOYW1lID0galBhdGguc3Vic3RyKGpQYXRoLmxhc3RJbmRleE9mKFwiLlwiKSArIDEpO1xuICAgIGZvciAobGV0IGluZGV4IGluIG9wdGlvbnMuc3RvcE5vZGVzKSB7XG4gICAgICAgIGlmIChvcHRpb25zLnN0b3BOb2Rlc1tpbmRleF0gPT09IGpQYXRoIHx8IG9wdGlvbnMuc3RvcE5vZGVzW2luZGV4XSA9PT0gXCIqLlwiICsgdGFnTmFtZSkgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZUVudGl0aWVzVmFsdWUodGV4dFZhbHVlLCBvcHRpb25zKSB7XG4gICAgaWYgKHRleHRWYWx1ZSAmJiB0ZXh0VmFsdWUubGVuZ3RoID4gMCAmJiBvcHRpb25zLnByb2Nlc3NFbnRpdGllcykge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9wdGlvbnMuZW50aXRpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGVudGl0eSA9IG9wdGlvbnMuZW50aXRpZXNbaV07XG4gICAgICAgICAgICB0ZXh0VmFsdWUgPSB0ZXh0VmFsdWUucmVwbGFjZShlbnRpdHkucmVnZXgsIGVudGl0eS52YWwpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0ZXh0VmFsdWU7XG59XG5tb2R1bGUuZXhwb3J0cyA9IHRvWG1sO1xuIiwgIid1c2Ugc3RyaWN0Jztcbi8vcGFyc2UgRW1wdHkgTm9kZSBhcyBzZWxmIGNsb3Npbmcgbm9kZVxuY29uc3QgYnVpbGRGcm9tT3JkZXJlZEpzID0gcmVxdWlyZSgnLi9vcmRlcmVkSnMyWG1sJyk7XG5jb25zdCBnZXRJZ25vcmVBdHRyaWJ1dGVzRm4gPSByZXF1aXJlKCcuLi9pZ25vcmVBdHRyaWJ1dGVzJylcblxuY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB7XG4gIGF0dHJpYnV0ZU5hbWVQcmVmaXg6ICdAXycsXG4gIGF0dHJpYnV0ZXNHcm91cE5hbWU6IGZhbHNlLFxuICB0ZXh0Tm9kZU5hbWU6ICcjdGV4dCcsXG4gIGlnbm9yZUF0dHJpYnV0ZXM6IHRydWUsXG4gIGNkYXRhUHJvcE5hbWU6IGZhbHNlLFxuICBmb3JtYXQ6IGZhbHNlLFxuICBpbmRlbnRCeTogJyAgJyxcbiAgc3VwcHJlc3NFbXB0eU5vZGU6IGZhbHNlLFxuICBzdXBwcmVzc1VucGFpcmVkTm9kZTogdHJ1ZSxcbiAgc3VwcHJlc3NCb29sZWFuQXR0cmlidXRlczogdHJ1ZSxcbiAgdGFnVmFsdWVQcm9jZXNzb3I6IGZ1bmN0aW9uKGtleSwgYSkge1xuICAgIHJldHVybiBhO1xuICB9LFxuICBhdHRyaWJ1dGVWYWx1ZVByb2Nlc3NvcjogZnVuY3Rpb24oYXR0ck5hbWUsIGEpIHtcbiAgICByZXR1cm4gYTtcbiAgfSxcbiAgcHJlc2VydmVPcmRlcjogZmFsc2UsXG4gIGNvbW1lbnRQcm9wTmFtZTogZmFsc2UsXG4gIHVucGFpcmVkVGFnczogW10sXG4gIGVudGl0aWVzOiBbXG4gICAgeyByZWdleDogbmV3IFJlZ0V4cChcIiZcIiwgXCJnXCIpLCB2YWw6IFwiJmFtcDtcIiB9LC8vaXQgbXVzdCBiZSBvbiB0b3BcbiAgICB7IHJlZ2V4OiBuZXcgUmVnRXhwKFwiPlwiLCBcImdcIiksIHZhbDogXCImZ3Q7XCIgfSxcbiAgICB7IHJlZ2V4OiBuZXcgUmVnRXhwKFwiPFwiLCBcImdcIiksIHZhbDogXCImbHQ7XCIgfSxcbiAgICB7IHJlZ2V4OiBuZXcgUmVnRXhwKFwiXFwnXCIsIFwiZ1wiKSwgdmFsOiBcIiZhcG9zO1wiIH0sXG4gICAgeyByZWdleDogbmV3IFJlZ0V4cChcIlxcXCJcIiwgXCJnXCIpLCB2YWw6IFwiJnF1b3Q7XCIgfVxuICBdLFxuICBwcm9jZXNzRW50aXRpZXM6IHRydWUsXG4gIHN0b3BOb2RlczogW10sXG4gIC8vIHRyYW5zZm9ybVRhZ05hbWU6IGZhbHNlLFxuICAvLyB0cmFuc2Zvcm1BdHRyaWJ1dGVOYW1lOiBmYWxzZSxcbiAgb25lTGlzdEdyb3VwOiBmYWxzZVxufTtcblxuZnVuY3Rpb24gQnVpbGRlcihvcHRpb25zKSB7XG4gIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcbiAgaWYgKHRoaXMub3B0aW9ucy5pZ25vcmVBdHRyaWJ1dGVzID09PSB0cnVlIHx8IHRoaXMub3B0aW9ucy5hdHRyaWJ1dGVzR3JvdXBOYW1lKSB7XG4gICAgdGhpcy5pc0F0dHJpYnV0ZSA9IGZ1bmN0aW9uKC8qYSovKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmlnbm9yZUF0dHJpYnV0ZXNGbiA9IGdldElnbm9yZUF0dHJpYnV0ZXNGbih0aGlzLm9wdGlvbnMuaWdub3JlQXR0cmlidXRlcylcbiAgICB0aGlzLmF0dHJQcmVmaXhMZW4gPSB0aGlzLm9wdGlvbnMuYXR0cmlidXRlTmFtZVByZWZpeC5sZW5ndGg7XG4gICAgdGhpcy5pc0F0dHJpYnV0ZSA9IGlzQXR0cmlidXRlO1xuICB9XG5cbiAgdGhpcy5wcm9jZXNzVGV4dE9yT2JqTm9kZSA9IHByb2Nlc3NUZXh0T3JPYmpOb2RlXG5cbiAgaWYgKHRoaXMub3B0aW9ucy5mb3JtYXQpIHtcbiAgICB0aGlzLmluZGVudGF0ZSA9IGluZGVudGF0ZTtcbiAgICB0aGlzLnRhZ0VuZENoYXIgPSAnPlxcbic7XG4gICAgdGhpcy5uZXdMaW5lID0gJ1xcbic7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5pbmRlbnRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9O1xuICAgIHRoaXMudGFnRW5kQ2hhciA9ICc+JztcbiAgICB0aGlzLm5ld0xpbmUgPSAnJztcbiAgfVxufVxuXG5CdWlsZGVyLnByb3RvdHlwZS5idWlsZCA9IGZ1bmN0aW9uKGpPYmopIHtcbiAgaWYodGhpcy5vcHRpb25zLnByZXNlcnZlT3JkZXIpe1xuICAgIHJldHVybiBidWlsZEZyb21PcmRlcmVkSnMoak9iaiwgdGhpcy5vcHRpb25zKTtcbiAgfWVsc2Uge1xuICAgIGlmKEFycmF5LmlzQXJyYXkoak9iaikgJiYgdGhpcy5vcHRpb25zLmFycmF5Tm9kZU5hbWUgJiYgdGhpcy5vcHRpb25zLmFycmF5Tm9kZU5hbWUubGVuZ3RoID4gMSl7XG4gICAgICBqT2JqID0ge1xuICAgICAgICBbdGhpcy5vcHRpb25zLmFycmF5Tm9kZU5hbWVdIDogak9ialxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5qMngoak9iaiwgMCwgW10pLnZhbDtcbiAgfVxufTtcblxuQnVpbGRlci5wcm90b3R5cGUuajJ4ID0gZnVuY3Rpb24oak9iaiwgbGV2ZWwsIGFqUGF0aCkge1xuICBsZXQgYXR0clN0ciA9ICcnO1xuICBsZXQgdmFsID0gJyc7XG4gIGNvbnN0IGpQYXRoID0gYWpQYXRoLmpvaW4oJy4nKVxuICBmb3IgKGxldCBrZXkgaW4gak9iaikge1xuICAgIGlmKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoak9iaiwga2V5KSkgY29udGludWU7XG4gICAgaWYgKHR5cGVvZiBqT2JqW2tleV0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBzdXByZXNzIHVuZGVmaW5lZCBub2RlIG9ubHkgaWYgaXQgaXMgbm90IGFuIGF0dHJpYnV0ZVxuICAgICAgaWYgKHRoaXMuaXNBdHRyaWJ1dGUoa2V5KSkge1xuICAgICAgICB2YWwgKz0gJyc7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChqT2JqW2tleV0gPT09IG51bGwpIHtcbiAgICAgIC8vIG51bGwgYXR0cmlidXRlIHNob3VsZCBiZSBpZ25vcmVkIGJ5IHRoZSBhdHRyaWJ1dGUgbGlzdCwgYnV0IHNob3VsZCBub3QgY2F1c2UgdGhlIHRhZyBjbG9zaW5nXG4gICAgICBpZiAodGhpcy5pc0F0dHJpYnV0ZShrZXkpKSB7XG4gICAgICAgIHZhbCArPSAnJztcbiAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSB0aGlzLm9wdGlvbnMuY2RhdGFQcm9wTmFtZSkge1xuICAgICAgICB2YWwgKz0gJyc7XG4gICAgICB9IGVsc2UgaWYgKGtleVswXSA9PT0gJz8nKSB7XG4gICAgICAgIHZhbCArPSB0aGlzLmluZGVudGF0ZShsZXZlbCkgKyAnPCcgKyBrZXkgKyAnPycgKyB0aGlzLnRhZ0VuZENoYXI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWwgKz0gdGhpcy5pbmRlbnRhdGUobGV2ZWwpICsgJzwnICsga2V5ICsgJy8nICsgdGhpcy50YWdFbmRDaGFyO1xuICAgICAgfVxuICAgICAgLy8gdmFsICs9IHRoaXMuaW5kZW50YXRlKGxldmVsKSArICc8JyArIGtleSArICcvJyArIHRoaXMudGFnRW5kQ2hhcjtcbiAgICB9IGVsc2UgaWYgKGpPYmpba2V5XSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgIHZhbCArPSB0aGlzLmJ1aWxkVGV4dFZhbE5vZGUoak9ialtrZXldLCBrZXksICcnLCBsZXZlbCk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygak9ialtrZXldICE9PSAnb2JqZWN0Jykge1xuICAgICAgLy9wcmVtaXRpdmUgdHlwZVxuICAgICAgY29uc3QgYXR0ciA9IHRoaXMuaXNBdHRyaWJ1dGUoa2V5KTtcbiAgICAgIGlmIChhdHRyICYmICF0aGlzLmlnbm9yZUF0dHJpYnV0ZXNGbihhdHRyLCBqUGF0aCkpIHtcbiAgICAgICAgYXR0clN0ciArPSB0aGlzLmJ1aWxkQXR0clBhaXJTdHIoYXR0ciwgJycgKyBqT2JqW2tleV0pO1xuICAgICAgfSBlbHNlIGlmICghYXR0cikge1xuICAgICAgICAvL3RhZyB2YWx1ZVxuICAgICAgICBpZiAoa2V5ID09PSB0aGlzLm9wdGlvbnMudGV4dE5vZGVOYW1lKSB7XG4gICAgICAgICAgbGV0IG5ld3ZhbCA9IHRoaXMub3B0aW9ucy50YWdWYWx1ZVByb2Nlc3NvcihrZXksICcnICsgak9ialtrZXldKTtcbiAgICAgICAgICB2YWwgKz0gdGhpcy5yZXBsYWNlRW50aXRpZXNWYWx1ZShuZXd2YWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbCArPSB0aGlzLmJ1aWxkVGV4dFZhbE5vZGUoak9ialtrZXldLCBrZXksICcnLCBsZXZlbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoak9ialtrZXldKSkge1xuICAgICAgLy9yZXBlYXRlZCBub2Rlc1xuICAgICAgY29uc3QgYXJyTGVuID0gak9ialtrZXldLmxlbmd0aDtcbiAgICAgIGxldCBsaXN0VGFnVmFsID0gXCJcIjtcbiAgICAgIGxldCBsaXN0VGFnQXR0ciA9IFwiXCI7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGFyckxlbjsgaisrKSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSBqT2JqW2tleV1bal07XG4gICAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAvLyBzdXByZXNzIHVuZGVmaW5lZCBub2RlXG4gICAgICAgIH0gZWxzZSBpZiAoaXRlbSA9PT0gbnVsbCkge1xuICAgICAgICAgIGlmKGtleVswXSA9PT0gXCI/XCIpIHZhbCArPSB0aGlzLmluZGVudGF0ZShsZXZlbCkgKyAnPCcgKyBrZXkgKyAnPycgKyB0aGlzLnRhZ0VuZENoYXI7XG4gICAgICAgICAgZWxzZSB2YWwgKz0gdGhpcy5pbmRlbnRhdGUobGV2ZWwpICsgJzwnICsga2V5ICsgJy8nICsgdGhpcy50YWdFbmRDaGFyO1xuICAgICAgICAgIC8vIHZhbCArPSB0aGlzLmluZGVudGF0ZShsZXZlbCkgKyAnPCcgKyBrZXkgKyAnLycgKyB0aGlzLnRhZ0VuZENoYXI7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgaWYodGhpcy5vcHRpb25zLm9uZUxpc3RHcm91cCl7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmoyeChpdGVtLCBsZXZlbCArIDEsIGFqUGF0aC5jb25jYXQoa2V5KSk7XG4gICAgICAgICAgICBsaXN0VGFnVmFsICs9IHJlc3VsdC52YWw7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmF0dHJpYnV0ZXNHcm91cE5hbWUgJiYgaXRlbS5oYXNPd25Qcm9wZXJ0eSh0aGlzLm9wdGlvbnMuYXR0cmlidXRlc0dyb3VwTmFtZSkpIHtcbiAgICAgICAgICAgICAgbGlzdFRhZ0F0dHIgKz0gcmVzdWx0LmF0dHJTdHJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGxpc3RUYWdWYWwgKz0gdGhpcy5wcm9jZXNzVGV4dE9yT2JqTm9kZShpdGVtLCBrZXksIGxldmVsLCBhalBhdGgpXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMub25lTGlzdEdyb3VwKSB7XG4gICAgICAgICAgICBsZXQgdGV4dFZhbHVlID0gdGhpcy5vcHRpb25zLnRhZ1ZhbHVlUHJvY2Vzc29yKGtleSwgaXRlbSk7XG4gICAgICAgICAgICB0ZXh0VmFsdWUgPSB0aGlzLnJlcGxhY2VFbnRpdGllc1ZhbHVlKHRleHRWYWx1ZSk7XG4gICAgICAgICAgICBsaXN0VGFnVmFsICs9IHRleHRWYWx1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGlzdFRhZ1ZhbCArPSB0aGlzLmJ1aWxkVGV4dFZhbE5vZGUoaXRlbSwga2V5LCAnJywgbGV2ZWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYodGhpcy5vcHRpb25zLm9uZUxpc3RHcm91cCl7XG4gICAgICAgIGxpc3RUYWdWYWwgPSB0aGlzLmJ1aWxkT2JqZWN0Tm9kZShsaXN0VGFnVmFsLCBrZXksIGxpc3RUYWdBdHRyLCBsZXZlbCk7XG4gICAgICB9XG4gICAgICB2YWwgKz0gbGlzdFRhZ1ZhbDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9uZXN0ZWQgbm9kZVxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5hdHRyaWJ1dGVzR3JvdXBOYW1lICYmIGtleSA9PT0gdGhpcy5vcHRpb25zLmF0dHJpYnV0ZXNHcm91cE5hbWUpIHtcbiAgICAgICAgY29uc3QgS3MgPSBPYmplY3Qua2V5cyhqT2JqW2tleV0pO1xuICAgICAgICBjb25zdCBMID0gS3MubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IEw7IGorKykge1xuICAgICAgICAgIGF0dHJTdHIgKz0gdGhpcy5idWlsZEF0dHJQYWlyU3RyKEtzW2pdLCAnJyArIGpPYmpba2V5XVtLc1tqXV0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWwgKz0gdGhpcy5wcm9jZXNzVGV4dE9yT2JqTm9kZShqT2JqW2tleV0sIGtleSwgbGV2ZWwsIGFqUGF0aClcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHthdHRyU3RyOiBhdHRyU3RyLCB2YWw6IHZhbH07XG59O1xuXG5CdWlsZGVyLnByb3RvdHlwZS5idWlsZEF0dHJQYWlyU3RyID0gZnVuY3Rpb24oYXR0ck5hbWUsIHZhbCl7XG4gIHZhbCA9IHRoaXMub3B0aW9ucy5hdHRyaWJ1dGVWYWx1ZVByb2Nlc3NvcihhdHRyTmFtZSwgJycgKyB2YWwpO1xuICB2YWwgPSB0aGlzLnJlcGxhY2VFbnRpdGllc1ZhbHVlKHZhbCk7XG4gIGlmICh0aGlzLm9wdGlvbnMuc3VwcHJlc3NCb29sZWFuQXR0cmlidXRlcyAmJiB2YWwgPT09IFwidHJ1ZVwiKSB7XG4gICAgcmV0dXJuICcgJyArIGF0dHJOYW1lO1xuICB9IGVsc2UgcmV0dXJuICcgJyArIGF0dHJOYW1lICsgJz1cIicgKyB2YWwgKyAnXCInO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzVGV4dE9yT2JqTm9kZSAob2JqZWN0LCBrZXksIGxldmVsLCBhalBhdGgpIHtcbiAgY29uc3QgcmVzdWx0ID0gdGhpcy5qMngob2JqZWN0LCBsZXZlbCArIDEsIGFqUGF0aC5jb25jYXQoa2V5KSk7XG4gIGlmIChvYmplY3RbdGhpcy5vcHRpb25zLnRleHROb2RlTmFtZV0gIT09IHVuZGVmaW5lZCAmJiBPYmplY3Qua2V5cyhvYmplY3QpLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiB0aGlzLmJ1aWxkVGV4dFZhbE5vZGUob2JqZWN0W3RoaXMub3B0aW9ucy50ZXh0Tm9kZU5hbWVdLCBrZXksIHJlc3VsdC5hdHRyU3RyLCBsZXZlbCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHRoaXMuYnVpbGRPYmplY3ROb2RlKHJlc3VsdC52YWwsIGtleSwgcmVzdWx0LmF0dHJTdHIsIGxldmVsKTtcbiAgfVxufVxuXG5CdWlsZGVyLnByb3RvdHlwZS5idWlsZE9iamVjdE5vZGUgPSBmdW5jdGlvbih2YWwsIGtleSwgYXR0clN0ciwgbGV2ZWwpIHtcbiAgaWYodmFsID09PSBcIlwiKXtcbiAgICBpZihrZXlbMF0gPT09IFwiP1wiKSByZXR1cm4gIHRoaXMuaW5kZW50YXRlKGxldmVsKSArICc8JyArIGtleSArIGF0dHJTdHIrICc/JyArIHRoaXMudGFnRW5kQ2hhcjtcbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmluZGVudGF0ZShsZXZlbCkgKyAnPCcgKyBrZXkgKyBhdHRyU3RyICsgdGhpcy5jbG9zZVRhZyhrZXkpICsgdGhpcy50YWdFbmRDaGFyO1xuICAgIH1cbiAgfWVsc2V7XG5cbiAgICBsZXQgdGFnRW5kRXhwID0gJzwvJyArIGtleSArIHRoaXMudGFnRW5kQ2hhcjtcbiAgICBsZXQgcGlDbG9zaW5nQ2hhciA9IFwiXCI7XG4gICAgXG4gICAgaWYoa2V5WzBdID09PSBcIj9cIikge1xuICAgICAgcGlDbG9zaW5nQ2hhciA9IFwiP1wiO1xuICAgICAgdGFnRW5kRXhwID0gXCJcIjtcbiAgICB9XG4gIFxuICAgIC8vIGF0dHJTdHIgaXMgYW4gZW1wdHkgc3RyaW5nIGluIGNhc2UgdGhlIGF0dHJpYnV0ZSBjYW1lIGFzIHVuZGVmaW5lZCBvciBudWxsXG4gICAgaWYgKChhdHRyU3RyIHx8IGF0dHJTdHIgPT09ICcnKSAmJiB2YWwuaW5kZXhPZignPCcpID09PSAtMSkge1xuICAgICAgcmV0dXJuICggdGhpcy5pbmRlbnRhdGUobGV2ZWwpICsgJzwnICsgIGtleSArIGF0dHJTdHIgKyBwaUNsb3NpbmdDaGFyICsgJz4nICsgdmFsICsgdGFnRW5kRXhwICk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuY29tbWVudFByb3BOYW1lICE9PSBmYWxzZSAmJiBrZXkgPT09IHRoaXMub3B0aW9ucy5jb21tZW50UHJvcE5hbWUgJiYgcGlDbG9zaW5nQ2hhci5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB0aGlzLmluZGVudGF0ZShsZXZlbCkgKyBgPCEtLSR7dmFsfS0tPmAgKyB0aGlzLm5ld0xpbmU7XG4gICAgfWVsc2Uge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgdGhpcy5pbmRlbnRhdGUobGV2ZWwpICsgJzwnICsga2V5ICsgYXR0clN0ciArIHBpQ2xvc2luZ0NoYXIgKyB0aGlzLnRhZ0VuZENoYXIgK1xuICAgICAgICB2YWwgK1xuICAgICAgICB0aGlzLmluZGVudGF0ZShsZXZlbCkgKyB0YWdFbmRFeHAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuQnVpbGRlci5wcm90b3R5cGUuY2xvc2VUYWcgPSBmdW5jdGlvbihrZXkpe1xuICBsZXQgY2xvc2VUYWcgPSBcIlwiO1xuICBpZih0aGlzLm9wdGlvbnMudW5wYWlyZWRUYWdzLmluZGV4T2Yoa2V5KSAhPT0gLTEpeyAvL3VucGFpcmVkXG4gICAgaWYoIXRoaXMub3B0aW9ucy5zdXBwcmVzc1VucGFpcmVkTm9kZSkgY2xvc2VUYWcgPSBcIi9cIlxuICB9ZWxzZSBpZih0aGlzLm9wdGlvbnMuc3VwcHJlc3NFbXB0eU5vZGUpeyAvL2VtcHR5XG4gICAgY2xvc2VUYWcgPSBcIi9cIjtcbiAgfWVsc2V7XG4gICAgY2xvc2VUYWcgPSBgPjwvJHtrZXl9YFxuICB9XG4gIHJldHVybiBjbG9zZVRhZztcbn1cblxuZnVuY3Rpb24gYnVpbGRFbXB0eU9iak5vZGUodmFsLCBrZXksIGF0dHJTdHIsIGxldmVsKSB7XG4gIGlmICh2YWwgIT09ICcnKSB7XG4gICAgcmV0dXJuIHRoaXMuYnVpbGRPYmplY3ROb2RlKHZhbCwga2V5LCBhdHRyU3RyLCBsZXZlbCk7XG4gIH0gZWxzZSB7XG4gICAgaWYoa2V5WzBdID09PSBcIj9cIikgcmV0dXJuICB0aGlzLmluZGVudGF0ZShsZXZlbCkgKyAnPCcgKyBrZXkgKyBhdHRyU3RyKyAnPycgKyB0aGlzLnRhZ0VuZENoYXI7XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gIHRoaXMuaW5kZW50YXRlKGxldmVsKSArICc8JyArIGtleSArIGF0dHJTdHIgKyAnLycgKyB0aGlzLnRhZ0VuZENoYXI7XG4gICAgICAvLyByZXR1cm4gdGhpcy5idWlsZFRhZ1N0cihsZXZlbCxrZXksIGF0dHJTdHIpO1xuICAgIH1cbiAgfVxufVxuXG5CdWlsZGVyLnByb3RvdHlwZS5idWlsZFRleHRWYWxOb2RlID0gZnVuY3Rpb24odmFsLCBrZXksIGF0dHJTdHIsIGxldmVsKSB7XG4gIGlmICh0aGlzLm9wdGlvbnMuY2RhdGFQcm9wTmFtZSAhPT0gZmFsc2UgJiYga2V5ID09PSB0aGlzLm9wdGlvbnMuY2RhdGFQcm9wTmFtZSkge1xuICAgIHJldHVybiB0aGlzLmluZGVudGF0ZShsZXZlbCkgKyBgPCFbQ0RBVEFbJHt2YWx9XV0+YCArICB0aGlzLm5ld0xpbmU7XG4gIH1lbHNlIGlmICh0aGlzLm9wdGlvbnMuY29tbWVudFByb3BOYW1lICE9PSBmYWxzZSAmJiBrZXkgPT09IHRoaXMub3B0aW9ucy5jb21tZW50UHJvcE5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5pbmRlbnRhdGUobGV2ZWwpICsgYDwhLS0ke3ZhbH0tLT5gICsgIHRoaXMubmV3TGluZTtcbiAgfWVsc2UgaWYoa2V5WzBdID09PSBcIj9cIikgey8vUEkgdGFnXG4gICAgcmV0dXJuICB0aGlzLmluZGVudGF0ZShsZXZlbCkgKyAnPCcgKyBrZXkgKyBhdHRyU3RyKyAnPycgKyB0aGlzLnRhZ0VuZENoYXI7IFxuICB9ZWxzZXtcbiAgICBsZXQgdGV4dFZhbHVlID0gdGhpcy5vcHRpb25zLnRhZ1ZhbHVlUHJvY2Vzc29yKGtleSwgdmFsKTtcbiAgICB0ZXh0VmFsdWUgPSB0aGlzLnJlcGxhY2VFbnRpdGllc1ZhbHVlKHRleHRWYWx1ZSk7XG4gIFxuICAgIGlmKCB0ZXh0VmFsdWUgPT09ICcnKXtcbiAgICAgIHJldHVybiB0aGlzLmluZGVudGF0ZShsZXZlbCkgKyAnPCcgKyBrZXkgKyBhdHRyU3RyICsgdGhpcy5jbG9zZVRhZyhrZXkpICsgdGhpcy50YWdFbmRDaGFyO1xuICAgIH1lbHNle1xuICAgICAgcmV0dXJuIHRoaXMuaW5kZW50YXRlKGxldmVsKSArICc8JyArIGtleSArIGF0dHJTdHIgKyAnPicgK1xuICAgICAgICAgdGV4dFZhbHVlICtcbiAgICAgICAgJzwvJyArIGtleSArIHRoaXMudGFnRW5kQ2hhcjtcbiAgICB9XG4gIH1cbn1cblxuQnVpbGRlci5wcm90b3R5cGUucmVwbGFjZUVudGl0aWVzVmFsdWUgPSBmdW5jdGlvbih0ZXh0VmFsdWUpe1xuICBpZih0ZXh0VmFsdWUgJiYgdGV4dFZhbHVlLmxlbmd0aCA+IDAgJiYgdGhpcy5vcHRpb25zLnByb2Nlc3NFbnRpdGllcyl7XG4gICAgZm9yIChsZXQgaT0wOyBpPHRoaXMub3B0aW9ucy5lbnRpdGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZW50aXR5ID0gdGhpcy5vcHRpb25zLmVudGl0aWVzW2ldO1xuICAgICAgdGV4dFZhbHVlID0gdGV4dFZhbHVlLnJlcGxhY2UoZW50aXR5LnJlZ2V4LCBlbnRpdHkudmFsKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRleHRWYWx1ZTtcbn1cblxuZnVuY3Rpb24gaW5kZW50YXRlKGxldmVsKSB7XG4gIHJldHVybiB0aGlzLm9wdGlvbnMuaW5kZW50QnkucmVwZWF0KGxldmVsKTtcbn1cblxuZnVuY3Rpb24gaXNBdHRyaWJ1dGUobmFtZSAvKiwgb3B0aW9ucyovKSB7XG4gIGlmIChuYW1lLnN0YXJ0c1dpdGgodGhpcy5vcHRpb25zLmF0dHJpYnV0ZU5hbWVQcmVmaXgpICYmIG5hbWUgIT09IHRoaXMub3B0aW9ucy50ZXh0Tm9kZU5hbWUpIHtcbiAgICByZXR1cm4gbmFtZS5zdWJzdHIodGhpcy5hdHRyUHJlZml4TGVuKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCdWlsZGVyO1xuIiwgIid1c2Ugc3RyaWN0JztcblxuY29uc3QgdmFsaWRhdG9yID0gcmVxdWlyZSgnLi92YWxpZGF0b3InKTtcbmNvbnN0IFhNTFBhcnNlciA9IHJlcXVpcmUoJy4veG1scGFyc2VyL1hNTFBhcnNlcicpO1xuY29uc3QgWE1MQnVpbGRlciA9IHJlcXVpcmUoJy4veG1sYnVpbGRlci9qc29uMnhtbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgWE1MUGFyc2VyOiBYTUxQYXJzZXIsXG4gIFhNTFZhbGlkYXRvcjogdmFsaWRhdG9yLFxuICBYTUxCdWlsZGVyOiBYTUxCdWlsZGVyXG59IiwgIi8vIEVsZWN0cm9uIG1haW4gcHJvY2Vzczogd2luZG93IGxpZmVjeWNsZSwgc2VjdXJpdHkgcG9saWN5LCBJUEMgd2lyaW5nIGZvclxuLy8gZXZlcnkgY2hhbm5lbCBpbiBzcmMvc2hhcmVkL2lwYy50cywgYW5kIHRoZSBhdXRvbWF0ZWQgc21va2Utc2NyZWVuc2hvdFxuLy8gbW9kZS4gRGF0YSBoYW5kbGVycyBuZXZlciByZWplY3QgXHUyMDE0IHRoZXkgdmFsaWRhdGUgaW5wdXRzIGFuZCBmYWxsIGJhY2sgdG9cbi8vIGRldGVybWluaXN0aWMgc2FtcGxlIHBheWxvYWRzIHNvIHRoZSByZW5kZXJlciBuZXZlciBzZWVzIGEgcmVqZWN0ZWRcbi8vIHByb21pc2UgKGFkZFRvV2F0Y2hsaXN0IHNpZ25hbHMgZmFpbHVyZSB2aWEgeyBvazogZmFsc2UgfSBpbnN0ZWFkKS5cblxuaW1wb3J0IHsgYXBwLCBCcm93c2VyV2luZG93LCBpcGNNYWluLCBzaGVsbCB9IGZyb20gJ2VsZWN0cm9uJztcbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBJUEMgfSBmcm9tICcuLi9zaGFyZWQvaXBjJztcbmltcG9ydCB0eXBlIHtcbiAgQWRkV2F0Y2hsaXN0UmVzdWx0LFxuICBDaGFydFJhbmdlLFxuICBIb2xkaW5nc1Jlc3VsdCxcbiAgTGxtU2V0dGluZ3MsXG4gIE1hY3JvT3ZlcmxheUtleSxcbiAgUGl2b3RQb2ludCxcbiAgUXVhbnRJbnNpZ2h0UmVxdWVzdCxcbn0gZnJvbSAnLi4vc2hhcmVkL3R5cGVzJztcbmltcG9ydCB7IENIQVJUX1JBTkdFUyB9IGZyb20gJy4uL3NoYXJlZC90eXBlcyc7XG5pbXBvcnQgeyBnZXRDaGFydCB9IGZyb20gJy4vc2VydmljZXMvY2hhcnQnO1xuaW1wb3J0IHsgZ2V0RWFybmluZ3MgfSBmcm9tICcuL3NlcnZpY2VzL2Vhcm5pbmdzJztcbmltcG9ydCB7IGdldEhvbGRpbmdzIH0gZnJvbSAnLi9zZXJ2aWNlcy9ob2xkaW5ncyc7XG5pbXBvcnQgeyBnZXRMbG1TZXR0aW5ncywgc2F2ZUxsbVNldHRpbmdzIH0gZnJvbSAnLi9zZXJ2aWNlcy9sbG1TZXR0aW5ncyc7XG5pbXBvcnQgeyBnZXRNYWNyb092ZXJsYXkgfSBmcm9tICcuL3NlcnZpY2VzL21hY3JvJztcbmltcG9ydCB7IGdldFF1YW50SW5zaWdodHMsIHNhdmVRdWFudEluc2lnaHQgfSBmcm9tICcuL3NlcnZpY2VzL2luc2lnaHRTdG9yZSc7XG5pbXBvcnQgeyBnZXROZXdzIH0gZnJvbSAnLi9zZXJ2aWNlcy9uZXdzJztcbmltcG9ydCB7IGdldFBpdm90TmV3cyB9IGZyb20gJy4vc2VydmljZXMvcGl2b3ROZXdzJztcbmltcG9ydCB7IGFuYWx5emVRdWFudCB9IGZyb20gJy4vc2VydmljZXMvcXVhbnRBaSc7XG5pbXBvcnQgeyBnZXRRdW90ZXMgfSBmcm9tICcuL3NlcnZpY2VzL3F1b3Rlcyc7XG5pbXBvcnQgeyBnZXRWYWx1YXRpb24gfSBmcm9tICcuL3NlcnZpY2VzL3ZhbHVhdGlvbic7XG5pbXBvcnQgeyBzYW1wbGVDaGFydCwgc2FtcGxlRWFybmluZ3MsIHNhbXBsZU5ld3MsIHNhbXBsZVF1b3RlIH0gZnJvbSAnLi9zZXJ2aWNlcy9zYW1wbGUnO1xuaW1wb3J0IHsgc2VhcmNoU3ltYm9scyB9IGZyb20gJy4vc2VydmljZXMvc3ltYm9scyc7XG5pbXBvcnQgeyBjbGFtcEludCwgY2xlYW5TeW1ib2xMaXN0LCBub3JtYWxpemVTeW1ib2wsIHRvZGF5WW1kIH0gZnJvbSAnLi9zZXJ2aWNlcy91dGlsJztcbmltcG9ydCB7XG4gIGFkZFRvV2F0Y2hsaXN0LFxuICBnZXRXYXRjaGxpc3QsXG4gIHJlbW92ZUZyb21XYXRjaGxpc3QsXG59IGZyb20gJy4vc2VydmljZXMvd2F0Y2hsaXN0U3RvcmUnO1xuXG5jb25zdCBNQVhfUVVPVEVfU1lNQk9MUyA9IDYwO1xuY29uc3QgTUFYX05FV1NfU1lNQk9MUyA9IDQwO1xuY29uc3QgTUFYX0VBUk5JTkdTX1NZTUJPTFMgPSA2MDtcbmNvbnN0IE1BWF9QSVZPVFMgPSAxMjtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBDTEkgZmxhZ3MgKHNtb2tlIG1vZGUpXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY29uc3QgaXNTbW9rZSA9IHByb2Nlc3MuYXJndi5pbmNsdWRlcygnLS1zbW9rZScpO1xuY29uc3QgZm9yY2VPbmJvYXJkaW5nID1cbiAgcHJvY2Vzcy5hcmd2LmluY2x1ZGVzKCctLW9uYm9hcmRpbmcnKSB8fCBwcm9jZXNzLmFyZ3YuaW5jbHVkZXMoJy0tc21va2Utb25ib2FyZGluZycpO1xuY29uc3Qgc21va2VNb2RhbEFyZyA9IHByb2Nlc3MuYXJndi5maW5kKChhcmcpID0+IGFyZy5zdGFydHNXaXRoKCctLXNtb2tlLW1vZGFsPScpKTtcbmNvbnN0IHNtb2tlTW9kYWxTeW1ib2wgPSBzbW9rZU1vZGFsQXJnXG4gID8gbm9ybWFsaXplU3ltYm9sKHNtb2tlTW9kYWxBcmcuc2xpY2UoJy0tc21va2UtbW9kYWw9Jy5sZW5ndGgpKVxuICA6IG51bGw7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gSW5wdXQgdmFsaWRhdGlvbiBoZWxwZXJzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZnVuY3Rpb24gY2xlYW5QaXZvdHMocmF3OiB1bmtub3duKTogUGl2b3RQb2ludFtdIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KHJhdykpIHJldHVybiBbXTtcbiAgY29uc3Qgb3V0OiBQaXZvdFBvaW50W10gPSBbXTtcbiAgZm9yIChjb25zdCBlbnRyeSBvZiByYXcpIHtcbiAgICBpZiAoIWVudHJ5IHx8IHR5cGVvZiBlbnRyeSAhPT0gJ29iamVjdCcpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHAgPSBlbnRyeSBhcyBQYXJ0aWFsPFBpdm90UG9pbnQ+O1xuICAgIGlmICh0eXBlb2YgcC50aW1lICE9PSAnbnVtYmVyJyB8fCAhTnVtYmVyLmlzRmluaXRlKHAudGltZSkpIGNvbnRpbnVlO1xuICAgIGlmICh0eXBlb2YgcC5wcmljZSAhPT0gJ251bWJlcicgfHwgIU51bWJlci5pc0Zpbml0ZShwLnByaWNlKSkgY29udGludWU7XG4gICAgaWYgKHAua2luZCAhPT0gJ2hpZ2gnICYmIHAua2luZCAhPT0gJ2xvdycpIGNvbnRpbnVlO1xuICAgIG91dC5wdXNoKHsgdGltZTogcC50aW1lLCBwcmljZTogcC5wcmljZSwga2luZDogcC5raW5kIH0pO1xuICAgIGlmIChvdXQubGVuZ3RoID49IE1BWF9QSVZPVFMpIGJyZWFrO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIGNsZWFuUmFuZ2UocmF3OiB1bmtub3duKTogQ2hhcnRSYW5nZSB7XG4gIHJldHVybiBDSEFSVF9SQU5HRVMuaW5jbHVkZXMocmF3IGFzIENoYXJ0UmFuZ2UpID8gKHJhdyBhcyBDaGFydFJhbmdlKSA6ICc2bSc7XG59XG5cbmZ1bmN0aW9uIGNsZWFuTWFjcm9PdmVybGF5S2V5KHJhdzogdW5rbm93bik6IE1hY3JvT3ZlcmxheUtleSB7XG4gIHJldHVybiByYXcgPT09ICdqb2JzJyB8fFxuICAgIHJhdyA9PT0gJ3VuZW1wbG95bWVudCcgfHxcbiAgICByYXcgPT09ICdpbmZsYXRpb24nIHx8XG4gICAgcmF3ID09PSAndHJlYXN1cnkxMHknIHx8XG4gICAgcmF3ID09PSAnb2lsJyB8fFxuICAgIHJhdyA9PT0gJ3ZpeCdcbiAgICA/IHJhd1xuICAgIDogJ2pvYnMnO1xufVxuXG5mdW5jdGlvbiBjbGVhblF1YW50SW5zaWdodFJlcXVlc3QocmF3OiB1bmtub3duKTogUXVhbnRJbnNpZ2h0UmVxdWVzdCB8IG51bGwge1xuICBpZiAoIXJhdyB8fCB0eXBlb2YgcmF3ICE9PSAnb2JqZWN0JykgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHIgPSByYXcgYXMgUGFydGlhbDxRdWFudEluc2lnaHRSZXF1ZXN0PjtcbiAgY29uc3Qgc3ltYm9sID0gbm9ybWFsaXplU3ltYm9sKHIuc3ltYm9sKTtcbiAgaWYgKCFzeW1ib2wpIHJldHVybiBudWxsO1xuICBpZiAoIXIuZXZhbHVhdGlvbiB8fCB0eXBlb2Ygci5ldmFsdWF0aW9uICE9PSAnb2JqZWN0JykgcmV0dXJuIG51bGw7XG4gIHJldHVybiB7XG4gICAgc3ltYm9sLFxuICAgIHJhbmdlOiBjbGVhblJhbmdlKHIucmFuZ2UpLFxuICAgIGV2YWx1YXRpb246IHIuZXZhbHVhdGlvbiBhcyBRdWFudEluc2lnaHRSZXF1ZXN0WydldmFsdWF0aW9uJ10sXG4gICAgbmV3czogQXJyYXkuaXNBcnJheShyLm5ld3MpID8gci5uZXdzLnNsaWNlKDAsIDEyKSA6IFtdLFxuICAgIGVhcm5pbmdzOiByLmVhcm5pbmdzICYmIHR5cGVvZiByLmVhcm5pbmdzID09PSAnb2JqZWN0JyA/IHIuZWFybmluZ3MgOiBudWxsLFxuICAgIHZhbHVhdGlvbjogci52YWx1YXRpb24gJiYgdHlwZW9mIHIudmFsdWF0aW9uID09PSAnb2JqZWN0JyA/IHIudmFsdWF0aW9uIDogbnVsbCxcbiAgICBtYWNyb092ZXJsYXlzOiBBcnJheS5pc0FycmF5KHIubWFjcm9PdmVybGF5cylcbiAgICAgID8gci5tYWNyb092ZXJsYXlzLnNsaWNlKDAsIDgpLm1hcCgoc2VyaWVzKSA9PiAoe1xuICAgICAgICAgIC4uLnNlcmllcyxcbiAgICAgICAgICBwb2ludHM6IEFycmF5LmlzQXJyYXkoc2VyaWVzLnBvaW50cykgPyBzZXJpZXMucG9pbnRzLnNsaWNlKC02MCkgOiBbXSxcbiAgICAgICAgfSkpXG4gICAgICA6IFtdLFxuICAgIHNuYXBzaG90RGF0YVVybDogdHlwZW9mIHIuc25hcHNob3REYXRhVXJsID09PSAnc3RyaW5nJyA/IHIuc25hcHNob3REYXRhVXJsLnNsaWNlKDAsIDFfMDAwXzAwMCkgOiB1bmRlZmluZWQsXG4gICAgcXVlc3Rpb246IHR5cGVvZiByLnF1ZXN0aW9uID09PSAnc3RyaW5nJyA/IHIucXVlc3Rpb24uc2xpY2UoMCwgMTIwMCkgOiB1bmRlZmluZWQsXG4gICAgdGhpbmtpbmdNb2RlOiByLnRoaW5raW5nTW9kZSA9PT0gdHJ1ZSxcbiAgfTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBJUEMgaGFuZGxlcnMgXHUyMDE0IG9uZSBwZXIgY2hhbm5lbCwgc2lnbmF0dXJlcyBtYXRjaGluZyBRdWFudEFwaVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmZ1bmN0aW9uIHJlZ2lzdGVySXBjSGFuZGxlcnMoKTogdm9pZCB7XG4gIGlwY01haW4uaGFuZGxlKElQQy53YXRjaGxpc3RHZXQsICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGdldFdhdGNobGlzdCgpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgfSk7XG5cbiAgaXBjTWFpbi5oYW5kbGUoSVBDLndhdGNobGlzdEFkZCwgYXN5bmMgKF9lLCByYXdTeW1ib2w6IHVua25vd24pOiBQcm9taXNlPEFkZFdhdGNobGlzdFJlc3VsdD4gPT4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIHJhd1N5bWJvbCAhPT0gJ3N0cmluZycpIHJldHVybiB7IG9rOiBmYWxzZSwgZXJyb3I6ICdJbnZhbGlkIHN5bWJvbCcgfTtcbiAgICAgIHJldHVybiBhd2FpdCBhZGRUb1dhdGNobGlzdChyYXdTeW1ib2wpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBlcnJvcjogJ0NvdWxkIG5vdCBhZGQgc3ltYm9sJyB9O1xuICAgIH1cbiAgfSk7XG5cbiAgaXBjTWFpbi5oYW5kbGUoSVBDLndhdGNobGlzdFJlbW92ZSwgKF9lLCByYXdTeW1ib2w6IHVua25vd24pID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3ltYm9sID0gbm9ybWFsaXplU3ltYm9sKHJhd1N5bWJvbCk7XG4gICAgICByZXR1cm4gc3ltYm9sID8gcmVtb3ZlRnJvbVdhdGNobGlzdChzeW1ib2wpIDogZ2V0V2F0Y2hsaXN0KCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICB9KTtcblxuICBpcGNNYWluLmhhbmRsZShJUEMuc3ltYm9sc1NlYXJjaCwgYXN5bmMgKF9lLCByYXdRdWVyeTogdW5rbm93bikgPT4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIHJhd1F1ZXJ5ICE9PSAnc3RyaW5nJykgcmV0dXJuIFtdO1xuICAgICAgcmV0dXJuIGF3YWl0IHNlYXJjaFN5bWJvbHMocmF3UXVlcnkpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgfSk7XG5cbiAgaXBjTWFpbi5oYW5kbGUoSVBDLnF1b3Rlc0dldCwgYXN5bmMgKF9lLCByYXdTeW1ib2xzOiB1bmtub3duKSA9PiB7XG4gICAgY29uc3Qgc3ltYm9scyA9IGNsZWFuU3ltYm9sTGlzdChyYXdTeW1ib2xzLCBNQVhfUVVPVEVfU1lNQk9MUyk7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBnZXRRdW90ZXMoc3ltYm9scyk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gc3ltYm9scy5tYXAoKHMpID0+IHNhbXBsZVF1b3RlKHMpKTtcbiAgICB9XG4gIH0pO1xuXG4gIGlwY01haW4uaGFuZGxlKElQQy5ob2xkaW5nc0dldCwgYXN5bmMgKF9lLCByYXdTeW1ib2w6IHVua25vd24pOiBQcm9taXNlPEhvbGRpbmdzUmVzdWx0PiA9PiB7XG4gICAgY29uc3Qgc3ltYm9sID0gbm9ybWFsaXplU3ltYm9sKHJhd1N5bWJvbCk7XG4gICAgaWYgKCFzeW1ib2wpIHtcbiAgICAgIHJldHVybiB7IGV0ZlN5bWJvbDogJycsIGFzT2Y6IHRvZGF5WW1kKCksIGhvbGRpbmdzOiBbXSwgc291cmNlOiAnc2FtcGxlJyB9O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IGdldEhvbGRpbmdzKHN5bWJvbCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4geyBldGZTeW1ib2w6IHN5bWJvbCwgYXNPZjogdG9kYXlZbWQoKSwgaG9sZGluZ3M6IFtdLCBzb3VyY2U6ICdzYW1wbGUnIH07XG4gICAgfVxuICB9KTtcblxuICBpcGNNYWluLmhhbmRsZShJUEMubmV3c0dldCwgYXN5bmMgKF9lLCByYXdTeW1ib2xzOiB1bmtub3duLCByYXdMaW1pdDogdW5rbm93bikgPT4ge1xuICAgIGNvbnN0IHN5bWJvbHMgPSBjbGVhblN5bWJvbExpc3QocmF3U3ltYm9scywgTUFYX05FV1NfU1lNQk9MUyk7XG4gICAgY29uc3QgbGltaXRQZXJTeW1ib2wgPSBjbGFtcEludChyYXdMaW1pdCwgMSwgMjAsIDYpO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgZ2V0TmV3cyhzeW1ib2xzLCBsaW1pdFBlclN5bWJvbCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gc2FtcGxlTmV3cyhzeW1ib2xzKTtcbiAgICB9XG4gIH0pO1xuXG4gIGlwY01haW4uaGFuZGxlKElQQy5lYXJuaW5nc0dldCwgYXN5bmMgKF9lLCByYXdTeW1ib2xzOiB1bmtub3duKSA9PiB7XG4gICAgY29uc3Qgc3ltYm9scyA9IGNsZWFuU3ltYm9sTGlzdChyYXdTeW1ib2xzLCBNQVhfRUFSTklOR1NfU1lNQk9MUyk7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBnZXRFYXJuaW5ncyhzeW1ib2xzKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBzeW1ib2xzLm1hcCgocykgPT4gc2FtcGxlRWFybmluZ3MocykpO1xuICAgIH1cbiAgfSk7XG5cbiAgaXBjTWFpbi5oYW5kbGUoSVBDLmNoYXJ0R2V0LCBhc3luYyAoX2UsIHJhd1N5bWJvbDogdW5rbm93biwgcmF3UmFuZ2U6IHVua25vd24pID0+IHtcbiAgICBjb25zdCBzeW1ib2wgPSBub3JtYWxpemVTeW1ib2wocmF3U3ltYm9sKSA/PyAnU1BZJztcbiAgICBjb25zdCByYW5nZSA9IGNsZWFuUmFuZ2UocmF3UmFuZ2UpO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgZ2V0Q2hhcnQoc3ltYm9sLCByYW5nZSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gc2FtcGxlQ2hhcnQoc3ltYm9sLCByYW5nZSk7XG4gICAgfVxuICB9KTtcblxuICBpcGNNYWluLmhhbmRsZShJUEMucGl2b3ROZXdzR2V0LCBhc3luYyAoX2UsIHJhd1N5bWJvbDogdW5rbm93biwgcmF3UGl2b3RzOiB1bmtub3duKSA9PiB7XG4gICAgY29uc3QgcGl2b3RzID0gY2xlYW5QaXZvdHMocmF3UGl2b3RzKTtcbiAgICBjb25zdCBzeW1ib2wgPSBub3JtYWxpemVTeW1ib2wocmF3U3ltYm9sKTtcbiAgICBpZiAoIXN5bWJvbCkgcmV0dXJuIHBpdm90cy5tYXAoKHBpdm90KSA9PiAoeyBwaXZvdCwgaXRlbXM6IFtdIH0pKTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IGdldFBpdm90TmV3cyhzeW1ib2wsIHBpdm90cyk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gcGl2b3RzLm1hcCgocGl2b3QpID0+ICh7IHBpdm90LCBpdGVtczogW10gfSkpO1xuICAgIH1cbiAgfSk7XG5cbiAgaXBjTWFpbi5oYW5kbGUoSVBDLm1hY3JvT3ZlcmxheUdldCwgYXN5bmMgKF9lLCByYXdLZXk6IHVua25vd24sIHJhd1JhbmdlOiB1bmtub3duKSA9PiB7XG4gICAgY29uc3Qga2V5ID0gY2xlYW5NYWNyb092ZXJsYXlLZXkocmF3S2V5KTtcbiAgICBjb25zdCByYW5nZSA9IGNsZWFuUmFuZ2UocmF3UmFuZ2UpO1xuICAgIHJldHVybiBnZXRNYWNyb092ZXJsYXkoa2V5LCByYW5nZSk7XG4gIH0pO1xuXG4gIGlwY01haW4uaGFuZGxlKElQQy5jaGFydFNuYXBzaG90Q2FwdHVyZSwgYXN5bmMgKCkgPT4ge1xuICAgIGlmICghbWFpbldpbmRvdyB8fCBtYWluV2luZG93LmlzRGVzdHJveWVkKCkpIHJldHVybiBudWxsO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBpbWFnZSA9IGF3YWl0IG1haW5XaW5kb3cud2ViQ29udGVudHMuY2FwdHVyZVBhZ2UoKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRhdGFVcmw6IGltYWdlLnRvRGF0YVVSTCgpLFxuICAgICAgICBjYXB0dXJlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9KTtcblxuICBpcGNNYWluLmhhbmRsZShJUEMucXVhbnRBbmFseXplLCBhc3luYyAoX2UsIHJhd1JlcXVlc3Q6IHVua25vd24pID0+IHtcbiAgICBjb25zdCByZXF1ZXN0ID0gY2xlYW5RdWFudEluc2lnaHRSZXF1ZXN0KHJhd1JlcXVlc3QpO1xuICAgIGlmICghcmVxdWVzdCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICBzb3VyY2U6ICdkZXRlcm1pbmlzdGljLWZhbGxiYWNrJyxcbiAgICAgICAgYW5zd2VyOiAnUXVhbnQgYW5hbHlzaXMgY291bGQgbm90IHJ1biBiZWNhdXNlIHRoZSByZXF1ZXN0IHBheWxvYWQgd2FzIGludmFsaWQuJyxcbiAgICAgICAgZ2VuZXJhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgZXJyb3I6ICdJbnZhbGlkIHJlcXVlc3QnLFxuICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBhbmFseXplUXVhbnQocmVxdWVzdCk7XG4gICAgdHJ5IHtcbiAgICAgIHNhdmVRdWFudEluc2lnaHQocmVxdWVzdCwgcmVzcG9uc2UpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcignW3F1YW50XSBzYXZlIGluc2lnaHQgZmFpbGVkOicsIGVycik7XG4gICAgfVxuICAgIHJldHVybiByZXNwb25zZTtcbiAgfSk7XG5cbiAgaXBjTWFpbi5oYW5kbGUoSVBDLnF1YW50SW5zaWdodHNHZXQsIGFzeW5jIChfZSwgcmF3U3ltYm9sOiB1bmtub3duLCByYXdSYW5nZTogdW5rbm93bikgPT4ge1xuICAgIGNvbnN0IHN5bWJvbCA9IG5vcm1hbGl6ZVN5bWJvbChyYXdTeW1ib2wpO1xuICAgIGlmICghc3ltYm9sKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGdldFF1YW50SW5zaWdodHMoc3ltYm9sLCBDSEFSVF9SQU5HRVMuaW5jbHVkZXMocmF3UmFuZ2UgYXMgQ2hhcnRSYW5nZSkgPyAocmF3UmFuZ2UgYXMgQ2hhcnRSYW5nZSkgOiB1bmRlZmluZWQpO1xuICB9KTtcblxuICBpcGNNYWluLmhhbmRsZShJUEMubGxtU2V0dGluZ3NHZXQsICgpID0+IGdldExsbVNldHRpbmdzKCkpO1xuXG4gIGlwY01haW4uaGFuZGxlKElQQy5sbG1TZXR0aW5nc1NhdmUsIChfZSwgcmF3U2V0dGluZ3M6IHVua25vd24pID0+IHtcbiAgICBjb25zdCBzID1cbiAgICAgIHJhd1NldHRpbmdzICYmIHR5cGVvZiByYXdTZXR0aW5ncyA9PT0gJ29iamVjdCdcbiAgICAgICAgPyAocmF3U2V0dGluZ3MgYXMgUGFydGlhbDxMbG1TZXR0aW5ncz4pXG4gICAgICAgIDoge307XG4gICAgcmV0dXJuIHNhdmVMbG1TZXR0aW5ncyh7XG4gICAgICBlbmFibGVkOiBzLmVuYWJsZWQgPT09IHRydWUsXG4gICAgICBiYXNlVXJsOiB0eXBlb2Ygcy5iYXNlVXJsID09PSAnc3RyaW5nJyA/IHMuYmFzZVVybCA6IHVuZGVmaW5lZCxcbiAgICAgIG1vZGVsOiB0eXBlb2Ygcy5tb2RlbCA9PT0gJ3N0cmluZycgPyBzLm1vZGVsIDogdW5kZWZpbmVkLFxuICAgIH0pO1xuICB9KTtcblxuICBpcGNNYWluLmhhbmRsZShJUEMudmFsdWF0aW9uR2V0LCBhc3luYyAoX2UsIHJhd1N5bWJvbDogdW5rbm93bikgPT4ge1xuICAgIGNvbnN0IHN5bWJvbCA9IG5vcm1hbGl6ZVN5bWJvbChyYXdTeW1ib2wpO1xuICAgIHJldHVybiBnZXRWYWx1YXRpb24oc3ltYm9sID8/ICdTUFknKTtcbiAgfSk7XG5cbiAgaXBjTWFpbi5oYW5kbGUoSVBDLm9wZW5FeHRlcm5hbCwgYXN5bmMgKF9lLCByYXdVcmw6IHVua25vd24pID0+IHtcbiAgICBpZiAodHlwZW9mIHJhd1VybCAhPT0gJ3N0cmluZycpIHJldHVybjtcbiAgICBsZXQgcGFyc2VkOiBVUkw7XG4gICAgdHJ5IHtcbiAgICAgIHBhcnNlZCA9IG5ldyBVUkwocmF3VXJsKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHBhcnNlZC5wcm90b2NvbCAhPT0gJ2h0dHA6JyAmJiBwYXJzZWQucHJvdG9jb2wgIT09ICdodHRwczonKSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHNoZWxsLm9wZW5FeHRlcm5hbChwYXJzZWQudG9TdHJpbmcoKSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbc2hlbGxdIG9wZW5FeHRlcm5hbCBmYWlsZWQ6JywgZXJyKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFNtb2tlIG1vZGU6IHNjcmVlbnNob3QgYWZ0ZXIgbG9hZCwgdGhlbiBxdWl0LiBIYXJkIHRpbWVvdXQgYXQgNDVzLlxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmZ1bmN0aW9uIGFybVNtb2tlTW9kZSh3aW46IEJyb3dzZXJXaW5kb3cpOiB2b2lkIHtcbiAgLy8gU21va2UgcnVucyBleGVjdXRlIG9uIGEgbGl2ZSBkZXNrdG9wOiBzaGllbGQgdGhlIHdpbmRvdyBmcm9tIHN0cmF5IHVzZXJcbiAgLy8gY2xpY2tzL2tleXN0cm9rZXMgc28gYWNjaWRlbnRhbCBpbnB1dCBjYW4ndCBtdXRhdGUgVUkgc3RhdGUgKGUuZy4gb3BlbmluZ1xuICAvLyBvciBjbG9zaW5nIHRoZSBjaGFydCBtb2RhbCkgYmVmb3JlIHRoZSBzY3JlZW5zaG90IGlzIGNhcHR1cmVkLlxuICB3aW4uc2V0SWdub3JlTW91c2VFdmVudHModHJ1ZSk7XG4gIHdpbi5zZXRGb2N1c2FibGUoZmFsc2UpO1xuXG4gIHdpbi53ZWJDb250ZW50cy5vbignY29uc29sZS1tZXNzYWdlJywgKF9ldmVudCwgX2xldmVsLCBtZXNzYWdlKSA9PiB7XG4gICAgY29uc29sZS5sb2coJ1tyZW5kZXJlcl0gJyArIG1lc3NhZ2UpO1xuICB9KTtcbiAgLy8gU3VyZmFjZSByZW5kZXJlciBjcmFzaGVzL3JlbG9hZHMgaW4gc21va2UgbG9ncyBcdTIwMTQgYSBtaWQtcnVuIHJlbG9hZCByZXNldHNcbiAgLy8gcmVuZGVyZXIgc3RhdGUgYW5kIGNhbiBpbnZhbGlkYXRlIHRoZSBzY3JlZW5zaG90LlxuICB3aW4ud2ViQ29udGVudHMub24oJ3JlbmRlci1wcm9jZXNzLWdvbmUnLCAoX2V2ZW50LCBkZXRhaWxzKSA9PiB7XG4gICAgY29uc29sZS5lcnJvcignW3JlbmRlcmVyXSBwcm9jZXNzIGdvbmU6ICcgKyBkZXRhaWxzLnJlYXNvbik7XG4gIH0pO1xuICB3aW4ud2ViQ29udGVudHMub24oJ2RpZC1zdGFydC1uYXZpZ2F0aW9uJywgKF9ldmVudCwgdXJsLCBpc0luUGxhY2UsIGlzTWFpbkZyYW1lKSA9PiB7XG4gICAgaWYgKGlzTWFpbkZyYW1lICYmICFpc0luUGxhY2UpIGNvbnNvbGUubG9nKCdbc21va2VdIG1haW4tZnJhbWUgbmF2aWdhdGlvbjogJyArIHVybCk7XG4gIH0pO1xuXG4gIGNvbnN0IGtpbGxlciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1NNT0tFX0ZBSUwgaGFyZCB0aW1lb3V0IGFmdGVyIDQ1cycpO1xuICAgIGFwcC5leGl0KDEpO1xuICB9LCA0NV8wMDApO1xuICBraWxsZXIudW5yZWYoKTtcblxuICB3aW4ud2ViQ29udGVudHMub25jZSgnZGlkLWZpbmlzaC1sb2FkJywgKCkgPT4ge1xuICAgIGNvbnN0IGVudkRlbGF5ID0gTnVtYmVyKHByb2Nlc3MuZW52LlFVQU5UX1NNT0tFX0RFTEFZX01TKTtcbiAgICBjb25zdCBkZWxheU1zID1cbiAgICAgIE51bWJlci5pc0Zpbml0ZShlbnZEZWxheSkgJiYgZW52RGVsYXkgPiAwXG4gICAgICAgID8gTWF0aC5taW4oZW52RGVsYXksIDQwXzAwMClcbiAgICAgICAgOiBzbW9rZU1vZGFsU3ltYm9sXG4gICAgICAgICAgPyAxNl8wMDBcbiAgICAgICAgICA6IDEzXzAwMDtcbiAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGltYWdlID0gYXdhaXQgd2luLndlYkNvbnRlbnRzLmNhcHR1cmVQYWdlKCk7XG4gICAgICAgIGNvbnN0IG91dFBhdGggPVxuICAgICAgICAgIHByb2Nlc3MuZW52LlFVQU5UX1NNT0tFX09VVCB8fFxuICAgICAgICAgIHBhdGguam9pbihcbiAgICAgICAgICAgIGFwcC5nZXRBcHBQYXRoKCksXG4gICAgICAgICAgICBzbW9rZU1vZGFsU3ltYm9sID8gJ2Rpc3Qvc21va2UtbW9kYWwucG5nJyA6ICdkaXN0L3Ntb2tlLnBuZycsXG4gICAgICAgICAgKTtcbiAgICAgICAgZnMubWtkaXJTeW5jKHBhdGguZGlybmFtZShvdXRQYXRoKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMob3V0UGF0aCwgaW1hZ2UudG9QTkcoKSk7XG4gICAgICAgIGNsZWFyVGltZW91dChraWxsZXIpO1xuICAgICAgICBjb25zb2xlLmxvZygnU01PS0VfT0sgJyArIG91dFBhdGgpO1xuICAgICAgICBhcHAucXVpdCgpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1NNT0tFX0ZBSUwnLCBlcnIpO1xuICAgICAgICBwcm9jZXNzLmV4aXRDb2RlID0gMTtcbiAgICAgICAgYXBwLnF1aXQoKTtcbiAgICAgIH1cbiAgICB9LCBkZWxheU1zKTtcbiAgfSk7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gV2luZG93ICsgYXBwIGxpZmVjeWNsZVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmxldCBtYWluV2luZG93OiBCcm93c2VyV2luZG93IHwgbnVsbCA9IG51bGw7XG5cbmZ1bmN0aW9uIGNyZWF0ZVdpbmRvdygpOiB2b2lkIHtcbiAgY29uc3Qgd2luID0gbmV3IEJyb3dzZXJXaW5kb3coe1xuICAgIHdpZHRoOiAxNTYwLFxuICAgIGhlaWdodDogOTQwLFxuICAgIG1pbldpZHRoOiAxMjAwLFxuICAgIG1pbkhlaWdodDogNzYwLFxuICAgIGJhY2tncm91bmRDb2xvcjogJyMwYTBlMTYnLFxuICAgIGF1dG9IaWRlTWVudUJhcjogdHJ1ZSxcbiAgICB0aXRsZTogJ1F1YW50JyxcbiAgICB3ZWJQcmVmZXJlbmNlczoge1xuICAgICAgcHJlbG9hZDogcGF0aC5qb2luKF9fZGlybmFtZSwgJ3ByZWxvYWQuanMnKSxcbiAgICAgIGNvbnRleHRJc29sYXRpb246IHRydWUsXG4gICAgICBub2RlSW50ZWdyYXRpb246IGZhbHNlLFxuICAgICAgc2FuZGJveDogdHJ1ZSxcbiAgICB9LFxuICB9KTtcbiAgbWFpbldpbmRvdyA9IHdpbjtcbiAgd2luLm9uKCdjbG9zZWQnLCAoKSA9PiB7XG4gICAgaWYgKG1haW5XaW5kb3cgPT09IHdpbikgbWFpbldpbmRvdyA9IG51bGw7XG4gIH0pO1xuXG4gIC8vIFNlY3VyaXR5OiBuZXZlciBvcGVuIGNoaWxkIHdpbmRvd3MsIG5ldmVyIG5hdmlnYXRlIGF3YXkuXG4gIHdpbi53ZWJDb250ZW50cy5zZXRXaW5kb3dPcGVuSGFuZGxlcigoKSA9PiAoeyBhY3Rpb246ICdkZW55JyB9KSk7XG4gIHdpbi53ZWJDb250ZW50cy5vbignd2lsbC1uYXZpZ2F0ZScsIChldmVudCkgPT4gZXZlbnQucHJldmVudERlZmF1bHQoKSk7XG5cbiAgaWYgKGlzU21va2UpIGFybVNtb2tlTW9kZSh3aW4pO1xuXG4gIGNvbnN0IGluZGV4UGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9yZW5kZXJlci9pbmRleC5odG1sJyk7XG4gIGNvbnN0IHF1ZXJ5OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gIGlmIChzbW9rZU1vZGFsU3ltYm9sKSBxdWVyeS5zbW9rZU1vZGFsID0gc21va2VNb2RhbFN5bWJvbDtcbiAgaWYgKGZvcmNlT25ib2FyZGluZykgcXVlcnkub25ib2FyZGluZyA9ICcxJztcbiAgaWYgKE9iamVjdC5rZXlzKHF1ZXJ5KS5sZW5ndGgpIHtcbiAgICB2b2lkIHdpbi5sb2FkRmlsZShpbmRleFBhdGgsIHsgcXVlcnkgfSk7XG4gIH0gZWxzZSB7XG4gICAgdm9pZCB3aW4ubG9hZEZpbGUoaW5kZXhQYXRoKTtcbiAgfVxufVxuXG5jb25zdCBnb3RMb2NrID0gYXBwLnJlcXVlc3RTaW5nbGVJbnN0YW5jZUxvY2soKTtcbmlmICghZ290TG9jaykge1xuICBhcHAucXVpdCgpO1xufSBlbHNlIHtcbiAgYXBwLm9uKCdzZWNvbmQtaW5zdGFuY2UnLCAoKSA9PiB7XG4gICAgaWYgKG1haW5XaW5kb3cpIHtcbiAgICAgIGlmIChtYWluV2luZG93LmlzTWluaW1pemVkKCkpIG1haW5XaW5kb3cucmVzdG9yZSgpO1xuICAgICAgbWFpbldpbmRvdy5mb2N1cygpO1xuICAgIH1cbiAgfSk7XG5cbiAgcHJvY2Vzcy5vbigndW5oYW5kbGVkUmVqZWN0aW9uJywgKHJlYXNvbikgPT4ge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1ttYWluXSB1bmhhbmRsZWQgcmVqZWN0aW9uOicsIHJlYXNvbik7XG4gIH0pO1xuXG4gIGFwcC53aGVuUmVhZHkoKS50aGVuKCgpID0+IHtcbiAgICByZWdpc3RlcklwY0hhbmRsZXJzKCk7XG4gICAgY3JlYXRlV2luZG93KCk7XG5cbiAgICBhcHAub24oJ2FjdGl2YXRlJywgKCkgPT4ge1xuICAgICAgaWYgKEJyb3dzZXJXaW5kb3cuZ2V0QWxsV2luZG93cygpLmxlbmd0aCA9PT0gMCkgY3JlYXRlV2luZG93KCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGFwcC5vbignd2luZG93LWFsbC1jbG9zZWQnLCAoKSA9PiB7XG4gICAgYXBwLnF1aXQoKTtcbiAgfSk7XG59XG4iLCAiLy8gSVBDIGNoYW5uZWwgbmFtZXMgc2hhcmVkIGJ5IG1haW4gKGlwY01haW4uaGFuZGxlKSBhbmQgcHJlbG9hZCAoaXBjUmVuZGVyZXIuaW52b2tlKS5cbi8vIE9uZSBjaGFubmVsIHBlciBRdWFudEFwaSBtZXRob2QgXHUyMDE0IHNlZSBzcmMvc2hhcmVkL3R5cGVzLnRzIGZvciBzaWduYXR1cmVzLlxuXG5leHBvcnQgY29uc3QgSVBDID0ge1xuICB3YXRjaGxpc3RHZXQ6ICd3YXRjaGxpc3Q6Z2V0JyxcbiAgd2F0Y2hsaXN0QWRkOiAnd2F0Y2hsaXN0OmFkZCcsXG4gIHdhdGNobGlzdFJlbW92ZTogJ3dhdGNobGlzdDpyZW1vdmUnLFxuICBzeW1ib2xzU2VhcmNoOiAnc3ltYm9sczpzZWFyY2gnLFxuICBxdW90ZXNHZXQ6ICdxdW90ZXM6Z2V0JyxcbiAgaG9sZGluZ3NHZXQ6ICdob2xkaW5nczpnZXQnLFxuICBuZXdzR2V0OiAnbmV3czpnZXQnLFxuICBlYXJuaW5nc0dldDogJ2Vhcm5pbmdzOmdldCcsXG4gIGNoYXJ0R2V0OiAnY2hhcnQ6Z2V0JyxcbiAgcGl2b3ROZXdzR2V0OiAnY2hhcnQ6cGl2b3QtbmV3cycsXG4gIG1hY3JvT3ZlcmxheUdldDogJ2NoYXJ0Om1hY3JvLW92ZXJsYXknLFxuICBjaGFydFNuYXBzaG90Q2FwdHVyZTogJ2NoYXJ0OmNhcHR1cmUtc25hcHNob3QnLFxuICBxdWFudEFuYWx5emU6ICdxdWFudDphbmFseXplJyxcbiAgcXVhbnRJbnNpZ2h0c0dldDogJ3F1YW50Omluc2lnaHRzLWdldCcsXG4gIGxsbVNldHRpbmdzR2V0OiAnbGxtLXNldHRpbmdzOmdldCcsXG4gIGxsbVNldHRpbmdzU2F2ZTogJ2xsbS1zZXR0aW5nczpzYXZlJyxcbiAgdmFsdWF0aW9uR2V0OiAndmFsdWF0aW9uOmdldCcsXG4gIG9wZW5FeHRlcm5hbDogJ3NoZWxsOm9wZW4tZXh0ZXJuYWwnLFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgSXBjQ2hhbm5lbCA9ICh0eXBlb2YgSVBDKVtrZXlvZiB0eXBlb2YgSVBDXTtcbiIsICIvLyBTaGFyZWQgY29udHJhY3QgYmV0d2VlbiB0aGUgRWxlY3Ryb24gbWFpbiBwcm9jZXNzIGFuZCB0aGUgcmVuZGVyZXIuXG4vLyBUaGlzIGZpbGUgaXMgdGhlIHNpbmdsZSBzb3VyY2Ugb2YgdHJ1dGggZm9yIGRhdGEgc2hhcGVzIGFuZCB0aGVcbi8vIHdpbmRvdy5xdWFudCBicmlkZ2UgQVBJLiBCcmVha2luZyBjaGFuZ2VzIGhlcmUgcmVxdWlyZSBjb29yZGluYXRlZFxuLy8gdXBkYXRlcyB0byBzcmMvbWFpbi9wcmVsb2FkLnRzLCB0aGUgSVBDIGhhbmRsZXJzIGluIHNyYy9tYWluLCBhbmRcbi8vIGV2ZXJ5IHJlbmRlcmVyIGNhbGxlci5cblxuZXhwb3J0IHR5cGUgSW5zdHJ1bWVudFR5cGUgPSAnZXRmJyB8ICdzdG9jayc7XG5cbi8qKiBXaGVyZSBhIHBheWxvYWQgY2FtZSBmcm9tLiAnc2FtcGxlJyBtZWFucyBidW5kbGVkL29mZmxpbmUgZmFsbGJhY2sgZGF0YSBcdTIwMTRcbiAqICB0aGUgVUkgbXVzdCBzdXJmYWNlIHRoaXMgc28gdGhlIHVzZXIgaXMgbmV2ZXIgbWlzbGVkIGJ5IHN0YWxlIG51bWJlcnMuICovXG5leHBvcnQgdHlwZSBEYXRhU291cmNlID0gJ2xpdmUnIHwgJ3NhbXBsZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2F0Y2hsaXN0SXRlbSB7XG4gIHN5bWJvbDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIHR5cGU6IEluc3RydW1lbnRUeXBlO1xuICBhZGRlZEF0OiBzdHJpbmc7IC8vIElTTyB0aW1lc3RhbXBcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTeW1ib2xTdWdnZXN0aW9uIHtcbiAgc3ltYm9sOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgdHlwZTogSW5zdHJ1bWVudFR5cGU7XG4gIGV4Y2hhbmdlPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFF1b3RlIHtcbiAgc3ltYm9sOiBzdHJpbmc7XG4gIHByaWNlOiBudW1iZXIgfCBudWxsO1xuICBjaGFuZ2U6IG51bWJlciB8IG51bGw7ICAgICAgICAgLy8gYWJzb2x1dGUgY2hhbmdlIHZzIHByZXZpb3VzIGNsb3NlXG4gIGNoYW5nZVBlcmNlbnQ6IG51bWJlciB8IG51bGw7ICAvLyAtMS4yMyBtZWFucyAtMS4yMyVcbiAgcHJldmlvdXNDbG9zZTogbnVtYmVyIHwgbnVsbDtcbiAgY3VycmVuY3k6IHN0cmluZztcbiAgbWFya2V0U3RhdGU/OiBzdHJpbmc7XG4gIHVwZGF0ZWRBdDogc3RyaW5nOyAvLyBJU09cbiAgc291cmNlOiBEYXRhU291cmNlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEhvbGRpbmcge1xuICBzeW1ib2w6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICB3ZWlnaHRQZXJjZW50OiBudW1iZXIgfCBudWxsOyAvLyAwLi4xMDBcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIb2xkaW5nc1Jlc3VsdCB7XG4gIGV0ZlN5bWJvbDogc3RyaW5nO1xuICBhc09mOiBzdHJpbmc7ICAgICAgICAvLyBkYXRlIHRoZSBob2xkaW5ncyBzbmFwc2hvdCByZXByZXNlbnRzIChZWVlZLU1NLUREIG9yIFlZWVktTU0pXG4gIGhvbGRpbmdzOiBIb2xkaW5nW107IC8vIHVwIHRvIHRvcCAyMCwgc29ydGVkIGJ5IHdlaWdodCBkZXNjXG4gIHNvdXJjZTogRGF0YVNvdXJjZTsgIC8vICdsaXZlJyBpZiBmZXRjaGVkLCAnc2FtcGxlJyBpZiBmcm9tIHRoZSBidW5kbGVkIGRhdGFzZXRcbn1cblxuZXhwb3J0IGludGVyZmFjZSBOZXdzSXRlbSB7XG4gIGlkOiBzdHJpbmc7ICAgICAgICAgICAgLy8gc3RhYmxlIGlkIGZvciBkZWR1cGUgKyBSZWFjdCBrZXlzXG4gIHRpdGxlOiBzdHJpbmc7XG4gIHVybDogc3RyaW5nO1xuICBzb3VyY2VOYW1lOiBzdHJpbmc7ICAgIC8vIHB1Ymxpc2hlciwgZS5nLiBcIlJldXRlcnNcIlxuICBwdWJsaXNoZWRBdDogc3RyaW5nOyAgIC8vIElTT1xuICByZWxhdGVkU3ltYm9sOiBzdHJpbmc7IC8vIHRpY2tlciB0aGlzIGFydGljbGUgd2FzIGZldGNoZWQgZm9yXG4gIHN1bW1hcnk/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCB0eXBlIEVhcm5pbmdzVGltZSA9ICdibW8nIHwgJ2FtYycgfCAndW5rbm93bic7IC8vIGJlZm9yZSBtYXJrZXQgb3BlbiAvIGFmdGVyIG1hcmtldCBjbG9zZVxuXG5leHBvcnQgaW50ZXJmYWNlIEVhcm5pbmdzRXZlbnQge1xuICBzeW1ib2w6IHN0cmluZztcbiAgY29tcGFueU5hbWU6IHN0cmluZztcbiAgZGF0ZTogc3RyaW5nOyAgICAgICAgICAvLyBJU08gZGF0ZSwgWVlZWS1NTS1ERFxuICB0aW1lOiBFYXJuaW5nc1RpbWU7XG4gIGVwc0VzdGltYXRlOiBudW1iZXIgfCBudWxsO1xuICBlcHNBY3R1YWw/OiBudW1iZXIgfCBudWxsO1xuICBlcHNTdXJwcmlzZVBlcmNlbnQ/OiBudW1iZXIgfCBudWxsO1xuICBsYXRlc3RSZXBvcnRlZERhdGU/OiBzdHJpbmcgfCBudWxsO1xuICBzb3VyY2U6IERhdGFTb3VyY2U7XG59XG5cbmV4cG9ydCB0eXBlIENoYXJ0UmFuZ2UgPSAnMWQnIHwgJzF3JyB8ICcxbScgfCAnNm0nIHwgJzF5JyB8ICc1eScgfCAnbWF4JztcbmV4cG9ydCBjb25zdCBDSEFSVF9SQU5HRVM6IENoYXJ0UmFuZ2VbXSA9IFsnMWQnLCAnMXcnLCAnMW0nLCAnNm0nLCAnMXknLCAnNXknLCAnbWF4J107XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2FuZGxlIHtcbiAgdGltZTogbnVtYmVyOyAvLyB1bml4IHNlY29uZHMsIFVUQ1xuICBvcGVuOiBudW1iZXI7XG4gIGhpZ2g6IG51bWJlcjtcbiAgbG93OiBudW1iZXI7XG4gIGNsb3NlOiBudW1iZXI7XG4gIHZvbHVtZTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENoYXJ0RGF0YSB7XG4gIHN5bWJvbDogc3RyaW5nO1xuICByYW5nZTogQ2hhcnRSYW5nZTtcbiAgaW50ZXJ2YWw6IHN0cmluZzsgLy8gZS5nLiBcIjVtXCIsIFwiMWRcIiwgXCIxd2tcIlxuICBjYW5kbGVzOiBDYW5kbGVbXTsgLy8gYXNjZW5kaW5nIGJ5IHRpbWUsIG5vIG51bGwgY2xvc2VzXG4gIGN1cnJlbmN5OiBzdHJpbmc7XG4gIGV4Y2hhbmdlTmFtZT86IHN0cmluZztcbiAgcmVndWxhck1hcmtldFByaWNlPzogbnVtYmVyIHwgbnVsbDtcbiAgcHJldmlvdXNDbG9zZT86IG51bWJlciB8IG51bGw7XG4gIHNvdXJjZTogRGF0YVNvdXJjZTtcbn1cblxuLyoqIEEgc2lnbmlmaWNhbnQgbG9jYWwgaGlnaCBvciBsb3cgZGV0ZWN0ZWQgaW4gdGhlIGNhbmRsZSBzZXJpZXMuICovXG5leHBvcnQgaW50ZXJmYWNlIFBpdm90UG9pbnQge1xuICB0aW1lOiBudW1iZXI7ICAvLyB1bml4IHNlY29uZHMgXHUyMDE0IHRpbWUgb2YgdGhlIHBpdm90IGNhbmRsZVxuICBwcmljZTogbnVtYmVyOyAvLyB0aGUgY2FuZGxlJ3MgaGlnaCBmb3IgJ2hpZ2gnIHBpdm90cywgbG93IGZvciAnbG93J1xuICBraW5kOiAnaGlnaCcgfCAnbG93Jztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQaXZvdE5ld3NSZXN1bHQge1xuICBwaXZvdDogUGl2b3RQb2ludDtcbiAgaXRlbXM6IE5ld3NJdGVtW107IC8vIG5ld3MgcHVibGlzaGVkIG5lYXIgdGhlIHBpdm90IGRhdGU7IG1heSBiZSBlbXB0eVxufVxuXG5leHBvcnQgdHlwZSBNYWNyb092ZXJsYXlLZXkgPVxuICB8ICdqb2JzJ1xuICB8ICd1bmVtcGxveW1lbnQnXG4gIHwgJ2luZmxhdGlvbidcbiAgfCAndHJlYXN1cnkxMHknXG4gIHwgJ29pbCdcbiAgfCAndml4JztcblxuZXhwb3J0IGludGVyZmFjZSBNYWNyb092ZXJsYXlQb2ludCB7XG4gIHRpbWU6IG51bWJlcjsgLy8gdW5peCBzZWNvbmRzXG4gIHZhbHVlOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWFjcm9PdmVybGF5U2VyaWVzIHtcbiAga2V5OiBNYWNyb092ZXJsYXlLZXk7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIHVuaXQ6IHN0cmluZztcbiAgc291cmNlTmFtZTogc3RyaW5nO1xuICBwb2ludHM6IE1hY3JvT3ZlcmxheVBvaW50W107XG4gIHNvdXJjZTogRGF0YVNvdXJjZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBRdWFudEluc2lnaHRSZXF1ZXN0IHtcbiAgc3ltYm9sOiBzdHJpbmc7XG4gIHJhbmdlOiBDaGFydFJhbmdlO1xuICBldmFsdWF0aW9uOiBpbXBvcnQoJy4vcXVhbnQnKS5TaWduYWxFdmFsdWF0aW9uO1xuICBuZXdzOiBOZXdzSXRlbVtdO1xuICBlYXJuaW5ncz86IEVhcm5pbmdzRXZlbnQgfCBudWxsO1xuICB2YWx1YXRpb24/OiBWYWx1YXRpb25TbmFwc2hvdCB8IG51bGw7XG4gIG1hY3JvT3ZlcmxheXM/OiBNYWNyb092ZXJsYXlTZXJpZXNbXTtcbiAgc25hcHNob3REYXRhVXJsPzogc3RyaW5nO1xuICBxdWVzdGlvbj86IHN0cmluZztcbiAgdGhpbmtpbmdNb2RlPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBRdWFudEluc2lnaHRSZXNwb25zZSB7XG4gIG9rOiBib29sZWFuO1xuICBzb3VyY2U6ICdsb2NhbC1sbG0nIHwgJ2RldGVybWluaXN0aWMtZmFsbGJhY2snO1xuICBtb2RlbD86IHN0cmluZztcbiAgYW5zd2VyOiBzdHJpbmc7XG4gIGdlbmVyYXRlZEF0OiBzdHJpbmc7XG4gIGVycm9yPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFF1YW50SW5zaWdodFJlY29yZCBleHRlbmRzIFF1YW50SW5zaWdodFJlc3BvbnNlIHtcbiAgaWQ6IHN0cmluZztcbiAgc3ltYm9sOiBzdHJpbmc7XG4gIHJhbmdlOiBDaGFydFJhbmdlO1xuICBxdWVzdGlvbj86IHN0cmluZztcbiAgZGVjaXNpb24/OiBpbXBvcnQoJy4vcXVhbnQnKS5UcmFkZURlY2lzaW9uO1xuICBzZXR1cFR5cGU/OiBpbXBvcnQoJy4vcXVhbnQnKS5TZXR1cFR5cGU7XG4gIGNvbmZpZGVuY2U/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGxtU2V0dGluZ3Mge1xuICBlbmFibGVkOiBib29sZWFuO1xuICBiYXNlVXJsOiBzdHJpbmc7XG4gIG1vZGVsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmFsdWF0aW9uU25hcHNob3Qge1xuICBzeW1ib2w6IHN0cmluZztcbiAgY29tcGFueU5hbWU6IHN0cmluZztcbiAgcHJpY2U6IG51bWJlciB8IG51bGw7XG4gIG1hcmtldENhcDogbnVtYmVyIHwgbnVsbDtcbiAgZW50ZXJwcmlzZVZhbHVlOiBudW1iZXIgfCBudWxsO1xuICB0b3RhbFJldmVudWU6IG51bWJlciB8IG51bGw7XG4gIGdyb3NzUHJvZml0OiBudW1iZXIgfCBudWxsO1xuICBlYml0ZGE6IG51bWJlciB8IG51bGw7XG4gIG5ldEluY29tZVRvQ29tbW9uOiBudW1iZXIgfCBudWxsO1xuICBwcm9maXRNYXJnaW46IG51bWJlciB8IG51bGw7XG4gIHJldmVudWVHcm93dGg6IG51bWJlciB8IG51bGw7XG4gIHRyYWlsaW5nUGU6IG51bWJlciB8IG51bGw7XG4gIGZvcndhcmRQZTogbnVtYmVyIHwgbnVsbDtcbiAgcHJpY2VUb1NhbGVzOiBudW1iZXIgfCBudWxsO1xuICBwcmljZVRvQm9vazogbnVtYmVyIHwgbnVsbDtcbiAgZW50ZXJwcmlzZVRvUmV2ZW51ZTogbnVtYmVyIHwgbnVsbDtcbiAgZW50ZXJwcmlzZVRvRWJpdGRhOiBudW1iZXIgfCBudWxsO1xuICBmb3J3YXJkRXBzOiBudW1iZXIgfCBudWxsO1xuICB0YXJnZXRNZWFuUHJpY2U6IG51bWJlciB8IG51bGw7XG4gIHNoYXJlc091dHN0YW5kaW5nOiBudW1iZXIgfCBudWxsO1xuICBlc3RpbWF0ZXM6IEFycmF5PHtcbiAgICBsYWJlbDogc3RyaW5nO1xuICAgIGZhaXJWYWx1ZTogbnVtYmVyIHwgbnVsbDtcbiAgICB1cHNpZGVQZXJjZW50OiBudW1iZXIgfCBudWxsO1xuICAgIGZvcm11bGE6IHN0cmluZztcbiAgfT47XG4gIHNvdXJjZTogRGF0YVNvdXJjZTtcbn1cblxuZXhwb3J0IHR5cGUgQWRkV2F0Y2hsaXN0UmVzdWx0ID1cbiAgfCB7IG9rOiB0cnVlOyBpdGVtOiBXYXRjaGxpc3RJdGVtOyB3YXRjaGxpc3Q6IFdhdGNobGlzdEl0ZW1bXSB9XG4gIHwgeyBvazogZmFsc2U7IGVycm9yOiBzdHJpbmcgfTtcblxuLyoqIFRoZSBBUEkgZXhwb3NlZCBvbiB3aW5kb3cucXVhbnQgYnkgc3JjL21haW4vcHJlbG9hZC50cy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUXVhbnRBcGkge1xuICBnZXRXYXRjaGxpc3QoKTogUHJvbWlzZTxXYXRjaGxpc3RJdGVtW10+O1xuICBhZGRUb1dhdGNobGlzdChzeW1ib2w6IHN0cmluZyk6IFByb21pc2U8QWRkV2F0Y2hsaXN0UmVzdWx0PjtcbiAgcmVtb3ZlRnJvbVdhdGNobGlzdChzeW1ib2w6IHN0cmluZyk6IFByb21pc2U8V2F0Y2hsaXN0SXRlbVtdPjtcbiAgc2VhcmNoU3ltYm9scyhxdWVyeTogc3RyaW5nKTogUHJvbWlzZTxTeW1ib2xTdWdnZXN0aW9uW10+O1xuICBnZXRRdW90ZXMoc3ltYm9sczogc3RyaW5nW10pOiBQcm9taXNlPFF1b3RlW10+O1xuICBnZXRIb2xkaW5ncyhldGZTeW1ib2w6IHN0cmluZyk6IFByb21pc2U8SG9sZGluZ3NSZXN1bHQ+O1xuICBnZXROZXdzKHN5bWJvbHM6IHN0cmluZ1tdLCBsaW1pdFBlclN5bWJvbD86IG51bWJlcik6IFByb21pc2U8TmV3c0l0ZW1bXT47XG4gIGdldEVhcm5pbmdzKHN5bWJvbHM6IHN0cmluZ1tdKTogUHJvbWlzZTxFYXJuaW5nc0V2ZW50W10+O1xuICBnZXRDaGFydChzeW1ib2w6IHN0cmluZywgcmFuZ2U6IENoYXJ0UmFuZ2UpOiBQcm9taXNlPENoYXJ0RGF0YT47XG4gIGdldFBpdm90TmV3cyhzeW1ib2w6IHN0cmluZywgcGl2b3RzOiBQaXZvdFBvaW50W10pOiBQcm9taXNlPFBpdm90TmV3c1Jlc3VsdFtdPjtcbiAgZ2V0TWFjcm9PdmVybGF5KGtleTogTWFjcm9PdmVybGF5S2V5LCByYW5nZTogQ2hhcnRSYW5nZSk6IFByb21pc2U8TWFjcm9PdmVybGF5U2VyaWVzPjtcbiAgY2FwdHVyZUNoYXJ0U25hcHNob3Qoc3ltYm9sOiBzdHJpbmcpOiBQcm9taXNlPHsgZGF0YVVybDogc3RyaW5nOyBjYXB0dXJlZEF0OiBzdHJpbmcgfSB8IG51bGw+O1xuICBhbmFseXplUXVhbnQocmVxdWVzdDogUXVhbnRJbnNpZ2h0UmVxdWVzdCk6IFByb21pc2U8UXVhbnRJbnNpZ2h0UmVzcG9uc2U+O1xuICBnZXRRdWFudEluc2lnaHRzKHN5bWJvbDogc3RyaW5nLCByYW5nZT86IENoYXJ0UmFuZ2UpOiBQcm9taXNlPFF1YW50SW5zaWdodFJlY29yZFtdPjtcbiAgZ2V0TGxtU2V0dGluZ3MoKTogUHJvbWlzZTxMbG1TZXR0aW5ncz47XG4gIHNhdmVMbG1TZXR0aW5ncyhzZXR0aW5nczogTGxtU2V0dGluZ3MpOiBQcm9taXNlPExsbVNldHRpbmdzPjtcbiAgZ2V0VmFsdWF0aW9uKHN5bWJvbDogc3RyaW5nKTogUHJvbWlzZTxWYWx1YXRpb25TbmFwc2hvdD47XG4gIG9wZW5FeHRlcm5hbCh1cmw6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG59XG4iLCAiLy8gTGF6eSByZWFkZXJzIGZvciB0aGUgSlNPTiBkYXRhc2V0cyBidW5kbGVkIG5leHQgdG8gbWFpbi5qcy5cbi8vIFRoZSBidWlsZCBjb3BpZXMgc3JjL21haW4vZGF0YSAtPiBkaXN0L21haW4vZGF0YSwgc28gYXQgcnVudGltZSB0aGUgZmlsZXNcbi8vIGxpdmUgYXQgcGF0aC5qb2luKF9fZGlybmFtZSwgJ2RhdGEnLCAuLi4pLiBDb3JydXB0L21pc3NpbmcgZmlsZXMgZGVncmFkZVxuLy8gdG8gZW1wdHkgZGF0YXNldHMgXHUyMDE0IGNhbGxlcnMgbXVzdCBoYW5kbGUgdGhhdC5cblxuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB0eXBlIHsgSG9sZGluZywgSW5zdHJ1bWVudFR5cGUgfSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEV0ZkJ1bmRsZUVudHJ5IHtcbiAgbmFtZTogc3RyaW5nO1xuICBob2xkaW5nczogSG9sZGluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEV0ZkhvbGRpbmdzQnVuZGxlIHtcbiAgX21ldGE/OiB7IG5vdGU/OiBzdHJpbmc7IGFzT2Y/OiBzdHJpbmcgfTtcbiAgZXRmczogUmVjb3JkPHN0cmluZywgRXRmQnVuZGxlRW50cnk+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERpcmVjdG9yeUVudHJ5IHtcbiAgc3ltYm9sOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgdHlwZTogSW5zdHJ1bWVudFR5cGU7XG4gIGV4Y2hhbmdlPzogc3RyaW5nO1xufVxuXG5mdW5jdGlvbiByZWFkSnNvbihmaWxlTmFtZTogc3RyaW5nKTogdW5rbm93biB7XG4gIHRyeSB7XG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZGF0YScsIGZpbGVOYW1lKTtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoZmlsZVBhdGgsICd1dGY4JykpIGFzIHVua25vd247XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoYFtkYXRhXSBmYWlsZWQgdG8gcmVhZCAke2ZpbGVOYW1lfTpgLCBlcnIpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmxldCBldGZCdW5kbGVDYWNoZTogRXRmSG9sZGluZ3NCdW5kbGUgfCBudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEV0ZkJ1bmRsZSgpOiBFdGZIb2xkaW5nc0J1bmRsZSB7XG4gIGlmIChldGZCdW5kbGVDYWNoZSkgcmV0dXJuIGV0ZkJ1bmRsZUNhY2hlO1xuICBjb25zdCByYXcgPSByZWFkSnNvbignZXRmLWhvbGRpbmdzLmpzb24nKSBhcyBFdGZIb2xkaW5nc0J1bmRsZSB8IG51bGw7XG4gIGNvbnN0IGV0ZnM6IFJlY29yZDxzdHJpbmcsIEV0ZkJ1bmRsZUVudHJ5PiA9IHt9O1xuICBpZiAocmF3ICYmIHR5cGVvZiByYXcgPT09ICdvYmplY3QnICYmIHJhdy5ldGZzICYmIHR5cGVvZiByYXcuZXRmcyA9PT0gJ29iamVjdCcpIHtcbiAgICBmb3IgKGNvbnN0IFtzeW1ib2wsIGVudHJ5XSBvZiBPYmplY3QuZW50cmllcyhyYXcuZXRmcykpIHtcbiAgICAgIGlmICghZW50cnkgfHwgdHlwZW9mIGVudHJ5Lm5hbWUgIT09ICdzdHJpbmcnIHx8ICFBcnJheS5pc0FycmF5KGVudHJ5LmhvbGRpbmdzKSkgY29udGludWU7XG4gICAgICBjb25zdCBob2xkaW5nczogSG9sZGluZ1tdID0gW107XG4gICAgICBmb3IgKGNvbnN0IGggb2YgZW50cnkuaG9sZGluZ3MpIHtcbiAgICAgICAgaWYgKCFoIHx8IHR5cGVvZiBoLnN5bWJvbCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGgubmFtZSAhPT0gJ3N0cmluZycpIGNvbnRpbnVlO1xuICAgICAgICBob2xkaW5ncy5wdXNoKHtcbiAgICAgICAgICBzeW1ib2w6IGguc3ltYm9sLnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgbmFtZTogaC5uYW1lLFxuICAgICAgICAgIHdlaWdodFBlcmNlbnQ6IHR5cGVvZiBoLndlaWdodFBlcmNlbnQgPT09ICdudW1iZXInID8gaC53ZWlnaHRQZXJjZW50IDogbnVsbCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBldGZzW3N5bWJvbC50b1VwcGVyQ2FzZSgpXSA9IHsgbmFtZTogZW50cnkubmFtZSwgaG9sZGluZ3MgfTtcbiAgICB9XG4gIH1cbiAgZXRmQnVuZGxlQ2FjaGUgPSB7XG4gICAgX21ldGE6IHJhdz8uX21ldGEsXG4gICAgZXRmcyxcbiAgfTtcbiAgcmV0dXJuIGV0ZkJ1bmRsZUNhY2hlO1xufVxuXG4vKiogVGhlIGFzT2YgbGFiZWwgZm9yIHRoZSBidW5kbGVkIGhvbGRpbmdzIHNuYXBzaG90LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEJ1bmRsZUFzT2YoKTogc3RyaW5nIHtcbiAgcmV0dXJuIGdldEV0ZkJ1bmRsZSgpLl9tZXRhPy5hc09mID8/ICcyMDI2LTA2Jztcbn1cblxubGV0IGRpcmVjdG9yeUNhY2hlOiBEaXJlY3RvcnlFbnRyeVtdIHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTeW1ib2xEaXJlY3RvcnkoKTogRGlyZWN0b3J5RW50cnlbXSB7XG4gIGlmIChkaXJlY3RvcnlDYWNoZSkgcmV0dXJuIGRpcmVjdG9yeUNhY2hlO1xuICBjb25zdCByYXcgPSByZWFkSnNvbignc3ltYm9sLWRpcmVjdG9yeS5qc29uJykgYXNcbiAgICB8IHsgc3ltYm9scz86IHVua25vd24gfVxuICAgIHwgbnVsbDtcbiAgY29uc3Qgb3V0OiBEaXJlY3RvcnlFbnRyeVtdID0gW107XG4gIGlmIChyYXcgJiYgQXJyYXkuaXNBcnJheShyYXcuc3ltYm9scykpIHtcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIHJhdy5zeW1ib2xzKSB7XG4gICAgICBjb25zdCBlID0gZW50cnkgYXMgUGFydGlhbDxEaXJlY3RvcnlFbnRyeT47XG4gICAgICBpZiAoXG4gICAgICAgIHR5cGVvZiBlLnN5bWJvbCA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgdHlwZW9mIGUubmFtZSA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgKGUudHlwZSA9PT0gJ2V0ZicgfHwgZS50eXBlID09PSAnc3RvY2snKVxuICAgICAgKSB7XG4gICAgICAgIG91dC5wdXNoKHtcbiAgICAgICAgICBzeW1ib2w6IGUuc3ltYm9sLnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgbmFtZTogZS5uYW1lLFxuICAgICAgICAgIHR5cGU6IGUudHlwZSxcbiAgICAgICAgICBleGNoYW5nZTogdHlwZW9mIGUuZXhjaGFuZ2UgPT09ICdzdHJpbmcnID8gZS5leGNoYW5nZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGRpcmVjdG9yeUNhY2hlID0gb3V0O1xuICByZXR1cm4gZGlyZWN0b3J5Q2FjaGU7XG59XG5cbi8qKiBFeGFjdC1zeW1ib2wgbG9va3VwIGluIHRoZSBvZmZsaW5lIGRpcmVjdG9yeS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RvcnlMb29rdXAoc3ltYm9sOiBzdHJpbmcpOiBEaXJlY3RvcnlFbnRyeSB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IHN5bSA9IHN5bWJvbC50b1VwcGVyQ2FzZSgpO1xuICByZXR1cm4gZ2V0U3ltYm9sRGlyZWN0b3J5KCkuZmluZCgoZSkgPT4gZS5zeW1ib2wgPT09IHN5bSk7XG59XG5cbi8qKiBCZXN0LWVmZm9ydCBkaXNwbGF5IG5hbWUgZm9yIGEgc3ltYm9sIGZyb20gYW55IGJ1bmRsZWQgZGF0YXNldC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb29rdXBOYW1lKHN5bWJvbDogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgY29uc3QgZGlyID0gZGlyZWN0b3J5TG9va3VwKHN5bWJvbCk7XG4gIGlmIChkaXIpIHJldHVybiBkaXIubmFtZTtcbiAgY29uc3QgYnVuZGxlID0gZ2V0RXRmQnVuZGxlKCk7XG4gIGNvbnN0IGV0ZiA9IGJ1bmRsZS5ldGZzW3N5bWJvbC50b1VwcGVyQ2FzZSgpXTtcbiAgaWYgKGV0ZikgcmV0dXJuIGV0Zi5uYW1lO1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIE9iamVjdC52YWx1ZXMoYnVuZGxlLmV0ZnMpKSB7XG4gICAgY29uc3QgaGl0ID0gZW50cnkuaG9sZGluZ3MuZmluZCgoaCkgPT4gaC5zeW1ib2wgPT09IHN5bWJvbC50b1VwcGVyQ2FzZSgpKTtcbiAgICBpZiAoaGl0KSByZXR1cm4gaGl0Lm5hbWU7XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cbiIsICIvLyBTbWFsbCBzaGFyZWQgdXRpbGl0aWVzIGZvciB0aGUgbWFpbi1wcm9jZXNzIHNlcnZpY2VzOiBzeW1ib2wgdmFsaWRhdGlvbixcbi8vIHN0YWJsZSBoYXNoaW5nLCBhIHNlZWRlZCBQUk5HIGZvciBkZXRlcm1pbmlzdGljIHNhbXBsZSBkYXRhLCBjb25jdXJyZW5jeVxuLy8gbGltaXRpbmcsIGFuZCBkYXRlIGhlbHBlcnMuXG5cbi8qKiBUaWNrZXIgc3ltYm9scyB3ZSBhY2NlcHQgYW55d2hlcmUgaW4gdGhlIGFwcCAod2F0Y2hsaXN0LCBJUEMgaW5wdXRzKS4gKi9cbmV4cG9ydCBjb25zdCBTWU1CT0xfUkUgPSAvXltBLVowLTkuXi1dezEsMTJ9JC9pO1xuXG4vKiogTm9ybWFsaXplIGFuIHVua25vd24gdmFsdWUgdG8gYW4gdXBwZXJjYXNlIHZhbGlkYXRlZCBzeW1ib2wsIG9yIG51bGwuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU3ltYm9sKHJhdzogdW5rbm93bik6IHN0cmluZyB8IG51bGwge1xuICBpZiAodHlwZW9mIHJhdyAhPT0gJ3N0cmluZycpIHJldHVybiBudWxsO1xuICBjb25zdCBzeW0gPSByYXcudHJpbSgpLnRvVXBwZXJDYXNlKCk7XG4gIHJldHVybiBzeW0ubGVuZ3RoID4gMCAmJiBTWU1CT0xfUkUudGVzdChzeW0pID8gc3ltIDogbnVsbDtcbn1cblxuLyoqIFZhbGlkYXRlIGFuIHVua25vd24gSVBDIHBheWxvYWQgaW50byBhIHVuaXF1ZSwgYm91bmRlZCBzeW1ib2wgbGlzdC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhblN5bWJvbExpc3QocmF3OiB1bmtub3duLCBtYXg6IG51bWJlcik6IHN0cmluZ1tdIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KHJhdykpIHJldHVybiBbXTtcbiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIHJhdykge1xuICAgIGNvbnN0IHN5bSA9IG5vcm1hbGl6ZVN5bWJvbChlbnRyeSk7XG4gICAgaWYgKHN5bSAmJiAhb3V0LmluY2x1ZGVzKHN5bSkpIHtcbiAgICAgIG91dC5wdXNoKHN5bSk7XG4gICAgICBpZiAob3V0Lmxlbmd0aCA+PSBtYXgpIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG4vKiogRk5WLTFhIDMyLWJpdCBoYXNoIHdpdGggYSBjb25maWd1cmFibGUgc2VlZC4gU3RhYmxlIGFjcm9zcyBydW5zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZudjFhKGlucHV0OiBzdHJpbmcsIHNlZWQgPSAweDgxMWM5ZGM1KTogbnVtYmVyIHtcbiAgbGV0IGggPSBzZWVkID4+PiAwO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaCBePSBpbnB1dC5jaGFyQ29kZUF0KGkpO1xuICAgIGggPSBNYXRoLmltdWwoaCwgMHgwMTAwMDE5Myk7XG4gIH1cbiAgcmV0dXJuIGggPj4+IDA7XG59XG5cbi8qKiBTdGFibGUgbm9uLW5lZ2F0aXZlIGludGVnZXIgaGFzaCBvZiBhIHN0cmluZy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGFibGVIYXNoKGlucHV0OiBzdHJpbmcpOiBudW1iZXIge1xuICByZXR1cm4gZm52MWEoaW5wdXQpO1xufVxuXG4vKiogU2hvcnQgc3RhYmxlIGlkIHN0cmluZyBkZXJpdmVkIGZyb20gdHdvIGhhc2ggcGFzc2VzIChmb3IgTmV3c0l0ZW0gaWRzKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNoSWQoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBmbnYxYShpbnB1dCkudG9TdHJpbmcoMzYpICsgZm52MWEoaW5wdXQsIDB4OTc0N2IyOGMpLnRvU3RyaW5nKDM2KTtcbn1cblxuLyoqIG11bGJlcnJ5MzIgUFJORyBcdTIwMTQgZGV0ZXJtaW5pc3RpYyBzZXF1ZW5jZSBpbiBbMCwgMSkgZm9yIGEgZ2l2ZW4gc2VlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtdWxiZXJyeTMyKHNlZWQ6IG51bWJlcik6ICgpID0+IG51bWJlciB7XG4gIGxldCBhID0gc2VlZCA+Pj4gMDtcbiAgcmV0dXJuICgpID0+IHtcbiAgICBhID0gKGEgKyAweDZkMmI3OWY1KSB8IDA7XG4gICAgbGV0IHQgPSBNYXRoLmltdWwoYSBeIChhID4+PiAxNSksIDEgfCBhKTtcbiAgICB0ID0gKHQgKyBNYXRoLmltdWwodCBeICh0ID4+PiA3KSwgNjEgfCB0KSkgXiB0O1xuICAgIHJldHVybiAoKHQgXiAodCA+Pj4gMTQpKSA+Pj4gMCkgLyA0Mjk0OTY3Mjk2O1xuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2xlZXAobXM6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbn1cblxuLyoqIE1pbmltYWwgcHJvbWlzZS1jb25jdXJyZW5jeSBsaW1pdGVyIChwLWxpbWl0IHN0eWxlKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwTGltaXQoY29uY3VycmVuY3k6IG51bWJlcik6IDxUPihmbjogKCkgPT4gUHJvbWlzZTxUPikgPT4gUHJvbWlzZTxUPiB7XG4gIGxldCBhY3RpdmUgPSAwO1xuICBjb25zdCBxdWV1ZTogQXJyYXk8KCkgPT4gdm9pZD4gPSBbXTtcbiAgY29uc3QgbmV4dCA9ICgpOiB2b2lkID0+IHtcbiAgICBhY3RpdmUtLTtcbiAgICBjb25zdCBydW4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgIGlmIChydW4pIHJ1bigpO1xuICB9O1xuICByZXR1cm4gPFQ+KGZuOiAoKSA9PiBQcm9taXNlPFQ+KTogUHJvbWlzZTxUPiA9PlxuICAgIG5ldyBQcm9taXNlPFQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHJ1biA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgYWN0aXZlKys7XG4gICAgICAgIGZuKCkudGhlbihcbiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgIHJlc29sdmUodmFsdWUpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycjogdW5rbm93bikgPT4ge1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICAgIH07XG4gICAgICBpZiAoYWN0aXZlIDwgY29uY3VycmVuY3kpIHJ1bigpO1xuICAgICAgZWxzZSBxdWV1ZS5wdXNoKHJ1bik7XG4gICAgfSk7XG59XG5cbi8qKiBGb3JtYXQgYSBEYXRlIGFzIFVUQyBZWVlZLU1NLURELiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvWW1kKGQ6IERhdGUpOiBzdHJpbmcge1xuICByZXR1cm4gZC50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcbn1cblxuLyoqIFRvZGF5J3MgZGF0ZSBhcyBVVEMgWVlZWS1NTS1ERC4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b2RheVltZCgpOiBzdHJpbmcge1xuICByZXR1cm4gdG9ZbWQobmV3IERhdGUoKSk7XG59XG5cbi8qKiBQYXJzZSBhbnkgZGF0ZS1pc2ggc3RyaW5nIHRvIGVwb2NoIG1zLCBvciBudWxsIHdoZW4gdW5wYXJzZWFibGUuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VEYXRlTXModmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZCk6IG51bWJlciB8IG51bGwge1xuICBpZiAoIXZhbHVlKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgbXMgPSBEYXRlLnBhcnNlKHZhbHVlKTtcbiAgcmV0dXJuIE51bWJlci5pc05hTihtcykgPyBudWxsIDogbXM7XG59XG5cbi8qKiBOb3JtYWxpemVkIGZvcm0gb2YgYSBoZWFkbGluZSB1c2VkIGZvciBjcm9zcy1zb3VyY2UgZGVkdXBlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVRpdGxlKHRpdGxlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGl0bGUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9bXmEtejAtOV0rL2csICcgJykudHJpbSgpO1xufVxuXG4vKiogU3RyaXAgSFRNTCB0YWdzIGFuZCBjb2xsYXBzZSB3aGl0ZXNwYWNlIChmb3IgUlNTIGRlc2NyaXB0aW9ucykuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaXBIdG1sKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXRcbiAgICAucmVwbGFjZSgvPFtePl0qPi9nLCAnICcpXG4gICAgLnJlcGxhY2UoLyZhbXA7L2csICcmJylcbiAgICAucmVwbGFjZSgvJmx0Oy9nLCAnPCcpXG4gICAgLnJlcGxhY2UoLyZndDsvZywgJz4nKVxuICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAucmVwbGFjZSgvJiMwPzM5O3wmYXBvczsvZywgXCInXCIpXG4gICAgLnJlcGxhY2UoLyZuYnNwOy9nLCAnICcpXG4gICAgLnJlcGxhY2UoL1xccysvZywgJyAnKVxuICAgIC50cmltKCk7XG59XG5cbi8qKiBDbGFtcCBhbiB1bmtub3duIG51bWVyaWMgaW5wdXQgdG8gYW4gaW50ZWdlciB3aXRoaW4gW21pbiwgbWF4XS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFtcEludChyYXc6IHVua25vd24sIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciwgZmFsbGJhY2s6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IG4gPSB0eXBlb2YgcmF3ID09PSAnbnVtYmVyJyAmJiBOdW1iZXIuaXNGaW5pdGUocmF3KSA/IE1hdGgucm91bmQocmF3KSA6IGZhbGxiYWNrO1xuICByZXR1cm4gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIG4pKTtcbn1cblxuLyoqIFJvdW5kIHRvIDIgZGVjaW1hbCBwbGFjZXMgKHByaWNlcykuICovXG5leHBvcnQgZnVuY3Rpb24gcm91bmQyKG46IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiBNYXRoLnJvdW5kKG4gKiAxMDApIC8gMTAwO1xufVxuIiwgIi8vIERldGVybWluaXN0aWMgb2ZmbGluZSBmYWxsYmFja3MuIEV2ZXJ5dGhpbmcgaGVyZSBpcyBnZW5lcmF0ZWQgZnJvbSBhXG4vLyBtdWxiZXJyeTMyIFBSTkcgc2VlZGVkIGJ5IGEgc3RhYmxlIGhhc2ggb2Ygc3ltYm9sKCtyYW5nZSkgXHUyMDE0IG5vXG4vLyBNYXRoLnJhbmRvbSwgbm8gZGF0ZS1zZWVkZWQgcmFuZG9tbmVzcyBcdTIwMTQgc28gcmVwZWF0ZWQgY2FsbHMgcHJvZHVjZSB0aGVcbi8vIHNhbWUgZGF0YS4gQWxsIHBheWxvYWRzIGFyZSBmbGFnZ2VkIHNvdXJjZTogJ3NhbXBsZScgd2hlcmUgdGhlIHNoYXBlXG4vLyBhbGxvd3MgaXQ7IHNhbXBsZSBuZXdzIGlzIG1hcmtlZCB2aWEgc291cmNlTmFtZSAnU2FtcGxlIERhdGEnIGFuZCBhXG4vLyAnc2FtcGxlLScgaWQgcHJlZml4IHNpbmNlIE5ld3NJdGVtIGhhcyBubyBzb3VyY2UgZmllbGQuXG5cbmltcG9ydCB0eXBlIHtcbiAgQ2FuZGxlLFxuICBDaGFydERhdGEsXG4gIENoYXJ0UmFuZ2UsXG4gIEVhcm5pbmdzRXZlbnQsXG4gIE5ld3NJdGVtLFxuICBRdW90ZSxcbn0gZnJvbSAnLi4vLi4vc2hhcmVkL3R5cGVzJztcbmltcG9ydCB7IGxvb2t1cE5hbWUgfSBmcm9tICcuL2RhdGFGaWxlcyc7XG5pbXBvcnQgeyBtdWxiZXJyeTMyLCByb3VuZDIsIHN0YWJsZUhhc2gsIHRvWW1kIH0gZnJvbSAnLi91dGlsJztcblxuLy8gUGxhdXNpYmxlIG1pZC0yMDI2IHByaWNlIGxldmVscyBmb3Igd2VsbC1rbm93biB0aWNrZXJzOyBkZWZhdWx0IDEwMC5cbmNvbnN0IEJBU0VfUFJJQ0VTOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge1xuICBTUFk6IDYyMCwgVk9POiA1NzAsIElWVjogNjIzLCBWVEk6IDMwNSwgUVFROiA1NjAsIERJQTogNDQ1LCBJV006IDIyNSxcbiAgWExLOiAyNjUsIFhMRjogNTMsIFhMRTogOTIsIFhMVjogMTM1LCBTTUg6IDI5MCwgU09YWDogMjQ1LCBBUktLOiA3NSxcbiAgU0NIRDogMjcsIEpFUEk6IDU2LCBWR1Q6IDcwMCwgVlVHOiA0NjAsIFZUVjogMTc1LCBSU1A6IDE4NSxcbiAgQUFQTDogMjMwLCBNU0ZUOiA1MDAsIE5WREE6IDE3MCwgQU1aTjogMjIwLCBHT09HTDogMTg1LCBHT09HOiAxODcsXG4gIE1FVEE6IDcyMCwgVFNMQTogMzIwLCBBVkdPOiAyNzAsICdCUkstQic6IDQ5MCwgSlBNOiAyOTAsIFY6IDM1NSxcbiAgTUE6IDU2MCwgVU5IOiAzMTAsIFhPTTogMTE1LCBMTFk6IDc4MCwgSk5KOiAxNTUsIFBHOiAxNjAsIEhEOiAzNjUsXG4gIENPU1Q6IDk4NSwgV01UOiA5OCwgTkZMWDogMTI1MCwgQ1JNOiAyNzAsIE9SQ0w6IDIxMCwgQU1EOiAxNDAsXG4gIEFEQkU6IDM5MCwgUEVQOiAxMzIsIEtPOiA3MCwgQ1NDTzogNjYsIElOVEM6IDIyLCBUU006IDIzMCwgQVNNTDogNzkwLFxuICBRQ09NOiAxNTUsIFRYTjogMTk1LCBNVTogMTIwLCBBTUFUOiAxODUsIExSQ1g6IDk1LCBLTEFDOiA4ODAsXG4gIFBMVFI6IDE0MCwgQ09JTjogMzUwLCBIT09EOiA4MCwgU0hPUDogMTEwLCBESVM6IDEyMCwgQkE6IDIxMCxcbiAgQ0FUOiAzOTAsIEdTOiA3MDAsIE1TOiAxNDAsIEJBQzogNDcsIFdGQzogODAsIElCTTogMjkwLCBHRTogMjUwLFxuICBNQ0Q6IDMwMCwgTktFOiA3MiwgVDogMjgsIFZaOiA0MywgUEZFOiAyNSwgTVJLOiA4MiwgQUJCVjogMTkwLFxuICBUTU86IDQ5MCwgQ1ZYOiAxNTUsIENPUDogOTUsIFVCRVI6IDkwLCBOT1c6IDEwMDAsIElTUkc6IDUzMCwgSU5UVTogNzYwLFxuICBBTUdOOiAyOTAsIEhPTjogMjIwLCBHSUxEOiAxMTAsIEJNWTogNTUsIFNCVVg6IDk1LCBQWVBMOiA3NSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBiYXNlUHJpY2VGb3Ioc3ltYm9sOiBzdHJpbmcpOiBudW1iZXIge1xuICByZXR1cm4gQkFTRV9QUklDRVNbc3ltYm9sLnRvVXBwZXJDYXNlKCldID8/IDEwMDtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBDYW5kbGVzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxudHlwZSBTZXNzaW9uS2luZCA9ICdpbnRyYWRheScgfCAnZGFpbHknIHwgJ3dlZWtseScgfCAnbW9udGhseSc7XG5cbmludGVyZmFjZSBTYW1wbGVSYW5nZVNwZWMge1xuICBpbnRlcnZhbDogc3RyaW5nO1xuICBjb3VudDogbnVtYmVyO1xuICBraW5kOiBTZXNzaW9uS2luZDtcbiAgc3RlcFNlYzogbnVtYmVyOyAvLyBiYXIgc3BhY2luZyBmb3IgaW50cmFkYXkga2luZHNcbiAgdm9sOiBudW1iZXI7ICAgICAvLyBwZXItYmFyIHZvbGF0aWxpdHkgKGZyYWN0aW9uYWwpXG4gIGJhc2VWb2x1bWU6IG51bWJlcjtcbn1cblxuY29uc3QgU0FNUExFX1JBTkdFOiBSZWNvcmQ8Q2hhcnRSYW5nZSwgU2FtcGxlUmFuZ2VTcGVjPiA9IHtcbiAgJzFkJzogeyBpbnRlcnZhbDogJzVtJywgY291bnQ6IDc4LCBraW5kOiAnaW50cmFkYXknLCBzdGVwU2VjOiAzMDAsIHZvbDogMC4wMDEyLCBiYXNlVm9sdW1lOiA5MDBfMDAwIH0sXG4gICcxdyc6IHsgaW50ZXJ2YWw6ICcxNW0nLCBjb3VudDogMTMwLCBraW5kOiAnaW50cmFkYXknLCBzdGVwU2VjOiA5MDAsIHZvbDogMC4wMDIsIGJhc2VWb2x1bWU6IDJfNjAwXzAwMCB9LFxuICAnMW0nOiB7IGludGVydmFsOiAnNjBtJywgY291bnQ6IDE1NCwga2luZDogJ2ludHJhZGF5Jywgc3RlcFNlYzogMzYwMCwgdm9sOiAwLjAwNCwgYmFzZVZvbHVtZTogOV8wMDBfMDAwIH0sXG4gICc2bSc6IHsgaW50ZXJ2YWw6ICcxZCcsIGNvdW50OiAxMjYsIGtpbmQ6ICdkYWlseScsIHN0ZXBTZWM6IDg2XzQwMCwgdm9sOiAwLjAxMiwgYmFzZVZvbHVtZTogNTVfMDAwXzAwMCB9LFxuICAnMXknOiB7IGludGVydmFsOiAnMWQnLCBjb3VudDogMjUyLCBraW5kOiAnZGFpbHknLCBzdGVwU2VjOiA4Nl80MDAsIHZvbDogMC4wMTIsIGJhc2VWb2x1bWU6IDU1XzAwMF8wMDAgfSxcbiAgJzV5JzogeyBpbnRlcnZhbDogJzF3aycsIGNvdW50OiAyNjAsIGtpbmQ6ICd3ZWVrbHknLCBzdGVwU2VjOiA3ICogODZfNDAwLCB2b2w6IDAuMDI4LCBiYXNlVm9sdW1lOiAyNjBfMDAwXzAwMCB9LFxuICBtYXg6IHsgaW50ZXJ2YWw6ICcxbW8nLCBjb3VudDogMjQwLCBraW5kOiAnbW9udGhseScsIHN0ZXBTZWM6IDMwICogODZfNDAwLCB2b2w6IDAuMDUsIGJhc2VWb2x1bWU6IDFfMTAwXzAwMF8wMDAgfSxcbn07XG5cbmNvbnN0IFNFU1NJT05fT1BFTl9TRUMgPSAxMy41ICogMzYwMDsgLy8gMTM6MzAgVVRDIH4gVVMgbWFya2V0IG9wZW5cbmNvbnN0IFNFU1NJT05fQ0xPU0VfU0VDID0gMjAgKiAzNjAwOyAgLy8gMjA6MDAgVVRDIH4gVVMgbWFya2V0IGNsb3NlXG5cbi8qKiBNb3N0IHJlY2VudCB3ZWVrZGF5IChVVEMgbWlkbmlnaHQgZXBvY2ggc2Vjb25kcykgb24vYmVmb3JlIHRoZSBnaXZlbiBkYXkuICovXG5mdW5jdGlvbiBsYXN0V2Vla2RheVV0Yyhmcm9tTXM6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGQgPSBuZXcgRGF0ZShmcm9tTXMpO1xuICBkLnNldFVUQ0hvdXJzKDAsIDAsIDAsIDApO1xuICB3aGlsZSAoZC5nZXRVVENEYXkoKSA9PT0gMCB8fCBkLmdldFVUQ0RheSgpID09PSA2KSB7XG4gICAgZC5zZXRVVENEYXRlKGQuZ2V0VVRDRGF0ZSgpIC0gMSk7XG4gIH1cbiAgcmV0dXJuIE1hdGguZmxvb3IoZC5nZXRUaW1lKCkgLyAxMDAwKTtcbn1cblxuLyoqIEJ1aWxkIGFzY2VuZGluZyBiYXIgdGltZXN0YW1wcyBlbmRpbmcgbmVhciBcIm5vd1wiIGZvciB0aGUgZ2l2ZW4gc3BlYy4gKi9cbmZ1bmN0aW9uIGJ1aWxkVGltZXMoc3BlYzogU2FtcGxlUmFuZ2VTcGVjLCBjb3VudDogbnVtYmVyKTogbnVtYmVyW10ge1xuICBjb25zdCB0aW1lczogbnVtYmVyW10gPSBbXTtcbiAgaWYgKHNwZWMua2luZCA9PT0gJ2ludHJhZGF5Jykge1xuICAgIGxldCBkYXkgPSBsYXN0V2Vla2RheVV0YyhEYXRlLm5vdygpKTtcbiAgICB3aGlsZSAodGltZXMubGVuZ3RoIDwgY291bnQpIHtcbiAgICAgIGNvbnN0IGRheUJhcnM6IG51bWJlcltdID0gW107XG4gICAgICBmb3IgKGxldCB0ID0gU0VTU0lPTl9PUEVOX1NFQzsgdCA8IFNFU1NJT05fQ0xPU0VfU0VDOyB0ICs9IHNwZWMuc3RlcFNlYykge1xuICAgICAgICBkYXlCYXJzLnB1c2goZGF5ICsgdCk7XG4gICAgICB9XG4gICAgICB0aW1lcy51bnNoaWZ0KC4uLmRheUJhcnMpO1xuICAgICAgLy8gc3RlcCBiYWNrIHRvIHRoZSBwcmV2aW91cyB3ZWVrZGF5XG4gICAgICBkYXkgPSBsYXN0V2Vla2RheVV0YygoZGF5IC0gODZfNDAwKSAqIDEwMDApO1xuICAgIH1cbiAgICByZXR1cm4gdGltZXMuc2xpY2UodGltZXMubGVuZ3RoIC0gY291bnQpO1xuICB9XG4gIGlmIChzcGVjLmtpbmQgPT09ICdkYWlseScpIHtcbiAgICBsZXQgZGF5ID0gbGFzdFdlZWtkYXlVdGMoRGF0ZS5ub3coKSk7XG4gICAgd2hpbGUgKHRpbWVzLmxlbmd0aCA8IGNvdW50KSB7XG4gICAgICB0aW1lcy51bnNoaWZ0KGRheSArIFNFU1NJT05fT1BFTl9TRUMpO1xuICAgICAgZGF5ID0gbGFzdFdlZWtkYXlVdGMoKGRheSAtIDg2XzQwMCkgKiAxMDAwKTtcbiAgICB9XG4gICAgcmV0dXJuIHRpbWVzO1xuICB9XG4gIGlmIChzcGVjLmtpbmQgPT09ICd3ZWVrbHknKSB7XG4gICAgY29uc3QgYW5jaG9yID0gbGFzdFdlZWtkYXlVdGMoRGF0ZS5ub3coKSk7XG4gICAgZm9yIChsZXQgaSA9IGNvdW50IC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHRpbWVzLnB1c2goYW5jaG9yIC0gaSAqIDcgKiA4Nl80MDAgKyBTRVNTSU9OX09QRU5fU0VDKTtcbiAgICB9XG4gICAgcmV0dXJuIHRpbWVzO1xuICB9XG4gIC8vIG1vbnRobHk6IGZpcnN0LW9mLW1vbnRoIHN0ZXBzXG4gIGNvbnN0IGQgPSBuZXcgRGF0ZSgpO1xuICBkLnNldFVUQ0hvdXJzKDAsIDAsIDAsIDApO1xuICBkLnNldFVUQ0RhdGUoMSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgIHRpbWVzLnVuc2hpZnQoTWF0aC5mbG9vcihkLmdldFRpbWUoKSAvIDEwMDApICsgU0VTU0lPTl9PUEVOX1NFQyk7XG4gICAgZC5zZXRVVENNb250aChkLmdldFVUQ01vbnRoKCkgLSAxKTtcbiAgfVxuICByZXR1cm4gdGltZXM7XG59XG5cbi8qKiBEZXRlcm1pbmlzdGljIHJhbmRvbS13YWxrIGNhbmRsZXMgZm9yIGEgc3ltYm9sK3JhbmdlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbXBsZUNoYXJ0KHN5bWJvbDogc3RyaW5nLCByYW5nZTogQ2hhcnRSYW5nZSk6IENoYXJ0RGF0YSB7XG4gIGNvbnN0IHN5bSA9IHN5bWJvbC50b1VwcGVyQ2FzZSgpO1xuICBjb25zdCBzcGVjID0gU0FNUExFX1JBTkdFW3JhbmdlXTtcbiAgY29uc3Qgcm5nID0gbXVsYmVycnkzMihzdGFibGVIYXNoKGAke3N5bX18JHtyYW5nZX1gKSk7XG4gIGNvbnN0IGJhc2UgPSBiYXNlUHJpY2VGb3Ioc3ltKTtcbiAgY29uc3QgdGltZXMgPSBidWlsZFRpbWVzKHNwZWMsIHNwZWMuY291bnQpO1xuICBjb25zdCBuID0gdGltZXMubGVuZ3RoO1xuXG4gIC8vIFJhbmRvbSB3YWxrIGFuY2hvcmVkIHNvIHRoZSBmaW5hbCBjbG9zZSBsYW5kcyBvbiB0aGUgYmFzZSBwcmljZS5cbiAgY29uc3QgY2xvc2VzID0gbmV3IEFycmF5PG51bWJlcj4obik7XG4gIGNsb3Nlc1tuIC0gMV0gPSBiYXNlO1xuICBmb3IgKGxldCBpID0gbiAtIDI7IGkgPj0gMDsgaS0tKSB7XG4gICAgY29uc3QgZHJpZnQgPSAocm5nKCkgLSAwLjQ5NSkgKiAyICogc3BlYy52b2w7XG4gICAgY2xvc2VzW2ldID0gY2xvc2VzW2kgKyAxXSAvICgxICsgZHJpZnQpO1xuICB9XG5cbiAgY29uc3QgY2FuZGxlczogQ2FuZGxlW10gPSBbXTtcbiAgbGV0IHByZXZDbG9zZSA9IGNsb3Nlc1swXSAqICgxICsgKHJuZygpIC0gMC41KSAqIHNwZWMudm9sKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICBjb25zdCBvcGVuID0gcHJldkNsb3NlO1xuICAgIGNvbnN0IGNsb3NlID0gY2xvc2VzW2ldO1xuICAgIGNvbnN0IHdpY2sgPSBNYXRoLm1heChNYXRoLmFicyhjbG9zZSAtIG9wZW4pLCBjbG9zZSAqIHNwZWMudm9sICogMC41KTtcbiAgICBjb25zdCBoaWdoID0gTWF0aC5tYXgob3BlbiwgY2xvc2UpICsgcm5nKCkgKiB3aWNrICogMC42O1xuICAgIGNvbnN0IGxvdyA9IE1hdGgubWluKG9wZW4sIGNsb3NlKSAtIHJuZygpICogd2ljayAqIDAuNjtcbiAgICBjYW5kbGVzLnB1c2goe1xuICAgICAgdGltZTogdGltZXNbaV0sXG4gICAgICBvcGVuOiByb3VuZDIob3BlbiksXG4gICAgICBoaWdoOiByb3VuZDIoaGlnaCksXG4gICAgICBsb3c6IHJvdW5kMihNYXRoLm1heChsb3csIDAuMDEpKSxcbiAgICAgIGNsb3NlOiByb3VuZDIoY2xvc2UpLFxuICAgICAgdm9sdW1lOiBNYXRoLnJvdW5kKHNwZWMuYmFzZVZvbHVtZSAqICgwLjQgKyBybmcoKSAqIDEuMikpLFxuICAgIH0pO1xuICAgIHByZXZDbG9zZSA9IGNsb3NlO1xuICB9XG5cbiAgY29uc3QgcHJldmlvdXNDbG9zZSA9XG4gICAgcmFuZ2UgPT09ICcxZCcgPyByb3VuZDIoY2FuZGxlc1swXS5vcGVuKSA6IHJvdW5kMihjYW5kbGVzW01hdGgubWF4KDAsIG4gLSAyKV0uY2xvc2UpO1xuXG4gIHJldHVybiB7XG4gICAgc3ltYm9sOiBzeW0sXG4gICAgcmFuZ2UsXG4gICAgaW50ZXJ2YWw6IHNwZWMuaW50ZXJ2YWwsXG4gICAgY2FuZGxlcyxcbiAgICBjdXJyZW5jeTogJ1VTRCcsXG4gICAgZXhjaGFuZ2VOYW1lOiB1bmRlZmluZWQsXG4gICAgcmVndWxhck1hcmtldFByaWNlOiByb3VuZDIoY2FuZGxlc1tuIC0gMV0uY2xvc2UpLFxuICAgIHByZXZpb3VzQ2xvc2UsXG4gICAgc291cmNlOiAnc2FtcGxlJyxcbiAgfTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBRdW90ZXNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5leHBvcnQgZnVuY3Rpb24gc2FtcGxlUXVvdGUoc3ltYm9sOiBzdHJpbmcpOiBRdW90ZSB7XG4gIGNvbnN0IHN5bSA9IHN5bWJvbC50b1VwcGVyQ2FzZSgpO1xuICBjb25zdCBjaGFydCA9IHNhbXBsZUNoYXJ0KHN5bSwgJzFkJyk7XG4gIGNvbnN0IGxhc3QgPSBjaGFydC5jYW5kbGVzW2NoYXJ0LmNhbmRsZXMubGVuZ3RoIC0gMV07XG4gIGNvbnN0IHByaWNlID0gbGFzdC5jbG9zZTtcbiAgY29uc3QgcHJldmlvdXNDbG9zZSA9IGNoYXJ0LnByZXZpb3VzQ2xvc2UgPz8gbnVsbDtcbiAgY29uc3QgY2hhbmdlID1cbiAgICBwcmV2aW91c0Nsb3NlICE9PSBudWxsID8gcm91bmQyKHByaWNlIC0gcHJldmlvdXNDbG9zZSkgOiBudWxsO1xuICBjb25zdCBjaGFuZ2VQZXJjZW50ID1cbiAgICBwcmV2aW91c0Nsb3NlICE9PSBudWxsICYmIHByZXZpb3VzQ2xvc2UgIT09IDAgJiYgY2hhbmdlICE9PSBudWxsXG4gICAgICA/IHJvdW5kMigoY2hhbmdlIC8gcHJldmlvdXNDbG9zZSkgKiAxMDApXG4gICAgICA6IG51bGw7XG4gIHJldHVybiB7XG4gICAgc3ltYm9sOiBzeW0sXG4gICAgcHJpY2UsXG4gICAgY2hhbmdlLFxuICAgIGNoYW5nZVBlcmNlbnQsXG4gICAgcHJldmlvdXNDbG9zZSxcbiAgICBjdXJyZW5jeTogJ1VTRCcsXG4gICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgc291cmNlOiAnc2FtcGxlJyxcbiAgfTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBOZXdzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY29uc3QgTkVXU19URU1QTEFURVM6IEFycmF5PChuYW1lOiBzdHJpbmcsIHN5bTogc3RyaW5nKSA9PiBzdHJpbmc+ID0gW1xuICAobmFtZSkgPT4gYCR7bmFtZX0gaW4gZm9jdXMgYXMgaW52ZXN0b3JzIHdlaWdoIHRoZSBzZWN0b3Igb3V0bG9va2AsXG4gIChuYW1lLCBzeW0pID0+IGBBbmFseXN0cyByZXZpc2l0ICR7bmFtZX0gKCR7c3ltfSkgcHJpY2UgdGFyZ2V0cyBhZnRlciByZWNlbnQgbW92ZXNgLFxuICAobmFtZSwgc3ltKSA9PiBgV2hhdCB0aGUgbGF0ZXN0IG1hcmtldCBzd2luZ3MgbWVhbiBmb3IgJHtzeW19IGhvbGRlcnNgLFxuICAobmFtZSkgPT4gYCR7bmFtZX06IHRocmVlIHRoaW5ncyB0byB3YXRjaCB0aGlzIHF1YXJ0ZXJgLFxuXTtcblxuLyoqIERldGVybWluaXN0aWMgcGxhY2Vob2xkZXIgbmV3cyBmb3IgdGhlIGdpdmVuIHN5bWJvbHMgKG9mZmxpbmUgbW9kZSkuICovXG5leHBvcnQgZnVuY3Rpb24gc2FtcGxlTmV3cyhzeW1ib2xzOiBzdHJpbmdbXSwgcGVyU3ltYm9sID0gMyk6IE5ld3NJdGVtW10ge1xuICBjb25zdCBpdGVtczogTmV3c0l0ZW1bXSA9IFtdO1xuICBjb25zdCBub3dIb3VyID0gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gM182MDBfMDAwKSAqIDNfNjAwXzAwMDtcbiAgZm9yIChjb25zdCBzeW1ib2wgb2Ygc3ltYm9scy5zbGljZSgwLCAxMikpIHtcbiAgICBjb25zdCBzeW0gPSBzeW1ib2wudG9VcHBlckNhc2UoKTtcbiAgICBjb25zdCBybmcgPSBtdWxiZXJyeTMyKHN0YWJsZUhhc2goYG5ld3N8JHtzeW19YCkpO1xuICAgIGNvbnN0IG5hbWUgPSBsb29rdXBOYW1lKHN5bSkgPz8gc3ltO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTWF0aC5taW4ocGVyU3ltYm9sLCBORVdTX1RFTVBMQVRFUy5sZW5ndGgpOyBpKyspIHtcbiAgICAgIGNvbnN0IGFnZUhvdXJzID0gMiArIE1hdGguZmxvb3Iocm5nKCkgKiAyMCkgKyBpICogMjQ7XG4gICAgICBpdGVtcy5wdXNoKHtcbiAgICAgICAgaWQ6IGBzYW1wbGUtJHtzeW0udG9Mb3dlckNhc2UoKX0tJHtpfWAsXG4gICAgICAgIHRpdGxlOiBORVdTX1RFTVBMQVRFU1tpXShuYW1lLCBzeW0pLFxuICAgICAgICB1cmw6IGBodHRwczovL2ZpbmFuY2UueWFob28uY29tL3F1b3RlLyR7ZW5jb2RlVVJJQ29tcG9uZW50KHN5bSl9YCxcbiAgICAgICAgc291cmNlTmFtZTogJ1NhbXBsZSBEYXRhJyxcbiAgICAgICAgcHVibGlzaGVkQXQ6IG5ldyBEYXRlKG5vd0hvdXIgLSBhZ2VIb3VycyAqIDNfNjAwXzAwMCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgcmVsYXRlZFN5bWJvbDogc3ltLFxuICAgICAgICBzdW1tYXJ5OlxuICAgICAgICAgICdPZmZsaW5lIHNhbXBsZSBoZWFkbGluZSBcdTIwMTQgbGl2ZSBuZXdzIHdhcyB1bmF2YWlsYWJsZSB3aGVuIHRoaXMgd2FzIGdlbmVyYXRlZC4nLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIGl0ZW1zLnNvcnQoKGEsIGIpID0+IGIucHVibGlzaGVkQXQubG9jYWxlQ29tcGFyZShhLnB1Ymxpc2hlZEF0KSk7XG4gIHJldHVybiBpdGVtcztcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBFYXJuaW5nc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBmdW5jdGlvbiBzYW1wbGVFYXJuaW5ncyhzeW1ib2w6IHN0cmluZyk6IEVhcm5pbmdzRXZlbnQge1xuICBjb25zdCBzeW0gPSBzeW1ib2wudG9VcHBlckNhc2UoKTtcbiAgY29uc3QgaGFzaCA9IHN0YWJsZUhhc2goc3ltKTtcbiAgY29uc3QgZGF5c091dCA9IChoYXNoICUgMjgpICsgMjtcbiAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gIGRhdGUuc2V0VVRDSG91cnMoMCwgMCwgMCwgMCk7XG4gIGRhdGUuc2V0VVRDRGF0ZShkYXRlLmdldFVUQ0RhdGUoKSArIGRheXNPdXQpO1xuICByZXR1cm4ge1xuICAgIHN5bWJvbDogc3ltLFxuICAgIGNvbXBhbnlOYW1lOiBsb29rdXBOYW1lKHN5bSkgPz8gc3ltLFxuICAgIGRhdGU6IHRvWW1kKGRhdGUpLFxuICAgIHRpbWU6IGhhc2ggJSAyID09PSAwID8gJ2JtbycgOiAnYW1jJyxcbiAgICBlcHNFc3RpbWF0ZTogTWF0aC5yb3VuZCgoKChoYXNoICUgNDUwKSAvIDEwMCkgKyAwLjQpICogMTAwKSAvIDEwMCxcbiAgICBlcHNBY3R1YWw6IE1hdGgucm91bmQoKCgoaGFzaCAlIDQ3MCkgLyAxMDApICsgMC4zNSkgKiAxMDApIC8gMTAwLFxuICAgIGVwc1N1cnByaXNlUGVyY2VudDogTWF0aC5yb3VuZCgoKChoYXNoICUgMjEpIC0gOCkgLyAxMDApICogMTAwMCkgLyAxMCxcbiAgICBsYXRlc3RSZXBvcnRlZERhdGU6IHRvWW1kKG5ldyBEYXRlKERhdGUubm93KCkgLSA5MCAqIDg2XzQwMF8wMDApKSxcbiAgICBzb3VyY2U6ICdzYW1wbGUnLFxuICB9O1xufVxuIiwgIi8vIFRpbnkgaW4tbWVtb3J5IFRUTCBjYWNoZS4gVXNlZCBieSBodHRwLnRzIChrZXllZCBieSBVUkwpIGFuZCBieSBzZXJ2aWNlc1xuLy8gdGhhdCBjYWNoZSBkZXJpdmVkIHJlc3VsdHMgKGhvbGRpbmdzLCBlYXJuaW5ncykga2V5ZWQgYnkgc3ltYm9sLlxuLy8gRmFpbHVyZXMgYXJlIG5ldmVyIHN0b3JlZCBoZXJlIFx1MjAxNCBjYWxsZXJzIG9ubHkgc2V0KCkgb24gc3VjY2Vzcy5cblxuaW50ZXJmYWNlIEVudHJ5PFY+IHtcbiAgZXhwaXJlczogbnVtYmVyOyAvLyBlcG9jaCBtc1xuICB2YWx1ZTogVjtcbn1cblxuZXhwb3J0IGNsYXNzIFR0bENhY2hlPFY+IHtcbiAgcHJpdmF0ZSByZWFkb25seSBtYXAgPSBuZXcgTWFwPHN0cmluZywgRW50cnk8Vj4+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBtYXhFbnRyaWVzID0gODAwKSB7fVxuXG4gIGdldChrZXk6IHN0cmluZyk6IFYgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5tYXAuZ2V0KGtleSk7XG4gICAgaWYgKCFlbnRyeSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBpZiAoZW50cnkuZXhwaXJlcyA8PSBEYXRlLm5vdygpKSB7XG4gICAgICB0aGlzLm1hcC5kZWxldGUoa2V5KTtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBlbnRyeS52YWx1ZTtcbiAgfVxuXG4gIHNldChrZXk6IHN0cmluZywgdmFsdWU6IFYsIHR0bE1zOiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAodHRsTXMgPD0gMCkgcmV0dXJuO1xuICAgIGlmICh0aGlzLm1hcC5zaXplID49IHRoaXMubWF4RW50cmllcykgdGhpcy5wcnVuZSgpO1xuICAgIHRoaXMubWFwLnNldChrZXksIHsgZXhwaXJlczogRGF0ZS5ub3coKSArIHR0bE1zLCB2YWx1ZSB9KTtcbiAgfVxuXG4gIGRlbGV0ZShrZXk6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMubWFwLmRlbGV0ZShrZXkpO1xuICB9XG5cbiAgcHJpdmF0ZSBwcnVuZSgpOiB2b2lkIHtcbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgIGZvciAoY29uc3QgW2tleSwgZW50cnldIG9mIHRoaXMubWFwKSB7XG4gICAgICBpZiAoZW50cnkuZXhwaXJlcyA8PSBub3cpIHRoaXMubWFwLmRlbGV0ZShrZXkpO1xuICAgIH1cbiAgICAvLyBTdGlsbCBvdmVyIGJ1ZGdldCAobm90aGluZyBleHBpcmVkKT8gRHJvcCBvbGRlc3QtaW5zZXJ0ZWQgZW50cmllcy5cbiAgICB3aGlsZSAodGhpcy5tYXAuc2l6ZSA+PSB0aGlzLm1heEVudHJpZXMpIHtcbiAgICAgIGNvbnN0IG9sZGVzdCA9IHRoaXMubWFwLmtleXMoKS5uZXh0KCk7XG4gICAgICBpZiAob2xkZXN0LmRvbmUpIGJyZWFrO1xuICAgICAgdGhpcy5tYXAuZGVsZXRlKG9sZGVzdC52YWx1ZSk7XG4gICAgfVxuICB9XG59XG4iLCAiLy8gSFRUUCBsYXllciB1c2VkIGJ5IGV2ZXJ5IGRhdGEgc2VydmljZS5cbi8vICAtIEJyb3dzZXIgVXNlci1BZ2VudCBvbiBhbGwgcmVxdWVzdHMgKFlhaG9vIDQyOXMgd2l0aG91dCBpdCkuXG4vLyAgLSAxMnMgdGltZW91dCB2aWEgQWJvcnRTaWduYWwudGltZW91dC5cbi8vICAtIFVwIHRvIDIgcmV0cmllcyB3aXRoIGJhY2tvZmY7IDR4eCAoZXhjZXB0IDQyOSkgaXMgbm90IHJldHJpZWQuXG4vLyAgLSBQZXItaG9zdCBjb25jdXJyZW5jeSBsaW1pdGVyOiBtYXggNCBpbiBmbGlnaHQgcGVyIGhvc3QsIGFuZCB+MjUwbXNcbi8vICAgIHNwYWNpbmcgYmV0d2VlbiByZXF1ZXN0IHN0YXJ0cyBmb3IgcXVlcnkxLmZpbmFuY2UueWFob28uY29tLlxuLy8gIC0gSW4tbWVtb3J5IFRUTCBjYWNoZSBrZXllZCBieSBVUkwgKGNhbGxlciBkZWNpZGVzIHRoZSBUVEwpLlxuLy8gICAgRmFpbHVyZXMgYXJlIE5FVkVSIGNhY2hlZC4gSWRlbnRpY2FsIGluLWZsaWdodCBHRVRzIGFyZSBjb2FsZXNjZWQuXG5cbmltcG9ydCB7IFR0bENhY2hlIH0gZnJvbSAnLi9jYWNoZSc7XG5pbXBvcnQgeyBzbGVlcCB9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBjb25zdCBCUk9XU0VSX1VBID1cbiAgJ01vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjYuMC4wLjAgU2FmYXJpLzUzNy4zNic7XG5cbmV4cG9ydCBjbGFzcyBIdHRwRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICBwdWJsaWMgcmVhZG9ubHkgc3RhdHVzPzogbnVtYmVyLFxuICApIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnSHR0cEVycm9yJztcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEZldGNoT3B0aW9ucyB7XG4gIC8qKiBDYWNoZSBUVEwgaW4gbXM7IDAgKGRlZmF1bHQpIGRpc2FibGVzIGNhY2hpbmcgZm9yIHRoaXMgY2FsbC4gKi9cbiAgdHRsTXM/OiBudW1iZXI7XG4gIC8qKiBQZXItYXR0ZW1wdCB0aW1lb3V0IGluIG1zLiAqL1xuICB0aW1lb3V0TXM/OiBudW1iZXI7XG4gIC8qKiBFeHRyYSBoZWFkZXJzIG1lcmdlZCBvdmVyIHRoZSBkZWZhdWx0IFVzZXItQWdlbnQuICovXG4gIGhlYWRlcnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5jb25zdCBERUZBVUxUX1RJTUVPVVRfTVMgPSAxMl8wMDA7XG5jb25zdCBNQVhfQVRURU1QVFMgPSAzOyAvLyAxIGluaXRpYWwgKyAyIHJldHJpZXNcbmNvbnN0IFJFVFJZX0RFTEFZU19NUyA9IFs1MDAsIDE0MDBdO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFBlci1ob3N0IGxpbWl0ZXJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jbGFzcyBIb3N0TGltaXRlciB7XG4gIHByaXZhdGUgYWN0aXZlID0gMDtcbiAgcHJpdmF0ZSBuZXh0U2xvdCA9IDA7XG4gIHByaXZhdGUgcmVhZG9ubHkgd2FpdGluZzogQXJyYXk8KCkgPT4gdm9pZD4gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IG1heENvbmN1cnJlbnQ6IG51bWJlcixcbiAgICBwcml2YXRlIHJlYWRvbmx5IHNwYWNpbmdNczogbnVtYmVyLFxuICApIHt9XG5cbiAgYXN5bmMgcnVuPFQ+KGZuOiAoKSA9PiBQcm9taXNlPFQ+KTogUHJvbWlzZTxUPiB7XG4gICAgYXdhaXQgdGhpcy5hY3F1aXJlKCk7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBmbigpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLnJlbGVhc2UoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFjcXVpcmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBjb25zdCBhdHRlbXB0ID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBpZiAodGhpcy5hY3RpdmUgPj0gdGhpcy5tYXhDb25jdXJyZW50KSB7XG4gICAgICAgICAgdGhpcy53YWl0aW5nLnB1c2goYXR0ZW1wdCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIGNvbnN0IHdhaXQgPSB0aGlzLm5leHRTbG90IC0gbm93O1xuICAgICAgICBpZiAod2FpdCA+IDApIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGF0dGVtcHQsIHdhaXQpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFjdGl2ZSsrO1xuICAgICAgICB0aGlzLm5leHRTbG90ID0gbm93ICsgdGhpcy5zcGFjaW5nTXM7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH07XG4gICAgICBhdHRlbXB0KCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlbGVhc2UoKTogdm9pZCB7XG4gICAgdGhpcy5hY3RpdmUtLTtcbiAgICBjb25zdCBuZXh0ID0gdGhpcy53YWl0aW5nLnNoaWZ0KCk7XG4gICAgaWYgKG5leHQpIG5leHQoKTtcbiAgfVxufVxuXG5jb25zdCBsaW1pdGVycyA9IG5ldyBNYXA8c3RyaW5nLCBIb3N0TGltaXRlcj4oKTtcblxuZnVuY3Rpb24gbGltaXRlckZvcihob3N0OiBzdHJpbmcpOiBIb3N0TGltaXRlciB7XG4gIGxldCBsaW1pdGVyID0gbGltaXRlcnMuZ2V0KGhvc3QpO1xuICBpZiAoIWxpbWl0ZXIpIHtcbiAgICBjb25zdCBzcGFjaW5nID0gaG9zdCA9PT0gJ3F1ZXJ5MS5maW5hbmNlLnlhaG9vLmNvbScgPyAyNTAgOiAwO1xuICAgIGxpbWl0ZXIgPSBuZXcgSG9zdExpbWl0ZXIoNCwgc3BhY2luZyk7XG4gICAgbGltaXRlcnMuc2V0KGhvc3QsIGxpbWl0ZXIpO1xuICB9XG4gIHJldHVybiBsaW1pdGVyO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIENhY2hlICsgaW4tZmxpZ2h0IGNvYWxlc2NpbmcgKHN1Y2Nlc3NmdWwgdGV4dCBib2RpZXMgb25seSlcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jb25zdCBib2R5Q2FjaGUgPSBuZXcgVHRsQ2FjaGU8c3RyaW5nPig2MDApO1xuY29uc3QgaW5GbGlnaHQgPSBuZXcgTWFwPHN0cmluZywgUHJvbWlzZTxzdHJpbmc+PigpO1xuXG5hc3luYyBmdW5jdGlvbiBkb0ZldGNoKFxuICB1cmw6IHN0cmluZyxcbiAgaG9zdDogc3RyaW5nLFxuICBoZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgdW5kZWZpbmVkLFxuICB0aW1lb3V0TXM6IG51bWJlcixcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgIGhlYWRlcnM6IHsgJ1VzZXItQWdlbnQnOiBCUk9XU0VSX1VBLCAuLi5oZWFkZXJzIH0sXG4gICAgcmVkaXJlY3Q6ICdmb2xsb3cnLFxuICAgIHNpZ25hbDogQWJvcnRTaWduYWwudGltZW91dCh0aW1lb3V0TXMpLFxuICB9KTtcbiAgaWYgKCFyZXMub2spIHtcbiAgICB0aHJvdyBuZXcgSHR0cEVycm9yKGBIVFRQICR7cmVzLnN0YXR1c30gZnJvbSAke2hvc3R9YCwgcmVzLnN0YXR1cyk7XG4gIH1cbiAgcmV0dXJuIHJlcy50ZXh0KCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoV2l0aFJldHJ5KFxuICB1cmw6IHN0cmluZyxcbiAgaGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IHVuZGVmaW5lZCxcbiAgdGltZW91dE1zOiBudW1iZXIsXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBob3N0ID0gbmV3IFVSTCh1cmwpLmhvc3RuYW1lO1xuICBsZXQgbGFzdEVycjogdW5rbm93bjtcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCBNQVhfQVRURU1QVFM7IGF0dGVtcHQrKykge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgbGltaXRlckZvcihob3N0KS5ydW4oKCkgPT4gZG9GZXRjaCh1cmwsIGhvc3QsIGhlYWRlcnMsIHRpbWVvdXRNcykpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbGFzdEVyciA9IGVycjtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IGVyciBpbnN0YW5jZW9mIEh0dHBFcnJvciA/IGVyci5zdGF0dXMgOiB1bmRlZmluZWQ7XG4gICAgICBjb25zdCByZXRyeWFibGUgPVxuICAgICAgICBzdGF0dXMgPT09IHVuZGVmaW5lZCB8fCBzdGF0dXMgPT09IDQyOSB8fCBzdGF0dXMgPj0gNTAwO1xuICAgICAgaWYgKCFyZXRyeWFibGUgfHwgYXR0ZW1wdCA9PT0gTUFYX0FUVEVNUFRTIC0gMSkgdGhyb3cgZXJyO1xuICAgICAgYXdhaXQgc2xlZXAoUkVUUllfREVMQVlTX01TW2F0dGVtcHRdID8/IDE1MDApO1xuICAgIH1cbiAgfVxuICAvLyBVbnJlYWNoYWJsZSwgYnV0IGtlZXBzIFRTIGhhcHB5LlxuICB0aHJvdyBsYXN0RXJyIGluc3RhbmNlb2YgRXJyb3IgPyBsYXN0RXJyIDogbmV3IEVycm9yKGBmZXRjaCBmYWlsZWQ6ICR7dXJsfWApO1xufVxuXG4vKiogRmV0Y2ggYSBVUkwgYXMgdGV4dCwgaG9ub3JpbmcgdGhlIFRUTCBjYWNoZSBhbmQgcGVyLWhvc3QgbGltaXRzLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoVGV4dCh1cmw6IHN0cmluZywgb3B0czogRmV0Y2hPcHRpb25zID0ge30pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB0dGxNcyA9IG9wdHMudHRsTXMgPz8gMDtcbiAgY29uc3QgdGltZW91dE1zID0gb3B0cy50aW1lb3V0TXMgPz8gREVGQVVMVF9USU1FT1VUX01TO1xuXG4gIGlmICh0dGxNcyA+IDApIHtcbiAgICBjb25zdCBjYWNoZWQgPSBib2R5Q2FjaGUuZ2V0KHVybCk7XG4gICAgaWYgKGNhY2hlZCAhPT0gdW5kZWZpbmVkKSByZXR1cm4gY2FjaGVkO1xuICAgIGNvbnN0IHBlbmRpbmcgPSBpbkZsaWdodC5nZXQodXJsKTtcbiAgICBpZiAocGVuZGluZykgcmV0dXJuIHBlbmRpbmc7XG4gIH1cblxuICBjb25zdCBwcm9taXNlID0gZmV0Y2hXaXRoUmV0cnkodXJsLCBvcHRzLmhlYWRlcnMsIHRpbWVvdXRNcylcbiAgICAudGhlbigoYm9keSkgPT4ge1xuICAgICAgaWYgKHR0bE1zID4gMCkgYm9keUNhY2hlLnNldCh1cmwsIGJvZHksIHR0bE1zKTtcbiAgICAgIHJldHVybiBib2R5O1xuICAgIH0pXG4gICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgaW5GbGlnaHQuZGVsZXRlKHVybCk7XG4gICAgfSk7XG5cbiAgaWYgKHR0bE1zID4gMCkgaW5GbGlnaHQuc2V0KHVybCwgcHJvbWlzZSk7XG4gIHJldHVybiBwcm9taXNlO1xufVxuXG4vKiogRmV0Y2ggYSBVUkwgYW5kIEpTT04ucGFyc2UgdGhlIGJvZHkuIFQgZGVzY3JpYmVzIHRoZSBleHBlY3RlZCByYXcgc2hhcGUuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hKc29uPFQ+KHVybDogc3RyaW5nLCBvcHRzOiBGZXRjaE9wdGlvbnMgPSB7fSk6IFByb21pc2U8VD4ge1xuICBjb25zdCBib2R5ID0gYXdhaXQgZmV0Y2hUZXh0KHVybCwgb3B0cyk7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UoYm9keSkgYXMgVDtcbiAgfSBjYXRjaCB7XG4gICAgLy8gQSBjYWNoZWQgYm9keSBzaG91bGQgbmV2ZXIgYmUgdW5wYXJzZWFibGUgSlNPTiB1bmxlc3MgdGhlIGVuZHBvaW50XG4gICAgLy8gcmV0dXJuZWQgSFRNTCAoZS5nLiBhbiBlcnJvciBwYWdlKSBcdTIwMTQgZG9uJ3Qga2VlcCBzZXJ2aW5nIGl0LlxuICAgIGJvZHlDYWNoZS5kZWxldGUodXJsKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgSlNPTiBmcm9tICR7bmV3IFVSTCh1cmwpLmhvc3RuYW1lfWApO1xuICB9XG59XG4iLCAiLy8gWWFob28gRmluYW5jZSBjbGllbnQuIFRoZSB2OCBjaGFydCBhbmQgdjEgc2VhcmNoIGVuZHBvaW50cyB3b3JrIHdpdGgganVzdFxuLy8gYSBicm93c2VyIFVBLiBxdW90ZVN1bW1hcnkgKHYxMCkgcmVxdWlyZXMgYSBjb29raWUgKyBjcnVtYiBwYWlyLCB3aGljaCBtYXlcbi8vIGZhaWwgYXQgYW55IHRpbWUgXHUyMDE0IGNhbGxlcnMgbXVzdCBkZWdyYWRlIGdyYWNlZnVsbHkgd2hlbiBpdCB0aHJvd3MuXG5cbmltcG9ydCB7IEJST1dTRVJfVUEsIGZldGNoSnNvbiwgSHR0cEVycm9yIH0gZnJvbSAnLi9odHRwJztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBSYXcgcmVzcG9uc2Ugc2hhcGVzICh0eXBlZCBhdCB0aGUgSlNPTiBwYXJzZSBib3VuZGFyeTsgZmllbGRzIG9wdGlvbmFsKVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBpbnRlcmZhY2UgWWFob29DaGFydE1ldGEge1xuICBjdXJyZW5jeT86IHN0cmluZyB8IG51bGw7XG4gIGV4Y2hhbmdlTmFtZT86IHN0cmluZyB8IG51bGw7XG4gIHJlZ3VsYXJNYXJrZXRQcmljZT86IG51bWJlciB8IG51bGw7XG4gIGNoYXJ0UHJldmlvdXNDbG9zZT86IG51bWJlciB8IG51bGw7XG4gIHByZXZpb3VzQ2xvc2U/OiBudW1iZXIgfCBudWxsO1xuICBtYXJrZXRTdGF0ZT86IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgWWFob29DaGFydFJlc3VsdCB7XG4gIG1ldGE/OiBZYWhvb0NoYXJ0TWV0YTtcbiAgdGltZXN0YW1wPzogQXJyYXk8bnVtYmVyIHwgbnVsbD47XG4gIGluZGljYXRvcnM/OiB7XG4gICAgcXVvdGU/OiBBcnJheTx7XG4gICAgICBvcGVuPzogQXJyYXk8bnVtYmVyIHwgbnVsbD47XG4gICAgICBoaWdoPzogQXJyYXk8bnVtYmVyIHwgbnVsbD47XG4gICAgICBsb3c/OiBBcnJheTxudW1iZXIgfCBudWxsPjtcbiAgICAgIGNsb3NlPzogQXJyYXk8bnVtYmVyIHwgbnVsbD47XG4gICAgICB2b2x1bWU/OiBBcnJheTxudW1iZXIgfCBudWxsPjtcbiAgICB9PjtcbiAgfTtcbn1cblxuaW50ZXJmYWNlIFlhaG9vQ2hhcnRSZXNwb25zZSB7XG4gIGNoYXJ0Pzoge1xuICAgIHJlc3VsdD86IFlhaG9vQ2hhcnRSZXN1bHRbXSB8IG51bGw7XG4gICAgZXJyb3I/OiB7IGNvZGU/OiBzdHJpbmc7IGRlc2NyaXB0aW9uPzogc3RyaW5nIH0gfCBudWxsO1xuICB9O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFlhaG9vU2VhcmNoUXVvdGUge1xuICBzeW1ib2w/OiBzdHJpbmc7XG4gIHNob3J0bmFtZT86IHN0cmluZztcbiAgbG9uZ25hbWU/OiBzdHJpbmc7XG4gIHF1b3RlVHlwZT86IHN0cmluZztcbiAgZXhjaERpc3A/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBZYWhvb1NlYXJjaFJlc3BvbnNlIHtcbiAgcXVvdGVzPzogWWFob29TZWFyY2hRdW90ZVtdO1xufVxuXG4vKiogcmF3IG51bWJlciB8IHtyYXc6IG51bWJlcn0gfCBmb3JtYXR0ZWQtc3RyaW5nIHVuaW9ucyBmcm9tIHF1b3RlU3VtbWFyeSAqL1xuZXhwb3J0IHR5cGUgWWFob29SYXdWYWx1ZSA9XG4gIHwgbnVtYmVyXG4gIHwgc3RyaW5nXG4gIHwgeyByYXc/OiBudW1iZXIgfCBudWxsOyBmbXQ/OiBzdHJpbmcgfCBudWxsIH1cbiAgfCBudWxsXG4gIHwgdW5kZWZpbmVkO1xuXG5leHBvcnQgaW50ZXJmYWNlIFlhaG9vUXVvdGVTdW1tYXJ5UmVzdWx0IHtcbiAgcHJpY2U/OiB7XG4gICAgbG9uZ05hbWU/OiBzdHJpbmcgfCBudWxsO1xuICAgIHNob3J0TmFtZT86IHN0cmluZyB8IG51bGw7XG4gICAgbWFya2V0U3RhdGU/OiBzdHJpbmcgfCBudWxsO1xuICAgIHJlZ3VsYXJNYXJrZXRQcmljZT86IFlhaG9vUmF3VmFsdWU7XG4gICAgbWFya2V0Q2FwPzogWWFob29SYXdWYWx1ZTtcbiAgfTtcbiAgc3VtbWFyeURldGFpbD86IHtcbiAgICB0cmFpbGluZ1BFPzogWWFob29SYXdWYWx1ZTtcbiAgICBmb3J3YXJkUEU/OiBZYWhvb1Jhd1ZhbHVlO1xuICAgIHByaWNlVG9TYWxlc1RyYWlsaW5nMTJNb250aHM/OiBZYWhvb1Jhd1ZhbHVlO1xuICAgIHByaWNlVG9Cb29rPzogWWFob29SYXdWYWx1ZTtcbiAgfTtcbiAgZGVmYXVsdEtleVN0YXRpc3RpY3M/OiB7XG4gICAgZW50ZXJwcmlzZVZhbHVlPzogWWFob29SYXdWYWx1ZTtcbiAgICBlbnRlcnByaXNlVG9SZXZlbnVlPzogWWFob29SYXdWYWx1ZTtcbiAgICBlbnRlcnByaXNlVG9FYml0ZGE/OiBZYWhvb1Jhd1ZhbHVlO1xuICAgIGZvcndhcmRFcHM/OiBZYWhvb1Jhd1ZhbHVlO1xuICAgIHNoYXJlc091dHN0YW5kaW5nPzogWWFob29SYXdWYWx1ZTtcbiAgfTtcbiAgZmluYW5jaWFsRGF0YT86IHtcbiAgICB0b3RhbFJldmVudWU/OiBZYWhvb1Jhd1ZhbHVlO1xuICAgIGdyb3NzUHJvZml0cz86IFlhaG9vUmF3VmFsdWU7XG4gICAgZWJpdGRhPzogWWFob29SYXdWYWx1ZTtcbiAgICBuZXRJbmNvbWVUb0NvbW1vbj86IFlhaG9vUmF3VmFsdWU7XG4gICAgcHJvZml0TWFyZ2lucz86IFlhaG9vUmF3VmFsdWU7XG4gICAgcmV2ZW51ZUdyb3d0aD86IFlhaG9vUmF3VmFsdWU7XG4gICAgdGFyZ2V0TWVhblByaWNlPzogWWFob29SYXdWYWx1ZTtcbiAgfTtcbiAgZWFybmluZ3NIaXN0b3J5Pzoge1xuICAgIGhpc3Rvcnk/OiBBcnJheTx7XG4gICAgICBxdWFydGVyPzogWWFob29SYXdWYWx1ZTtcbiAgICAgIGVwc0FjdHVhbD86IFlhaG9vUmF3VmFsdWU7XG4gICAgICBlcHNFc3RpbWF0ZT86IFlhaG9vUmF3VmFsdWU7XG4gICAgICBzdXJwcmlzZVBlcmNlbnQ/OiBZYWhvb1Jhd1ZhbHVlO1xuICAgIH0+O1xuICB9O1xuICB0b3BIb2xkaW5ncz86IHtcbiAgICBob2xkaW5ncz86IEFycmF5PHtcbiAgICAgIHN5bWJvbD86IHN0cmluZztcbiAgICAgIGhvbGRpbmdOYW1lPzogc3RyaW5nO1xuICAgICAgaG9sZGluZ1BlcmNlbnQ/OiBZYWhvb1Jhd1ZhbHVlO1xuICAgIH0+O1xuICB9O1xuICBjYWxlbmRhckV2ZW50cz86IHtcbiAgICBlYXJuaW5ncz86IHtcbiAgICAgIGVhcm5pbmdzRGF0ZT86IFlhaG9vUmF3VmFsdWVbXTtcbiAgICAgIGVhcm5pbmdzQXZlcmFnZT86IFlhaG9vUmF3VmFsdWU7XG4gICAgICBlYXJuaW5nc0NhbGxUaW1lPzogc3RyaW5nIHwgbnVsbDtcbiAgICAgIGNhbGxUaW1lPzogc3RyaW5nIHwgbnVsbDtcbiAgICAgIGlzRWFybmluZ3NEYXRlRXN0aW1hdGU/OiBZYWhvb1Jhd1ZhbHVlIHwgYm9vbGVhbjtcbiAgICB9O1xuICB9O1xufVxuXG5pbnRlcmZhY2UgWWFob29RdW90ZVN1bW1hcnlSZXNwb25zZSB7XG4gIHF1b3RlU3VtbWFyeT86IHtcbiAgICByZXN1bHQ/OiBZYWhvb1F1b3RlU3VtbWFyeVJlc3VsdFtdIHwgbnVsbDtcbiAgICBlcnJvcj86IHsgY29kZT86IHN0cmluZzsgZGVzY3JpcHRpb24/OiBzdHJpbmcgfSB8IG51bGw7XG4gIH07XG59XG5cbi8qKiBDb2VyY2UgWWFob28ncyBudW1iZXIgfCB7cmF3fSB1bmlvbnMgdG8gYSBmaW5pdGUgbnVtYmVyIG9yIG51bGwuICovXG5leHBvcnQgZnVuY3Rpb24gcmF3TnVtYmVyKHZhbHVlOiBZYWhvb1Jhd1ZhbHVlKTogbnVtYmVyIHwgbnVsbCB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmIE51bWJlci5pc0Zpbml0ZSh2YWx1ZSkpIHJldHVybiB2YWx1ZTtcbiAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICBjb25zdCByYXcgPSB2YWx1ZS5yYXc7XG4gICAgaWYgKHR5cGVvZiByYXcgPT09ICdudW1iZXInICYmIE51bWJlci5pc0Zpbml0ZShyYXcpKSByZXR1cm4gcmF3O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIENoYXJ0ICsgc2VhcmNoIChubyBhdXRoKVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaFlhaG9vQ2hhcnQoXG4gIHN5bWJvbDogc3RyaW5nLFxuICB5YWhvb1JhbmdlOiBzdHJpbmcsXG4gIGludGVydmFsOiBzdHJpbmcsXG4gIHR0bE1zOiBudW1iZXIsXG4pOiBQcm9taXNlPFlhaG9vQ2hhcnRSZXN1bHQ+IHtcbiAgY29uc3QgdXJsID1cbiAgICBgaHR0cHM6Ly9xdWVyeTEuZmluYW5jZS55YWhvby5jb20vdjgvZmluYW5jZS9jaGFydC8ke2VuY29kZVVSSUNvbXBvbmVudChzeW1ib2wpfWAgK1xuICAgIGA/cmFuZ2U9JHtlbmNvZGVVUklDb21wb25lbnQoeWFob29SYW5nZSl9JmludGVydmFsPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGludGVydmFsKX0maW5jbHVkZVByZVBvc3Q9ZmFsc2VgO1xuICBjb25zdCBqc29uID0gYXdhaXQgZmV0Y2hKc29uPFlhaG9vQ2hhcnRSZXNwb25zZT4odXJsLCB7IHR0bE1zIH0pO1xuICBjb25zdCByZXN1bHQgPSBqc29uLmNoYXJ0Py5yZXN1bHQ/LlswXTtcbiAgaWYgKCFyZXN1bHQgfHwgIXJlc3VsdC5tZXRhKSB7XG4gICAgY29uc3QgZGVzYyA9IGpzb24uY2hhcnQ/LmVycm9yPy5kZXNjcmlwdGlvbiA/PyAnZW1wdHkgY2hhcnQgcmVzdWx0JztcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFlhaG9vIGNoYXJ0IGZhaWxlZCBmb3IgJHtzeW1ib2x9OiAke2Rlc2N9YCk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlYXJjaFlhaG9vKHF1ZXJ5OiBzdHJpbmcpOiBQcm9taXNlPFlhaG9vU2VhcmNoUXVvdGVbXT4ge1xuICBjb25zdCB1cmwgPVxuICAgIGBodHRwczovL3F1ZXJ5MS5maW5hbmNlLnlhaG9vLmNvbS92MS9maW5hbmNlL3NlYXJjaGAgK1xuICAgIGA/cT0ke2VuY29kZVVSSUNvbXBvbmVudChxdWVyeSl9JnF1b3Rlc0NvdW50PTgmbmV3c0NvdW50PTBgO1xuICBjb25zdCBqc29uID0gYXdhaXQgZmV0Y2hKc29uPFlhaG9vU2VhcmNoUmVzcG9uc2U+KHVybCwgeyB0dGxNczogMTAgKiA2MF8wMDAgfSk7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGpzb24ucXVvdGVzKSA/IGpzb24ucXVvdGVzIDogW107XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gQ29va2llICsgY3J1bWIgKG5lZWRlZCBmb3IgcXVvdGVTdW1tYXJ5OyB1bnZlcmlmaWVkIGVuZHBvaW50IFx1MjAxNCBtYXkgZmFpbClcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5pbnRlcmZhY2UgQ3J1bWJTdGF0ZSB7XG4gIGNvb2tpZTogc3RyaW5nO1xuICBjcnVtYjogc3RyaW5nO1xuICBmZXRjaGVkQXQ6IG51bWJlcjtcbn1cblxuY29uc3QgQ1JVTUJfVFRMX01TID0gMzAgKiA2MF8wMDA7XG5sZXQgY3J1bWJTdGF0ZTogQ3J1bWJTdGF0ZSB8IG51bGwgPSBudWxsO1xubGV0IGNydW1iUHJvbWlzZTogUHJvbWlzZTxDcnVtYlN0YXRlPiB8IG51bGwgPSBudWxsO1xuXG5mdW5jdGlvbiBpbnZhbGlkYXRlQ3J1bWIoKTogdm9pZCB7XG4gIGNydW1iU3RhdGUgPSBudWxsO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaENvb2tpZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAvLyBmYy55YWhvby5jb20gdHlwaWNhbGx5IDQwNHMgXHUyMDE0IHdlIG9ubHkgd2FudCBpdHMgU2V0LUNvb2tpZSBoZWFkZXIuXG4gIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCdodHRwczovL2ZjLnlhaG9vLmNvbS8nLCB7XG4gICAgaGVhZGVyczogeyAnVXNlci1BZ2VudCc6IEJST1dTRVJfVUEgfSxcbiAgICByZWRpcmVjdDogJ21hbnVhbCcsXG4gICAgc2lnbmFsOiBBYm9ydFNpZ25hbC50aW1lb3V0KDEyXzAwMCksXG4gIH0pO1xuICBsZXQgY29va2llczogc3RyaW5nW10gPSBbXTtcbiAgdHJ5IHtcbiAgICBjb29raWVzID0gcmVzLmhlYWRlcnMuZ2V0U2V0Q29va2llKCk7XG4gIH0gY2F0Y2gge1xuICAgIC8qIG9sZGVyIHJ1bnRpbWVzICovXG4gIH1cbiAgaWYgKGNvb2tpZXMubGVuZ3RoID09PSAwKSB7XG4gICAgY29uc3Qgc2luZ2xlID0gcmVzLmhlYWRlcnMuZ2V0KCdzZXQtY29va2llJyk7XG4gICAgaWYgKHNpbmdsZSkgY29va2llcyA9IFtzaW5nbGVdO1xuICB9XG4gIGNvbnN0IHBhcnRzID0gY29va2llc1xuICAgIC5tYXAoKGMpID0+IGMuc3BsaXQoJzsnKVswXS50cmltKCkpXG4gICAgLmZpbHRlcigoYykgPT4gYy5pbmNsdWRlcygnPScpKTtcbiAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKCdZYWhvbyByZXR1cm5lZCBubyBjb29raWUnKTtcbiAgcmV0dXJuIHBhcnRzLmpvaW4oJzsgJyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoQ3J1bWJTdGF0ZSgpOiBQcm9taXNlPENydW1iU3RhdGU+IHtcbiAgY29uc3QgY29va2llID0gYXdhaXQgZmV0Y2hDb29raWUoKTtcbiAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vcXVlcnkxLmZpbmFuY2UueWFob28uY29tL3YxL3Rlc3QvZ2V0Y3J1bWInLCB7XG4gICAgaGVhZGVyczogeyAnVXNlci1BZ2VudCc6IEJST1dTRVJfVUEsIENvb2tpZTogY29va2llIH0sXG4gICAgc2lnbmFsOiBBYm9ydFNpZ25hbC50aW1lb3V0KDEyXzAwMCksXG4gIH0pO1xuICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IEh0dHBFcnJvcihgZ2V0Y3J1bWIgSFRUUCAke3Jlcy5zdGF0dXN9YCwgcmVzLnN0YXR1cyk7XG4gIGNvbnN0IGNydW1iID0gKGF3YWl0IHJlcy50ZXh0KCkpLnRyaW0oKTtcbiAgaWYgKCFjcnVtYiB8fCBjcnVtYi5sZW5ndGggPiA2NCB8fCBjcnVtYi5pbmNsdWRlcygnPCcpIHx8IGNydW1iLmluY2x1ZGVzKCd7JykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1lhaG9vIHJldHVybmVkIGFuIGludmFsaWQgY3J1bWInKTtcbiAgfVxuICByZXR1cm4geyBjb29raWUsIGNydW1iLCBmZXRjaGVkQXQ6IERhdGUubm93KCkgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0Q3J1bWIoZm9yY2UgPSBmYWxzZSk6IFByb21pc2U8Q3J1bWJTdGF0ZT4ge1xuICBpZiAoZm9yY2UpIGludmFsaWRhdGVDcnVtYigpO1xuICBpZiAoY3J1bWJTdGF0ZSAmJiBEYXRlLm5vdygpIC0gY3J1bWJTdGF0ZS5mZXRjaGVkQXQgPCBDUlVNQl9UVExfTVMpIHtcbiAgICByZXR1cm4gY3J1bWJTdGF0ZTtcbiAgfVxuICBpZiAoIWNydW1iUHJvbWlzZSkge1xuICAgIGNydW1iUHJvbWlzZSA9IGZldGNoQ3J1bWJTdGF0ZSgpXG4gICAgICAudGhlbigoc3RhdGUpID0+IHtcbiAgICAgICAgY3J1bWJTdGF0ZSA9IHN0YXRlO1xuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICB9KVxuICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICBjcnVtYlByb21pc2UgPSBudWxsO1xuICAgICAgfSk7XG4gIH1cbiAgcmV0dXJuIGNydW1iUHJvbWlzZTtcbn1cblxuLyoqXG4gKiBGZXRjaCBxdW90ZVN1bW1hcnkgbW9kdWxlcyBmb3IgYSBzeW1ib2wuIFRocm93cyBvbiBhbnkgZmFpbHVyZSBcdTIwMTQgY2FsbGVyc1xuICogZmFsbCBiYWNrIHRvIGJ1bmRsZWQvc2FtcGxlIGRhdGEuIFJlc3VsdHMgYXJlIE5PVCBjYWNoZWQgaGVyZSAoc2VydmljZXNcbiAqIGtlZXAgdGhlaXIgb3duIGxvbmdlci1saXZlZCBjYWNoZXMga2V5ZWQgYnkgc3ltYm9sKS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHF1b3RlU3VtbWFyeShcbiAgc3ltYm9sOiBzdHJpbmcsXG4gIG1vZHVsZXM6IHN0cmluZ1tdLFxuKTogUHJvbWlzZTxZYWhvb1F1b3RlU3VtbWFyeVJlc3VsdD4ge1xuICBsZXQgbGFzdEVycjogdW5rbm93bjtcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCAyOyBhdHRlbXB0KyspIHtcbiAgICBjb25zdCB7IGNvb2tpZSwgY3J1bWIgfSA9IGF3YWl0IGdldENydW1iKGF0dGVtcHQgPiAwKTtcbiAgICBjb25zdCB1cmwgPVxuICAgICAgYGh0dHBzOi8vcXVlcnkxLmZpbmFuY2UueWFob28uY29tL3YxMC9maW5hbmNlL3F1b3RlU3VtbWFyeS8ke2VuY29kZVVSSUNvbXBvbmVudChzeW1ib2wpfWAgK1xuICAgICAgYD9tb2R1bGVzPSR7ZW5jb2RlVVJJQ29tcG9uZW50KG1vZHVsZXMuam9pbignLCcpKX0mY3J1bWI9JHtlbmNvZGVVUklDb21wb25lbnQoY3J1bWIpfWA7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGpzb24gPSBhd2FpdCBmZXRjaEpzb248WWFob29RdW90ZVN1bW1hcnlSZXNwb25zZT4odXJsLCB7XG4gICAgICAgIHR0bE1zOiAwLFxuICAgICAgICBoZWFkZXJzOiB7IENvb2tpZTogY29va2llIH0sXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGpzb24ucXVvdGVTdW1tYXJ5Py5yZXN1bHQ/LlswXTtcbiAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgIGNvbnN0IGRlc2MgPSBqc29uLnF1b3RlU3VtbWFyeT8uZXJyb3I/LmRlc2NyaXB0aW9uID8/ICdlbXB0eSByZXN1bHQnO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHF1b3RlU3VtbWFyeSBmYWlsZWQgZm9yICR7c3ltYm9sfTogJHtkZXNjfWApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGxhc3RFcnIgPSBlcnI7XG4gICAgICBjb25zdCBzdGF0dXMgPSBlcnIgaW5zdGFuY2VvZiBIdHRwRXJyb3IgPyBlcnIuc3RhdHVzIDogdW5kZWZpbmVkO1xuICAgICAgaWYgKChzdGF0dXMgPT09IDQwMSB8fCBzdGF0dXMgPT09IDQwMykgJiYgYXR0ZW1wdCA9PT0gMCkge1xuICAgICAgICBpbnZhbGlkYXRlQ3J1bWIoKTtcbiAgICAgICAgY29udGludWU7IC8vIG9uZSByZXRyeSB3aXRoIGEgZnJlc2ggY3J1bWJcbiAgICAgIH1cbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH1cbiAgdGhyb3cgbGFzdEVyciBpbnN0YW5jZW9mIEVycm9yID8gbGFzdEVyciA6IG5ldyBFcnJvcihgcXVvdGVTdW1tYXJ5IGZhaWxlZCBmb3IgJHtzeW1ib2x9YCk7XG59XG4iLCAiLy8gY2hhcnQ6Z2V0IFx1MjAxNCBjYW5kbGVzIGZyb20gWWFob28ncyB2OCBjaGFydCBlbmRwb2ludCB3aXRoIGNsZWFuIGFzY2VuZGluZ1xuLy8gY2FuZGxlcyAobnVsbCBjbG9zZXMgc2tpcHBlZCwgT0hMQyBzYW5pdHktY2xhbXBlZCkuIEFueSBmYWlsdXJlIGZhbGxzXG4vLyBiYWNrIHRvIHRoZSBkZXRlcm1pbmlzdGljIHNhbXBsZSB3YWxrLCBmbGFnZ2VkIHNvdXJjZSAnc2FtcGxlJy5cblxuaW1wb3J0IHR5cGUgeyBDYW5kbGUsIENoYXJ0RGF0YSwgQ2hhcnRSYW5nZSB9IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XG5pbXBvcnQgeyBzYW1wbGVDaGFydCB9IGZyb20gJy4vc2FtcGxlJztcbmltcG9ydCB7IGZldGNoWWFob29DaGFydCB9IGZyb20gJy4veWFob28nO1xuXG5pbnRlcmZhY2UgUmFuZ2VTcGVjIHtcbiAgeWFob29SYW5nZTogc3RyaW5nO1xuICBpbnRlcnZhbDogc3RyaW5nO1xuICB0dGxNczogbnVtYmVyO1xufVxuXG5jb25zdCBJTlRSQURBWV9UVEwgPSA2MF8wMDA7XG5jb25zdCBEQUlMWV9UVEwgPSAxMCAqIDYwXzAwMDtcblxuY29uc3QgUkFOR0VfTUFQOiBSZWNvcmQ8Q2hhcnRSYW5nZSwgUmFuZ2VTcGVjPiA9IHtcbiAgJzFkJzogeyB5YWhvb1JhbmdlOiAnMWQnLCBpbnRlcnZhbDogJzVtJywgdHRsTXM6IElOVFJBREFZX1RUTCB9LFxuICAnMXcnOiB7IHlhaG9vUmFuZ2U6ICc1ZCcsIGludGVydmFsOiAnMTVtJywgdHRsTXM6IElOVFJBREFZX1RUTCB9LFxuICAnMW0nOiB7IHlhaG9vUmFuZ2U6ICcxbW8nLCBpbnRlcnZhbDogJzYwbScsIHR0bE1zOiBJTlRSQURBWV9UVEwgfSxcbiAgJzZtJzogeyB5YWhvb1JhbmdlOiAnNm1vJywgaW50ZXJ2YWw6ICcxZCcsIHR0bE1zOiBEQUlMWV9UVEwgfSxcbiAgJzF5JzogeyB5YWhvb1JhbmdlOiAnMXknLCBpbnRlcnZhbDogJzFkJywgdHRsTXM6IERBSUxZX1RUTCB9LFxuICAnNXknOiB7IHlhaG9vUmFuZ2U6ICc1eScsIGludGVydmFsOiAnMXdrJywgdHRsTXM6IERBSUxZX1RUTCB9LFxuICBtYXg6IHsgeWFob29SYW5nZTogJ21heCcsIGludGVydmFsOiAnMW1vJywgdHRsTXM6IERBSUxZX1RUTCB9LFxufTtcblxuZnVuY3Rpb24gaXNGaW5pdGVOdW1iZXIodjogbnVtYmVyIHwgbnVsbCB8IHVuZGVmaW5lZCk6IHYgaXMgbnVtYmVyIHtcbiAgcmV0dXJuIHR5cGVvZiB2ID09PSAnbnVtYmVyJyAmJiBOdW1iZXIuaXNGaW5pdGUodik7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDaGFydChzeW1ib2w6IHN0cmluZywgcmFuZ2U6IENoYXJ0UmFuZ2UpOiBQcm9taXNlPENoYXJ0RGF0YT4ge1xuICBjb25zdCBzcGVjID0gUkFOR0VfTUFQW3JhbmdlXTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBmZXRjaFlhaG9vQ2hhcnQoc3ltYm9sLCBzcGVjLnlhaG9vUmFuZ2UsIHNwZWMuaW50ZXJ2YWwsIHNwZWMudHRsTXMpO1xuICAgIGNvbnN0IG1ldGEgPSByZXN1bHQubWV0YSA/PyB7fTtcbiAgICBjb25zdCB0aW1lc3RhbXBzID0gQXJyYXkuaXNBcnJheShyZXN1bHQudGltZXN0YW1wKSA/IHJlc3VsdC50aW1lc3RhbXAgOiBbXTtcbiAgICBjb25zdCBxdW90ZSA9IHJlc3VsdC5pbmRpY2F0b3JzPy5xdW90ZT8uWzBdID8/IHt9O1xuICAgIGNvbnN0IG9wZW5zID0gcXVvdGUub3BlbiA/PyBbXTtcbiAgICBjb25zdCBoaWdocyA9IHF1b3RlLmhpZ2ggPz8gW107XG4gICAgY29uc3QgbG93cyA9IHF1b3RlLmxvdyA/PyBbXTtcbiAgICBjb25zdCBjbG9zZXMgPSBxdW90ZS5jbG9zZSA/PyBbXTtcbiAgICBjb25zdCB2b2x1bWVzID0gcXVvdGUudm9sdW1lID8/IFtdO1xuXG4gICAgY29uc3QgYnlTZWNvbmQgPSBuZXcgTWFwPG51bWJlciwgQ2FuZGxlPigpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGltZXN0YW1wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgdGltZSA9IHRpbWVzdGFtcHNbaV07XG4gICAgICBjb25zdCBjbG9zZSA9IGNsb3Nlc1tpXTtcbiAgICAgIGlmICghaXNGaW5pdGVOdW1iZXIodGltZSkgfHwgIWlzRmluaXRlTnVtYmVyKGNsb3NlKSkgY29udGludWU7XG4gICAgICBjb25zdCByYXdPcGVuID0gb3BlbnNbaV07XG4gICAgICBjb25zdCByYXdIaWdoID0gaGlnaHNbaV07XG4gICAgICBjb25zdCByYXdMb3cgPSBsb3dzW2ldO1xuICAgICAgY29uc3QgcmF3Vm9sdW1lID0gdm9sdW1lc1tpXTtcbiAgICAgIGNvbnN0IG9wZW4gPSBpc0Zpbml0ZU51bWJlcihyYXdPcGVuKSA/IHJhd09wZW4gOiBjbG9zZTtcbiAgICAgIGxldCBoaWdoID0gaXNGaW5pdGVOdW1iZXIocmF3SGlnaCkgPyByYXdIaWdoIDogTWF0aC5tYXgob3BlbiwgY2xvc2UpO1xuICAgICAgbGV0IGxvdyA9IGlzRmluaXRlTnVtYmVyKHJhd0xvdykgPyByYXdMb3cgOiBNYXRoLm1pbihvcGVuLCBjbG9zZSk7XG4gICAgICBoaWdoID0gTWF0aC5tYXgoaGlnaCwgb3BlbiwgY2xvc2UpO1xuICAgICAgbG93ID0gTWF0aC5taW4obG93LCBvcGVuLCBjbG9zZSk7XG4gICAgICBjb25zdCB2b2x1bWUgPSBpc0Zpbml0ZU51bWJlcihyYXdWb2x1bWUpID8gcmF3Vm9sdW1lIDogMDtcbiAgICAgIC8vIGxhc3Qgd3JpdGUgd2lucyBmb3IgZHVwbGljYXRlIHRpbWVzdGFtcHMgKFlhaG9vIHJlcGVhdHMgdGhlIGxpdmUgYmFyKVxuICAgICAgYnlTZWNvbmQuc2V0KE1hdGguZmxvb3IodGltZSksIHsgdGltZTogTWF0aC5mbG9vcih0aW1lKSwgb3BlbiwgaGlnaCwgbG93LCBjbG9zZSwgdm9sdW1lIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGNhbmRsZXMgPSBbLi4uYnlTZWNvbmQudmFsdWVzKCldLnNvcnQoKGEsIGIpID0+IGEudGltZSAtIGIudGltZSk7XG4gICAgaWYgKGNhbmRsZXMubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgRXJyb3IoYG5vIHVzYWJsZSBjYW5kbGVzIGZvciAke3N5bWJvbH0gJHtyYW5nZX1gKTtcblxuICAgIHJldHVybiB7XG4gICAgICBzeW1ib2wsXG4gICAgICByYW5nZSxcbiAgICAgIGludGVydmFsOiBzcGVjLmludGVydmFsLFxuICAgICAgY2FuZGxlcyxcbiAgICAgIGN1cnJlbmN5OiB0eXBlb2YgbWV0YS5jdXJyZW5jeSA9PT0gJ3N0cmluZycgJiYgbWV0YS5jdXJyZW5jeSA/IG1ldGEuY3VycmVuY3kgOiAnVVNEJyxcbiAgICAgIGV4Y2hhbmdlTmFtZTpcbiAgICAgICAgdHlwZW9mIG1ldGEuZXhjaGFuZ2VOYW1lID09PSAnc3RyaW5nJyAmJiBtZXRhLmV4Y2hhbmdlTmFtZVxuICAgICAgICAgID8gbWV0YS5leGNoYW5nZU5hbWVcbiAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgIHJlZ3VsYXJNYXJrZXRQcmljZTogaXNGaW5pdGVOdW1iZXIobWV0YS5yZWd1bGFyTWFya2V0UHJpY2UpXG4gICAgICAgID8gbWV0YS5yZWd1bGFyTWFya2V0UHJpY2VcbiAgICAgICAgOiBudWxsLFxuICAgICAgcHJldmlvdXNDbG9zZTogaXNGaW5pdGVOdW1iZXIobWV0YS5jaGFydFByZXZpb3VzQ2xvc2UpXG4gICAgICAgID8gbWV0YS5jaGFydFByZXZpb3VzQ2xvc2VcbiAgICAgICAgOiBpc0Zpbml0ZU51bWJlcihtZXRhLnByZXZpb3VzQ2xvc2UpXG4gICAgICAgICAgPyBtZXRhLnByZXZpb3VzQ2xvc2VcbiAgICAgICAgICA6IG51bGwsXG4gICAgICBzb3VyY2U6ICdsaXZlJyxcbiAgICB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gc2FtcGxlQ2hhcnQoc3ltYm9sLCByYW5nZSk7XG4gIH1cbn1cbiIsICIvLyBlYXJuaW5nczpnZXQgXHUyMDE0IHVwY29taW5nIGVhcm5pbmdzIHBlciBzeW1ib2wgdmlhIHF1b3RlU3VtbWFyeVxuLy8gY2FsZW5kYXJFdmVudHMgKCtwcmljZSBmb3IgdGhlIGNvbXBhbnkgbmFtZSkuIENvb2tpZS9jcnVtYiBtYXkgZmFpbCBhdFxuLy8gYW55IHRpbWU7IGVhY2ggZmFpbGVkIHN5bWJvbCBkZWdyYWRlcyB0byBhIGRldGVybWluaXN0aWMgc2FtcGxlIGV2ZW50LlxuXG5pbXBvcnQgdHlwZSB7IEVhcm5pbmdzRXZlbnQsIEVhcm5pbmdzVGltZSB9IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XG5pbXBvcnQgeyBUdGxDYWNoZSB9IGZyb20gJy4vY2FjaGUnO1xuaW1wb3J0IHsgbG9va3VwTmFtZSB9IGZyb20gJy4vZGF0YUZpbGVzJztcbmltcG9ydCB7IHNhbXBsZUVhcm5pbmdzIH0gZnJvbSAnLi9zYW1wbGUnO1xuaW1wb3J0IHsgcExpbWl0LCB0b1ltZCB9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgeyBxdW90ZVN1bW1hcnksIHJhd051bWJlciwgWWFob29SYXdWYWx1ZSB9IGZyb20gJy4veWFob28nO1xuXG5jb25zdCBMSVZFX1RUTF9NUyA9IDYgKiA2MCAqIDYwXzAwMDsgLy8gNmhcbmNvbnN0IFNBTVBMRV9UVExfTVMgPSAxMCAqIDYwXzAwMDsgLy8gcmV0cnkgbGl2ZSBzb29uZXIgYWZ0ZXIgZmFpbHVyZXNcbmNvbnN0IFdJTkRPV19EQVlTID0gMTIwO1xuY29uc3QgbGltaXQgPSBwTGltaXQoMyk7XG5cbi8vIG51bGwgPSBsaXZlIHNhaWQgXCJubyB1cGNvbWluZyBlYXJuaW5nc1wiIChjYWNoZWQgc28gd2UgZG9uJ3QgcmVmZXRjaCkuXG5jb25zdCBjYWNoZSA9IG5ldyBUdGxDYWNoZTxFYXJuaW5nc0V2ZW50IHwgbnVsbD4oNDAwKTtcblxuZnVuY3Rpb24gdG9FcG9jaE1zKHZhbHVlOiBZYWhvb1Jhd1ZhbHVlKTogbnVtYmVyIHwgbnVsbCB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmIE51bWJlci5pc0Zpbml0ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUgPiAxZTEyID8gdmFsdWUgOiB2YWx1ZSAqIDEwMDA7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICBjb25zdCBtcyA9IERhdGUucGFyc2UodmFsdWUpO1xuICAgIHJldHVybiBOdW1iZXIuaXNOYU4obXMpID8gbnVsbCA6IG1zO1xuICB9XG4gIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgY29uc3QgcmF3ID0gdmFsdWUucmF3O1xuICAgIGlmICh0eXBlb2YgcmF3ID09PSAnbnVtYmVyJyAmJiBOdW1iZXIuaXNGaW5pdGUocmF3KSkge1xuICAgICAgcmV0dXJuIHJhdyA+IDFlMTIgPyByYXcgOiByYXcgKiAxMDAwO1xuICAgIH1cbiAgICBjb25zdCBmbXQgPSB2YWx1ZS5mbXQ7XG4gICAgaWYgKHR5cGVvZiBmbXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCBtcyA9IERhdGUucGFyc2UoZm10KTtcbiAgICAgIHJldHVybiBOdW1iZXIuaXNOYU4obXMpID8gbnVsbCA6IG1zO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZGV0ZWN0VGltZShjYW5kaWRhdGVzOiBBcnJheTxzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkPik6IEVhcm5pbmdzVGltZSB7XG4gIGZvciAoY29uc3QgYyBvZiBjYW5kaWRhdGVzKSB7XG4gICAgaWYgKHR5cGVvZiBjICE9PSAnc3RyaW5nJykgY29udGludWU7XG4gICAgY29uc3QgdiA9IGMudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAodi5pbmNsdWRlcygnYm1vJykgfHwgdi5pbmNsdWRlcygnYmVmb3JlJykpIHJldHVybiAnYm1vJztcbiAgICBpZiAodi5pbmNsdWRlcygnYW1jJykgfHwgdi5pbmNsdWRlcygnYWZ0ZXInKSkgcmV0dXJuICdhbWMnO1xuICB9XG4gIHJldHVybiAndW5rbm93bic7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoTGl2ZUV2ZW50KHN5bWJvbDogc3RyaW5nKTogUHJvbWlzZTxFYXJuaW5nc0V2ZW50IHwgbnVsbD4ge1xuICBjb25zdCBzdW1tYXJ5ID0gYXdhaXQgcXVvdGVTdW1tYXJ5KHN5bWJvbCwgWydjYWxlbmRhckV2ZW50cycsICdlYXJuaW5nc0hpc3RvcnknLCAncHJpY2UnXSk7XG4gIGNvbnN0IGVhcm5pbmdzID0gc3VtbWFyeS5jYWxlbmRhckV2ZW50cz8uZWFybmluZ3M7XG4gIGNvbnN0IGxhdGVzdEhpc3RvcnkgPSBzdW1tYXJ5LmVhcm5pbmdzSGlzdG9yeT8uaGlzdG9yeT8uWzBdO1xuICBjb25zdCBjb21wYW55TmFtZSA9XG4gICAgc3VtbWFyeS5wcmljZT8ubG9uZ05hbWUgfHxcbiAgICBzdW1tYXJ5LnByaWNlPy5zaG9ydE5hbWUgfHxcbiAgICBsb29rdXBOYW1lKHN5bWJvbCkgfHxcbiAgICBzeW1ib2w7XG5cbiAgY29uc3QgZGF0ZXMgPSBBcnJheS5pc0FycmF5KGVhcm5pbmdzPy5lYXJuaW5nc0RhdGUpID8gZWFybmluZ3MuZWFybmluZ3NEYXRlIDogW107XG4gIGNvbnN0IHN0YXJ0T2ZUb2RheSA9IERhdGUucGFyc2UoYCR7dG9ZbWQobmV3IERhdGUoKSl9VDAwOjAwOjAwWmApO1xuICBjb25zdCB3aW5kb3dFbmQgPSBzdGFydE9mVG9kYXkgKyBXSU5ET1dfREFZUyAqIDg2XzQwMF8wMDA7XG5cbiAgbGV0IG5leHRNczogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIGZvciAoY29uc3QgZCBvZiBkYXRlcykge1xuICAgIGNvbnN0IG1zID0gdG9FcG9jaE1zKGQpO1xuICAgIGlmIChtcyA9PT0gbnVsbCB8fCBtcyA8IHN0YXJ0T2ZUb2RheSB8fCBtcyA+IHdpbmRvd0VuZCkgY29udGludWU7XG4gICAgaWYgKG5leHRNcyA9PT0gbnVsbCB8fCBtcyA8IG5leHRNcykgbmV4dE1zID0gbXM7XG4gIH1cbiAgaWYgKG5leHRNcyA9PT0gbnVsbCkgcmV0dXJuIG51bGw7IC8vIGxpdmUgc3VjY2VlZGVkLCBub3RoaW5nIHVwY29taW5nXG5cbiAgcmV0dXJuIHtcbiAgICBzeW1ib2wsXG4gICAgY29tcGFueU5hbWUsXG4gICAgZGF0ZTogdG9ZbWQobmV3IERhdGUobmV4dE1zKSksXG4gICAgdGltZTogZGV0ZWN0VGltZShbZWFybmluZ3M/LmVhcm5pbmdzQ2FsbFRpbWUsIGVhcm5pbmdzPy5jYWxsVGltZV0pLFxuICAgIGVwc0VzdGltYXRlOiByYXdOdW1iZXIoZWFybmluZ3M/LmVhcm5pbmdzQXZlcmFnZSksXG4gICAgZXBzQWN0dWFsOiByYXdOdW1iZXIobGF0ZXN0SGlzdG9yeT8uZXBzQWN0dWFsKSxcbiAgICBlcHNTdXJwcmlzZVBlcmNlbnQ6IHJhd051bWJlcihsYXRlc3RIaXN0b3J5Py5zdXJwcmlzZVBlcmNlbnQpLFxuICAgIGxhdGVzdFJlcG9ydGVkRGF0ZTpcbiAgICAgIGxhdGVzdEhpc3Rvcnk/LnF1YXJ0ZXIgPT09IHVuZGVmaW5lZFxuICAgICAgICA/IG51bGxcbiAgICAgICAgOiAoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbXMgPSB0b0Vwb2NoTXMobGF0ZXN0SGlzdG9yeS5xdWFydGVyKTtcbiAgICAgICAgICAgIHJldHVybiBtcyA9PT0gbnVsbCA/IG51bGwgOiB0b1ltZChuZXcgRGF0ZShtcykpO1xuICAgICAgICAgIH0pKCksXG4gICAgc291cmNlOiAnbGl2ZScsXG4gIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGV2ZW50Rm9yKHN5bWJvbDogc3RyaW5nKTogUHJvbWlzZTxFYXJuaW5nc0V2ZW50IHwgbnVsbD4ge1xuICBjb25zdCBjYWNoZWQgPSBjYWNoZS5nZXQoc3ltYm9sKTtcbiAgaWYgKGNhY2hlZCAhPT0gdW5kZWZpbmVkKSByZXR1cm4gY2FjaGVkO1xuICB0cnkge1xuICAgIGNvbnN0IGV2ZW50ID0gYXdhaXQgbGltaXQoKCkgPT4gZmV0Y2hMaXZlRXZlbnQoc3ltYm9sKSk7XG4gICAgY2FjaGUuc2V0KHN5bWJvbCwgZXZlbnQsIExJVkVfVFRMX01TKTtcbiAgICByZXR1cm4gZXZlbnQ7XG4gIH0gY2F0Y2gge1xuICAgIGNvbnN0IGV2ZW50ID0gc2FtcGxlRWFybmluZ3Moc3ltYm9sKTtcbiAgICBjYWNoZS5zZXQoc3ltYm9sLCBldmVudCwgU0FNUExFX1RUTF9NUyk7XG4gICAgcmV0dXJuIGV2ZW50O1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRFYXJuaW5ncyhzeW1ib2xzOiBzdHJpbmdbXSk6IFByb21pc2U8RWFybmluZ3NFdmVudFtdPiB7XG4gIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChzeW1ib2xzLm1hcCgocykgPT4gZXZlbnRGb3IocykpKTtcbiAgY29uc3QgZXZlbnRzID0gcmVzdWx0cy5maWx0ZXIoKGUpOiBlIGlzIEVhcm5pbmdzRXZlbnQgPT4gZSAhPT0gbnVsbCk7XG4gIGV2ZW50cy5zb3J0KChhLCBiKSA9PiBhLmRhdGUubG9jYWxlQ29tcGFyZShiLmRhdGUpIHx8IGEuc3ltYm9sLmxvY2FsZUNvbXBhcmUoYi5zeW1ib2wpKTtcbiAgcmV0dXJuIGV2ZW50cztcbn1cbiIsICIvLyBob2xkaW5nczpnZXQgXHUyMDE0IHRvcC0yMCBFVEYgaG9sZGluZ3MuIFRyaWVzIHRoZSBsaXZlIHF1b3RlU3VtbWFyeVxuLy8gdG9wSG9sZGluZ3MgbW9kdWxlICh1c3VhbGx5IHRvcCAxMCkgYW5kIG1lcmdlcyBpdCBvdmVyIHRoZSBidW5kbGVkXG4vLyBzbmFwc2hvdCAobGl2ZSB3ZWlnaHRzIHdpbiwgYnVuZGxlIGZpbGxzIHRoZSBsaXN0IG91dCB0byAyMCkuIEFueVxuLy8gZmFpbHVyZSByZXR1cm5zIHRoZSBidW5kbGVkIGRhdGEgZmxhZ2dlZCAnc2FtcGxlJy5cblxuaW1wb3J0IHR5cGUgeyBIb2xkaW5nLCBIb2xkaW5nc1Jlc3VsdCB9IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XG5pbXBvcnQgeyBUdGxDYWNoZSB9IGZyb20gJy4vY2FjaGUnO1xuaW1wb3J0IHsgZ2V0QnVuZGxlQXNPZiwgZ2V0RXRmQnVuZGxlIH0gZnJvbSAnLi9kYXRhRmlsZXMnO1xuaW1wb3J0IHsgcm91bmQyLCB0b2RheVltZCB9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgeyBxdW90ZVN1bW1hcnksIHJhd051bWJlciB9IGZyb20gJy4veWFob28nO1xuXG5jb25zdCBMSVZFX1RUTF9NUyA9IDEyICogNjAgKiA2MF8wMDA7IC8vIDEyaFxuY29uc3QgU0FNUExFX1RUTF9NUyA9IDE1ICogNjBfMDAwOyAvLyByZXRyeSBsaXZlIHNvb25lciBhZnRlciBhIGZhaWx1cmVcbmNvbnN0IE1BWF9IT0xESU5HUyA9IDIwO1xuXG5jb25zdCBjYWNoZSA9IG5ldyBUdGxDYWNoZTxIb2xkaW5nc1Jlc3VsdD4oMjAwKTtcbmNvbnN0IGluRmxpZ2h0ID0gbmV3IE1hcDxzdHJpbmcsIFByb21pc2U8SG9sZGluZ3NSZXN1bHQ+PigpO1xuXG5mdW5jdGlvbiBidW5kbGVkUmVzdWx0KGV0ZlN5bWJvbDogc3RyaW5nKTogSG9sZGluZ3NSZXN1bHQge1xuICBjb25zdCBlbnRyeSA9IGdldEV0ZkJ1bmRsZSgpLmV0ZnNbZXRmU3ltYm9sXTtcbiAgcmV0dXJuIHtcbiAgICBldGZTeW1ib2wsXG4gICAgYXNPZjogZ2V0QnVuZGxlQXNPZigpLFxuICAgIGhvbGRpbmdzOiBlbnRyeSA/IGVudHJ5LmhvbGRpbmdzLnNsaWNlKDAsIE1BWF9IT0xESU5HUykgOiBbXSxcbiAgICBzb3VyY2U6ICdzYW1wbGUnLFxuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaExpdmVIb2xkaW5ncyhldGZTeW1ib2w6IHN0cmluZyk6IFByb21pc2U8SG9sZGluZ1tdPiB7XG4gIGNvbnN0IHN1bW1hcnkgPSBhd2FpdCBxdW90ZVN1bW1hcnkoZXRmU3ltYm9sLCBbJ3RvcEhvbGRpbmdzJ10pO1xuICBjb25zdCByYXcgPSBzdW1tYXJ5LnRvcEhvbGRpbmdzPy5ob2xkaW5ncztcbiAgaWYgKCFBcnJheS5pc0FycmF5KHJhdykgfHwgcmF3Lmxlbmd0aCA9PT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgbm8gbGl2ZSB0b3BIb2xkaW5ncyBmb3IgJHtldGZTeW1ib2x9YCk7XG4gIH1cbiAgY29uc3Qgb3V0OiBIb2xkaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBoIG9mIHJhdykge1xuICAgIGNvbnN0IHN5bWJvbCA9IHR5cGVvZiBoLnN5bWJvbCA9PT0gJ3N0cmluZycgPyBoLnN5bWJvbC50b1VwcGVyQ2FzZSgpLnRyaW0oKSA6ICcnO1xuICAgIGlmICghc3ltYm9sIHx8IG91dC5zb21lKCh4KSA9PiB4LnN5bWJvbCA9PT0gc3ltYm9sKSkgY29udGludWU7XG4gICAgY29uc3QgZnJhY3Rpb24gPSByYXdOdW1iZXIoaC5ob2xkaW5nUGVyY2VudCk7XG4gICAgb3V0LnB1c2goe1xuICAgICAgc3ltYm9sLFxuICAgICAgbmFtZTogdHlwZW9mIGguaG9sZGluZ05hbWUgPT09ICdzdHJpbmcnICYmIGguaG9sZGluZ05hbWUgPyBoLmhvbGRpbmdOYW1lIDogc3ltYm9sLFxuICAgICAgd2VpZ2h0UGVyY2VudDogZnJhY3Rpb24gPT09IG51bGwgPyBudWxsIDogcm91bmQyKGZyYWN0aW9uICogMTAwKSxcbiAgICB9KTtcbiAgfVxuICBpZiAob3V0Lmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKGB1bnVzYWJsZSBsaXZlIHRvcEhvbGRpbmdzIGZvciAke2V0ZlN5bWJvbH1gKTtcbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gbWVyZ2VXaXRoQnVuZGxlKGV0ZlN5bWJvbDogc3RyaW5nLCBsaXZlOiBIb2xkaW5nW10pOiBIb2xkaW5nW10ge1xuICBjb25zdCBtZXJnZWQ6IEhvbGRpbmdbXSA9IFsuLi5saXZlXTtcbiAgY29uc3QgYnVuZGxlID0gZ2V0RXRmQnVuZGxlKCkuZXRmc1tldGZTeW1ib2xdO1xuICBpZiAoYnVuZGxlKSB7XG4gICAgZm9yIChjb25zdCBoIG9mIGJ1bmRsZS5ob2xkaW5ncykge1xuICAgICAgaWYgKG1lcmdlZC5sZW5ndGggPj0gTUFYX0hPTERJTkdTKSBicmVhaztcbiAgICAgIGlmIChtZXJnZWQuc29tZSgoeCkgPT4geC5zeW1ib2wgPT09IGguc3ltYm9sKSkgY29udGludWU7XG4gICAgICBtZXJnZWQucHVzaChoKTtcbiAgICB9XG4gICAgLy8gUHJlZmVyIHRoZSBjdXJhdGVkIG5hbWVzIHdoZXJlIGxpdmUgZ2F2ZSB1cyBub25lL3RlcnNlIG9uZXM/IExpdmUgd2luc1xuICAgIC8vIHBlciBzcGVjIFx1MjAxNCBidXQgZG8gYmFja2ZpbGwgbWlzc2luZyBuYW1lcyBmcm9tIHRoZSBidW5kbGUuXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIG1lcmdlZCkge1xuICAgICAgaWYgKGl0ZW0ubmFtZSA9PT0gaXRlbS5zeW1ib2wpIHtcbiAgICAgICAgY29uc3Qga25vd24gPSBidW5kbGUuaG9sZGluZ3MuZmluZCgoeCkgPT4geC5zeW1ib2wgPT09IGl0ZW0uc3ltYm9sKTtcbiAgICAgICAgaWYgKGtub3duKSBpdGVtLm5hbWUgPSBrbm93bi5uYW1lO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBtZXJnZWQuc29ydCgoYSwgYikgPT4gKGIud2VpZ2h0UGVyY2VudCA/PyAtMSkgLSAoYS53ZWlnaHRQZXJjZW50ID8/IC0xKSk7XG4gIHJldHVybiBtZXJnZWQuc2xpY2UoMCwgTUFYX0hPTERJTkdTKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEhvbGRpbmdzKGV0ZlN5bWJvbDogc3RyaW5nKTogUHJvbWlzZTxIb2xkaW5nc1Jlc3VsdD4ge1xuICBjb25zdCBzeW0gPSBldGZTeW1ib2wudG9VcHBlckNhc2UoKTtcbiAgY29uc3QgY2FjaGVkID0gY2FjaGUuZ2V0KHN5bSk7XG4gIGlmIChjYWNoZWQpIHJldHVybiBjYWNoZWQ7XG4gIGNvbnN0IHBlbmRpbmcgPSBpbkZsaWdodC5nZXQoc3ltKTtcbiAgaWYgKHBlbmRpbmcpIHJldHVybiBwZW5kaW5nO1xuXG4gIGNvbnN0IHByb21pc2UgPSAoYXN5bmMgKCk6IFByb21pc2U8SG9sZGluZ3NSZXN1bHQ+ID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbGl2ZSA9IGF3YWl0IGZldGNoTGl2ZUhvbGRpbmdzKHN5bSk7XG4gICAgICBjb25zdCByZXN1bHQ6IEhvbGRpbmdzUmVzdWx0ID0ge1xuICAgICAgICBldGZTeW1ib2w6IHN5bSxcbiAgICAgICAgYXNPZjogdG9kYXlZbWQoKSxcbiAgICAgICAgaG9sZGluZ3M6IG1lcmdlV2l0aEJ1bmRsZShzeW0sIGxpdmUpLFxuICAgICAgICBzb3VyY2U6ICdsaXZlJyxcbiAgICAgIH07XG4gICAgICBjYWNoZS5zZXQoc3ltLCByZXN1bHQsIExJVkVfVFRMX01TKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSBjYXRjaCB7XG4gICAgICBjb25zdCByZXN1bHQgPSBidW5kbGVkUmVzdWx0KHN5bSk7XG4gICAgICBjYWNoZS5zZXQoc3ltLCByZXN1bHQsIFNBTVBMRV9UVExfTVMpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH0pKCkuZmluYWxseSgoKSA9PiB7XG4gICAgaW5GbGlnaHQuZGVsZXRlKHN5bSk7XG4gIH0pO1xuXG4gIGluRmxpZ2h0LnNldChzeW0sIHByb21pc2UpO1xuICByZXR1cm4gcHJvbWlzZTtcbn1cbiIsICJpbXBvcnQgeyBhcHAgfSBmcm9tICdlbGVjdHJvbic7XG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHR5cGUgeyBMbG1TZXR0aW5ncyB9IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XG5cbmNvbnN0IERFRkFVTFRfQkFTRV9VUkwgPSBwcm9jZXNzLmVudi5RVUFOVF9MTE1fQkFTRV9VUkwgPz8gJ2h0dHA6Ly8xMjcuMC4wLjE6ODA4MCc7XG5jb25zdCBERUZBVUxUX01PREVMID0gcHJvY2Vzcy5lbnYuUVVBTlRfTExNX01PREVMID8/ICdnZW1tYS00LWU0Yic7XG5cbmZ1bmN0aW9uIGVudkVuYWJsZWQoKTogYm9vbGVhbiB7XG4gIHJldHVybiAvXigxfHRydWV8eWVzKSQvaS50ZXN0KHByb2Nlc3MuZW52LlFVQU5UX0xMTV9FTkFCTEVEID8/ICcnKSB8fFxuICAgIEJvb2xlYW4ocHJvY2Vzcy5lbnYuUVVBTlRfTExNX0JBU0VfVVJMKTtcbn1cblxuZnVuY3Rpb24gc3RvcmVQYXRoKCk6IHN0cmluZyB7XG4gIHJldHVybiBwYXRoLmpvaW4oYXBwLmdldFBhdGgoJ3VzZXJEYXRhJyksICdsbG0tc2V0dGluZ3MuanNvbicpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVTZXR0aW5ncyhyYXc6IFBhcnRpYWw8TGxtU2V0dGluZ3M+IHwgbnVsbCB8IHVuZGVmaW5lZCk6IExsbVNldHRpbmdzIHtcbiAgcmV0dXJuIHtcbiAgICBlbmFibGVkOiByYXc/LmVuYWJsZWQgPT09IHRydWUgfHwgKHJhdz8uZW5hYmxlZCA9PT0gdW5kZWZpbmVkICYmIGVudkVuYWJsZWQoKSksXG4gICAgYmFzZVVybDpcbiAgICAgIHR5cGVvZiByYXc/LmJhc2VVcmwgPT09ICdzdHJpbmcnICYmIHJhdy5iYXNlVXJsLnRyaW0oKVxuICAgICAgICA/IHJhdy5iYXNlVXJsLnRyaW0oKS5yZXBsYWNlKC9cXC8rJC8sICcnKVxuICAgICAgICA6IERFRkFVTFRfQkFTRV9VUkwsXG4gICAgbW9kZWw6XG4gICAgICB0eXBlb2YgcmF3Py5tb2RlbCA9PT0gJ3N0cmluZycgJiYgcmF3Lm1vZGVsLnRyaW0oKVxuICAgICAgICA/IHJhdy5tb2RlbC50cmltKClcbiAgICAgICAgOiBERUZBVUxUX01PREVMLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGxtU2V0dGluZ3MoKTogTGxtU2V0dGluZ3Mge1xuICB0cnkge1xuICAgIGNvbnN0IHJhdyA9IGZzLnJlYWRGaWxlU3luYyhzdG9yZVBhdGgoKSwgJ3V0ZjgnKTtcbiAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHJhdykgYXMgUGFydGlhbDxMbG1TZXR0aW5ncz47XG4gICAgcmV0dXJuIG5vcm1hbGl6ZVNldHRpbmdzKHBhcnNlZCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBub3JtYWxpemVTZXR0aW5ncyhudWxsKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2F2ZUxsbVNldHRpbmdzKHJhdzogUGFydGlhbDxMbG1TZXR0aW5ncz4pOiBMbG1TZXR0aW5ncyB7XG4gIGNvbnN0IHNldHRpbmdzID0gbm9ybWFsaXplU2V0dGluZ3Moe1xuICAgIGVuYWJsZWQ6IHJhdy5lbmFibGVkID09PSB0cnVlLFxuICAgIGJhc2VVcmw6IHJhdy5iYXNlVXJsLFxuICAgIG1vZGVsOiByYXcubW9kZWwsXG4gIH0pO1xuICBjb25zdCBmaWxlID0gc3RvcmVQYXRoKCk7XG4gIGZzLm1rZGlyU3luYyhwYXRoLmRpcm5hbWUoZmlsZSksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICBmcy53cml0ZUZpbGVTeW5jKGZpbGUsIEpTT04uc3RyaW5naWZ5KHNldHRpbmdzLCBudWxsLCAyKSwgJ3V0ZjgnKTtcbiAgcmV0dXJuIHNldHRpbmdzO1xufVxuIiwgImltcG9ydCB0eXBlIHsgQ2hhcnRSYW5nZSwgTWFjcm9PdmVybGF5S2V5LCBNYWNyb092ZXJsYXlQb2ludCwgTWFjcm9PdmVybGF5U2VyaWVzIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3R5cGVzJztcbmltcG9ydCB7IHNhbXBsZUNoYXJ0IH0gZnJvbSAnLi9zYW1wbGUnO1xuaW1wb3J0IHsgZmV0Y2hUZXh0IH0gZnJvbSAnLi9odHRwJztcbmltcG9ydCB7IGZldGNoWWFob29DaGFydCB9IGZyb20gJy4veWFob28nO1xuXG5jb25zdCBGUkVEX1RUTF9NUyA9IDYgKiA2MCAqIDYwXzAwMDtcbmNvbnN0IE1BUktFVF9UVExfTVMgPSAyICogNjBfMDAwO1xuXG5pbnRlcmZhY2UgTWFjcm9TcGVjIHtcbiAgbGFiZWw6IHN0cmluZztcbiAgdW5pdDogc3RyaW5nO1xuICBmcmVkSWQ6IHN0cmluZztcbn1cblxuY29uc3QgU1BFQ1M6IFJlY29yZDxFeGNsdWRlPE1hY3JvT3ZlcmxheUtleSwgJ3ZpeCcgfCAnb2lsJz4sIE1hY3JvU3BlYz4gPSB7XG4gIGpvYnM6IHtcbiAgICBsYWJlbDogJ1VTIGpvYiBncm93dGgnLFxuICAgIHVuaXQ6ICdtb250aGx5IHBheXJvbGwgY2hhbmdlLCB0aG91c2FuZHMnLFxuICAgIGZyZWRJZDogJ1BBWUVNUycsXG4gIH0sXG4gIHVuZW1wbG95bWVudDoge1xuICAgIGxhYmVsOiAnVVMgdW5lbXBsb3ltZW50JyxcbiAgICB1bml0OiAncGVyY2VudCcsXG4gICAgZnJlZElkOiAnVU5SQVRFJyxcbiAgfSxcbiAgaW5mbGF0aW9uOiB7XG4gICAgbGFiZWw6ICdVUyBpbmZsYXRpb24nLFxuICAgIHVuaXQ6ICdDUEkgeWVhci1vdmVyLXllYXIsIHBlcmNlbnQnLFxuICAgIGZyZWRJZDogJ0NQSUFVQ1NMJyxcbiAgfSxcbiAgdHJlYXN1cnkxMHk6IHtcbiAgICBsYWJlbDogJzEwWSBUcmVhc3VyeSB5aWVsZCcsXG4gICAgdW5pdDogJ3BlcmNlbnQnLFxuICAgIGZyZWRJZDogJ0RHUzEwJyxcbiAgfSxcbn07XG5cbmZ1bmN0aW9uIHJhbmdlU3RhcnRNcyhyYW5nZTogQ2hhcnRSYW5nZSk6IG51bWJlciB7XG4gIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gIGNvbnN0IGRheSA9IDg2XzQwMF8wMDA7XG4gIHN3aXRjaCAocmFuZ2UpIHtcbiAgICBjYXNlICcxZCc6XG4gICAgICByZXR1cm4gbm93IC0gMTQgKiBkYXk7XG4gICAgY2FzZSAnMXcnOlxuICAgICAgcmV0dXJuIG5vdyAtIDM1ICogZGF5O1xuICAgIGNhc2UgJzFtJzpcbiAgICAgIHJldHVybiBub3cgLSA5MCAqIGRheTtcbiAgICBjYXNlICc2bSc6XG4gICAgICByZXR1cm4gbm93IC0gMjQwICogZGF5O1xuICAgIGNhc2UgJzF5JzpcbiAgICAgIHJldHVybiBub3cgLSA1MDAgKiBkYXk7XG4gICAgY2FzZSAnNXknOlxuICAgICAgcmV0dXJuIG5vdyAtIDYgKiAzNjUgKiBkYXk7XG4gICAgY2FzZSAnbWF4JzpcbiAgICAgIHJldHVybiBub3cgLSAyMCAqIDM2NSAqIGRheTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwYXJzZUZyZWRDc3YoY3N2OiBzdHJpbmcpOiBBcnJheTx7IHRpbWU6IG51bWJlcjsgdmFsdWU6IG51bWJlciB9PiB7XG4gIGNvbnN0IHJvd3MgPSBjc3YudHJpbSgpLnNwbGl0KC9cXHI/XFxuLykuc2xpY2UoMSk7XG4gIGNvbnN0IG91dDogQXJyYXk8eyB0aW1lOiBudW1iZXI7IHZhbHVlOiBudW1iZXIgfT4gPSBbXTtcbiAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgIGNvbnN0IFtkYXRlLCByYXdWYWx1ZV0gPSByb3cuc3BsaXQoJywnKTtcbiAgICBjb25zdCB2YWx1ZSA9IE51bWJlcihyYXdWYWx1ZSk7XG4gICAgY29uc3QgbXMgPSBEYXRlLnBhcnNlKGAke2RhdGV9VDEzOjMwOjAwWmApO1xuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKHZhbHVlKSB8fCAhTnVtYmVyLmlzRmluaXRlKG1zKSkgY29udGludWU7XG4gICAgb3V0LnB1c2goeyB0aW1lOiBNYXRoLmZsb29yKG1zIC8gMTAwMCksIHZhbHVlIH0pO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIG1vbnRobHlDaGFuZ2VzKHBvaW50czogQXJyYXk8eyB0aW1lOiBudW1iZXI7IHZhbHVlOiBudW1iZXIgfT4pOiBNYWNyb092ZXJsYXlQb2ludFtdIHtcbiAgY29uc3Qgb3V0OiBNYWNyb092ZXJsYXlQb2ludFtdID0gW107XG4gIGZvciAobGV0IGkgPSAxOyBpIDwgcG9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0LnB1c2goeyB0aW1lOiBwb2ludHNbaV0udGltZSwgdmFsdWU6IE1hdGgucm91bmQoKHBvaW50c1tpXS52YWx1ZSAtIHBvaW50c1tpIC0gMV0udmFsdWUpICogMTApIC8gMTAgfSk7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24geWVhck92ZXJZZWFyUGVyY2VudChwb2ludHM6IEFycmF5PHsgdGltZTogbnVtYmVyOyB2YWx1ZTogbnVtYmVyIH0+KTogTWFjcm9PdmVybGF5UG9pbnRbXSB7XG4gIGNvbnN0IG91dDogTWFjcm9PdmVybGF5UG9pbnRbXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMTI7IGkgPCBwb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBwcmV2ID0gcG9pbnRzW2kgLSAxMl0udmFsdWU7XG4gICAgaWYgKHByZXYgPT09IDApIGNvbnRpbnVlO1xuICAgIG91dC5wdXNoKHtcbiAgICAgIHRpbWU6IHBvaW50c1tpXS50aW1lLFxuICAgICAgdmFsdWU6IE1hdGgucm91bmQoKChwb2ludHNbaV0udmFsdWUgLSBwcmV2KSAvIHByZXYpICogMTBfMDAwKSAvIDEwMCxcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBmYWxsYmFja1NlcmllcyhrZXk6IE1hY3JvT3ZlcmxheUtleSwgcmFuZ2U6IENoYXJ0UmFuZ2UpOiBNYWNyb092ZXJsYXlTZXJpZXMge1xuICBjb25zdCBjaGFydCA9IHNhbXBsZUNoYXJ0KGtleSA9PT0gJ3ZpeCcgPyAnVklYJyA6IGtleSA9PT0gJ29pbCcgPyAnVVNPJyA6ICdTUFknLCByYW5nZSk7XG4gIGNvbnN0IGJhc2UgPVxuICAgIGtleSA9PT0gJ2pvYnMnXG4gICAgICA/IDE3NVxuICAgICAgOiBrZXkgPT09ICd1bmVtcGxveW1lbnQnXG4gICAgICAgID8gNC4xXG4gICAgICAgIDoga2V5ID09PSAnaW5mbGF0aW9uJ1xuICAgICAgICAgID8gMy4yXG4gICAgICAgICAgOiBrZXkgPT09ICd0cmVhc3VyeTEweSdcbiAgICAgICAgICAgID8gNC4xXG4gICAgICAgICAgICA6IGtleSA9PT0gJ29pbCdcbiAgICAgICAgICAgICAgPyA3OFxuICAgICAgICAgICAgICA6IDE4O1xuICBjb25zdCBsYWJlbCA9XG4gICAga2V5ID09PSAnam9icydcbiAgICAgID8gJ1VTIGpvYiBncm93dGgnXG4gICAgICA6IGtleSA9PT0gJ3VuZW1wbG95bWVudCdcbiAgICAgICAgPyAnVVMgdW5lbXBsb3ltZW50J1xuICAgICAgICA6IGtleSA9PT0gJ2luZmxhdGlvbidcbiAgICAgICAgICA/ICdVUyBpbmZsYXRpb24nXG4gICAgICAgICAgOiBrZXkgPT09ICd0cmVhc3VyeTEweSdcbiAgICAgICAgICAgID8gJzEwWSBUcmVhc3VyeSB5aWVsZCdcbiAgICAgICAgICAgIDoga2V5ID09PSAnb2lsJ1xuICAgICAgICAgICAgICA/ICdXVEkgY3J1ZGUgb2lsJ1xuICAgICAgICAgICAgICA6ICdWSVggdm9sYXRpbGl0eSc7XG4gIGNvbnN0IHVuaXQgPVxuICAgIGtleSA9PT0gJ2pvYnMnXG4gICAgICA/ICdtb250aGx5IHBheXJvbGwgY2hhbmdlLCB0aG91c2FuZHMnXG4gICAgICA6IGtleSA9PT0gJ29pbCdcbiAgICAgICAgPyAnVVNEL2JhcnJlbCdcbiAgICAgICAgOiBrZXkgPT09ICd2aXgnXG4gICAgICAgICAgPyAnaW5kZXgnXG4gICAgICAgICAgOiAncGVyY2VudCc7XG4gIHJldHVybiB7XG4gICAga2V5LFxuICAgIGxhYmVsLFxuICAgIHVuaXQsXG4gICAgc291cmNlTmFtZTogJ1NhbXBsZSBEYXRhJyxcbiAgICBzb3VyY2U6ICdzYW1wbGUnLFxuICAgIHBvaW50czogY2hhcnQuY2FuZGxlc1xuICAgICAgLmZpbHRlcigoXywgaSkgPT4gaSAlIE1hdGgubWF4KDEsIE1hdGguZmxvb3IoY2hhcnQuY2FuZGxlcy5sZW5ndGggLyA2MCkpID09PSAwKVxuICAgICAgLm1hcCgoYywgaSkgPT4gKHtcbiAgICAgICAgdGltZTogYy50aW1lLFxuICAgICAgICB2YWx1ZTpcbiAgICAgICAgICBNYXRoLnJvdW5kKFxuICAgICAgICAgICAgKGJhc2UgK1xuICAgICAgICAgICAgICBNYXRoLnNpbihpIC8gNCkgKlxuICAgICAgICAgICAgICAgIChrZXkgPT09ICdqb2JzJyA/IDcwIDoga2V5ID09PSAndml4JyA/IDQgOiBrZXkgPT09ICdvaWwnID8gOCA6IDAuMjUpKSAqXG4gICAgICAgICAgICAgIDEwMCxcbiAgICAgICAgICApIC8gMTAwLFxuICAgICAgfSkpLFxuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRGcmVkT3ZlcmxheShcbiAga2V5OiBFeGNsdWRlPE1hY3JvT3ZlcmxheUtleSwgJ3ZpeCcgfCAnb2lsJz4sXG4gIHJhbmdlOiBDaGFydFJhbmdlLFxuKTogUHJvbWlzZTxNYWNyb092ZXJsYXlTZXJpZXM+IHtcbiAgY29uc3Qgc3BlYyA9IFNQRUNTW2tleV07XG4gIGNvbnN0IHVybCA9IGBodHRwczovL2ZyZWQuc3Rsb3Vpc2ZlZC5vcmcvZ3JhcGgvZnJlZGdyYXBoLmNzdj9pZD0ke2VuY29kZVVSSUNvbXBvbmVudChzcGVjLmZyZWRJZCl9YDtcbiAgY29uc3QgY3N2ID0gYXdhaXQgZmV0Y2hUZXh0KHVybCwgeyB0dGxNczogRlJFRF9UVExfTVMsIHRpbWVvdXRNczogMTJfMDAwIH0pO1xuICBjb25zdCBzdGFydFNlYyA9IE1hdGguZmxvb3IocmFuZ2VTdGFydE1zKHJhbmdlKSAvIDEwMDApO1xuICBjb25zdCBwYXJzZWQgPSBwYXJzZUZyZWRDc3YoY3N2KTtcbiAgY29uc3QgcG9pbnRzID1cbiAgICBrZXkgPT09ICdqb2JzJ1xuICAgICAgPyBtb250aGx5Q2hhbmdlcyhwYXJzZWQpXG4gICAgICA6IGtleSA9PT0gJ2luZmxhdGlvbidcbiAgICAgICAgPyB5ZWFyT3ZlclllYXJQZXJjZW50KHBhcnNlZClcbiAgICAgICAgOiBwYXJzZWQubWFwKChwKSA9PiAoeyB0aW1lOiBwLnRpbWUsIHZhbHVlOiBwLnZhbHVlIH0pKTtcbiAgcmV0dXJuIHtcbiAgICBrZXksXG4gICAgbGFiZWw6IHNwZWMubGFiZWwsXG4gICAgdW5pdDogc3BlYy51bml0LFxuICAgIHNvdXJjZU5hbWU6ICdGUkVEJyxcbiAgICBzb3VyY2U6ICdsaXZlJyxcbiAgICBwb2ludHM6IHBvaW50cy5maWx0ZXIoKHApID0+IHAudGltZSA+PSBzdGFydFNlYyksXG4gIH07XG59XG5cbmZ1bmN0aW9uIHlhaG9vUmFuZ2VGb3IocmFuZ2U6IENoYXJ0UmFuZ2UpOiB7IHlhaG9vUmFuZ2U6IHN0cmluZzsgaW50ZXJ2YWw6IHN0cmluZyB9IHtcbiAgY29uc3QgeWFob29SYW5nZSA9XG4gICAgcmFuZ2UgPT09ICcxdydcbiAgICAgID8gJzVkJ1xuICAgICAgOiByYW5nZSA9PT0gJzFtJ1xuICAgICAgICA/ICcxbW8nXG4gICAgICAgIDogcmFuZ2UgPT09ICdtYXgnXG4gICAgICAgICAgPyAnMTB5J1xuICAgICAgICAgIDogcmFuZ2U7XG4gIGNvbnN0IGludGVydmFsID0gcmFuZ2UgPT09ICcxZCcgPyAnNW0nIDogcmFuZ2UgPT09ICcxdycgPyAnMTVtJyA6IHJhbmdlID09PSAnMW0nID8gJzYwbScgOiAnMWQnO1xuICByZXR1cm4geyB5YWhvb1JhbmdlLCBpbnRlcnZhbCB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRZYWhvb092ZXJsYXkoXG4gIGtleTogRXh0cmFjdDxNYWNyb092ZXJsYXlLZXksICd2aXgnIHwgJ29pbCc+LFxuICByYW5nZTogQ2hhcnRSYW5nZSxcbik6IFByb21pc2U8TWFjcm9PdmVybGF5U2VyaWVzPiB7XG4gIGNvbnN0IHsgeWFob29SYW5nZSwgaW50ZXJ2YWwgfSA9IHlhaG9vUmFuZ2VGb3IocmFuZ2UpO1xuICBjb25zdCByZXN1bHQgPSBhd2FpdCBmZXRjaFlhaG9vQ2hhcnQoa2V5ID09PSAndml4JyA/ICdeVklYJyA6ICdDTD1GJywgeWFob29SYW5nZSwgaW50ZXJ2YWwsIE1BUktFVF9UVExfTVMpO1xuICBjb25zdCBxdW90ZSA9IHJlc3VsdC5pbmRpY2F0b3JzPy5xdW90ZT8uWzBdO1xuICBjb25zdCB0aW1lc3RhbXBzID0gcmVzdWx0LnRpbWVzdGFtcCA/PyBbXTtcbiAgY29uc3QgY2xvc2VzID0gcXVvdGU/LmNsb3NlID8/IFtdO1xuICBjb25zdCBwb2ludHM6IE1hY3JvT3ZlcmxheVBvaW50W10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aW1lc3RhbXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdGltZSA9IHRpbWVzdGFtcHNbaV07XG4gICAgY29uc3QgdmFsdWUgPSBjbG9zZXNbaV07XG4gICAgaWYgKHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmIE51bWJlci5pc0Zpbml0ZSh2YWx1ZSkpIHtcbiAgICAgIHBvaW50cy5wdXNoKHsgdGltZTogTWF0aC5mbG9vcih0aW1lKSwgdmFsdWU6IE1hdGgucm91bmQodmFsdWUgKiAxMDApIC8gMTAwIH0pO1xuICAgIH1cbiAgfVxuICBpZiAocG9pbnRzLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKGAke2tleX0gb3ZlcmxheSByZXR1cm5lZCBubyBwb2ludHNgKTtcbiAgcmV0dXJuIHtcbiAgICBrZXksXG4gICAgbGFiZWw6IGtleSA9PT0gJ3ZpeCcgPyAnVklYIHZvbGF0aWxpdHknIDogJ1dUSSBjcnVkZSBvaWwnLFxuICAgIHVuaXQ6IGtleSA9PT0gJ3ZpeCcgPyAnaW5kZXgnIDogJ1VTRC9iYXJyZWwnLFxuICAgIHNvdXJjZU5hbWU6ICdZYWhvbyBGaW5hbmNlJyxcbiAgICBzb3VyY2U6ICdsaXZlJyxcbiAgICBwb2ludHMsXG4gIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRNYWNyb092ZXJsYXkoXG4gIGtleTogTWFjcm9PdmVybGF5S2V5LFxuICByYW5nZTogQ2hhcnRSYW5nZSxcbik6IFByb21pc2U8TWFjcm9PdmVybGF5U2VyaWVzPiB7XG4gIHRyeSB7XG4gICAgaWYgKGtleSA9PT0gJ3ZpeCcgfHwga2V5ID09PSAnb2lsJykgcmV0dXJuIGF3YWl0IGdldFlhaG9vT3ZlcmxheShrZXksIHJhbmdlKTtcbiAgICByZXR1cm4gYXdhaXQgZ2V0RnJlZE92ZXJsYXkoa2V5LCByYW5nZSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxsYmFja1NlcmllcyhrZXksIHJhbmdlKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IGFwcCB9IGZyb20gJ2VsZWN0cm9uJztcbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgdHlwZSB7XG4gIENoYXJ0UmFuZ2UsXG4gIFF1YW50SW5zaWdodFJlY29yZCxcbiAgUXVhbnRJbnNpZ2h0UmVxdWVzdCxcbiAgUXVhbnRJbnNpZ2h0UmVzcG9uc2UsXG59IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XG5cbmNvbnN0IE1BWF9SRUNPUkRTID0gMjAwO1xuXG5mdW5jdGlvbiBzdG9yZVBhdGgoKTogc3RyaW5nIHtcbiAgcmV0dXJuIHBhdGguam9pbihhcHAuZ2V0UGF0aCgndXNlckRhdGEnKSwgJ3F1YW50LWluc2lnaHRzLmpzb24nKTtcbn1cblxuZnVuY3Rpb24gcmVhZEFsbCgpOiBRdWFudEluc2lnaHRSZWNvcmRbXSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmF3ID0gZnMucmVhZEZpbGVTeW5jKHN0b3JlUGF0aCgpLCAndXRmOCcpO1xuICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UocmF3KSBhcyB1bmtub3duO1xuICAgIGlmICghQXJyYXkuaXNBcnJheShwYXJzZWQpKSByZXR1cm4gW107XG4gICAgcmV0dXJuIHBhcnNlZC5maWx0ZXIoaXNSZWNvcmQpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gW107XG4gIH1cbn1cblxuZnVuY3Rpb24gd3JpdGVBbGwocmVjb3JkczogUXVhbnRJbnNpZ2h0UmVjb3JkW10pOiB2b2lkIHtcbiAgY29uc3QgZmlsZSA9IHN0b3JlUGF0aCgpO1xuICBmcy5ta2RpclN5bmMocGF0aC5kaXJuYW1lKGZpbGUpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgZnMud3JpdGVGaWxlU3luYyhmaWxlLCBKU09OLnN0cmluZ2lmeShyZWNvcmRzLnNsaWNlKDAsIE1BWF9SRUNPUkRTKSwgbnVsbCwgMikpO1xufVxuXG5mdW5jdGlvbiBpc1JlY29yZCh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFF1YW50SW5zaWdodFJlY29yZCB7XG4gIGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xuICBjb25zdCByID0gdmFsdWUgYXMgUGFydGlhbDxRdWFudEluc2lnaHRSZWNvcmQ+O1xuICByZXR1cm4gKFxuICAgIHR5cGVvZiByLmlkID09PSAnc3RyaW5nJyAmJlxuICAgIHR5cGVvZiByLnN5bWJvbCA9PT0gJ3N0cmluZycgJiZcbiAgICB0eXBlb2Ygci5yYW5nZSA9PT0gJ3N0cmluZycgJiZcbiAgICB0eXBlb2Ygci5hbnN3ZXIgPT09ICdzdHJpbmcnICYmXG4gICAgdHlwZW9mIHIuZ2VuZXJhdGVkQXQgPT09ICdzdHJpbmcnXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYXZlUXVhbnRJbnNpZ2h0KFxuICByZXF1ZXN0OiBRdWFudEluc2lnaHRSZXF1ZXN0LFxuICByZXNwb25zZTogUXVhbnRJbnNpZ2h0UmVzcG9uc2UsXG4pOiBRdWFudEluc2lnaHRSZWNvcmQge1xuICBjb25zdCByZWNvcmQ6IFF1YW50SW5zaWdodFJlY29yZCA9IHtcbiAgICAuLi5yZXNwb25zZSxcbiAgICBpZDogYCR7cmVxdWVzdC5zeW1ib2x9LSR7RGF0ZS5ub3coKX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyKX1gLFxuICAgIHN5bWJvbDogcmVxdWVzdC5zeW1ib2wsXG4gICAgcmFuZ2U6IHJlcXVlc3QucmFuZ2UsXG4gICAgcXVlc3Rpb246IHJlcXVlc3QucXVlc3Rpb24sXG4gICAgZGVjaXNpb246IHJlcXVlc3QuZXZhbHVhdGlvbi5kZWNpc2lvbixcbiAgICBzZXR1cFR5cGU6IHJlcXVlc3QuZXZhbHVhdGlvbi5zZXR1cFR5cGUsXG4gICAgY29uZmlkZW5jZTogcmVxdWVzdC5ldmFsdWF0aW9uLmNvbmZpZGVuY2UsXG4gIH07XG4gIGNvbnN0IHJlY29yZHMgPSBbcmVjb3JkLCAuLi5yZWFkQWxsKCldLnNsaWNlKDAsIE1BWF9SRUNPUkRTKTtcbiAgd3JpdGVBbGwocmVjb3Jkcyk7XG4gIHJldHVybiByZWNvcmQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRRdWFudEluc2lnaHRzKHN5bWJvbDogc3RyaW5nLCByYW5nZT86IENoYXJ0UmFuZ2UpOiBRdWFudEluc2lnaHRSZWNvcmRbXSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzeW1ib2wudG9VcHBlckNhc2UoKTtcbiAgcmV0dXJuIHJlYWRBbGwoKVxuICAgIC5maWx0ZXIoKHJlY29yZCkgPT4gcmVjb3JkLnN5bWJvbCA9PT0gbm9ybWFsaXplZCAmJiAoIXJhbmdlIHx8IHJlY29yZC5yYW5nZSA9PT0gcmFuZ2UpKVxuICAgIC5zbGljZSgwLCAyMCk7XG59XG4iLCAiLy8gUlNTIDIuMCBwYXJzaW5nIHNoYXJlZCBieSB0aGUgWWFob28gcGVyLXRpY2tlciBmZWVkIGFuZCBHb29nbGUgTmV3cy5cbi8vIGZhc3QteG1sLXBhcnNlciB3aXRoIGlzQXJyYXkgZm9yIDxpdGVtPiBzbyBzaW5nbGUtaXRlbSBjaGFubmVscyBzdGlsbFxuLy8gY29tZSBiYWNrIGFzIGFycmF5cy4gVGl0bGVzIGFyZSBrZXB0IGFzIHJhdyBzdHJpbmdzIChwYXJzZVRhZ1ZhbHVlIG9mZilcbi8vIHNvIGhlYWRsaW5lcyBsaWtlIFwiM01cIiBkb24ndCBnZXQgY29lcmNlZCB0byBudW1iZXJzLlxuXG5pbXBvcnQgeyBYTUxQYXJzZXIgfSBmcm9tICdmYXN0LXhtbC1wYXJzZXInO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJzc0l0ZW0ge1xuICB0aXRsZTogc3RyaW5nO1xuICBsaW5rOiBzdHJpbmc7XG4gIHB1YkRhdGU/OiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICAvKiogUHVibGlzaGVyIGZyb20gdGhlIDxzb3VyY2U+IHRhZyB3aGVuIHByZXNlbnQgKEdvb2dsZSBOZXdzIGhhcyBpdCkuICovXG4gIHNvdXJjZU5hbWU/OiBzdHJpbmc7XG59XG5cbmNvbnN0IHBhcnNlciA9IG5ldyBYTUxQYXJzZXIoe1xuICBpZ25vcmVBdHRyaWJ1dGVzOiBmYWxzZSxcbiAgaXNBcnJheTogKG5hbWUpID0+IG5hbWUgPT09ICdpdGVtJyxcbiAgcGFyc2VUYWdWYWx1ZTogZmFsc2UsXG4gIHRyaW1WYWx1ZXM6IHRydWUsXG59KTtcblxuZnVuY3Rpb24gdGV4dE9mKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHJldHVybiB2YWx1ZS50cmltKCk7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbiAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICBjb25zdCB0ZXh0ID0gKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVsnI3RleHQnXTtcbiAgICBpZiAodHlwZW9mIHRleHQgPT09ICdzdHJpbmcnKSByZXR1cm4gdGV4dC50cmltKCk7XG4gICAgaWYgKHR5cGVvZiB0ZXh0ID09PSAnbnVtYmVyJykgcmV0dXJuIFN0cmluZyh0ZXh0KTtcbiAgfVxuICByZXR1cm4gJyc7XG59XG5cbi8qKiBQYXJzZSBhbiBSU1MgMi4wIGRvY3VtZW50IGludG8gbm9ybWFsaXplZCBpdGVtcy4gQmFkIFhNTCBcdTIxOTIgW10uICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VSc3NJdGVtcyh4bWw6IHN0cmluZyk6IFJzc0l0ZW1bXSB7XG4gIGxldCBkb2M6IHVua25vd247XG4gIHRyeSB7XG4gICAgZG9jID0gcGFyc2VyLnBhcnNlKHhtbCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBjb25zdCBjaGFubmVsID0gKGRvYyBhcyB7IHJzcz86IHsgY2hhbm5lbD86IHsgaXRlbT86IHVua25vd24gfSB9IH0pLnJzcz8uY2hhbm5lbDtcbiAgY29uc3QgcmF3SXRlbXMgPSBjaGFubmVsPy5pdGVtO1xuICBpZiAoIUFycmF5LmlzQXJyYXkocmF3SXRlbXMpKSByZXR1cm4gW107XG5cbiAgY29uc3Qgb3V0OiBSc3NJdGVtW10gPSBbXTtcbiAgZm9yIChjb25zdCByYXcgb2YgcmF3SXRlbXMpIHtcbiAgICBpZiAoIXJhdyB8fCB0eXBlb2YgcmF3ICE9PSAnb2JqZWN0JykgY29udGludWU7XG4gICAgY29uc3QgaXRlbSA9IHJhdyBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICBjb25zdCB0aXRsZSA9IHRleHRPZihpdGVtLnRpdGxlKTtcbiAgICBjb25zdCBsaW5rID0gdGV4dE9mKGl0ZW0ubGluayk7XG4gICAgaWYgKCF0aXRsZSB8fCAhbGluaykgY29udGludWU7XG4gICAgY29uc3QgcHViRGF0ZSA9IHRleHRPZihpdGVtLnB1YkRhdGUpO1xuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdGV4dE9mKGl0ZW0uZGVzY3JpcHRpb24pO1xuICAgIGNvbnN0IHNvdXJjZU5hbWUgPSB0ZXh0T2YoaXRlbS5zb3VyY2UpO1xuICAgIG91dC5wdXNoKHtcbiAgICAgIHRpdGxlLFxuICAgICAgbGluayxcbiAgICAgIHB1YkRhdGU6IHB1YkRhdGUgfHwgdW5kZWZpbmVkLFxuICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uIHx8IHVuZGVmaW5lZCxcbiAgICAgIHNvdXJjZU5hbWU6IHNvdXJjZU5hbWUgfHwgdW5kZWZpbmVkLFxuICAgIH0pO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG4iLCAiLy8gR29vZ2xlIE5ld3MgUlNTIHNlYXJjaCBcdTIwMTQgdXNlZCBieSBwaXZvdE5ld3MgZm9yIGRhdGUtYm91bmRlZCBxdWVyaWVzIGxpa2Vcbi8vIFwiTlZEQSBzdG9jayBhZnRlcjoyMDI2LTAxLTA1IGJlZm9yZToyMDI2LTAxLTEyXCIuIEl0ZW0gdGl0bGVzIHVzdWFsbHkgZW5kXG4vLyB3aXRoIFwiIC0gUHVibGlzaGVyXCI7IHRoZSA8c291cmNlPiB0YWcgaG9sZHMgdGhlIHB1Ymxpc2hlciBuYW1lLlxuXG5pbXBvcnQgdHlwZSB7IE5ld3NJdGVtIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3R5cGVzJztcbmltcG9ydCB7IGZldGNoVGV4dCB9IGZyb20gJy4vaHR0cCc7XG5pbXBvcnQgeyBwYXJzZVJzc0l0ZW1zIH0gZnJvbSAnLi9yc3MnO1xuaW1wb3J0IHsgaGFzaElkLCBwYXJzZURhdGVNcyB9IGZyb20gJy4vdXRpbCc7XG5cbi8qKiBTdHJpcCBhIHRyYWlsaW5nIFwiIC0gUHVibGlzaGVyXCIgc3VmZml4IHdoZW4gaXQgbWF0Y2hlcyB0aGUgc291cmNlIHRhZy4gKi9cbmZ1bmN0aW9uIGNsZWFuVGl0bGUodGl0bGU6IHN0cmluZywgcHVibGlzaGVyOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBjb25zdCBpZHggPSB0aXRsZS5sYXN0SW5kZXhPZignIC0gJyk7XG4gIGlmIChpZHggPD0gMCkgcmV0dXJuIHRpdGxlO1xuICBjb25zdCBzdWZmaXggPSB0aXRsZS5zbGljZShpZHggKyAzKS50cmltKCk7XG4gIGlmIChwdWJsaXNoZXIgJiYgc3VmZml4LnRvTG93ZXJDYXNlKCkgPT09IHB1Ymxpc2hlci50b0xvd2VyQ2FzZSgpKSB7XG4gICAgcmV0dXJuIHRpdGxlLnNsaWNlKDAsIGlkeCkudHJpbSgpO1xuICB9XG4gIC8vIE5vIHNvdXJjZSB0YWc6IHN0aWxsIHN0cmlwIGEgc2hvcnQgdHJhaWxpbmcgcHVibGlzaGVyLWxvb2tpbmcgc3VmZml4LlxuICBpZiAoIXB1Ymxpc2hlciAmJiBzdWZmaXgubGVuZ3RoIDw9IDQwICYmICFzdWZmaXguaW5jbHVkZXMoJyAtICcpKSB7XG4gICAgcmV0dXJuIHRpdGxlLnNsaWNlKDAsIGlkeCkudHJpbSgpO1xuICB9XG4gIHJldHVybiB0aXRsZTtcbn1cblxuLyoqXG4gKiBTZWFyY2ggR29vZ2xlIE5ld3MgZm9yIGEgc3ltYm9sIHdpdGhpbiBhIFVUQyBkYXRlIHdpbmRvdyAoaW5jbHVzaXZlLWlzaDtcbiAqIEdvb2dsZSB0cmVhdHMgYWZ0ZXI6L2JlZm9yZTogYXMgZGF5IGJvdW5kcykuIENhY2hlZCBieSBVUkwsIHdoaWNoIGVuY29kZXNcbiAqIHN5bWJvbCArIHdpbmRvdywgc28gcmVwZWF0IHBpdm90IGxvb2t1cHMgd2l0aGluIHR0bE1zIGFyZSBmcmVlLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VhcmNoR29vZ2xlTmV3cyhcbiAgc3ltYm9sOiBzdHJpbmcsXG4gIGFmdGVyWW1kOiBzdHJpbmcsXG4gIGJlZm9yZVltZDogc3RyaW5nLFxuICB0dGxNczogbnVtYmVyLFxuKTogUHJvbWlzZTxOZXdzSXRlbVtdPiB7XG4gIGNvbnN0IHF1ZXJ5ID0gYCR7c3ltYm9sfSBzdG9jayBhZnRlcjoke2FmdGVyWW1kfSBiZWZvcmU6JHtiZWZvcmVZbWR9YDtcbiAgY29uc3QgdXJsID1cbiAgICBgaHR0cHM6Ly9uZXdzLmdvb2dsZS5jb20vcnNzL3NlYXJjaD9xPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5KX1gICtcbiAgICBgJmhsPWVuLVVTJmdsPVVTJmNlaWQ9VVM6ZW5gO1xuICBjb25zdCB4bWwgPSBhd2FpdCBmZXRjaFRleHQodXJsLCB7IHR0bE1zIH0pO1xuICBjb25zdCBpdGVtcyA9IHBhcnNlUnNzSXRlbXMoeG1sKTtcblxuICBjb25zdCBvdXQ6IE5ld3NJdGVtW10gPSBbXTtcbiAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgY29uc3QgcHVibGlzaGVkTXMgPSBwYXJzZURhdGVNcyhpdGVtLnB1YkRhdGUpO1xuICAgIGlmIChwdWJsaXNoZWRNcyA9PT0gbnVsbCkgY29udGludWU7IC8vIHVuZGF0ZWQgaXRlbXMgYXJlIHVzZWxlc3MgbmVhciBwaXZvdHNcbiAgICBjb25zdCBwdWJsaXNoZXIgPSBpdGVtLnNvdXJjZU5hbWU7XG4gICAgb3V0LnB1c2goe1xuICAgICAgaWQ6IGBnLSR7aGFzaElkKGAke2l0ZW0ubGlua318JHtpdGVtLnRpdGxlfWApfWAsXG4gICAgICB0aXRsZTogY2xlYW5UaXRsZShpdGVtLnRpdGxlLCBwdWJsaXNoZXIpLFxuICAgICAgdXJsOiBpdGVtLmxpbmssXG4gICAgICBzb3VyY2VOYW1lOiBwdWJsaXNoZXIgfHwgJ0dvb2dsZSBOZXdzJyxcbiAgICAgIHB1Ymxpc2hlZEF0OiBuZXcgRGF0ZShwdWJsaXNoZWRNcykudG9JU09TdHJpbmcoKSxcbiAgICAgIHJlbGF0ZWRTeW1ib2w6IHN5bWJvbCxcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VhcmNoS29yZWFuRmluYW5jZU5ld3MoXG4gIHN5bWJvbDogc3RyaW5nLFxuICB0dGxNczogbnVtYmVyLFxuICBhZnRlclltZD86IHN0cmluZyxcbiAgYmVmb3JlWW1kPzogc3RyaW5nLFxuKTogUHJvbWlzZTxOZXdzSXRlbVtdPiB7XG4gIGNvbnN0IGRhdGVDbGF1c2UgPSBhZnRlclltZCAmJiBiZWZvcmVZbWQgPyBgIGFmdGVyOiR7YWZ0ZXJZbWR9IGJlZm9yZToke2JlZm9yZVltZH1gIDogJyc7XG4gIGNvbnN0IHF1ZXJ5ID0gYHNpdGU6ZmluYW5jZS5uYXZlci5jb20gJHtzeW1ib2x9IFx1QzhGQ1x1QzJERCBPUiBcdUM5OURcdUFEOEMke2RhdGVDbGF1c2V9YDtcbiAgY29uc3QgdXJsID1cbiAgICBgaHR0cHM6Ly9uZXdzLmdvb2dsZS5jb20vcnNzL3NlYXJjaD9xPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5KX1gICtcbiAgICBgJmhsPWtvJmdsPUtSJmNlaWQ9S1I6a29gO1xuICBjb25zdCB4bWwgPSBhd2FpdCBmZXRjaFRleHQodXJsLCB7IHR0bE1zIH0pO1xuICBjb25zdCBpdGVtcyA9IHBhcnNlUnNzSXRlbXMoeG1sKTtcblxuICBjb25zdCBvdXQ6IE5ld3NJdGVtW10gPSBbXTtcbiAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgY29uc3QgcHVibGlzaGVkTXMgPSBwYXJzZURhdGVNcyhpdGVtLnB1YkRhdGUpO1xuICAgIGlmIChwdWJsaXNoZWRNcyA9PT0gbnVsbCkgY29udGludWU7XG4gICAgY29uc3QgcHVibGlzaGVyID0gaXRlbS5zb3VyY2VOYW1lO1xuICAgIG91dC5wdXNoKHtcbiAgICAgIGlkOiBga3ItJHtoYXNoSWQoYCR7aXRlbS5saW5rfXwke2l0ZW0udGl0bGV9YCl9YCxcbiAgICAgIHRpdGxlOiBjbGVhblRpdGxlKGl0ZW0udGl0bGUsIHB1Ymxpc2hlciksXG4gICAgICB1cmw6IGl0ZW0ubGluayxcbiAgICAgIHNvdXJjZU5hbWU6IHB1Ymxpc2hlciA/IGBLUiBcdTAwQjcgJHtwdWJsaXNoZXJ9YCA6ICdLUiBcdTAwQjcgTmF2ZXIgRmluYW5jZScsXG4gICAgICBwdWJsaXNoZWRBdDogbmV3IERhdGUocHVibGlzaGVkTXMpLnRvSVNPU3RyaW5nKCksXG4gICAgICByZWxhdGVkU3ltYm9sOiBzeW1ib2wsXG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cbiIsICIvLyBuZXdzOmdldCBcdTIwMTQgWWFob28gcGVyLXRpY2tlciBSU1MsIGZldGNoZWQgcGVyIHN5bWJvbCAoY29uY3VycmVuY3kgNCxcbi8vIDEwLW1pbnV0ZSBUVEwgcGVyIGZlZWQpLCBkZWR1cGVkIGFjcm9zcyBzeW1ib2xzIGJ5IG5vcm1hbGl6ZWQgdGl0bGUsXG4vLyBzb3J0ZWQgbmV3ZXN0IGZpcnN0LCBjYXBwZWQgYXQgMTAwLiBUb3RhbCBmYWlsdXJlIFx1MjE5MiBkZXRlcm1pbmlzdGljXG4vLyBzYW1wbGUgaXRlbXMgKHNvdXJjZU5hbWUgJ1NhbXBsZSBEYXRhJywgaWRzIHByZWZpeGVkICdzYW1wbGUtJykuXG5cbmltcG9ydCB0eXBlIHsgTmV3c0l0ZW0gfSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xuaW1wb3J0IHsgc2VhcmNoS29yZWFuRmluYW5jZU5ld3MgfSBmcm9tICcuL2dvb2dsZU5ld3MnO1xuaW1wb3J0IHsgZmV0Y2hUZXh0IH0gZnJvbSAnLi9odHRwJztcbmltcG9ydCB7IHBhcnNlUnNzSXRlbXMgfSBmcm9tICcuL3Jzcyc7XG5pbXBvcnQgeyBzYW1wbGVOZXdzIH0gZnJvbSAnLi9zYW1wbGUnO1xuaW1wb3J0IHtcbiAgaGFzaElkLFxuICBub3JtYWxpemVUaXRsZSxcbiAgcGFyc2VEYXRlTXMsXG4gIHBMaW1pdCxcbiAgc3RyaXBIdG1sLFxufSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCBGRUVEX1RUTF9NUyA9IDEwICogNjBfMDAwO1xuY29uc3QgTUFYX1NZTUJPTFMgPSA0MDtcbmNvbnN0IE1BWF9UT1RBTCA9IDEwMDtcbmNvbnN0IGxpbWl0ID0gcExpbWl0KDQpO1xuXG4vKipcbiAqIEZldGNoIGFuZCBtYXAgdGhlIGZ1bGwgWWFob28gUlNTIGZlZWQgZm9yIG9uZSBzeW1ib2wgKHVuY2FwcGVkKS5cbiAqIFNoYXJlZCB3aXRoIHBpdm90TmV3cywgd2hpY2ggZmlsdGVycyBpdGVtcyBpbnRvIHBpdm90IHdpbmRvd3MuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaFN5bWJvbEZlZWQoc3ltYm9sOiBzdHJpbmcpOiBQcm9taXNlPE5ld3NJdGVtW10+IHtcbiAgY29uc3QgdXJsID1cbiAgICBgaHR0cHM6Ly9mZWVkcy5maW5hbmNlLnlhaG9vLmNvbS9yc3MvMi4wL2hlYWRsaW5lYCArXG4gICAgYD9zPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHN5bWJvbCl9JnJlZ2lvbj1VUyZsYW5nPWVuLVVTYDtcbiAgY29uc3QgeG1sID0gYXdhaXQgZmV0Y2hUZXh0KHVybCwgeyB0dGxNczogRkVFRF9UVExfTVMgfSk7XG4gIGNvbnN0IGl0ZW1zID0gcGFyc2VSc3NJdGVtcyh4bWwpO1xuXG4gIGNvbnN0IG91dDogTmV3c0l0ZW1bXSA9IFtdO1xuICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICBjb25zdCBwdWJsaXNoZWRNcyA9IHBhcnNlRGF0ZU1zKGl0ZW0ucHViRGF0ZSk7XG4gICAgY29uc3Qgc3VtbWFyeSA9IGl0ZW0uZGVzY3JpcHRpb24gPyBzdHJpcEh0bWwoaXRlbS5kZXNjcmlwdGlvbikuc2xpY2UoMCwgMzAwKSA6IHVuZGVmaW5lZDtcbiAgICBvdXQucHVzaCh7XG4gICAgICBpZDogYHktJHtoYXNoSWQoYCR7aXRlbS5saW5rfXwke2l0ZW0udGl0bGV9YCl9YCxcbiAgICAgIHRpdGxlOiBpdGVtLnRpdGxlLFxuICAgICAgdXJsOiBpdGVtLmxpbmssXG4gICAgICBzb3VyY2VOYW1lOiBpdGVtLnNvdXJjZU5hbWUgfHwgJ1lhaG9vIEZpbmFuY2UnLFxuICAgICAgcHVibGlzaGVkQXQ6IG5ldyBEYXRlKHB1Ymxpc2hlZE1zID8/IERhdGUubm93KCkpLnRvSVNPU3RyaW5nKCksXG4gICAgICByZWxhdGVkU3ltYm9sOiBzeW1ib2wsXG4gICAgICBzdW1tYXJ5OiBzdW1tYXJ5ICYmIHN1bW1hcnkgIT09IGl0ZW0udGl0bGUgPyBzdW1tYXJ5IDogdW5kZWZpbmVkLFxuICAgIH0pO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXROZXdzKHN5bWJvbHM6IHN0cmluZ1tdLCBsaW1pdFBlclN5bWJvbCA9IDYpOiBQcm9taXNlPE5ld3NJdGVtW10+IHtcbiAgY29uc3QgcmVxdWVzdGVkID0gc3ltYm9scy5zbGljZSgwLCBNQVhfU1lNQk9MUyk7XG4gIGlmIChyZXF1ZXN0ZWQubGVuZ3RoID09PSAwKSByZXR1cm4gW107XG5cbiAgY29uc3QgcGVyU3ltYm9sID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgcmVxdWVzdGVkLm1hcCgoc3ltYm9sKSA9PlxuICAgICAgbGltaXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBbeWFob28sIGtvcmVhbl0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgICAgZmV0Y2hTeW1ib2xGZWVkKHN5bWJvbCkuY2F0Y2goKCkgPT4gW10gYXMgTmV3c0l0ZW1bXSksXG4gICAgICAgICAgc2VhcmNoS29yZWFuRmluYW5jZU5ld3Moc3ltYm9sLCBGRUVEX1RUTF9NUykuY2F0Y2goKCkgPT4gW10gYXMgTmV3c0l0ZW1bXSksXG4gICAgICAgIF0pO1xuICAgICAgICByZXR1cm4gWy4uLnlhaG9vLnNsaWNlKDAsIGxpbWl0UGVyU3ltYm9sKSwgLi4ua29yZWFuLnNsaWNlKDAsIDIpXTtcbiAgICAgIH0pLmNhdGNoKCgpID0+IG51bGwpLFxuICAgICksXG4gICk7XG5cbiAgY29uc3QgYWxsRmFpbGVkID0gcGVyU3ltYm9sLmV2ZXJ5KChyKSA9PiByID09PSBudWxsKTtcbiAgaWYgKGFsbEZhaWxlZCkgcmV0dXJuIHNhbXBsZU5ld3MocmVxdWVzdGVkKTtcblxuICBjb25zdCBzZWVuVGl0bGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IG1lcmdlZDogTmV3c0l0ZW1bXSA9IFtdO1xuICBmb3IgKGNvbnN0IGZlZWQgb2YgcGVyU3ltYm9sKSB7XG4gICAgaWYgKCFmZWVkKSBjb250aW51ZTtcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZmVlZC5zbGljZSgwLCBsaW1pdFBlclN5bWJvbCArIDIpKSB7XG4gICAgICBjb25zdCBrZXkgPSBub3JtYWxpemVUaXRsZShpdGVtLnRpdGxlKTtcbiAgICAgIGlmICgha2V5IHx8IHNlZW5UaXRsZXMuaGFzKGtleSkpIGNvbnRpbnVlO1xuICAgICAgc2VlblRpdGxlcy5hZGQoa2V5KTtcbiAgICAgIG1lcmdlZC5wdXNoKGl0ZW0pO1xuICAgIH1cbiAgfVxuXG4gIG1lcmdlZC5zb3J0KChhLCBiKSA9PiBiLnB1Ymxpc2hlZEF0LmxvY2FsZUNvbXBhcmUoYS5wdWJsaXNoZWRBdCkpO1xuICByZXR1cm4gbWVyZ2VkLnNsaWNlKDAsIE1BWF9UT1RBTCk7XG59XG4iLCAiLy8gY2hhcnQ6cGl2b3QtbmV3cyBcdTIwMTQgZm9yIGVhY2ggZGV0ZWN0ZWQgcGl2b3QsIGZpbmQgZGF0ZWQgYXJ0aWNsZXMgbmVhciB0aGVcbi8vIHBpdm90OiBHb29nbGUgTmV3cyBSU1Mgd2l0aCBhIFx1MDBCMTUgZGF5IHdpbmRvdyBwbHVzIGFueSBZYWhvbyBwZXItdGlja2VyIFJTU1xuLy8gaXRlbXMgdGhhdCBmYWxsIGluc2lkZSB0aGUgd2luZG93LiBEZWR1cGVkIGJ5IHRpdGxlLCBzb3J0ZWQgYnkgZGlzdGFuY2Vcbi8vIHRvIHRoZSBwaXZvdCwgbWF4IDQgcGVyIHBpdm90LiBPbmUgcGl2b3QgZmFpbGluZyBuZXZlciBmYWlscyB0aGUgYmF0Y2gsXG4vLyBhbmQgaW5wdXQgcGl2b3Qgb3JkZXIgaXMgcHJlc2VydmVkLlxuXG5pbXBvcnQgdHlwZSB7IE5ld3NJdGVtLCBQaXZvdE5ld3NSZXN1bHQsIFBpdm90UG9pbnQgfSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xuaW1wb3J0IHsgc2VhcmNoR29vZ2xlTmV3cywgc2VhcmNoS29yZWFuRmluYW5jZU5ld3MgfSBmcm9tICcuL2dvb2dsZU5ld3MnO1xuaW1wb3J0IHsgZmV0Y2hTeW1ib2xGZWVkIH0gZnJvbSAnLi9uZXdzJztcbmltcG9ydCB7IG5vcm1hbGl6ZVRpdGxlLCBwTGltaXQsIHRvWW1kIH0gZnJvbSAnLi91dGlsJztcblxuY29uc3QgV0lORE9XX0RBWVMgPSA1O1xuY29uc3QgREFZX01TID0gODZfNDAwXzAwMDtcbmNvbnN0IEdPT0dMRV9UVExfTVMgPSAzMCAqIDYwXzAwMDsgLy8gcGVyIHN5bWJvbCtwaXZvdC1kYXkgd2luZG93XG5jb25zdCBNQVhfSVRFTVNfUEVSX1BJVk9UID0gNDtcbmNvbnN0IE1BWF9QSVZPVFMgPSAxMjtcbmNvbnN0IGxpbWl0ID0gcExpbWl0KDMpO1xuXG5hc3luYyBmdW5jdGlvbiBuZXdzRm9yUGl2b3QoXG4gIHN5bWJvbDogc3RyaW5nLFxuICBwaXZvdDogUGl2b3RQb2ludCxcbiAgeWFob29JdGVtczogTmV3c0l0ZW1bXSxcbik6IFByb21pc2U8TmV3c0l0ZW1bXT4ge1xuICBjb25zdCBwaXZvdE1zID0gcGl2b3QudGltZSAqIDEwMDA7XG4gIGNvbnN0IHN0YXJ0TXMgPSBwaXZvdE1zIC0gV0lORE9XX0RBWVMgKiBEQVlfTVM7XG4gIGxldCBlbmRNcyA9IHBpdm90TXMgKyBXSU5ET1dfREFZUyAqIERBWV9NUztcbiAgY29uc3Qgbm93TXMgPSBEYXRlLm5vdygpO1xuICBpZiAoZW5kTXMgPiBub3dNcykgZW5kTXMgPSBub3dNczsgLy8gY2xhbXAgJ2JlZm9yZScgdG8gdG9kYXlcbiAgY29uc3QgYWZ0ZXJZbWQgPSB0b1ltZChuZXcgRGF0ZShNYXRoLm1pbihzdGFydE1zLCBlbmRNcyAtIERBWV9NUykpKTtcbiAgY29uc3QgYmVmb3JlWW1kID0gdG9ZbWQobmV3IERhdGUoZW5kTXMpKTtcblxuICBjb25zdCBbZ29vZ2xlLCBrb3JlYW5dID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgIHNlYXJjaEdvb2dsZU5ld3Moc3ltYm9sLCBhZnRlclltZCwgYmVmb3JlWW1kLCBHT09HTEVfVFRMX01TKS5jYXRjaCgoKSA9PiBbXSBhcyBOZXdzSXRlbVtdKSxcbiAgICBzZWFyY2hLb3JlYW5GaW5hbmNlTmV3cyhzeW1ib2wsIEdPT0dMRV9UVExfTVMsIGFmdGVyWW1kLCBiZWZvcmVZbWQpLmNhdGNoKFxuICAgICAgKCkgPT4gW10gYXMgTmV3c0l0ZW1bXSxcbiAgICApLFxuICBdKTtcblxuICBjb25zdCBpbldpbmRvdyA9IChpdGVtOiBOZXdzSXRlbSk6IGJvb2xlYW4gPT4ge1xuICAgIGNvbnN0IG1zID0gRGF0ZS5wYXJzZShpdGVtLnB1Ymxpc2hlZEF0KTtcbiAgICByZXR1cm4gIU51bWJlci5pc05hTihtcykgJiYgbXMgPj0gc3RhcnRNcyAtIERBWV9NUyAmJiBtcyA8PSBlbmRNcyArIERBWV9NUztcbiAgfTtcblxuICBjb25zdCBtZXJnZWQ6IE5ld3NJdGVtW10gPSBbXTtcbiAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IGl0ZW0gb2YgWy4uLmdvb2dsZSwgLi4ua29yZWFuLCAuLi55YWhvb0l0ZW1zLmZpbHRlcihpbldpbmRvdyldKSB7XG4gICAgY29uc3Qga2V5ID0gbm9ybWFsaXplVGl0bGUoaXRlbS50aXRsZSk7XG4gICAgaWYgKCFrZXkgfHwgc2Vlbi5oYXMoa2V5KSkgY29udGludWU7XG4gICAgc2Vlbi5hZGQoa2V5KTtcbiAgICBtZXJnZWQucHVzaChpdGVtKTtcbiAgfVxuXG4gIG1lcmdlZC5zb3J0KFxuICAgIChhLCBiKSA9PlxuICAgICAgTWF0aC5hYnMoRGF0ZS5wYXJzZShhLnB1Ymxpc2hlZEF0KSAtIHBpdm90TXMpIC1cbiAgICAgIE1hdGguYWJzKERhdGUucGFyc2UoYi5wdWJsaXNoZWRBdCkgLSBwaXZvdE1zKSxcbiAgKTtcbiAgcmV0dXJuIG1lcmdlZC5zbGljZSgwLCBNQVhfSVRFTVNfUEVSX1BJVk9UKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFBpdm90TmV3cyhcbiAgc3ltYm9sOiBzdHJpbmcsXG4gIHBpdm90czogUGl2b3RQb2ludFtdLFxuKTogUHJvbWlzZTxQaXZvdE5ld3NSZXN1bHRbXT4ge1xuICBjb25zdCBib3VuZGVkID0gcGl2b3RzLnNsaWNlKDAsIE1BWF9QSVZPVFMpO1xuICBpZiAoYm91bmRlZC5sZW5ndGggPT09IDApIHJldHVybiBbXTtcblxuICAvLyBGZXRjaCB0aGUgc3ltYm9sJ3MgWWFob28gZmVlZCBvbmNlIGZvciB0aGUgd2hvbGUgYmF0Y2g7IGEgZmFpbHVyZSBoZXJlXG4gIC8vIGp1c3QgbWVhbnMgcGl2b3Qgd2luZG93cyByZWx5IG9uIEdvb2dsZSBOZXdzIGFsb25lLlxuICBjb25zdCB5YWhvb0l0ZW1zID0gYXdhaXQgZmV0Y2hTeW1ib2xGZWVkKHN5bWJvbCkuY2F0Y2goKCkgPT4gW10gYXMgTmV3c0l0ZW1bXSk7XG5cbiAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgIGJvdW5kZWQubWFwKChwaXZvdCkgPT5cbiAgICAgIGxpbWl0KCgpID0+IG5ld3NGb3JQaXZvdChzeW1ib2wsIHBpdm90LCB5YWhvb0l0ZW1zKSlcbiAgICAgICAgLmNhdGNoKCgpID0+IFtdIGFzIE5ld3NJdGVtW10pXG4gICAgICAgIC50aGVuKChpdGVtcyk6IFBpdm90TmV3c1Jlc3VsdCA9PiAoeyBwaXZvdCwgaXRlbXMgfSkpLFxuICAgICksXG4gICk7XG4gIHJldHVybiByZXN1bHRzOyAvLyBQcm9taXNlLmFsbCBwcmVzZXJ2ZXMgaW5wdXQgb3JkZXJcbn1cbiIsICJpbXBvcnQgdHlwZSB7IFF1YW50SW5zaWdodFJlcXVlc3QsIFF1YW50SW5zaWdodFJlc3BvbnNlIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3R5cGVzJztcbmltcG9ydCB7IGdldExsbVNldHRpbmdzIH0gZnJvbSAnLi9sbG1TZXR0aW5ncyc7XG5cbmludGVyZmFjZSBDaGF0UmVzcG9uc2Uge1xuICBjaG9pY2VzPzogQXJyYXk8eyBtZXNzYWdlPzogeyBjb250ZW50Pzogc3RyaW5nIH0gfT47XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGlzUmVhZHkoYmFzZVVybDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYCR7YmFzZVVybH0vaGVhbHRoYCwgeyBzaWduYWw6IEFib3J0U2lnbmFsLnRpbWVvdXQoMTUwMCkgfSk7XG4gICAgcmV0dXJuIHJlcy5vaztcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvbXBhY3RSZXF1ZXN0KHJlcTogUXVhbnRJbnNpZ2h0UmVxdWVzdCk6IHN0cmluZyB7XG4gIGNvbnN0IGUgPSByZXEuZXZhbHVhdGlvbjtcbiAgY29uc3QgbmV3cyA9IHJlcS5uZXdzXG4gICAgLnNsaWNlKDAsIDgpXG4gICAgLm1hcCgoaXRlbSkgPT4gYC0gWyR7aXRlbS5yZWxhdGVkU3ltYm9sfV0gJHtpdGVtLnRpdGxlfSAoJHtpdGVtLnNvdXJjZU5hbWV9LCAke2l0ZW0ucHVibGlzaGVkQXR9KWApXG4gICAgLmpvaW4oJ1xcbicpO1xuICBjb25zdCBjb21wb25lbnRzID0gZS5jb21wb25lbnRzXG4gICAgLm1hcCgoYykgPT4gYC0gJHtjLm5hbWV9OiAke2Muc3RhdHVzfSwgJHtjLnNjb3JlID49IDAgPyAnKycgOiAnJ30ke2Muc2NvcmV9LiAke2MuZXhwbGFuYXRpb259YClcbiAgICAuam9pbignXFxuJyk7XG4gIGNvbnN0IGVhcm5pbmdzID0gcmVxLmVhcm5pbmdzXG4gICAgPyBgLSBVcGNvbWluZyBkYXRlOiAke3JlcS5lYXJuaW5ncy5kYXRlfSAke3JlcS5lYXJuaW5ncy50aW1lfVxuLSBBbmFseXN0IGV4cGVjdGVkIEVQUzogJHtyZXEuZWFybmluZ3MuZXBzRXN0aW1hdGUgPz8gJ24vYSd9XG4tIExhdGVzdCBhY3R1YWwgRVBTOiAke3JlcS5lYXJuaW5ncy5lcHNBY3R1YWwgPz8gJ24vYSd9XG4tIExhdGVzdCBzdXJwcmlzZTogJHtyZXEuZWFybmluZ3MuZXBzU3VycHJpc2VQZXJjZW50ID8/ICduL2EnfSVcbi0gTGF0ZXN0IHJlcG9ydGVkIGRhdGU6ICR7cmVxLmVhcm5pbmdzLmxhdGVzdFJlcG9ydGVkRGF0ZSA/PyAnbi9hJ31gXG4gICAgOiAnLSBub25lJztcbiAgY29uc3QgdmFsdWF0aW9uID0gcmVxLnZhbHVhdGlvblxuICAgID8gYC0gUHJpY2U6ICR7cmVxLnZhbHVhdGlvbi5wcmljZSA/PyAnbi9hJ31cbi0gTWFya2V0IGNhcDogJHtyZXEudmFsdWF0aW9uLm1hcmtldENhcCA/PyAnbi9hJ31cbi0gUmV2ZW51ZTogJHtyZXEudmFsdWF0aW9uLnRvdGFsUmV2ZW51ZSA/PyAnbi9hJ31cbi0gR3Jvc3MgcHJvZml0OiAke3JlcS52YWx1YXRpb24uZ3Jvc3NQcm9maXQgPz8gJ24vYSd9XG4tIEVCSVREQTogJHtyZXEudmFsdWF0aW9uLmViaXRkYSA/PyAnbi9hJ31cbi0gTmV0IGluY29tZTogJHtyZXEudmFsdWF0aW9uLm5ldEluY29tZVRvQ29tbW9uID8/ICduL2EnfVxuLSBQcm9maXQgbWFyZ2luOiAke3JlcS52YWx1YXRpb24ucHJvZml0TWFyZ2luID8/ICduL2EnfVxuLSBSZXZlbnVlIGdyb3d0aDogJHtyZXEudmFsdWF0aW9uLnJldmVudWVHcm93dGggPz8gJ24vYSd9XG4tIFAvRTogJHtyZXEudmFsdWF0aW9uLnRyYWlsaW5nUGUgPz8gJ24vYSd9XG4tIEZvcndhcmQgUC9FOiAke3JlcS52YWx1YXRpb24uZm9yd2FyZFBlID8/ICduL2EnfVxuLSBQL1M6ICR7cmVxLnZhbHVhdGlvbi5wcmljZVRvU2FsZXMgPz8gJ24vYSd9XG4tIEVWL1JldmVudWU6ICR7cmVxLnZhbHVhdGlvbi5lbnRlcnByaXNlVG9SZXZlbnVlID8/ICduL2EnfVxuLSBFVi9FQklUREE6ICR7cmVxLnZhbHVhdGlvbi5lbnRlcnByaXNlVG9FYml0ZGEgPz8gJ24vYSd9XG4tIEZvcm11bGEgZXN0aW1hdGVzOlxuJHtyZXEudmFsdWF0aW9uLmVzdGltYXRlcy5tYXAoKHgpID0+IGAgIC0gJHt4LmxhYmVsfTogZmFpciB2YWx1ZSAke3guZmFpclZhbHVlID8/ICduL2EnfSwgdXBzaWRlICR7eC51cHNpZGVQZXJjZW50ID8/ICduL2EnfSUsIGZvcm11bGE6ICR7eC5mb3JtdWxhfWApLmpvaW4oJ1xcbicpfWBcbiAgICA6ICctIG5vbmUnO1xuICBjb25zdCBtYWNybyA9IHJlcS5tYWNyb092ZXJsYXlzPy5sZW5ndGhcbiAgICA/IHJlcS5tYWNyb092ZXJsYXlzXG4gICAgICAgIC5tYXAoKHNlcmllcykgPT4ge1xuICAgICAgICAgIGNvbnN0IGxhc3QgPSBzZXJpZXMucG9pbnRzW3Nlcmllcy5wb2ludHMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgcmV0dXJuIGAtICR7c2VyaWVzLmxhYmVsfTogJHtsYXN0ID8gYCR7bGFzdC52YWx1ZX0gJHtzZXJpZXMudW5pdH1gIDogJ24vYSd9ICgke3Nlcmllcy5zb3VyY2VOYW1lfSlgO1xuICAgICAgICB9KVxuICAgICAgICAuam9pbignXFxuJylcbiAgICA6ICctIG5vIGFjdGl2ZSBtYWNybyBvdmVybGF5cyc7XG4gIHJldHVybiBgXG5TeW1ib2w6ICR7cmVxLnN5bWJvbH1cblJhbmdlOiAke3JlcS5yYW5nZX1cblF1ZXN0aW9uOiAke3JlcS5xdWVzdGlvbiA/PyAnQW5hbHl6ZSB0aGUgY3VycmVudCBzZXR1cCBhbmQgZXhwbGFpbiB0aGUgYmVzdCBkZWNpc2lvbi4nfVxuU25hcHNob3QgY2FwdHVyZWQ6ICR7cmVxLnNuYXBzaG90RGF0YVVybCA/ICd5ZXMnIDogJ25vJ31cblxuU2lnbmFsOlxuLSBEZWNpc2lvbjogJHtlLmRlY2lzaW9ufVxuLSBTZXR1cDogJHtlLnNldHVwVHlwZX1cbi0gUmVnaW1lOiAke2UucmVnaW1lfVxuLSBDb25maWRlbmNlOiAke2UuY29uZmlkZW5jZX0vMTAwXG4tIFJlYXNvbjogJHtlLnJlYXNvbn1cbi0gTm8tdHJhZGUgcmVhc29uczogJHtlLm5vVHJhZGVSZWFzb25zLmpvaW4oJzsgJykgfHwgJ25vbmUnfVxuXG5SaXNrIHBsYW46XG4tIERpcmVjdGlvbjogJHtlLnJpc2suZGlyZWN0aW9ufVxuLSBFbnRyeTogJHtlLnJpc2suZW50cnl9XG4tIFN0b3A6ICR7ZS5yaXNrLnN0b3B9XG4tIFRhcmdldCAxOiAke2Uucmlzay50YXJnZXQxfVxuLSBUYXJnZXQgMjogJHtlLnJpc2sudGFyZ2V0Mn1cbi0gUi9SIHRhcmdldCAxOiAke2Uucmlzay5yZXdhcmRSaXNrMX1cbi0gUG9zaXRpb24gc2l6ZTogJHtlLnJpc2sucG9zaXRpb25TaXplfVxuLSBNYXggbG9zczogJHtlLnJpc2subWF4RG9sbGFyTG9zc31cblxuQW5hbHl0aWNzOlxuLSBMYXN0IGNsb3NlOiAke2UuYW5hbHl0aWNzLmxhc3RDbG9zZX1cbi0gQ2hhbmdlOiAke2UuYW5hbHl0aWNzLmNoYW5nZVBlcmNlbnR9JVxuLSBTTUEyMDogJHtlLmFuYWx5dGljcy5zbWEyMCA/PyAnbi9hJ31cbi0gU01BNTA6ICR7ZS5hbmFseXRpY3Muc21hNTAgPz8gJ24vYSd9XG4tIEFUUjE0OiAke2UuYW5hbHl0aWNzLmF0cjE0ID8/ICduL2EnfSAoJHtlLmFuYWx5dGljcy5hdHJQZXJjZW50ID8/ICduL2EnfSUpXG4tIFZvbHVtZSByYXRpbzogJHtlLmFuYWx5dGljcy52b2x1bWVSYXRpbyA/PyAnbi9hJ31cbi0gU3VwcG9ydDogJHtlLmFuYWx5dGljcy5zdXBwb3J0ID8/ICduL2EnfVxuLSBSZXNpc3RhbmNlOiAke2UuYW5hbHl0aWNzLnJlc2lzdGFuY2UgPz8gJ24vYSd9XG5cbkJhY2t0ZXN0IHN1bW1hcnk6XG4tIFN0cmF0ZWd5OiAke2UuYmFja3Rlc3Quc3RyYXRlZ3lOYW1lfSAke2UuYmFja3Rlc3Quc3RyYXRlZ3lWZXJzaW9ufVxuLSBUcmFkZXM6ICR7ZS5iYWNrdGVzdC50b3RhbFRyYWRlc31cbi0gV2luIHJhdGU6ICR7ZS5iYWNrdGVzdC53aW5SYXRlfSVcbi0gRXhwZWN0YW5jeTogJHtlLmJhY2t0ZXN0LmV4cGVjdGFuY3l9UlxuLSBQcm9maXQgZmFjdG9yOiAke2UuYmFja3Rlc3QucHJvZml0RmFjdG9yfVxuLSBNYXggZHJhd2Rvd246ICR7ZS5iYWNrdGVzdC5tYXhEcmF3ZG93bn1SXG5cbkNvbXBvbmVudHM6XG4ke2NvbXBvbmVudHN9XG5cbkVhcm5pbmdzIGNvbnRleHQ6XG4ke2Vhcm5pbmdzfVxuXG5WYWx1YXRpb24gY29udGV4dDpcbiR7dmFsdWF0aW9ufVxuXG5NYWNybyBvdmVybGF5cyBhY3RpdmUgb24gY2hhcnQ6XG4ke21hY3JvfVxuXG5SZWNlbnQgc2NyYXBlZCBuZXdzOlxuJHtuZXdzIHx8ICctIG5vbmUnfVxuYC50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGRldGVybWluaXN0aWNGYWxsYmFjayhyZXE6IFF1YW50SW5zaWdodFJlcXVlc3QsIGVycm9yPzogc3RyaW5nKTogUXVhbnRJbnNpZ2h0UmVzcG9uc2Uge1xuICBjb25zdCBlID0gcmVxLmV2YWx1YXRpb247XG4gIGNvbnN0IGxpbmVzID0gW1xuICAgIGAjIyMgUXVhbnQgbWVtbzogJHtlLmRlY2lzaW9uLnJlcGxhY2VBbGwoJy0nLCAnICcpfWAsXG4gICAgYGAsXG4gICAgYC0gKipTZXR1cDoqKiAke2Uuc2V0dXBUeXBlLnJlcGxhY2VBbGwoJy0nLCAnICcpfWAsXG4gICAgYC0gKipSZWdpbWU6KiogJHtlLnJlZ2ltZS5yZXBsYWNlQWxsKCctJywgJyAnKX1gLFxuICAgIGAtICoqQ29uZmlkZW5jZToqKiAke2UuY29uZmlkZW5jZX0vMTAwYCxcbiAgICBgLSAqKlJpc2sgcGxhbjoqKiBlbnRyeSBcXGAke2Uucmlzay5lbnRyeX1cXGAsIHN0b3AgXFxgJHtlLnJpc2suc3RvcH1cXGAsIHRhcmdldCAxIFxcYCR7ZS5yaXNrLnRhcmdldDF9XFxgLCB0YXJnZXQgMiBcXGAke2Uucmlzay50YXJnZXQyfVxcYGAsXG4gICAgYC0gKipQb3NpdGlvbjoqKiAke2Uucmlzay5wb3NpdGlvblNpemV9IHVuaXRzLCBtYXggbG9zcyBcXGAke2Uucmlzay5tYXhEb2xsYXJMb3NzfVxcYCwgdGFyZ2V0IDEgcmV3YXJkIFxcYCR7ZS5yaXNrLnJld2FyZFJpc2sxfVJcXGBgLFxuICBdO1xuICBpZiAoZS5ub1RyYWRlUmVhc29ucy5sZW5ndGgpIHtcbiAgICBsaW5lcy5wdXNoKGAtICoqUHJpbWFyeSBibG9ja2VyOioqICR7ZS5ub1RyYWRlUmVhc29uc1swXX1gKTtcbiAgfSBlbHNlIHtcbiAgICBsaW5lcy5wdXNoKGAtICoqQWN0aW9uOioqICR7ZS5yZWFzb259YCk7XG4gIH1cbiAgY29uc3Qgc3Ryb25nZXN0ID0gWy4uLmUuY29tcG9uZW50c10uc29ydCgoYSwgYikgPT4gYi5zY29yZSAtIGEuc2NvcmUpWzBdO1xuICBjb25zdCB3ZWFrZXN0ID0gWy4uLmUuY29tcG9uZW50c10uc29ydCgoYSwgYikgPT4gYS5zY29yZSAtIGIuc2NvcmUpWzBdO1xuICBpZiAoc3Ryb25nZXN0KSBsaW5lcy5wdXNoKGAtICoqQmVzdCBldmlkZW5jZToqKiAke3N0cm9uZ2VzdC5uYW1lfSAtICR7c3Ryb25nZXN0LmV4cGxhbmF0aW9ufWApO1xuICBpZiAod2Vha2VzdCAmJiB3ZWFrZXN0LnNjb3JlIDwgMCkgbGluZXMucHVzaChgLSAqKlJpc2sgZXZpZGVuY2U6KiogJHt3ZWFrZXN0Lm5hbWV9IC0gJHt3ZWFrZXN0LmV4cGxhbmF0aW9ufWApO1xuICBpZiAoZXJyb3IpIGxpbmVzLnB1c2goYFxcbl9Mb2NhbCBMTE0gbm90ZTogJHtlcnJvcn1fYCk7XG4gIHJldHVybiB7XG4gICAgb2s6IGZhbHNlLFxuICAgIHNvdXJjZTogJ2RldGVybWluaXN0aWMtZmFsbGJhY2snLFxuICAgIGFuc3dlcjogbGluZXMuam9pbignXFxuJyksXG4gICAgZ2VuZXJhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICBlcnJvcixcbiAgfTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFuYWx5emVRdWFudChyZXE6IFF1YW50SW5zaWdodFJlcXVlc3QpOiBQcm9taXNlPFF1YW50SW5zaWdodFJlc3BvbnNlPiB7XG4gIGNvbnN0IHNldHRpbmdzID0gZ2V0TGxtU2V0dGluZ3MoKTtcbiAgaWYgKCFzZXR0aW5ncy5lbmFibGVkKSB7XG4gICAgcmV0dXJuIGRldGVybWluaXN0aWNGYWxsYmFjayhcbiAgICAgIHJlcSxcbiAgICAgICdMb2NhbCBMTE0gaXMgZGlzYWJsZWQuIEVuYWJsZSBpdCBpbiBvbmJvYXJkaW5nIG9yIHNldCBRVUFOVF9MTE1fRU5BQkxFRD0xIGFuZCBRVUFOVF9MTE1fQkFTRV9VUkwgdG8gdXNlIGFuIE9wZW5BSS1jb21wYXRpYmxlIGxvY2FsIHNlcnZlci4nLFxuICAgICk7XG4gIH1cblxuICB0cnkge1xuICAgIGlmICghKGF3YWl0IGlzUmVhZHkoc2V0dGluZ3MuYmFzZVVybCkpKSB7XG4gICAgICByZXR1cm4gZGV0ZXJtaW5pc3RpY0ZhbGxiYWNrKHJlcSwgJ0xvY2FsIExMTSBzZXJ2ZXIgaXMgbm90IHJlYWR5LicpO1xuICAgIH1cblxuICAgIGNvbnN0IHByb21wdCA9IGNvbXBhY3RSZXF1ZXN0KHJlcSk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYCR7c2V0dGluZ3MuYmFzZVVybH0vdjEvY2hhdC9jb21wbGV0aW9uc2AsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBzaWduYWw6IEFib3J0U2lnbmFsLnRpbWVvdXQoMjhfMDAwKSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgbW9kZWw6IHNldHRpbmdzLm1vZGVsLFxuICAgICAgICB0ZW1wZXJhdHVyZTogMC4yLFxuICAgICAgICBtYXhfdG9rZW5zOiA3MDAsXG4gICAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcm9sZTogJ3N5c3RlbScsXG4gICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAnWW91IGFyZSBRdWFudERlc2ssIGEgc3RyaWN0IHBlcnNvbmFsIHF1YW50IHRyYWRpbmcgYXNzaXN0YW50IGZvciB0aGUgUXVhbnQgYXBwLiBUaGluayBsaWtlIGEgc2VuaW9yIHF1YW50IHRyYWRlciBhbmQgcmlzayBtYW5hZ2VyLiBFeHBsYWluIHNpZ25hbHMgaW4gZGlzY2lwbGluZWQgdHJhZGluZyBsYW5ndWFnZS4gU2VwYXJhdGUgc2V0dXAsIGV2aWRlbmNlLCBpbnZhbGlkYXRpb24sIHJpc2ssIGFuZCBhY3Rpb24uIERvIG5vdCBnaXZlIGNlcnRhaW50eSwgZG8gbm90IGh5cGUsIGRvIG5vdCByZWNvbW1lbmQgb3ZlcnNpemVkIHRyYWRlcywgYW5kIGRvIG5vdCBpZ25vcmUgbm8tdHJhZGUgYmxvY2tlcnMuIFJldHVybiBjb25jaXNlIEdpdEh1Yi1mbGF2b3JlZCBNYXJrZG93biB3aXRoIGhlYWRpbmdzLCBidWxsZXRzLCBib2xkIGxhYmVscywgYW5kIGlubGluZSBjb2RlIGZvciBleGFjdCBwcmljZXMuJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJvbGU6ICd1c2VyJyxcbiAgICAgICAgICAgIGNvbnRlbnQ6IHJlcS50aGlua2luZ01vZGVcbiAgICAgICAgICAgICAgPyBgVXNlIHRoaW5raW5nIG1vZGUgaW50ZXJuYWxseSwgdGhlbiBwcm92aWRlIG9ubHkgdGhlIGNvbmNpc2UgZmluYWwgZGVjaXNpb24gbWVtby5cXG5cXG4ke3Byb21wdH1gXG4gICAgICAgICAgICAgIDogcHJvbXB0LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KSxcbiAgICB9KTtcbiAgICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IEVycm9yKGBMTE0gSFRUUCAke3Jlcy5zdGF0dXN9YCk7XG4gICAgY29uc3QganNvbiA9IChhd2FpdCByZXMuanNvbigpKSBhcyBDaGF0UmVzcG9uc2U7XG4gICAgY29uc3QgYW5zd2VyID0ganNvbi5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQ/LnRyaW0oKTtcbiAgICBpZiAoIWFuc3dlcikgdGhyb3cgbmV3IEVycm9yKCdMTE0gcmV0dXJuZWQgYW4gZW1wdHkgYW5zd2VyJyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiB0cnVlLFxuICAgICAgc291cmNlOiAnbG9jYWwtbGxtJyxcbiAgICAgIG1vZGVsOiBzZXR0aW5ncy5tb2RlbCxcbiAgICAgIGFuc3dlcixcbiAgICAgIGdlbmVyYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiAnTG9jYWwgTExNIHJlcXVlc3QgZmFpbGVkLic7XG4gICAgcmV0dXJuIGRldGVybWluaXN0aWNGYWxsYmFjayhyZXEsIG1lc3NhZ2UpO1xuICB9XG59XG4iLCAiLy8gcXVvdGVzOmdldCBcdTIwMTQgbGl2ZSBxdW90ZXMgZGVyaXZlZCBmcm9tIHRoZSB2OCBjaGFydCBlbmRwb2ludCAoMWQvNW0pLFxuLy8gd2hpY2ggbmVlZHMgbm8gYXV0aC4gT25lIFF1b3RlIGlzIGFsd2F5cyByZXR1cm5lZCBwZXIgcmVxdWVzdGVkIHN5bWJvbDtcbi8vIHBlci1zeW1ib2wgZmFpbHVyZXMgZmFsbCBiYWNrIHRvIGRldGVybWluaXN0aWMgc2FtcGxlIHF1b3Rlcy5cblxuaW1wb3J0IHR5cGUgeyBRdW90ZSB9IGZyb20gJy4uLy4uL3NoYXJlZC90eXBlcyc7XG5pbXBvcnQgeyBzYW1wbGVRdW90ZSB9IGZyb20gJy4vc2FtcGxlJztcbmltcG9ydCB7IHBMaW1pdCwgcm91bmQyIH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7IGZldGNoWWFob29DaGFydCB9IGZyb20gJy4veWFob28nO1xuXG5jb25zdCBRVU9URV9UVExfTVMgPSA0NV8wMDA7XG5jb25zdCBsaW1pdCA9IHBMaW1pdCg0KTtcblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hRdW90ZShzeW1ib2w6IHN0cmluZyk6IFByb21pc2U8UXVvdGU+IHtcbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZmV0Y2hZYWhvb0NoYXJ0KHN5bWJvbCwgJzFkJywgJzVtJywgUVVPVEVfVFRMX01TKTtcbiAgY29uc3QgbWV0YSA9IHJlc3VsdC5tZXRhID8/IHt9O1xuXG4gIGNvbnN0IHByaWNlID1cbiAgICB0eXBlb2YgbWV0YS5yZWd1bGFyTWFya2V0UHJpY2UgPT09ICdudW1iZXInICYmIE51bWJlci5pc0Zpbml0ZShtZXRhLnJlZ3VsYXJNYXJrZXRQcmljZSlcbiAgICAgID8gbWV0YS5yZWd1bGFyTWFya2V0UHJpY2VcbiAgICAgIDogbnVsbDtcbiAgY29uc3QgcHJldlJhdyA9IG1ldGEuY2hhcnRQcmV2aW91c0Nsb3NlID8/IG1ldGEucHJldmlvdXNDbG9zZTtcbiAgY29uc3QgcHJldmlvdXNDbG9zZSA9XG4gICAgdHlwZW9mIHByZXZSYXcgPT09ICdudW1iZXInICYmIE51bWJlci5pc0Zpbml0ZShwcmV2UmF3KSA/IHByZXZSYXcgOiBudWxsO1xuXG4gIGxldCBjaGFuZ2U6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBsZXQgY2hhbmdlUGVyY2VudDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIGlmIChwcmljZSAhPT0gbnVsbCAmJiBwcmV2aW91c0Nsb3NlICE9PSBudWxsKSB7XG4gICAgY2hhbmdlID0gcm91bmQyKHByaWNlIC0gcHJldmlvdXNDbG9zZSk7XG4gICAgY2hhbmdlUGVyY2VudCA9IHByZXZpb3VzQ2xvc2UgIT09IDAgPyByb3VuZDIoKGNoYW5nZSAvIHByZXZpb3VzQ2xvc2UpICogMTAwKSA6IG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN5bWJvbCxcbiAgICBwcmljZSxcbiAgICBjaGFuZ2UsXG4gICAgY2hhbmdlUGVyY2VudCxcbiAgICBwcmV2aW91c0Nsb3NlLFxuICAgIGN1cnJlbmN5OiB0eXBlb2YgbWV0YS5jdXJyZW5jeSA9PT0gJ3N0cmluZycgJiYgbWV0YS5jdXJyZW5jeSA/IG1ldGEuY3VycmVuY3kgOiAnVVNEJyxcbiAgICBtYXJrZXRTdGF0ZTpcbiAgICAgIHR5cGVvZiBtZXRhLm1hcmtldFN0YXRlID09PSAnc3RyaW5nJyAmJiBtZXRhLm1hcmtldFN0YXRlID8gbWV0YS5tYXJrZXRTdGF0ZSA6IHVuZGVmaW5lZCxcbiAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICBzb3VyY2U6ICdsaXZlJyxcbiAgfTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFF1b3RlcyhzeW1ib2xzOiBzdHJpbmdbXSk6IFByb21pc2U8UXVvdGVbXT4ge1xuICByZXR1cm4gUHJvbWlzZS5hbGwoXG4gICAgc3ltYm9scy5tYXAoKHN5bWJvbCkgPT5cbiAgICAgIGxpbWl0KCgpID0+IGZldGNoUXVvdGUoc3ltYm9sKSkuY2F0Y2goKCkgPT4gc2FtcGxlUXVvdGUoc3ltYm9sKSksXG4gICAgKSxcbiAgKTtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IFZhbHVhdGlvblNuYXBzaG90IH0gZnJvbSAnLi4vLi4vc2hhcmVkL3R5cGVzJztcbmltcG9ydCB7IFR0bENhY2hlIH0gZnJvbSAnLi9jYWNoZSc7XG5pbXBvcnQgeyBsb29rdXBOYW1lIH0gZnJvbSAnLi9kYXRhRmlsZXMnO1xuaW1wb3J0IHsgYmFzZVByaWNlRm9yIH0gZnJvbSAnLi9zYW1wbGUnO1xuaW1wb3J0IHsgcXVvdGVTdW1tYXJ5LCByYXdOdW1iZXIgfSBmcm9tICcuL3lhaG9vJztcblxuY29uc3QgVFRMX01TID0gNiAqIDYwICogNjBfMDAwO1xuY29uc3QgY2FjaGUgPSBuZXcgVHRsQ2FjaGU8VmFsdWF0aW9uU25hcHNob3Q+KDMwMCk7XG5cbmZ1bmN0aW9uIHJvdW5kKHZhbHVlOiBudW1iZXIgfCBudWxsLCBkaWdpdHMgPSAyKTogbnVtYmVyIHwgbnVsbCB7XG4gIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCAhTnVtYmVyLmlzRmluaXRlKHZhbHVlKSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHNjYWxlID0gMTAgKiogZGlnaXRzO1xuICByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSAqIHNjYWxlKSAvIHNjYWxlO1xufVxuXG5mdW5jdGlvbiBwY3QoZmFpclZhbHVlOiBudW1iZXIgfCBudWxsLCBwcmljZTogbnVtYmVyIHwgbnVsbCk6IG51bWJlciB8IG51bGwge1xuICBpZiAoZmFpclZhbHVlID09PSBudWxsIHx8IHByaWNlID09PSBudWxsIHx8IHByaWNlID09PSAwKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHJvdW5kKCgoZmFpclZhbHVlIC0gcHJpY2UpIC8gcHJpY2UpICogMTAwLCAxKTtcbn1cblxuZnVuY3Rpb24gZXN0aW1hdGUoXG4gIGxhYmVsOiBzdHJpbmcsXG4gIGZhaXJWYWx1ZTogbnVtYmVyIHwgbnVsbCxcbiAgcHJpY2U6IG51bWJlciB8IG51bGwsXG4gIGZvcm11bGE6IHN0cmluZyxcbik6IFZhbHVhdGlvblNuYXBzaG90Wydlc3RpbWF0ZXMnXVtudW1iZXJdIHtcbiAgcmV0dXJuIHtcbiAgICBsYWJlbCxcbiAgICBmYWlyVmFsdWU6IHJvdW5kKGZhaXJWYWx1ZSksXG4gICAgdXBzaWRlUGVyY2VudDogcGN0KGZhaXJWYWx1ZSwgcHJpY2UpLFxuICAgIGZvcm11bGEsXG4gIH07XG59XG5cbmZ1bmN0aW9uIHNhbXBsZVZhbHVhdGlvbihzeW1ib2w6IHN0cmluZyk6IFZhbHVhdGlvblNuYXBzaG90IHtcbiAgY29uc3Qgc3ltID0gc3ltYm9sLnRvVXBwZXJDYXNlKCk7XG4gIGNvbnN0IHByaWNlID0gYmFzZVByaWNlRm9yKHN5bSk7XG4gIGNvbnN0IHJldmVudWUgPSBwcmljZSAqIDFfMDAwXzAwMF8wMDA7XG4gIGNvbnN0IG1hcmdpbiA9IDAuMTg7XG4gIGNvbnN0IHNoYXJlcyA9IDFfMDAwXzAwMF8wMDA7XG4gIGNvbnN0IG5ldEluY29tZSA9IHJldmVudWUgKiBtYXJnaW47XG4gIGNvbnN0IGZhaXJFYXJuaW5ncyA9IChuZXRJbmNvbWUgKiAyNCkgLyBzaGFyZXM7XG4gIGNvbnN0IGZhaXJTYWxlcyA9IChyZXZlbnVlICogNSkgLyBzaGFyZXM7XG4gIHJldHVybiB7XG4gICAgc3ltYm9sOiBzeW0sXG4gICAgY29tcGFueU5hbWU6IGxvb2t1cE5hbWUoc3ltKSA/PyBzeW0sXG4gICAgcHJpY2UsXG4gICAgbWFya2V0Q2FwOiBwcmljZSAqIHNoYXJlcyxcbiAgICBlbnRlcnByaXNlVmFsdWU6IHByaWNlICogc2hhcmVzICogMS4wNSxcbiAgICB0b3RhbFJldmVudWU6IHJldmVudWUsXG4gICAgZ3Jvc3NQcm9maXQ6IHJldmVudWUgKiAwLjUyLFxuICAgIGViaXRkYTogcmV2ZW51ZSAqIDAuMjUsXG4gICAgbmV0SW5jb21lVG9Db21tb246IG5ldEluY29tZSxcbiAgICBwcm9maXRNYXJnaW46IG1hcmdpbixcbiAgICByZXZlbnVlR3Jvd3RoOiAwLjA4LFxuICAgIHRyYWlsaW5nUGU6IDI0LFxuICAgIGZvcndhcmRQZTogMjEsXG4gICAgcHJpY2VUb1NhbGVzOiA1LFxuICAgIHByaWNlVG9Cb29rOiA3LFxuICAgIGVudGVycHJpc2VUb1JldmVudWU6IDUuMixcbiAgICBlbnRlcnByaXNlVG9FYml0ZGE6IDE4LFxuICAgIGZvcndhcmRFcHM6IHByaWNlIC8gMjEsXG4gICAgdGFyZ2V0TWVhblByaWNlOiBwcmljZSAqIDEuMDgsXG4gICAgc2hhcmVzT3V0c3RhbmRpbmc6IHNoYXJlcyxcbiAgICBlc3RpbWF0ZXM6IFtcbiAgICAgIGVzdGltYXRlKCdGb3J3YXJkIGVhcm5pbmdzIHZhbHVlJywgZmFpckVhcm5pbmdzLCBwcmljZSwgJ25ldCBpbmNvbWUgeCAyNCBQL0UgLyBzaGFyZXMgb3V0c3RhbmRpbmcnKSxcbiAgICAgIGVzdGltYXRlKCdTYWxlcyBtdWx0aXBsZSB2YWx1ZScsIGZhaXJTYWxlcywgcHJpY2UsICdyZXZlbnVlIHggNSBQL1MgLyBzaGFyZXMgb3V0c3RhbmRpbmcnKSxcbiAgICAgIGVzdGltYXRlKCdBbmFseXN0IHRhcmdldCB2YWx1ZScsIHByaWNlICogMS4wOCwgcHJpY2UsICdZYWhvbyBhbmFseXN0IG1lYW4gdGFyZ2V0IHByaWNlJyksXG4gICAgXSxcbiAgICBzb3VyY2U6ICdzYW1wbGUnLFxuICB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0VmFsdWF0aW9uKHN5bWJvbDogc3RyaW5nKTogUHJvbWlzZTxWYWx1YXRpb25TbmFwc2hvdD4ge1xuICBjb25zdCBzeW0gPSBzeW1ib2wudG9VcHBlckNhc2UoKTtcbiAgY29uc3QgY2FjaGVkID0gY2FjaGUuZ2V0KHN5bSk7XG4gIGlmIChjYWNoZWQpIHJldHVybiBjYWNoZWQ7XG4gIHRyeSB7XG4gICAgY29uc3Qgc3VtbWFyeSA9IGF3YWl0IHF1b3RlU3VtbWFyeShzeW0sIFtcbiAgICAgICdwcmljZScsXG4gICAgICAnc3VtbWFyeURldGFpbCcsXG4gICAgICAnZGVmYXVsdEtleVN0YXRpc3RpY3MnLFxuICAgICAgJ2ZpbmFuY2lhbERhdGEnLFxuICAgIF0pO1xuICAgIGNvbnN0IHByaWNlID1cbiAgICAgIHJhd051bWJlcihzdW1tYXJ5LnByaWNlPy5yZWd1bGFyTWFya2V0UHJpY2UpID8/XG4gICAgICByYXdOdW1iZXIoc3VtbWFyeS5maW5hbmNpYWxEYXRhPy50YXJnZXRNZWFuUHJpY2UpID8/XG4gICAgICBudWxsO1xuICAgIGNvbnN0IG1hcmtldENhcCA9IHJhd051bWJlcihzdW1tYXJ5LnByaWNlPy5tYXJrZXRDYXApO1xuICAgIGNvbnN0IHNoYXJlcyA9IHJhd051bWJlcihzdW1tYXJ5LmRlZmF1bHRLZXlTdGF0aXN0aWNzPy5zaGFyZXNPdXRzdGFuZGluZyk7XG4gICAgY29uc3QgcmV2ZW51ZSA9IHJhd051bWJlcihzdW1tYXJ5LmZpbmFuY2lhbERhdGE/LnRvdGFsUmV2ZW51ZSk7XG4gICAgY29uc3QgbmV0SW5jb21lID0gcmF3TnVtYmVyKHN1bW1hcnkuZmluYW5jaWFsRGF0YT8ubmV0SW5jb21lVG9Db21tb24pO1xuICAgIGNvbnN0IHByaWNlVG9TYWxlcyA9IHJhd051bWJlcihzdW1tYXJ5LnN1bW1hcnlEZXRhaWw/LnByaWNlVG9TYWxlc1RyYWlsaW5nMTJNb250aHMpO1xuICAgIGNvbnN0IHRyYWlsaW5nUGUgPSByYXdOdW1iZXIoc3VtbWFyeS5zdW1tYXJ5RGV0YWlsPy50cmFpbGluZ1BFKTtcbiAgICBjb25zdCB0YXJnZXRNZWFuID0gcmF3TnVtYmVyKHN1bW1hcnkuZmluYW5jaWFsRGF0YT8udGFyZ2V0TWVhblByaWNlKTtcblxuICAgIGNvbnN0IGZhaXJGb3J3YXJkRWFybmluZ3MgPVxuICAgICAgbmV0SW5jb21lICE9PSBudWxsICYmIHNoYXJlcyAhPT0gbnVsbCAmJiB0cmFpbGluZ1BlICE9PSBudWxsICYmIHNoYXJlcyA+IDBcbiAgICAgICAgPyAobmV0SW5jb21lICogdHJhaWxpbmdQZSkgLyBzaGFyZXNcbiAgICAgICAgOiBudWxsO1xuICAgIGNvbnN0IGZhaXJTYWxlcyA9XG4gICAgICByZXZlbnVlICE9PSBudWxsICYmIHNoYXJlcyAhPT0gbnVsbCAmJiBwcmljZVRvU2FsZXMgIT09IG51bGwgJiYgc2hhcmVzID4gMFxuICAgICAgICA/IChyZXZlbnVlICogcHJpY2VUb1NhbGVzKSAvIHNoYXJlc1xuICAgICAgICA6IG51bGw7XG5cbiAgICBjb25zdCBzbmFwc2hvdDogVmFsdWF0aW9uU25hcHNob3QgPSB7XG4gICAgICBzeW1ib2w6IHN5bSxcbiAgICAgIGNvbXBhbnlOYW1lOiBzdW1tYXJ5LnByaWNlPy5sb25nTmFtZSB8fCBzdW1tYXJ5LnByaWNlPy5zaG9ydE5hbWUgfHwgbG9va3VwTmFtZShzeW0pIHx8IHN5bSxcbiAgICAgIHByaWNlOiByb3VuZChwcmljZSksXG4gICAgICBtYXJrZXRDYXA6IHJvdW5kKG1hcmtldENhcCwgMCksXG4gICAgICBlbnRlcnByaXNlVmFsdWU6IHJvdW5kKHJhd051bWJlcihzdW1tYXJ5LmRlZmF1bHRLZXlTdGF0aXN0aWNzPy5lbnRlcnByaXNlVmFsdWUpLCAwKSxcbiAgICAgIHRvdGFsUmV2ZW51ZTogcm91bmQocmV2ZW51ZSwgMCksXG4gICAgICBncm9zc1Byb2ZpdDogcm91bmQocmF3TnVtYmVyKHN1bW1hcnkuZmluYW5jaWFsRGF0YT8uZ3Jvc3NQcm9maXRzKSwgMCksXG4gICAgICBlYml0ZGE6IHJvdW5kKHJhd051bWJlcihzdW1tYXJ5LmZpbmFuY2lhbERhdGE/LmViaXRkYSksIDApLFxuICAgICAgbmV0SW5jb21lVG9Db21tb246IHJvdW5kKG5ldEluY29tZSwgMCksXG4gICAgICBwcm9maXRNYXJnaW46IHJvdW5kKHJhd051bWJlcihzdW1tYXJ5LmZpbmFuY2lhbERhdGE/LnByb2ZpdE1hcmdpbnMpLCA0KSxcbiAgICAgIHJldmVudWVHcm93dGg6IHJvdW5kKHJhd051bWJlcihzdW1tYXJ5LmZpbmFuY2lhbERhdGE/LnJldmVudWVHcm93dGgpLCA0KSxcbiAgICAgIHRyYWlsaW5nUGU6IHJvdW5kKHRyYWlsaW5nUGUpLFxuICAgICAgZm9yd2FyZFBlOiByb3VuZChyYXdOdW1iZXIoc3VtbWFyeS5zdW1tYXJ5RGV0YWlsPy5mb3J3YXJkUEUpKSxcbiAgICAgIHByaWNlVG9TYWxlczogcm91bmQocHJpY2VUb1NhbGVzKSxcbiAgICAgIHByaWNlVG9Cb29rOiByb3VuZChyYXdOdW1iZXIoc3VtbWFyeS5zdW1tYXJ5RGV0YWlsPy5wcmljZVRvQm9vaykpLFxuICAgICAgZW50ZXJwcmlzZVRvUmV2ZW51ZTogcm91bmQocmF3TnVtYmVyKHN1bW1hcnkuZGVmYXVsdEtleVN0YXRpc3RpY3M/LmVudGVycHJpc2VUb1JldmVudWUpKSxcbiAgICAgIGVudGVycHJpc2VUb0ViaXRkYTogcm91bmQocmF3TnVtYmVyKHN1bW1hcnkuZGVmYXVsdEtleVN0YXRpc3RpY3M/LmVudGVycHJpc2VUb0ViaXRkYSkpLFxuICAgICAgZm9yd2FyZEVwczogcm91bmQocmF3TnVtYmVyKHN1bW1hcnkuZGVmYXVsdEtleVN0YXRpc3RpY3M/LmZvcndhcmRFcHMpKSxcbiAgICAgIHRhcmdldE1lYW5QcmljZTogcm91bmQodGFyZ2V0TWVhbiksXG4gICAgICBzaGFyZXNPdXRzdGFuZGluZzogcm91bmQoc2hhcmVzLCAwKSxcbiAgICAgIGVzdGltYXRlczogW1xuICAgICAgICBlc3RpbWF0ZSgnRm9yd2FyZCBlYXJuaW5ncyB2YWx1ZScsIGZhaXJGb3J3YXJkRWFybmluZ3MsIHByaWNlLCAnbmV0IGluY29tZSB4IHRyYWlsaW5nIFAvRSAvIHNoYXJlcyBvdXRzdGFuZGluZycpLFxuICAgICAgICBlc3RpbWF0ZSgnU2FsZXMgbXVsdGlwbGUgdmFsdWUnLCBmYWlyU2FsZXMsIHByaWNlLCAncmV2ZW51ZSB4IHRyYWlsaW5nIFAvUyAvIHNoYXJlcyBvdXRzdGFuZGluZycpLFxuICAgICAgICBlc3RpbWF0ZSgnQW5hbHlzdCB0YXJnZXQgdmFsdWUnLCB0YXJnZXRNZWFuLCBwcmljZSwgJ1lhaG9vIGFuYWx5c3QgbWVhbiB0YXJnZXQgcHJpY2UnKSxcbiAgICAgIF0sXG4gICAgICBzb3VyY2U6ICdsaXZlJyxcbiAgICB9O1xuICAgIGNhY2hlLnNldChzeW0sIHNuYXBzaG90LCBUVExfTVMpO1xuICAgIHJldHVybiBzbmFwc2hvdDtcbiAgfSBjYXRjaCB7XG4gICAgY29uc3Qgc2FtcGxlID0gc2FtcGxlVmFsdWF0aW9uKHN5bSk7XG4gICAgY2FjaGUuc2V0KHN5bSwgc2FtcGxlLCAxMCAqIDYwXzAwMCk7XG4gICAgcmV0dXJuIHNhbXBsZTtcbiAgfVxufVxuIiwgIi8vIHN5bWJvbHM6c2VhcmNoIFx1MjAxNCBZYWhvbyBzeW1ib2wgc2VhcmNoIG1hcHBlZCB0byBTeW1ib2xTdWdnZXN0aW9uW10sIHdpdGggYW5cbi8vIG9mZmxpbmUgZmFsbGJhY2sgdGhhdCBmaWx0ZXJzIHRoZSBidW5kbGVkIHN5bWJvbCBkaXJlY3RvcnkuXG5cbmltcG9ydCB0eXBlIHsgSW5zdHJ1bWVudFR5cGUsIFN5bWJvbFN1Z2dlc3Rpb24gfSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xuaW1wb3J0IHsgZ2V0U3ltYm9sRGlyZWN0b3J5IH0gZnJvbSAnLi9kYXRhRmlsZXMnO1xuaW1wb3J0IHsgc2VhcmNoWWFob28gfSBmcm9tICcuL3lhaG9vJztcblxuY29uc3QgTUFYX1JFU1VMVFMgPSA4O1xuXG5mdW5jdGlvbiBtYXBRdW90ZVR5cGUocXVvdGVUeXBlOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBJbnN0cnVtZW50VHlwZSB8IG51bGwge1xuICBjb25zdCB0ID0gKHF1b3RlVHlwZSA/PyAnJykudG9VcHBlckNhc2UoKTtcbiAgaWYgKHQgPT09ICdFVEYnKSByZXR1cm4gJ2V0Zic7XG4gIGlmICh0ID09PSAnRVFVSVRZJykgcmV0dXJuICdzdG9jayc7XG4gIHJldHVybiBudWxsO1xufVxuXG4vKiogRmlsdGVyIHRoZSBidW5kbGVkIGRpcmVjdG9yeTogZXhhY3Qgc3ltYm9sLCB0aGVuIHN5bWJvbCBwcmVmaXgsIHRoZW4gbmFtZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZWFyY2hEaXJlY3RvcnkocXVlcnk6IHN0cmluZyk6IFN5bWJvbFN1Z2dlc3Rpb25bXSB7XG4gIGNvbnN0IHEgPSBxdWVyeS50cmltKCkudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFxKSByZXR1cm4gW107XG4gIGNvbnN0IHFMb3dlciA9IHF1ZXJ5LnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBkaXIgPSBnZXRTeW1ib2xEaXJlY3RvcnkoKTtcblxuICBjb25zdCBzY29yZWQgPSBkaXJcbiAgICAubWFwKChlbnRyeSkgPT4ge1xuICAgICAgbGV0IHNjb3JlID0gLTE7XG4gICAgICBpZiAoZW50cnkuc3ltYm9sID09PSBxKSBzY29yZSA9IDM7XG4gICAgICBlbHNlIGlmIChlbnRyeS5zeW1ib2wuc3RhcnRzV2l0aChxKSkgc2NvcmUgPSAyO1xuICAgICAgZWxzZSBpZiAoZW50cnkubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHFMb3dlcikpIHNjb3JlID0gMTtcbiAgICAgIHJldHVybiB7IGVudHJ5LCBzY29yZSB9O1xuICAgIH0pXG4gICAgLmZpbHRlcigocykgPT4gcy5zY29yZSA+IDApXG4gICAgLnNvcnQoKGEsIGIpID0+IGIuc2NvcmUgLSBhLnNjb3JlIHx8IGEuZW50cnkuc3ltYm9sLmxvY2FsZUNvbXBhcmUoYi5lbnRyeS5zeW1ib2wpKTtcblxuICByZXR1cm4gc2NvcmVkLnNsaWNlKDAsIE1BWF9SRVNVTFRTKS5tYXAoKHsgZW50cnkgfSkgPT4gKHtcbiAgICBzeW1ib2w6IGVudHJ5LnN5bWJvbCxcbiAgICBuYW1lOiBlbnRyeS5uYW1lLFxuICAgIHR5cGU6IGVudHJ5LnR5cGUsXG4gICAgZXhjaGFuZ2U6IGVudHJ5LmV4Y2hhbmdlLFxuICB9KSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZWFyY2hTeW1ib2xzKHF1ZXJ5OiBzdHJpbmcpOiBQcm9taXNlPFN5bWJvbFN1Z2dlc3Rpb25bXT4ge1xuICBjb25zdCBxID0gcXVlcnkudHJpbSgpLnNsaWNlKDAsIDQ4KTtcbiAgaWYgKCFxKSByZXR1cm4gW107XG4gIHRyeSB7XG4gICAgY29uc3QgcXVvdGVzID0gYXdhaXQgc2VhcmNoWWFob28ocSk7XG4gICAgY29uc3Qgb3V0OiBTeW1ib2xTdWdnZXN0aW9uW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IHF1b3RlIG9mIHF1b3Rlcykge1xuICAgICAgY29uc3QgdHlwZSA9IG1hcFF1b3RlVHlwZShxdW90ZS5xdW90ZVR5cGUpO1xuICAgICAgaWYgKCF0eXBlKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHN5bWJvbCA9IHR5cGVvZiBxdW90ZS5zeW1ib2wgPT09ICdzdHJpbmcnID8gcXVvdGUuc3ltYm9sLnRvVXBwZXJDYXNlKCkgOiAnJztcbiAgICAgIGlmICghc3ltYm9sIHx8IG91dC5zb21lKChzKSA9PiBzLnN5bWJvbCA9PT0gc3ltYm9sKSkgY29udGludWU7XG4gICAgICBvdXQucHVzaCh7XG4gICAgICAgIHN5bWJvbCxcbiAgICAgICAgbmFtZTogcXVvdGUubG9uZ25hbWUgfHwgcXVvdGUuc2hvcnRuYW1lIHx8IHN5bWJvbCxcbiAgICAgICAgdHlwZSxcbiAgICAgICAgZXhjaGFuZ2U6IHF1b3RlLmV4Y2hEaXNwIHx8IHVuZGVmaW5lZCxcbiAgICAgIH0pO1xuICAgICAgaWYgKG91dC5sZW5ndGggPj0gTUFYX1JFU1VMVFMpIGJyZWFrO1xuICAgIH1cbiAgICAvLyBMaXZlIHNlYXJjaCBjYW4gbGVnaXRpbWF0ZWx5IHJldHVybiBub3RoaW5nOyBvbmx5IGZhbGwgYmFjayB0byB0aGVcbiAgICAvLyBvZmZsaW5lIGRpcmVjdG9yeSB3aGVuIFlhaG9vIGdhdmUgdXMgbm90aGluZyB1c2FibGUgYXQgYWxsLlxuICAgIHJldHVybiBvdXQubGVuZ3RoID4gMCA/IG91dCA6IHNlYXJjaERpcmVjdG9yeShxKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHNlYXJjaERpcmVjdG9yeShxKTtcbiAgfVxufVxuIiwgIi8vIFBlcnNpc3RlbnQgd2F0Y2hsaXN0OiBKU09OIGZpbGUgaW4gdXNlckRhdGEsIHNlZWRlZCBvbiBmaXJzdCBydW4uXG4vLyBBIGNvcnJ1cHQgZmlsZSBpcyByZXBsYWNlZCB3aXRoIHRoZSBzZWVkIHJhdGhlciB0aGFuIGNyYXNoaW5nLlxuXG5pbXBvcnQgeyBhcHAgfSBmcm9tICdlbGVjdHJvbic7XG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHR5cGUge1xuICBBZGRXYXRjaGxpc3RSZXN1bHQsXG4gIEluc3RydW1lbnRUeXBlLFxuICBXYXRjaGxpc3RJdGVtLFxufSBmcm9tICcuLi8uLi9zaGFyZWQvdHlwZXMnO1xuaW1wb3J0IHsgZGlyZWN0b3J5TG9va3VwIH0gZnJvbSAnLi9kYXRhRmlsZXMnO1xuaW1wb3J0IHsgc2VhcmNoU3ltYm9scyB9IGZyb20gJy4vc3ltYm9scyc7XG5pbXBvcnQgeyBub3JtYWxpemVTeW1ib2wgfSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCBTRUVEOiBBcnJheTx7IHN5bWJvbDogc3RyaW5nOyBuYW1lOiBzdHJpbmc7IHR5cGU6IEluc3RydW1lbnRUeXBlIH0+ID0gW1xuICB7IHN5bWJvbDogJ1NQWScsIG5hbWU6ICdTUERSIFMmUCA1MDAgRVRGIFRydXN0JywgdHlwZTogJ2V0ZicgfSxcbiAgeyBzeW1ib2w6ICdRUVEnLCBuYW1lOiAnSW52ZXNjbyBRUVEgVHJ1c3QnLCB0eXBlOiAnZXRmJyB9LFxuICB7IHN5bWJvbDogJ1NNSCcsIG5hbWU6ICdWYW5FY2sgU2VtaWNvbmR1Y3RvciBFVEYnLCB0eXBlOiAnZXRmJyB9LFxuICB7IHN5bWJvbDogJ0FBUEwnLCBuYW1lOiAnQXBwbGUgSW5jLicsIHR5cGU6ICdzdG9jaycgfSxcbiAgeyBzeW1ib2w6ICdOVkRBJywgbmFtZTogJ05WSURJQSBDb3Jwb3JhdGlvbicsIHR5cGU6ICdzdG9jaycgfSxcbiAgeyBzeW1ib2w6ICdUU0xBJywgbmFtZTogJ1Rlc2xhLCBJbmMuJywgdHlwZTogJ3N0b2NrJyB9LFxuXTtcblxubGV0IGl0ZW1zOiBXYXRjaGxpc3RJdGVtW10gfCBudWxsID0gbnVsbDtcblxuZnVuY3Rpb24gc3RvcmVQYXRoKCk6IHN0cmluZyB7XG4gIHJldHVybiBwYXRoLmpvaW4oYXBwLmdldFBhdGgoJ3VzZXJEYXRhJyksICd3YXRjaGxpc3QuanNvbicpO1xufVxuXG5mdW5jdGlvbiBzZWVkSXRlbXMoKTogV2F0Y2hsaXN0SXRlbVtdIHtcbiAgY29uc3QgYWRkZWRBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgcmV0dXJuIFNFRUQubWFwKChzKSA9PiAoeyAuLi5zLCBhZGRlZEF0IH0pKTtcbn1cblxuZnVuY3Rpb24gaXNWYWxpZEl0ZW0odmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBXYXRjaGxpc3RJdGVtIHtcbiAgaWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IGl0ZW0gPSB2YWx1ZSBhcyBQYXJ0aWFsPFdhdGNobGlzdEl0ZW0+O1xuICByZXR1cm4gKFxuICAgIHR5cGVvZiBpdGVtLnN5bWJvbCA9PT0gJ3N0cmluZycgJiZcbiAgICBub3JtYWxpemVTeW1ib2woaXRlbS5zeW1ib2wpICE9PSBudWxsICYmXG4gICAgdHlwZW9mIGl0ZW0ubmFtZSA9PT0gJ3N0cmluZycgJiZcbiAgICBpdGVtLm5hbWUubGVuZ3RoID4gMCAmJlxuICAgIChpdGVtLnR5cGUgPT09ICdldGYnIHx8IGl0ZW0udHlwZSA9PT0gJ3N0b2NrJykgJiZcbiAgICB0eXBlb2YgaXRlbS5hZGRlZEF0ID09PSAnc3RyaW5nJ1xuICApO1xufVxuXG5mdW5jdGlvbiBzYXZlKGxpc3Q6IFdhdGNobGlzdEl0ZW1bXSk6IHZvaWQge1xuICB0cnkge1xuICAgIGNvbnN0IGZpbGUgPSBzdG9yZVBhdGgoKTtcbiAgICBmcy5ta2RpclN5bmMocGF0aC5kaXJuYW1lKGZpbGUpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBmcy53cml0ZUZpbGVTeW5jKGZpbGUsIEpTT04uc3RyaW5naWZ5KGxpc3QsIG51bGwsIDIpLCAndXRmOCcpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdbd2F0Y2hsaXN0XSBmYWlsZWQgdG8gcGVyc2lzdDonLCBlcnIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGxvYWQoKTogV2F0Y2hsaXN0SXRlbVtdIHtcbiAgaWYgKGl0ZW1zKSByZXR1cm4gaXRlbXM7XG4gIHRyeSB7XG4gICAgY29uc3QgcmF3ID0gZnMucmVhZEZpbGVTeW5jKHN0b3JlUGF0aCgpLCAndXRmOCcpO1xuICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UocmF3KSBhcyB1bmtub3duO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHBhcnNlZCkpIHtcbiAgICAgIGNvbnN0IHZhbGlkID0gcGFyc2VkLmZpbHRlcihpc1ZhbGlkSXRlbSkubWFwKChpdGVtKSA9PiAoe1xuICAgICAgICAuLi5pdGVtLFxuICAgICAgICBzeW1ib2w6IGl0ZW0uc3ltYm9sLnRvVXBwZXJDYXNlKCksXG4gICAgICB9KSk7XG4gICAgICBpZiAodmFsaWQubGVuZ3RoID4gMCB8fCBwYXJzZWQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGl0ZW1zID0gdmFsaWQ7XG4gICAgICAgIHJldHVybiBpdGVtcztcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1bnJlY29nbml6ZWQgd2F0Y2hsaXN0IGZpbGUgc2hhcGUnKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc3QgY29kZSA9IChlcnIgYXMgTm9kZUpTLkVycm5vRXhjZXB0aW9uKS5jb2RlO1xuICAgIGlmIChjb2RlICE9PSAnRU5PRU5UJykgY29uc29sZS5lcnJvcignW3dhdGNobGlzdF0gcmVzZWVkaW5nIGFmdGVyIGxvYWQgZXJyb3I6JywgZXJyKTtcbiAgICBpdGVtcyA9IHNlZWRJdGVtcygpO1xuICAgIHNhdmUoaXRlbXMpO1xuICAgIHJldHVybiBpdGVtcztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0V2F0Y2hsaXN0KCk6IFdhdGNobGlzdEl0ZW1bXSB7XG4gIHJldHVybiBbLi4ubG9hZCgpXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUZyb21XYXRjaGxpc3Qoc3ltYm9sOiBzdHJpbmcpOiBXYXRjaGxpc3RJdGVtW10ge1xuICBjb25zdCBzeW0gPSBzeW1ib2wudG9VcHBlckNhc2UoKTtcbiAgY29uc3QgbGlzdCA9IGxvYWQoKS5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uc3ltYm9sICE9PSBzeW0pO1xuICBpdGVtcyA9IGxpc3Q7XG4gIHNhdmUobGlzdCk7XG4gIHJldHVybiBbLi4ubGlzdF07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVTeW1ib2woXG4gIHN5bWJvbDogc3RyaW5nLFxuKTogUHJvbWlzZTx7IG5hbWU6IHN0cmluZzsgdHlwZTogSW5zdHJ1bWVudFR5cGUgfSB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdWdnZXN0aW9ucyA9IGF3YWl0IHNlYXJjaFN5bWJvbHMoc3ltYm9sKTtcbiAgICBjb25zdCBleGFjdCA9IHN1Z2dlc3Rpb25zLmZpbmQoKHMpID0+IHMuc3ltYm9sLnRvVXBwZXJDYXNlKCkgPT09IHN5bWJvbCk7XG4gICAgaWYgKGV4YWN0KSByZXR1cm4geyBuYW1lOiBleGFjdC5uYW1lLCB0eXBlOiBleGFjdC50eXBlIH07XG4gIH0gY2F0Y2gge1xuICAgIC8qIGZhbGwgdGhyb3VnaCB0byB0aGUgb2ZmbGluZSBkaXJlY3RvcnkgKi9cbiAgfVxuICBjb25zdCBlbnRyeSA9IGRpcmVjdG9yeUxvb2t1cChzeW1ib2wpO1xuICBpZiAoZW50cnkpIHJldHVybiB7IG5hbWU6IGVudHJ5Lm5hbWUsIHR5cGU6IGVudHJ5LnR5cGUgfTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRUb1dhdGNobGlzdChyYXdTeW1ib2w6IHN0cmluZyk6IFByb21pc2U8QWRkV2F0Y2hsaXN0UmVzdWx0PiB7XG4gIGNvbnN0IHN5bWJvbCA9IG5vcm1hbGl6ZVN5bWJvbChyYXdTeW1ib2wpO1xuICBpZiAoIXN5bWJvbCkgcmV0dXJuIHsgb2s6IGZhbHNlLCBlcnJvcjogJ0ludmFsaWQgc3ltYm9sJyB9O1xuXG4gIGNvbnN0IGxpc3QgPSBsb2FkKCk7XG4gIGlmIChsaXN0LnNvbWUoKGl0ZW0pID0+IGl0ZW0uc3ltYm9sID09PSBzeW1ib2wpKSB7XG4gICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBlcnJvcjogJ0FscmVhZHkgaW4gd2F0Y2hsaXN0JyB9O1xuICB9XG5cbiAgY29uc3QgcmVzb2x2ZWQgPSBhd2FpdCByZXNvbHZlU3ltYm9sKHN5bWJvbCk7XG4gIGlmICghcmVzb2x2ZWQpIHJldHVybiB7IG9rOiBmYWxzZSwgZXJyb3I6ICdTeW1ib2wgbm90IGZvdW5kJyB9O1xuXG4gIGNvbnN0IGl0ZW06IFdhdGNobGlzdEl0ZW0gPSB7XG4gICAgc3ltYm9sLFxuICAgIG5hbWU6IHJlc29sdmVkLm5hbWUsXG4gICAgdHlwZTogcmVzb2x2ZWQudHlwZSxcbiAgICBhZGRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gIH07XG4gIGNvbnN0IG5leHQgPSBbLi4ubGlzdCwgaXRlbV07XG4gIGl0ZW1zID0gbmV4dDtcbiAgc2F2ZShuZXh0KTtcbiAgcmV0dXJuIHsgb2s6IHRydWUsIGl0ZW0sIHdh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RUFBSyxNQUFNO0FBQUEsRUFBSyxNQUFNO0FBQUEsRUFBSyxNQUFNO0FBQUEsRUFBSyxPQUFPO0FBQUEsRUFBSyxNQUFNO0FBQUEsRUFDOUQsTUFBTTtBQUFBLEVBQUssTUFBTTtBQUFBLEVBQUssTUFBTTtBQUFBLEVBQUssU0FBUztBQUFBLEVBQUssS0FBSztBQUFBLEVBQUssR0FBRztBQUFBLEVBQzVELElBQUk7QUFBQSxFQUFLLEtBQUs7QUFBQSxFQUFLLEtBQUs7QUFBQSxFQUFLLEtBQUs7QUFBQSxFQUFLLEtBQUs7QUFBQSxFQUFLLElBQUk7QUFBQSxFQUFLLElBQUk7QUFBQSxFQUM5RCxNQUFNO0FBQUEsRUFBSyxLQUFLO0FBQUEsRUFBSSxNQUFNO0FBQUEsRUFBTSxLQUFLO0FBQUEsRUFBSyxNQUFNO0FBQUEsRUFBSyxLQUFLO0FBQUEsRUFDMUQsTUFBTTtBQUFBLEVBQUssS0FBSztBQUFBLEVBQUssSUFBSTtBQUFBLEVBQUksTUFBTTtBQUFBLEVBQUksTUFBTTtBQUFBLEVBQUksS0FBSztBQUFBLEVBQUssTUFBTTtBQUFBLEVBQ2pFLE1BQU07QUFBQSxFQUFLLEtBQUs7QUFBQSxFQUFLLElBQUk7QUFBQSxFQUFLLE1BQU07QUFBQSxFQUFLLE1BQU07QUFBQSxFQUFJLE1BQU07QUFBQSxFQUN6RCxNQUFNO0FBQUEsRUFBSyxNQUFNO0FBQUEsRUFBSyxNQUFNO0FBQUEsRUFBSSxNQUFNO0FBQUEsRUFBSyxLQUFLO0FBQUEsRUFBSyxJQUFJO0FBQUEsRUFDekQsS0FBSztBQUFBLEVBQUssSUFBSTtBQUFBLEVBQUssSUFBSTtBQUFBLEVBQUssS0FBSztBQUFBLEVBQUksS0FBSztBQUFBLEVBQUksS0FBSztBQUFBLEVBQUssSUFBSTtBQUFBLEVBQzVELEtBQUs7QUFBQSxFQUFLLEtBQUs7QUFBQSxFQUFJLEdBQUc7QUFBQSxFQUFJLElBQUk7QUFBQSxFQUFJLEtBQUs7QUFBQSxFQUFJLEtBQUs7QUFBQSxFQUFJLE1BQU07QUFBQSxFQUMxRCxLQUFLO0FBQUEsRUFBSyxLQUFLO0FBQUEsRUFBSyxL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QUksK0JBQWMsY0FBYyxFQUFFLFdBQVcsRUFBRyxjQUFhO0FBQUEsSUFDL0QsQ0FBQztBQUFBLEVBQ0gsQ0FBQztBQUVELHVCQUFJLEdBQUcscUJBQXFCLE1BQU07QUFDaEMseUJBQUksS0FBSztBQUFBLEVBQ1gsQ0FBQztBQUNIOyIsCiAgIm5hbWVzIjogWyJleHBvcnRzIiwgImV4cG9ydHMiLCAiZXhwb3J0cyIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJyZXN1bHQiLCAiZXhwb3J0cyIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJYTUxQYXJzZXIiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAiYXR0U3RyIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgIlhNTFBhcnNlciIsICJpbXBvcnRfZWxlY3Ryb24iLCAiaW1wb3J0X25vZGVfZnMiLCAiaW1wb3J0X25vZGVfcGF0aCIsICJwYXRoIiwgImZzIiwgIml0ZW1zIiwgIkxJVkVfVFRMX01TIiwgIlNBTVBMRV9UVExfTVMiLCAiY2FjaGUiLCAiaW5GbGlnaHQiLCAiaW1wb3J0X25vZGVfZnMiLCAiaW1wb3J0X25vZGVfcGF0aCIsICJwYXRoIiwgImZzIiwgImltcG9ydF9lbGVjdHJvbiIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgInN0b3JlUGF0aCIsICJwYXRoIiwgImZzIiwgIml0ZW1zIiwgImxpbWl0IiwgIml0ZW1zIiwgIldJTkRPV19EQVlTIiwgImxpbWl0IiwgIml0ZW1zIiwgImxpbWl0IiwgImNhY2hlIiwgImltcG9ydF9lbGVjdHJvbiIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgInN0b3JlUGF0aCIsICJwYXRoIiwgImZzIiwgIml0ZW0iLCAiTUFYX1BJVk9UUyIsICJwYXRoIiwgImZzIl0KfQo=
