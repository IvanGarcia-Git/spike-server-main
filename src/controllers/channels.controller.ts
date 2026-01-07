import { ChannelsService } from "../services/channels.service";
import { Roles } from "../enums/roles.enum";

export module ChannelsController {
  const SUPER_ADMIN_GROUP_ID = 1;
  export const create = async (req, res, next) => {
    try {
      const { groupId } = req.user;

      if (groupId !== SUPER_ADMIN_GROUP_ID) {
        res.status(403).send("unauthorized");
        return;
      }

      const channelData = req.body;
      const channelImage: Express.Multer.File = req.file;

      const newChannel = await ChannelsService.create(
        channelData,
        channelImage
      );

      res.json(newChannel);
    } catch (error) {
      next(error);
    }
  };

  export const get = async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const channel = await ChannelsService.get(
        { uuid },
        { rates: { company: true } }
      );

      res.json(channel);
    } catch (error) {
      next(error);
    }
  };

  export const getAll = async (req, res, next) => {
    try {
      const channels = await ChannelsService.getAll();

      res.json(channels);
    } catch (error) {
      next(error);
    }
  };

  export const update = async (req, res, next) => {
    try {
      const { groupId } = req.user;

      if (groupId !== SUPER_ADMIN_GROUP_ID) {
        res.status(403).send("unauthorized");
        return;
      }

      const { uuid: channelUuid } = req.params;

      const channelImage: Express.Multer.File = req.file;

      // Construir objeto solo con campos que tienen valor definido
      const channelData: Record<string, any> = {};

      if (req.body.name !== undefined) channelData.name = req.body.name;
      if (req.body.representativeName !== undefined) channelData.representativeName = req.body.representativeName;
      if (req.body.representativePhone !== undefined) channelData.representativePhone = req.body.representativePhone;
      if (req.body.representativeEmail !== undefined) channelData.representativeEmail = req.body.representativeEmail;
      if (req.body.address !== undefined) channelData.address = req.body.address;
      if (req.body.cif !== undefined) channelData.cif = req.body.cif;
      if (req.body.iban !== undefined) channelData.iban = req.body.iban;

      const updatedChannel = await ChannelsService.update(
        channelUuid,
        channelData,
        channelImage
      );

      res.json(updatedChannel);
    } catch (error) {
      next(error);
    }
  };

  export const deleteChannel = async (req, res, next) => {
    try {
      const { groupId } = req.user;

      if (groupId !== SUPER_ADMIN_GROUP_ID) {
        res.status(403).send("unauthorized");
        return;
      }

      const { channelUuid } = req.body;

      const deleted = await ChannelsService.deleteChannel(channelUuid);

      res.json({ deleted });
    } catch (error) {
      next(error);
    }
  };
}
