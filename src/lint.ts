import { Options } from "./type.ts";
import { REGEX_SCRIPT } from "./util.ts";

export async function denoLint(source: string, options: Options = {}) {
  const cmd = ["lint", "-"];
  if (options.json) {
    cmd.splice(1, 0, "--json");
  }
  if (options.config) {
    cmd.splice(1, 0, `--config=${options.config}`);
  }

  const p = new Deno.Command(Deno.execPath(), {
    args: cmd,
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  }).spawn();

  ReadableStream.from(source).pipeThrough(new TextEncoderStream()).pipeTo(
    p.stdin,
  );

  const { code, stdout, stderr } = await p.output();

  if (code === 0 || options.json) {
    return new TextDecoder().decode(stdout);
  }

  throw new Error(new TextDecoder().decode(stderr));
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
    // @ts-ignore trust me
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
