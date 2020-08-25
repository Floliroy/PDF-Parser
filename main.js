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
 * Google globals
 */
const Config = require('./config/settings.js');
const CalendarAPI = require('node-google-calendar');
let cal = new CalendarAPI(Config); 
const calendarId = Config.calendarId["primary"] 

/**
 * Personnal globals
 */
const Semaine = require('./classes/semaine.js')

const redNode = "\x1b[31m"
const blueNode = "\x1b[36m"
const resetNode = "\x1b[0m"

let semaines = new Array()
bot.on("ready", () => {
    console.log(`Logged in as ${bot.user.tag}!`)

    const options = {}
    
    pdfExtract.extract("EDT.pdf", options, (err, data) => {
        if (err) return console.log(err)
        data.pages[0].content.forEach(function(element){
            if(element.x < 65){ //Titre d'une semaine
                console.log(blueNode, "[|] Ajoute semaine " + element.str, resetNode)

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
                                    console.log()
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
                                console.log()
                            }
                        }
                    }
                })
                //On ajoute la semaine a notre liste de semaines
                semaines.push(semaine)
            }
           
        })
    })  

})
    
bot.on("message", msg => {
    if (msg.content === "ping") {
        msg.reply("Pong!")
        /*semaines.forEach(function(semaine){
            semaine.print()
        })*/
        let semaine = semaines[0]
        let cptJour = 0
        semaine.getJours().forEach(function(jour){
            jour.getCours().forEach(function(cours){
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
                    cal.Events.insert(calendarId, event).then(() => {
                        console.log("Insert ", cours.getTitre());
                    }).catch(err => {
                        console.log(redNode, "/!\\ WARNING - Insertion Evenement", resetNode);
                    })
                }
            })
            cptJour++
        })
    }
})

bot.login(process.env.BOT_TOKEN)