export type User = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  name?: string;
  password: string;
  phone?: string;
  avatar?: string;
  role: "USER" | "ADMIN" | "MODERATOR" | "SUPPORT";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  lastLogin?: Date;
  birthdate?: Date;
  address?: string;
  bio?: string;
  isEmailVerified: boolean;
};
