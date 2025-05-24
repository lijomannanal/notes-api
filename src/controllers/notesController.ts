import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import jwt, { Secret, JwtPayload } from "jsonwebtoken";
import Note from "../models/Note";
import NoteHistory from "../models/NoteHistory";
import { versions } from "process";
import { SOCKET_ACTIONS } from "../models/Common";

const excludeFields =
  "-owner.password -owner.createdAt -owner.__v -collaborators.password -collaborators.createdAt -collaborators.__v";

const noteValidateSchema = Joi.object({
  title: Joi.string().min(3).max(50).required(),
  content: Joi.string().min(3).max(10000).required(),
}).required();
export const createNote = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error } = noteValidateSchema.validate(req.body);
    console.log(error);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }
    const { title, content } = req.body;
    const note = new Note({
      title,
      content,
      owner: req.user,
      collaborators: [req.user],
    });
    await note.save();
    const io = req.io;
    io.emit(SOCKET_ACTIONS.ADD_NOTE, {
      text: `A Note with title "${note.title}" has been created by ${req.user?.name}`,
      data: note,
    });
    res.status(201).json(note);
    return;
  } catch (error) {
    res.status(500).json({ error: `Something went wrong! ${error}` });
    return;
  }
};

export const updateNote = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error } = noteValidateSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }
    const { id } = req.params;
    const { title, content } = req.body;
    const note = await Note.findById(id);
    if (!note) {
      res.status(404).json({ error: `Note does not exist!` });
      return;
    } else {
      const { _id, version, collaborators, versions } = note;
      const newVersion = new NoteHistory({
        notedId: _id,
        version,
        data: note?.toObject(),
      });
      await newVersion.save();
      versions.push(newVersion._id);
      const updatedNote = {
        title,
        content,
        version: version + 1,
        updatedAt: new Date(),
        versions,
      } as any;
      const currentCollaborators = note.collaborators.map((c) => c.username);
      if (!currentCollaborators.includes(req.user.username)) {
        updatedNote.collaborators = [...collaborators, req.user];
      }
      const updatedDocument = await Note.findOneAndUpdate(
        { _id: id }, // Filter to find the document to update
        updatedNote, // Data to update
        { new: true, runValidators: true } // Options: return the updated document and run validators
      )
        .populate("versions")
        .select(excludeFields);
      //   const result = await Note.updateOne({ _id: id }, { $set: updatedNote });
      if (!updatedDocument) {
        res.status(404).json({ error: "Update failed!" });
        return;
      }
      res.status(200).json(updatedDocument);
      const io = req.io;
      io.emit(SOCKET_ACTIONS.UPDATE_NOTE, {
        text: `A Note with title "${updatedDocument.title}" has been updated by ${req.user?.name}`,
        data: updatedDocument,
      });
      io.to(updatedDocument._id.toString()).emit(
        SOCKET_ACTIONS.UPDATE_CURRENT_NOTE,
        {
          text: `A Note with title "${updatedDocument.title}" has been updated by ${req.user?.name}`,
          data: updatedDocument,
        }
      );
      return;
    }
  } catch (error) {
    res.status(500).json({ error: `Something went wrong! ${error}` });
    return;
  }
};

export const getNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = await Note.find().populate("versions").select(excludeFields);
  res.json({ data: result });
  return;
};

export const deleteNoteById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const result = await Note.findByIdAndDelete(id);
  if (result) {
    const io = req.io;
    io.emit(SOCKET_ACTIONS.DELETE_NOTE, {
      text: `A Note with title "${result.title}" has been deleted by ${req.user?.name}`,
      noteId: id,
    });
    res.status(200).send({ message: "Note deleted successfully." });
  } else {
    res.status(404).send({ error: "Note does not exist!" });
  }

  return;
};
