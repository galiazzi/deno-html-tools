import { posix } from "./deps.ts";
import { DenoConfig } from "./type.ts";

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
  config: DenoConfig,
): FilesFilter {
  const cfg = config?.[cmd];

  return {
    exclude: cfg?.exclude?.map((e) => posix.resolve(e)),
    include: cfg?.include?.map((e) => posix.resolve(e)),
  };
}
