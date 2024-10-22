import * as fs from 'fs';
import * as path from 'path';

export interface Bookmark {
  title: string;
  url: string;
  tags: string[];
  searchTerm: string;
}

export interface Vocabulary {
  words: string[];
  phrases: string[];
}

export interface Preferences {
  vocabularyFilePath: string;
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

export function readVocabularyFile(filePath: string): Vocabulary {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return { words: [], phrases: [] };
  }
}

export function writeVocabularyFile(filePath: string, vocabulary: Vocabulary): void {
  const content = JSON.stringify(vocabulary, null, 2);
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function addVocabulary(vocabulary: Vocabulary, content: string, isPhrase: boolean): Vocabulary {
  if (isPhrase) {
    vocabulary.phrases.push(content);
  } else {
    vocabulary.words.push(content);
  }
  return vocabulary;
}

export function exportVocabulary(vocabulary: Vocabulary, exportDir: string): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportFilePath = path.join(exportDir, `vocabulary_${timestamp}.txt`);

  const content = [
    ...vocabulary.words,
    "",  // Empty line to separate words and phrases
    ...vocabulary.phrases
  ].join('\n');

  fs.writeFileSync(exportFilePath, content, 'utf-8');
}

export function cleanupVocabulary(filePath: string): void {
  writeVocabularyFile(filePath, { words: [], phrases: [] });
}
