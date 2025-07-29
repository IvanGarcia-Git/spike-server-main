import { AwsHelper } from "../helpers/aws.helper";
import { Channel } from "../models/channel.entity";
import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere } from "typeorm";

export module ChannelsService {
  export const create = async (
    channelData: Partial<Channel>,
    channelImage?: Express.Multer.File
  ): Promise<Channel> => {
    try {
      const channelRepository = dataSource.getRepository(Channel);

      if (channelImage) {
        channelData.imageUri = await AwsHelper.uploadImageToS3("channel", channelImage);
      }

      const newChannel = channelRepository.create(channelData);

      return await channelRepository.save(newChannel);
    } catch (error) {
      throw error;
    }
  };

  export const get = async (
    where: FindOptionsWhere<Channel>,
    relations: FindOptionsRelations<Channel> = {}
  ): Promise<Channel> => {
    try {
      const channelRepository = dataSource.getRepository(Channel);

      const channelFound = await channelRepository.findOne({
        where,
        relations,
      });

      if (!channelFound) {
        throw new Error("channel-not-found");
      }

      if (channelFound?.imageUri) {
        channelFound.imageUri = AwsHelper.getPresignedUrl(channelFound.imageUri);
      }

      return channelFound;
    } catch (error) {
      throw error;
    }
  };

  export const getAll = async (): Promise<Channel[]> => {
    try {
      const channelRepository = dataSource.getRepository(Channel);

      const channelsFound: Channel[] = await channelRepository.find();

      for (const channelFound of channelsFound) {
        if (channelFound?.imageUri) {
          channelFound.imageUri = AwsHelper.getPresignedUrl(channelFound.imageUri);
        }
      }

      return channelsFound;
    } catch (error) {
      throw error;
    }
  };

  export const update = async (
    uuid: string,
    channelData: Partial<Channel>,
    channelImage?: Express.Multer.File
  ): Promise<Channel> => {
    try {
      const channelRepository = dataSource.getRepository(Channel);

      const channel = await channelRepository.findOne({ where: { uuid } });

      if (!channel) {
        throw new Error("channel-not-found");
      }

      if (channelImage) {
        channelData.imageUri = await AwsHelper.uploadImageToS3("channel", channelImage);
      }

      Object.assign(channel, channelData);

      const updatedChannel = await channelRepository.save(channel);

      return updatedChannel;
    } catch (error) {
      throw error;
    }
  };

  export const deleteChannel = async (uuid: string): Promise<boolean> => {
    try {
      const channelRepository = dataSource.getRepository(Channel);

      const channel = await channelRepository.findOne({ where: { uuid } });

      if (!channel) {
        throw new Error("channel-not-found");
      }

      await channelRepository.remove(channel);

      return true;
    } catch (error) {
      throw error;
    }
  };
}
