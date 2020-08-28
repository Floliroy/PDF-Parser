require('dotenv').config()

/**
 * Discord globals
 */
const Discord = require('discord.js')
const bot = new Discord.Client()

/**
 * PDF extract globals
 */
const PDFExtract = require('pdf.js-extract').PDFExtract
const pdfExtract = new PDFExtract()

/**
 * Request globals
 */
const fs = require("fs")
const request = require("request-promise-native")
const urlPdf ="https://transformation-digitale.info/media/aaoun/EDT/EDT_STRI2A_M1RT.pdf"

/**
 * Google globals
 */
const Config = require('./config/settings.js')
const CalendarAPI = require('node-google-calendar')
let cal = new CalendarAPI(Config)
const calendarId = Config.calendarId["primary"] 

/**
 * Personnal globals
 */
const Semaine = require('./classes/semaine.js')

let semaines

const redNode = "\x1b[31m"
const blueNode = "\x1b[36m"
const resetNode = "\x1b[0m"

/**
 * Ajoute des jours a la date
 */
Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

/**
 * Quand le bot démarre
 */
bot.on("ready", () => {
    console.log(`Logged in as ${bot.user.tag}!`)
    extractDatas()
})

async function deleteGoogleCalendar(){
    let numeroJour = semaines[0].getNumeroPremierJourSemaine()
    numeroJour = numeroJour < 10 ? `0${numeroJour}` : numeroJour
    let params = {
        timeMin: `2020-${semaines[0].getNumeroMois()}-${numeroJour}T00:00:00+02:00`,
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
            }
        }
    }).catch(err => {
        console.log(redNode, "/!\\ WARNING - Delete Evenement", resetNode)
        console.log(err)
    })
}
async function insertGoogleCalendar(){
    for(const semaine of semaines){
        let cptJour = 0
        
        const jours = await semaine.getJours()
        for(const jour of jours){
            const cours = await jour.getCours()
            for(const cour of cours){
                if(!cour.isCoursIng()){
                    let numeroJour = semaine.getNumeroPremierJourSemaine() + cptJour

                    let date = new Date(2020, semaine.getNumeroMois()-1, numeroJour)
                    date.addDays(cptJour)

                    let month = date.getMonth()+1 < 10 ? `0${date.getMonth()+1}` : date.getMonth()+1
                    let day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()

                    let event = {
                        "summary": `${cour.getTitre()}${cour.getProf() ? " - " + cour.getProf() : ""}`,
                        "description": "#Generated",
                        "location": cour.getLieu(),
                        "start": {"dateTime": `2020-${month}-${day}T${cour.getHeureDebut()}:00+02:00`},
                        "end": {"dateTime": `2020-${month}-${day}T${cour.getHeureFin()}:00+02:00`}
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

async function updateGoogleCalendar(){
    try{
        console.log(blueNode, "Start Update Calendar", resetNode)
        await deleteGoogleCalendar()
        console.log(blueNode, "Events Deleted", resetNode)
        await insertGoogleCalendar()
        console.log(blueNode, "Events Updated", resetNode)
    }catch(err){
        console.log(err)
    }
}

bot.on("message", msg => {
    if (msg.content === "ping") {
        msg.reply("Pong!")
        updateGoogleCalendar()
        /*for(const semaine of semaines){
            semaine.print()
        }*/
    }
})

///////////////////////////////
//// EXTRACTION DE DONNEES ////
///////////////////////////////
async function downloadPDF(pdfURL, outputFilename) {
    let pdfBuffer = await request.get({uri: pdfURL, encoding: null})
    fs.writeFileSync(outputFilename, pdfBuffer)
}

async function downloadAndCollectDatas(){
    semaines = new Array()

    /*let lastCreationPDF
    pdfExtract.extract("EDT.pdf", {}, (err, data) => {
        if (err) return console.log(err)
        lastCreationPDF = data.meta.info.CreationDate
    })*/

    await downloadPDF(urlPdf, "EDT.pdf")
    console.log(blueNode, "PDF Downloaded", resetNode)

    pdfExtract.extract("EDT.pdf", {}, (err, data) => {
        if (err) return console.log(err)
        /*if(lastCreationPDF != data.meta.info.CreationDate){
            console.log(blueNode, "Need to Reload Datas", resetNode)
        }else{
            console.log(blueNode, "Datas Up to Date", resetNode)
        }*/

        for(const element of data.pages[0].content){
            if(element.x < 65){ //Titre d'une semaine
                //On initialise notre semaine
                const regex = RegExp("U[1-4]/*")
                let debutLigne = 0
                let semaine = new Semaine(element.str)
                for(const elem of data.pages[0].content){
                    //On reboucle pour chercher les infos utiles a notre semaine
                    if(elem.y >= element.y-1 && elem.y <= element.y+85){
                        if(elem.x > 104 && elem.fontName == "g_d0_f6"){ //Cours ou Lieu dans le tableau

                            if(elem.y - debutLigne >= 18){ //On est passé a une nouvelle ligne
                                semaine.addJour(elem.y)
                                debutLigne = elem.y
                            }

                            if(regex.test(elem.str.slice(0,2)) || elem.str == "Amphi"){ //Ajout du lieu
                                if(semaine.getJourEntreCoord(elem.y) && semaine.getJourEntreCoord(elem.y).getCoursEntreCoord(elem.x, elem.y)){
                                    let coursModif = semaine.getJourEntreCoord(elem.y).getCoursEntreCoord(elem.x, elem.y)
                                    if(coursModif.getLieu() == ""){
                                        coursModif.setLieu(elem.str)
                                        coursModif.setEndOfCase(elem.x + elem.width)
    
                                        if(coursModif.getStartCoordY()-1 < elem.y && coursModif.getStartCoordY()+1 > elem.y){ //Cours et lieu sur la meme coordY
                                            if(semaine.getJourEntreCoord(elem.y).getStartCoordY()+5 > coursModif.getStartCoordY()){
                                                coursModif.setCoursIng(true)
                                                if(semaine.getJourEntreCoord(elem.y).getOtherCoursParDebut(coursModif)){
                                                    semaine.getJourEntreCoord(elem.y).getOtherCoursParDebut(coursModif).setCoursAlt(true)
                                                }
                                            }else{
                                                coursModif.setCoursAlt(true)
                                                if(semaine.getJourEntreCoord(elem.y).getOtherCoursParDebut(coursModif)){
                                                    semaine.getJourEntreCoord(elem.y).getOtherCoursParDebut(coursModif).setCoursIng(true)
                                                }
                                            }
                                        }
                                    }else{
                                        console.log(redNode, "/!\\ WARNING - Lieu : " + elem.str, resetNode)
                                        console.log(elem)
                                    }
                                }else{
                                    console.log(redNode, "/!\\ WARNING - Lieu : " + elem.str, resetNode)
                                    console.log(elem)
                                }

                            }else{ //Création du cours
                                if(semaine.getDernierJour().getDernierCours() && semaine.getDernierJour().getDernierCours().getNextCoordX() == 1000000){
                                    semaine.getDernierJour().getDernierCours().setNextCoordX(elem.x)
                                }
                                semaine.getDernierJour().addCours(elem.str, elem.x, elem.y, elem.width, elem.height)
                            }
                        }

                        if(elem.x > 104 && elem.fontName == "g_d0_f7"){ //Prof dans le tableau
                            if(semaine.getDernierJour() && semaine.getDernierJour().getCoursParDebut(elem.x)){
                                let coursModif = semaine.getDernierJour().getCoursParDebut(elem.x)
                                coursModif.setProf(elem.str)
                                coursModif.setCoursIng(false)
                                coursModif.setCoursAlt(false)
                            }else{
                                console.log(redNode, "/!\\ WARNING - Prof : " + elem.str, resetNode)
                                console.log(elem)
                            }
                        }
                    }
                }
                //On ajoute la semaine a notre liste de semaines
                semaines.push(semaine)
            }
           
        }
    })
}

async function extractDatas(){
    await downloadAndCollectDatas()
    console.log(blueNode, "Datas Extracted", resetNode)
}

//////////////////////
//// LOGIN DU BOT ////
//////////////////////
bot.login(process.env.BOT_TOKEN)