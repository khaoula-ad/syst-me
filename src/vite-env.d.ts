/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GMAIL_CLIENT_ID: string;
  readonly VITE_GMAIL_CLIENT_SECRET: string;
  readonly VITE_GMAIL_REFRESH_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
