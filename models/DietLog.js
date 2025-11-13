const mongoose = require('mongoose');

const dietLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  
  meals: [{
    type: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true
    },
    time: {
      type: Date,
      required: true
    },
    foods: [{
      name: {
        type: String,
        required: [true, 'Food name is required'],
        trim: true
      },
      calories: {
        type: Number,
        min: 0,
        required: [true, 'Calories are required']
      },
      nutrients: {
        protein: {
          type: Number,
          min: 0,
          default: 0
        },
        carbs: {
          type: Number,
          min: 0,
          default: 0
        },
        fat: {
          type: Number,
          min: 0,
          default: 0
        },
        fiber: {
          type: Number,
          min: 0,
          default: 0
        },
        omega3: {
          type: Number,
          min: 0,
          default: 0
        }
      }
    }]
  }],
  
  totalCalories: {
    type: Number,
    min: 0,
    default: 0
  },
  totalNutrients: {
    protein: {
      type: Number,
      min: 0,
      default: 0
    },
    carbs: {
      type: Number,
      min: 0,
      default: 0
    },
    fat: {
      type: Number,
      min: 0,
      default: 0
    },
    fiber: {
      type: Number,
      min: 0,
      default: 0
    },
    omega3: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  
  dietaryScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  antiInflammatoryFoods: [{
    type: String,
    trim: true
  }],
  dataSource: {
    type: String,
    enum: ['api_integration', 'manual'],
    default: 'manual'
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate totals
dietLogSchema.pre('save', function(next) {
  let totalCalories = 0;
  let totalNutrients = {
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    omega3: 0
  };
  
  this.meals.forEach(meal => {
    meal.foods.forEach(food => {
      totalCalories += food.calories || 0;
      totalNutrients.protein += food.nutrients.protein || 0;
      totalNutrients.carbs += food.nutrients.carbs || 0;
      totalNutrients.fat += food.nutrients.fat || 0;
      totalNutrients.fiber += food.nutrients.fiber || 0;
      totalNutrients.omega3 += food.nutrients.omega3 || 0;
    });
  });
  
  this.totalCalories = totalCalories;
  this.totalNutrients = totalNutrients;
  
  next();
});

// Index for performance
dietLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('DietLog', dietLogSchema);