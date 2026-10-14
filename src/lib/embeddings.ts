import {
  GoogleGenerativeAI,
  EmbedContentRequest,
} from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// gemini-embedding-001 with Matryoshka-truncated output at 768 dimensions,
// matching the pgvector schema in scripts/migrate-to-gemini.sql.
// (text-embedding-004 is retired and no longer served by the Gemini API.)
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

// The installed SDK's EmbedContentRequest type omits outputDimensionality,
// but the REST API honors it — the SDK JSON-serializes the whole object.
interface DimensionalEmbedRequest extends EmbedContentRequest {
  outputDimensionality: number;
}

function embedRequest(text: string): DimensionalEmbedRequest {
  return {
    content: { role: "user", parts: [{ text }] },
    outputDimensionality: EMBEDDING_DIMENSIONS,
  };
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(embedRequest(text));
  return result.embedding.values;
}

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.batchEmbedContents({
    requests: texts.map(embedRequest),
  });
  return result.embeddings.map((e) => e.values);
}

export { EMBEDDING_DIMENSIONS };
