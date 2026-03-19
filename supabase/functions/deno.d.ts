// Minimal Deno types for TS tooling in this repo.
// Supabase Edge Functions run on Deno at runtime, but our frontend TS config
// doesn't include Deno libs by default, so we declare the pieces we use.

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};


