import mongoose, { CallbackError, ObjectId } from "mongoose";
import bcrypt from "bcrypt";

// Create a user schema
export const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    methods: {
      async isValidPassword(password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.password);
      },
    },
  }
);

userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    next();
  } catch (error) {
    next(error as CallbackError); // Pass any errors to the next middleware
  }
});

const User = mongoose.model("User", userSchema);
export default User;

export interface IUser {
  _id: ObjectId;
  username: string;
  name: string;
  password: string;
  createdAt: string;
}
