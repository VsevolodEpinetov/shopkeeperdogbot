interface Pledge {
    name: string;
    price: number;
}

interface Project {
    creator: string;
    name: string;
    url: string;
    hosted: boolean;
    allPledges: Pledge[] | string;
    selectedPledge: Pledge | string;
    latePledgePrice: number;
    files: string[] | string;
    thumbnail: string;
    tags: string[] | string;
    id?: number;
}

interface GroupBuy {
    telegramGroupID: string;
    margin: number;
    minPricePerMember: number;
    pricePerMember: number;
    finalPrice: number;
    status: string;
    messagesID: string[] | string;
    projectID: number;
}

interface MessagesToEdit {
    toEdit?: string;
    toDelete?: string;
    chatID: string;
}

interface Participant {
    telegramID: string;
    telegramUsername: string;
    telegramFirstName: string;
    telegramLastName?: string;
    balance?: number;
    paid?: boolean;
}

interface User {
    telegramID: string;
    telegramUsername: string;
    telegramFirstName: string;
    telegramLastName: string;
    lastSeenAt: Date;
}

interface ExpectedPayment {
    id?: number;
    telegramGroupID: string;
    telegramID: string;
    amount: string;
    payment_method: string;
    completed: boolean;
}

interface ApifyKickstarterResponse {
    url: string;
    projectName: string;
    creatorName: string;
    rewards: {
      name: string;
      price: string[];
    }[];
  }
  
  interface TransformedKickstarterResponse extends Omit<ApifyKickstarterResponse, 'rewards'> {
    rewards: {
      name: string;
      price: number;
    }[];
  }
  
  interface ApifyResponse {
    items: unknown[];
  }


export {
    Pledge,
    Project,
    GroupBuy,
    MessagesToEdit,
    Participant,
    User,
    ApifyKickstarterResponse,
    TransformedKickstarterResponse,
    ApifyResponse,
    ExpectedPayment
}