import { startIsolatedNext } from "../tests/helpers/next-server";
const child = startIsolatedNext(3100, { PORTFOLIO_DEMO_MODE: "true" });
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGTERM"));
child.once("exit", (code) => process.exit(code ?? 1));
