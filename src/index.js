const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const recipeRouter = require('./routers/recipe')
const ingredientRouter = require('./routers/ingredient')

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(userRouter)
app.use(recipeRouter)
app.use(ingredientRouter)


app.listen(port, () => {
    console.log('Server is up and running on port ' + port)
})

