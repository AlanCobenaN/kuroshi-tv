import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendChatMessageDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  content: string;

  @ApiPropertyOptional({ description: 'ID del mensaje al que responde' })
  @IsOptional()
  @IsString()
  replyToId?: string;
}

export class DeleteChatMessageDto {
  @ApiProperty()
  @IsString()
  messageId: string;
}