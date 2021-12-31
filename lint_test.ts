import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.119.0/testing/asserts.ts";
import { denoLint, lint } from "./lint.ts";

Deno.test("lint-error", async () => {
  await assertRejects(() => denoLint(`const a = "test";`));
});

Deno.test("lint", async () => {
  await denoLint(`// deno-lint-ignore-file\nconst a = "test";`);
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
