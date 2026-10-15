import { startSupabaseFixture } from "../tests/helpers/supabase-fixture";
import { startIsolatedNext } from "../tests/helpers/next-server";
let ready = false;
const fixture = await startSupabaseFixture(54399, async () => {
  if (!ready) return;
  const response = await fetch("http://127.0.0.1:3102/test-cache-reset", {
    method: "POST",
  });
  if (!response.ok) throw new Error("Test cache reset failed.");
});
const child = startIsolatedNext(3102, {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54399",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test-only",
  SUPABASE_SECRET_KEY: "sb_secret_test-only",
  PORTFOLIO_DEMO_MODE: "false",
});
ready = true;
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  child.kill("SIGTERM");
  await fixture.close();
}
process.on("SIGTERM", () => void close());
process.on("SIGINT", () => void close());
child.once("exit", (code) => {
  if (!closing) {
    closing = true;
    void fixture.close().then(() => process.exit(code ?? 1));
  }
});
