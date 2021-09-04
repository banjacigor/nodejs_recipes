const mongoose = require('mongoose')

const ingredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    recipe: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        lowercase: true,
        ref: 'Recipe'
    }
})

const Ingredient = mongoose.model('Ingredient', ingredientSchema)

module.exports = Ingredient









