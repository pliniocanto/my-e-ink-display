import * as SecureStore from 'expo-secure-store';

const KEYS = {
  token:        'github_token',
  username:     'github_username',
  watchedRepos: 'watched_repos',
  theme:        'app_theme',
} as const;

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.token);
}
export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.token, token);
}
export async function getUsername(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.username);
}
export async function setUsername(username: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.username, username);
}
export async function getWatchedRepos(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(KEYS.watchedRepos);
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}
export async function setWatchedRepos(repos: string[]): Promise<void> {
  await SecureStore.setItemAsync(KEYS.watchedRepos, JSON.stringify(repos));
}
export async function getTheme(): Promise<'light' | 'dark'> {
  const v = await SecureStore.getItemAsync(KEYS.theme);
  return v === 'dark' ? 'dark' : 'light';
}
export async function saveTheme(theme: 'light' | 'dark'): Promise<void> {
  await SecureStore.setItemAsync(KEYS.theme, theme);
}
