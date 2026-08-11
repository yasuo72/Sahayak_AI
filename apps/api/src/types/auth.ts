import { CustomerTier, Role } from '../generated/prisma/client.js';

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  tier: CustomerTier;
  isActive: boolean;
  createdAt: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser?: SafeUser;
    }
  }
}
