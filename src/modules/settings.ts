// Define types with an index signature for dynamic keys
interface ChatsIDs {
  [key: string]: string;
}

interface Limits {
  MessageCharacters: number;
}

interface Settings {
  ChatsIDs: ChatsIDs;
  Limits: Limits;
}

// Define the settings object
const TelegramData: Settings = {
  ChatsIDs: {
    Epinetov: "91430770",
    Ann: "101922344"
  },
  Limits: {
    MessageCharacters: 1024,
  },
};

interface GroupBuysSettings {
  Statuses: {
    [key: string]: string;
  },
  StatusMessages: {
    [key: string]: string;
  },
  AmountOfReservedMessages: number;
}

const GroupBuysData: GroupBuysSettings = {
  Statuses: {
    Pending: "pending",
    Prereg: "prereg",
    Open: "open",
    Completed: "completed",
    Cancelled: "cancelled",
    Closed: "closed",
    Payment: "payment"
  },
  StatusMessages: {
    "pending": "🟡 Pending",
    "prereg": "⏰ Pre-registration",
    "open": "🟢 Open",
    "completed": "✅ Completed",
    "cancelled": "❌ Cancelled",
    "closed": "🔴 Closed",
    "payment": "🟡 Payment"
  },
  AmountOfReservedMessages: 3
}

export {
  TelegramData,
  GroupBuysData
};
