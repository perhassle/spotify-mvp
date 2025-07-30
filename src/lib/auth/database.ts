import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User } from '@/types';

const DB_PATH = path.join(process.cwd(), 'data', 'users.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ users: [] }, null, 2));
}

interface UserWithPassword extends User {
  password: string;
  emailVerified?: Date | null;
  resetToken?: string;
  resetTokenExpires?: Date;
}

interface Database {
  users: UserWithPassword[];
}

export class AuthDatabase {
  private readDB(): Database {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading database:', error);
      return { users: [] };
    }
  }

  private writeDB(data: Database): void {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing database:', error);
      throw new Error('Failed to save user data');
    }
  }

  async createUser(email: string, password: string, username: string, displayName: string): Promise<User> {
    const db = this.readDB();
    
    // Check if user already exists
    if (db.users.find(user => user.email === email)) {
      throw new Error('User with this email already exists');
    }

    if (db.users.find(user => user.username === username)) {
      throw new Error('Username is already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create new user
    const newUser: UserWithPassword = {
      id: this.generateId(),
      email,
      username,
      displayName,
      password: hashedPassword,
      isPremium: false,
      subscriptionTier: 'free',
      subscriptionStatus: 'canceled',
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: null,
    };

    db.users.push(newUser);
    this.writeDB(db);

    // Return user without password
    const { password: _, resetToken, resetTokenExpires, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const db = this.readDB();
    const user = db.users.find(u => u.email === email);
    
    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    // Return user without password
    const { password: _, resetToken, resetTokenExpires, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = this.readDB();
    const user = db.users.find(u => u.email === email);
    
    if (!user) {
      return null;
    }

    // Return user without password
    const { password: _, resetToken, resetTokenExpires, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserById(id: string): Promise<User | null> {
    const db = this.readDB();
    const user = db.users.find(u => u.id === id);
    
    if (!user) {
      return null;
    }

    // Return user without password
    const { password: _, resetToken, resetTokenExpires, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const db = this.readDB();
    const userIndex = db.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return null;
    }

    db.users[userIndex] = {
      ...db.users[userIndex],
      ...updates,
      updatedAt: new Date(),
    } as UserWithPassword;

    this.writeDB(db);

    // Return user without password
    const { password: _, resetToken, resetTokenExpires, ...userWithoutPassword } = db.users[userIndex];
    return userWithoutPassword;
  }

  async setResetToken(email: string): Promise<string | null> {
    const db = this.readDB();
    const userIndex = db.users.findIndex(u => u.email === email);
    
    if (userIndex === -1) {
      return null;
    }

    const resetToken = this.generateResetToken();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const user = db.users[userIndex];
    if (user) {
      user.resetToken = resetToken;
      user.resetTokenExpires = resetTokenExpires;
    }

    this.writeDB(db);
    return resetToken;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const db = this.readDB();
    const userIndex = db.users.findIndex(u => 
      u.resetToken === token && 
      u.resetTokenExpires && 
      u.resetTokenExpires > new Date()
    );
    
    if (userIndex === -1) {
      return false;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const user = db.users[userIndex];
    if (user) {
      user.password = hashedPassword;
      user.resetToken = undefined;
      user.resetTokenExpires = undefined;
      user.updatedAt = new Date();
    }

    this.writeDB(db);
    return true;
  }

  private generateId(): string {
    return 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private generateResetToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export const authDB = new AuthDatabase();