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

    const needsSync =
      !latest ||
      Date.now() - latest.syncedAt.getTime() > FRESH_HOURS * 3600 * 1000;

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

    return this.groupByDay(schedules);
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
