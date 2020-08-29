require('dotenv').config()

/**
 * Discord globals
 */
const Discord = require('discord.js')
const bot = new Discord.Client()

/**
 * Cron globals
 */
const cron = require('node-cron')

/**
 * Personnal globals
 */
const ExtractDatasPDF = require('./modules/extractDatasPDF.js')
const ImportDatasCalendar = require('./modules/importDatasCalendar.js')
let semaines
const date = new Date()

const redNode = "\x1b[31m"
const blueNode = "\x1b[36m"
const oranNode = "\x1b[33m"
const resetNode = "\x1b[0m"

///////////////////
//// LISTENERS ////
///////////////////
/**
 * Quand le bot démarre
 */
bot.on("ready", () => {
    console.log(`Logged in as ${bot.user.tag}!`)   
})

/**
 * Quand le bot recois un message
 */
bot.on("message", msg => {
    if (msg.content === "!ping") {
        msg.reply("Pong!")
    }else if(msg.content === "!import"){
        extractAndImport(true)
        msg.delete()
    }
})

/**
 * Cron à 22h00
 */
cron.schedule(`0 ${getHour(22)} * * *`, function() {
    extractAndImport(false)
}, {timezone: "Europe/Paris"})
/**
 * Cron à 06h00
 */
cron.schedule(`0 ${getHour(6)} * * *`, function() {
    console.log(oranNode, "Cron 06h00 Started", resetNode)
    extractAndImport(false)
}, {timezone: "Europe/Paris"})

///////////////////
//// FONCTIONS ////
///////////////////
/**
 * Envoi un message privé sur discord
 * @param {*} member Le destinataire
 * @param {*} message Le message
 */
function sendPrivateMessage(member, message){
    member.createDM().then((DMChannel) => {
        DMChannel.send(message)
    })
}

/**
 * Récupère une heure en fonction du fuseau horaire
 * @param {*} hour L'heure a récupérer
 */
function getHour(hour){
    return hour + date.getTimezoneOffset()/60 + 1
}

/**
 * Extrait les données du PDF pour les import dans le Google Agenda
 * @param {*} force Si ont doit forcer l'import meme s'il n'est pas nécessaire
 */
async function extractAndImport(force){
    retour = await ExtractDatasPDF.extract()
    semaines = retour.semaines
    update = retour.update

    console.log(" Update needed:", update)
    if(update || force){
        ImportDatasCalendar.import(semaines)
    }
}

/**
 * Login discord
 */
bot.login(process.env.BOT_TOKEN)