const path = require("path");
const glob = require("glob");
const AddlocalIdentName = require("./AddlocalIdentName");
const replacedefaultLess = require("./replacedefaultLess");

// read less file list
const loopAllLess = parents => {
  const promiseList = [];
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
            return result.content.toString();
          },
          err => err
        )
      );
    });
  return Promise.all(promiseList);
};

module.exports = loopAllLess;
