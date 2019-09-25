const deleteRelativePath = array => array.filter(file => !file.includes('~@'));

module.exports = deleteRelativePath;
