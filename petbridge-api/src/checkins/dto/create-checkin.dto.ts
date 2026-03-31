export class CreateCheckInDto {
  message?: string;
  scheduledFor?: Date;
  photoUrl?: string;
  wellbeingScore?: number;
}

export class RespondCheckInDto {
  responseNote?: string;
  photoUrl?: string;
  wellbeingScore?: number;
}