const less = require('less');
const fs = require('fs');
const path = require('path');

module.exports = async function(context, req) {
  try {
    const body = await less
      .render(fs.readFileSync('./color/antdPro.less', 'utf-8'), {
        modifyVars: req.query,
        javascriptEnabled: true,
        filename: path.resolve('./color/antdPro.less'),
      })
      .then(out => out.css);
    context.res = {
      body,
    };
  } catch (error) {
    context.res = {
      status: 400,
      body: error.message,
    };
  }
};
