#!/usr/bin/env node
/**
 * 这个方法用来处理 css-modlue
 * 由于没有开源插件，所以自己撸了一个
 */
const glob = require('glob');
const AddLocalIdentName = require('./AddLocalIdentName');
const replaceDefaultLess = require('./replaceDefaultLess');
const { winPath } = require('umi-utils');

// read less file list
const genModuleLess = (parents, isModule) => {
  let lessArray = [];
  const promiseList = [];
  lessArray = [];
  glob
    .sync(winPath(`${parents}/**/**.less`), {
      ignore: ['**/node_modules/**', '**/es/**', '**/lib/**', '**/dist/**', '**/_site/**'],
    })
    .filter(
      filePath =>
        !filePath.includes('ant.design.pro.less') &&
        !filePath.includes('global.less') &&
        !filePath.includes('bezierEasing.less') &&
        !filePath.includes('colorPalette.less') &&
        !filePath.includes('tinyColor.less'),
    )
    .forEach(realPath => {
      // post css add localIdentNamePlugin
      const fileContent = replaceDefaultLess(realPath);
      promiseList.push(AddLocalIdentName(realPath, fileContent, isModule));
    });
  return Promise.all(promiseList).then(content => lessArray.concat(content).join('\n'));
};

module.exports = genModuleLess;
