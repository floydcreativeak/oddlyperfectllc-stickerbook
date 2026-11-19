interface ImportMetaEnv {
  /** "true" on GitHub Pages preview builds (set by the deploy workflow). */
  readonly PUBLIC_PREVIEW?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }
