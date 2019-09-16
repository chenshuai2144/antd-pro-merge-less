const loopAllLess = require('./loopAllLess');
const fs = require('fs');

const callback = () => {
  console.log('finish');
};
loopAllLess('/Users/qixian.cs/Documents/GitHub/ant-design/components/').then(
  content => {
    fs.writeFileSync(
      './function/color/antd-variable.less',
      `@import 'bezierEasing';
    @import 'colorPalette';
    @import "tinyColor";
    ${content}
    `,
    );
  },
  e => {
    callback();
  },
);
