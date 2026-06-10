jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';
import {
  getToken, setToken,
  getUsername, setUsername,
  getWatchedRepos, setWatchedRepos,
} from '../../services/storage';

const mockGet = SecureStore.getItemAsync as jest.Mock;
const mockSet = SecureStore.setItemAsync as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getToken', () => {
  it('returns stored token', async () => {
    mockGet.mockResolvedValue('ghp_abc123');
    expect(await getToken()).toBe('ghp_abc123');
    expect(mockGet).toHaveBeenCalledWith('github_token');
  });
  it('returns null when not set', async () => {
    mockGet.mockResolvedValue(null);
    expect(await getToken()).toBeNull();
  });
});

describe('setToken', () => {
  it('stores token under github_token key', async () => {
    mockSet.mockResolvedValue(undefined);
    await setToken('ghp_xyz');
    expect(mockSet).toHaveBeenCalledWith('github_token', 'ghp_xyz');
  });
});

describe('getWatchedRepos', () => {
  it('returns parsed array', async () => {
    mockGet.mockResolvedValue('["user/repo1","user/repo2"]');
    expect(await getWatchedRepos()).toEqual(['user/repo1', 'user/repo2']);
  });
  it('returns empty array when not set', async () => {
    mockGet.mockResolvedValue(null);
    expect(await getWatchedRepos()).toEqual([]);
  });
  it('returns empty array on invalid JSON', async () => {
    mockGet.mockResolvedValue('{bad json');
    expect(await getWatchedRepos()).toEqual([]);
  });
});

describe('setWatchedRepos', () => {
  it('serialises array to JSON', async () => {
    mockSet.mockResolvedValue(undefined);
    await setWatchedRepos(['a/b', 'c/d']);
    expect(mockSet).toHaveBeenCalledWith('watched_repos', '["a/b","c/d"]');
  });
});
