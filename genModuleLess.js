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

// read less file list
const genModuleLess = (parents, isModule) => {
  let lessArray = [];
  const promiseList = [];
  lessArray = [];
  glob
    .sync(winPath(`${parents}/**/**.less`), {
      ignore: ['**/node_modules/**', '**/es/**', '**/lib/**', '**/dist/**', '**/_site/**'],
    })
    .sort((a, b) => {
      let aSortNumber = 0;
      let bSortNumber = 0;
      if (a.includes('index.less')) {
        aSortNumber = 1;
      }
      if (b.includes('index.less')) {
        bSortNumber = 1;
      }
      return bSortNumber - aSortNumber;
    })
    .filter(
      filePath =>
        !filePath.includes('ant.design.pro.less') &&
        !filePath.includes('global.less') &&
        !filePath.includes('bezierEasing.less') &&
        !filePath.includes('colorPalette.less') &&
        !filePath.includes('tinyColor.less') &&
        !filePath.includes('v2-compatible-reset'),
    )
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
          return fileString.indexOf(aName) - fileString.indexOf(bName);
        }),
      )
      .join('\n');
  });
};

module.exports = genModuleLess;
