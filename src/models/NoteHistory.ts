import mongoose, { CallbackError } from "mongoose";
import bcrypt from "bcrypt";
import { userSchema } from "./User";

// Create a user schema
const noteHistorySchema = new mongoose.Schema({
  notedId: { type: mongoose.Schema.Types.ObjectId, ref: "Note" },
  version: {
    type: Number,
  },
  data: { type: Object },
});

const User = mongoose.model("NoteHistory", noteHistorySchema);
export default User;
