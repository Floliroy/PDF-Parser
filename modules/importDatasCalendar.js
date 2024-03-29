require('dotenv').config()

/**
 * Google globals
 */
const Config = require('./../config/settings.js')
const CalendarAPI = require('node-google-calendar')
let cal = new CalendarAPI(Config)
const calendarId = Config.calendarId["primary"] 

const { GoogleSpreadsheet } = require('google-spreadsheet')
const spreadsheetId = "1z_PGdOYQkqldGE9pzWVByTnnu2NirnkFK02AtduKInM"
const doc = new GoogleSpreadsheet(spreadsheetId)

/**
 * Personnal globals
 */
let moment = require('moment-timezone')

const redNode = "\x1b[31m"
const blueNode = "\x1b[36m"
const oranNode = "\x1b[33m"
const resetNode = "\x1b[0m"

module.exports = class ImportDatasCalendar{

    static async import(semaines){
        try{
            console.log(blueNode, "Start Importation", resetNode)

            await deleteGoogleCalendar(semaines)
            console.log(blueNode, "Events Deleted", resetNode)

            await insertGoogleCalendar(semaines)
            console.log(blueNode, "Events Updated", resetNode)
        }catch(err){
            console.log(err)
        }
    }

}

/**
 * Ajoute des jours a la date
 */
Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf())
    date.setDate(date.getDate() + days)
    return date
}

/**
 * Vérifie si la date est dans une période blacklistée
 */
Date.prototype.isBetween = async function(ignorePeriods){
    let retour = false

    var date = new Date(this.valueOf())
    for(const period of ignorePeriods){
        if(period.dateDebut-date < 0 && period.dateFin-date > 0){
            retour = true
        }
    }
    return retour
}

async function deleteGoogleCalendar(semaines){
    let dateAjd = new Date()
    let annee = dateAjd.getFullYear()
    if(semaines[0].getNumeroMois()-1 > dateAjd.getMonth()){
        annee -= 1
    }

    let numeroJour = semaines[0].getNumeroPremierJourSemaine()
    numeroJour = numeroJour < 10 ? `0${numeroJour}` : numeroJour

    let params = {
        timeMin: `${annee}-${semaines[0].getNumeroMois()}-${numeroJour}T00:00:00${moment().tz("Europe/Paris").format('Z')}`,
        showDeleted: false,
        singleEvents: true,
        maxResults: 2500
    }
    
	await cal.Events.list(calendarId, params).then(async function(jsons){

        for(const json of jsons){
            if(json.description && json.description == "#Generated"){
                let redo
                do{
                    redo = false
                    await cal.Events.delete(calendarId, json.id, {})
                    .catch(err => {
                        redo = true
                        console.log(JSON.parse(err.message))
                    })
                }while(redo)
            }else if(json.description && json.description.startsWith("#NoDelete")){
                for(const semaine of semaines){
                    await semaine.removeCours(json.summary, json.start.dateTime)
                }
            }
        }
    }).catch(err => {
        console.log(redNode, "/!\\ WARNING - Delete Evenement", resetNode)
        console.log(err)
    })
}

async function insertGoogleCalendar(semaines){
    let dateAjd = new Date()
    let annee = dateAjd.getFullYear()

    const ignorePeriods = await getIgnorePeriods()

    for(const semaine of semaines){
        let cptJour = 0
        
        const jours = await semaine.getJours()
        for(const jour of jours){
            const cours = await jour.getCours()
            for(const cour of cours){
                
                if(!cour.isCoursIng()){

                    if(semaine.getNumeroMois()-1 < dateAjd.getMonth() && annee == dateAjd.getFullYear()){
                        annee += 1
                    }
                    let date = new Date(annee, semaine.getNumeroMois()-1, semaine.getNumeroPremierJourSemaine() + cptJour, 
                                        cour.getHeureDebut().slice(0,2), cour.getHeureDebut().slice(-2))
                    date.addDays(cptJour)

                    const isBetween = await date.isBetween(ignorePeriods)
                    if(!isBetween){
                        let month = date.getMonth()+1 < 10 ? `0${date.getMonth()+1}` : date.getMonth()+1
                        let day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
    
                        let event = {
                            "summary": `${cour.getTitre()}${cour.getProf() ? " - " + cour.getProf() : ""}`,
                            "description": "#Generated",
                            "location": cour.getLieu(),
                            "start": {"dateTime": `${annee}-${month}-${day}T${cour.getHeureDebut()}:00${moment().tz("Europe/Paris").format('Z')}`},
                            "end": {"dateTime": `${annee}-${month}-${day}T${cour.getHeureFin()}:00${moment().tz("Europe/Paris").format('Z')}`}
                        }
    
                        let redo
                        do{
                            redo = false
                            await cal.Events.insert(calendarId, event)
                            .catch(err => {
                                redo = true
                                console.log(event, JSON.parse(err.message))
                            })
                        }while(redo)
                    }
                }
            }
            cptJour++
        }
    }
}

async function getIgnorePeriods(){
    let retour = new Array()

    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_EMAIL,
        private_key: process.env.GOOGLE_TOKEN.replace(/\\n/g, '\n')
    })
    await doc.loadInfo()

    //doc.sheetsById[id] si jamais on aggrandi la BDD
    const sheet = doc.sheetsByIndex[0]
    const rows = await sheet.getRows()

    for(const row of rows){
        const dateDebut = new Date( row.Date_Debut.slice(-4), 
                                    parseInt(row.Date_Debut.slice(3, 5))-1,
                                    row.Date_Debut.slice(0, 2),
                                    3, 0)
        const dateFin = new Date(   row.Date_Fin.slice(-4), 
                                    parseInt(row.Date_Fin.slice(3, 5))-1,
                                    row.Date_Fin.slice(0, 2),
                                    21, 0)
        retour.push({dateDebut: dateDebut, dateFin: dateFin})
    }
    return retour
}