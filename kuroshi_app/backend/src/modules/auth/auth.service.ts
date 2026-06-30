import * as crypto from 'crypto';
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  private async verifyTurnstile(token?: string): Promise<void> {
    if (!token) return;
    const secret = this.config.get<string>('TURNSTILE_SECRET_KEY');
    if (!secret) return;
    const form = new URLSearchParams();
    form.append('secret', secret);
    form.append('response', token);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const data: any = await res.json();
    if (!data.success) {
      throw new UnauthorizedException('Falló la verificación de seguridad. Intenta de nuevo.');
    }
  }

  async register(dto: RegisterDto) {
    await this.verifyTurnstile(dto.turnstileToken);
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash,
        emailVerified: false,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    const token = this.generateToken(user.id, user.username, user.role);

    this.sendVerificationEmail(user.id, user.email, user.username)
      .catch(() => {});

    return { access_token: token, user };
  }

  async login(dto: LoginDto) {
    await this.verifyTurnstile(dto.turnstileToken);
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        passwordHash: true,
        isBanned: true,
        isActive: true,
        emailVerified: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Esta cuenta está desactivada');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Esta cuenta ha sido baneada');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const token = this.generateToken(user.id, user.username, user.role);
    const { passwordHash, ...userWithoutPassword } = user;
    return { access_token: token, user: userWithoutPassword };
  }

  async handleGoogleOAuth(oauthData: {
    oauthGoogleId: string;
    email: string;
    displayName: string;
  }) {
    return this.handleOAuth({
      oauthField: 'oauthGoogleId',
      oauthId: oauthData.oauthGoogleId,
      email: oauthData.email,
      displayName: oauthData.displayName,
    });
  }

  async handleDiscordOAuth(oauthData: {
    oauthDiscordId: string;
    email: string;
    displayName: string;
  }) {
    return this.handleOAuth({
      oauthField: 'oauthDiscordId',
      oauthId: oauthData.oauthDiscordId,
      email: oauthData.email,
      displayName: oauthData.displayName,
    });
  }

  private async handleOAuth(params: {
    oauthField: 'oauthGoogleId' | 'oauthDiscordId';
    oauthId: string;
    email: string;
    displayName: string;
  }) {
    const { oauthField, oauthId, email, displayName } = params;

    const includes = { id: true, username: true, email: true, role: true, avatarUrl: true, isBanned: true, isActive: true };

    let user = await this.prisma.user.findUnique({
      where: { [oauthField]: oauthId } as any,
      select: includes,
    });

    let linked = false;
    let created = false;

    if (!user) {
      const userByEmail = await this.prisma.user.findUnique({
        where: { email },
        select: includes,
      });

      if (userByEmail) {
        user = await this.prisma.user.update({
          where: { id: userByEmail.id },
          data: { [oauthField]: oauthId, emailVerified: true },
          select: includes,
        });
        linked = true;
      } else {
        const username = await this.generateUniqueUsername(displayName);
        user = await this.prisma.user.create({
          data: {
            username,
            email,
            [oauthField]: oauthId,
            emailVerified: true,
          },
          select: includes,
        });
        created = true;
      }
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Esta cuenta ha sido baneada');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const token = this.generateToken(user.id, user.username, user.role);
    return { access_token: token, user, linked, created };
  }

  private async sendVerificationEmail(userId: string, email: string, username: string) {
    const existing = await this.prisma.verificationToken.findFirst({
      where: { userId, expiresAt: { gte: new Date() } },
    });
    if (existing) return;

    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.verificationToken.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.emailService.sendVerificationEmail(email, token, username);
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.verificationToken.findUnique({
      where: { token },
      include: { user: { select: { emailVerified: true } } },
    });

    if (!record) {
      throw new BadRequestException('Token de verificación inválido');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('El token de verificación ha expirado. Solicita uno nuevo.');
    }

    if (record.user.emailVerified) {
      await this.prisma.verificationToken.delete({ where: { id: record.id } });
      return { message: 'El email ya estaba verificado' };
    }

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    });

    await this.prisma.verificationToken.delete({ where: { id: record.id } });

    return { message: 'Email verificado exitosamente' };
  }

  async resendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, emailVerified: true },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (user.emailVerified) {
      throw new BadRequestException('El email ya está verificado');
    }

    await this.prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    });

    await this.sendVerificationEmail(user.id, user.email, user.username);

    return { message: 'Email de verificación enviado' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      throw new BadRequestException(
        'No puedes cambiar la contraseña de una cuenta vinculada a Google o Discord',
      );
    }

    const passwordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!passwordValid) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, username: true, passwordHash: true },
    });

    if (!user) {
      return { message: 'Si el email existe, recibirás un correo de confirmación.' };
    }

    if (!user.passwordHash) {
      return { message: 'Si el email existe, recibirás un correo de confirmación.' };
    }

    const token = crypto.randomBytes(32).toString('hex');

    await this.prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    await this.emailService
      .sendPasswordResetConfirmation(user.email, token, user.username)
      .catch(() => {});

    return { message: 'Si el email existe, recibirás un correo de confirmación.' };
  }

  async confirmResetPassword(token: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record) {
      throw new BadRequestException('Token inválido');
    }

    if (record.usedAt) {
      throw new BadRequestException('Este token ya fue utilizado');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('El token ha expirado. Solicita uno nuevo.');
    }

    const tempPassword = crypto.randomBytes(4).toString('hex');

    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await this.prisma.user.update({
      where: { email: record.email },
      data: { passwordHash },
    });

    await this.prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { email: record.email },
      select: { username: true },
    });

    if (user) {
      await this.emailService
        .sendTemporaryPassword(record.email, tempPassword, user.username)
        .catch(() => {});
    }

    return { message: 'Te hemos enviado una contraseña temporal a tu correo.' };
  }

  async getMe(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          bio: true,
          avatarUrl: true,
          emailVerified: true,
          visibility: true,
          createdAt: true,
          lastActiveAt: true,
          oauthGoogleId: true,
          oauthDiscordId: true,
          passwordHash: true,
          favoriteAnime: {
            select: { id: true, slug: true, titleEs: true, coverUrl: true },
          },
          _count: {
            select: {
              watchlist: true,
              communityMemberships: true,
              friendRequestsSent: { where: { status: 'aceptada' } },
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(`getMe error for user ${userId}: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException('Error al obtener perfil');
    }
  }

  async updateLastActive(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    }).catch(() => {});
  }

  private generateToken(userId: string, username: string, role: string): string {
    const payload: JwtPayload = { sub: userId, username, role };
    return this.jwtService.sign(payload);
  }

  private async generateUniqueUsername(displayName: string): Promise<string> {
    let base = displayName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 20);

    if (base.length < 3) base = 'otaku_' + base;

    let username = base;
    let counter = 1;

    while (true) {
      const exists = await this.prisma.user.findUnique({ where: { username } });
      if (!exists) break;
      username = `${base}_${counter}`;
      counter++;
    }

    return username;
  }
}