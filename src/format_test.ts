import { assertEquals } from "https://deno.land/std@0.119.0/testing/asserts.ts";
import { denoFmt, fmt } from "./format.ts";
import { getConfig } from "./config.ts";

Deno.test("format", async () => {
  assertEquals(`const a = "test";\n`, await denoFmt(`const a = 'test';`));
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
  await fmt(tmpFile, getConfig());

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
  </script>`;
  Deno.writeTextFileSync(tmpFile, origin);
  await fmt(tmpFile, getConfig());

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
