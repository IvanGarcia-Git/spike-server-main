import { Router } from "express";
import { LeadsService } from "../services/leads.service";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 },
});

const router = Router();

router.post("/", upload.single("billFile"), async (req, res, next) => {
  try {
    const leadData = req.body;

    const lead = await LeadsService.create({
      fullName: leadData.fullName,
      phoneNumber: leadData.phoneNumber,
      billUri: leadData.billFile,
      email: leadData.email,
      campaignName: "Formulario Web",
      campaignSource: leadData.campaignSource,
    });

    res.status(200).json(lead);
  } catch (error) {
    next(error);
  }
});

export default router;
