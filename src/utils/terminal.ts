import { exec } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";

export const execAsync = (command: string) => promisify(exec)(command);

export async function findNeovim(): Promise<string> {
  try {
    const { stdout } = await execAsync("which nvim");
    return stdout.trim();
  } catch {
    const possiblePaths = [
      "/opt/homebrew/bin/nvim",     // Apple Silicon Homebrew
      "/usr/local/bin/nvim",        // Intel Homebrew
      "/usr/bin/nvim",              // System installation
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return path;
      }
    }
    throw new Error("Neovim not found. Please install it via 'brew install neovim' or visit https://neovim.io");
  }
}

export async function openInTerminal(
  nvimPath: string,
  filePath: string,
  useDefaultShell: boolean = false,
  useVSCodeMode: boolean = true
): Promise<void> {
  const hasITerm = existsSync("/Applications/iTerm.app");
  const { stdout: initialContent } = await execAsync(`cat "${filePath}"`);
  const shell = useDefaultShell ? process.env.SHELL || '/bin/zsh' : '/bin/sh';
  const vscodeCmd = useVSCodeMode ? '--cmd \\\\\\"let g:vscode = v:true\\\\\\"' : '';

  if (hasITerm) {
    const escapedCommand = `${nvimPath.replace(/ /g, '\\ ')} ${filePath.replace(/ /g, '\\ ')}`;
    const script = `
      tell application "iTerm"
        create window with profile "Default" command "${shell} -c \\"${escapedCommand} ${vscodeCmd} && exit\\""
        activate
      end tell`;
    await execAsync(`osascript -e '${script}'`);
  } else {
    const escapedCommand = `${nvimPath.replace(/ /g, '\\ ')} ${filePath.replace(/ /g, '\\ ')}`;
    const script = `
      tell application "Terminal"
        do script "${shell} -c \\"${escapedCommand} ${vscodeCmd} && exit\\""
        activate
      end tell`;
    await execAsync(`osascript -e "${script.replace(/"/g, '\\"')}"`);
  }

  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      try {
        const { stdout: currentContent } = await execAsync(`cat "${filePath}"`);
        if (currentContent !== initialContent) {
          clearInterval(checkInterval);
          setTimeout(resolve, 500);
        }
      } catch (error) {
        // If there's an error reading the file, keep waiting
      }
    }, 500);
  });
}