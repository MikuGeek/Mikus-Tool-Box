import { Action, ActionPanel, List, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { useState, useEffect } from "react";
import { processMarkdownFile, Bookmark } from "./util";
import fuzzysort from "fuzzysort";

interface Preferences {
  bookmarkFilePath: string;
}

export default function Command() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const preferences = getPreferenceValues<Preferences>();
    try {
      const loadedBookmarks = processMarkdownFile(preferences.bookmarkFilePath);
      setBookmarks(loadedBookmarks);
      setFilteredBookmarks(loadedBookmarks);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to load bookmarks",
        message: "Please check your bookmark file path in preferences",
      });
    }
    setIsLoading(false);
  }, []);

  const handleSearchTextChange = (text: string) => {
    if (text === "") {
      setFilteredBookmarks(bookmarks);
    } else {
      const results = fuzzysort.go(text, bookmarks, { key: "title" });
      setFilteredBookmarks(results.map((result) => result.obj));
    }
  };

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={handleSearchTextChange}
      searchBarPlaceholder="Search bookmarks..."
      throttle
    >
      {filteredBookmarks.map((bookmark, index) => (
        <List.Item
          key={index}
          title={bookmark.title}
          subtitle={bookmark.url}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser
                title="Open Bookmark"
                url={bookmark.url}
                shortcut={{ modifiers: ["cmd"], key: "o" }}
              />
              <Action.CopyToClipboard
                title="Copy URL"
                content={bookmark.url}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

