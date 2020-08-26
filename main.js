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

bot.on("ready", () => {
    console.log(`Logged in as ${bot.user.tag}!`)
    extractDatas()
})

async function deleteGoogleCalendar(){
    let semaine = semaines[0]
    let numeroJour = semaine.getNumeroPremierJourSemaine()
    numeroJour = numeroJour < 10 ? `0${numeroJour}` : numeroJour
    let params = {
        timeMin: `2020-${semaine.getNumeroMois()}-${numeroJour}T00:00:00+02:00`,
        maxResults: 1000
    }
    
	await cal.Events.list(calendarId, params).then(json => {
        json.forEach(async function(json){
            if(!json.summary.startsWith("Rendre ")){
                await cal.Events.delete(calendarId, json.id, {})
            }
        })
    }).catch(err => {
        console.log(redNode, "/!\\ WARNING - Delete Evenement", resetNode)
        console.log(err)
    })
}
async function insertGoogleCalendar(){
    let semaine = semaines[0]
    let cptJour = 0
    await semaine.getJours().forEach(function(jour){
        jour.getCours().forEach(async function(cours){
            if(!cours.isCoursIng()){
                let numeroJour = semaine.getNumeroPremierJourSemaine() + cptJour
                numeroJour = numeroJour < 10 ? `0${numeroJour}` : numeroJour

                let event = {
                    "summary": cours.getTitre(),
                    "description": cours.getProf(),
                    "location": cours.getLieu(),
                    "start": {"dateTime": `2020-${semaine.getNumeroMois()}-${numeroJour}T${cours.getHeureDebut()}:00+02:00`},
                    "end": {"dateTime": `2020-${semaine.getNumeroMois()}-${numeroJour}T${cours.getHeureFin()}:00+02:00`}
                }
                await cal.Events.insert(calendarId, event).catch(err => {
                    console.log(redNode, "/!\\ WARNING - Insertion Evenement", resetNode)
                })
            }
        })
        cptJour++
    })
}

async function updateGoogleCalendar(){
    try{
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
        /*semaines.forEach(function(semaine){
            semaine.print()
        })*/
        updateGoogleCalendar()
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

    await downloadPDF(urlPdf, "EDT.pdf")
    console.log(blueNode, "PDF Downloaded", resetNode)

    pdfExtract.extract("EDT.pdf", {}, (err, data) => {
        if (err) return console.log(err)
        //console.log(data.meta.info.CreationDate, "\n")

        data.pages[0].content.forEach(function(element){
            if(element.x < 65){ //Titre d'une semaine
                //On initialise notre semaine
                const regex = RegExp("U[1-4]/*")
                let debutLigne = 0
                let semaine = new Semaine(element.str)
                data.pages[0].content.forEach(function(elem){
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
                                    coursModif.setLieu(elem.str)
                                    coursModif.setEndOfCase(elem.width > 14 ? elem.x + elem.width : elem.x + elem.width/2 + 19)

                                    if(coursModif.getStartCoordY()-1 < elem.y && coursModif.getStartCoordY()+1 > elem.y){ //Cours et lieu sur la meme coordY
                                        if(semaine.getJourEntreCoord(elem.y).getStartCoordY()+5 > coursModif.getStartCoordY()){
                                            coursModif.setCoursIng(true)
                                        }else{
                                            coursModif.setCoursAlt(true)
                                        }
                                    }
                                }else{
                                    console.log(redNode, "/!\\ WARNING - Lieu : " + elem.str, resetNode)
                                    console.log(elem)
                                }

                            }else{ //Création du cours
                                if(semaine.getDernierJour().getDernierCours()){
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
                })
                //On ajoute la semaine a notre liste de semaines
                semaines.push(semaine)
            }
           
        })
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