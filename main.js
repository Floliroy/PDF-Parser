require('dotenv').config()

const Discord = require('discord.js')
const bot = new Discord.Client()

const PDFExtract = require('pdf.js-extract').PDFExtract
const pdfExtract = new PDFExtract()

const Semaine = require('./classes/semaine.js')

const redNode = "\x1b[31m"
const blueNode = "\x1b[36m"
const resetNode = "\x1b[0m"

let semaines = new Array()
bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`)

    const options = {}
    
    pdfExtract.extract('EDT.pdf', options, (err, data) => {
        if (err) return console.log(err)
        data.pages[0].content.forEach(function(element){
            if(element.x < 65){ //Titre d'une semaine
                console.log(blueNode, "[|] Ajoute semaine " + element.str, resetNode)

                const regex = RegExp("U[1-4]/*")
                let debutLigne = 0
                let semaine = new Semaine(element.str)
                data.pages[0].content.forEach(function(elem){
                    if(elem.y >= element.y-1 && elem.y <= element.y+85){
                        if(elem.x > 104 && elem.fontName == "g_d0_f6"){ //Cours ou Lieu dans le tableau
                            if(elem.y - debutLigne >= 18){
                                semaine.addJour(elem.y)
                                debutLigne = elem.y
                            }

                            if(regex.test(elem.str.slice(0,2)) || elem.str == "Amphi"){ //Ajout du lieu
                                if(semaine.getJourEntreCoord(elem.y) && semaine.getJourEntreCoord(elem.y).getCoursEntreCoord(elem.x)){
                                    semaine.getJourEntreCoord(elem.y).getCoursEntreCoord(elem.x).setLieu(elem.str)
                                    let endOfCase = elem.width > 14 ? elem.x + elem.width : elem.x + elem.width/2 + 19
                                    semaine.getJourEntreCoord(elem.y).getCoursEntreCoord(elem.x).setEndOfCase(endOfCase)
                                    /*console.log(`Modif Cours : ${semaine.getJourEntreCoord(elem.y).getCoursEntreCoord(elem.x).getTitre()} `
                                        + `-> Ajoute Lieu : ${semaine.getJourEntreCoord(elem.y).getCoursEntreCoord(elem.x).getLieu()}`)*/
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
                                /*console.log(`New Cours : '${semaine.getDernierJour().getDernierCours().getTitre()}'`)*/
                            }
                        }

                        if(elem.x > 104 && elem.fontName == "g_d0_f7"){ //Prof dans le tableau
                            if(semaine.getDernierJour() && semaine.getDernierJour().getCoursParDebut(elem.x)){
                                semaine.getDernierJour().getCoursParDebut(elem.x).setProf(elem.str)
                                /*console.log(`Modif Cours : ${semaine.getDernierJour().getCoursParDebut(elem.x).getTitre()} `
                                    + `-> Ajoute Prof : ${semaine.getDernierJour().getCoursParDebut(elem.x).getProf()}`)*/
                            }else{
                                console.log(redNode, "/!\\ WARNING - Prof : " + elem.str, resetNode)
                                console.log(elem)
                                console.log()
                            }
                        }
                    }
                })
                semaines.push(semaine)
            }
           
        })
    })  

})

bot.on('message', msg => {
    if (msg.content === 'ping') {
        msg.reply('Pong!')
        semaines.forEach(function(semaine){
            semaine.print()
        })
    }
})

bot.login(process.env.BOT_TOKEN)