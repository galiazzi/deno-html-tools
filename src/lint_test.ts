import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.148.0/testing/asserts.ts";
import { denoLint, lint, lintSourceAsJson } from "./lint.ts";

Deno.test("lint-error", async () => {
  await assertRejects(() => denoLint(`const a = "test";`));
});

Deno.test("lint", async () => {
  await denoLint(`// deno-lint-ignore-file\nconst a = "test";`);
});

Deno.test("lint with config", async () => {
  const tmpFile = Deno.makeTempFileSync();
  Deno.writeTextFileSync(
    tmpFile,
    JSON.stringify({
      lint: {
        rules: {
          exclude: ["no-unused-vars"],
        },
      },
    }),
  );
  await denoLint(`const a = "test";`, { config: tmpFile });
});

Deno.test("lint-json", async () => {
  assertEquals({
    "diagnostics": [
      {
        "range": {
          "start": {
            "line": 1,
            "col": 6,
            "bytePos": 6,
          },
          "end": {
            "line": 1,
            "col": 7,
            "bytePos": 7,
          },
        },
        "filename": "_stdin.ts",
        "message": "`a` is never used",
        "code": "no-unused-vars",
        "hint":
          "If this is intentional, prefix it with an underscore like `_a`",
      },
    ],
    "errors": [],
  }, JSON.parse(await denoLint(`const a = "test";`, { json: true })));

  assertEquals({
    "diagnostics": [],
    "errors": [
      {
        "file_path": "_stdin.ts",
        "message": "Expected ';', '}' or <eof> at _stdin.ts:1:4",
      },
    ],
  }, JSON.parse(await denoLint(`co a = "test";`, { json: true })));
});

Deno.test("lint-html", async () => {
  const tmpFile = Deno.makeTempFileSync();
  const origin = `
  <template>
    <div></div>
  </template>
  <script>
    const a = "test";
    console.log(a);
  </script>
  `;
  Deno.writeTextFileSync(tmpFile, origin);
  await lint(tmpFile);
});

Deno.test("lint-html-to-json", async () => {
  const origin = `
  <template>
    <div></div>
  </template>
  <script>
    const a = "test";
  </script>
  `;

  assertEquals({
    "diagnostics": [{
      code: "no-unused-vars",
      filename: "_stdin.ts",
      hint: "If this is intentional, prefix it with an underscore like `_a`",
      message: "`a` is never used",
      range: {
        end: {
          bytePos: 66,
          col: 11,
          line: 6,
        },
        start: {
          bytePos: 65,
          col: 10,
          line: 6,
        },
      },
    }],
    "errors": [],
  }, JSON.parse(await lintSourceAsJson(origin)));
});

Deno.test("lint-multi-scripts-to-json", async () => {
  const origin = `
  <script>
    const a = "test";
  </script>
  <template>
    <div><script>
    const a = "test";
  </script></div>
  </template>
  <script>
    const a = "test";
  </script><script>
  co a = "test";
</script>
  `;
  const result = JSON.parse(await lintSourceAsJson(origin));
  assertEquals(result.errors, [{
    file_path: "_stdin.ts",
    message: "Expected ';', '}' or <eof> at _stdin.ts:2:6",
  }]);

  assertEquals(result.diagnostics[0].range, {
    end: { bytePos: 23, col: 11, line: 3 },
    start: { bytePos: 22, col: 10, line: 3 },
  });
  assertEquals(result.diagnostics[1].range, {
    end: { bytePos: 88, col: 11, line: 7 },
    start: { bytePos: 87, col: 10, line: 7 },
  });
  assertEquals(result.diagnostics[2].range, {
    end: { bytePos: 153, col: 11, line: 11 },
    start: { bytePos: 152, col: 10, line: 11 },
  });
});
