import { parse, pooledMap, readAllSync } from "./deps.ts";
import { check, fmt, formatSource } from "./format.ts";
import { lint } from "./lint.ts";
import { getFiles } from "./util.ts";
import { getConfig } from "./config.ts";

const argv = parse(Deno.args, {
  string: ["ext", "config"],
  boolean: "check",
  default: {
    ext: "html,vue",
    check: false,
  },
});

const cmd = argv._.shift();
if (!["fmt", "lint"].includes(cmd as string)) {
  console.error(
    `\nInvalid command ${cmd}.\n\nValid commands are fmt or lint\n`,
  );
  Deno.exit(1);
}

const config = getConfig(argv?.config);

const isStdin = argv._?.[0] === "-" && cmd == "fmt";
if (isStdin) {
  const source = new TextDecoder().decode(readAllSync(Deno.stdin));
  const result = await formatSource(source, config);
  if (argv.check && source !== result) {
    Deno.exit(1);
  }
  Deno.stdout.writeSync(new TextEncoder().encode(result));
  Deno.exit(0);
}

const currentJobs = 5;
const doIt = cmd === "fmt" ? (argv.check ? check : fmt) : lint;

const results = pooledMap(
  currentJobs,
  getFiles(argv._ as string[], argv.ext),
  async (url: string) => {
    await doIt(url, config);
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
