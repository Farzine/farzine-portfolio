import { spawn } from "node:child_process";
import { createNextSnapshot } from "../tests/helpers/next-server";
const snapshot = createNextSnapshot(3101, {
  NODE_ENV: "production",
  PORTFOLIO_DEMO_MODE: "true",
});
let closing = false;
let child = spawn(
  process.execPath,
  [snapshot.cli, "build", "--webpack"],
  snapshot.options,
);
process.on("SIGTERM", () => {
  closing = true;
  child.kill("SIGTERM");
});
process.on("SIGINT", () => {
  closing = true;
  child.kill("SIGTERM");
});
child.once("exit", (code) => {
  if (closing || code !== 0) {
    snapshot.remove();
    process.exit(code ?? 1);
  }
  child = spawn(
    process.execPath,
    [snapshot.cli, "start", "--hostname", "127.0.0.1", "--port", "3101"],
    snapshot.options,
  );
  child.once("exit", (code) => {
    snapshot.remove();
    process.exit(code ?? 0);
  });
});
