// Source list of tools per category, taken from the master prompt.
// A tool listed in more than one category is merged into one entry by lib/tools/registry.js.
export const toolCatalog = {
  image: [
    "AI Image Generator","AI Background Remover","AI Background Changer","AI Image Editor","AI Image Upscaler",
    "AI Photo Enhancer","AI Object Remover","AI Image Expander","AI Face Enhancer","AI Cartoon Generator",
    "AI Avatar Generator","AI Logo Generator","AI Product Photography","AI Image to Image","AI Text to Image",
    "AI Image Restoration","AI Image Colorizer","AI Image Inpainting","AI Image Outpainting",
    "AI Watermark Remover","AI Profile Picture Generator","AI Sticker Generator","AI Mockup Generator","AI Poster Generator",
  ],
  video: [
    "Text to Video","Image to Video","AI Video Generator","AI Video Editor","AI Video Enhancer","AI Video Upscaler",
    "AI Video Background Remover","AI Talking Avatar","AI Lip Sync","AI Video Translator","AI Subtitle Generator",
    "AI Video Summarizer","AI Shorts Generator","AI Faceless Video Maker","AI Reel Generator","AI Video Script Generator",
    "AI Storyboard Generator","AI UGC Ad Generator","AI Video Dubbing","AI Scene Generator","AI Video Repurposer",
  ],
  writing: [
    "AI Article Writer","AI Blog Generator","AI Essay Writer","AI Email Writer","AI Resume Builder","AI Cover Letter Generator",
    "AI Product Description","AI Social Media Caption","AI Ad Copy Generator","AI Grammar Checker","AI Paraphrasing",
    "AI Text Summarizer","AI Translator","AI Humanizer","AI SEO Content Writer","AI Story Writer","AI Script Writer",
    "AI Brand Voice Writer","AI Business Proposal Writer","AI Press Release Generator",
  ],
  audio: [
    "Text to Speech","Speech to Text","AI Voice Generator","AI Voice Cloning","AI Voice Changer","AI Audio Enhancer",
    "Noise Remover","AI Music Generator","AI Sound Effects","Audio Transcription","AI Podcast Generator","AI Dubbing",
    "AI Voiceover Generator","Audio Summarizer","AI Meeting Transcription",
  ],
  document: [
    "Chat with PDF","PDF Summarizer","PDF Translator","PDF Question Answering","AI Document Writer","AI Presentation Generator",
    "AI PowerPoint Creator","AI Excel Assistant","AI Notes Generator","OCR","Image to Text","AI Report Generator",
    "AI Document Comparison","AI Contract Summarizer","AI Research Paper Assistant",
  ],
  developer: [
    "AI Code Generator","AI Code Explainer","AI Bug Fixer","AI Code Reviewer","AI SQL Generator","AI Regex Generator",
    "API Documentation Generator","AI Website Generator","AI Chatbot Builder","JSON Formatter","Git Commit Generator",
    "AI Database Assistant","AI Test Case Generator","AI README Generator","AI Code Converter","AI Architecture Assistant",
  ],
  chat: [
    "AI Chat Assistant","AI Research Assistant","AI Web Research","AI Math Solver","AI Tutor","AI Quiz Generator",
    "AI Knowledge Assistant","AI Data Analyst","AI Study Planner","AI Learning Assistant","AI Citation Assistant",
  ],
  marketing: [
    "Instagram Post Generator","Facebook Ad Generator","YouTube Title Generator","Thumbnail Generator","Hashtag Generator",
    "Marketing Strategy Generator","Brand Name Generator","Business Name Generator","Content Calendar","Competitor Analyzer",
    "Campaign Planner","Social Media Repurposer","Marketing Copy Generator","Email Campaign Writer",
  ],
  design: [
    "AI UI Design Generator","AI Website Mockup Generator","AI Figma Design Assistant","AI Banner Generator","AI Poster Generator",
    "AI Thumbnail Designer","AI Presentation Designer","AI Color Palette Generator","AI Logo Variations",
    "AI Brand Identity Generator","AI Design Assistant",
  ],
  productivity: [
    "AI Meeting Summarizer","AI Task Planner","AI Schedule Assistant","AI Mind Map Generator","AI Workflow Assistant",
    "AI Data Extraction","AI Spreadsheet Assistant","AI Knowledge Organizer","AI Email Summarizer","AI Research Organizer",
  ],
  ecommerce: [
    "AI Product Photography","AI Virtual Try-On","AI Product Model Generator","AI Product Video Ads","AI Listing Generator",
    "AI Product SEO Description","AI Catalog Generator","AI Product Background Studio","AI Product Image Batch Editor",
    "AI Product Translation","AI Product Advertisement Creator",
  ],
  automation: [
    "AI Agent Builder","AI Workflow Builder","AI Customer Support Agent","AI Lead Qualification","AI Email Assistant",
    "AI WhatsApp Assistant","AI Form Processor","AI Invoice Extractor","AI Report Generator","AI Research Agent",
    "AI Business Assistant","AI Knowledge Base Agent",
  ],
  business: [
    "AI Excel Data Cleaner","AI CSV Analyzer","AI Dashboard Generator","AI Sales Forecasting","AI Profit Calculator",
    "AI Invoice Generator","AI Expense Categorizer","AI Inventory Forecasting","AI Competitor Analyzer","AI Business Plan Generator",
  ],
  seo: [
    "AI SEO Audit","AI Keyword Research","AI Meta Tag Generator","AI Schema Generator","AI Sitemap Analyzer",
    "AI Website Content Auditor","AI Internal Linking Assistant","AI GEO Optimizer","AI Content Gap Analyzer","AI Landing Page Generator",
  ],
  localization: [
    "AI Urdu Translator","Roman Urdu to Urdu","Urdu to English","English to Roman Urdu","Multilingual Voice Generator",
    "Video Dubbing","Subtitle Translator","Localized Ad Generator","Multilingual Chatbot","Document Translator",
  ],
};

// Hand-picked slugs for homepage rails. Edit freely; no usage data backs these yet.
export const featuredSlugs = {
  popular: ["ai-image-generator","ai-background-remover","ai-article-writer","chat-with-pdf","text-to-speech","ai-chat-assistant","ai-product-photography","ai-code-generator"],
  trending: ["text-to-video","ai-shorts-generator","ai-voice-generator","ai-agent-builder","ai-ugc-ad-generator","ai-image-upscaler"],
  new: ["ai-workflow-builder","ai-geo-optimizer","ai-urdu-translator","ai-virtual-try-on","roman-urdu-to-urdu","ai-customer-support-agent"],
};

// Tools that need extra safeguards before they can go live.
export const sensitiveSlugs = {
  "ai-voice-cloning": "Requires verified consent from the voice owner.",
  "ai-watermark-remover": "Only for content you own or are authorized to edit.",
  "ai-lip-sync": "Review for deepfake misuse before launch.",
  "ai-talking-avatar": "Review for deepfake misuse before launch.",
};
