import { AppError } from '@shared/domain/errors/AppError';
import { SentryIssueSummary } from '../../domain/entities/TrackingStats';
import { IErrorMonitorRepository } from '../../domain/repositories/IErrorMonitorRepository';

const SENTRY_ORG = 'lubswer';
const SENTRY_PROJECT = 'expo';

function findTag(tags: { key: string; value: string }[] | undefined, key: string): string | null {
  if (!Array.isArray(tags)) return null;
  const found = tags.find((t) => t.key === key);
  return found?.value ?? null;
}

export class SentryApiErrorMonitorRepository implements IErrorMonitorRepository {
  async getReportedIssues(): Promise<SentryIssueSummary[]> {
    const token = process.env.EXPO_PUBLIC_SENTRY_AUTH_TOKEN ?? '';
    if (!token) {
      throw new AppError(
        'Falta configurar EXPO_PUBLIC_SENTRY_AUTH_TOKEN en .env para consultar Sentry.',
        'AUTH_ERROR',
      );
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    const issuesUrl = `https://us.sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/issues/?limit=15`;
    const response = await fetch(issuesUrl, { headers });

    if (!response.ok) {
      throw new AppError(
        `No se pudo consultar Sentry (HTTP ${response.status}). Verifica el Personal Token.`,
        'UNKNOWN_ERROR',
      );
    }

    const rawIssues = (await response.json()) as any[];

    const enriched = await Promise.all(
      (rawIssues ?? []).map(async (item) => {
        let deviceModel = 'No reportado';
        let osVersion = 'No reportada';
        let screen = String(item.culprit ?? 'No especificada');
        let affectedUser = 'Anónimo';
        let location: string | null = null;

        try {
          const eventUrl = `https://us.sentry.io/api/0/issues/${item.id}/events/latest/`;
          const eventRes = await fetch(eventUrl, { headers });
          if (eventRes.ok) {
            const ev = await eventRes.json();
            const tags = ev.tags as { key: string; value: string }[] | undefined;

            const tagDevice = findTag(tags, 'device_model');
            const ctxDevice = ev.contexts?.device?.model;
            deviceModel = tagDevice ?? ctxDevice ?? deviceModel;

            const tagOs = findTag(tags, 'os_version');
            const ctxOs = ev.contexts?.os
              ? `${ev.contexts.os.name ?? ''} ${ev.contexts.os.version ?? ''}`.trim()
              : null;
            osVersion = tagOs ?? ctxOs ?? osVersion;

            const tagScreen = findTag(tags, 'screen');
            if (tagScreen) {
              screen = tagScreen;
            }

            if (ev.user?.email || ev.user?.username || ev.user?.id) {
              affectedUser = String(ev.user.email ?? ev.user.username ?? ev.user.id);
            }

            location = findTag(tags, 'gps_location');
          }
        } catch {
          // Si falla el detalle de un evento individual, conservamos el resumen del issue
        }

        return {
          id: String(item.id),
          title: String(item.title ?? 'Error sin título'),
          culprit: String(item.culprit ?? 'Origen no especificado'),
          screen,
          deviceModel,
          osVersion,
          affectedUser,
          location,
          level: String(item.level ?? 'error'),
          status: String(item.status ?? 'unresolved'),
          count: Number(item.count ?? 0),
          userCount: Number(item.userCount ?? 0),
          lastSeen: String(item.lastSeen ?? ''),
          permalink: String(item.permalink ?? ''),
        } satisfies SentryIssueSummary;
      }),
    );

    return enriched;
  }
}
