#!/usr/bin/env node
/**
 * 这个方法用来处理 css-modlue
 * 由于没有开源插件，所以自己撸了一个
 */
const glob = require('glob');
const uniqBy = require('lodash.uniqby');
const { winPath } = require('umi-utils');
const AddLocalIdentName = require('./AddLocalIdentName');
const replaceDefaultLess = require('./replaceDefaultLess');

// priorty:
// 3. other/**/index.less
// 2. other/**.less
// 1. site/theme/**/index.less
// 0. site/theme/**.less
const getLessPriorty = filename => {
  let priority = 0;
  if (filename.includes('index.less')) {
    priority += 1;
  }
  if (!a.includes('site/theme')) {
    priority += 2;
  }
  return priority;
};

// read less file list
const genModuleLess = (parents, { isModule, filterFileLess }) => {
  let lessArray = [];
  const promiseList = [];
  lessArray = [];
  glob
    .sync(winPath(`${parents}/**/**.less`), {
      ignore: ['**/node_modules/**', '**/es/**', '**/lib/**', '**/dist/**', '**/_site/**'],
    })
    .sort((a, b) => getLessPriorty(a) - getLessPriorty(b))
    .filter(filePath => {
      if (
        filePath.includes('ant.design.pro.less') ||
        filePath.includes('global.less') ||
        filePath.includes('bezierEasing.less') ||
        filePath.includes('colorPalette.less') ||
        filePath.includes('tinyColor.less')
      ) {
        return false;
      }
      if (filterFileLess) {
        return filterFileLess(filePath);
      }
      return true;
    })
    .forEach(realPath => {
      // post css add localIdentNamePlugin
      const fileContent = replaceDefaultLess(realPath);
      promiseList.push(AddLocalIdentName(realPath, fileContent, isModule));
    });

  return Promise.all(promiseList).then(content => {
    let allFileList = [];
    content.map(item => {
      const { fileList, name } = item.messages;
      allFileList = allFileList.concat([name, ...fileList]);
      return item;
    });
    const fileString = uniqBy(allFileList).join('-');
    return lessArray
      .concat(
        content.sort((a, b) => {
          const aName = a.messages.name;
          const bName = b.messages.name;
          if (aName.includes('v2-compatible-reset')) {
            return 1;
          }
          if (bName.includes('v2-compatible-reset')) {
            return -1;
          }
          return fileString.indexOf(aName) - fileString.indexOf(bName);
        }),
      )
      .join('\n');
  });
};

module.exports = genModuleLess;
