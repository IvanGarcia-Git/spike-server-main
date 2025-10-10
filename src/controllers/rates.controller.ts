import { RatesService } from "../services/rates.service";
import { Roles } from "../enums/roles.enum";

export module RatesController {
  export const create = async (req, res, next) => {
    try {
      const { groupId } = req.user;

      if (groupId != Roles.Admin) {
        res.status(403).send("unauthorized");
        return;
      }

      const rateData = req.body;
      const newRate = await RatesService.create(rateData);

      res.status(201).json(newRate);
    } catch (error) {
      next(error);
    }
  };

  export const get = async (req, res, next) => {
    try {
      const { id } = req.params;
      const rate = await RatesService.get({ id: Number(id) });

      res.json(rate);
    } catch (error) {
      next(error);
    }
  };

  export const getMany = async (req, res, next) => {
    try {
      const rates = await RatesService.getMany({}, { company: true });

      res.json(rates);
    } catch (error) {
      next(error);
    }
  };

  export const getManyGroupedByCompanyName = async (req, res, next) => {
    try {
      const rates = await RatesService.getManyGroupedByCompanyName({}, { company: true });

      res.json(rates);
    } catch (error) {
      next(error);
    }
  };

  export const update = async (req, res, next) => {
    const { groupId } = req.user;

    if (groupId != Roles.Admin) {
      res.status(403).send("unauthorized");
      return;
    }

    try {
      const { id } = req.params;
      const rateData = req.body;
      const updatedRate = await RatesService.update(Number(id), rateData);

      res.json(updatedRate);
    } catch (error) {
      next(error);
    }
  };

  export const updateChannelForRates = async (req, res, next) => {
    const { groupId } = req.user;

    if (groupId != Roles.Admin) {
      res.status(403).send("unauthorized");
      return;
    }

    try {
      const { channelId, ratesIdsArray } = req.body;
      const updatedRate = await RatesService.updateChannelForRates(
        ratesIdsArray,
        channelId
      );

      res.json(updatedRate);
    } catch (error) {
      next(error);
    }
  };

  export const deleteRate = async (req, res, next) => {
    const { groupId } = req.user;

    if (groupId != Roles.Admin) {
      res.status(403).send("unauthorized");
      return;
    }

    try {
      const { id } = req.params;
      const deleted = await RatesService.deleteRate(Number(id));

      res.json({ deleted });
    } catch (error) {
      next(error);
    }
  };
}
