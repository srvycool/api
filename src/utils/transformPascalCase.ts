export function transformPascalCase(text: string): string {
  const firstCharacter = text[0].toUpperCase();
  return firstCharacter + text.slice(1);
}
