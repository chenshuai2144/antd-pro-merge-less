const deleteRelativePath = array => {
  return array.filter(file => !file.includes("~@"));
};

module.exports = deleteRelativePath;
