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

ingredientSchema.methods.toJSON = function () {
    const ingredient = this
    const ingredientObject = ingredient.toObject()

    delete ingredientObject._id
    delete ingredientObject.recipe
    delete ingredientObject.__v

    return ingredientObject
}

const Ingredient = mongoose.model('Ingredient', ingredientSchema)

module.exports = Ingredient









