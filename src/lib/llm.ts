import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatMessage, ChatResponse, Citation, DocumentChunk } from "@/types";
import { RAG_CONFIG } from "../../rag.config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateAnswer(
  query: string,
  chunks: DocumentChunk[],
  history: ChatMessage[]
): Promise<ChatResponse> {
  if (chunks.length === 0) {
    return {
      answer: RAG_CONFIG.outOfScopeMessage,
      citations: [],
      in_scope: false,
    };
  }

  const context = chunks
    .map(
      (c, i) =>
        `[Article ${i + 1}: "${c.metadata.article_title}" — ${c.metadata.source_url}]\n${c.content}`
    )
    .join("\n\n");

  const model = genAI.getGenerativeModel({
    model: RAG_CONFIG.llm.model,
    systemInstruction: `${RAG_CONFIG.systemPrompt}\n\nCONTEXT FROM HELP ARTICLES:\n${context}`,
    generationConfig: {
      temperature: RAG_CONFIG.llm.temperature,
      maxOutputTokens: RAG_CONFIG.llm.maxTokens,
    },
  });

  const chat = model.startChat({
    history: history.slice(-6).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  });

  const result = await chat.sendMessage(query);
  const answer = result.response.text();

  // Extract citations from the chunks used
  const uniqueArticles = new Map<string, Citation>();
  for (const chunk of chunks) {
    if (!uniqueArticles.has(chunk.metadata.source_url)) {
      uniqueArticles.set(chunk.metadata.source_url, {
        article_title: chunk.metadata.article_title,
        source_url: chunk.metadata.source_url,
        excerpt: chunk.content.slice(0, 150) + "...",
      });
    }
  }

  return {
    answer,
    citations: Array.from(uniqueArticles.values()),
    in_scope: true,
  };
}
