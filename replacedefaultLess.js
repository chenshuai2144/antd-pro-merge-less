const fs = require('fs-extra');

const replacedefaultLess = lessPath => {
  const fileContent = fs.readFileSync(lessPath).toString();
  return fileContent;
};
module.exports = replacedefaultLess;
