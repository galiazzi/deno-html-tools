import { assertEquals } from "https://deno.land/std@0.193.0/testing/asserts.ts";
import { denoFmt, fmt } from "./format.ts";

Deno.test("format", async () => {
  assertEquals(`const a = "test";\n`, await denoFmt(`const a = 'test';`));
});

Deno.test("format with config", async () => {
  const tmpFile = Deno.makeTempFileSync();
  Deno.writeTextFileSync(
    tmpFile,
    JSON.stringify({
      fmt: {
        options: {
          singleQuote: true,
        },
      },
    }),
  );
  assertEquals(
    `const a = 'test';\n`,
    await denoFmt(`const a = "test";`, { config: tmpFile }),
  );
});

Deno.test("format", async () => {
  const tmpFile = Deno.makeTempFileSync();
  const origin = `
  <template>
    <div></div>
  </template>
  <script>
    const a = 'test';
    console.log(a);
  </script>
  `;
  Deno.writeTextFileSync(tmpFile, origin);
  await fmt(tmpFile);
  console.log(tmpFile);
  const result = `<template>
  <div></div>
</template>
<script>
const a = "test";
console.log(a);
</script>`;
  assertEquals(result, Deno.readTextFileSync(tmpFile));
});

Deno.test("format multiple", async () => {
  const tmpFile = Deno.makeTempFileSync();
  const origin = `
  <script>
    const a = 'test';
    console.log(a);
  </script>

  <script>
    const b = 'test_b';
      console.log(b);
  </script>
  `;
  Deno.writeTextFileSync(tmpFile, origin);
  await fmt(tmpFile);

  const result = `<script>
const a = "test";
console.log(a);
</script>

<script>
const b = "test_b";
console.log(b);
</script>`;
  assertEquals(result, Deno.readTextFileSync(tmpFile));
});

Deno.test("format with script attributes", async () => {
  const tmpFile = Deno.makeTempFileSync();
  const origin = `
  <script type="test" other="foo">
    console.log('test');
  </script>
  `;
  Deno.writeTextFileSync(tmpFile, origin);
  await fmt(tmpFile);

  const result = `<script type="test" other="foo">
console.log("test");
</script>`;
  assertEquals(result, Deno.readTextFileSync(tmpFile));
});
