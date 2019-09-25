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
      if (
        (node.selector && (node.toString().includes('(') && node.selector.indexOf('.') === 0)) ||
        (node.toString().includes('@') && !node.toString().includes('{'))
      ) {
        // should have same code
        node.fileNameList = '';
      } else {
        node.remove();
      }

      result.messages.push({
        type: 'removal',
        plugin: 'postcss-discard-empty',
        node,
      });
    }
  }

  less.each(discardEmpty);
}
const LocalIdentNamePlugin = postcss.plugin('LocalIdentNamePlugin', () => (less, result) => {
  less.walkAtRules(atRule => {
    if (atRule.import) {
      atRule.remove();
    }
  });
  less.walkDecls(decls => {
    const content = decls.toString();
    if (
      (!content.includes('@') && !content.includes('border')) ||
      (content.includes('padding') || content.includes('margin'))
    ) {
      decls.remove();
    }
  });
  less.walkComments(decls => {
    decls.remove();
  });
  discardAndReport(less, result);
});

const getVariable = (lessPath, lessText) =>
  postcss([LocalIdentNamePlugin()])
    .process(lessText, {
      from: lessPath,
      syntax,
    })
    .then(result => {
      // eslint-disable-next-line no-param-reassign
      result.messages = uniqBy(fileNameList);
      return result;
    });

module.exports = getVariable;
