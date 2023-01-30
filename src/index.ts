import { parse, pooledMap, posix, readAllSync } from "./deps.ts";
import { check, fmt, formatSource } from "./format.ts";
import { lint, lintSourceAsJson } from "./lint.ts";
import { getOptions } from "./options.ts";
import { getFiles, readDenoFilesConfig } from "./util.ts";

const argv = parse(Deno.args, {
  string: ["ext", "config"],
  boolean: "check",
  default: {
    ext: "html,vue",
    check: false,
  },
});

const cmd = argv._.shift() as "fmt" | "lint";
if (!["fmt", "lint"].includes(cmd as string)) {
  console.error(
    `\nInvalid command ${cmd || ""}\n\nValid commands are fmt or lint\n`,
  );
  Deno.exit(1);
}

if (argv.config) {
  argv.config = posix.resolve(argv.config);
}
const options = getOptions(argv.config);

const isStdin = argv._?.[0] === "-";
if (isStdin) {
  const result = (cmd === "fmt")
    ? await formatSource(
      new TextDecoder().decode(readAllSync(Deno.stdin)),
      options,
    )
    : await lintSourceAsJson(
      new TextDecoder().decode(readAllSync(Deno.stdin)),
      options,
    );
  Deno.stdout.writeSync(new TextEncoder().encode(result));
  Deno.exit(0);
}

const currentJobs = 5;
const doIt = cmd === "fmt" ? (argv.check ? check : fmt) : lint;

const filesFilter = options.denoConfig
  ? readDenoFilesConfig(cmd, options.denoConfig)
  : undefined;

const results = pooledMap(
  currentJobs,
  getFiles(argv._ as string[], argv.ext, filesFilter),
  async (url: string) => {
    await doIt(url, options);
  },
);
try {
  let tot = 0;
  while (!(await results.next()).done) {
    tot++;
  }
  console.log(`Checked ${tot} files`);
} catch (e) {
  if (e instanceof AggregateError) {
    console.error(e.errors);
  } else {
    throw e;
  }
}
