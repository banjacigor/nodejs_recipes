const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const Ingredient = require('../models/ingredient')
const Recipe = require('../models/recipe')

// List ingredients for a recipe
router.get('/recipes/:id/ingredients', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const recipe = await Recipe.findById(_id)
        await recipe.populate('ingredients').execPopulate()

        res.send(recipe.ingredients)
    } catch (e) {
        res.status(400).send(e)
    }
})

// Add multiple ingredients to my recipe
router.post('/ingredients/:id/add', auth, async (req, res) => {
    const _id = req.params.id
    let newIngredients = req.body
    if (!newIngredients.every(el => typeof el === 'string')) {
        return res.status(400).send({ error: 'All new ingredients must be strings!' })
    }
    newIngredients = newIngredients.map(el => el.toLowerCase())
    const existingIngredients = []
    const newIngredientsObjects = []
    const recipe = await Recipe.findById(_id)
    await recipe.populate('ingredients').execPopulate()
    recipe.ingredients.forEach((ingredient) => {
        existingIngredients.push(ingredient.name)
    })
    newIngredients = newIngredients.filter(el => !existingIngredients.includes(el))
    newIngredients.forEach(el => newIngredientsObjects.push({ name: el, recipe: _id }))

    try {
        Ingredient.insertMany(newIngredientsObjects)
        res.status(201).send()
    } catch (e) {
        res.status(400).send(e)
    }
})

// Find top 5 most used ingredients
router.get('/ingredients/top', auth, async (req, res) => {
    const { n = 5 } = req.query
    try {
        const topIngredients = await Ingredient.aggregate([
            {
                "$group": {
                    "_id": "$name",
                    "count": {
                        "$sum": 1
                    }
                }
            },
            {
                "$sort": {
                    "count": -1
                }
            },
            { $limit: parseInt(n) }
        ])

        if (!topIngredients.length) {
            return res.status(404).send()
        }

        res.send(topIngredients)
    } catch (e) {
        res.status(500).send()
    }
})


module.exports = router








