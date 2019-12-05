/** @format */

const loopAllLess = require('./loopAllLess');
const fs = require('fs');
const path = require('path');
const less = require('less');
const genModuleLess = require('./genModuleLess');
const darkTheme = require('@ant-design/dark-theme');
const { winPath } = require('umi-utils');
const getVariable = require('./getVariable');
const hash = require('hash.js');
const rimraf = require('rimraf');
const uglifycss = require('uglifycss');

const genHashCode = content =>
  hash
    .sha256()
    .update(content)
    .digest('hex');

const tempPath = winPath(path.join(__dirname, './.temp/'));

const loadAntd = async ignoreAntd => {
  try {
    if (!ignoreAntd) {
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
            {
              mode: 33279,
            },
          );
        });
        return true;
      }
    }
    // eslint-disable-next-line no-empty
  } catch (error) {}

  fs.writeFileSync(
    path.join(tempPath, './antd.less'),
    `@import '../color/bezierEasing';
@import '../color/colorPalette';
@import "../color/tinyColor";
    `,
    {
      mode: 33279,
    },
  );
  return false;
};

const loadAntdProLayout = async ignoreProLayout => {
  try {
    if (!ignoreProLayout) {
      const LayoutPath = require.resolve('@ant-design/pro-layout');
      if (fs.existsSync(LayoutPath)) {
        await loopAllLess(path.resolve(path.join(LayoutPath, '../../es/')), []).then(content => {
          fs.writeFileSync(
            path.join(tempPath, '/layout.less'),
            `@import 'antd';
    ${content}
        `,
            {
              mode: 33279,
            },
          );
        });
        return true;
      }
    }
    // eslint-disable-next-line no-empty
  } catch (error) {}

  fs.writeFileSync(path.join(tempPath, '/layout.less'), "@import 'antd';", {
    mode: 33279,
  });
  return false;
};

const getModifyVars = (theme = 'light', modifyVars, disableExtendsDark) => {
  try {
    if (theme === 'dark') {
      return {
        ...(disableExtendsDark ? {} : darkTheme.default),
        ...modifyVars,
      };
    }
    return { ...modifyVars };
  } catch (error) {
    throw error;
  }
};

const getOldFile = filePath => {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath);
  }
  return false;
};

let isEqual = false;

const genProjectLess = (filePath, { isModule, cache, ignoreAntd, ignoreProLayout }) =>
  genModuleLess(filePath, isModule).then(async content => {
    if (cache === false) {
      rimraf.sync(tempPath);
    }
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath, { mode: 33279 });
    }

    const tempFilePath = winPath(path.join(tempPath, 'temp.less'));

    // 获取新旧文件的 hash
    const newFileHash = genHashCode(content);

    const oldFileHash = genHashCode(getOldFile(tempFilePath));
    if (newFileHash === oldFileHash) {
      isEqual = true;
      // 无需重复生成
      return true;
    }

    fs.writeFileSync(tempFilePath, content, {
      mode: 33279,
    });

    try {
      const lessContent = await getVariable(
        tempFilePath,
        fs.readFileSync(tempFilePath),
      ).then(result => result.content.toString());
      fs.writeFileSync(
        winPath(path.join(tempPath, 'pro.less')),
        `@import 'layout';
${lessContent}`,
        {
          mode: 33279,
        },
      );
    } catch (error) {
      console.log(error.name, error.file, `line: ${error.line}`);
    }

    await loadAntd(ignoreAntd);
    await loadAntdProLayout(ignoreProLayout);
    return true;
  });

const modifyVarsArrayPath = path.join(tempPath, 'modifyVarsArray.json');

const modifyVarsIsEqual = (modifyVarsArray = '') => {
  const modifyVarsArrayString = JSON.stringify(modifyVarsArray);

  const old = getOldFile(modifyVarsArrayPath);
  if (old && genHashCode(old) === genHashCode(modifyVarsArrayString) && isEqual) {
    console.log('📸  less and modifyVarsArray is equal!');
    return true;
  }

  return false;
};

const renderLess = (theme, modifyVars, { min = true, disableExtendsDark = false }) => {
  const proLess = winPath(path.join(tempPath, './pro.less'));
  if (!fs.existsSync(proLess)) {
    return '';
  }
  return (
    less
      .render(fs.readFileSync(proLess, 'utf-8'), {
        modifyVars: getModifyVars(theme, modifyVars, disableExtendsDark),
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

const build = async (cwd, modifyVarsArray, propsOption = { isModule: true, cache: true }) => {
  isEqual = false;
  const defaultOption = { isModule: true, cache: true };
  const option = {
    ...defaultOption,
    ...propsOption,
  };
  try {
    await genProjectLess(cwd, option);
    if (modifyVarsIsEqual(modifyVarsArray) && isEqual) {
      return;
    }
    const loop = async index => {
      if (!modifyVarsArray[index]) {
        return false;
      }
      const { theme, modifyVars, fileName, disableExtendsDark } = modifyVarsArray[index];
      try {
        const css = await renderLess(theme, modifyVars, {
          ...option,
          disableExtendsDark,
        });
        fs.writeFileSync(fileName, css, { mode: 33279 });
        // 写入缓存的变量值设置
        fs.writeFileSync(modifyVarsArrayPath, JSON.toString(modifyVars), {
          mode: 33279,
        });
      } catch (error) {
        console.log(error);
      }
      if (index < modifyVarsArray.length) {
        await loop(index + 1);
        return true;
      }
      return true;
    };
    // 写入缓存的变量值设置
    fs.writeFileSync(modifyVarsArrayPath, JSON.toString(modifyVarsArray), {
      mode: 33279,
    });
    await loop(0);
  } catch (error) {
    console.log(error);
  }
};

module.exports = build;
