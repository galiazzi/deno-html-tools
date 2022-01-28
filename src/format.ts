import { diff } from "./diff.ts";
import { REGEX_SCRIPT } from "./util.ts";
import { jsBeautify } from "./deps.ts";
import { FmtConfig } from "./config.ts";

export async function denoFmt(source: string, config?: FmtConfig) {
  const cmd = [Deno.execPath(), "fmt"];
  if (config) {
    cmd.push(
      `--options-indent-width=${config.indentWidth}`,
      `--options-line-width=${config.lineWidth}`,
    );
    config.singleQuote && cmd.push("--options-single-quote");
    config.useTabs && cmd.push("--options-use-tabs");
  }
  cmd.push("-");
  console.log(cmd);

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

export async function formatSource(source: string, config: FmtConfig) {
  source = jsBeautify.html(source, config.beautify);

  const parts: string[] = [];
  let lastPos = 0;
  for (const t of source.matchAll(REGEX_SCRIPT)) {
    const scriptSource = t.at(2)?.trim() as string;
    const newSource = await denoFmt(scriptSource, config);
    if (newSource.trim() == scriptSource) {
      continue;
    }

    parts.push(source.substring(lastPos, t.index));
    lastPos = (t.index || 0) + (t.at(0)?.length || 0);
    parts.push(`<script>\n${newSource}</script>`);
  }

  if (!parts.length) {
    return source;
  }

  if (lastPos < source.length) {
    parts.push(source.substring(lastPos));
  }

  return parts.join("");
}

export async function fmt(path: string, config: FmtConfig) {
  const source = Deno.readTextFileSync(path);
  const result = await formatSource(source, config);
  if (source === result) {
    return;
  }
  Deno.writeTextFileSync(path, result);
  console.log(path);
}

export async function check(path: string, config: FmtConfig) {
  const source = Deno.readTextFileSync(path);
  const result = await formatSource(source, config);
  if (source !== result) {
    console.log(`from: ${path}`);
    diff(source, result);
    Deno.exit(1);
  }
}
