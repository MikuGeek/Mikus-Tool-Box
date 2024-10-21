import * as fs from 'fs';

export interface Bookmark {
  title: string;
  url: string;
  tags: string[];
  searchTerm: string;
}

function extractTags(line: string): string[] {
  const tagMatches = line.match(/#[\w-]+/g);
  return tagMatches ? tagMatches.map((tag) => tag.slice(1)) : [];
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
      const [, title, url] = match;
      const tags = extractTags(trimmedLine);
      bookmarks.push({
        title: title,
        url: url,
        tags: tags,
        searchTerm: `${title} ${tags.join(' ')}`
      });
    } else {
      const urlMatch = trimmedLine.match(/https?:\/\/\S+/);
      if (urlMatch) {
        const [url] = urlMatch;
        const title = trimmedLine.replace(url, '').trim();
        const tags = extractTags(trimmedLine);
        bookmarks.push({
          title: title || url,
          url: url,
          tags: tags,
          searchTerm: `${title || url} ${tags.join(' ')}`
        });
      }
    }
  }

  return bookmarks;
}
