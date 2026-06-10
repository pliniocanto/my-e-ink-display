const mockFetch = jest.fn();
global.fetch = mockFetch;

import {
  fetchUserProfile,
  fetchUserEvents,
  fetchOpenPRs,
  fetchUserRepos,
  fetchLatestRun,
} from '../../services/github';

const TOKEN = 'ghp_test';
const USER = 'testuser';

function mockOk(body: unknown) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(body),
  });
}
function mockError(status: number) {
  mockFetch.mockResolvedValue({ ok: false, status });
}

beforeEach(() => jest.clearAllMocks());

describe('fetchUserProfile', () => {
  it('returns user data', async () => {
    mockOk({ login: 'testuser', public_repos: 5 });
    const user = await fetchUserProfile(TOKEN, USER);
    expect(user.login).toBe('testuser');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/users/testuser',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }) })
    );
  });
  it('throws on non-2xx response', async () => {
    mockError(401);
    await expect(fetchUserProfile(TOKEN, USER)).rejects.toThrow('GitHub API error: 401');
  });
});

describe('fetchOpenPRs', () => {
  it('returns items from search result', async () => {
    mockOk({ total_count: 1, items: [{ number: 42, title: 'fix: bug', draft: false }] });
    const prs = await fetchOpenPRs(TOKEN, USER);
    expect(prs).toHaveLength(1);
    expect(prs[0].number).toBe(42);
  });
});

describe('fetchLatestRun', () => {
  it('returns first run', async () => {
    mockOk({ workflow_runs: [{ status: 'completed', conclusion: 'success', name: 'CI' }] });
    const run = await fetchLatestRun(TOKEN, 'user', 'repo');
    expect(run?.conclusion).toBe('success');
  });
  it('returns null when no runs', async () => {
    mockOk({ workflow_runs: [] });
    const run = await fetchLatestRun(TOKEN, 'user', 'repo');
    expect(run).toBeNull();
  });
  it('returns null on API error (repo has no Actions)', async () => {
    mockError(404);
    const run = await fetchLatestRun(TOKEN, 'user', 'repo');
    expect(run).toBeNull();
  });
});
