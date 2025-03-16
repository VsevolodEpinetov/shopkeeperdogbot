import { Context } from 'telegraf';

// Mock database
jest.mock('../db', () => ({
  __esModule: true,
  default: {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Helper to create mock context
export const createMockContext = (overrides = {}) => {
  const defaultContext = {
    from: {
      id: '123456789',
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
    },
    chat: {
      id: '-1001234567890',
      type: 'supergroup',
    },
    message: {
      message_id: 1,
      text: '',
    },
    reply: jest.fn(),
    replyWithHTML: jest.fn(),
    deleteMessage: jest.fn(),
    telegram: {
      sendMessage: jest.fn(),
      editMessageText: jest.fn(),
      deleteMessage: jest.fn(),
    },
    session: {
      messages: {
        chatID: '-1001234567890',
        toEdit: '1',
        toDelete: '1',
      },
      project: null,
      groupbuy: null,
    },
  };

  return {
    ...defaultContext,
    ...overrides,
  } as unknown as Context;
}; 