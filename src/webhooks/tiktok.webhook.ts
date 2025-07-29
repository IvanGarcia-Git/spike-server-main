import { Router } from "express";
import express from "express";
import { LeadsService } from "../services/leads.service";

const router = Router();

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const body = req.body;

    try {
      for (const entry of body.entry) {
        let fullName = null;
        let phoneNumber = null;

        for (const change of entry.changes) {
          switch (change.field) {
            case "name":
              fullName = change.value;
              break;
            case "phone_number":
              phoneNumber = change.value;
              break;
            default:
              console.log(`Campo no esperado: ${change.field}`);
          }
        }

        if (fullName && phoneNumber) {
          try {
            await LeadsService.create({
              fullName,
              phoneNumber,
              campaignName: entry.campaign_name,
              campaignSource: "TikTok",
            });
          } catch (error) {
            throw new Error(`Error creating TikTok Lead ${error}`);
          }
        }
      }

      res.status(200).send("EVENT_RECEIVED");
    } catch (error) {
      console.error("Error procesando el webhook:", error);
      res.status(500).send("Error interno del servidor.");
    }
  }
);

export default router;
