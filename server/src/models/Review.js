import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Mỗi user chỉ được đánh giá một sản phẩm một lần
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method: Tính toán và cập nhật averageRating + numReviews lên Item
reviewSchema.statics.calcAverageRatings = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model('Item').findByIdAndUpdate(productId, {
      numReviews: stats[0].nRating,
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
    });
  } else {
    await mongoose.model('Item').findByIdAndUpdate(productId, {
      numReviews: 0,
      averageRating: 0,
    });
  }
};

// Sau khi save review -> tự động cập nhật thống kê lên sản phẩm
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.product);
});

// Sau khi xóa review -> tự động cập nhật lại thống kê
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.product);
  }
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
