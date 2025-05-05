// src/lib/fetchLyrics.ts
export async function fetchLyrics(artist: string, title: string) {
  return await window.context.invoke('fetch-lyrics', { artist, title })
}
