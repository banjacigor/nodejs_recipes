# Recipe App
A simple recipe App

# How to run
To run a local instance

    npm run dev

# API Usage
Here's an API overview:

|   Description  | Method | Endpoint | Body |
|:-|:-|:-|:-|
| Create user | `POST` | `/users` | [schema](/docs/schemas/createUserSchema.json) |
| Login user | `POST` | `/users/login` | [schema](/docs/schemas/userLoginSchema.json) |
| Logout user | `POST` | `/users/logout` | - |
| Logout user (all sessions) | `POST` | `/users/logoutAll` | - |
| Get user's profile | `GET` | `/users/me` | - |
| Update user's profile | `PATCH` | `/users/me` | [schema](/docs/schemas/userSchema.json) |
| Delete user | `DELETE` | `/users/me` | - |
| Create recipe | `POST` | `/recipes` | [schema](/docs/schemas/createRecipeSchema.json) |
| Get user's recipes | `GET` | `/users/me?sortBy=createdAt_desc&limit=1&skip=1` | - |
| Get all recipes | `GET` | `/recipes/me?sortBy=createdAt_desc&limit=1&skip=1` | - |
| Get recipe by ID | `GET` | `/recipes/<id>` | - |
| Get recipe with max or min number of ingredients | `GET` | `/recipes/ingredients/minmax?type=<search_type>` | - |
| Update recipe | `PATCH` | `/recipe/<id>` | [schema](/docs/updateRecipeSchema.json) |
| Search recipe | `POST` | `/recipes/ingredients/search` | [schema](/docs/searchRecipesIngredientsSchema.json) |
| Delete recipe | `DELETE` | `/recipes/<id>` | - |
| Get recipe's ingredients | `Get` | `/recipes/<id>/ingredients` | - |
| Add ingredients to recipe | `POST` | `/ingredients/<id>/add` | [schema](/docs/userSchema.json) |
| Find most used ingredients | `GET` | `/ingredients/top?n=<ingredient_number>` | - |