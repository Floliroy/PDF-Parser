require('dotenv').config()

/**
 * Discord globals
 */
const Discord = require('discord.js')
const bot = new Discord.Client()

/**
 * Personnal globals
 */
const ExtractDatasPDF = require('./modules/extractDatasPDF.js')
const ImportDatasCalendar = require('./modules/importDatasCalendar.js')
let semaines

/**
 * Quand le bot démarre
 */
bot.on("ready", async () => {
    console.log(`Logged in as ${bot.user.tag}!`)

    retour = await ExtractDatasPDF.extract()
    semaines = retour.semaines
    update = retour.update

    semaines[0].print()
    console.log("Update", update)
})

bot.on("message", msg => {
    if (msg.content === "ping") {
        msg.reply("Pong!")
        ImportDatasCalendar.import(semaines)
    }
})

bot.login(process.env.BOT_TOKEN)