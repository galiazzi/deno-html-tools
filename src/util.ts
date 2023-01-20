import { JSONC, posix } from "./deps.ts";

export const REGEX_SCRIPT = /<script ?([^>]*)>(.*?)<\/script>/gs;

interface FilesFilter {
  include?: string[];
  exclude?: string[];
}

async function* find(
  url: string,
  regexExt: RegExp,
  filesFilter?: FilesFilter,
): AsyncGenerator<string> {
  const fileInfo = await Deno.lstat(url);
  if (fileInfo.isDirectory) {
    for (const f of Deno.readDirSync(url)) {
      yield* find(`${url}/${f.name}`, regexExt, filesFilter);
    }
    return;
  }
  if (regexExt.test(url)) {
    if (filesFilter?.include) {
      for (const e of filesFilter.include) {
        if (!url.startsWith(e)) {
          return;
        }
      }
    }
    if (filesFilter?.exclude) {
      for (const e of filesFilter.exclude) {
        if (url.startsWith(e)) {
          return;
        }
      }
    }
    yield url;
  }
}

export async function* getFiles(
  paths: string[],
  fileExtensions: string,
  filesFilter?: FilesFilter,
) {
  const regexExt = new RegExp(`\\.(${fileExtensions.replace(/,/g, "|")})$`);
  if (!paths.length) {
    paths.push(".");
  }
  for (const arg of paths) {
    const path = posix.resolve(arg as string);
    yield* find(path, regexExt, filesFilter);
  }
}

export function readDenoFilesConfig(
  cmd: "fmt" | "lint",
  configUrl: string,
): FilesFilter {
  const config = JSONC.parse(Deno.readTextFileSync(configUrl))?.[cmd]
    ?.files as FilesFilter;
  config.exclude = config.exclude?.map((e) => posix.resolve(e));
  config.include = config.include?.map((e) => posix.resolve(e));
  return config;
}
