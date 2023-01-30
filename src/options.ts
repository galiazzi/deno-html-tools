import { DenoConfig, JsBeautify, Options } from "./type.ts";
import { JSONC } from "./deps.ts";

export const defaultOptions: Options = {
  jsBeautify: {
    indent_with_tabs: false,
    indent_size: 2,
    indent_char: " ",
    wrap_line_length: 80,
    indent_scripts: "keep",
    html: {
      js: {
        templating: "auto",
        end_with_newline: false,
      },
    },
  },
};

export function getOptions(denoConfigFile?: string): Options {
  const options = structuredClone(defaultOptions) as Options;

  if (!denoConfigFile) {
    return options;
  }

  options.config = denoConfigFile;

  options.denoConfig = JSONC.parse(Deno.readTextFileSync(denoConfigFile));
  if (!options.denoConfig?.fmt) {
    return options;
  }

  options.jsBeautify = toBeautify(options.denoConfig);

  return options;
}

export function toBeautify(config: DenoConfig): JsBeautify {
  const fmtOptions = config.fmt?.options;
  return {
    indent_with_tabs: fmtOptions?.useTabs || false,
    indent_size: fmtOptions?.indentWidth || 2,
    indent_char: " ",
    wrap_line_length: fmtOptions?.lineWidth || 80,
    indent_scripts: "keep",
    html: {
      js: {
        templating: "auto",
        end_with_newline: false,
      },
    },
  };
}
