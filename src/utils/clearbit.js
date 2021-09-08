require('dotenv').config()
const clearbit = require('clearbit')(process.env.CLEARBIT_SECRET_KEY)

async function clearbitFunction(email) {
    try {
        const person = await clearbit.Enrichment.find({ email: email })
        return person.person.employment.title
    } catch (e) {
        console.log('Resource not found')
    }
}

module.exports = clearbitFunction