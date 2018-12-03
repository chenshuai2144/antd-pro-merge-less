#!/usr/bin/env node
/**
 * 这个方法用来处理 css-modlue
 * 由于没有开源插件，所以自己撸了一个
 */

const fs = require("fs");
const path = require("path");
const loopAllLess = require("./loopAllLess");

class mergeLessPlugin {
  constructor(options) {
    const defaulOptions = {
      stylesDir: path.join(__dirname, "./src/"),
      outFile: path.join(__dirname, "./tmp/ant.design.pro.less")
    };
    this.options = Object.assign(defaulOptions, options);
    this.generated = false;
  }

  apply(compiler) {
    const { options } = this;
    compiler.hooks.emit.tapAsync("MergeLessPlugin", (compilation, callback) => {
      const { outFile } = options;
      // covert less
      if (fs.existsSync(outFile)) {
        fs.unlinkSync(outFile);
      } else if (!fs.existsSync(path.dirname(outFile))) {
        fs.mkdirSync(path.dirname(outFile));
      }
      loopAllLess(options.stylesDir).then(
        content => {
          fs.writeFileSync(outFile, content);
          callback();
        },
        () => {
          callback();
        }
      );
    });
  }
}
module.exports = mergeLessPlugin;
