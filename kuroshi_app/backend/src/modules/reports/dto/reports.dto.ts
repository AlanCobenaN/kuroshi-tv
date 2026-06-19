import { IsString, IsArray, IsOptional, IsIn, MinLength, MaxLength, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsIn(['post', 'comment', 'episode_comment', 'usuario', 'episodio'])
  contentType: string;

  @IsString()
  contentId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  reasons: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
