'use server'

export async function SearchAndGetTextAction(query: string): Promise<string> {
  // make keyword URL-safe
  const keyword = encodeURIComponent(query);
  // https://laws.e-gov.go.jp/api/2/swagger-ui/#/laws-api/get-keyword
  console.log(`searching keyword: ${keyword}`);
  const res = await fetch(`https://laws.e-gov.go.jp/api/2/keyword?keyword=${keyword}`);

  // resが404ならば空文字列を返す(キーワードがないだけ)
  if (res.status === 404) {
    return "";
  } else if (!res.ok) {
    throw new Error(`SearchAndGetTextAction failed with status ${res.status}`);
  }
  const data = await res.json();
  const item = data.items[0];
  const joinedText = item.sentences.map((s: { text: string }) => s.text).join('\n');
  return joinedText;
}