const path = require('path');
const glob = require('glob');
const getVariable = require('./getVariable');
const replaceDefaultLess = require('./replaceDefaultLess');
const deleteRelativePath = require('./removeRelativePath');
const uniqBy = require('lodash.uniqby');
const prettier = require('prettier');

// read less file list
const loopAllLess = async (parents, ignore = ['**/node_modules/**', '**/lib/**', '**/es/**']) => {
  const promiseList = [];
  let importFileList = [];
  const lessDir = path.join(parents, '**/**.less');
  glob
    .sync(lessDir, { ignore })
    .filter(
      filePath => !filePath.includes('ant.design.pro.less') && !filePath.includes('global.less'),
    )
    .sort((a, b) => {
      if (a.includes('index') && b.includes('index')) {
        return 0;
      }
      if (a.includes('index') && !b.includes('index')) {
        return -1;
      }
      return 1;
    })
    .forEach(relayPath => {
      // post css add localIdentNameplugin
      const fileContent = replaceDefaultLess(relayPath);
      // push less file
      promiseList.push(
        getVariable(relayPath, fileContent).then(
          result => {
            importFileList = importFileList.concat(result.messages);
            return result.content.toString();
          },
          err => {
            console.log(
              `
文件： ${err.file} 报错，
错误原因： ${err.name}`,
            );
          },
        ),
      );
    });
  const lessContentArray = await Promise.all(promiseList);
  importFileList = deleteRelativePath(
    uniqBy(importFileList).map(file => {
      return `@import ${file};`;
    }),
  );
  const content = importFileList.concat(lessContentArray).join(';\n \n');

  return Promise.resolve(
    prettier.format(content, {
      parser: 'less',
    }),
  );
};

module.exports = loopAllLess;
