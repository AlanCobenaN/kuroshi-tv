import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import {
  GetAnimesDto,
  AnimeOrder,
  GetEpisodesDto,
  GetEpisodeCommentsDto,
  CreateEpisodeCommentDto,
  RateAnimeDto,
} from './dto/anime.dto';

@Injectable()
export class AnimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  async getAnimes(dto: GetAnimesDto, userId?: string) {
    const { search, genre, status, season, year, studio, order, page, limit } = dto;
    const skip = (page - 1) * limit;
    const where: any = { isVisible: true };
    if (search) {
      where.OR = [
        { titleEs: { contains: search, mode: 'insensitive' } },
        { titleJp: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (season) where.season = { equals: season, mode: 'insensitive' };
    if (year) where.year = year;
    if (studio) where.studio = { contains: studio, mode: 'insensitive' };
    if (genre) {
      where.genres = {
        some: { genre: { name: { equals: genre, mode: 'insensitive' } } },
      };
    }
    let orderBy: any = { totalViews: 'desc' };
    if (order === AnimeOrder.WEEKLY) orderBy = { totalViews: 'desc' };
    else if (order === AnimeOrder.RATING) orderBy = { malRating: 'desc' };
    else if (order === AnimeOrder.RECENT) orderBy = { createdAt: 'desc' };
    else if (order === AnimeOrder.ALPHABETICAL) orderBy = { titleEs: 'asc' };

    const [animes, total] = await Promise.all([
      this.prisma.anime.findMany({
        where, orderBy, skip, take: limit,
        select: {
          id: true, slug: true, titleEs: true, titleJp: true, status: true,
          malRating: true, coverUrl: true, year: true, season: true, totalViews: true,
          genres: { select: { genre: { select: { name: true } } } },
        },
      }),
      this.prisma.anime.count({ where }),
    ]);

    return {
      data: animes.map(this.formatAnimeCard),
      meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
  }

  async getTrending() {
    const animes = await this.prisma.anime.findMany({
      where: { isVisible: true },
      orderBy: { totalViews: 'desc' },
      take: 10,
      select: {
        id: true, slug: true, titleEs: true, titleJp: true, malRating: true,
        coverUrl: true, bannerUrl: true, totalViews: true, status: true,
        genres: { select: { genre: { select: { name: true } } } },
      },
    });
    return animes.map((a, index) => ({ ...this.formatAnimeCard(a), rank: index + 1 }));
  }

  async getAiring() {
    const animes = await this.prisma.anime.findMany({
      where: { isVisible: true, status: 'en_emision' },
      orderBy: { totalViews: 'desc' },
      take: 20,
      select: {
        id: true, slug: true, titleEs: true, titleJp: true, malRating: true,
        coverUrl: true, bannerUrl: true, status: true,
        genres: { select: { genre: { select: { name: true } } } },
        seasons: {
          orderBy: { number: 'desc' }, take: 1,
          select: {
            episodes: {
              orderBy: { number: 'desc' }, take: 1,
              select: { id: true, number: true, title: true, thumbnailUrl: true, airDate: true },
            },
          },
        },
      },
    });
    return animes.map((anime) => {
      const lastEpisode = anime.seasons[0]?.episodes[0] ?? null;
      const { seasons, ...rest } = anime;
      return { ...this.formatAnimeCard(rest), lastEpisode };
    });
  }

  async getLatestEpisodes() {
    const episodes = await this.prisma.episode.findMany({
      where: {
        season: { anime: { isVisible: true } },
        airDate: { not: null },
      },
      orderBy: { airDate: 'desc' },
      take: 12,
      select: {
        id: true, number: true, title: true, thumbnailUrl: true, airDate: true,
        season: {
          select: {
            anime: {
              select: {
                id: true, slug: true, titleEs: true, coverUrl: true, malRating: true,
                genres: { select: { genre: { select: { id: true, name: true } } } },
              },
            },
          },
        },
      },
    });
    return episodes.map((ep) => ({
      episode: {
        id: ep.id, number: ep.number, title: ep.title,
        thumbnail_url: ep.thumbnailUrl, air_date: ep.airDate,
      },
      anime: {
        id: ep.season.anime.id, slug: ep.season.anime.slug,
        title_es: ep.season.anime.titleEs, cover_url: ep.season.anime.coverUrl,
        mal_rating: ep.season.anime.malRating,
        genres: ep.season.anime.genres.map((g) => g.genre),
      },
    }));
  }

  async getAnimeBySlug(slug: string, userId?: string) {
    const anime = await this.prisma.anime.findUnique({
      where: { slug },
      include: {
        genres: { select: { genre: { select: { id: true, name: true } } } },
        seasons: {
          orderBy: { number: 'asc' },
          select: {
            id: true, number: true, title: true, type: true,
            _count: { select: { episodes: true } },
          },
        },
        ratings: { select: { stars: true } },
        _count: { select: { ratings: true } },
      },
    });
    if (!anime) throw new NotFoundException('Anime no encontrado');

    const avgRating = anime.ratings.length > 0
      ? anime.ratings.reduce((sum, r) => sum + r.stars, 0) / anime.ratings.length
      : null;

    await this.prisma.anime.update({
      where: { id: anime.id },
      data: { totalViews: { increment: 1 } },
    });

    let userWatchlist = null;
    let userProgress = null;
    if (userId) {
      userWatchlist = await this.prisma.userWatchlist.findUnique({
        where: { userId_animeId: { userId, animeId: anime.id } },
        select: { status: true, personalRating: true, lastWatchedAt: true },
      });
      userProgress = await this.prisma.userProgress.findFirst({
        where: { userId, episode: { season: { animeId: anime.id } }, completed: false },
        orderBy: { watchedAt: 'desc' },
        select: {
          lastMinute: true,
          episode: {
            select: {
              id: true, number: true, title: true,
              season: { select: { number: true } },
            },
          },
        },
      });
    }

    const { ratings, ...animeData } = anime;
    return {
      ...animeData,
      genres: anime.genres.map((g) => g.genre),
      kuroshiRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      kuroshiRatingCount: anime._count.ratings,
      userWatchlist,
      userProgress,
    };
  }

  async getEpisodes(slug: string, dto: GetEpisodesDto) {
    const anime = await this.prisma.anime.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!anime) throw new NotFoundException('Anime no encontrado');

    return this.prisma.animeSeason.findMany({
      where: {
        animeId: anime.id,
        ...(dto.season ? { number: dto.season } : {}),
      },
      orderBy: { number: 'asc' },
      include: {
        episodes: {
          orderBy: { number: dto.order === 'desc' ? 'desc' : 'asc' },
          select: {
            id: true, number: true, title: true, thumbnailUrl: true, airDate: true,
            views: true, adPrerollEnabled: true, adPrerollMinute: true,
            adEndingEnabled: true, adEndingMinute: true,
            _count: { select: { videoServers: true } },
          },
        },
      },
    });
  }

  async getEpisode(slug: string, episodeNumber: number) {
    const anime = await this.prisma.anime.findUnique({
      where: { slug },
      select: { id: true, titleEs: true, slug: true },
    });
    if (!anime) throw new NotFoundException('Anime no encontrado');

    const episode = await this.prisma.episode.findFirst({
      where: { number: episodeNumber, season: { animeId: anime.id } },
      include: {
        videoServers: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, serverName: true, embedUrl: true, sortOrder: true },
        },
        season: { select: { number: true, type: true } },
      },
    });
    if (!episode) throw new NotFoundException('Episodio no encontrado');

    await this.prisma.episode.update({
      where: { id: episode.id },
      data: { views: { increment: 1 } },
    });

    return { ...episode, anime: { id: anime.id, titleEs: anime.titleEs, slug: anime.slug } };
  }

