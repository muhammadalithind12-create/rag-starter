"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage, Citation } from "@/types";
import { RAG_CONFIG } from "../../rag.config";

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      setError(null);
      const userMessage: ChatMessage = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: messages,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server error (${res.status})`);
        }

        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.answer,
          citations: data.citations,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, something went wrong. Please try again.",
          },
        ]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [loading, messages]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function clearChat() {
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
            <span className="text-lg leading-none">{RAG_CONFIG.logo}</span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {RAG_CONFIG.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {RAG_CONFIG.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Clear chat
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-8 py-10">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
                <span className="text-3xl leading-none">{RAG_CONFIG.logo}</span>
              </div>
              <p className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-1.5">
                {RAG_CONFIG.name}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                Ask anything about {RAG_CONFIG.domain}. Every answer is
                grounded in the docs and comes with citations.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {RAG_CONFIG.suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="group text-left text-[13px] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:shadow-sm transition-all text-slate-600 dark:text-slate-400"
                >
                  <span className="text-indigo-500 mr-1.5">›</span>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-md"
                  : "bg-slate-100 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 rounded-bl-md border border-slate-200/60 dark:border-slate-700/50"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {msg.content}
              </p>

              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-300/60 dark:border-slate-600/50">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    Sources
                  </p>
                  {msg.citations.map((cite: Citation, j: number) => (
                    <a
                      key={j}
                      href={cite.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline mb-1"
                    >
                      <span className="inline-block w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />
                      {cite.article_title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800/70 rounded-2xl rounded-bl-md px-4 py-3 border border-slate-200/60 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  <div
                    className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
                <span className="text-xs text-slate-400">
                  Searching the docs...
                </span>
              </div>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="text-center">
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur"
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={RAG_CONFIG.inputPlaceholder}
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-indigo-600 text-white px-6 py-3 text-sm font-medium shadow-sm shadow-indigo-600/20 disabled:opacity-40 hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          {RAG_CONFIG.disclaimer}
        </p>
      </form>
    </div>
  );
}
