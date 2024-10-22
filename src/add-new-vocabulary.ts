import { showHUD, getPreferenceValues, showToast, Toast } from "@raycast/api";
import { readVocabularyFile, writeVocabularyFile, addVocabulary, Preferences } from "./util";

export default async function Command(props: { arguments: { content: string } }) {
  const { content } = props.arguments;
  const preferences = getPreferenceValues<Preferences>();

  // Determine if the content is a phrase based on word count
  const isPhrase = content.trim().split(/\s+/).length > 1;

  try {
    const vocabulary = readVocabularyFile(preferences.vocabularyFilePath);
    const updatedVocabulary = addVocabulary(vocabulary, content, isPhrase);
    writeVocabularyFile(preferences.vocabularyFilePath, updatedVocabulary);

    const type = isPhrase ? "Phrase" : "Word";
    await showHUD(`Added new ${type.toLowerCase()}: ${content}`);
  } catch (error) {
    console.error(error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to add vocabulary",
      message: String(error),
    });
  }
}
