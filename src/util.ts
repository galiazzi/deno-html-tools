import { isGlob } from "jsr:@std/path@1.0.2/is-glob";
import { posix } from "./deps.ts";
import { DenoConfig } from "./type.ts";
import { globToRegExp } from "jsr:@std/path@1.0.2/posix/glob-to-regexp";

export const REGEX_SCRIPT = /<script ?([^>]*)>(.*?)<\/script>/gs;

interface FilesFilter {
  include?: (string | RegExp)[];
  exclude?: (string | RegExp)[];
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
        if (e instanceof RegExp) {
          if (!e.test(url)) {
            return;
          }
        } else if (!url.startsWith(e)) {
          return;
        }
      }
    }
    if (filesFilter?.exclude) {
      for (const e of filesFilter.exclude) {
        if (e instanceof RegExp) {
          if (e.test(url)) {
            return;
          }
        } else if (url.startsWith(e)) {
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

  const mapCofig = (e: string) =>
    isGlob(e) ? globToRegExp(e) : posix.resolve(e);

  return {
    exclude: cfg?.exclude?.map(mapCofig),
    include: cfg?.include?.map(mapCofig),
  };
}
