function stripControlCharacters(input: string) {
  let output = "";
  for (const char of input) {
    const code = char.codePointAt(0) ?? 0;
    const isControl =
      (code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127;
    if (!isControl) output += char;
  }
  return output;
}

export function sanitizeText(input: string) {
  return stripControlCharacters(input).replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function sanitizeEmail(input: string) {
  return input.trim().toLowerCase().replace(/[<>"'`\\\s]/g, "");
}

const SPAM_TERMS = [
  "casino",
  "viagra",
  "crypto giveaway",
  "seo services",
  "guest post",
  "buy backlinks",
];

export function containsSpamSignals(input: string) {
  const lowered = input.toLowerCase();
  const linkCount = (lowered.match(/https?:\/\//g) ?? []).length;
  if (linkCount > 2) return true;
  return SPAM_TERMS.some((term) => lowered.includes(term));
}
