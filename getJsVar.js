/* eslint-disable */
const postcss = require('postcss');
const syntax = require('postcss-less');
const uniqBy = require('lodash.uniqby');
const fileNameList = [];

function discardAndReport(less, result) {
  function discardEmpty(node) {
    const { type, nodes: sub } = node;

    if (sub) {
      node.each(discardEmpty);
    }

    if (
      (type === 'decl' && !node.value) ||
      ((type === 'rule' && !node.selector) || (sub && !sub.length)) ||
      (type === 'atrule' && ((!sub && !node.params) || (!node.params && !sub.length)))
    ) {
      node.remove();

      result.messages.push({
        type: 'removal',
        plugin: 'postcss-discard-empty',
        node,
      });
    }
  }

  less.each(discardEmpty);
}
const LocalIdentNamePlugin = postcss.plugin('LocalIdentNamePlugin', options => {
  let lessContent = [];
  return (less, result) => {
    less.walkAtRules(atRule => {
      if (!atRule.variable) {
        atRule.remove();
      }
      if (
        atRule.variable &&
        !atRule.name.includes('ant-prefix') &&
        !atRule.name.includes('prefix-cls') &&
        !atRule.params.includes('ant-prefix')
      ) {
        lessContent.push(`@${atRule.name}:${atRule.params}`);
      }
    });

    less.walkComments(decls => {
      decls.remove();
    });
    discardAndReport(less, result);
    result.variable = lessContent.join(';');
  };
});

const getJsVar = (lessPath, lessText) => {
  lessPath = lessPath;
  return postcss([LocalIdentNamePlugin()])
    .process(lessText, {
      from: lessPath,
      syntax,
    })
    .then(result => {
      result.messages = uniqBy(fileNameList);
      return result;
    });
};

module.exports = getJsVar;
