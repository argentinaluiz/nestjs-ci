import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import mongoose from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { TweetsService } from '../src/tweets/tweets.service';
import { Tweet } from '../src/tweets/entities/tweet.entity';
import { EntityNotFoundError } from '../src/@shared/exceptions/entity-not-found.error';

async function cleanCollections(mongoose: mongoose.Connection) {
  const collections = await mongoose.db.collections();

  for (const collection of collections) {
    await collection.drop();
  }
}

describe('TweetController (e2e)', () => {
  let app: INestApplication;
  let tweetService: TweetsService;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    console.log(process.env.MONGO_DSN);
    const mongoose = moduleFixture.get(getConnectionToken());
    await cleanCollections(mongoose);

    tweetService = moduleFixture.get(TweetsService);
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      app.close();
    }
  });

  it('GET /tweets', async () => {
    const tweet = await tweetService.create({
      content: 'my content',
      screen_name: 'Luiz Carlos',
    });
    return request(app.getHttpServer())
      .get('/tweets')
      .expect(200)
      .expect([
        {
          id: tweet.id,
          content: tweet.content,
          screen_name: tweet.screen_name,
        },
      ]);
  });

  it('POST /tweets', async () => {
    const res = await request(app.getHttpServer())
      .post('/tweets')
      .send({ content: 'my content', screen_name: 'Luiz Carlos' })
      .expect(201);
    expect(res.body.id).toBeDefined();

    const tweet = await tweetService.findOne(res.body.id);

    expect(res.body).toStrictEqual({
      id: tweet.id,
      content: tweet.content,
      screen_name: tweet.screen_name,
    });
  });

  it('GET /tweets/:id', async () => {
    const tweet = await tweetService.create({
      content: 'my content',
      screen_name: 'Luiz Carlos',
    });
    return request(app.getHttpServer())
      .get(`/tweets/${tweet.id}`)
      .expect(200)
      .expect({
        id: tweet.id,
        content: tweet.content,
        screen_name: tweet.screen_name,
      });
  });

  it('PATCH /tweets/:id', async () => {
    const tweet = await tweetService.create({
      content: 'my content',
      screen_name: 'Luiz Carlos',
    });
    const res = await request(app.getHttpServer())
      .patch(`/tweets/${tweet.id}`)
      .send({ content: 'my new content', screen_name: 'Luiz Carlos' })
      .expect(200)
      .expect({
        id: tweet.id,
        content: 'my new content',
        screen_name: tweet.screen_name,
      });

    const tweetUpdated = await tweetService.findOne(res.body.id);
    expect(tweetUpdated).toStrictEqual(
      new Tweet(
        {
          content: 'my new content',
          screen_name: tweetUpdated.screen_name,
        },
        res.body.id,
      ),
    );
  });

  it('DELETE /tweets/:id', async () => {
    const tweet = await tweetService.create({
      content: 'my content',
      screen_name: 'Luiz Carlos',
    });
    await request(app.getHttpServer())
      .delete(`/tweets/${tweet.id}`)
      .expect(204);

    expect(() => tweetService.findOne(tweet.id)).rejects.toThrow(
      new EntityNotFoundError(Tweet, tweet.id),
    );
  });
});
