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
const ImportDatasCalendar = require('./modules/importDatasCalendar.js')
let semaines

const redNode = "\x1b[31m"
const blueNode = "\x1b[36m"
const oranNode = "\x1b[33m"
const resetNode = "\x1b[0m"

const urlLogoStri = "https://lh3.googleusercontent.com/proxy/VEi50kVBko8KmuuH6vLVOcns7pOwPwGe3CfKzHCrWGOH3npl-xlD-cXagNjFDy1I4oDZ6zFZO1xTpk7cKA_TY2VZLKs1"

const channelsId = {
    floTest: "747366976434864188",
    striBot: "693103241222684693",
    striEdt: "749446918823739392"
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
            .addField("Google Calendar (Agenda)", "https://calendar.google.com/calendar?cid=YTZrY2Z0aW0zbGxpa2Q1cGdsZGxxcWZtY29AZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ")
            .addField("Google Spreadsheet (BDD)", "https://docs.google.com/spreadsheets/d/1z_PGdOYQkqldGE9pzWVByTnnu2NirnkFK02AtduKInM/edit")
            .setThumbnail(urlLogoStri)
        msg.channel.send(embed)
    }else if(msg.content.toLowerCase() === "!import"){
        importMessage(msg)
    }else if(msg.content.toLowerCase() === "!daily"){
        dailyMessage()
    }
})

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
 * Cron à 22h00
 */
cron.schedule(`59 ${getHour(20)} * * *`, function() {
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
    dailyMessage()
}, {timezone: "Europe/Paris"})

async function dailyMessage(){
    const today = await getToday()
    
    if(today){
        await today.reorder()
        const cours = await today.getCours()

        let channel = await bot.channels.fetch(channelsId.striEdt)
        const fetched = await channel.messages.fetch({limit: 100})
        channel.bulkDelete(fetched).catch(err => {})

        let embed = new Discord.MessageEmbed()
            .setTitle(`Emploi du temps - ${today.getNom()}`)
            .setThumbnail(urlLogoStri)
        channel.send(embed)
        for await(cour of cours){
            if(!cour.isCoursIng()){
                channel.send(cour.getEmbedMessage())
            }
        }
    }else{
        console.log(oranNode, "Not a School Day", resetNode)
    }
}

///////////////////
//// FONCTIONS ////
///////////////////
/**
 * Récupère le jour d'aujourd'hui avec sa lite de cours
 */
async function getToday(){
    let retour
    if(!semaines){
        extract = await ExtractDatasPDF.extract()
        semaines = extract.semaines
    }
    const today = new Date()
    let annee = today.getFullYear()
    
    for await(semaine of semaines){
        let cptJour = 0
        const jours = await semaine.getJours()
        for await(jour of jours){
            if(semaine.getNumeroMois()-1 > today.getMonth() && semaine.getNumeroMois()-1 > 7 && today.getMonth <= 7){
                annee -= 1
            }
            let date = new Date(annee, semaine.getNumeroMois()-1, semaine.getNumeroPremierJourSemaine() + cptJour)
            date.addDays(cptJour)
            
            if(date.getFullYear() == today.getFullYear() && date.getMonth() == today.getMonth() && date.getDate() == today.getDate()){
                retour = jour
            }
            cptJour++
        }
    }
    return retour
}

/**
 * Récupère une heure en fonction du fuseau horaire
 * @param {*} hour L'heure a récupérer
 */
function getHour(hour){
    return hour + parseInt(moment().tz("Europe/Paris").format('Z').slice(2,3))
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
    }
}

/**
 * Login discord
 */
bot.login(process.env.BOT_TOKEN)