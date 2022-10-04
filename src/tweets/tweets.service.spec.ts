import mongoose from 'mongoose';
import { EntityNotFoundError } from '../@shared/exceptions/entity-not-found.error';
import { Tweet, TweetDocument } from './entities/tweet.entity';
import { TweetsService } from './tweets.service';

describe('TweetsService', () => {
  describe('convertCastErrorToEntityNotFound method', () => {
    it('should throw an EntityNotFoundError when CastError is passed as param', () => {
      const service = new TweetsService(null as any);
      expect(() =>
        service['convertCastErrorToEntityNotFound'](
          new mongoose.Error.CastError('type', 'value', 'path'),
          '123',
        ),
      ).toThrow(new EntityNotFoundError(Tweet, '123'));
    });

    it('should not throw an error when is !== CastError', () => {
      const service = new TweetsService(null as any);
      expect(() =>
        service['convertCastErrorToEntityNotFound'](new Error(), '123'),
      ).not.toThrow(new EntityNotFoundError(Tweet, '123'));
    });
  });
  describe('create method', () => {
    it('should create a tweet', async () => {
      const tweetLeanDoc = {
        _id: new mongoose.Types.ObjectId(),
        content: 'my content',
        screen_name: 'Luiz Carlos',
      };
      class StubTweetModel {
        static save = jest.fn().mockImplementation(async () => ({
          toObject: StubTweetModel.mockToObject,
        }));

        static mockToObject: () => mongoose.LeanDocument<
          TweetDocument & { _id: mongoose.Types.ObjectId }
        > = jest.fn().mockImplementation(() => tweetLeanDoc);

        static mockConstructor = jest.fn();

        constructor(props) {
          StubTweetModel.mockConstructor(props);
        }

        save = StubTweetModel.save;
      }

      const service = new TweetsService(StubTweetModel as any);

      expect(service['tweetModel'].name).toBe(StubTweetModel.name);

      const dto = {
        content: tweetLeanDoc.content,
        screen_name: tweetLeanDoc.screen_name,
      };
      const tweet = await service.create(dto);

      expect(StubTweetModel.mockConstructor).toHaveBeenCalledWith(dto);
      expect(StubTweetModel.save).toHaveBeenCalled();
      expect(StubTweetModel.mockToObject).toHaveBeenCalled();

      expect(tweet).toStrictEqual(Tweet.fromLean(tweetLeanDoc as any));
    });
  });

  describe('findAll method', () => {
    it('should find all tweets', async () => {
      const tweetLeanDoc = {
        _id: new mongoose.Types.ObjectId(),
        content: 'my content',
        screen_name: 'Luiz Carlos',
      };
      const mockExec = jest.fn().mockImplementation(async () => [tweetLeanDoc]);
      const mockLean = jest.fn().mockReturnValue({ exec: mockExec });
      const mockFind = jest.fn().mockReturnValue({ lean: mockLean });
      const service = new TweetsService({
        find: mockFind,
      } as any);
      const tweets = await service.findAll();

      expect(mockFind).toHaveBeenCalled();
      expect(mockLean).toHaveBeenCalled();
      expect(mockExec).toHaveBeenCalled();

      expect(tweets).toStrictEqual([Tweet.fromLean(tweetLeanDoc as any)]);
    });
  });

  describe('findOne method', () => {
    it('should throw error when tweet id not found', async () => {
      const tweetModel = {
        findById: () => ({
          lean: () => ({
            exec: () => null,
          }),
        }),
      };
      const service = new TweetsService(tweetModel as any);
      await expect(() => service.findOne('123')).rejects.toThrow(
        new EntityNotFoundError(Tweet, '123'),
      );
    });

    it('should throw error when tweet id is not a valid ObjectId', async () => {
      const castError = new mongoose.Error.CastError('type', 'value', 'path');
      const tweetModel = {
        findById: () => ({
          lean: () => ({
            exec: () => {
              throw castError;
            },
          }),
        }),
      };
      const service = new TweetsService(tweetModel as any);
      const spyConvertCastErrorToEntityNotFound = jest.spyOn(
        service,
        'convertCastErrorToEntityNotFound' as any,
      );
      await expect(() => service.findOne('123')).rejects.toThrow(
        new EntityNotFoundError(Tweet, '123'),
      );
      expect(spyConvertCastErrorToEntityNotFound).toHaveBeenCalledWith(
        castError,
        '123',
      );
    });

    it('should throw an generic error', async () => {
      const tweetModel = {
        findById: () => ({
          lean: () => ({
            exec: () => {
              throw new Error('fake error');
            },
          }),
        }),
      };
      const service = new TweetsService(tweetModel as any);
      await expect(() => service.findOne('123')).rejects.toThrow(
        new Error('fake error'),
      );
    });

    it('should find a tweet by id', async () => {
      const tweetLeanDoc = {
        _id: new mongoose.Types.ObjectId(),
        content: 'my content',
        screen_name: 'Luiz Carlos',
      };
      const mockExec = jest.fn().mockImplementation(async () => tweetLeanDoc);
      const mockLean = jest.fn().mockReturnValue({ exec: mockExec });
      const mockFindById = jest.fn().mockReturnValue({ lean: mockLean });
      const service = new TweetsService({
        findById: mockFindById,
      } as any);
      const tweet = await service.findOne(tweetLeanDoc._id.toString());

      expect(mockFindById).toHaveBeenCalled();
      expect(mockLean).toHaveBeenCalled();
      expect(mockExec).toHaveBeenCalled();

      expect(tweet).toStrictEqual(Tweet.fromLean(tweetLeanDoc as any));
    });
  });

  describe('update method', () => {
    it('should throw error when tweet id not found', async () => {
      const tweetModel = {
        findOneAndUpdate: () => ({
          lean: () => ({
            exec: () => null,
          }),
        }),
      };
      const service = new TweetsService(tweetModel as any);
      await expect(() => service.update('123', {})).rejects.toThrow(
        new EntityNotFoundError(Tweet, '123'),
      );
    });

    it('should throw error when tweet id is not a valid ObjectId', async () => {
      const castError = new mongoose.Error.CastError('type', 'value', 'path');
      const tweetModel = {
        findOneAndUpdate: () => ({
          lean: () => ({
            exec: () => {
              throw castError;
            },
          }),
        }),
      };

      const service = new TweetsService(tweetModel as any);
      const spyConvertCastErrorToEntityNotFound = jest.spyOn(
        service,
        'convertCastErrorToEntityNotFound' as any,
      );
      await expect(() => service.update('123', {})).rejects.toThrow(
        new EntityNotFoundError(Tweet, '123'),
      );
      expect(spyConvertCastErrorToEntityNotFound).toHaveBeenCalledWith(
        castError,
        '123',
      );
    });

    it('should throw an generic error', async () => {
      const tweetModel = {
        findOneAndUpdate: () => ({
          lean: () => ({
            exec: () => {
              throw new Error('fake error');
            },
          }),
        }),
      };
      const service = new TweetsService(tweetModel as any);
      await expect(() => service.update('123', {})).rejects.toThrow(
        new Error('fake error'),
      );
    });

    it('should update a tweet', async () => {
      const tweetLeanDoc = {
        _id: new mongoose.Types.ObjectId(),
        content: 'my content',
        screen_name: 'Luiz Carlos',
      };
      const mockExec = jest.fn().mockImplementation(async () => tweetLeanDoc);
      const mockLean = jest.fn().mockReturnValue({ exec: mockExec });
      const mockFindOneAndUpdate = jest
        .fn()
        .mockReturnValue({ lean: mockLean });
      const service = new TweetsService({
        findOneAndUpdate: mockFindOneAndUpdate,
      } as any);
      const tweet = await service.update(tweetLeanDoc._id.toString(), {
        content: 'my content',
        screen_name: 'Luiz Carlos',
      });

      expect(mockFindOneAndUpdate).toHaveBeenCalled();
      expect(mockLean).toHaveBeenCalled();
      expect(mockExec).toHaveBeenCalled();

      expect(tweet).toStrictEqual(Tweet.fromLean(tweetLeanDoc as any));
    });
  });

  describe('remove method', () => {
    it('should throw error when tweet id not found', async () => {
      const tweetModel = {
        findOneAndRemove: () => ({
          lean: () => ({
            exec: () => null,
          }),
        }),
      };
      const service = new TweetsService(tweetModel as any);
      await expect(() => service.remove('123')).rejects.toThrow(
        new EntityNotFoundError(Tweet, '123'),
      );
    });

    it('should throw error when tweet id is not a valid ObjectId', async () => {
      const castError = new mongoose.Error.CastError('type', 'value', 'path');
      const tweetModel = {
        findOneAndRemove: () => ({
          lean: () => ({
            exec: () => {
              throw castError;
            },
          }),
        }),
      };

      const service = new TweetsService(tweetModel as any);
      const spyConvertCastErrorToEntityNotFound = jest.spyOn(
        service,
        'convertCastErrorToEntityNotFound' as any,
      );
      await expect(() => service.remove('123')).rejects.toThrow(
        new EntityNotFoundError(Tweet, '123'),
      );
      expect(spyConvertCastErrorToEntityNotFound).toHaveBeenCalledWith(
        castError,
        '123',
      );
    });

    it('should throw an generic error', async () => {
      const tweetModel = {
        findOneAndRemove: () => ({
          lean: () => ({
            exec: () => {
              throw new Error('fake error');
            },
          }),
        }),
      };
      const service = new TweetsService(tweetModel as any);
      await expect(() => service.remove('123')).rejects.toThrow(
        new Error('fake error'),
      );
    });

    it('should remove a tweet', async () => {
      const tweetLeanDoc = {
        _id: new mongoose.Types.ObjectId(),
        content: 'my content',
        screen_name: 'Luiz Carlos',
      };
      const mockExec = jest.fn().mockImplementation(async () => tweetLeanDoc);
      const mockLean = jest.fn().mockReturnValue({ exec: mockExec });
      const mockFindOneAndRemove = jest
        .fn()
        .mockReturnValue({ lean: mockLean });
      const service = new TweetsService({
        findOneAndRemove: mockFindOneAndRemove,
      } as any);
      const notDefined = await service.remove(tweetLeanDoc._id.toString());

      expect(mockFindOneAndRemove).toHaveBeenCalled();
      expect(mockLean).toHaveBeenCalled();
      expect(mockExec).toHaveBeenCalled();

      expect(notDefined).not.toBeDefined();
    });
  });
});
