import { localDB, DatabaseUser } from './database';
import { v4 as uuidv4 } from 'uuid';

// Simple password hashing (in production, use bcrypt or similar)
function hashPassword(password: string): string {
  // This is a simple hash for demo purposes - use proper hashing in production
  return btoa(password + 'salt');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'manager' | 'driver';
  phone?: string;
  available: boolean;
}

class LocalAuth {
  private currentUser: AuthUser | null = null;
  private sessionKey = 'orquestra_session';

  constructor() {
    this.loadSession();
  }

  private loadSession(): void {
    const session = localStorage.getItem(this.sessionKey);
    if (session) {
      try {
        const userData = JSON.parse(session);
        const user = localDB.getUserById(userData.id);
        if (user) {
          this.currentUser = this.mapDatabaseUserToAuthUser(user);
        } else {
          localStorage.removeItem(this.sessionKey);
        }
      } catch (error) {
        localStorage.removeItem(this.sessionKey);
      }
    }
  }

  private saveSession(user: AuthUser): void {
    localStorage.setItem(this.sessionKey, JSON.stringify(user));
  }

  private clearSession(): void {
    localStorage.removeItem(this.sessionKey);
  }

  private mapDatabaseUserToAuthUser(dbUser: DatabaseUser): AuthUser {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      phone: dbUser.phone,
      available: dbUser.available
    };
  }

  async signUp(email: string, password: string, userData: { name: string; role: 'manager' | 'driver'; phone?: string }): Promise<AuthUser> {
    // Check if user already exists
    const existingUser = localDB.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already registered');
    }

    // Create new user
    const newUser = localDB.createUser({
      id: uuidv4(),
      email,
      password_hash: hashPassword(password),
      name: userData.name,
      role: userData.role,
      phone: userData.phone,
      available: userData.role === 'driver' ? true : false
    });

    const authUser = this.mapDatabaseUserToAuthUser(newUser);
    this.currentUser = authUser;
    this.saveSession(authUser);

    return authUser;
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const user = localDB.getUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      throw new Error('Invalid login credentials');
    }

    const authUser = this.mapDatabaseUserToAuthUser(user);
    this.currentUser = authUser;
    this.saveSession(authUser);

    return authUser;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.clearSession();
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
}

export const localAuth = new LocalAuth();