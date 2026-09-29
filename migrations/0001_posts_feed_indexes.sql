CREATE INDEX IF NOT EXISTS idx_posts_board_created_at ON posts(board, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_created_at ON posts(author, created_at DESC);
PRAGMA optimize;
