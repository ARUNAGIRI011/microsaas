import { createHmac, timingSafeEqual } from 'node:crypto';

const API_BASE = 'https://api.higgsfield.ai';
const MODEL_TEXT = 'bytedance/seedance-2.5/text-to-video';
const MODEL_IMAGE = 'bytedance/seedance-2.5/image-to-video';

function getApiKey(): string {
  const key = process.env.HIGGSFIELD_API_KEY?.trim();
  if (!key) throw new Error('HIGGSFIELD_NOT_CONFIGURED');
  return key;
}

function authHeaders(key: string): Record<string, string> {
  return { Authorization: `Key ${key}`, 'Content-Type': 'application/json' };
}

function signRequest(requestId: string, userId: string, key: string): string {
  return createHmac('sha256', key).update(`${requestId}:${userId}`).digest('hex');
}

function verifyRequestToken(requestId: string, userId: string, token: string, key: string): boolean {
  const expected = Buffer.from(signRequest(requestId, userId, key));
  const supplied = Buffer.from(token || '');
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

async function uploadReferenceImage(dataUrl: string, key: string): Promise<string | undefined> {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return undefined; // Sample SVGs and unsupported formats fall back to text-to-video.
  const mimeType = match[1];
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > 5 * 1024 * 1024) {
    throw new Error('Reference image must be smaller than 5 MB.');
  }

  const uploadResponse = await fetch(`${API_BASE}/files/generate-upload-url`, {
    method: 'POST',
    headers: authHeaders(key),
    body: JSON.stringify({ content_type: mimeType })
  });
  const uploadData = await uploadResponse.json() as {
    upload_url?: string;
    upload_headers?: Record<string, string>;
    public_url?: string;
    message?: string;
  };
  if (!uploadResponse.ok || !uploadData.upload_url || !uploadData.public_url) {
    throw new Error(uploadData.message || 'Higgsfield did not provide a reference upload URL.');
  }

  const putResponse = await fetch(uploadData.upload_url, {
    method: 'PUT',
    headers: uploadData.upload_headers || { 'Content-Type': mimeType },
    body: new Blob([bytes], { type: mimeType })
  });
  if (!putResponse.ok) throw new Error('Could not upload the product reference image to the video provider.');
  return uploadData.public_url;
}

export class HiggsfieldService {
  static isConfigured(): boolean {
    return Boolean(process.env.HIGGSFIELD_API_KEY?.trim());
  }

  static async submitUGCVideo(input: {
    userId: string;
    prompt: string;
    productImageDataUrl?: string;
    language: string;
    aspectRatio?: string;
    duration?: number;
  }): Promise<{ requestId: string; requestToken: string; status: string; model: string }> {
    const key = getApiKey();
    const duration = Math.max(4, Math.min(30, Math.round(input.duration || 5)));
    const ratioAllowList = ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'];
    const aspectRatio = ratioAllowList.includes(input.aspectRatio || '') ? input.aspectRatio! : '9:16';
    const imageUrl = input.productImageDataUrl
      ? await uploadReferenceImage(input.productImageDataUrl, key)
      : undefined;
    const model = imageUrl ? MODEL_IMAGE : MODEL_TEXT;
    const body: Record<string, unknown> = {
      prompt: `${input.prompt}\nCreate a natural, creator-style UGC advertisement. Language for any spoken dialogue or on-screen wording: ${input.language}. Keep the product appearance realistic; do not invent prices, guarantees, contact details, or claims.`,
      duration,
      resolution: '720p',
      aspect_ratio: aspectRatio,
      output_format: 'mp4',
      generate_audio: true
    };
    if (imageUrl) body.image_url = imageUrl;

    const response = await fetch(`${API_BASE}/${model}`, {
      method: 'POST',
      headers: authHeaders(key),
      body: JSON.stringify(body)
    });
    const data = await response.json() as { request_id?: string; status?: string; message?: string; error?: string };
    if (!response.ok || !data.request_id) {
      throw new Error(data.message || data.error || `Higgsfield request failed (HTTP ${response.status}).`);
    }
    return {
      requestId: data.request_id,
      requestToken: signRequest(data.request_id, input.userId, key),
      status: data.status || 'queued',
      model
    };
  }

  static async getStatus(requestId: string, requestToken: string, userId: string): Promise<Record<string, unknown>> {
    const key = getApiKey();
    if (!/^[A-Za-z0-9_-]{8,200}$/.test(requestId) || !verifyRequestToken(requestId, userId, requestToken, key)) {
      throw new Error('VIDEO_REQUEST_NOT_FOUND');
    }
    const response = await fetch(`${API_BASE}/requests/${encodeURIComponent(requestId)}/status`, {
      method: 'GET',
      headers: { Authorization: `Key ${key}` }
    });
    const data = await response.json() as Record<string, any>;
    if (!response.ok) throw new Error(data.message || `Higgsfield status check failed (HTTP ${response.status}).`);
    const status = String(data.status || 'processing').toLowerCase();
    const videoUrl = typeof data.video?.url === 'string' ? data.video.url
      : typeof data.video_url === 'string' ? data.video_url
      : undefined;
    return { requestId, status, videoUrl, error: status === 'failed' ? (data.error || data.message || 'Video generation failed.') : undefined };
  }
}
