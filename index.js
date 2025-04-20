var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  conversationMembers: () => conversationMembers,
  conversations: () => conversations,
  insertConversationMemberSchema: () => insertConversationMemberSchema,
  insertConversationSchema: () => insertConversationSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertUserSchema: () => insertUserSchema,
  messages: () => messages,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
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
var conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  name: text("name"),
  // null for DMs, name for group chats
  description: text("description"),
  isGroup: boolean("is_group").default(false),
  icon: text("icon"),
  coverImage: text("cover_image"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
var conversationMembers = pgTable("conversation_members", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  isAdmin: boolean("is_admin").default(false),
  canMessage: boolean("can_message").default(true),
  joinedAt: timestamp("joined_at").defaultNow()
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  content: text("content"),
  attachments: json("attachments").$type(),
  isEdited: boolean("is_edited").default(false),
  isDeleted: boolean("is_deleted").default(false),
  replyToId: integer("reply_to_id").references(() => messages.id),
  sentAt: timestamp("sent_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true
});
var insertConversationMemberSchema = createInsertSchema(conversationMembers).omit({
  id: true,
  joinedAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true
});

// server/storage.ts
import session from "express-session";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import dotenv from "dotenv";
dotenv.config();
neonConfig.webSocketConstructor = ws;
var databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set in .env file or environment variables. Did you forget to provision a database?"
  );
}
console.log("Connecting to database...");
var pool = new Pool({
  connectionString: databaseUrl,
  // Add optional connection parameters if needed
  max: 10,
  // maximum number of clients in the pool
  idleTimeoutMillis: 3e4,
  // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5e3
  // how long to wait before timing out when connecting a new client
});
pool.on("connect", () => {
  console.log("Database connection established successfully");
});
pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
  process.exit(-1);
});
var db = drizzle({ client: pool, schema: schema_exports });
var testDatabaseConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("Database connection test successful");
    client.release();
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
};

// server/storage.ts
import { eq, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  // User methods
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUser(id, userData) {
    const [updatedUser] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }
    return updatedUser;
  }
  async updateUserAvailability(id, availability) {
    const [updatedUser] = await db.update(users).set({ availability }).where(eq(users.id, id)).returning();
    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }
    return updatedUser;
  }
  async getAllUsers() {
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
  async getConversation(id) {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }
  async createConversation(conversation) {
    const [newConversation] = await db.insert(conversations).values(conversation).returning();
    return newConversation;
  }
  async getConversationMembers(conversationId) {
    const members = await db.select().from(conversationMembers).where(eq(conversationMembers.conversationId, conversationId));
    return members;
  }
  async addConversationMember(member) {
    const [newMember] = await db.insert(conversationMembers).values(member).returning();
    return newMember;
  }
  async removeConversationMember(conversationId, userId) {
    await db.delete(conversationMembers).where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId)
      )
    );
  }
  async getUserConversations(userId) {
    const userMemberships = await db.select().from(conversationMembers).where(eq(conversationMembers.userId, userId));
    const userConversations = await Promise.all(
      userMemberships.map(async (membership) => {
        const [conversation] = await db.select().from(conversations).where(eq(conversations.id, membership.conversationId));
        if (!conversation) return null;
        const allMembers = await db.select().from(conversationMembers).where(eq(conversationMembers.conversationId, conversation.id));
        const memberDetails = await Promise.all(
          allMembers.map(async (member) => {
            const [user] = await db.select({
              id: users.id,
              username: users.username,
              name: users.name,
              profilePicture: users.profilePicture,
              availability: users.availability,
              designation: users.designation
            }).from(users).where(eq(users.id, member.userId));
            return user;
          })
        );
        return {
          conversation,
          members: memberDetails.filter(Boolean)
        };
      })
    );
    return userConversations.filter(Boolean);
  }
  async getDirectConversation(user1Id, user2Id) {
    const user1Memberships = await db.select().from(conversationMembers).where(eq(conversationMembers.userId, user1Id));
    const user1ConversationIds = user1Memberships.map((m) => m.conversationId);
    const user2Memberships = await db.select().from(conversationMembers).where(eq(conversationMembers.userId, user2Id));
    const user2ConversationIds = user2Memberships.map((m) => m.conversationId);
    const commonConversationIds = user1ConversationIds.filter(
      (id) => user2ConversationIds.includes(id)
    );
    for (const conversationId of commonConversationIds) {
      const [conversation] = await db.select().from(conversations).where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.isGroup, false)
        )
      );
      if (conversation) {
        const members = await db.select().from(conversationMembers).where(eq(conversationMembers.conversationId, conversationId));
        if (members.length === 2) {
          return conversationId;
        }
      }
    }
    return void 0;
  }
  // Message methods
  async getMessage(id) {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }
  async createMessage(message) {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }
  async getConversationMessages(conversationId) {
    const conversationMessages = await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.sentAt);
    return conversationMessages;
  }
  async deleteMessage(id) {
    await db.update(messages).set({
      isDeleted: true,
      content: "This message has been deleted"
    }).where(eq(messages.id, id));
  }
  async editMessage(id, content) {
    const [updatedMessage] = await db.update(messages).set({
      content,
      isEdited: true
    }).where(eq(messages.id, id)).returning();
    if (!updatedMessage) {
      throw new Error(`Message with id ${id} not found`);
    }
    return updatedMessage;
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import dotenv2 from "dotenv";
dotenv2.config();
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "teamchat-session-secret-123456789",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1e3 * 60 * 60 * 24 * 7,
      // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    },
    store: storage.sessionStore
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        availability: "online"
      });
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    if (req.user) {
      storage.updateUserAvailability(req.user.id, "online");
    }
    res.status(200).json(req.user);
  });
  app2.post("/api/logout", (req, res, next) => {
    if (req.user) {
      storage.updateUserAvailability(req.user.id, "offline");
    }
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  app2.put("/api/user", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const updatedUser = await storage.updateUser(req.user.id, req.body);
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });
  app2.put("/api/user/availability", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { availability } = req.body;
      const validOptions = ["online", "busy", "away", "dnd", "offline"];
      if (!validOptions.includes(availability)) {
        return res.status(400).send("Invalid availability status");
      }
      const updatedUser = await storage.updateUserAvailability(req.user.id, availability);
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });
}

