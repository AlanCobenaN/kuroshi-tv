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
              { titleEn: { contains: query, mode: 'insensitive' } },
              { titleJp: { contains: query, mode: 'insensitive' } },
            ],
          },
          skip,
          take: dto.limit,
          select: {
            id: true,
            slug: true,
            titleEs: true,
            titleEn: true,
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
              { titleEn: { contains: query, mode: 'insensitive' } },
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

  // ── GET /search/gifs ──────────────────────────────────────
  async searchGifs(q: string, limit = 12) {
    const apiKey = process.env.GIPHY_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Búsqueda de GIFs no disponible: falta configurar GIPHY_API_KEY en .env',
      );
    }

    const url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(q)}&limit=${limit}`;

    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new ServiceUnavailableException(
        `GIPHY API error: ${res.status} — ${text.slice(0, 200)}`,
      );
    }

    const data: any = await res.json();

    return {
      data: (data.data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title ?? '',
        url: r.url ?? '',
        gif: r.images?.original?.url ?? '',
        preview: r.images?.fixed_height_small?.url ?? '',
        width: r.images?.original?.width ?? 200,
        height: r.images?.original?.height ?? 200,
      })),
    };
  }
}