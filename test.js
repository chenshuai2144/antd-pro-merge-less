const genCss = require('./index');

genCss(
  'C:/github/ant-design-pro',
  [
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
  ],
  {
    min: false,
    // isModule: false,
    // ignoreAntd: true,
    // ignoreProLayout: true,
    cache: false,
  },
);
