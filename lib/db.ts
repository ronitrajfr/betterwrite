// db.ts
import Dexie, { type Table } from "dexie";

export interface Note {
  id?: number; // auto-increment
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extend Dexie and define tables
export class betterwriteDB extends Dexie {
  notes!: Table<Note, number>; // <Type of object, type of primary key>

  constructor() {
    super("betterwriteDB");
    this.version(1).stores({
      notes: "++id, title, content, createdAt, updatedAt",
    });
  }
}

export const db = new betterwriteDB();
