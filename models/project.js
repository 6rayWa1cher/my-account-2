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
      date: Date,
      processDate: Date,
      transactions: [
        {
          transactionType: String,
          amount: String,
          description: String,
          currencyId: String,
          currencyCode: String,
          foreignAmount: String,
          foreignCurrencyId: String,
          foreignCurrencyCode: String,
          budgetId: String,
          budgetName: String,
          categoryId: String,
          categoryName: String,
          sourceId: String,
          sourceName: String,
          destinationId: String,
          destinationName: String,
          tags: [String],
          internalReference: String,
        },
      ],
    },
  ],
});

const Project = mongoose.model("Project", ProjectSchema);

export default Project;
