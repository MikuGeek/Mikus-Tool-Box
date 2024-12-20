import { showHUD, getSelectedText, Clipboard } from "@raycast/api";
import { findNeovim, openInTerminal } from "./utils/terminal";
import { ClipboardService } from "./services/clipboard-service";

type ErrorWithMessage = {
  message: string;
};

const ERROR_MESSAGES = {
  GENERAL: "Failed to edit clipboard content",
  NO_CLIPBOARD: "No text in clipboard",
} as const;

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

function handleError(error: unknown): string {
  if (isErrorWithMessage(error)) {
    if (error.message.includes("Neovim not found")) {
      return error.message;
    }
    if (error.message === ERROR_MESSAGES.NO_CLIPBOARD) {
      return ERROR_MESSAGES.NO_CLIPBOARD;
    }
  }
  return ERROR_MESSAGES.GENERAL;
}

/**
 * Main command function to handle clipboard editing with Neovim
 */
export default async function Command() {
  try {
    await handleSelectedText();
    const nvimPath = await findNeovim();
    const tmpFile = await ClipboardService.getTempFilePath();

    await ClipboardService.saveClipboardToFile(tmpFile);
    await openInTerminal({
      nvimPath,
      filePath: tmpFile,
      useDefaultShell: true,
      useVSCodeMode: true
    });
    await ClipboardService.readFileToClipboard(tmpFile);
    await ClipboardService.cleanup(tmpFile);

    await showHUD("Updated clipboard with edited content");
  } catch (error) {
    console.error("Error:", error);
    await showHUD(handleError(error));
  }
}

/**
 * Handles copying selected text to clipboard if present
 */
async function handleSelectedText(): Promise<void> {
  const selectedText = await getSelectedText();
  if (selectedText) {
    await Clipboard.copy(selectedText);
    await showHUD("Copied selected text to clipboard");
  }
}
