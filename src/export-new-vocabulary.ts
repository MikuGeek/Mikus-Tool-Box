import { showHUD, getPreferenceValues } from "@raycast/api";
import { homedir } from "os";
import * as path from "path";
import { readVocabularyFile, exportVocabulary, cleanupVocabulary, Preferences } from "./util";

export default async function Command() {
  try {
    const preferences = getPreferenceValues<Preferences>();
    const vocabularyFilePath = preferences.vocabularyFilePath;
    const exportDir = path.join(homedir(), "Downloads");

    // Read the vocabulary file
    const vocabulary = readVocabularyFile(vocabularyFilePath);

    // Export the vocabulary
    exportVocabulary(vocabulary, exportDir);

    // Cleanup the vocabulary file
    cleanupVocabulary(vocabularyFilePath);

    await showHUD("Vocabulary exported and cleaned up successfully");
  } catch (error) {
    console.error("Error exporting vocabulary:", error);
    await showHUD("Error exporting vocabulary");
  }
}

