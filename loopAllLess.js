const path = require("path");
const glob = require("glob");
const AddlocalIdentName = require("./AddlocalIdentName");
const replacedefaultLess = require("./replacedefaultLess");
const deleteRelativePath = require("./removeRelativePath");
const uniqBy = require("lodash.uniqby");
const prettier = require("prettier");

// read less file list
const loopAllLess = async parents => {
  const promiseList = [];
  let importFileList = [];
  const lessDir = path.join(parents, "/**/**.less");
  glob
    .sync(lessDir, { ignore: "**/node_modules/**" })
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
        AddlocalIdentName(relaPath, fileContent).then(
          result => {
            importFileList = importFileList.concat(result.messages);
            return result.content.toString();
          },
          err => err
        )
      );
    });
  const lessContentArray = await Promise.all(promiseList);
  importFileList = deleteRelativePath(
    uniqBy(importFileList).map(file => {
      return `@import ${file};`;
    })
  );
  const content = importFileList.concat(lessContentArray).join("\n \n");

  return Promise.resolve(
    prettier.format(content, {
      parser: "less"
    })
  );
};

module.exports = loopAllLess;