  async getEpisodeComments(slug: string, episodeNumber: number, dto: GetEpisodeCommentsDto) {
    const episode = await this.findEpisodeBySlugAndNumber(slug, episodeNumber);
    const where: any = { episodeId: episode.id, isDeleted: false };
    if (dto.minute !== undefined) {
      where.videoMinute = {
        gte: Math.max(0, dto.minute - 2),
        lte: dto.minute + 2,
      };
    }
    const skip = (dto.page - 1) * dto.limit;
    const [comments, total] = await Promise.all([
      this.prisma.episodeComment.findMany({
        where,
        orderBy: [{ likesCount: 'desc' }, { createdAt: 'asc' }],
        skip,
        take: dto.limit,
        select: {
          id: true, content: true, videoMinute: true, likesCount: true,
          hasSpoiler: true, createdAt: true,
          user: { select: { id: true, username: true, avatarUrl: true, role: true } },
        },
      }),
      this.prisma.episodeComment.count({ where }),
    ]);
    return {
      data: comments,
      meta: { page: dto.page, total, total_pages: Math.ceil(total / dto.limit) },
    };
  }

  async createEpisodeComment(
    slug: string,
    episodeNumber: number,
    userId: string,
    dto: CreateEpisodeCommentDto,
  ) {
    const episode = await this.findEpisodeBySlugAndNumber(slug, episodeNumber);

    if (dto.content.length > 200) {
      throw new ForbiddenException('El comentario no puede superar 200 caracteres');
    }

    const comment = await this.prisma.episodeComment.create({
      data: {
        episodeId: episode.id,
        userId,
        content: dto.content,
        videoMinute: dto.videoMinute,
        videoSecond: dto.videoSecond,
        hasSpoiler: dto.hasSpoiler ?? false,
      },
      select: {
        id: true, content: true, videoMinute: true, videoSecond: true, likesCount: true,
        hasSpoiler: true, createdAt: true,
        user: { select: { id: true, username: true, avatarUrl: true, role: true } },
      },
    });

    // Emitir al canal episode:{episodeId} — característica diferenciadora
    await this.realtime.emitNewEpisodeComment(episode.id, comment);

    return comment;
  }

