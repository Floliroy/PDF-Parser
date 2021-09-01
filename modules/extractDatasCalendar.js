require('dotenv').config()

/**
 * Discord globals
 */
const Discord = require('discord.js')

/**
 * Google globals
 */
const Config = require('./../config/settings.js')
const CalendarAPI = require('node-google-calendar')
let cal = new CalendarAPI(Config)
const calendarId = Config.calendarId["primary"] 

/**
 * Personnal globals
 */
let moment = require('moment-timezone')

const redNode = "\x1b[31m"
const blueNode = "\x1b[36m"
const oranNode = "\x1b[33m"
const resetNode = "\x1b[0m"

const listeJours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]
const urlLogoStri = "https://i.ibb.co/SBwvsWk/unnamed.png"

const channelsId = {
    floTest: "747366976434864188",
    striBot: "693103241222684693",
    striEdt: "749446918823739392",
    striInfo:"747515620660084947"
}

module.exports = class ExtractDatasCalendar{

    static async dailyMessage(bot){
        const today = new Date()
        
        if(today.getDay() <= 5){
            const cours = getTodayCours()
            if(cours.length > 0){
                let channel = await bot.channels.fetch(channelsId.striEdt)
                const fetched = await channel.messages.fetch({limit: 100})
                channel.bulkDelete(fetched).catch()
        
                let embed = new Discord.MessageEmbed()
                    .setTitle(`Emploi du temps - ${listeJours[today.getDay()-1]}`)
                    .setThumbnail(urlLogoStri)
                for await(const cour of cours){  
                    if(!cour.summary.toLowerCase().includes("uniquement") && !cour.summary.toLowerCase().includes("annul")){
                        embed.addField("\u200B","\u200B", true)
                        const heureDebut = getFormatedTime(new Date(cour.start.dateTime))
                        const heureFin = getFormatedTime(new Date(cour.end.dateTime))
                        const location = cour.location? `(${cour.location})` :""
                        embed.addField(`${heureDebut} - ${heureFin}`, `${cour.summary} ${location}\n`)
                    }
                }
                channel.send(embed)
            }
        }else{
            console.log(oranNode, "Not a School Day", resetNode)
        }
    }

} 

function getFormatedTime(date){
    let heureDebut = getFormatedTwoDigit(date.getHours() + parseInt(moment().tz("Europe/Paris").format('Z').slice(2,3)))
    let minuteDebut = getFormatedTwoDigit(date.getMinutes())

    return `${heureDebut}:${minuteDebut}`
}

function getFormatedTwoDigit(number){
    return number < 10 ? `0${number}` : number
}

/**
 * Ajoute des jours a la date
 */
Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf())
    date.setDate(date.getDate() + days)
    return date
}

async function getTodayCours(){
    let cours = new Array()

    const date = new Date()
    const tomorrow = await date.addDays(1)

    let params = {
        timeMin: `${date.getFullYear()}-${getFormatedTwoDigit(date.getMonth()+1)}-${getFormatedTwoDigit(date.getDate())}T00:00:00${moment().tz("Europe/Paris").format('Z')}`,
        timeMax: `${tomorrow.getFullYear()}-${getFormatedTwoDigit(tomorrow.getMonth()+1)}-${getFormatedTwoDigit(tomorrow.getDate())}T00:00:00${moment().tz("Europe/Paris").format('Z')}`,
        showDeleted: false,
        singleEvents: true,
		orderBy: 'startTime'
    }

    await cal.Events.list(calendarId, params).then(async function(jsons){
        for await(const json of jsons){
            if(json.description && (json.description == "#Generated" || json.description.startsWith("#NoDelete"))){
                cours.push(json)
            }
        }
    }).catch(err => {
        console.log(redNode, "/!\\ WARNING - Import Evenement", resetNode)
        console.log(err)
    })

    return cours
}