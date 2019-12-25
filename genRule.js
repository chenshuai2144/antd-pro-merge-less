const Tokenizer = require('css-selector-tokenizer');
const genericNames = require('generic-names');

const trimNodes = nodes => {
  const firstIndex = nodes.findIndex(node => node.type !== 'spacing');
  const lastIndex = nodes
    .slice()
    .reverse()
    .findIndex(node => node.type !== 'spacing');
  return nodes.slice(firstIndex, nodes.length - lastIndex);
};

const isSpacing = node => node.type === 'spacing' || node.type === 'operator';

const isModifier = node =>
  node.type === 'pseudo-class' && (node.name === 'local' || node.name === 'global');

/**
 * 为 选择器增加前缀
 * @param {*} node
 * @param {*} param1
 */
function localizeNode(node, { mode, inside, getAlias }) {
  const newNodes = node.nodes.reduce((acc, n, index, nodes) => {
    switch (n.type) {
      case 'spacing':
        if (isModifier(nodes[index + 1])) {
          return [...acc, Object.assign({}, n, { value: '' })];
        }
        return [...acc, n];

      case 'operator':
        if (isModifier(nodes[index + 1])) {
          return [...acc, Object.assign({}, n, { after: '' })];
        }
        return [...acc, n];

      case 'pseudo-class':
        if (isModifier(n)) {
          if (inside) {
            throw Error(`A :${n.name} is not allowed inside of a :${inside}(...)`);
          }
          if (index !== 0 && !isSpacing(nodes[index - 1])) {
            throw Error(`Missing whitespace before :${n.name}`);
          }
          if (index !== nodes.length - 1 && !isSpacing(nodes[index + 1])) {
            throw Error(`Missing whitespace after :${n.name}`);
          }
          // set mode
          mode = n.name;
          return acc;
        }
        return [...acc, n];

      case 'nested-pseudo-class':
        if (n.name === 'local' || n.name === 'global') {
          if (inside) {
            throw Error(`A :${n.name}(...) is not allowed inside of a :${inside}(...)`);
          }
          return [
            ...acc,
            ...localizeNode(n.nodes[0], {
              mode: n.name,
              inside: n.name,
              getAlias,
            }).nodes,
          ];
        }
        return [
          ...acc,
          Object.assign({}, n, {
            nodes: localizeNode(n.nodes[0], { mode, inside, getAlias }).nodes,
          }),
        ];

      case 'id':
      case 'class':
        if (mode === 'local') {
          return [...acc, Object.assign({}, n, { name: getAlias(n.name) })];
        }
        return [...acc, n];

      default:
        return [...acc, n];
    }
  }, []);

  return Object.assign({}, node, { nodes: trimNodes(newNodes) });
}

const localizeSelectors = (selectors, mode, getAlias) => {
  const node = Tokenizer.parse(selectors);
  return Tokenizer.stringify(
    Object.assign({}, node, {
      nodes: node.nodes.map(n => localizeNode(n, { mode, getAlias })),
    }),
  );
};

const getValue = (messages, name) =>
  messages.find(msg => msg.type === 'icss-value' && msg.value === name);

const isRedeclared = (messages, name) =>
  messages.find(msg => msg.type === 'icss-scoped' && msg.name === name);

const genRule = (rule, options, result) => {
  const generateScopedName =
    options.generateScopedName || genericNames('[name]__[local]---[hash:base64:5]');
  const aliases = {};
  const getAlias = name => {
    if (aliases[name]) {
      return aliases[name];
    }
    // icss-value contract
    const valueMsg = getValue(result.messages, name);
    if (valueMsg) {
      aliases[valueMsg.name] = name;
      return name;
    }
    const alias = generateScopedName(name);
    aliases[name] = alias;
    // icss-scoped contract
    if (isRedeclared(result.messages, name)) {
      result.warn(`'${name}' already declared`, { node: rule });
    }
    return alias;
  };
  try {
    // 如果为 less mixin  variable  params 不需要处理
    const selector = localizeSelectors(
      rule.selector,
      options.mode === 'global' ? 'global' : 'local',
      getAlias,
    );
    if (selector) {
      if (selector.includes(':global(')) {
        // converted :global(.className）
        const className = selector.match(/:global\((\S*)\)/)[1];
        rule.selector = className;
      } else {
        rule.selector = selector;
      }
      rule.selector = selector;
    } else {
      // selector 为空，说明是个 :global{}
      // 从他的父节点中删除他，并且插入他的子节点
      // 这个写法是因为 css 与 less 的不同导致的，
      // 因为 css 下会是 :golbal .classname,但是 less 是 :golbal{.classname}
      // 直接 selector 删除会出现问题
      rule.replaceWith(rule.nodes);
      return;
    }
  } catch (e) {
    throw rule.error(e.message);
  }
};

module.exports = genRule;
