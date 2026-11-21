CREATE TABLE IF NOT EXISTS question_clusters (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  normalized_question TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'Uncategorized',
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High')),
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New','Investigating','In progress','Resolved','Won''t fix')),
  occurrences INTEGER NOT NULL DEFAULT 1,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_question_clusters_last_seen ON question_clusters(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_question_clusters_status ON question_clusters(status);
CREATE TABLE IF NOT EXISTS question_events (
  id TEXT PRIMARY KEY,
  cluster_id TEXT NOT NULL REFERENCES question_clusters(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_question_events_cluster ON question_events(cluster_id,created_at DESC);