import { users, User, InsertUser, conversations, Conversation, InsertConversation, 
  conversationMembers, ConversationMember, InsertConversationMember, 
  messages, Message, InsertMessage, UserBasicInfo } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { Store } from "express-session";

const PostgresSessionStore = connectPg(session);

// Storage interface definition
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User>;
  updateUserAvailability(id: number, availability: string): Promise<User>;
  getAllUsers(): Promise<UserBasicInfo[]>;
  
  // Conversation methods
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversationMembers(conversationId: number): Promise<ConversationMember[]>;
  addConversationMember(member: InsertConversationMember): Promise<ConversationMember>;
  removeConversationMember(conversationId: number, userId: number): Promise<void>;
  getUserConversations(userId: number): Promise<{conversation: Conversation, members: UserBasicInfo[]}[]>;
  getDirectConversation(user1Id: number, user2Id: number): Promise<number | undefined>;
  
  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  getConversationMessages(conversationId: number): Promise<Message[]>;
  deleteMessage(id: number): Promise<void>;
  editMessage(id: number, content: string): Promise<Message>;
  
  // Session store
  sessionStore: Store;
}

// Database implementation of the storage interface
export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return updatedUser;
  }

  async updateUserAvailability(id: number, availability: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ availability })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return updatedUser;
  }

  async getAllUsers(): Promise<UserBasicInfo[]> {
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      name: users.name,
      profilePicture: users.profilePicture,
      availability: users.availability,
      designation: users.designation
    }).from(users);
    
    return allUsers;
  }

  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    
    return newConversation;
  }

  async getConversationMembers(conversationId: number): Promise<ConversationMember[]> {
    const members = await db
      .select()
      .from(conversationMembers)
      .where(eq(conversationMembers.conversationId, conversationId));
    
    return members;
  }

  async addConversationMember(member: InsertConversationMember): Promise<ConversationMember> {
    const [newMember] = await db
      .insert(conversationMembers)
      .values(member)
      .returning();
    
    return newMember;
  }

  async removeConversationMember(conversationId: number, userId: number): Promise<void> {
    await db
      .delete(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, userId)
        )
      );
  }

  async getUserConversations(userId: number): Promise<{conversation: Conversation, members: UserBasicInfo[]}[]> {
    // Get all conversations the user is a member of
    const userMemberships = await db
      .select()
      .from(conversationMembers)
      .where(eq(conversationMembers.userId, userId));
    
    // Get details for each conversation
    const userConversations = await Promise.all(
      userMemberships.map(async (membership) => {
        // Get conversation details
        const [conversation] = await db
          .select()
          .from(conversations)
          .where(eq(conversations.id, membership.conversationId));
        
        if (!conversation) return null;
        
        // Get all members of this conversation
        const allMembers = await db
          .select()
          .from(conversationMembers)
          .where(eq(conversationMembers.conversationId, conversation.id));
        
        // Get user details for each member
        const memberDetails = await Promise.all(
          allMembers.map(async (member) => {
            const [user] = await db
              .select({
                id: users.id,
                username: users.username,
                name: users.name,
                profilePicture: users.profilePicture,
                availability: users.availability,
                designation: users.designation
              })
              .from(users)
              .where(eq(users.id, member.userId));
            
            return user;
          })
        );
        
        return {
          conversation,
          members: memberDetails.filter(Boolean) as UserBasicInfo[]
        };
      })
    );
    
    return userConversations.filter(Boolean) as {conversation: Conversation, members: UserBasicInfo[]}[];
  }

  async getDirectConversation(user1Id: number, user2Id: number): Promise<number | undefined> {
    // Get all conversations where user1 is a member
    const user1Memberships = await db
      .select()
      .from(conversationMembers)
      .where(eq(conversationMembers.userId, user1Id));
    
    const user1ConversationIds = user1Memberships.map(m => m.conversationId);
    
    // Get all conversations where user2 is a member
    const user2Memberships = await db
      .select()
      .from(conversationMembers)
      .where(eq(conversationMembers.userId, user2Id));
    
    const user2ConversationIds = user2Memberships.map(m => m.conversationId);
    
    // Find common conversation IDs
    const commonConversationIds = user1ConversationIds.filter(id => 
      user2ConversationIds.includes(id)
    );
    
    // Check if any of these common conversations is a direct message (not a group)
    for (const conversationId of commonConversationIds) {
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, conversationId),
            eq(conversations.isGroup, false)
          )
        );
      
      if (conversation) {
        // Check if only these two users are in this conversation
        const members = await db
          .select()
          .from(conversationMembers)
          .where(eq(conversationMembers.conversationId, conversationId));
        
        if (members.length === 2) {
          return conversationId;
        }
      }
    }
    
    return undefined;
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    
    return message;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    
    return newMessage;
  }

  async getConversationMessages(conversationId: number): Promise<Message[]> {
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.sentAt);
    
    return conversationMessages;
  }

  async deleteMessage(id: number): Promise<void> {
    await db
      .update(messages)
      .set({
        isDeleted: true,
        content: "This message has been deleted"
      })
      .where(eq(messages.id, id));
  }

  async editMessage(id: number, content: string): Promise<Message> {
    const [updatedMessage] = await db
      .update(messages)
      .set({
        content,
        isEdited: true
      })
      .where(eq(messages.id, id))
      .returning();
    
    if (!updatedMessage) {
      throw new Error(`Message with id ${id} not found`);
    }
    
    return updatedMessage;
  }
}

// Create and export the database storage instance
export const storage = new DatabaseStorage();
