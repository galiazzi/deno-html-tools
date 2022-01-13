# deno-html-tools

![ci](https://github.com/galiazzi/deno-html-tools/actions/workflows/ci.yaml/badge.svg)

Command line tool to use deno fmt and lint in html-like files. The tool finds
any content inside `script` tags and processes the content with deno fmt / lint.

By default, all files with the extension `.html` or `.vue` will be processed.

Formating in current folder

```
deno run --allow-read --allow-run --allow-write https://raw.githubusercontent.com/galiazzi/deno-html-tools/main/src/index.ts fmt
```

## Examples

Formatting files in current folder

```
$ deno run --allow-read --allow-run --allow-write src/index.ts fmt .
```

Formatting check

```
$ deno run --allow-read --allow-run src/index.ts fmt --check .
```

Specifying file extensions

```
$ deno run --allow-read --allow-run src/index.ts fmt --check --ext=html,vue .
```

Linting check

```
$ deno run --allow-read --allow-run src/index.ts lint .
```
