import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { Router, type Router as ExpressRouter } from "express";
import type { PhoneCameraTunnelResponse } from "@shorir/contracts";
import { asyncHandler } from "../../middleware/asyncHandler.js";

const quickTunnelPattern = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;
let tunnelProcess: ChildProcessWithoutNullStreams | null = null;
let publicUrl: string | null = null;
let startupPromise: Promise<string> | null = null;

async function waitForTunnel(publicTunnelUrl: string) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${publicTunnelUrl}/api/health`, {
        signal: AbortSignal.timeout(2_500)
      });
      if (response.ok) {
        return;
      }
    } catch {
      // Quick-tunnel DNS can take a few seconds to propagate.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("The HTTPS tunnel was created but did not become reachable.");
}

function startQuickTunnel() {
  if (publicUrl) {
    return Promise.resolve(publicUrl);
  }
  if (startupPromise) {
    return startupPromise;
  }

  startupPromise = new Promise<string>((resolve, reject) => {
    const child = spawn("cloudflared", ["tunnel", "--url", "http://127.0.0.1:5173"], {
      windowsHide: true
    });
    tunnelProcess = child;
    let settled = false;
    let urlFound = false;
    let output = "";

    const finishWithUrl = (chunk: Buffer) => {
      output = `${output}${chunk.toString()}`.slice(-8_000);
      const match = output.match(quickTunnelPattern);
      if (!match || settled || urlFound) {
        return;
      }
      urlFound = true;
      publicUrl = match[0];
      settled = true;
      resolve(publicUrl);
    };

    child.stdout.on("data", finishWithUrl);
    child.stderr.on("data", finishWithUrl);
    child.once("error", (error) => {
      if (!settled) {
        settled = true;
        reject(new Error(`Unable to start cloudflared: ${error.message}`));
      }
    });
    child.once("exit", (code) => {
      tunnelProcess = null;
      publicUrl = null;
      startupPromise = null;
      if (!settled) {
        settled = true;
        reject(new Error(`cloudflared exited before creating a tunnel${code === null ? "." : ` (${code}).`}`));
      }
    });

    setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill();
        tunnelProcess = null;
        startupPromise = null;
        reject(new Error("Timed out while creating the phone camera tunnel."));
      }
    }, 35_000).unref();
  });

  return startupPromise;
}

function stopTunnel() {
  tunnelProcess?.kill();
  tunnelProcess = null;
  publicUrl = null;
}

process.once("exit", stopTunnel);
process.once("SIGINT", () => {
  stopTunnel();
  process.exit(0);
});
process.once("SIGTERM", () => {
  stopTunnel();
  process.exit(0);
});

export function createPhoneCameraTunnelRouter(nodeEnv: string): ExpressRouter {
  const router = Router();

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      if (nodeEnv !== "development") {
        res.status(404).json({ error: { code: "not_found", message: "Route not found." } });
        return;
      }
      if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.ip ?? "")) {
        res.status(403).json({
          error: { code: "local_only", message: "Development tunnels can only be started from this computer." }
        });
        return;
      }

      const response: PhoneCameraTunnelResponse = { publicUrl: await startQuickTunnel() };
      res.json(response);
    })
  );

  return router;
}
