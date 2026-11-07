// Which tools have a real engine behind them. A tool is Live only if it has a binding here
// AND a configured provider/model exists. Everything else stays "Coming soon".
// Shared option sets
const TONE = { name: "tone", label: "Tone", choices: ["Professional", "Friendly", "Persuasive", "Casual", "Formal"] };
const LENGTH = { name: "length", label: "Length", choices: ["Short (about 300 words)", "Medium (about 700 words)", "Long (about 1200 words)"] };
const LANGUAGES = ["English", "Urdu", "Roman Urdu", "Arabic", "Hindi", "Spanish", "French", "German", "Portuguese", "Turkish", "Italian", "Russian", "Indonesian", "Bengali", "Chinese (Simplified)", "Japanese"];

export const toolBindings = {
  "ai-chat-assistant": {
    kind: "text", mode: "chat", label: "Message", placeholder: "Ask anything…", maxInputChars: 8000, maxOutputTokens: 1500,
    system: "You are a helpful, accurate assistant. Answer clearly and concisely. If you are unsure, say so.",
  },
  "ai-text-summarizer": {
    kind: "text", label: "Text to summarize", placeholder: "Paste the text you want summarized", maxInputChars: 20000, maxOutputTokens: 800,
    system: "Summarize the user's text faithfully: one short paragraph, then up to five bullet points. Do not add facts that are not in the text.",
  },
  "ai-paraphrasing": {
    kind: "text", label: "Text to rewrite", placeholder: "Paste the text you want rewritten", maxInputChars: 10000, maxOutputTokens: 2000,
    system: "Rewrite the user's text in different words, keeping the exact meaning and roughly the same length. Return only the rewritten text.",
  },
  "ai-grammar-checker": {
    kind: "text", label: "Text to check", placeholder: "Paste the text you want corrected", maxInputChars: 10000, maxOutputTokens: 2500,
    system: "Correct grammar, spelling and punctuation without changing meaning or style. Return the corrected text first, then a short bullet list of the main changes.",
  },

  // ---- Image Studio ----
  // inputs: what the user must provide. modelKind: which registry model family runs it.
  "ai-image-generator": {
    kind: "image", operation: "generate", modelKind: "image-generate", inputs: ["text"],
    label: "Describe the image", placeholder: "A red bicycle leaning on a brick wall at sunset", maxInputChars: 1000,
  },
  "ai-text-to-image": {
    kind: "image", operation: "generate", modelKind: "image-generate", inputs: ["text"],
    label: "Describe the image", placeholder: "A red bicycle leaning on a brick wall at sunset", maxInputChars: 1000,
  },
  "ai-image-editor": {
    kind: "image", operation: "edit", modelKind: "image-edit", inputs: ["text", "image"],
    label: "What should change?", placeholder: "Make the sky a dramatic sunset", maxInputChars: 1000,
  },
  "ai-background-remover": {
    kind: "image", operation: "remove-bg", modelKind: "image-remove-bg", inputs: ["image"],
    label: "", placeholder: "", maxInputChars: 0,
  },

  // ---- Writing Studio ----
  // options: validated server-side against `choices`; {placeholders} in `system` are filled from them.
  ...Object.fromEntries(
    [
      ["ai-article-writer", "Topic or brief", "Write a well-structured article with a title, a short introduction, headed sections and a conclusion.", 3000],
      ["ai-blog-generator", "Blog topic", "Write an engaging blog post with a catchy title, a hook, subheadings and a closing call to action.", 3000],
      ["ai-essay-writer", "Essay question or topic", "Write a clear essay with an introduction, a thesis, well-organized body paragraphs and a conclusion.", 3000],
      ["ai-seo-content-writer", "Topic and target keyword", "Write SEO-friendly content: a title, a meta description, headings that use the keyword naturally, and helpful, non-repetitive copy. Never stuff keywords.", 3000],
      ["ai-story-writer", "Story idea", "Write an original short story with a clear beginning, middle and end, vivid but economical prose, and consistent characters.", 3000],
      ["ai-press-release-generator", "Announcement details", "Write a press release: headline, dateline placeholder, lead paragraph, body, a quote placeholder marked [quote], and an About section placeholder. Use only the facts provided.", 2000],
    ].map(([slug, label, task, maxOutputTokens]) => [slug, {
      kind: "text", label, placeholder: "Describe what you want. Include any facts that must appear.", maxInputChars: 3000, maxOutputTokens,
      options: [TONE, LENGTH],
      system: `You are a professional writer. ${task} Tone: {tone}. Length: {length}. Do not invent statistics, quotes, names or sources; if a fact is needed and was not provided, keep it general or mark it [verify].`,
    }])
  ),
  "ai-email-writer": {
    kind: "text", label: "What is the email about?", placeholder: "Who is it to, what do you need, any key details", maxInputChars: 3000, maxOutputTokens: 1200,
    options: [TONE, { name: "length", label: "Length", choices: ["Short (2-3 sentences)", "Medium (1-2 paragraphs)", "Long (detailed)"] }],
    system: "Write a clear email with a subject line and body. Tone: {tone}. Length: {length}. Use only the facts provided; use [brackets] for details that are missing.",
  },
  "ai-cover-letter-generator": {
    kind: "text", label: "Job description and your background", placeholder: "Paste the job description, then your relevant experience", maxInputChars: 8000, maxOutputTokens: 1500,
    options: [TONE],
    system: "Write a tailored cover letter of about 300 words. Tone: {tone}. Use only the experience the user provides; never invent employers, titles, dates or achievements. Use [brackets] for missing details.",
  },
  "ai-product-description": {
    kind: "text", label: "Product details", placeholder: "Product name, key features, materials, audience", maxInputChars: 3000, maxOutputTokens: 800,
    options: [TONE],
    system: "Write a persuasive product description with a short headline, a benefit-focused paragraph and 3-5 bullet points. Tone: {tone}. Use only the details provided; do not invent specifications, certifications or claims.",
  },
  "ai-social-media-caption": {
    kind: "text", label: "What is the post about?", placeholder: "Describe the post or paste the key message", maxInputChars: 2000, maxOutputTokens: 800,
    options: [TONE, { name: "platform", label: "Platform", choices: ["Instagram", "Facebook", "LinkedIn", "X (Twitter)", "TikTok"] }],
    system: "Write 3 caption options for {platform}, each with fitting hashtags. Tone: {tone}. Follow the usual length and style of {platform}. Do not invent facts.",
  },
  "ai-ad-copy-generator": {
    kind: "text", label: "Product or offer", placeholder: "What are you advertising and to whom?", maxInputChars: 2000, maxOutputTokens: 900,
    options: [TONE, { name: "channel", label: "Channel", choices: ["Search ad", "Social ad", "Display banner", "Email subject lines"] }],
    system: "Write 4 ad copy variations for a {channel}: a headline and a short body for each. Tone: {tone}. Do not make claims (prices, discounts, results) that the user did not provide.",
  },
  "ai-translator": {
    kind: "text", label: "Text to translate", placeholder: "Paste the text. The source language is detected automatically.", maxInputChars: 10000, maxOutputTokens: 3000,
    options: [{ name: "targetLanguage", label: "Translate into", choices: LANGUAGES }],
    system: "Translate the user's text into {targetLanguage}. Keep the meaning, tone, names and formatting. If the text is already in {targetLanguage}, return it unchanged. Output only the translation.",
  },
  "ai-research-assistant": {
    kind: "text", label: "Research question", placeholder: "What do you want to understand?", maxInputChars: 3000, maxOutputTokens: 1800,
    notice: "This assistant answers from the AI model's own knowledge. It cannot browse the web, may be out of date, and can make mistakes. Verify important facts before relying on them.",
    system: "You are a careful research assistant. Give a structured brief: a short overview, key points, open questions or disagreements, and suggested next steps. You cannot browse the web. NEVER invent sources, citations, URLs, quotes or statistics; if you are unsure, say so plainly. Describe types of sources the user should check instead of naming specific ones you cannot verify.",
  },

  // ---- Document Studio (PDF text is extracted at upload; see lib/documents) ----
  "pdf-summarizer": {
    kind: "document", operation: "summarize", modelKind: "text", inputs: ["document"], maxInputChars: 0, maxOutputTokens: 1200,
    options: [{ name: "style", label: "Summary style", choices: ["Short summary", "Detailed summary", "Key points as bullets"] }],
    system: "Summarize the document faithfully. Style: {style}. Mention page numbers like (p. 3) when you can. Do not add facts that are not in the document.",
  },
  "pdf-translator": {
    kind: "document", operation: "translate", modelKind: "text", inputs: ["document"], maxInputChars: 0, maxOutputTokens: 3000,
    options: [{ name: "targetLanguage", label: "Translate into", choices: LANGUAGES }],
    system: "",
  },
  "pdf-question-answering": {
    kind: "document", operation: "qa", modelKind: "text", inputs: ["document", "text"],
    label: "Your question about the document", placeholder: "What does the contract say about termination?", maxInputChars: 1000, maxOutputTokens: 1200,
    system: "Answer the user's question using ONLY the document excerpts provided. Cite pages like (p. 3). If the answer is not in the excerpts, say \"I could not find that in the document\" and do not guess.",
  },
  "chat-with-pdf": {
    kind: "document", operation: "chat", mode: "chat", modelKind: "text", inputs: ["document", "text"],
    label: "Ask about the document", placeholder: "Ask a question about your PDF", maxInputChars: 1000, maxOutputTokens: 1200,
    system: "You are chatting with a user about a PDF. Answer using ONLY the document excerpts provided and cite pages like (p. 3). If the answer is not in the excerpts, say so and do not guess. Reply only with your next message.",
  },
};
