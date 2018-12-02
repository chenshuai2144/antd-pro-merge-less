const Tokenizer = require("css-selector-tokenizer");

let input =
  ":global(a#content.active > div::first-line [data-content], a:not(:visited))";

Tokenizer.parse(input); // === expected

console.log(JSON.stringify(Tokenizer.parse(input)))
