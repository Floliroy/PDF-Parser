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
let moment = require('moment-timezone')

/**
 * Personnal globals
 */
const ExtractDatasPDF = require('./modules/extractDatasPDF.js')
const ExtractDatasCalendar = require('./modules/extractDatasCalendar.js')
const ImportDatasCalendar = require('./modules/importDatasCalendar.js')
let semaines

const redNode = "\x1b[31m"
const blueNode = "\x1b[36m"
const oranNode = "\x1b[33m"
const resetNode = "\x1b[0m"

const urlLogoStri = "https://i.ibb.co/SBwvsWk/unnamed.png"

const channelsId = {
    floTest: "747366976434864188",
    striBot: "693103241222684693",
    striEdt: "749446918823739392",
    striInfo:"747515620660084947"
}

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
    if(msg.channel.id != channelsId.floTest && msg.channel.id != channelsId.striBot) return

    if (msg.content === "!ping") {
        msg.reply("Pong!")
    }else if(msg.content.toLowerCase() === "!help"){
        let embed = new Discord.MessageEmbed()
            .setTitle("PDF-Parser Bot")
            .setAuthor("Floliroy", "https://avatars2.githubusercontent.com/u/45274794", "https://github.com/Floliroy/PDF-Parser")
            .setDescription("Le bot ne permet pour le moment que de parser l'emploi du temps pour les alternants.\n\n"
                + "Le lien de l'agenda permet de l'ajouter sur votre compte google.\n"
                + "La BDD permet de définir une plage de jours 'ignorés' tel que les jours en entreprise, merci de ne pas laisser de ligne vide entre deux lignes dans cette BDD.")
            .addField("Google Calendar (Agenda)", "https://calendar.google.com/calendar?cid=amdmNmc5YW04OXUydmo5MzgyNGNrOTRqODhAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ")
            .addField("Google Spreadsheet (BDD)", "https://docs.google.com/spreadsheets/d/1z_PGdOYQkqldGE9pzWVByTnnu2NirnkFK02AtduKInM/edit")
            .setThumbnail(urlLogoStri)
        msg.channel.send(embed)
    }else if(msg.content.toLowerCase() === "!import"){
        importMessage(msg)
    }else if(msg.content.toLowerCase() === "!daily"){
        ExtractDatasCalendar.dailyMessage(bot)
    }
})

/**
 * Cron à 22h00
 */
cron.schedule(`0 ${getHour(22)} * * *`, function() {
    console.log(oranNode, "Cron 22h00 Started", resetNode)
    extractAndImport(false)
}, {timezone: "Europe/Paris"})
/**
 * Cron à 06h00
 */
cron.schedule(`0 ${getHour(6)} * * *`, function() {
    console.log(oranNode, "Cron 06h00 Started", resetNode)
    extractAndImport(false)
}, {timezone: "Europe/Paris"})
/**
 * Cron à 07h00
 */
cron.schedule(`0 ${getHour(7)} * * *`, function() {
    console.log(oranNode, "Cron 07h00 Started", resetNode)
    ExtractDatasCalendar.dailyMessage(bot)
}, {timezone: "Europe/Paris"})



///////////////////
//// FONCTIONS ////
///////////////////
/**
 * Récupère une heure en fonction du fuseau horaire
 * @param {*} hour L'heure a récupérer
 */
function getHour(hour){
    return hour - parseInt(moment().tz("Europe/Paris").format('Z').slice(2,3)) + 1
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
        await ImportDatasCalendar.import(semaines)
        if(!force){
            const texte = "L'emploi du temps a été mis à jour sur le Google Agenda !"
            let channel = await bot.channels.fetch(channelsId.striInfo)
            await channel.messages.fetch({limit: 100}).then(async function(messages){
                for await(let message of messages.array()){
                    if(message.content == texte){
                        message.delete()
                    }
                }
            })
            channel.send(texte)
        }
    }
}

/**
 * Fonction affichant l'état de l'import forcé
 * @param {*} msg Le message déclenchant la fonction
 */
async function importMessage(msg){
    let embed = new Discord.MessageEmbed()
        .setTitle("Importation")
        .addField("Demande", (msg.member.nickname ? msg.member.nickname : msg.author.username), true)
        .addField("Status", "En Cours", true)
        .setThumbnail(urlLogoStri)
    let messageEmbed = await msg.channel.send(embed)

    embed = new Discord.MessageEmbed()
        .setTitle("Importation")
        .addField("Demande", (msg.member.nickname ? msg.member.nickname : msg.author.username), true)
        .setThumbnail(urlLogoStri)

    await extractAndImport(true)
        .then(() => {
            embed.addField("Status", "Terminé", true)
        })
        .catch(err => {
            embed.addField("Status", "Erreur", true)
            console.log(err)
        })

    messageEmbed.edit(embed)
}

/**
 * Login discord
 */
bot.login(process.env.BOT_TOKEN)