import { Schema, model, models } from 'mongoose';

const CategorySchema = new Schema({
  name:            { type: String, required: true },
  type:            { type: String, enum: ['singles', 'doubles', 'mixed'], required: true },
  format:          { type: String, enum: ['knockout', 'league', 'group+knockout'], default: 'knockout' },
  maxParticipants: { type: Number, default: 32 },
  entryFee:        { type: Number, default: 0 },
  status:          { type: String, enum: ['open', 'closed', 'ongoing', 'completed'], default: 'open' },
}, { _id: true });

const TournamentSchema = new Schema({
  name:                 { type: String, required: true },
  description:          { type: String },
  startDate:            { type: Date, required: true },
  endDate:              { type: Date, required: true },
  venue:                { type: String },
  registrationDeadline: { type: Date },
  categories:           [CategorySchema],
  isPublic:             { type: Boolean, default: true },
  status:               { type: String, enum: ['draft', 'registration_open', 'ongoing', 'completed'], default: 'draft' },
  createdBy:            { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ── Registration ──────────────────────────────────────────────────────────────
const RegistrationSchema = new Schema({
  tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
  categoryId:   { type: String, required: true },     // sub-document _id as string
  player1:      {
    name:     { type: String, required: true },
    phone:    { type: String, required: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
  },
  player2:      {                                      // doubles only
    name:     String,
    phone:    String,
    memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
  },
  paymentId:    { type: Schema.Types.ObjectId, ref: 'Payment' },
  status:       { type: String, enum: ['registered', 'confirmed', 'withdrawn'], default: 'registered' },
}, { timestamps: true });

RegistrationSchema.index({ tournamentId: 1, categoryId: 1 });

// ── Fixture (bracket match) ────────────────────────────────────────────────────
const ScoreSchema = new Schema({ set: Number, p1: Number, p2: Number }, { _id: false });

const FixtureSchema = new Schema({
  tournamentId:   { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
  categoryId:     { type: String, required: true },
  round:          { type: Number, required: true },
  matchNumber:    { type: Number, required: true },
  player1Id:      { type: Schema.Types.ObjectId, ref: 'TournamentRegistration' },
  player2Id:      { type: Schema.Types.ObjectId, ref: 'TournamentRegistration' },
  scheduledTime:  { type: Date },
  court:          { type: String },
  scores:         [ScoreSchema],
  winnerId:       { type: Schema.Types.ObjectId, ref: 'TournamentRegistration' },
  status:         { type: String, enum: ['pending', 'scheduled', 'ongoing', 'completed', 'walkover'], default: 'pending' },
  nextMatchId:    { type: Schema.Types.ObjectId, ref: 'Fixture' },
}, { timestamps: true });

FixtureSchema.index({ tournamentId: 1, round: 1 });

export const Tournament             = models.Tournament             || model('Tournament',             TournamentSchema);
export const TournamentRegistration = models.TournamentRegistration || model('TournamentRegistration', RegistrationSchema);
export const Fixture                = models.Fixture                || model('Fixture',                FixtureSchema);
