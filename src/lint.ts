import { REGEX_SCRIPT } from "./util.ts";

export async function denoLint(source: string) {
  const p = Deno.run({
    cmd: [
      Deno.execPath(),
      "lint",
      "-",
    ],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  await p.stdin?.write(new TextEncoder().encode(source));
  p.stdin.close();

  const { code } = await p.status();

  const rawOutput = await p.output();
  const rawError = await p.stderrOutput();
  p.close();

  if (code === 0) {
    return new TextDecoder().decode(rawOutput);
  }

  throw new Error(new TextDecoder().decode(rawError));
}

export async function lintSource(source: string) {
  for (const t of source.matchAll(REGEX_SCRIPT)) {
    const scriptSource = t.at(2)?.trim() as string;
    await denoLint(scriptSource);
  }
}

export async function lint(path: string) {
  const source = Deno.readTextFileSync(path);
  try {
    await lintSource(source);
  } catch (e) {
    console.log(`from: ${path}`);
    console.error(e.message);
    Deno.exit(1);
    // throw e;
  }
}
