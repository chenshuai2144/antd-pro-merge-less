const loopAllLess = require('./loopAllLess');
const fs = require('fs');
const path = require('path');
const less = require('less');
const genModuleLess = require('./genModuleLess');
const darkTheme = require('@ant-design/dark-theme');
const { winPath } = require('umi-utils');
const getVariable = require('./getVariable');
const hash = require('hash.js');
const uglifycss = require('uglifycss');

const genHashCode = content =>
  hash
    .sha256()
    .update(content)
    .digest('hex');

const tempPath = winPath(path.join(__dirname, './.temp/'));

const loadAntd = async () => {
  const antdPath = require.resolve('antd');
  if (fs.existsSync(antdPath)) {
    await loopAllLess(path.resolve(path.join(antdPath, '../../es/')), []).then(content => {
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
  const LayoutPath = require.resolve('@ant-design/pro-layout');
  if (fs.existsSync(LayoutPath)) {
    await loopAllLess(path.resolve(path.join(LayoutPath, '../../es/')), []).then(content => {
      fs.writeFileSync(
        path.join(tempPath, '/layout.less'),
        `@import 'antd';
  ${content}
      `,
      );
    });
    return true;
  }
  fs.writeFileSync(path.join(tempPath, '/layout.less'), "@import 'antd';");
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

const getOldFile = path => {
  if (fs.existsSync(path)) {
    return fs.readFileSync(path);
  }
  return false;
};

let isEqual = false;

const genProjectLess = filePath =>
  genModuleLess(filePath).then(async content => {
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath);
    }

    const tempFilePath = path.join(tempPath, 'temp.less');

    // 获取新旧文件的 hash
    const newFileHash = genHashCode(content);

    const oldFileHash = genHashCode(getOldFile(tempFilePath));
    if (newFileHash === oldFileHash) {
      isEqual = true;
      // 无需重复生成
      return true;
    }

    fs.writeFileSync(tempFilePath, content);

    try {
      const lessContent = await getVariable(tempFilePath, fs.readFileSync(tempFilePath)).then(
        result => {
          return result.content.toString();
        },
      );
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

const modifyVarsIsEqual = (modifyVarsArray = '') => {
  const modifyVarsArrayString = JSON.stringify(modifyVarsArray);

  const modifyVarsArrayPath = path.join(tempPath, 'modifyVarsArray.json');
  const old = getOldFile(modifyVarsArrayPath);
  if (genHashCode(old) === genHashCode(modifyVarsArrayString) && isEqual) {
    console.log('📸  less and modifyVarsArray is equal!');
    return true;
  }
  fs.writeFileSync(modifyVarsArrayPath, modifyVarsArrayString);
  return false;
};

const renderLess = (theme, modifyVars, { min = true }) => {
  const proLess = path.join(tempPath, './pro.less');

  return (
    less
      .render(fs.readFileSync(proLess, 'utf-8'), {
        modifyVars: getModifyVars(theme, modifyVars),
        javascriptEnabled: true,
        filename: path.resolve(proLess),
      })
      // 如果需要压缩，再打开压缩功能默认打开
      .then(out => (min ? uglifycss.processString(out.css) : out.css))
      .catch(e => {
        console.log(e);
      })
  );
};

const build = async (cwd, modifyVarsArray, option = {}) => {
  isEqual = false;
  try {
    await genProjectLess(cwd);
    if (modifyVarsIsEqual(modifyVarsArray)) {
      return;
    }

    modifyVarsArray.map(async ({ theme, modifyVars, fileName }) => {
      const css = await renderLess(theme, modifyVars, option);
      fs.writeFileSync(fileName, css);
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = build;
