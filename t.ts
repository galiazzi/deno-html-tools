import { jsBeautify } from "./src/deps.ts";

const source = jsBeautify.html(
  Deno.readTextFileSync("./t.html"),
  {
    indent_with_tabs: false,
    indent_size: 2,
    indent_char: " ",
    wrap_line_length: 80,
    indent_scripts: "keep",
    content_unformatted: ["script"],
    // html: {
    //   js: {
    //     templating: "none",
    //     end_with_newline: false,
    //   },
    // },
  },
);

console.log(source);
