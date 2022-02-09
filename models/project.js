import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: Date,
  lastUpdatedAt: Date,
  name: String,
  status: String,
  account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  transactionGroups: [
    {
      groupTitle: String,
      transactions: [
        {
          transactionType: String,
          date: Date,
          amount: String,
          description: String,
          order: Number,
          currencyId: String,
          currencyCode: String,
          foreignAmount: String,
          foreignCurrencyId: String,
          foreignCurrencyCode: String,
          budgetId: String,
          categoryId: String,
          categoryName: String,
          sourceId: String,
          sourceName: String,
          destinationId: String,
          destinationName: String,
          tags: [String],
          internalReference: String,
          processDate: Date,
        },
      ],
    },
  ],
});

const Project = mongoose.model("Project", ProjectSchema);

export default Project;
