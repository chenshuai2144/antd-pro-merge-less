const loopAllLess = require("./loopAllLess");
const fs = require("fs");

const callback = () => {
  console.log("finish");
};
loopAllLess("/Users/qixian.cs/Documents/GitHub/ant-design-pro/src/").then(
  lessArray => {
    fs.writeFileSync("./antdPro.less", lessArray.join("\n"));
    callback();
  },
  () => {
    callback();
  }
);
