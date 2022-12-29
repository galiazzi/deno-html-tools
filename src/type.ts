export interface DenoOptions {
  config?: string;
}

export interface DenoFmtOptions extends DenoOptions {
  check?: boolean;
}

export interface DenoLintOptions extends DenoOptions {
  json?: boolean;
}
