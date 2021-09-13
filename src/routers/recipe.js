const express = require('express')
const Recipe = require('../models/recipe')
const Ingredient = require('../models/ingredient')
const auth = require('../middleware/auth')
const { findById } = require('../models/ingredient')
const { isValidObjectId } = require('mongoose')
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

// Get all recipes
router.get('/recipes', async (req, res) => {
    const { page = 1, limit = 10 } = req.query

    try {
        const recipes = await Recipe.aggregate([
            {
                $lookup: {
                    from: 'ingredients',
                    localField: "_id",
                    foreignField: "recipe",
                    as: "ingredients"
                }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: limit
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
        ])

        if (!recipes.length) {
            return res.status(404).send("Recipes not found")
        }

        res.send(recipes)
    } catch (e) {
        return res.status(500).send(e)
    }
})

// Get single recipe
router.get('/recipes/:id', auth, async (req, res) => {
    const _id = req.params.id
    console.log(_id)
    try {

        const recipe = await Recipe.findOne({ _id, author: req.user._id })
        await recipe.populate('ingredients').execPopulate()

        if (!recipe) {
            return res.status(404).send()
        }

        res.send(recipe)
    } catch (e) {
        res.status(500).send()
    }
})

// Get recipe(s) with minimum or maximum number of ingredients
router.get('/recipes/ingredients/minmax', async (req, res) => {
    const { type = "max" } = req.query
    if (!["max", "min"].includes(type)) {
        return res.status(404).send("Type must be min or max")
    }
    sort = type === "max" ? -1 : 1

    try {
        const ingr = await Ingredient.aggregate([
            {
                $group: {
                    "_id": "$recipe",
                    "count": {
                        "$sum": 1
                    }
                }
            },
            {
                "$sort": {
                    "count": sort
                }
            },
            {
                $limit: 1
            }
        ])

        const recipeID = ingr[0]._id

        const recipe = await Recipe.aggregate([
            {
                $match: { _id: recipeID }
            },
            {
                $lookup: {
                    from: 'ingredients',
                    localField: "_id",
                    foreignField: "recipe",
                    as: "ingredients"
                }
            }
        ])

        if (!recipe) {
            return res.status(404).send()
        }

        res.send(recipe)
    } catch (e) {
        res.status(500).send(e)
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

// Search recipes
router.get('/recipes/ingredients/search', auth, async (req, res) => {
    const searchText = req.body.text

    if (!searchText) {
        return res.status(400).send('Please enter a search term.')
    } else {
        try {
            let recipes = await Recipe.aggregate([
                {
                    $match: {
                        $text: {
                            $search: searchText
                        }
                    }
                },
                {
                    $project: {
                        _id: 1
                    }
                }
            ])
            recipes = recipes.map(el => el._id)

            let recipesWithIngredient = await Ingredient.aggregate([
                {
                    $match: {
                        $text: {
                            $search: searchText
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        recipe: 1
                    }
                }
            ])
            recipesWithIngredient = recipesWithIngredient.map(el => el.recipe)

            if (recipes.length !== 0 && recipesWithIngredient.length !== 0) {

                recipesWithIngredient.forEach((el) => {
                    if (!recipes.map(String).includes(String(el))) {
                        recipes.push(el)
                    }
                })
            } else if (recipesWithIngredient.length !== 0) {
                recipes = recipesWithIngredient
            } else if (recipes.length === 0 && recipesWithIngredient.length === 0) {
                return res.status(404).send("Your search didn't find any match.")
            }

            const searchResult = await Recipe.aggregate([
                {
                    $match: {
                        _id: {
                            "$in": recipes
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'ingredients',
                        localField: "_id",
                        foreignField: "recipe",
                        as: "ingredients"
                    }
                }
            ])
            return res.status(200).send(searchResult)
        } catch (e) {
            res.status(500).send()
        }
    }
})

// Delete recipe
router.delete('/recipes/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const recipe = await Recipe.findById(_id)

        if (!recipe) {
            return res.status(404).send()
        }

        await recipe.remove()

        res.send(recipe)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router