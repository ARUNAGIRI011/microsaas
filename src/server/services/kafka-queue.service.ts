/**
 * Kafka-compatible queue publisher for Upstash Kafka REST.
 * Producer only: consumers must run as a separate long-lived worker.
 * Billable generation must not be enqueued until jobs/credits use durable storage.
 */
export type BizMateEvent =
  | { eventId: string; type: 'generation.requested'; userId: string; jobId: string; payload: Record<string, unknown>; createdAt: string }
  | { eventId: string; type: 'generation.completed' | 'generation.failed'; userId: string; jobId: string; createdAt: string; details?: Record<string, unknown> };

function kafkaConfig() {
  const url = process.env.UPSTASH_KAFKA_REST_URL?.trim().replace(/\/$/, '');
  const token = process.env.UPSTASH_KAFKA_REST_TOKEN?.trim();
  const topic = (process.env.UPSTASH_KAFKA_TOPIC || 'bizmate-generation-events').trim();
  return url && token ? { url, token, topic } : null;
}

export class KafkaQueueService {
  static isConfigured(): boolean { return Boolean(kafkaConfig()); }

  static async publish(event: BizMateEvent): Promise<{ accepted: boolean; topic: string }> {
    const config = kafkaConfig();
    if (!config) throw new Error('KAFKA_QUEUE_NOT_CONFIGURED');
    const response = await fetch(`${config.url}/produce/${encodeURIComponent(config.topic)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: event.userId, value: JSON.stringify(event) }),
      signal: AbortSignal.timeout(2500)
    });
    if (!response.ok) throw new Error(`KAFKA_QUEUE_UPSTREAM_${response.status}`);
    const payload = await response.json() as { error?: string };
    if (payload.error) throw new Error('KAFKA_QUEUE_PUBLISH_FAILED');
    return { accepted: true, topic: config.topic };
  }
}
