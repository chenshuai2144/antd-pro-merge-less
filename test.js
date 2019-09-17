const loopAllLess = require('./loopAllLess');
const fs = require('fs');
const path = require('path');

const callback = () => {
  console.log('finish');
};

loopAllLess(path.resolve('./node_modules/antd/es/'), []).then(content => {
  fs.writeFileSync(
    './function/color/variable.less',
    `@import 'bezierEasing';
       @import 'colorPalette';
       @import "tinyColor";
    ${content}
    `,
  );
});

loopAllLess('/Users/qixian.cs/Documents/GitHub/ant-design-pro').then(content => {
  fs.writeFileSync(
    './function/color/pro.less',
    `@import 'bezierEasing';
       @import 'colorPalette';
       @import "tinyColor";
    ${content}
    `,
  );
});
