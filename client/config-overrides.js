const { override, addExternalBabelPlugin } = require("customize-cra");
const { alias, aliasJest } = require("react-app-rewire-alias"); // DO NOT CONVERT TO ES6 MODULE STYLE!

const aliasMap = {
  "@components": "src/components",
  "@config": "src/config.js",
  "@assets": "src/assets",
  "@api": "src/api",
  "@utils": "src/utils",
  "@redux": "src/redux",
  "@validation": "src/validation",
  "@dict": "src/dict",
  "@pages": "src/pages",
  "@views": "src/views",
  "@vendor": "src/vendor",
};

module.exports.jest = aliasJest(aliasMap);
module.exports = override(
  alias(aliasMap),
  addExternalBabelPlugin([
    "@simbathesailor/babel-plugin-use-what-changed",
    {
      active: process.env.NODE_ENV === "development", // boolean
    },
  ])
);
