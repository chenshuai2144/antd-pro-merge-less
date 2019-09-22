const fs = require('fs-extra');

const replaceDefaultLess = lessPath => {
  const fileContent = fs.readFileSync(lessPath).toString();
  return fileContent;
};
module.exports = replaceDefaultLess;
