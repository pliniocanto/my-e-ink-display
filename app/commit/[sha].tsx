import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getToken } from '../../services/storage';
import { fetchCommitDetail } from '../../services/github';
import type { GithubCommitDetail, GithubCommitFile } from '../../types/github';
import { FontFamily, Spacing } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

const STATUS_SYMBOL: Record<string, string> = {
  added:    '+',
  removed:  '−',
  modified: '~',
  renamed:  '→',
  copied:   '⊕',
};

function FileRow({ file, colors }: { file: GithubCommitFile; colors: { ink: string; gray1: string; gray2: string; gray3: string; card: string } }) {
  const [open, setOpen] = useState(false);
  const symbol = STATUS_SYMBOL[file.status] ?? '~';
  const diffColor = file.additions > 0 && file.deletions === 0 ? colors.ink
    : file.deletions > 0 && file.additions === 0 ? colors.gray1
    : colors.gray1;

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.gray3 }}>
      <Pressable style={s.fileRow} onPress={() => file.patch && setOpen(o => !o)}>
        <Text style={[s.fileSymbol, { color: diffColor }]}>{symbol}</Text>
        <Text style={[s.fileName, { color: colors.ink, flex: 1 }]} numberOfLines={1}>{file.filename}</Text>
        <Text style={[s.fileStat, { color: colors.ink }]}>+{file.additions}</Text>
        <Text style={[s.fileStat, { color: colors.gray1 }]}>−{file.deletions}</Text>
        {file.patch && <Text style={[s.fileChevron, { color: colors.gray2 }]}>{open ? '▲' : '▼'}</Text>}
      </Pressable>
      {open && file.patch && (
        <ScrollView horizontal style={[s.patch, { backgroundColor: colors.card }]}>
          <Text style={[s.patchText, { color: colors.gray1 }]}>{file.patch}</Text>
        </ScrollView>
      )}
    </View>
  );
}

export default function CommitDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { sha, repo } = useLocalSearchParams<{ sha: string; repo: string }>();
  const [detail, setDetail] = useState<GithubCommitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token || !repo) throw new Error('Missing config');
        const [owner, repoName] = repo.split('/');
        setDetail(await fetchCommitDetail(token, owner, repoName, sha));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load commit');
      } finally {
        setLoading(false);
      }
    })();
  }, [sha, repo]);

  const [firstLine, ...bodyLines] = (detail?.commit.message ?? '').split('\n');
  const body = bodyLines.join('\n').trim();

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.paper }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.ink }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={[s.backText, { color: colors.ink }]}>← BACK</Text>
        </Pressable>
        <Text style={[s.title, { color: colors.ink }]}>▣ COMMIT</Text>
        <Text style={[s.sha, { color: colors.gray1 }]}>{sha.slice(0, 7)}</Text>
      </View>

      {loading && <Text style={[s.status, { color: colors.gray1 }]}>Loading...</Text>}
      {error   && <Text style={[s.status, { color: colors.ink }]}>⚠ {error}</Text>}

      {detail && (
        <ScrollView>
          {/* Commit message */}
          <View style={[s.section, { borderBottomColor: colors.gray3 }]}>
            <Text style={[s.commitTitle, { color: colors.ink }]}>{firstLine}</Text>
            {body ? <Text style={[s.commitBody, { color: colors.gray1 }]}>{body}</Text> : null}
          </View>

          {/* Meta */}
          <View style={[s.section, s.metaGrid, { borderBottomColor: colors.gray3 }]}>
            <View style={s.metaItem}>
              <Text style={[s.metaLabel, { color: colors.gray1 }]}>AUTHOR</Text>
              <Text style={[s.metaValue, { color: colors.ink }]}>
                {detail.author?.login ?? detail.commit.author.name}
              </Text>
            </View>
            <View style={s.metaItem}>
              <Text style={[s.metaLabel, { color: colors.gray1 }]}>COMMITTED</Text>
              <Text style={[s.metaValue, { color: colors.ink }]}>
                {new Date(detail.commit.committer.date).toLocaleString([], {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
            <View style={s.metaItem}>
              <Text style={[s.metaLabel, { color: colors.gray1 }]}>REPO</Text>
              <Text style={[s.metaValue, { color: colors.ink }]}>{repo}</Text>
            </View>
            <View style={s.metaItem}>
              <Text style={[s.metaLabel, { color: colors.gray1 }]}>CHANGES</Text>
              <Text style={[s.metaValue, { color: colors.ink }]}>
                +{detail.stats.additions} −{detail.stats.deletions} · {detail.files.length} files
              </Text>
            </View>
          </View>

          {/* Files */}
          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.gray1 }]}>
              CHANGED FILES · {detail.files.length}
            </Text>
            {detail.files.map(f => (
              <FileRow key={f.filename} file={f} colors={colors} />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:       { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', padding: Spacing.screen, borderBottomWidth: 2, gap: 12 },
  backBtn:      { paddingRight: 8 },
  backText:     { fontFamily: FontFamily, fontSize: 12, letterSpacing: 1 },
  title:        { fontFamily: FontFamily, fontSize: 16, fontWeight: 'bold', letterSpacing: 2, flex: 1 },
  sha:          { fontFamily: FontFamily, fontSize: 12 },
  status:       { fontFamily: FontFamily, fontSize: 13, padding: Spacing.screen },
  section:      { padding: Spacing.screen, borderBottomWidth: 1, gap: 6 },
  commitTitle:  { fontFamily: FontFamily, fontSize: 15, fontWeight: 'bold', lineHeight: 22 },
  commitBody:   { fontFamily: FontFamily, fontSize: 12, lineHeight: 18, marginTop: 4 },
  metaGrid:     { flexDirection: 'row', flexWrap: 'wrap' },
  metaItem:     { width: '50%', gap: 2, paddingVertical: 4 },
  metaLabel:    { fontFamily: FontFamily, fontSize: 10, letterSpacing: 1 },
  metaValue:    { fontFamily: FontFamily, fontSize: 12 },
  sectionLabel: { fontFamily: FontFamily, fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  fileRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  fileSymbol:   { fontFamily: FontFamily, fontSize: 13, fontWeight: 'bold', width: 14 },
  fileName:     { fontFamily: FontFamily, fontSize: 12 },
  fileStat:     { fontFamily: FontFamily, fontSize: 11 },
  fileChevron:  { fontFamily: FontFamily, fontSize: 10, width: 12 },
  patch:        { maxHeight: 200, marginBottom: 4 },
  patchText:    { fontFamily: FontFamily, fontSize: 10, lineHeight: 16, padding: 8 },
});
