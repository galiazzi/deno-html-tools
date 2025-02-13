// import * as prettier from "npm:prettier@3.1.1";

// const resp = await prettier.format(Deno.readTextFileSync("./t.html"), {
//   parser: "html",
// });

// console.log(resp);

import * as sfc from "npm:@vue/compiler-sfc";

const { descriptor, errors } = sfc.parse(Deno.readTextFileSync("./t.html"), {});
if (errors.length) {
  console.warn(errors[0]);
}

// console.log(
//   sfc.compileTemplate({
//     source: descriptor.template?.content || "",
//     id: "123",
//     filename: "",
//   }).code,
// );

const r = sfc.compileScript(descriptor, {
  id: "1",
  inlineTemplate: true,
  // genDefaultAs: "AA",
});

console.log(r.map);
