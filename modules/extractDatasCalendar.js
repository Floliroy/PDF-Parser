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
const urlLogoStri = "https://lh3.googleusercontent.com/proxy/VEi50kVBko8KmuuH6vLVOcns7pOwPwGe3CfKzHCrWGOH3npl-xlD-cXagNjFDy1I4oDZ6zFZO1xTpk7cKA_TY2VZLKs1"

const channelsId = {
    floTest: "747366976434864188",
    striBot: "693103241222684693",
    striEdt: "749446918823739392"
}

module.exports = class ExtractDatasCalendar{

    static async dailyMessage(bot){
        const today = new Date()
        
        if(today.getDay() > 5){
            const cours = await getTodayCours()
    
            let channel = await bot.channels.fetch(channelsId.striEdt)
            const fetched = await channel.messages.fetch({limit: 100})
            channel.bulkDelete(fetched).catch(err => {})
    
            let embed = new Discord.MessageEmbed()
                .setTitle(`Emploi du temps - ${listeJours[today.getDay()-1]}`)
                .setThumbnail(urlLogoStri)
            for await(cour of cours){   
                const heureDebut = getFormatedTime(new Date(cour.start.dateTime))
                const heureFin = getFormatedTime(new Date(cour.end.dateTime))
                embed.addField(`${heureDebut} - ${heureFin} ${cour.location?`(${cour.location})`:""}`, json.summary)
            }
            channel.send(embed)
        }else{
            console.log(oranNode, "Not a School Day", resetNode)
        }
    }

} 

function getFormatedTime(date){
    let heureDebut = date.getHours() - parseInt(moment().tz("Europe/Paris").format('Z').slice(2,3))
    let minuteDebut = date.getMinutes()
    heureDebut = heureDebut < 10 ? `0${heureDebut}` : heureDebut
    minuteDebut = minuteDebut < 10 ? `0${minuteDebut}` : minuteDebut

    return `${heureDebut}:${minuteDebut}`
}

async function getTodayCours(){
    let cours = new Array()

    const date = new Date()
    let params = {
        timeMin: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}T02:00:00${moment().tz("Europe/Paris").format('Z')}`,
        timeMax: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}T22:00:00${moment().tz("Europe/Paris").format('Z')}`,
        showDeleted: false,
        singleEvents: true
    }
    await cal.Events.list(calendarId, params).then(async function(jsons){
        for await(const json of jsons){
            if(json.description == "#Generated" || json.description.startsWith("#NoDelete")){
                cours.push(json)
            }
        }
    }).catch(err => {
        console.log(redNode, "/!\\ WARNING - Import Evenement", resetNode)
        console.log(err)
    })

    return cours
}