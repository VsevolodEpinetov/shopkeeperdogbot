import { createMockContext } from '../../setup';
import statusAction from '../../../modules/groupbuy/actions/setstatus';
import db from '../../../modules/db';
import { updateGroupBuyMessages, sendPaymentInstructions } from '../../../modules/groupbuy/util';
import { isSuperUser } from '../../../modules/util';

jest.mock('../../../modules/util', () => ({
  isSuperUser: jest.fn(),
}));

jest.mock('../../../modules/groupbuy/util', () => ({
  updateGroupBuyMessages: jest.fn(),
  sendPaymentInstructions: jest.fn(),
}));

describe('Set Status Action', () => {
  let ctx: any;
  const mockGroupbuy = {
    telegramGroupID: '-1001234567890',
    projectID: 1,
    pricePerMember: 100,
    status: 'open',
  };

  const mockProject = {
    id: 1,
    name: 'Test Project',
  };

  const mockParticipants = [
    { telegramID: '123', paid: false },
    { telegramID: '456', paid: true },
  ];

  beforeEach(() => {
    ctx = createMockContext({
      callbackQuery: {
        data: 'setstatus_payment',
      },
    });
    jest.clearAllMocks();

    (db.where as jest.Mock).mockImplementation(function(this: any) {
      if (this._table === 'groupbuys') return mockGroupbuy;
      if (this._table === 'projects') return mockProject;
      if (this._table === 'groupbuy_participants') return mockParticipants;
      return this;
    });
  });

  it('should not allow non-super users to set status', async () => {
    (isSuperUser as jest.Mock).mockReturnValue(false);
    
    await statusAction.action(/^setstatus_(.*)$/)(ctx);
    
    expect(db.update).not.toHaveBeenCalled();
  });

  it('should update status and create expected payments for payment status', async () => {
    (isSuperUser as jest.Mock).mockReturnValue(true);
    (db.where as jest.Mock).mockImplementation(() => ({
      first: () => mockGroupbuy,
      select: () => mockParticipants,
    }));
    
    await statusAction.action(/^setstatus_(.*)$/)(ctx);
    
    expect(db.update).toHaveBeenCalledWith({ status: 'payment' });
    expect(db.insert).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        telegramGroupID: '-1001234567890',
        payment_method: 'PayPal',
      }),
    ]));
    expect(sendPaymentInstructions).toHaveBeenCalledWith(ctx, 100);
  });
}); 