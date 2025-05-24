import { Router } from "express";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNoteById,
} from "../controllers/notesController";

const router = Router();

router.get("/", getNotes);
router.post("/", createNote);
router.put("/:id", updateNote);
router.delete("/:id", deleteNoteById);

export default router;
