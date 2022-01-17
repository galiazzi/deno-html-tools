export interface FmtConfig {
  useTabs: boolean;
  lineWidth: number;
  indentWidth: number;
  singleQuote: boolean;
  // deno-lint-ignore no-explicit-any
  beautify: any;
}

const defaultConfig: FmtConfig = {
  useTabs: false,
  lineWidth: 80,
  indentWidth: 2,
  singleQuote: false,
  beautify: {
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

export function getConfig(denoConfigFile?: string): FmtConfig {
  if (!denoConfigFile) {
    return defaultConfig;
  }

  const dcfg = JSON.parse(Deno.readTextFileSync(denoConfigFile));
  if (!dcfg.fmt) {
    return defaultConfig;
  }
  const cfg = dcfg.fmt;
  cfg.beautify = toBeautify(cfg);
  return cfg;
}

export function toBeautify(config: FmtConfig) {
  return {
    indent_with_tabs: config.useTabs,
    indent_size: config.indentWidth,
    indent_char: " ",
    wrap_line_length: config.lineWidth,
    indent_scripts: "keep",
    html: {
      js: {
        templating: "auto",
        end_with_newline: false,
      },
    },
  };
}
