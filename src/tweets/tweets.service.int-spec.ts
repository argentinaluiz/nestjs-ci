import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';
import { EntityNotFoundError } from '../@shared/exceptions/entity-not-found.error';
import { MongoMemory } from '../@shared/testing/mongo-memory';
import { Tweet, TweetSchema } from './entities/tweet.entity';
import { TweetsService } from './tweets.service';

describe('TweetsService Integration Tests', () => {
  let service: TweetsService;
  let mongoMemory: MongoMemory;
  let module: TestingModule;
  beforeEach(async () => {
    mongoMemory = new MongoMemory();
    const uri = await mongoMemory.makeUri();
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: Tweet.name, schema: TweetSchema }]),
      ],
      providers: [TweetsService],
    }).compile();

    service = module.get<TweetsService>(TweetsService);
  });

  afterEach(async () => {
    await mongoMemory.close();
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create method', () => {
    it('should create a tweet', async () => {
      const tweet = await service.create({
        content: 'Hello world',
        screen_name: 'test',
      });
      console.log(tweet);
      expect(tweet).toStrictEqual(
        new Tweet(
          {
            content: 'Hello world',
            screen_name: 'test',
          },
          tweet.id,
        ),
      );

      const tweetCreated = await service['tweetModel']
        .findById(tweet.id)
        .lean()
        .exec();
      expect(Tweet.fromLean(tweetCreated)).toStrictEqual(tweet);
    });
  });

  describe('findAll method', () => {
    it('should find all tweets', async () => {
      const tweet = await service.create({
        content: 'Hello world',
        screen_name: 'test',
      });

      const tweets = await service.findAll();
      expect(tweets).toStrictEqual([tweet]);
    });
  });

  describe('findOne method', () => {
    it('should throw error when tweet id not found', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      await expect(service.findOne(id)).rejects.toThrowError(
        new EntityNotFoundError(Tweet, id),
      );

      await expect(service.findOne('123')).rejects.toThrowError(
        new EntityNotFoundError(Tweet, '123'),
      );
    });

    it('should find a tweet by id', async () => {
      const tweet = await service.create({
        content: 'Hello world',
        screen_name: 'test',
      });
      const tweetFound = await service.findOne(tweet.id);
      console.log(tweetFound);
      expect(tweetFound).toStrictEqual(tweet);
    });
  });

  describe('update method', () => {
    it('should throw error when tweet id not found', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      await expect(service.update(id, {})).rejects.toThrowError(
        new EntityNotFoundError(Tweet, id),
      );

      await expect(service.update('123', {})).rejects.toThrowError(
        new EntityNotFoundError(Tweet, '123'),
      );
    });

    it('should update a tweet', async () => {
      const tweet = await service.create({
        content: 'Hello world',
        screen_name: 'test',
      });
      const tweetUpdated = await service.update(tweet.id, {
        content: 'Hello world updated',
        screen_name: 'test1',
      });
      console.log(tweetUpdated);
      expect(tweetUpdated).toStrictEqual(
        new Tweet(
          {
            content: 'Hello world updated',
            screen_name: 'test1',
          },
          tweet.id,
        ),
      );
    });
  });

  describe('remove method', () => {
    it('should throw error when tweet id not found', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      await expect(service.remove(id)).rejects.toThrowError(
        new EntityNotFoundError(Tweet, id),
      );

      await expect(service.remove('123')).rejects.toThrowError(
        new EntityNotFoundError(Tweet, '123'),
      );
    });

    it('should remove a tweet', async () => {
      const tweet = await service.create({
        content: 'Hello world',
        screen_name: 'test',
      });
      await service.remove(tweet.id);
      await expect(service.findOne(tweet.id)).rejects.toThrowError(
        new EntityNotFoundError(Tweet, tweet.id),
      );
    });
  });
});
