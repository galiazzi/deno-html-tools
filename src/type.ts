export interface Options {
  check?: boolean;
  json?: boolean;
  config?: string;
  denoConfig?: DenoConfig;
  jsBeautify?: JsBeautify;
}

export interface JsBeautify {
  indent_with_tabs: boolean;
  indent_size: number;
  indent_char: string;
  wrap_line_length: number;
  indent_scripts: string;
  html: {
    js: {
      templating: string;
      end_with_newline: boolean;
    };
  };
}

export interface DenoConfig {
  fmt?: {
    options?: {
      useTabs?: boolean;
      lineWidth?: number;
      indentWidth?: number;
      singleQuote?: boolean;
      proseWrap?: string;
    };
    files?: {
      include?: string[];
      exclude?: string[];
    };
  };
  lint?: {
    files?: {
      include?: string[];
      exclude?: string[];
    };
  };
}
