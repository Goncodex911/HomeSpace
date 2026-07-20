import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const VND_PER_USD = 25000;

const toUSD = (amount) => {
  const value = Number(amount) || 0;
  if (value >= 10000) return value / VND_PER_USD;
  return value;
};

const formatUSD = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toUSD(amount));

const buildCatalogText = (products) =>
  products
    .map((product) => {
      const priceUsd = toUSD(product.price);
      const desc = (product.description || '').replace(/\s+/g, ' ').slice(0, 140);
      const store = product.owner?.companyName || product.owner?.fullName || 'Lumina Store';
      return [
        `ID: ${product._id}`,
        `Name: ${product.name}`,
        `Price: ${formatUSD(product.price)} (${priceUsd.toFixed(2)} USD)`,
        `Category: ${product.category || 'Uncategorized'}`,
        `Store: ${store}`,
        `Rating: ${product.averageRating || 0}/5`,
        `In stock: ${product.quantity}`,
        desc ? `Description: ${desc}` : null,
      ]
        .filter(Boolean)
        .join(' | ');
    })
    .join('\n');

const parseGeminiJson = (text) => {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Invalid Gemini response format.');
  }
};

const parsePriceFilters = (message) => {
  const text = message.toLowerCase().replace(/,/g, '');
  const filters = { min: null, max: null };

  const rangeMatch =
    text.match(/(?:from|between)\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:to|and|-)\s*\$?\s*(\d+(?:\.\d+)?)/) ||
    text.match(/\$?\s*(\d+(?:\.\d+)?)\s*(?:to|-)\s*\$?\s*(\d+(?:\.\d+)?)/);

  if (rangeMatch) {
    filters.min = Number(rangeMatch[1]);
    filters.max = Number(rangeMatch[2]);
    if (filters.min > filters.max) {
      [filters.min, filters.max] = [filters.max, filters.min];
    }
    return filters;
  }

  const minMatch = text.match(/(?:more than|over|above|greater than|>=?)\s*\$?\s*(\d+(?:\.\d+)?)/);
  if (minMatch) {
    filters.min = Number(minMatch[1]);
    return filters;
  }

  const maxMatch = text.match(/(?:less than|under|below|<=?)\s*\$?\s*(\d+(?:\.\d+)?)/);
  if (maxMatch) {
    filters.max = Number(maxMatch[1]);
    return filters;
  }

  return filters;
};

const filterProductsByPrice = (products, filters) => {
  if (filters.min == null && filters.max == null) return products;

  return products.filter((product) => {
    const price = toUSD(product.price);
    if (filters.min != null && price < filters.min) return false;
    if (filters.max != null && price > filters.max) return false;
    return true;
  });
};

const buildFallbackReply = (message, products, filters) => {
  const query = message.toLowerCase().trim();

  if (/^(hi|hello|hey)\b/.test(query)) {
    return {
      reply:
        'Hello! I can help you browse Lumina Atelier. Tell me your room, style, or budget range (for example: $100 to $300) and I will suggest products in stock.',
      productIds: [],
    };
  }

  if (products.length === 0) {
    if (filters.min != null && filters.max != null) {
      return {
        reply: `I could not find any in-stock products between ${formatUSD(filters.min)} and ${formatUSD(filters.max)}. Try widening your budget range.`,
        productIds: [],
      };
    }
    if (filters.min != null) {
      return {
        reply: `I could not find any in-stock products above ${formatUSD(filters.min)} right now.`,
        productIds: [],
      };
    }
    if (filters.max != null) {
      return {
        reply: `I could not find any in-stock products under ${formatUSD(filters.max)} right now.`,
        productIds: [],
      };
    }

    return {
      reply: 'I could not find matching products in stock right now. Try another category or budget range.',
      productIds: [],
    };
  }

  const names = products.slice(0, 3).map((product) => product.name).join(', ');
  if (filters.min != null && filters.max != null) {
    return {
      reply: `Here are ${products.length} in-stock option${products.length > 1 ? 's' : ''} between ${formatUSD(filters.min)} and ${formatUSD(filters.max)}: ${names}. Tap a product card to view details.`,
      productIds: products.slice(0, 4).map((product) => product._id.toString()),
    };
  }
  if (filters.min != null) {
    return {
      reply: `These in-stock pieces are above ${formatUSD(filters.min)}: ${names}. Tap a product card to view details.`,
      productIds: products.slice(0, 4).map((product) => product._id.toString()),
    };
  }
  if (filters.max != null) {
    return {
      reply: `These in-stock pieces are under ${formatUSD(filters.max)}: ${names}. Tap a product card to view details.`,
      productIds: products.slice(0, 4).map((product) => product._id.toString()),
    };
  }

  return {
    reply: `Here are some in-stock pieces that may fit your request: ${names}. Tap a product card to view details.`,
    productIds: products.slice(0, 4).map((product) => product._id.toString()),
  };
};

const smartFallback = (message, products) => {
  const filters = parsePriceFilters(message);
  let matched = filterProductsByPrice(products, filters);

  if (matched.length === 0 && (filters.min != null || filters.max != null)) {
    return buildFallbackReply(message, [], filters);
  }

  if (matched.length === 0) {
    const query = message.toLowerCase();
    const tokens = query.split(/\s+/).filter((token) => token.length > 2);

    matched = products
      .map((product) => {
        const haystack = [
          product.name,
          product.description,
          product.category,
          product.owner?.companyName,
          product.owner?.fullName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        let score = 0;
        for (const token of tokens) {
          if (haystack.includes(token)) score += 2;
        }
        if (query.includes((product.category || '').toLowerCase())) score += 3;
        return { product, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.product);
  }

  return buildFallbackReply(message, matched, filters);
};

export const generateChatReply = async ({ message, history = [], products = [] }) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[CHAT] GEMINI_API_KEY missing, using local product matcher.');
    return smartFallback(message, products);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const catalogText = buildCatalogText(products);
    const systemInstruction = `You are Lumina Atelier's shopping assistant for customers browsing premium home furniture.

Rules:
- Reply in English, friendly and concise (2-4 short sentences).
- Only recommend products from the catalog below that are currently in stock.
- Respect budget filters exactly. Prices in catalog are USD.
- Suggest 1-4 relevant product IDs when the customer asks about furniture, rooms, styles, budgets, or gifts.
- If nothing matches the budget, say so clearly and return productIds as [].
- If the question is unrelated to shopping or furniture, answer briefly and set productIds to [].
- Never invent products or IDs.

Return JSON only with this shape:
{"reply":"string","productIds":["mongoId1","mongoId2"]}

Current catalog:
${catalogText || 'No products available right now.'}`;

    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const formattedHistory = history
      .slice(-8)
      .filter((entry) => entry?.role && entry?.content)
      .map((entry) => ({
        role: entry.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: entry.content }],
      }));

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message.trim());
    const parsed = parseGeminiJson(result.response.text());

    const reply = typeof parsed.reply === 'string' ? parsed.reply.trim() : '';
    const productIds = Array.isArray(parsed.productIds)
      ? parsed.productIds.map(String)
      : [];

    if (!reply) {
      return smartFallback(message, products);
    }

    return { reply, productIds, source: 'gemini' };
  } catch (error) {
    const reason = error.message?.includes('429')
      ? 'Gemini quota exceeded'
      : error.message?.includes('API key')
        ? 'Invalid Gemini API key'
        : 'Gemini unavailable';

    console.warn(`[CHAT] ${reason}, using local product matcher.`, error.message?.split('\n')[0]);

    const fallback = smartFallback(message, products);
    return {
      ...fallback,
      source: 'fallback',
    };
  }
};
