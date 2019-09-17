const genCss = require('./genCss');

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
