const genCss = require('./index');

genCss([
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
