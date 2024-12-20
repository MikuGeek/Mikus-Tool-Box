import { showHUD } from "@raycast/api";
import { findNeovim, openInTerminal } from "./utils/terminal";
import { ClipboardService } from "./services/clipboard-service";

export default async function Command() {
  try {
    // Find Neovim installation
    const nvimPath = await findNeovim();

    // Create a temporary file and save clipboard content
    const tmpFile = await ClipboardService.getTempFilePath();
    await ClipboardService.saveClipboardToFile(tmpFile);

    // Open in terminal and wait for edit
    await openInTerminal(nvimPath, tmpFile, true, true);

    // Read the edited content back to clipboard
    await ClipboardService.readFileToClipboard(tmpFile);

    // Clean up
    await ClipboardService.cleanup(tmpFile);

    await showHUD("Updated clipboard with edited content");
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof Error) {
      if (error.message.includes("Neovim not found")) {
        await showHUD(error.message);
      } else if (error.message === "No text in clipboard") {
        await showHUD(error.message);
      } else {
        await showHUD("Failed to edit clipboard content");
      }
    }
  }
}
