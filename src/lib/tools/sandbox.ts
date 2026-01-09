import { Sandbox } from "@vercel/sandbox";
import ms from "ms";
import * as fs from "fs/promises";
import * as path from "path";
import { glob } from "glob";
import { spawn } from "node:child_process";

export interface SandboxInstance {
  sandbox: Sandbox;
  stop: () => Promise<void>;
}

/**
 * Creates a sandbox initialized with semantic layer YAML files.
 * Returns the sandbox instance and a stop function for cleanup.
 *
 * Usage:
 * ```ts
 * const { sandbox, stop } = await createSemanticSandbox();
 * try {
 *   // use sandbox...
 * } finally {
 *   await stop();
 * }
 * ```
 */
export async function createSemanticSandbox(): Promise<SandboxInstance> {
  if (process.env.LOCAL_NO_SANDBOX === "1") {
    return createLocalSandbox();
  }

  const sandbox = await Sandbox.create({
    resources: { vcpus: 4 },
    timeout: ms("1h"),
  });

  const semanticDir = path.join(process.cwd(), "src/semantic");
  const ymlFiles = await glob("**/*.yml", { cwd: semanticDir });
  const files = await Promise.all(
    ymlFiles.map(async (relativePath) => ({
      path: `semantic/${relativePath}`,
      content: await fs.readFile(path.join(semanticDir, relativePath)),
    }))
  );
  await sandbox.writeFiles(files);

  return {
    sandbox,
    stop: async () => sandbox.stop(),
  };
}

async function createLocalSandbox(): Promise<SandboxInstance> {
  const cwd = path.join(process.cwd(), "src");

  const sandboxLike = {
    runCommand: async (cmd: string, args: string[] = []) =>
      await new Promise((resolve, reject) => {
        const child = spawn(cmd, args, { cwd });
        let stdout = "";
        let stderr = "";

        child.stdout?.on("data", (data) => {
          stdout += data;
        });
        child.stderr?.on("data", (data) => {
          stderr += data;
        });
        child.on("error", reject);
        child.on("close", (code) => {
          resolve({
            exitCode: code ?? 0,
            stdout: async () => stdout,
            stderr: async () => stderr,
          });
        });
      }),
  };

  return {
    sandbox: sandboxLike as unknown as Sandbox,
    stop: async () => {},
  };
}
