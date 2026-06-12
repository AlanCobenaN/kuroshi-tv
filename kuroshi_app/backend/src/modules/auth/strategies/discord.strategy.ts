import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(private readonly config: ConfigService) {
    super({
      clientID: config.get<string>('DISCORD_CLIENT_ID') || 'placeholder',
      clientSecret: config.get<string>('DISCORD_CLIENT_SECRET') || 'placeholder',
      callbackURL: config.get<string>('DISCORD_CALLBACK_URL'),
      scope: ['identify', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ) {
    done(null, {
      oauthDiscordId: profile.id,
      email: profile.email,
      displayName: profile.username,
    });
  }
}