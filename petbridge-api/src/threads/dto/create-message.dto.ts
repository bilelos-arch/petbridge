import { IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsUrl()
  mediaUrl?: string;
}