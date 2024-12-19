import { getPreferenceValues, showHUD } from "@raycast/api";
import fetch from "node-fetch";

interface Preferences {
  flomoAuthUrl: string;
}

export default async function Command(props: { arguments: { memo: string } }) {
  const { flomoAuthUrl } = getPreferenceValues<Preferences>();
  const { memo } = props.arguments;

  try {
    const response = await fetch(flomoAuthUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: memo,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    await showHUD(`Post memo successfully`);
  } catch (error) {
    console.error("Error posting to Flomo:", error);
    await showHUD("Failed to post memo");
    throw error;
  }
}
