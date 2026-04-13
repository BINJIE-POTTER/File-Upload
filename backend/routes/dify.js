import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as difyController from "../controllers/difyController.js";

const router = Router();

router.post("/chat", asyncHandler(difyController.chat));

export default router;
