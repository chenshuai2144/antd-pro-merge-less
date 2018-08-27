#!/usr/bin/env node
/**
 * 这个方法用来处理 css-modlue
 * 由于没有开源插件，所以自己撸了一个
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");
const getLocalIdentName = require("./getLocalIdentName");
const AddlocalIdentName = require("./AddlocalIdentName");
const replacedefaultLess = require("./replacedefaultLess");
// read less file list
let lessArray = [];
const loopAllLess = parents => {
  const promiseList = [];
  lessArray = ['@import "../node_modules/antd/lib/style/themes/default.less";'];
  glob
    .sync(parents + "/**/**.less", { ignore: "**/node_modules/**" })
    .filter(
      filePath =>
        !filePath.includes("ant.design.pro.less") &&
        !filePath.includes("global.less")
    )
    .forEach(relaPath => {
      // post css add localIdentNameplugin
      const fileContent = replacedefaultLess(relaPath);
      // push less file
      promiseList.push(
        AddlocalIdentName(
          relaPath,
          fileContent,
          getLocalIdentName(relaPath)
        ).then(result => {
          lessArray.push(result);
        })
      );
    });
  return Promise.all(promiseList);
};

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
    compiler.plugin("emit", (compilation, callback) => {
      const { outFile } = options;
      // covert less
      if (fs.existsSync(outFile)) {
        fs.unlinkSync(outFile);
      } else if (!fs.existsSync(path.dirname(outFile))) {
        fs.mkdirSync(path.dirname(outFile));
      }
      loopAllLess(options.stylesDir).then(() => {
        fs.writeFileSync(outFile, lessArray.join("\n"));
        callback();
      });
    });
  }
}
module.exports = mergeLessPlugin;
