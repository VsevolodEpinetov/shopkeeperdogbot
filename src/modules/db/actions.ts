import db from "./index";

// Define TypeScript interfaces for better type safety
interface User {
  telegramID: string;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  addedAt?: Date;
  lastSeenAt?: Date;
}

interface Project {
  id?: number;
  creator: string;
  title: string;
  url: string;
  hosted: boolean;
  price: number;
}

interface GroupBuy {
  projectID: number;
  telegramGroupID: number;
  margin: number;
  minPrice: number;
  finalPrice: number;
  latePledgePrice?: number;
  participants: number[]; // Array of user IDs
  thumbnail: string;
}

// 🔹 Insert a new user or update last seen time
export const upsertUser = async (user: User): Promise<void> => {
  try {
    await db("users")
      .insert({
        telegramID: user.telegramID,
        telegramUsername: user.telegramUsername || null,
        telegramFirstName: user.telegramFirstName || null,
        telegramLastName: user.telegramLastName || null,
        addedAt: new Date(),
        lastSeenAt: new Date(),
      })
      .onConflict("telegramID")
      .merge({ lastSeenAt: new Date() });
  } catch (error) {
    console.error("DB Error (upsertUser):", error);
  }
};

// 🔹 Get user by Telegram ID
export const getUser = async (telegramID: number): Promise<User | null> => {
  try {
    return await db("users").where("telegramID", telegramID).first() as User;
  } catch (error) {
    console.error("DB Error (getUser):", error);
    return null;
  }
};

// 🔹 Create a new project
export const createProject = async (project: Project): Promise<number | null> => {
  try {
    const [id] = await db("projects")
      .insert(project)
      .returning("id");

    return id;
  } catch (error) {
    console.error("DB Error (createProject):", error);
    return null;
  }
};

// 🔹 Get all projects
export const getAllProjects = async (): Promise<Project[]> => {
  try {
    return await db("projects").select("*");
  } catch (error) {
    console.error("DB Error (getAllProjects):", error);
    return [];
  }
};

// 🔹 Create a new group buy
export const createGroupBuy = async (groupbuy: GroupBuy): Promise<void> => {
  try {
    await db("groupbuys").insert({
      ...groupbuy,
      participants: JSON.stringify(groupbuy.participants), // Convert array to JSON string
    });
  } catch (error) {
    console.error("DB Error (createGroupBuy):", error);
  }
};

// 🔹 Get all group buys
export const getAllGroupBuys = async (): Promise<GroupBuy[]> => {
  try {
    return await db("groupbuys").select("*");
  } catch (error) {
    console.error("DB Error (getAllGroupBuys):", error);
    return [];
  }
};
