// Type declarations for Angular NG_APP_* environment variables
// accessed via import.meta.env in the application builder.
interface ImportMeta {
  readonly env: Record<string, string | undefined>;
}
