// lib/rag/rerank.ts
import {
  AutoTokenizer,
  AutoModelForSequenceClassification,
} from '@xenova/transformers';
import type {
  PreTrainedTokenizer,
  PreTrainedModel,
  Tensor,
} from '@xenova/transformers';
import type { SearchResult } from './types';

// ────────────────────────────────────────────────────────────────
// CONFIG
// ────────────────────────────────────────────────────────────────
// Modelo multilingüe afinado en ES; logits 2‑dim ⇒ softmax.
const MODEL_ID = 'Xenova/bge-reranker-base';
const KEEP_TOP_K = 5; // número de pasajes que regresamos
const MIN_PROB = 0.002; // 0,2 % — filtra solo el ruido extremo

// ────────────────────────────────────────────────────────────────
// SINGLETON CACHES
// ────────────────────────────────────────────────────────────────
let tokenizerPromise: Promise<PreTrainedTokenizer> | null = null;
let modelPromise: Promise<PreTrainedModel> | null = null;

function getTokenizer(): Promise<PreTrainedTokenizer> {
  if (!tokenizerPromise) {
    tokenizerPromise = AutoTokenizer.from_pretrained(MODEL_ID);
  }
  return tokenizerPromise;
}
function getModel(): Promise<PreTrainedModel> {
  if (!modelPromise) {
    modelPromise = AutoModelForSequenceClassification.from_pretrained(MODEL_ID);
  }
  return modelPromise;
}

// ────────────────────────────────────────────────────────────────
export interface RerankResult extends SearchResult {
  rerankScore: number;
}

// ────────────────────────────────────────────────────────────────
export async function rerankWithXenova(
  query: string,
  results: SearchResult[],
): Promise<RerankResult[]> {
  // 1) Filtrado + deduplicado por contenido
  const seen = new Set<string>();
  const docs = results.filter((r): r is SearchResult & { text: string } => {
    if (typeof r.text !== 'string' || !r.text.trim()) return false;
    const hash = r.text.slice(0, 140); // hash rápido; evita duplicados de chunk
    if (seen.has(hash)) return false;
    seen.add(hash);
    return true;
  });
  if (!docs.length) return [];

  // 2) Pairs [query, passage]
  const passages = docs.map((d) => d.text.trim());
  const queries = new Array(passages.length).fill(query);

  // 3) Run model
  const tokenizer = await getTokenizer();
  const model = (await getModel()) as any;
  const inputs = tokenizer(queries, {
    text_pair: passages,
    padding: true,
    truncation: true,
  });
  const { logits } = await model(inputs as unknown as Tensor);

  const dims = logits.dims ?? [];
  let probs: number[];
  if (dims[1] === 2) {
    // softmax → probabilidad de etiqueta «relevante» (idx 1)
    probs = logits
      .softmax(-1)
      .tolist()
      .map(([, rel]: [number, number]) => rel);
  } else {
    // fallback (1‑d logit)
    probs = Array.from(logits.sigmoid().squeeze(-1).data);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.debug('🔵 logits sample', logits.tolist().slice(0, 3));
    console.debug('🔵 probs  sample', probs.slice(0, 5));
  }

  // 4) Ranking y corte
  let reranked = docs
    .map((d, i) => ({ ...d, rerankScore: probs[i] }))
    .filter((d) => d.rerankScore >= MIN_PROB)
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, KEEP_TOP_K);

  if (!reranked.length) {
    reranked = [{ ...docs[0], rerankScore: probs[0] }];
  }
  return reranked;
}
