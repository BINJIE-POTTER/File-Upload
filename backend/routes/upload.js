import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as uploadController from "../controllers/uploadController.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/check", asyncHandler(uploadController.check));
router.post("/chunk", upload.single("chunkData"), asyncHandler(uploadController.uploadChunk));
router.post("/merge", asyncHandler(uploadController.merge));
router.post("/terminate", asyncHandler(uploadController.terminate));

export default router;
