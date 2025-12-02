import { CompaniesService } from "../services/companies.service";

export module CompaniesController {
  const SUPER_ADMIN_GROUP_ID = 1;

  export const create = async (req, res, next) => {
    try {
      console.log("=== CREATE COMPANY DEBUG ===");
      console.log("Content-Type:", req.headers["content-type"]);
      console.log("req.body:", JSON.stringify(req.body));
      console.log("req.files:", req.files);
      console.log("req.file:", req.file);
      console.log("=== END DEBUG ===");

      const { groupId } = req.user;

      if (groupId !== SUPER_ADMIN_GROUP_ID) {
        res.status(403).send("unauthorized");
        return;
      }
      const files = req.files as Express.Multer.File[];
      const companyImage = files?.find(f => f.fieldname === "imgFile");
      const companyData = req.body;

      const newCompany = await CompaniesService.create(
        companyData,
        companyImage
      );

      res.status(201).json(newCompany);
    } catch (error) {
      next(error);
    }
  };

  export const get = async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const company = await CompaniesService.get({ uuid });

      res.json(company);
    } catch (error) {
      next(error);
    }
  };

  export const getAll = async (req, res, next) => {
    try {
      const companies = await CompaniesService.getAll();
      res.json(companies);
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

      const { uuid } = req.params;
      const files = req.files as Express.Multer.File[];
      const companyImage = files?.find(f => f.fieldname === "imgFile");
      const companyData = req.body;

      const updatedCompany = await CompaniesService.update(
        uuid,
        companyData,
        companyImage
      );

      res.json(updatedCompany);
    } catch (error) {
      next(error);
    }
  };

  export const deleteCompany = async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await CompaniesService.deleteCompany(id);

      res.json({ deleted });
    } catch (error) {
      next(error);
    }
  };
}
