const genCss = require('./index');

genCss('/Users/qixian.cs/Documents/GitHub/ant-design-pro', [
  {
    theme: 'dark',
    fileName: './.temp/dark.css',
  },
  {
    fileName: './.temp/mingQing.css',
    modifyVars: {
      '@primary-color': '#13C2C2',
    },
  },
]);
