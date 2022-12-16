import { parse, pooledMap, readAllSync } from "./deps.ts";
import { check, fmt, formatSource } from "./format.ts";
import { lint, lintSourceAsJson } from "./lint.ts";
import { getFiles } from "./util.ts";

const argv = parse(Deno.args, {
  string: "ext",
  boolean: "check",
  default: {
    ext: "html,vue",
    check: false,
  },
});

const cmd = argv._.shift();
if (!["fmt", "lint"].includes(cmd as string)) {
  console.error(
    `\nInvalid command ${cmd || ""}\n\nValid commands are fmt or lint\n`,
  );
  Deno.exit(1);
}

const isStdin = argv._?.[0] === "-";
if (isStdin) {
  const result = (cmd === "fmt")
    ? await formatSource(
      new TextDecoder().decode(readAllSync(Deno.stdin)),
      argv.check,
    )
    : await lintSourceAsJson(
      new TextDecoder().decode(readAllSync(Deno.stdin)),
    );
  Deno.stdout.writeSync(new TextEncoder().encode(result));
  Deno.exit(0);
}

const currentJobs = 5;
const doIt = cmd === "fmt" ? (argv.check ? check : fmt) : lint;

const results = pooledMap(
  currentJobs,
  getFiles(argv._ as string[], argv.ext),
  async (url: string) => {
    await doIt(url);
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
