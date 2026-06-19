import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CreateReportDto } from './dto/reports.dto';

const REPORT_COOLDOWN_MS = 60 * 1000; // 1 minuto

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  async createReport(userId: string, dto: CreateReportDto) {
    // Rate limit: 1 reporte por minuto por usuario
    const lastReport = await this.prisma.report.findFirst({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (lastReport && Date.now() - lastReport.createdAt.getTime() < REPORT_COOLDOWN_MS) {
      const remaining = Math.ceil((REPORT_COOLDOWN_MS - (Date.now() - lastReport.createdAt.getTime())) / 1000);
      throw new BadRequestException(`Debes esperar ${remaining}s antes de reportar de nuevo`);
    }

    // Obtener el username del reportero
    const reporter = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });
    if (!reporter) throw new NotFoundException('Usuario no encontrado');

    // Generar referencia legible del contenido
    let contentRef: string | null = null;
    switch (dto.contentType) {
      case 'usuario': {
        const user = await this.prisma.user.findUnique({
          where: { id: dto.contentId },
          select: { username: true },
        });
        if (user) contentRef = `@${user.username}`;
        break;
      }
      case 'post': {
        const post = await this.prisma.post.findUnique({
          where: { id: dto.contentId },
          select: { community: { select: { slug: true } } },
        });
        if (post) contentRef = `Post en /${post.community.slug}`;
        break;
      }
      case 'episodio': {
        const episode = await this.prisma.episode.findUnique({
          where: { id: dto.contentId },
          select: { number: true, season: { select: { anime: { select: { slug: true, titleEs: true } } } } },
        });
        if (episode) contentRef = `${episode.season.anime.titleEs} EP ${episode.number}`;
        break;
      }
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId: userId,
        contentType: dto.contentType as any,
        contentId: dto.contentId,
        reasons: dto.reasons,
        description: dto.description,
        reporterName: reporter.username,
        contentRef,
      },
      include: {
        reporter: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    // Emitir en tiempo real a los admins (canal admin:reports)
    await this.realtime.emitNewReport(report);

    return report;
  }
}
