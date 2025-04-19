import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  phoneNumber: text("phone_number"),
  designation: text("designation"),
  bio: text("bio"),
  profilePicture: text("profile_picture"),
  status: text("status"),
  availability: text("availability").default("offline"),
  department: text("department"),
  createdAt: timestamp("created_at").defaultNow()
});

// Conversation model (DMs and Groups)
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  name: text("name"), // null for DMs, name for group chats
  description: text("description"),
  isGroup: boolean("is_group").default(false),
  icon: text("icon"),
  coverImage: text("cover_image"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

// Conversation Members
export const conversationMembers = pgTable("conversation_members", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  isAdmin: boolean("is_admin").default(false),
  canMessage: boolean("can_message").default(true),
  joinedAt: timestamp("joined_at").defaultNow()
});

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  content: text("content"),
  attachments: json("attachments").$type<{
    name: string;
    type: string;
    size: number;
    url: string;
  }[]>(),
  isEdited: boolean("is_edited").default(false),
  isDeleted: boolean("is_deleted").default(false),
  replyToId: integer("reply_to_id").references(() => messages.id),
  sentAt: timestamp("sent_at").defaultNow()
});

// Create insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true
});

export const insertConversationMemberSchema = createInsertSchema(conversationMembers).omit({
  id: true,
  joinedAt: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true
});

// Define types using z.infer
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertConversationMember = z.infer<typeof insertConversationMemberSchema>;
export type ConversationMember = typeof conversationMembers.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// User with basic info for lists
export type UserBasicInfo = Pick<User, 'id' | 'name' | 'username' | 'profilePicture' | 'availability' | 'designation'>;
