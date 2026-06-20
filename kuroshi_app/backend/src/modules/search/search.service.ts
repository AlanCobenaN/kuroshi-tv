import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchDto } from './dto/search.dto';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(dto: SearchDto) {
    if (dto.q.length < 1) {
      throw new BadRequestException('La búsqueda debe tener al menos 1 carácter');
    }

    const skip = (dto.page - 1) * dto.limit;
    const query = dto.q.trim();

    const [animes, communities, users, totalAnimes, totalCommunities, totalUsers] =
      await Promise.all([
        // Anime
        this.prisma.anime.findMany({
          where: {
            isVisible: true,
            OR: [
              { titleEs: { contains: query, mode: 'insensitive' } },
              { titleJp: { contains: query, mode: 'insensitive' } },
            ],
          },
          skip,
          take: dto.limit,
          select: {
            id: true,
            slug: true,
            titleEs: true,
            titleJp: true,
            coverUrl: true,
            malRating: true,
            status: true,
            synopsis: true,
            genres: { select: { genre: { select: { name: true } } } },
          },
        }),
        // Comunidades
        this.prisma.community.findMany({
          where: {
            isActive: true,
            name: { contains: query, mode: 'insensitive' },
          },
          skip,
          take: dto.limit,
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            avatarUrl: true,
            type: true,
            membersCount: true,
          },
        }),
        // Usuarios
        this.prisma.user.findMany({
          where: {
            isActive: true,
            isBanned: false,
            username: { contains: query, mode: 'insensitive' },
          },
          skip,
          take: dto.limit,
          select: {
            id: true,
            username: true,
            bio: true,
            avatarUrl: true,
            role: true,
          },
        }),
        // Totales
        this.prisma.anime.count({
          where: {
            isVisible: true,
            OR: [
              { titleEs: { contains: query, mode: 'insensitive' } },
              { titleJp: { contains: query, mode: 'insensitive' } },
            ],
          },
        }),
        this.prisma.community.count({
          where: {
            isActive: true,
            name: { contains: query, mode: 'insensitive' },
          },
        }),
        this.prisma.user.count({
          where: {
            isActive: true,
            isBanned: false,
            username: { contains: query, mode: 'insensitive' },
          },
        }),
      ]);

    const meta = {
      page: dto.page,
      limit: dto.limit,
      total_pages: Math.ceil(
        Math.max(totalAnimes, totalCommunities, totalUsers) / dto.limit,
      ),
    };

    return {
      anime: {
        data: animes.map((a) => ({
          ...a,
          genres: a.genres.map((g) => g.genre.name),
        })),
        total: totalAnimes,
      },
      communities: {
        data: communities,
        total: totalCommunities,
      },
      users: {
        data: users,
        total: totalUsers,
      },
      meta,
    };
  }

  // ── GET /search/tenor ─────────────────────────────────────
  async searchTenor(q: string, limit = 12) {
    const apiKey = process.env.TENOR_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Búsqueda de GIFs no disponible: falta configurar TENOR_API_KEY',
      );
    }

    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${apiKey}&client_key=kuroshi&limit=${limit}&media_filter=gif,tinygif`;

    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new ServiceUnavailableException(
        `Tenor API error: ${res.status} — ${text.slice(0, 200)}`,
      );
    }

    const data: any = await res.json();

    return {
      data: (data.results ?? []).map((r: any) => ({
        id: r.id,
        title: r.content_description ?? '',
        url: r.itemurl ?? '',
        gif: r.media_format?.gif?.url ?? r.media[0]?.gif?.url ?? '',
        preview: r.media_format?.tinygif?.url ?? r.media[0]?.tinygif?.url ?? '',
        width: r.media[0]?.gif?.dims?.[0] ?? 200,
        height: r.media[0]?.gif?.dims?.[1] ?? 200,
      })),
    };
  }
}