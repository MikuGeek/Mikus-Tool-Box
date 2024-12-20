import { Clipboard } from "@raycast/api";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { execAsync } from "../utils/terminal";

export class ClipboardService {
  static async getTempFilePath(): Promise<string> {
    return join(tmpdir(), `raycast-neovim-${Date.now()}.txt`);
  }

  static async saveClipboardToFile(filePath: string): Promise<void> {
    const clipboardText = await Clipboard.read();
    if (!clipboardText.text) {
      throw new Error("No text in clipboard");
    }
    await writeFile(filePath, clipboardText.text);
  }

  static async readFileToClipboard(filePath: string): Promise<void> {
    const { stdout: editedContent } = await execAsync(`cat "${filePath}"`);
    await Clipboard.copy(editedContent);
  }

  static async cleanup(filePath: string): Promise<void> {
    await unlink(filePath);
  }
}