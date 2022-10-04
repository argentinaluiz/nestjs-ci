import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export type TweetDocument = Tweet & Document;

export type TweetProps = Omit<Tweet, 'id'> & {
  content: string;
  screen_name: string;
};

@Schema()
export class Tweet {
  constructor(props: TweetProps = {} as any, id: string) {
    Object.assign(this, props);
    this.id = id;
  }

  id: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  screen_name: string;

  //}: TweetProps & { _id: string | mongoose.Types.ObjectId }) {
  static fromLean(
    document: mongoose.LeanDocument<
      TweetDocument & { _id: mongoose.Types.ObjectId }
    >,
  ) {
    // static fromLean({
    //   _id,
    //   __v,
    //   ...otherFields
    // }: Omit<TweetProps, 'version'> & {
    //   _id: string | mongoose.Types.ObjectId;
    //   __v: number;
    // }) {
    return new Tweet(
      {
        content: document.content,
        screen_name: document.screen_name,
      },
      document._id.toString(),
    );
  }
}

export const TweetSchema = SchemaFactory.createForClass(Tweet);
