import { Tweet, TweetSchema } from './tweet.entity';
import mongoose from 'mongoose';
import { MongoMemory } from '../../@shared/testing/mongo-memory';

describe('Tweet Schema Unit Tests', () => {
  describe('Tweet class', () => {
    test('props', () => {
      const tweet = new Tweet();

      tweet.content = 'my tweet content';
      tweet.screen_name = 'Luiz Carlos';

      expect(tweet.content).toEqual('my tweet content');
      expect(tweet.screen_name).toEqual('Luiz Carlos');
    });
  });

  describe('TweetSchema class', () => {
    it('should to be defined', () => {
      expect(TweetSchema).toBeDefined();
    });

    it('should construct a document instance', () => {
      const TweetModel = mongoose.model('Tweet', TweetSchema);
      const tweet = new TweetModel({
        content: 'my tweet content',
        screen_name: 'Luiz Carlos',
      });

      expect(tweet).toBeInstanceOf(mongoose.Model);
      expect(tweet._id).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(tweet.id).toBe(tweet._id.toString());
      expect(tweet.content).toEqual('my tweet content');
      expect(tweet.screen_name).toEqual('Luiz Carlos');
    });
  });

  describe('Using MongoDB', () => {
    let mongoMemory: MongoMemory;
    let mongooseInst: mongoose.Mongoose;

    beforeEach(async () => {
      mongoMemory = new MongoMemory();
      const uri = await mongoMemory.makeUri();
      mongooseInst = await mongoose.connect(uri, {
        dbName: 'nestjs_test',
      });
    });

    afterEach(async () => {
      await mongooseInst.disconnect();
      await mongoMemory.close();
    });

    it('should create a new tweet', async () => {
      const TweetModel = mongooseInst.model('Tweet', TweetSchema);
      const tweet = new TweetModel({
        content: 'my tweet content',
        screen_name: 'Luiz Carlos',
      });
      await tweet.save();

      const tweetCreated = await TweetModel.findById(tweet.id).exec();
      expect(tweetCreated.content).toBe('my tweet content');
      expect(tweetCreated.screen_name).toBe('Luiz Carlos');
    });
  });
});
