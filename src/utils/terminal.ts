import { exec } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";

const NEOVIM_PATHS = [
  "/opt/homebrew/bin/nvim",     // Apple Silicon Homebrew
  "/usr/local/bin/nvim",        // Intel Homebrew
  "/usr/bin/nvim",              // System installation
];

const NEOVIM_INSTALL_MESSAGE = "Neovim not found. Please install it via 'brew install neovim' or visit https://neovim.io";
const CHECK_INTERVAL_MS = 250;

interface TerminalConfig {
  nvimPath: string;
  filePath: string;
  useDefaultShell?: boolean;
  useVSCodeMode?: boolean;
}

export const execAsync = promisify(exec);

/**
 * Finds the Neovim installation path on the system
 * @returns Promise<string> The path to the Neovim executable
 * @throws Error if Neovim is not found
 */
export async function findNeovim(): Promise<string> {
  try {
    const { stdout } = await execAsync("which nvim");
    return stdout.trim();
  } catch {
    for (const path of NEOVIM_PATHS) {
      if (existsSync(path)) {
        return path;
      }
    }
    throw new Error(NEOVIM_INSTALL_MESSAGE);
  }
}

/**
 * Opens a file in terminal with Neovim
 * @param config Terminal configuration options
 * @returns Promise<void>
 */
export async function openInTerminal({
  nvimPath,
  filePath,
  useDefaultShell = false,
  useVSCodeMode = true
}: TerminalConfig): Promise<void> {
  const hasITerm = existsSync("/Applications/iTerm.app");
  const { stdout: initialContent } = await execAsync(`cat "${filePath}"`);
  const shell = useDefaultShell ? process.env.SHELL || '/bin/zsh' : '/bin/sh';
  const vscodeCmd = useVSCodeMode ? '--cmd \\\\\\"let g:vscode = v:true\\\\\\"' : '';
  const escapedCommand = `${nvimPath.replace(/ /g, '\\ ')} ${filePath.replace(/ /g, '\\ ')}`;

  const script = hasITerm
    ? generateITermScript(shell, escapedCommand, vscodeCmd)
    : generateTerminalScript(shell, escapedCommand, vscodeCmd);

  await execAsync(`osascript -e '${script}'`);

  return waitForFileChange(filePath, initialContent);
}

function generateITermScript(shell: string, escapedCommand: string, vscodeCmd: string): string {
  return `
    tell application "iTerm"
      create window with profile "Default" command "${shell} -c \\"${escapedCommand} ${vscodeCmd} && exit\\""
      activate
    end tell`;
}

function generateTerminalScript(shell: string, escapedCommand: string, vscodeCmd: string): string {
  return `
    tell application "Terminal"
      do script "${shell} -c \\"${escapedCommand} ${vscodeCmd} && exit\\""
      activate
    end tell`;
}

async function waitForFileChange(filePath: string, initialContent: string): Promise<void> {
  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      try {
        const { stdout: currentContent } = await execAsync(`cat "${filePath}"`);
        if (currentContent !== initialContent) {
          clearInterval(checkInterval);
          setTimeout(resolve, CHECK_INTERVAL_MS);
        }
      } catch (error) {
        // If there's an error reading the file, keep waiting
      }
    }, CHECK_INTERVAL_MS);
  });
}