  async likeEpisodeComment(commentId: string, userId: string) {
    const comment = await this.prisma.episodeComment.findUnique({
      where: { id: commentId, isDeleted: false },
      select: { id: true, episodeId: true },
    });
    if (!comment) throw new NotFoundException('Comentario no encontrado');

    const updated = await this.prisma.episodeComment.update({
      where: { id: commentId },
      data: { likesCount: { increment: 1 } },
      select: { id: true, likesCount: true },
    });

    // Emitir like al canal del episodio
    await this.realtime.emitEpisodeCommentLiked(
      comment.episodeId,
      updated.id,
      updated.likesCount,
    );

    return updated;
  }

  async rateAnime(slug: string, userId: string, dto: RateAnimeDto) {
    const anime = await this.prisma.anime.findUnique({
      where: { slug, isVisible: true },
      select: { id: true },
    });
    if (!anime) throw new NotFoundException('Anime no encontrado');

    const rating = await this.prisma.animeRating.upsert({
      where: { userId_animeId: { userId, animeId: anime.id } },
      update: { stars: dto.stars },
      create: { userId, animeId: anime.id, stars: dto.stars },
      select: { stars: true },
    });

    const avg = await this.prisma.animeRating.aggregate({
      where: { animeId: anime.id },
      _avg: { stars: true },
      _count: { stars: true },
    });

    return {
      yourRating: rating.stars,
      kuroshiRating: Math.round((avg._avg.stars ?? 0) * 10) / 10,
      totalVotes: avg._count.stars,
    };
  }

  private async findEpisodeBySlugAndNumber(slug: string, episodeNumber: number) {
    const anime = await this.prisma.anime.findUnique({
      where: { slug, isVisible: true },
      select: { id: true },
    });
    if (!anime) throw new NotFoundException('Anime no encontrado');

    const episode = await this.prisma.episode.findFirst({
      where: { number: episodeNumber, season: { animeId: anime.id } },
      select: { id: true, number: true },
    });
    if (!episode) throw new NotFoundException('Episodio no encontrado');
    return episode;
  }

  private formatAnimeCard(anime: any) {
    return {
      ...anime,
      genres: anime.genres?.map((g: any) => g.genre?.name ?? g) ?? [],
      totalViews: Number(anime.totalViews ?? 0),
    };
  }
}