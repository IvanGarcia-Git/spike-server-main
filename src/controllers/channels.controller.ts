import { ChannelsService } from "../services/channels.service";
import { Roles } from "../enums/roles.enum";

export module ChannelsController {
  export const create = async (req, res, next) => {
    try {
      const { groupId } = req.user;

      if (groupId != Roles.Admin) {
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

      if (groupId != Roles.Admin) {
        res.status(403).send("unauthorized");
        return;
      }

      const { uuid: channelUuid } = req.params;

      const channelImage: Express.Multer.File = req.file;

      const channelData = {
        name: req.body.name,
        representativeName: req.body.representativeName,
        representativePhone: req.body.representativePhone,
        representativeEmail: req.body.representativeEmail,
        address: req.body.address,
        cif: req.body.cif,
        iban: req.body.iban,
      };

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

      if (groupId != Roles.Admin) {
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
