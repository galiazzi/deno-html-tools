import { diff } from "./diff.ts";
import { Options } from "./type.ts";
import { REGEX_SCRIPT } from "./util.ts";
import { jsBeautify } from "./deps.ts";
import { defaultOptions } from "./options.ts";

export class InvalidFormatError extends Error {
  constructor(public originSource: string, public resultSource: string) {
    super("Invalid Format");
  }
}

export async function denoFmt(source: string, options: Options = {}) {
  const cmd = [Deno.execPath(), "fmt", "-"];
  if (options.config) {
    cmd.splice(2, 0, `--config=${options.config}`);
  }

  // deno-lint-ignore no-deprecated-deno-api
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

  if (code === 0) {
    return new TextDecoder().decode(rawOutput);
  }

  throw new Error(new TextDecoder().decode(rawError));
}

export async function formatSource(
  source: string,
  options: Options = {},
) {
  source = jsBeautify.html(
    source,
    options.jsBeautify || defaultOptions.jsBeautify,
  );

  const parts: string[] = [];
  let lastPos = 0;
  for (const t of source.matchAll(REGEX_SCRIPT)) {
    const scriptSource = t.at(2)?.trim() as string;
    const newSource = await denoFmt(scriptSource, options);
    if (newSource.trim() == scriptSource) {
      continue;
    }

    // if (options.check) {
    //   throw new InvalidFormatError(scriptSource, newSource.trim());
    // }

    parts.push(source.substring(lastPos, t.index));
    lastPos = (t.index || 0) + (t.at(0)?.length || 0);
    const attributes = t.at(1) ? ` ${t.at(1)}` : "";
    parts.push(`<script${attributes}>\n${newSource}</script>`);
  }

  // if (!parts.length) {
  //   return source;
  // }

  if (lastPos < source.length) {
    parts.push(source.substring(lastPos));
  }

  return parts.join("");
}

export async function fmt(path: string, options: Options = {}) {
  const source = Deno.readTextFileSync(path);
  const result = await formatSource(source, { ...options, check: false });
  if (source === result) {
    return;
  }
  Deno.writeTextFileSync(path, result);
  console.log(path);
}

export async function check(path: string, options: Options = {}) {
  const source = Deno.readTextFileSync(path);
  try {
    const result = await formatSource(source, { ...options, check: false });
    if (source !== result) {
      throw new InvalidFormatError(source, result);
    }
  } catch (e) {
    console.log(`from: ${path}`);
    if (e instanceof InvalidFormatError) {
      diff(e.originSource, e.resultSource);
      Deno.exit(1);
    }
    throw e;
  }
}
