'use server'

export async function SearchAndGetTextAction(query: string): Promise<string> {
  // make keyword URL-safe
  const keyword = encodeURIComponent(query);
  // https://laws.e-gov.go.jp/api/2/swagger-ui/#/laws-api/get-keyword
  const res = await fetch(`https://laws.e-gov.go.jp/api/2/keyword?keyword=${keyword}`);
  if (!res.ok) {
    throw new Error(`HTTP error. status: ${res.status}`);
  }
  const data = await res.json();
  const item = data.items[0];
  const joinedText = item.sentences.map((s: { text: string }) => s.text).join('\n');
  return joinedText;
}