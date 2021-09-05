const express = require('express')
const Recipe = require('../models/recipe')
const Ingredient = require('../models/ingredient')
const auth = require('../middleware/auth')
const router = new express.Router()

// Create recipe
router.post('/recipes', auth, async (req, res) => {
    let ingredients = req.body.ingredients
    // Remove duplicates from array of ingredients
    ingredients = [...new Set(ingredients)]
    const newIngredientsObjects = []
    const recipeCheck = await Recipe.exists({ title: req.body.title })

    if (recipeCheck) {
        return res.status(409).send({ error: 'A recipe with that title already exists!' })
    }

    const recipe = new Recipe({
        title: req.body.title,
        instructions: req.body.instructions,
        author: req.user._id
    })

    try {
        await recipe.save()
        ingredients.forEach(el => newIngredientsObjects.push({ name: el, recipe: recipe.id }))
        Ingredient.insertMany(newIngredientsObjects)
        res.status(201).send(recipe)
    } catch (e) {
        res.status(400).send(e)
    }
})

// Get user's recipes
// Get /recipes?limit=10&skip=10
// GET /recipes?sortBy=createdAt_desc
router.get('/recipes/me', auth, async (req, res) => {
    const sort = {}

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        // Alternative
        // const recipes = await Recipe.find({ author: req.user._id })
        // res.send(recipes)

        await req.user.populate({
            path: 'recipes',
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.recipes)
    } catch (e) {
        res.status(500).send(e)
    }
})

// Get all recipes with ingredients
router.get('/rec', async (req, res) => {
    const { page = 1, limit = 10 } = req.query
    const recipes = await Recipe.find({})
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('-createdAt')
        .populate('ingredients')
        .exec()

    console.log(recipes[0], recipes[0].ingredients)

    // await recipes
    //     .populate('ingredients')
    //     .exec()
    // await recipes.populate('ingredients').execPopulate()
    const recipesToReturn = []
    recipes.forEach(el => recipesToReturn.push(el))
    if (!recipes) {
        return res.status(404).send()
    }

    res.send(recipes)


    // const _id = '613312c62983f08a6cd43b50'

    // try {
    //     const recipes = await Recipe.findById(_id)
    //     await recipes.populate('ingredients').execPopulate()

    //     // await recipes.populate('ingredients').execPopulate()

    //     if (!recipes) {
    //         return res.status(404).send()
    //     }

    //     res.send({ recipes, "k": recipes.ingredients })
    // } catch (e) {
    //     res.status(500).send()
    // }
})

// Get all recipes
router.get('/recipes', async (req, res) => {
    const { page = 1, limit = 10 } = req.query

    try {
        const recipes = await Recipe.find({})
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort('-createdAt')

        // await recipes.populate('ingredients').execPopulate()

        if (!recipes) {
            return res.status(404).send()
        }

        res.send({ recipes, "ingredients": recipes.ingredients })
    } catch (e) {
        res.status(500).send()
    }
})

// Get single recipe
router.get('/recipes/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const recipe = await Recipe.findOne({ _id, author: req.user._id })

        if (!recipe) {
            return res.status(404).send()
        }

        res.send(recipe)
    } catch (e) {
        res.status(500).send()
    }
})

// Update recipe
router.patch('/recipe/:id', auth, async (req, res) => {
    const _id = req.params.id
    const updates = Object.keys(req.body)
    const allowedUpdates = ['title', 'instructions']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        const recipe = await Recipe.findOne({ _id, author: req.user._id })

        if (!recipe) {
            return res.status(404).send()
        }

        updates.forEach((update) => recipe[update] = req.body[update])
        await recipe.save()

        res.send(recipe)
    } catch (e) {
        res.status(400).send()
    }
})

// Delete recipe
router.delete('/recipes/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const recipe = await Recipe.findOneAndDelete({ _id, author: req.user._id })

        if (!recipe) {
            return res.status(404).send()
        }

        res.send(recipe)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router