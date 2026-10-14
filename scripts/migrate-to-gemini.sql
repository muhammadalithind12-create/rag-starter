-- ============================================================================
-- SupportGenius: migrate embeddings from OpenAI (1536 dims) to Gemini (768 dims)
-- ============================================================================
-- Run this in the Supabase SQL editor AFTER switching the app to Gemini.
-- The documents table is empty at migration time, so this is a clean,
-- destructive migration: existing (OpenAI-dimensioned) vectors are dropped.
-- If your table already has data you care about, re-ingest instead of
-- trying to cast between dimensions.
-- ============================================================================

-- Drop the old similarity-search function (OpenAI signature)
drop function if exists match_documents(vector(1536), float, int);
drop function if exists match_documents(vector, float, int);

-- Drop the old HNSW index (dimension-specific)
drop index if exists documents_embedding_idx;

-- Resize the embedding column to Gemini's 768 dimensions
alter table documents
  alter column embedding type vector(768)
  using (embedding::vector(768));

-- Recreate the HNSW index for the new dimension
create index if not exists documents_embedding_idx
  on documents
  using hnsw (embedding vector_cosine_ops);

-- Recreate the similarity-search function with the Gemini signature
create or replace function match_documents(
  query_embedding vector(768),
  match_threshold float default 0.2,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  source_url text,
  article_title text,
  chunk_index integer,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    d.id,
    d.content,
    d.source_url,
    d.article_title,
    d.chunk_index,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where 1 - (d.embedding <=> query_embedding) > match_threshold
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;
