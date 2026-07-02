import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import axios, { AxiosError } from 'axios';
import {
  ImportAnimeDto,
  CreateAnimeDto,
  UpdateAnimeDto,
  CreateEpisodeDto,
  CreateSeasonWithEpisodesDto,
  AddVideoServerDto,
  GetUsersDto,
  WarnUserDto,
  SilenceUserDto,
  BanUserDto,
  ChangeRoleDto,
  PromoteCommunityDto,
  ReviewReportDto,
  UpdateGlobalSettingsDto,
  GetStatsDto,
  CreateGenreDto,
  UpdateGenreDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ══════════════════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════════════════

  async getDashboard() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      newUsersToday,
      totalAnimes,
      totalEpisodes,
      totalCommunities,
      totalPosts,
      pendingReports,
      recentUsers,
      recentReports,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.anime.count(),
      this.prisma.episode.count(),
      this.prisma.community.count({ where: { isActive: true } }),
      this.prisma.post.count({ where: { isDeleted: false } }),
      this.prisma.report.count({ where: { status: 'pendiente' } }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, username: true, email: true, role: true, createdAt: true },
      }),
      this.prisma.report.findMany({
        where: { status: 'pendiente' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          contentType: true,
          reasons: true,
          createdAt: true,
          reporter: { select: { username: true } },
        },
      }),
    ]);

    return {
      realtime: {
        pendingReports,
        newUsersToday,
      },
      totals: {
        users: totalUsers,
        animes: totalAnimes,
        episodes: totalEpisodes,
        communities: totalCommunities,
        posts: totalPosts,
      },
      recentUsers,
      recentReports,
    };
  }

  // ══════════════════════════════════════════════════════════
  // GESTIÓN DE ANIME
  // ══════════════════════════════════════════════════════════

  async getAnimes(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { titleEs: { contains: search, mode: 'insensitive' } },
        { titleEn: { contains: search, mode: 'insensitive' } },
        { titleJp: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [animes, total] = await Promise.all([
      this.prisma.anime.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          slug: true,
          titleEs: true,
          titleEn: true,
          titleJp: true,
          synopsis: true,
          status: true,
          isVisible: true,
          totalViews: true,
          malRating: true,
          malId: true,
          coverUrl: true,
          bannerUrl: true,
          year: true,
          season: true,
          studio: true,
          totalEpisodes: true,
          aliases: true,
          sameAs: true,
          tags: true,
          genres: { select: { genre: { select: { id: true, name: true } } } },
          _count: { select: { seasons: true } },
        },
      }),
      this.prisma.anime.count({ where }),
    ]);

    const formatGenres = (a: any) => ({
      ...a,
      totalViews: Number(a.totalViews),
      genres: a.genres?.map((g: any) => g.genre) ?? [],
    });

    return {
      data: animes.map(formatGenres),
      meta: { page, total, total_pages: Math.ceil(total / limit) },
    };
  }

  async importFromMAL(dto: ImportAnimeDto) {
    const malClientId = this.config.get<string>('MAL_CLIENT_ID');

    if (!malClientId || malClientId === 'REEMPLAZAR') {
      throw new BadRequestException('MAL_CLIENT_ID no configurado en el .env');
    }

    try {
      const response = await axios.get(
        `https://api.myanimelist.net/v2/anime/${dto.malId}`,
        {
          params: {
            fields:
              'id,title,alternative_titles,mean,status,num_episodes,start_season,studios,main_picture,pictures',
          },
          headers: { 'X-MAL-CLIENT-ID': malClientId },
          timeout: 10000,
        },
      );

      const data = response.data;

      const statusMap: Record<string, string> = {
        currently_airing: 'en_emision',
        finished_airing: 'finalizado',
        not_yet_aired: 'proximamente',
      };

      const bannerUrl = data.pictures?.[1]?.large ?? data.pictures?.[0]?.large ?? null;

      const titleEn = data.alternative_titles?.en ?? null;
      const aliases: string[] = [];
      if (data.alternative_titles?.synonyms) {
        aliases.push(...data.alternative_titles.synonyms);
      }
      if (titleEn && titleEn !== data.title) aliases.push(titleEn);
      if (data.alternative_titles?.es && data.alternative_titles.es !== data.title && data.alternative_titles.es !== titleEn) {
        aliases.push(data.alternative_titles.es);
      }

      return {
        titleEs: data.alternative_titles?.es ?? data.title,
        titleEn,
        titleJp: data.title,
        malRating: data.mean,
        malId: data.id,
        status: statusMap[data.status] ?? 'proximamente',
        totalEpisodes: data.num_episodes,
        year: data.start_season?.year,
        season: data.start_season?.season,
        studio: data.studios?.[0]?.name,
        coverUrl: data.main_picture?.large ?? data.main_picture?.medium,
        bannerUrl,
        aliases,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      throw new BadRequestException(`Error al importar desde MAL: ${msg}`);
    }
  }

  async importFullFromMAL(dto: ImportAnimeDto) {
    const malClientId = this.config.get<string>('MAL_CLIENT_ID');
    if (!malClientId || malClientId === 'REEMPLAZAR') {
      throw new BadRequestException('MAL_CLIENT_ID no configurado en el .env');
    }

    let animeData: any;
    let episodesData: any[] = [];

    try {
      // 1. Fetch anime details from MAL
      const response = await axios.get(
        `https://api.myanimelist.net/v2/anime/${dto.malId}`,
        {
          params: {
            fields:
              'id,title,alternative_titles,mean,status,num_episodes,start_season,studios,main_picture,pictures',
          },
          headers: { 'X-MAL-CLIENT-ID': malClientId },
          timeout: 30000,
        },
      );
      animeData = response.data;

      // 2. Fetch episodes from Jikan API (no auth needed)
      let jikanPage = 0;
      let hasNext = true;
      while (hasNext) {
        jikanPage++;
        const epRes = await axios.get(
          `https://api.jikan.moe/v4/anime/${dto.malId}/episodes`,
          { params: { page: jikanPage }, timeout: 30000 },
        );
        await new Promise((r) => setTimeout(r, 800));
        const pageData = epRes.data?.data ?? [];
        if (pageData.length === 0) break;
        // Jikan returns flat episode objects with 'episode' instead of 'episode_number' and 'aired' instead of 'air_date'
        episodesData.push(...pageData);
        hasNext = epRes.data?.pagination?.has_next_page ?? false;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      throw new BadRequestException(`Error al importar desde MAL: ${msg}`);
    }

    const statusMap: Record<string, string> = {
      currently_airing: 'en_emision',
      finished_airing: 'finalizado',
      not_yet_aired: 'proximamente',
    };

    const slug = this.generateSlug(
      animeData.alternative_titles?.es ?? animeData.title,
    );
    const coverUrl =
      animeData.main_picture?.large ?? animeData.main_picture?.medium;
    const bannerUrl =
      animeData.pictures?.[1]?.large ??
      animeData.pictures?.[0]?.large ??
      coverUrl;

    // 3. Check if already exists
    const existingSlug = await this.prisma.anime.findUnique({ where: { slug } });
    if (existingSlug) throw new ConflictException('Ya existe un anime con ese título');

    const existingMal = await this.prisma.anime.findUnique({
      where: { malId: animeData.id },
    });
    if (existingMal) throw new ConflictException('Este anime ya existe (mismo MAL ID)');

    const titleEn = animeData.alternative_titles?.en ?? null;
    const aliases: string[] = [];
    if (animeData.alternative_titles?.synonyms) {
      aliases.push(...animeData.alternative_titles.synonyms);
    }
    if (titleEn && titleEn !== animeData.title) aliases.push(titleEn);
    if (animeData.alternative_titles?.es && animeData.alternative_titles.es !== animeData.title && animeData.alternative_titles.es !== titleEn) {
      aliases.push(animeData.alternative_titles.es);
    }

    // 4. Create anime
    const anime = await this.prisma.anime.create({
      data: {
        slug,
        titleEs: animeData.alternative_titles?.es ?? animeData.title,
        titleEn,
        titleJp: animeData.title,
        aliases: aliases.length > 0 ? aliases : undefined,
        malRating: animeData.mean,
        malId: animeData.id,
        status: (statusMap[animeData.status] ?? 'proximamente') as any,
        totalEpisodes: animeData.num_episodes,
        year: animeData.start_season?.year,
        season: animeData.start_season?.season,
        studio: animeData.studios?.[0]?.name,
        coverUrl,
        bannerUrl,
        tags: ['Anime', 'Sub Español'],
      },
    });

    // 5. Create season and episodes
    if (episodesData.length > 0) {
      const season = await this.prisma.animeSeason.create({
        data: { animeId: anime.id, number: 1, type: 'regular' },
      });

      const episodesToCreate = episodesData
        .filter((ep: any) => (ep.episode ?? ep.episode_number ?? ep.mal_id) > 0)
        .map((ep: any) => ({
          seasonId: season.id,
          number: ep.episode ?? ep.episode_number ?? ep.mal_id,
          title: `Episodio ${ep.episode ?? ep.episode_number ?? ep.mal_id}`,
          synopsis: ep.synopsis ?? null,
          thumbnailUrl: coverUrl,
          airDate: (ep.aired ?? ep.air_date) ? new Date(ep.aired ?? ep.air_date) : null,
        }));

      await this.prisma.episode.createMany({ data: episodesToCreate });
    }

    // Refrescar calendario
    await this.prisma.airingSchedule.deleteMany().catch(() => {});

    return {
      anime: {
        id: anime.id,
        slug: anime.slug,
        titleEs: anime.titleEs,
        titleJp: anime.titleJp,
        status: anime.status,
        coverUrl: anime.coverUrl,
        bannerUrl: anime.bannerUrl,
        totalEpisodes: anime.totalEpisodes,
      },
      episodesImported: episodesData.length,
      message: `Anime y ${episodesData.length} episodios importados correctamente`,
    };
  }

  async syncEpisodesFromMAL(slug: string) {
    const malClientId = this.config.get<string>('MAL_CLIENT_ID');
    if (!malClientId || malClientId === 'REEMPLAZAR') {
      throw new BadRequestException('MAL_CLIENT_ID no configurado en el .env');
    }

    const anime = await this.prisma.anime.findUnique({
      where: { slug },
      include: { seasons: { include: { episodes: true } } },
    });
    if (!anime) throw new NotFoundException('Anime no encontrado');
    if (!anime.malId) throw new BadRequestException('Este anime no tiene MAL ID');

    // Get existing episode numbers for each season
    const existingEpNums = new Set<number>();
    for (const s of anime.seasons) {
      for (const ep of s.episodes) existingEpNums.add(ep.number);
    }

    // Fetch episodes from Jikan API (no auth needed)
    let episodesData: any[] = [];
    try {
      let jikanPage = 0;
      let hasNext = true;
      while (hasNext) {
        jikanPage++;
        const epRes = await axios.get(
          `https://api.jikan.moe/v4/anime/${anime.malId}/episodes`,
          { params: { page: jikanPage }, timeout: 10000 },
        );
        const pageData = epRes.data?.data ?? [];
        if (pageData.length === 0) break;
        episodesData.push(...pageData);
        hasNext = epRes.data?.pagination?.has_next_page ?? false;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      throw new BadRequestException(`Error al obtener episodios: ${msg}`);
    }

    const newEpisodes = episodesData
      .filter((ep: any) => (ep.episode ?? ep.episode_number ?? ep.mal_id) > 0 && !existingEpNums.has(ep.episode ?? ep.episode_number ?? ep.mal_id));

    if (newEpisodes.length === 0) {
      return { message: 'No hay episodios nuevos para importar', imported: 0 };
    }

    // Find or create season 1
    let season = anime.seasons.find(s => s.number === 1);
    if (!season) {
      season = await this.prisma.animeSeason.create({
        data: { animeId: anime.id, number: 1, type: 'regular' },
        include: { episodes: true },
      });
    }

    const coverUrl = anime.coverUrl;
    let createdCount = 0;
    for (const ep of newEpisodes) {
      const epNum = ep.episode ?? ep.episode_number ?? ep.mal_id;
      await this.prisma.episode.create({
        data: {
          seasonId: season.id,
          number: epNum,
          title: `Episodio ${epNum}`,
          synopsis: ep.synopsis ?? null,
          thumbnailUrl: coverUrl,
          airDate: (ep.aired ?? ep.air_date) ? new Date(ep.aired ?? ep.air_date) : null,
        },
      });
      createdCount++;
    }

    return { message: `${createdCount} episodios importados desde MAL`, imported: createdCount };
  }

  async createAnime(dto: CreateAnimeDto) {
    const slug = this.generateSlug(dto.titleEs);

    const existing = await this.prisma.anime.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Ya existe un anime con ese título');

    if (dto.malId) {
      const existingMal = await this.prisma.anime.findUnique({
        where: { malId: dto.malId },
      });
      if (existingMal) throw new ConflictException('Este anime ya existe (mismo MAL ID)');
    }

    const { genres, seasonNumber, seasonEpisodes, tags, ...animeData } = dto;

    const anime = await this.prisma.anime.create({
      data: {
        ...animeData,
        slug,
        status: (dto.status as any) ?? 'proximamente',
        tags: tags ?? [],
      },
    });

    // Refrescar calendario
    await this.prisma.airingSchedule.deleteMany().catch(() => {});

    // Asociar géneros
    if (genres?.length) {
      await this.syncGenres(anime.id, genres);
    }

    // Auto-crear temporada y episodios si se especificaron
    if (seasonNumber && seasonEpisodes) {
      const season = await this.prisma.animeSeason.create({
        data: { animeId: anime.id, number: seasonNumber, type: 'regular' },
      });

      const episodesData = Array.from({ length: seasonEpisodes }, (_, i) => ({
        seasonId: season.id,
        number: i + 1,
        title: `Episodio ${i + 1}`,
      }));

      await this.prisma.episode.createMany({ data: episodesData });
    }

    return anime;
  }

  async updateAnime(animeId: string, dto: UpdateAnimeDto) {
    const anime = await this.prisma.anime.findUnique({ where: { id: animeId } });
    if (!anime) throw new NotFoundException('Anime no encontrado');

    const { genres, tags, ...animeData } = dto;

    const updated = await this.prisma.anime.update({
      where: { id: animeId },
      data: {
        ...animeData,
        status: animeData.status as any,
        ...(tags !== undefined ? { tags } : {}),
      },
    });

    if (genres?.length) {
      await this.syncGenres(animeId, genres);
    }

    // Refrescar calendario
    await this.prisma.airingSchedule.deleteMany().catch(() => {});

    return updated;
  }

  async toggleAnimeVisibility(animeId: string) {
    const anime = await this.prisma.anime.findUnique({
      where: { id: animeId },
      select: { isVisible: true },
    });
    if (!anime) throw new NotFoundException('Anime no encontrado');

    return this.prisma.anime.update({
      where: { id: animeId },
      data: { isVisible: !anime.isVisible },
      select: { id: true, isVisible: true },
    });
  }

  async deleteAnime(animeId: string) {
    const anime = await this.prisma.anime.findUnique({ where: { id: animeId } });
    if (!anime) throw new NotFoundException('Anime no encontrado');

    await this.prisma.anime.delete({ where: { id: animeId } });

    // Refrescar calendario
    await this.prisma.airingSchedule.deleteMany().catch(() => {});

    return { message: 'Anime eliminado permanentemente' };
  }

  // ══════════════════════════════════════════════════════════
  // GESTIÓN DE EPISODIOS
  // ══════════════════════════════════════════════════════════

  async createEpisode(dto: CreateEpisodeDto) {
    const anime = await this.prisma.anime.findUnique({
      where: { slug: dto.animeSlug },
      select: { id: true },
    });
    if (!anime) throw new NotFoundException('Anime no encontrado');

    // Obtener o crear la temporada
    let season = await this.prisma.animeSeason.findFirst({
      where: { animeId: anime.id, number: dto.seasonNumber },
    });

    if (!season) {
      season = await this.prisma.animeSeason.create({
        data: {
          animeId: anime.id,
          number: dto.seasonNumber,
          title: dto.seasonTitle,
          type: (dto.seasonType as any) ?? 'regular',
        },
      });
    }

    const existing = await this.prisma.episode.findUnique({
      where: { seasonId_number: { seasonId: season.id, number: dto.number } },
    });
    if (existing) {
      throw new ConflictException(`El episodio ${dto.number} ya existe en esta temporada`);
    }

    return this.prisma.episode.create({
      data: {
        seasonId: season.id,
        number: dto.number,
        title: dto.title,
        synopsis: dto.synopsis,
        thumbnailUrl: dto.thumbnailUrl,
        airDate: dto.airDate ? new Date(dto.airDate) : new Date(),
        adPrerollEnabled: dto.adPrerollEnabled ?? true,
        adPrerollMinute: dto.adPrerollMinute ?? 0,
        adPrerollMaxSec: dto.adPrerollMaxSec ?? 15,
        adEndingEnabled: dto.adEndingEnabled ?? true,
        adEndingMinute: dto.adEndingMinute,
        adEndingMaxSec: dto.adEndingMaxSec ?? 30,
      },
    });
  }

  async updateEpisode(episodeId: string, dto: Partial<CreateEpisodeDto>) {
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) throw new NotFoundException('Episodio no encontrado');

    const { animeSlug, seasonNumber, number, ...updateData } = dto;

    return this.prisma.episode.update({
      where: { id: episodeId },
      data: {
        ...updateData,
        airDate: updateData.airDate ? new Date(updateData.airDate) : undefined,
      },
    });
  }

  async deleteEpisode(episodeId: string) {
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) throw new NotFoundException('Episodio no encontrado');

    await this.prisma.episode.delete({ where: { id: episodeId } });
    return { message: 'Episodio eliminado' };
  }

  async updateSeason(seasonId: string, dto: { title?: string; type?: string }) {
    const season = await this.prisma.animeSeason.findUnique({ where: { id: seasonId } });
    if (!season) throw new NotFoundException('Temporada no encontrada');

    return this.prisma.animeSeason.update({
      where: { id: seasonId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.type !== undefined ? { type: dto.type as any } : {}),
      },
    });
  }

  async deleteSeason(seasonId: string) {
    const season = await this.prisma.animeSeason.findUnique({
      where: { id: seasonId },
      include: { _count: { select: { episodes: true } } },
    });
    if (!season) throw new NotFoundException('Temporada no encontrada');

    await this.prisma.animeSeason.delete({ where: { id: seasonId } });
    return { message: `Temporada "${season.title ?? season.number}" eliminada con sus ${season._count.episodes} episodios` };
  }

  async createSeasonWithEpisodes(dto: CreateSeasonWithEpisodesDto) {
    const anime = await this.prisma.anime.findUnique({
      where: { slug: dto.animeSlug },
      select: { id: true, coverUrl: true },
    });
    if (!anime) throw new NotFoundException('Anime no encontrado');

    const existingSeason = await this.prisma.animeSeason.findFirst({
      where: { animeId: anime.id, number: dto.seasonNumber },
      include: { _count: { select: { episodes: true } } },
    });

    if (existingSeason && existingSeason._count.episodes > 0) {
      throw new ConflictException(`La temporada ${dto.seasonNumber} ya existe con episodios`);
    }

    if (existingSeason) {
      await this.prisma.animeSeason.delete({ where: { id: existingSeason.id } });
    }

    const season = await this.prisma.animeSeason.create({
      data: {
        animeId: anime.id,
        number: dto.seasonNumber,
        title: dto.seasonTitle,
        type: (dto.seasonType as any) ?? 'regular',
      },
    });

    const episodesData = Array.from({ length: dto.episodeCount }, (_, i) => ({
      seasonId: season.id,
      number: i + 1,
      title: `Episodio ${i + 1}`,
    }));

    await this.prisma.episode.createMany({ data: episodesData });

    return {
      season,
      episodesCreated: dto.episodeCount,
      message: `Temporada ${dto.seasonNumber} creada con ${dto.episodeCount} episodios`,
    };
  }

  async addVideoServer(episodeId: string, dto: AddVideoServerDto) {
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) throw new NotFoundException('Episodio no encontrado');

    return this.prisma.videoServer.create({
      data: {
        episodeId,
        serverName: dto.serverName,
        embedUrl: dto.embedUrl,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async removeVideoServer(serverId: string) {
    const server = await this.prisma.videoServer.findUnique({ where: { id: serverId } });
    if (!server) throw new NotFoundException('Servidor no encontrado');

    await this.prisma.videoServer.delete({ where: { id: serverId } });
    return { message: 'Servidor eliminado' };
  }

  // ══════════════════════════════════════════════════════════
  // GESTIÓN DE USUARIOS
  // ══════════════════════════════════════════════════════════

  async getUsers(dto: GetUsersDto) {
    const { search, filter, page, limit } = dto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (filter === 'silenciados') where.isSilenced = true;
    else if (filter === 'baneados') where.isBanned = true;
    else if (filter === 'moderadores') where.role = 'moderador';
    else if (filter === 'activos') {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      where.lastActiveAt = { gte: threeDaysAgo };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isBanned: true,
          isSilenced: true,
          silencedUntil: true,
          bannedUntil: true,
          emailVerified: true,
          lastActiveAt: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { page, total, total_pages: Math.ceil(total / limit) },
    };
  }

  async changeUserRole(targetUserId: string, dto: ChangeRoleDto, requesterId: string) {
    if (targetUserId === requesterId) {
      throw new BadRequestException('No puedes cambiar tu propio rol');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });
    if (!target) throw new NotFoundException('Usuario no encontrado');
    if (target.role === 'owner') {
      throw new ForbiddenException('No puedes modificar el rol del owner');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: dto.role as any },
      select: { id: true, username: true, role: true },
    });
  }

  async warnUser(targetUserId: string, dto: WarnUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Crear notificación de advertencia
    await this.prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'like_post', // reutilizamos un tipo genérico por ahora
        title: '⚠️ Advertencia del equipo de moderación',
        body: dto.reason,
        metadata: { type: 'warning', reason: dto.reason },
      },
    });

    return { message: 'Advertencia enviada al usuario' };
  }

  async silenceUser(targetUserId: string, dto: SilenceUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role === 'owner') throw new ForbiddenException('No puedes silenciar al owner');

    const silencedUntil = new Date(Date.now() + dto.days * 24 * 60 * 60 * 1000);

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { isSilenced: true, silencedUntil },
      select: { id: true, username: true, isSilenced: true, silencedUntil: true },
    });
  }

  async banUser(targetUserId: string, dto: BanUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role === 'owner') throw new ForbiddenException('No puedes banear al owner');

    const bannedUntil = dto.days
      ? new Date(Date.now() + dto.days * 24 * 60 * 60 * 1000)
      : null;

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { isBanned: true, bannedUntil },
      select: { id: true, username: true, isBanned: true, bannedUntil: true },
    });
  }

  async unbanUser(targetUserId: string) {
    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { isBanned: false, bannedUntil: null },
      select: { id: true, username: true, isBanned: true },
    });
  }

  async deleteUser(targetUserId: string, requesterId: string) {
    if (targetUserId === requesterId) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta desde el admin');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role === 'owner') throw new ForbiddenException('No puedes eliminar al owner');

    await this.prisma.user.delete({ where: { id: targetUserId } });
    return { message: 'Usuario eliminado permanentemente' };
  }

  // ══════════════════════════════════════════════════════════
  // GESTIÓN DE COMUNIDADES
  // ══════════════════════════════════════════════════════════

  async getCommunities(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          slug: true,
          name: true,
          type: true,
          membersCount: true,
          membersThreshold: true,
          isActive: true,
          createdAt: true,
          _count: { select: { posts: true } },
        },
      }),
      this.prisma.community.count({ where }),
    ]);

    return {
      data: communities,
      meta: { page, total, total_pages: Math.ceil(total / limit) },
    };
  }

  async promoteCommunity(communityId: string, dto: PromoteCommunityDto) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { id: true, type: true, createdById: true, name: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');
    if (community.type === 'oficial') {
      throw new ConflictException('La comunidad ya es oficial');
    }

    const updated = await this.prisma.community.update({
      where: { id: communityId },
      data: { type: 'oficial' },
      select: { id: true, slug: true, name: true, type: true },
    });

    // Notificar al creador
    await this.prisma.notification.create({
      data: {
        userId: community.createdById,
        type: 'comunidad_promovida',
        title: '🎉 ¡Tu comunidad es ahora oficial!',
        body: `La comunidad "${community.name}" ha sido promovida a comunidad oficial`,
        metadata: { communityId },
      },
    });

    return updated;
  }

  async demoteCommunity(communityId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { id: true, type: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    return this.prisma.community.update({
      where: { id: communityId },
      data: { type: 'no_oficial' },
      select: { id: true, slug: true, type: true },
    });
  }

  async toggleCommunityActive(communityId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { isActive: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    return this.prisma.community.update({
      where: { id: communityId },
      data: { isActive: !community.isActive },
      select: { id: true, isActive: true },
    });
  }

  async deleteCommunity(communityId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    await this.prisma.community.delete({ where: { id: communityId } });
    return { message: 'Comunidad eliminada permanentemente' };
  }

  // ══════════════════════════════════════════════════════════
  // MODERACIÓN DE CONTENIDO
  // ══════════════════════════════════════════════════════════

  async getReports(page = 1, limit = 20, filter?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filter && filter !== 'todos') where.contentType = filter;
    else where.status = 'pendiente';

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          contentType: true,
          contentId: true,
          reasons: true,
          description: true,
          status: true,
          createdAt: true,
          reporterName: true,
          contentRef: true,
          reviewNote: true,
          reporter: { select: { id: true, username: true, avatarUrl: true } },
          reviewedBy: { select: { id: true, username: true } },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data: reports,
      pendingCount: await this.prisma.report.count({ where: { status: 'pendiente' } }),
      meta: { page, total, total_pages: Math.ceil(total / limit) },
    };
  }

  async reviewReport(reportId: string, reviewerId: string, dto: ReviewReportDto) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Reporte no encontrado');

    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: dto.status as any,
        reviewedById: reviewerId,
        reviewNote: dto.reviewNote,
      },
      select: { id: true, status: true, reviewNote: true },
    });
  }

  async deleteContent(contentType: string, contentId: string) {
    switch (contentType) {
      case 'post':
        await this.prisma.post.update({
          where: { id: contentId },
          data: { isDeleted: true },
        });
        break;
      case 'comment':
        await this.prisma.postComment.update({
          where: { id: contentId },
          data: { isDeleted: true },
        });
        break;
      case 'episode_comment':
        await this.prisma.episodeComment.update({
          where: { id: contentId },
          data: { isDeleted: true },
        });
        break;
      default:
        throw new BadRequestException('Tipo de contenido no válido');
    }

    return { message: 'Contenido eliminado' };
  }

  // ══════════════════════════════════════════════════════════
  // ESTADÍSTICAS
  // ══════════════════════════════════════════════════════════

  async getStats(dto: GetStatsDto) {
    const now = new Date();
    let startDate: Date;

    switch (dto.period) {
      case 'hoy':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'semana':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'ano':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // mes
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const [
      newUsers,
      topAnimes,
      activeCommunities,
      totalComments,
    ] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      this.prisma.anime.findMany({
        where: { isVisible: true },
        orderBy: { totalViews: 'desc' },
        take: 10,
        select: {
          id: true,
          slug: true,
          titleEs: true,
          coverUrl: true,
          totalViews: true,
          malRating: true,
        },
      }),
      this.prisma.community.findMany({
        orderBy: { membersCount: 'desc' },
        take: 5,
        select: {
          id: true,
          slug: true,
          name: true,
          membersCount: true,
          type: true,
          _count: { select: { posts: true } },
        },
      }),
      this.prisma.episodeComment.count({
        where: { createdAt: { gte: startDate } },
      }),
    ]);

    return {
      period: dto.period,
      newUsers,
      totalComments,
      topAnimes: topAnimes.map((a) => ({ ...a, totalViews: Number(a.totalViews) })),
      activeCommunities,
    };
  }

  // ══════════════════════════════════════════════════════════
  // CONFIGURACIÓN GLOBAL
  // ══════════════════════════════════════════════════════════

  // La config global se guarda en memoria por ahora (Fase 1)
  // En Fase 2 se migra a una tabla site_settings en la BD
  private settings: Record<string, any> = {
    siteName: 'Kuroshi.lat',
    siteDescription: 'Plataforma de streaming de anime con red social integrada',
    allowRegistration: true,
    requireEmailVerification: false,
    maintenanceMode: false,
    maintenanceMessage: 'Kuroshi.lat está en mantenimiento. Volvemos pronto.',
    adPrerollGlobalEnabled: true,
    adFeedFrequency: 5,
  };

  async getSettings() {
    return this.settings;
  }

  async updateSettings(dto: UpdateGlobalSettingsDto) {
    this.settings = { ...this.settings, ...dto };
    return this.settings;
  }

  async getMaintenanceStatus() {
    return {
      maintenanceMode: this.settings.maintenanceMode ?? false,
      maintenanceMessage: this.settings.maintenanceMessage ?? 'Kuroshi.lat está en mantenimiento. Volvemos pronto.',
    };
  }

  // ══════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ══════════════════════════════════════════════════════════

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 200);
  }

  // ── Géneros ────────────────────────────────────────────────

  async getGenres() {
    return this.prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { animes: true } } },
    });
  }

  async createGenre(dto: CreateGenreDto) {
    const existing = await this.prisma.genre.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`El género "${dto.name}" ya existe`);
    }

    return this.prisma.genre.create({ data: { name: dto.name } });
  }

  async updateGenre(id: string, dto: UpdateGenreDto) {
    const genre = await this.prisma.genre.findUnique({ where: { id } });
    if (!genre) {
      throw new NotFoundException('Género no encontrado');
    }

    if (dto.name !== genre.name) {
      const existing = await this.prisma.genre.findUnique({ where: { name: dto.name } });
      if (existing) {
        throw new ConflictException(`El género "${dto.name}" ya existe`);
      }
    }

    return this.prisma.genre.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async deleteGenre(id: string) {
    const genre = await this.prisma.genre.findUnique({ where: { id } });
    if (!genre) {
      throw new NotFoundException('Género no encontrado');
    }

    return this.prisma.genre.delete({ where: { id } });
  }

  private async syncGenres(animeId: string, genreNames: string[]) {
    // Borrar géneros actuales
    await this.prisma.animeGenre.deleteMany({ where: { animeId } });

    // Crear géneros que no existen y asociar todos
    for (const name of genreNames) {
      const genre = await this.prisma.genre.upsert({
        where: { name },
        update: {},
        create: { name },
      });

      await this.prisma.animeGenre.upsert({
        where: { animeId_genreId: { animeId, genreId: genre.id } },
        update: {},
        create: { animeId, genreId: genre.id },
      });
    }
  }
}