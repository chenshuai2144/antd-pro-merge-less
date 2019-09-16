const loopAllLess = require('./loopAllLess');
const fs = require('fs');

const callback = () => {
  console.log('finish');
};
loopAllLess('/Users/qixian.cs/Documents/GitHub/ant-design/components/').then(
  content => {
    fs.writeFileSync(
      './color/antdPro.less',
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
