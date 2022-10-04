import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { EntityNotFoundError } from '../@shared/exceptions/entity-not-found.error';
import { CreateTweetDto } from './dto/create-tweet.dto';
import { UpdateTweetDto } from './dto/update-tweet.dto';
import { Tweet, TweetDocument } from './entities/tweet.entity';
import { DeleteResult } from 'mongodb';

@Injectable()
export class TweetsService {
  constructor(
    @InjectModel(Tweet.name) private tweetModel: Model<TweetDocument>,
  ) {}

  async create(createTweetDto: CreateTweetDto) {
    const tweetDoc = new this.tweetModel(createTweetDto);
    const tweetDocCreated = await tweetDoc.save();
    return Tweet.fromLean(tweetDocCreated.toObject());
  }

  async findAll() {
    console.log(this.tweetModel);
    const tweetsDoc = await this.tweetModel.find().lean().exec();
    return tweetsDoc.map((tweetDoc) => Tweet.fromLean(tweetDoc));
  }

  async findOne(id: string) {
    try {
      const tweetDoc = await this.tweetModel.findById(id).lean().exec();
      if (!tweetDoc) {
        throw new EntityNotFoundError(Tweet, id);
      }
      return Tweet.fromLean(tweetDoc);
    } catch (e) {
      this.convertCastErrorToEntityNotFound(e, id);
      throw e;
    }
  }

  async update(id: string, updateTweetDto: UpdateTweetDto) {
    try {
      const tweetDoc = await this.tweetModel
        .findOneAndUpdate({ _id: id }, updateTweetDto, {
          returnDocument: 'after',
        })
        .lean()
        .exec();
      if (!tweetDoc) {
        throw new EntityNotFoundError(Tweet, id);
      }
      return Tweet.fromLean(tweetDoc);
    } catch (e) {
      this.convertCastErrorToEntityNotFound(e, id);
      throw e;
    }
  }

  async remove(id: string) {
    try {
      const tweet = await this.tweetModel
        .findOneAndRemove({ _id: id })
        .lean()
        .exec();
      if (!tweet) {
        throw new EntityNotFoundError(Tweet, id);
      }
    } catch (e) {
      this.convertCastErrorToEntityNotFound(e, id);
      throw e;
    }
  }

  private convertCastErrorToEntityNotFound(error: any, id: string) {
    if (error instanceof mongoose.Error.CastError) {
      throw new EntityNotFoundError(Tweet, id);
    }
  }
}
