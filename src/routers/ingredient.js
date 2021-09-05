const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const Ingredient = require('../models/ingredient')
const Recipe = require('../models/recipe')

// List ingredients for a recipe
router.get('/recipe/:id/ingredients', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const recipe = await Recipe.findById(_id)
        await recipe.populate('ingredients').execPopulate()

        res.send(recipe.ingredients)
    } catch (e) {
        res.status(400).send(e)
    }


})

// Add one ingredient to my recipe
router.post('/recipe/:id/addOne', auth, async (req, res) => {
    const name = req.body.name
    const _id = req.params.id

    const ingredientCheck = await Ingredient.exists({ name, recipe: _id })
    const recipeCheck = await Recipe.exists({ _id, author: req.user._id })

    if (!recipeCheck) {
        return res.status(401).send({ error: 'You can only add ingredients to your recipes!' })
    }

    if (ingredientCheck) {
        return res.status(409).send({ error: 'This ingredient is already listed for this recipe!' })
    }

    const ingredient = new Ingredient({
        ...req.body,
        recipe: _id
    })

    try {
        await ingredient.save()
        res.status(201).send(ingredient)
    } catch (e) {
        res.status(400).send(e)
    }
})

// Add multiple ingredients to my recipe
router.post('/recipe/:id/addMany', auth, async (req, res) => {
    const _id = req.params.id
    let newIngredients = req.body
    newIngredients = newIngredients.map(el => el.toLowerCase())
    if (!newIngredients.every(el => typeof el === 'string')) {
        return res.status(409).send({ error: 'All new ingredients must be strings!' })
    }
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
router.get('/ingredients/topFive', auth, async (req, res) => {
    Ingredient.aggregate([
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
        { $limit: 5 }
    ], function (err, resolve) {
        if (err) {
            res.status(400).send(err)
        }
        const topFive = []
        resolve.forEach(el => topFive.push(el._id))
        res.status(200).send(topFive)
    })

})


module.exports = router








