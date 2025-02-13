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
  content_unformatted: string[];
  indent_scripts?: string;
  html?: {
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
    include?: string[];
    exclude?: string[];
  };
  lint?: {
    include?: string[];
    exclude?: string[];
  };
}
