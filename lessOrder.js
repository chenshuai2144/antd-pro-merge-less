// order:
// 0. other/**/index.less
// 1. other/**.less
// 2. site/theme/**/index.less
// 3. site/theme/**.less
const lessOrder = filename => {
  let order = 0;
  if (filename.includes('index.less')) {
    order += 1;
  }
  if (!filename.includes('site/theme')) {
    order += 2;
  }
  return order;
};

module.exports = lessOrder;
