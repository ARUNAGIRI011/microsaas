/**
 * Open-Higgsfield-compatible generation adapter for BizMate AI.
 *
 * The upstream Open-Higgsfield-AI project is a UI and model catalogue; actual
 * inference in that project is performed by MuAPI. Keep its API key server-side.
 * API documentation: https://github.com/Autom8AI/Open-Higgsfield-AI
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';

const API_BASE = 'https://api.muapi.ai/api/v1';
const IMAGE_MODEL = 'nano-banana';
const VIDEO_T2V_MODEL = 'seedance-v2.0-t2v';
const VIDEO_I2V_MODEL = 'seedance-v2.0-i2v';

type ProviderResponse = {
  request_id?: string;
  id?: string;
  status?: string;
  error?: string;
  detail?: string;
  message?: string;
  outputs?: string[];
  url?: string;
  output?: { url?: string };
};

function getApiKey(): string {
  const key = process.env.MUAPI_API_KEY?.trim();
  if (!key) throw new Error('OPEN_HIGGSFIELD_NOT_CONFIGURED');
  return key;
}

function signRequest(requestId: string, userId: string, key: string): string {
  return createHmac('sha256', key).update(`${requestId}:${userId}`).digest('hex');
}

function verifyRequestToken(requestId: string, userId: string, token: string, key: string): boolean {
  const expected = Buffer.from(signRequest(requestId, userId, key));
  const supplied = Buffer.from(token || '');
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

async function postJson(endpoint: string, payload: Record<string, unknown>, key: string): Promise<ProviderResponse> {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key },
    body: JSON.stringify(payload)
  });
  const data = await response.json() as ProviderResponse;
  if (!response.ok) {
    throw new Error(data.detail || data.message || data.error || `MuAPI request failed (HTTP ${response.status}).`);
  }
  return data;
}

async function uploadReference(dataUrl: string, key: string): Promise<string | undefined> {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return undefined;
  const mime = match[1];
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > 1.2 * 1024 * 1024) throw new Error('Each reference image must be 1.2 MB or smaller.');
  const form = new FormData();
  form.append('file', new Blob([Uint8Array.from(bytes).buffer as ArrayBuffer], { type: mime }), `reference.${mime.split('/')[1]}`);
  const response = await fetch(`${API_BASE}/upload_file`, {
    method: 'POST',
    headers: { 'x-api-key': key },
    body: form
  });
  const result = await response.json() as { url?: string; file_url?: string; data?: { url?: string }; detail?: string };
  if (!response.ok) throw new Error(result.detail || `MuAPI upload failed (HTTP ${response.status}).`);
  const url = result.url || result.file_url || result.data?.url;
  if (!url) throw new Error('MuAPI did not return a hosted image URL.');
  return url;
}

function readOutput(data: ProviderResponse): string | undefined {
  return data.outputs?.[0] || data.url || data.output?.url;
}

export class HiggsfieldService {
  // Keep this exported class name temporarily to avoid breaking existing imports.
  static isConfigured(): boolean {
    return Boolean(process.env.MUAPI_API_KEY?.trim());
  }

  static async submitUGCVideo(input: {
    userId: string;
    prompt: string;
    productImageDataUrl?: string;
    logoDataUrl?: string;
    language: string;
    aspectRatio?: string;
    duration?: number;
  }): Promise<{ requestId: string; requestToken: string; status: string; model: string }> {
    const key = getApiKey();
    const productUrl = input.productImageDataUrl ? await uploadReference(input.productImageDataUrl, key) : undefined;
    const logoUrl = input.logoDataUrl ? await uploadReference(input.logoDataUrl, key) : undefined;
    const imageUrls = [productUrl, logoUrl].filter((url): url is string => Boolean(url));
    const model = imageUrls.length ? VIDEO_I2V_MODEL : VIDEO_T2V_MODEL;
    const aspectRatio = ['16:9', '9:16', '4:3', '3:4'].includes(input.aspectRatio || '') ? input.aspectRatio! : '9:16';
    const duration = [5, 10, 15].includes(Number(input.duration)) ? Number(input.duration) : 5;
    const prompt = `${input.prompt}\nCreate a natural creator-style UGC advertisement. Spoken dialogue and any visible text must use ${input.language}. Preserve the uploaded product and brand; do not invent prices, addresses, phone numbers, guarantees, or claims.`;
    const payload: Record<string, unknown> = { prompt, aspect_ratio: aspectRatio, duration, quality: 'basic' };
    if (imageUrls.length) payload.images_list = imageUrls;
    const data = await postJson(model, payload, key);
    const requestId = data.request_id || data.id;
    if (!requestId) throw new Error('MuAPI did not return a video request ID.');
    return { requestId, requestToken: signRequest(requestId, input.userId, key), status: data.status || 'processing', model };
  }


  /**
   * Synchronous low-cost poster image generation.
   * Hugging Face is the default provider; Gemini image generation and MuAPI
   * are deliberately opt-in because image inference may incur charges.
   */
  static async generatePosterImage(input: {
    prompt: string;
    aspectRatio?: string;
  }): Promise<{ status: 'completed'; outputUrl: string; provider: string; model: string }> {
    const provider = (process.env.POSTER_IMAGE_PROVIDER || 'huggingface').trim().toLowerCase();
    const ratio = input.aspectRatio || '1:1';
    const ratioMap: Record<string, string> = {
      '1:1': 'square_hd',
      '16:9': 'landscape_16_9',
      '9:16': 'portrait_16_9',
      '4:5': 'portrait_4_3',
      '3:4': 'portrait_4_3',
      '4:3': 'landscape_4_3'
    };
    const prompt = `${input.prompt}
Create a professional commercial poster image with clear hierarchy, attractive lighting, realistic product photography, and a clean composition. Render all requested text in the requested language as accurately as possible. Do not invent business facts, prices, contact details, or claims.`;

    if (provider === 'huggingface') {
      const token = process.env.HF_TOKEN?.trim();
      if (!token) throw new Error('POSTER_PROVIDER_NOT_CONFIGURED: Add HF_TOKEN with Inference Providers permission. Hugging Face currently includes only a small monthly credit, not unlimited free generation.');
      const model = process.env.HF_IMAGE_MODEL?.trim() || 'black-forest-labs/FLUX.1-schnell';
      const endpoint = process.env.HF_IMAGE_ENDPOINT?.trim() || 'https://router.huggingface.co/fal-ai/fal-ai/flux/schnell';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ prompt, image_size: ratioMap[ratio] || 'square_hd', num_images: 1 })
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hugging Face poster generation failed (HTTP ${response.status}): ${errorText.slice(0, 400)}`);
      }
      if (contentType.startsWith('image/')) {
        const bytes = Buffer.from(await response.arrayBuffer());
        return { status: 'completed', outputUrl: `data:${contentType};base64,${bytes.toString('base64')}`, provider: 'huggingface', model };
      }
      const data = await response.json() as { images?: Array<{ url?: string }>; image?: { url?: string }; url?: string; image_url?: string; detail?: string };
      const outputUrl = data.images?.[0]?.url || data.image?.url || data.image_url || data.url;
      if (!outputUrl) throw new Error(data.detail || 'Hugging Face returned no image URL. Check HF_IMAGE_ENDPOINT and the model/provider availability.');
      return { status: 'completed', outputUrl, provider: 'huggingface', model };
    }

    if (provider === 'gemini') {
      const key = process.env.GEMINI_API_KEY?.trim();
      if (!key) throw new Error('POSTER_PROVIDER_NOT_CONFIGURED: Add GEMINI_API_KEY to enable Gemini image generation.');
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: key });
      const model = process.env.GEMINI_IMAGE_MODEL?.trim() || 'gemini-3.1-flash-lite-image';
      const result = await ai.interactions.create({
        model,
        input: prompt,
        response_format: { type: 'image', aspect_ratio: ratio }
      });
      const imageData = (result as unknown as { output_image?: { data?: string; mime_type?: string } }).output_image;
      if (!imageData?.data) throw new Error('Gemini did not return an image. Verify the image model and API billing access.');
      const mime = imageData.mime_type || 'image/png';
      return { status: 'completed', outputUrl: `data:${mime};base64,${imageData.data}`, provider: 'gemini', model };
    }

    throw new Error('POSTER_PROVIDER_INVALID: Set POSTER_IMAGE_PROVIDER to huggingface or gemini. Use muapi for the legacy async poster endpoint.');
  }

  static async submitPoster(input: {
    userId: string;
    prompt: string;
    logoDataUrl?: string;
    productImageDataUrl?: string;
    aspectRatio?: string;
  }): Promise<{ requestId: string; requestToken: string; status: string; model: string }> {
    const key = getApiKey();
    const productUrl = input.productImageDataUrl ? await uploadReference(input.productImageDataUrl, key) : undefined;
    const logoUrl = input.logoDataUrl ? await uploadReference(input.logoDataUrl, key) : undefined;
    const refs = [productUrl, logoUrl].filter((url): url is string => Boolean(url));
    const aspectRatio = ['1:1', '16:9', '9:16', '4:5', '3:4', '4:3'].includes(input.aspectRatio || '') ? input.aspectRatio! : '1:1';
    const prompt = `${input.prompt}\nCreate a polished, ready-to-publish small-business advertisement poster. Layout: ${aspectRatio}. Leave clear safe space for brand identity and readable copy. Use exact business details supplied in the prompt. Do not fabricate prices, phone numbers, addresses or claims. Keep logo/product appearance faithful to the references.`;
    const payload: Record<string, unknown> = { prompt, aspect_ratio: aspectRatio };
    if (refs.length) payload.image_url = refs[0];
    const data = await postJson(IMAGE_MODEL, payload, key);
    const requestId = data.request_id || data.id;
    if (!requestId) throw new Error('MuAPI did not return an image request ID.');
    return { requestId, requestToken: signRequest(requestId, input.userId, key), status: data.status || 'processing', model: IMAGE_MODEL };
  }

  static async getStatus(requestId: string, requestToken: string, userId: string): Promise<Record<string, unknown>> {
    const key = getApiKey();
    if (!/^[A-Za-z0-9_-]{8,200}$/.test(requestId) || !verifyRequestToken(requestId, userId, requestToken, key)) {
      throw new Error('VIDEO_REQUEST_NOT_FOUND');
    }
    const response = await fetch(`${API_BASE}/predictions/${encodeURIComponent(requestId)}/result`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key }
    });
    const data = await response.json() as ProviderResponse;
    if (!response.ok) throw new Error(data.detail || data.message || `MuAPI status check failed (HTTP ${response.status}).`);
    const providerStatus = String(data.status || 'processing').toLowerCase();
    const status = ['completed', 'succeeded', 'success'].includes(providerStatus) ? 'completed'
      : ['failed', 'error'].includes(providerStatus) ? 'failed'
      : providerStatus;
    return { requestId, status, outputUrl: readOutput(data), videoUrl: readOutput(data), error: status === 'failed' ? (data.error || data.detail || 'Generation failed.') : undefined };
  }
}
