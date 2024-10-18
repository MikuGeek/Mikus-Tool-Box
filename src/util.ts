import * as fs from 'fs';

export interface Bookmark {
  title: string;
  url: string;
}

export function processMarkdownFile(filePath: string): Bookmark[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return processMarkdownContent(content);
}

export function processMarkdownContent(content: string): Bookmark[] {
  const lines = content.split('\n');
  const bookmarks: Bookmark[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) continue;

    const match = trimmedLine.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      bookmarks.push({
        title: match[1],
        url: match[2],
      });
    } else {
      const urlMatch = trimmedLine.match(/https?:\/\/\S+/);
      if (urlMatch) {
        bookmarks.push({
          title: trimmedLine,
          url: urlMatch[0],
        });
      }
    }
  }

  return bookmarks;
}
