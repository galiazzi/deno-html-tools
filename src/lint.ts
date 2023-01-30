import { Options } from "./type.ts";
import { REGEX_SCRIPT } from "./util.ts";

export async function denoLint(source: string, options: Options = {}) {
  const cmd = [Deno.execPath(), "lint", "-"];
  if (options.json) {
    cmd.splice(2, 0, "--json");
  }
  if (options.config) {
    cmd.splice(2, 0, `--config=${options.config}`);
  }
  const p = Deno.run({
    cmd,
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

  if (code === 0 || options.json) {
    return new TextDecoder().decode(rawOutput);
  }

  throw new Error(new TextDecoder().decode(rawError));
}

export async function lintSourceAsJson(
  source: string,
  options: Options = {},
) {
  const result: DenoLint = {
    diagnostics: [],
    errors: [],
  };
  for (const t of source.matchAll(REGEX_SCRIPT)) {
    const scriptSource = t.at(2) as string;
    const lint = JSON.parse(
      await denoLint(scriptSource, { ...options, json: true }),
    ) as DenoLint;

    const linesAdd = source.substring(0, t.index).split("\n").length - 1;
    const bytesAdd = (t.index || 0) + (t.at(1)?.length || 0) +
      "<script>".length + (t.at(1) ? 1 : 0);

    lint.diagnostics.forEach((d) => {
      d.range.start.line += linesAdd;
      d.range.start.bytePos += bytesAdd;
      d.range.end.line += linesAdd;
      d.range.end.bytePos += bytesAdd;
    });

    result.diagnostics.push(...lint.diagnostics);
    result.errors.push(...lint.errors);
  }
  return JSON.stringify(result);
}

export async function lintSource(source: string, options: Options) {
  for (const t of source.matchAll(REGEX_SCRIPT)) {
    const scriptSource = t.at(2)?.trim() as string;
    await denoLint(scriptSource, options);
  }
}

export async function lint(path: string, options: Options = {}) {
  const source = Deno.readTextFileSync(path);
  try {
    await lintSource(source, options);
  } catch (e) {
    console.log(`from: ${path}`);
    console.error(e.message);
    Deno.exit(1);
    // throw e;
  }
}

export interface DenoDiagnostic {
  range: {
    start: {
      line: number;
      col: number;
      bytePos: number;
    };
    end: {
      line: number;
      col: number;
      bytePos: number;
    };
  };
  filename: string;
  message: string;
  code: string;
  hint: string | null;
}

export interface DenoError {
  file_path: string;
  message: string;
}

export interface DenoLint {
  diagnostics: DenoDiagnostic[];
  errors: DenoError[];
}
