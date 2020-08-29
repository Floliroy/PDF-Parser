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
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

async function deleteGoogleCalendar(semaines){
    let dateAjd = new Date()
    let annee = dateAjd.getFullYear()
    if(semaines[0].getNumeroMois()-1 > dateAjd.getMonth() && semaines[0].getNumeroMois()-1 > 7 && dateAjd.getMonth <= 7){
        annee -= 1
    }
    let dateDebut = new Date(annee, semaines[0].getNumeroMois()-1, semaines[0].getNumeroPremierJourSemaine())

    let numeroJour = semaines[0].getNumeroPremierJourSemaine()
    numeroJour = numeroJour < 10 ? `0${numeroJour}` : numeroJour

    let params = {
        timeMin: `${annee}-${semaines[0].getNumeroMois()}-${numeroJour}T00:00:00+0${dateDebut.getTimezoneOffset()/-60}:00`,
        showDeleted: false,
        singleEvents: true,
        maxResults: 2500
    }
    
	await cal.Events.list(calendarId, params).then(async function(jsons){

        for(const json of jsons){
            if(json.description == "#Generated"){
                let redo
                do{
                    redo = false
                    await cal.Events.delete(calendarId, json.id, {})
                    .catch(err => {
                        redo = true
                        console.log(JSON.parse(err.message))
                    })
                }while(redo)
            }else if(json.description.startsWith("#NoDelete")){
                for(const semaine of semaines){
                    cours = await semaine.removeCours(json.summary, json.start.dateTime)
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

    for(const semaine of semaines){
        let cptJour = 0
        
        const jours = await semaine.getJours()
        for(const jour of jours){
            const cours = await jour.getCours()
            for(const cour of cours){
                
                if(!cour.isCoursIng()){
                    let numeroJour = semaine.getNumeroPremierJourSemaine() + cptJour

                    if(semaine.getNumeroMois()-1 > dateAjd.getMonth() && semaine.getNumeroMois()-1 > 7 && dateAjd.getMonth <= 7){
                        annee -= 1
                    }
                    let date = new Date(annee, semaine.getNumeroMois()-1, numeroJour)
                    date.addDays(cptJour)

                    let month = date.getMonth()+1 < 10 ? `0${date.getMonth()+1}` : date.getMonth()+1
                    let day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()

                    let event = {
                        "summary": `${cour.getTitre()}${cour.getProf() ? " - " + cour.getProf() : ""}`,
                        "description": "#Generated",
                        "location": cour.getLieu(),
                        "start": {"dateTime": `${annee}-${month}-${day}T${cour.getHeureDebut()}:00+0${date.getTimezoneOffset()/-60}:00`},
                        "end": {"dateTime": `${annee}-${month}-${day}T${cour.getHeureFin()}:00+0${date.getTimezoneOffset()/-60}:00`}
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
            cptJour++
        }
    }
}