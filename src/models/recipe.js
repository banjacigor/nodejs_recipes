const mongoose = require('mongoose')
const Ingredient = require('./ingredient')

const recipeSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    instructions: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
})

recipeSchema.index({ '$**': 'text' })

recipeSchema.virtual('ingredients', {
    ref: 'Ingredient',
    localField: '_id',
    foreignField: 'recipe'
})

// Delete ingredients when recipe is removed
recipeSchema.pre('remove', async function (next) {
    const recipe = this

    await Ingredient.deleteMany({ recipe: recipe._id })

    next()
})

const Recipe = mongoose.model('Recipe', recipeSchema)

module.exports = Recipe
