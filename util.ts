import { posix } from "./deps.ts";

export const REGEX_SCRIPT = /<script ?([^>]*)>(.*)<\/script>/gs;

async function* find(url: string, regexExt: RegExp): AsyncGenerator<string> {
  const fileInfo = await Deno.lstat(url);
  if (fileInfo.isDirectory) {
    for (const f of Deno.readDirSync(url)) {
      yield* find(`${url}/${f.name}`, regexExt);
    }
    return;
  }
  if (regexExt.test(url)) {
    yield url;
  }
}

export async function* getFiles(paths: string[], fileExtensions: string) {
  const regexExt = new RegExp(`\.${fileExtensions.replace(/,/g, "|")}$`);
  for (const arg of paths) {
    const path = posix.resolve(arg as string);
    yield* find(path, regexExt);
  }
}
