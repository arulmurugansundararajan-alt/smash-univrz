import mongoose, { Schema } from 'mongoose';

// ── Tournament ────────────────────────────────────────────────────────────────
const TournamentSchema = new Schema({
  name:       { type: String, required: true, trim: true },
  type:       { type: String, enum: ['knockout', 'round_robin'], required: true },
  category:   { type: String, enum: ['singles', 'doubles'], required: true },
  maxPlayers: { type: Number, required: true, min: 2, max: 128 },
  venue:      { type: String, trim: true, default: '' },
  date:       { type: Date },
  status:     { type: String, enum: ['setup', 'ongoing', 'completed'], default: 'setup' },
  courtCount: { type: Number, default: 2, min: 1 },
}, { timestamps: true });

// ── TPlayer (tournament player/team) ─────────────────────────────────────────
const TPlayerSchema = new Schema({
  tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
  name:         { type: String, required: true, trim: true },
  phone:        { type: String, trim: true, default: '' },
  // doubles partner
  partnerName:  { type: String, trim: true, default: '' },
  partnerPhone: { type: String, trim: true, default: '' },
  entryOrder:   { type: Number, default: 0 },
}, { timestamps: true });

TPlayerSchema.index({ tournamentId: 1, entryOrder: 1 });

// ── TMatch (tournament match) ─────────────────────────────────────────────────
const SetSchema = new Schema(
  { p1: { type: Number, default: 0 }, p2: { type: Number, default: 0 } },
  { _id: false },
);

const TMatchSchema = new Schema({
  tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
  round:        { type: Number, required: true },
  roundName:    { type: String, default: '' },
  matchNumber:  { type: Number, required: true },
  player1Id:    { type: Schema.Types.ObjectId, ref: 'TPlayer', default: null },
  player2Id:    { type: Schema.Types.ObjectId, ref: 'TPlayer', default: null },
  sets:         { type: [SetSchema], default: [] },
  winnerId:     { type: Schema.Types.ObjectId, ref: 'TPlayer', default: null },
  status:       { type: String, enum: ['pending', 'live', 'completed', 'walkover'], default: 'pending' },
  court:        { type: String, default: '' },
  isBye:        { type: Boolean, default: false },
  completedAt:  { type: Date },
}, { timestamps: true });

TMatchSchema.index({ tournamentId: 1, round: 1, matchNumber: 1 });
TMatchSchema.index({ tournamentId: 1, status: 1 });

// Delete cached models to prevent stale schema errors on Next.js hot reload
// (Old schemas with different fields/enums persist in mongoose.models across reloads)
delete (mongoose.models as Record<string, unknown>)['Tournament'];
delete (mongoose.models as Record<string, unknown>)['TPlayer'];
delete (mongoose.models as Record<string, unknown>)['TMatch'];

export const Tournament = mongoose.model('Tournament', TournamentSchema);
export const TPlayer    = mongoose.model('TPlayer', TPlayerSchema);
export const TMatch     = mongoose.model('TMatch', TMatchSchema);
