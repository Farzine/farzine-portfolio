import { spawn, spawnSync } from "node:child_process";

const command = process.argv[2];
if (!["dev", "build", "test:e2e", "test:e2e:admin"].includes(command))
  throw new Error("Choose dev, build, test:e2e or test:e2e:admin.");
const result = spawnSync("npx", ["supabase", "status", "--output", "json"], {
  encoding: "utf8",
});
if (result.status !== 0)
  throw new Error(
    "Local Supabase is unavailable. Run npx supabase start first.",
  );
const config = JSON.parse(result.stdout);
const url = config.API_URL;
const key = config.PUBLISHABLE_KEY || config.ANON_KEY;
if (!url || !key || !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
  throw new Error("Expected the loopback development Supabase stack.");
const child = spawn("npm", ["run", command], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
    PORTFOLIO_USE_DEV_SEED: "false",
  },
});
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
