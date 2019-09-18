#!/usr/bin/env node
/**
 * 这个方法用来处理 css-modlue
 * 由于没有开源插件，所以自己撸了一个
 */
const path = require('path');
const glob = require('glob');
const getLocalIdentName = require('./getLocalIdentName');
const AddLocalIdentName = require('./AddLocalIdentName');
const replaceDefaultLess = require('./replaceDefaultLess');

// read less file list
const genModuleLess = parents => {
  let lessArray = [];
  const promiseList = [];
  const antdLessPath = path.join(require.resolve('antd'), '../style/themes/default.less');
  lessArray = [`@import "${antdLessPath}";`];
  glob
    .sync(`${parents}/**/**.less`, { ignore: '**/node_modules/**' })
    .filter(
      filePath => !filePath.includes('ant.design.pro.less') && !filePath.includes('global.less'),
    )
    .forEach(realPath => {
      // post css add localIdentNamePlugin
      const fileContent = replaceDefaultLess(realPath);
      // push less file
      promiseList.push(AddLocalIdentName(realPath, fileContent, getLocalIdentName(realPath)));
    });
  return Promise.all(promiseList).then(content => lessArray.concat(content).join('\n'));
};

module.exports = genModuleLess;
