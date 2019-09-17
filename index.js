const loopAllLess = require('./loopAllLess');
const fs = require('fs');
const path = require('path');
const less = require('less');
const genModuleLess = require('./genModuleLess');
const rimraf = require('rimraf');
const darkTheme = require('@ant-design/dark-theme');

const loadAntd = async () => {
  if (fs.existsSync('./node_modules/antd/es/index.js')) {
    await loopAllLess(path.resolve('./node_modules/antd/es/'), []).then(content => {
      fs.writeFileSync(
        './.temp/antd.less',
        `@import '../color/bezierEasing';
  @import '../color/colorPalette';
  @import "../color/tinyColor";
  ${content}
        `,
      );
    });
    return true;
  }

  return false;
};

const loadAntdProLayout = async () => {
  if (fs.existsSync('./node_modules/@ant-design/pro-layout/es/index.js')) {
    await loopAllLess(path.resolve('./node_modules/@ant-design/pro-layout/es/'), []).then(
      content => {
        fs.writeFileSync(
          './.temp/layout.less',
          `@import 'antd';
  ${content}
      `,
        );
      },
    );
    return true;
  }
  fs.writeFileSync('./.temp/layout.less', `@import 'antd';`);
  return false;
};

const getModifyVars = (theme = 'light', modifyVars) => {
  try {
    if (theme === 'dark') {
      return {
        ...darkTheme.default,
        ...modifyVars,
      };
    }
    return { ...modifyVars };
  } catch (error) {
    throw error;
  }
};

const genProjectLess = filePath => {
  return genModuleLess(filePath).then(async content => {
    if (fs.existsSync('./.temp')) {
      rimraf.sync('./.temp');
    }
    fs.mkdirSync('./.temp');

    const tempPath = path.join(__dirname, './.temp/');
    fs.writeFileSync(path.join(tempPath, 'temp.less'), content);

    try {
      const lessContent = await loopAllLess(tempPath);
      fs.writeFileSync(
        './.temp/pro.less',
        `@import 'layout';
    ${lessContent}`,
      );
    } catch (error) {
      console.log(error);
    }

    await loadAntd();
    await loadAntdProLayout();
    return true;
  });
};

const renderLess = (theme, modifyVars) => {
  console.log(getModifyVars(theme, modifyVars));
  return less
    .render(fs.readFileSync('./.temp/pro.less', 'utf-8'), {
      modifyVars: getModifyVars(theme, modifyVars),
      javascriptEnabled: true,
      filename: path.resolve('./.temp/pro.less'),
    })
    .then(out => out.css)
    .catch(e => {
      console.log(e);
    });
};

module.exports = async modifyVarsArray => {
  await genProjectLess('/Users/qixian.cs/Documents/GitHub/ant-design-pro');
  modifyVarsArray.map(async ({ theme, modifyVars, fileName }) => {
    const css = await renderLess(theme, modifyVars);
    fs.writeFileSync(fileName, css);
  });
};
