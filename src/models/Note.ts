import mongoose, { CallbackError } from "mongoose";
import bcrypt from "bcrypt";
import { userSchema } from "./User";

// Create a user schema
const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    lowercase: true,
  },
  version: { type: Number, default: 1 },
  owner: userSchema,
  collaborators: [userSchema],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  versions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NoteHistory",
    },
  ],
});

const Note = mongoose.model("Note", noteSchema);
export default Note;
