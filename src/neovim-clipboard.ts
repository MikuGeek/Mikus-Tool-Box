import { Clipboard, showHUD } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { existsSync } from "fs";

const execAsync = (command: string) => promisify(exec)(command, { shell: '/bin/sh' });

async function findNeovim(): Promise<string> {
  // Common Neovim installation paths on macOS
  const possiblePaths = [
    "/opt/homebrew/bin/nvim",     // Apple Silicon Homebrew
    "/usr/local/bin/nvim",        // Intel Homebrew
    "/usr/bin/nvim",              // System installation
    "/opt/local/bin/nvim",        // MacPorts
    "/usr/local/opt/neovim/bin/nvim" // Alternative Homebrew path
  ];

  // Check if nvim is available in PATH
  try {
    await execAsync("which nvim");
    return "nvim";
  } catch {
    // If not in PATH, check common installation locations
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return path;
      }
    }
    throw new Error("Neovim not found. Please install it via 'brew install neovim' or visit https://neovim.io");
  }
}

async function openInTerminal(nvimPath: string, filePath: string): Promise<void> {
  // Check if iTerm2 is available
  const hasITerm = existsSync("/Applications/iTerm.app");

  // Store initial content
  const { stdout: initialContent } = await execAsync(`cat "${filePath}"`);

  if (hasITerm) {
    const escapedCommand = `${nvimPath.replace(/ /g, '\\ ')} ${filePath.replace(/ /g, '\\ ')}`;
    const script = `
      tell application "iTerm"
        create window with profile "Default" command "/bin/sh -c \\"${escapedCommand} --cmd \\\\\\"let g:vscode = v:true\\\\\\" && exit\\""
        activate
      end tell`;
    await execAsync(`osascript -e '${script}'`);
  } else {
    const escapedCommand = `${nvimPath.replace(/ /g, '\\ ')} ${filePath.replace(/ /g, '\\ ')}`;
    const script = `
      tell application "Terminal"
        do script "${escapedCommand} --cmd \\"let g:vscode = v:true\\" && exit"
        activate
      end tell`;
    await execAsync(`osascript -e "${script.replace(/"/g, '\\"')}"`);
  }

  // Wait for the terminal to close and file to be saved
  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      try {
        const { stdout: currentContent } = await execAsync(`cat "${filePath}"`);
        // Only resolve when content is different from initial content
        if (currentContent !== initialContent) {
          clearInterval(checkInterval);
          // Add a small delay to ensure terminal has closed
          setTimeout(resolve, 500);
        }
      } catch (error) {
        // If there's an error reading the file, keep waiting
      }
    }, 500);
  });
}

export default async function Command() {
  try {
    // Find Neovim installation
    const nvimPath = await findNeovim();

    // Get clipboard content
    const clipboardText = await Clipboard.read();
    if (!clipboardText.text) {
      await showHUD("No text in clipboard");
      return;
    }

    // Create a temporary file
    const tmpFile = join(tmpdir(), `raycast-neovim-${Date.now()}.txt`);
    await writeFile(tmpFile, clipboardText.text);

    // Open in terminal and wait for edit
    await openInTerminal(nvimPath, tmpFile);

    // Read the edited content
    const { stdout: editedContent } = await execAsync(`cat "${tmpFile}"`);

    // Copy back to clipboard
    await Clipboard.copy(editedContent);

    // Clean up
    await unlink(tmpFile);

    await showHUD("Updated clipboard with edited content");
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof Error && error.message.includes("Neovim not found")) {
      await showHUD(error.message);
    } else {
      await showHUD("Failed to edit clipboard content");
    }
  }
}
