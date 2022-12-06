const mongoose = require("mongoose");

const blockedSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    count: { type: Number, default: 0 },
    blocked_at: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);


module.exports = mongoose.model("blocked", blockedSchema);