// server/routes.ts
import dotenv3 from "dotenv";
dotenv3.config();
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/conversations", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const conversations2 = await storage.getUserConversations(req.user.id);
      res.json(conversations2);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/conversations", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const validatedData = insertConversationSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      const conversation = await storage.createConversation(validatedData);
      await storage.addConversationMember({
        conversationId: conversation.id,
        userId: req.user.id,
        isAdmin: conversation.isGroup,
        canMessage: true
      });
      if (req.body.members && Array.isArray(req.body.members)) {
        for (const memberId of req.body.members) {
          if (memberId !== req.user.id) {
            await storage.addConversationMember({
              conversationId: conversation.id,
              userId: memberId,
              isAdmin: false,
              canMessage: true
            });
          }
        }
      }
      const memberDetails = await storage.getConversationMembers(conversation.id);
      res.status(201).json({ conversation, members: memberDetails });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/conversations/direct", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      let conversationId = await storage.getDirectConversation(req.user.id, userId);
      if (!conversationId) {
        const conversation2 = await storage.createConversation({
          isGroup: false,
          createdBy: req.user.id
        });
        await storage.addConversationMember({
          conversationId: conversation2.id,
          userId: req.user.id,
          isAdmin: false,
          canMessage: true
        });
        await storage.addConversationMember({
          conversationId: conversation2.id,
          userId,
          isAdmin: false,
          canMessage: true
        });
        conversationId = conversation2.id;
      }
      const conversation = await storage.getConversation(conversationId);
      const members = await storage.getConversationMembers(conversationId);
      res.json({ conversation, members });
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/conversations/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      const members = await storage.getConversationMembers(conversationId);
      const isMember = members.some((member) => member.userId === req.user.id);
      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this conversation" });
      }
      res.json({ conversation, members });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/conversations/:id/members", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const conversationId = parseInt(req.params.id);
      const { userId, isAdmin, canMessage } = req.body;
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      const members = await storage.getConversationMembers(conversationId);
      const currentUserMembership = members.find((m) => m.userId === req.user.id);
      if (!currentUserMembership || !currentUserMembership.isAdmin && conversation.isGroup) {
        return res.status(403).json({ message: "You don't have permission to add members" });
      }
      const memberData = insertConversationMemberSchema.parse({
        conversationId,
        userId,
        isAdmin: isAdmin || false,
        canMessage: canMessage !== void 0 ? canMessage : true
      });
      const member = await storage.addConversationMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  });
  app2.delete("/api/conversations/:conversationId/members/:userId", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const conversationId = parseInt(req.params.conversationId);
      const userId = parseInt(req.params.userId);
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      const members = await storage.getConversationMembers(conversationId);
      const currentUserMembership = members.find((m) => m.userId === req.user.id);
      if (!currentUserMembership || userId !== req.user.id && (!currentUserMembership.isAdmin || conversation.createdBy === userId)) {
        return res.status(403).json({ message: "You don't have permission to remove this member" });
      }
      await storage.removeConversationMember(conversationId, userId);
      res.status(200).json({ message: "Member removed successfully" });
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/conversations/:id/messages", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const conversationId = parseInt(req.params.id);
      const members = await storage.getConversationMembers(conversationId);
      const isMember = members.some((member) => member.userId === req.user.id);
      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this conversation" });
      }
      const messages2 = await storage.getConversationMessages(conversationId);
      res.json(messages2);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/messages", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id
      });
      const members = await storage.getConversationMembers(validatedData.conversationId);
      const membership = members.find((member) => member.userId === req.user.id);
      if (!membership) {
        return res.status(403).json({ message: "You are not a member of this conversation" });
      }
      if (!membership.canMessage) {
        return res.status(403).json({ message: "You don't have permission to send messages" });
      }
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
      console.log(`Message created by user ${req.user.id} for conversation ${validatedData.conversationId}. Now sending WebSocket notifications...`);
      for (const member of members) {
        console.log(`Processing member ${member.userId} for WebSocket notification`);
        const client = clients.get(member.userId);
        if (client && client.readyState === WebSocket.OPEN) {
          console.log(`Sending WebSocket notification to user ${member.userId}`);
          const notification = {
            type: "new_message",
            payload: message
          };
          try {
            client.send(JSON.stringify(notification));
            console.log(`Successfully sent WebSocket notification to user ${member.userId}`);
          } catch (error) {
            console.error(`Failed to send WebSocket notification to user ${member.userId}:`, error);
          }
        } else {
          console.log(`Cannot send WebSocket notification to user ${member.userId}: ${client ? "Not in OPEN state" : "No connection"}`);
        }
      }
    } catch (error) {
      next(error);
    }
  });
  app2.delete("/api/messages/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const messageId = parseInt(req.params.id);
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      if (message.senderId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this message" });
      }
      await storage.deleteMessage(messageId);
      res.status(200).json({ message: "Message deleted successfully" });
      const members = await storage.getConversationMembers(message.conversationId);
      for (const member of members) {
        if (member.userId !== req.user.id) {
          const client = clients.get(member.userId);
          if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "message_deleted",
              payload: {
                messageId,
                conversationId: message.conversationId
              }
            }));
          }
        }
      }
    } catch (error) {
      next(error);
    }
  });
  app2.put("/api/messages/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const messageId = parseInt(req.params.id);
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      if (message.senderId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to edit this message" });
      }
      if (message.isDeleted) {
        return res.status(400).json({ message: "Cannot edit a deleted message" });
      }
      const updatedMessage = await storage.editMessage(messageId, content);
      res.json(updatedMessage);
      const members = await storage.getConversationMembers(message.conversationId);
      for (const member of members) {
        if (member.userId !== req.user.id) {
          const client = clients.get(member.userId);
          if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "message_edited",
              payload: updatedMessage
            }));
          }
        }
      }
    } catch (error) {
      next(error);
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  console.log("WebSocket server initialized with path: /ws");
  const clients = /* @__PURE__ */ new Map();
  wss.on("connection", (ws2) => {
    console.log("New WebSocket connection established");
    ws2.on("message", async (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        console.log(`Received WebSocket message of type ${parsedMessage.type}`);
        if (parsedMessage.type === "ping") {
          try {
            ws2.send(JSON.stringify({ type: "pong" }));
            return;
          } catch (error) {
            console.error("Error sending pong response:", error);
          }
        }
        switch (parsedMessage.type) {
          case "auth":
            if (parsedMessage.payload && parsedMessage.payload.userId) {
              const userId = parsedMessage.payload.userId;
              console.log(`Authenticating WebSocket connection for user ${userId}`);
              const user = await storage.getUser(userId);
              if (!user) {
                console.error(`WebSocket authentication failed: User ${userId} not found`);
                break;
              }
              const existingConnection = clients.get(userId);
              if (existingConnection) {
                console.log(`Closing existing WebSocket connection for user ${userId}`);
                if (existingConnection.readyState === WebSocket.OPEN) {
                  existingConnection.close();
                }
              }
              ws2.userId = userId;
              clients.set(userId, ws2);
              console.log(`WebSocket connection authenticated for user ${userId}`);
              try {
                ws2.send(JSON.stringify({
                  type: "auth_success",
                  payload: { userId }
                }));
                console.log(`Authentication success message sent to user ${userId}`);
              } catch (error) {
                console.error(`Failed to send auth success message to user ${userId}:`, error);
              }
              try {
                broadcastToAll({
                  type: "user_status",
                  payload: {
                    userId: ws2.userId,
                    status: "online"
                  }
                }, ws2.userId);
                console.log(`Online status broadcast sent for user ${userId}`);
              } catch (error) {
                console.error(`Failed to broadcast online status for user ${userId}:`, error);
              }
            } else {
              console.error("WebSocket authentication failed: Missing userId in payload");
            }
            break;
          case "message":
            if (!ws2.userId) break;
            try {
              const msgData = {
                conversationId: parsedMessage.payload.conversationId,
                senderId: ws2.userId,
                content: parsedMessage.payload.content,
                attachments: parsedMessage.payload.attachments
              };
              const newMessage = await storage.createMessage(msgData);
              const members2 = await storage.getConversationMembers(newMessage.conversationId);
              for (const member of members2) {
                const client = clients.get(member.userId);
                if (client && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: "new_message",
                    payload: newMessage
                  }));
                }
              }
            } catch (error) {
              console.error("Error handling message:", error);
            }
            break;
          case "typing":
            if (!ws2.userId) break;
            const conversationId = parsedMessage.payload.conversationId;
            const isTyping = parsedMessage.payload.isTyping;
            const members = await storage.getConversationMembers(conversationId);
            for (const member of members) {
              if (member.userId !== ws2.userId) {
                const client = clients.get(member.userId);
                if (client && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: "typing",
                    payload: {
                      conversationId,
                      userId: ws2.userId,
                      isTyping
                    }
                  }));
                }
              }
            }
            break;
          case "status_change":
            if (!ws2.userId) break;
            const status = parsedMessage.payload.status;
            await storage.updateUserAvailability(ws2.userId, status);
            broadcastToAll({
              type: "user_status",
              payload: {
                userId: ws2.userId,
                status
              }
            }, ws2.userId);
            break;
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    });
    ws2.on("close", async (code, reason) => {
      console.log(`WebSocket connection closed with code ${code}, reason: ${reason || "No reason provided"}`);
      if (ws2.userId) {
        console.log(`User ${ws2.userId} disconnected, setting status to offline`);
        try {
          await storage.updateUserAvailability(ws2.userId, "offline");
          console.log(`Successfully updated user ${ws2.userId} availability to offline`);
        } catch (error) {
          console.error(`Failed to update availability for user ${ws2.userId}:`, error);
        }
        clients.delete(ws2.userId);
        try {
          broadcastToAll({
            type: "user_status",
            payload: {
              userId: ws2.userId,
              status: "offline"
            }
          }, ws2.userId);
          console.log(`Successfully broadcast offline status for user ${ws2.userId}`);
        } catch (error) {
          console.error(`Failed to broadcast offline status for user ${ws2.userId}:`, error);
        }
      }
    });
  });
  function broadcastToAll(message, excludeUserId) {
    clients.forEach((client, userId) => {
      if (userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  base: "/chat",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import dotenv4 from "dotenv";
dotenv4.config();
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    const dbConnected = await testDatabaseConnection();
    if (dbConnected) {
      log("Database connection test successful");
    } else {
      console.error("\u274C Failed to connect to database. Check your DATABASE_URL in .env");
      console.error("Current DATABASE_URL: " + (process.env.DATABASE_URL?.replace(/:.+@/, ":****@") || "not set"));
      console.warn("Starting server anyway \u2014 some features may not work.");
    }
  } catch (error) {
    console.error("Error testing database connection:", error);
  }
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "127.0.0.1";
  server.listen(port, host, () => {
    log(`\u{1F680} Server running in ${process.env.NODE_ENV || "development"} mode`);
    log(`\u{1F4E1} Listening on http://${host}:${port}`);
    if (process.env.DATABASE_URL) {
      log(`\u{1F517} Connected DB: ${process.env.DATABASE_URL.replace(/:.+@/, ":****@")}`);
    } else {
      log("\u26A0\uFE0F No DATABASE_URL found in .env");
    }
  });
  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
  });
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
  });
})();
