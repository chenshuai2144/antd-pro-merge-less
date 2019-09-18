const loopAllLess = require('./loopAllLess');
const fs = require('fs');
const path = require('path');
const less = require('less');
const genModuleLess = require('./genModuleLess');
const rimraf = require('rimraf');
const darkTheme = require('@ant-design/dark-theme');

let tempPath = path.join(__dirname, './.temp/');

const loadAntd = async () => {
  if (fs.existsSync('./node_modules/antd/es/index.js')) {
    await loopAllLess(path.resolve('./node_modules/antd/es/'), []).then(content => {
      fs.writeFileSync(
        path.join(tempPath, './antd.less'),
        `@import '../color/bezierEasing';
  @import '../color/colorPalette';
  @import "../color/tinyColor";
  ${content}
        `,
      );
    });
    return true;
  }

  fs.writeFileSync(
    path.join(tempPath, './antd.less'),
    `@import '../color/bezierEasing';
@import '../color/colorPalette';
@import "../color/tinyColor";
    `,
  );
  return false;
};

const loadAntdProLayout = async () => {
  if (fs.existsSync('./node_modules/@ant-design/pro-layout/es/index.js')) {
    await loopAllLess(path.resolve('./node_modules/@ant-design/pro-layout/es/'), []).then(
      content => {
        fs.writeFileSync(
          path.join(tempPath, '/layout.less'),
          `@import 'antd';
  ${content}
      `,
        );
      },
    );
    return true;
  }
  fs.writeFileSync(path.join(tempPath, '/layout.less'), `@import 'antd';`);
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
    if (fs.existsSync(tempPath)) {
      rimraf.sync(tempPath);
    }
    fs.mkdirSync(tempPath);

    fs.writeFileSync(path.join(tempPath, 'temp.less'), content);

    try {
      const lessContent = await loopAllLess(tempPath);
      fs.writeFileSync(
        path.join(tempPath, 'pro.less'),
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
  let proLess = path.join(tempPath, './pro.less');
  return less
    .render(fs.readFileSync(proLess, 'utf-8'), {
      modifyVars: getModifyVars(theme, modifyVars),
      javascriptEnabled: true,
      filename: path.resolve(proLess),
    })
    .then(out => out.css)
    .catch(e => {
      console.log(e);
    });
};

const build = async (cwd, modifyVarsArray) => {
  await genProjectLess(cwd);
  modifyVarsArray.map(async ({ theme, modifyVars, fileName }) => {
    const css = await renderLess(theme, modifyVars);
    fs.writeFileSync(fileName, css);
  });
};

module.exports = build;
