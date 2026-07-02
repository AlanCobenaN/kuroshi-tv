import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';
const FRESH_HOURS = 6; // re-fetch si pasaron 6+ horas desde el último sync

@Injectable()
export class SchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getSchedule() {
    // Verificar si hay datos frescos
    const latest = await this.prisma.airingSchedule.findFirst({
      orderBy: { syncedAt: 'desc' },
    });

    // Forzar sync si no hay datos, pasaron 6h, o hay registros sin malId (schema anterior)
    const missingMalId = await this.prisma.airingSchedule.count({
      where: { malId: null },
    });

    const needsSync =
      !latest ||
      Date.now() - latest.syncedAt.getTime() > FRESH_HOURS * 3600 * 1000 ||
      missingMalId > 0;

    if (needsSync) {
      await this.syncFromAniList();
    }

    // Devolver programación futura agrupada por día
    const now = new Date();
    const schedules = await this.prisma.airingSchedule.findMany({
      where: { airingAt: { gte: now } },
      orderBy: { airingAt: 'asc' },
      take: 200,
    });

    // Filtrar solo animes registrados en nuestra base de datos
    // 1) Match por malId exacto
    const malIds = [...new Set(schedules.map((s) => s.malId).filter(Boolean))] as number[];
    const animesConMalId = await this.prisma.anime.findMany({
      where: { malId: { in: malIds } },
      select: { malId: true },
    });
    const existingMalIds = new Set(animesConMalId.map((a) => a.malId));

    // 2) Fallback: animes agregados manualmente (sin malId) → match por título normalizado
    const animesSinMalId = await this.prisma.anime.findMany({
      where: { OR: [{ malId: null }, { malId: 0 }] },
      select: { titleEs: true, titleEn: true, titleJp: true, aliases: true },
    });
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const knownTitles = new Set<string>();
    for (const a of animesSinMalId) {
      if (a.titleEs) knownTitles.add(normalize(a.titleEs));
      if (a.titleEn) knownTitles.add(normalize(a.titleEn));
      if (a.titleJp) knownTitles.add(normalize(a.titleJp));
      if (a.aliases) for (const alias of a.aliases as string[]) knownTitles.add(normalize(alias));
    }

    const filtered = schedules.filter((s) => {
      if (s.malId && existingMalIds.has(s.malId)) return true;
      if (s.title && knownTitles.has(normalize(s.title))) return true;
      return false;
    });

    return this.groupByDay(filtered);
  }

  private async syncFromAniList() {
    const query = `
      query {
        Page(page: 1, perPage: 100) {
          airingSchedules(notYetAired: true, sort: TIME) {
            id
            airingAt
            episode
            mediaId
            media {
              id
              idMal
              title { romaji english native }
              coverImage { large }
            }
          }
          pageInfo { hasNextPage }
        }
      }
    `;

    try {
      const res = await axios.post(ANILIST_ENDPOINT, { query }, { timeout: 15000 });
      const entries: any[] = res.data?.data?.Page?.airingSchedules ?? [];

      if (entries.length === 0) return;

      // Limpiar schedule anterior y guardar el nuevo
      await this.prisma.airingSchedule.deleteMany();

      const data = entries.map((e: any) => ({
        anilistId: e.mediaId,
        malId: e.media?.idMal ?? null,
        episode: e.episode,
        airingAt: new Date((e.airingAt as number) * 1000),
        title: e.media?.title?.romaji ?? e.media?.title?.english ?? null,
        coverUrl: e.media?.coverImage?.large ?? null,
      }));

      // Batch insert
      await this.prisma.airingSchedule.createMany({ data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[Schedules] Error syncing from AniList:', msg);
      // Si falla el sync, los datos existentes se devuelven aunque sean viejos
    }
  }

  private groupByDay(schedules: any[]) {
    const groups: Record<string, any[]> = {};

    for (const s of schedules) {
      const day = s.airingAt.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!groups[day]) groups[day] = [];
      groups[day].push({
        id: s.id,
        anilistId: s.anilistId,
        episode: s.episode,
        airingAt: s.airingAt,
        title: s.title,
        coverUrl: s.coverUrl,
      });
    }

    return Object.entries(groups)
      .map(([date, items]) => ({ date, items }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
