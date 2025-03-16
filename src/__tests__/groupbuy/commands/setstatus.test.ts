import { createMockContext } from '../../setup';
import statusCommand from '../../../modules/groupbuy/commands/setstatus';
import db from '../../../modules/db';
import { isSuperUser } from '../../../modules/util';

jest.mock('../../../modules/util', () => ({
  isSuperUser: jest.fn(),
  splitMenu: jest.fn().mockImplementation((arr) => [arr]),
}));

describe('Set Status Command', () => {
  let ctx: any;

  beforeEach(() => {
    ctx = createMockContext({
      message: {
        text: '/setstatus',
      },
    });
    jest.clearAllMocks();
  });

  it('should not allow non-super users to set status', async () => {
    (isSuperUser as jest.Mock).mockReturnValue(false);
    
    await statusCommand.command.setstatus(ctx);
    
    expect(ctx.reply).not.toHaveBeenCalled();
    expect(ctx.deleteMessage).not.toHaveBeenCalled();
  });

  it('should allow super users to set status', async () => {
    (isSuperUser as jest.Mock).mockReturnValue(true);
    
    await statusCommand.command.setstatus(ctx);
    
    expect(ctx.deleteMessage).toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(
      'Choose status of groupbuy',
      expect.any(Object)
    );
  });
}); 