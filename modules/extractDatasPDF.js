/**
 * PDF extract globals
 */
const PDFExtract = require('pdf.js-extract').PDFExtract
const pdfExtract = new PDFExtract()

const pdfParser = require('pdf-parse');

/**
 * Request globals
 */
const fs = require('fs')
const request = require('request-promise-native')
const urlPdf = "https://transformation-digitale.info/media/aaoun/EDT/EDT_STRI2A_M1RT.pdf"

/**
 * Personnal globals
 */
const Semaine = require('./../classes/semaine.js')

const redNode = "\x1b[31m"
const blueNode = "\x1b[36m"
const oranNode = "\x1b[33m"
const resetNode = "\x1b[0m"

module.exports = class ExtractDatasPDF{

    static async extract(){
        try{
            let semaines = new Array()

            //On récupère la version du pdf actuel
            const prevVersion = await getVersion()
    
            await downloadPDF(urlPdf, "EDT.pdf")
            console.log(blueNode, "PDF Downloaded", resetNode)
            
            //On récupère la nouvelle version du pdf
            const lastVersion = await getVersion()
    
            await extractDatas(semaines)
            console.log(blueNode, "Datas Extracted", resetNode)
    
            //console.log(prevVersion, lastVersion)
            return {semaines: semaines, update: prevVersion != lastVersion}
        }catch(err){
            console.log(err)
        }
    }

}

async function getVersion(){
    return pdfParser(await fs.readFileSync("EDT.pdf")).then(function(data) {
        return data.info.CreationDate
    })
}

async function downloadPDF(pdfURL, outputFilename) {
    let pdfBuffer = await request.get({uri: pdfURL, encoding: null})
    fs.writeFileSync(outputFilename, pdfBuffer)
}

async function extractDatas(semaines){
    try{
        const data = await pdfExtract.extract("EDT.pdf", {})
        
        for(let i=0 ; i<1 ; i++){

            for await(const element of data.pages[i].content){
                if(element.x < 65){ //Titre d'une semaine
                    //On initialise notre semaine
                    const regex = RegExp("U[1-4]/*")
                    let debutLigne = 0
                    let semaine = new Semaine(element.str)
        
                    for await(const elem of data.pages[i].content){
                        //On reboucle pour chercher les infos utiles a notre semaine
                        if(elem.y >= element.y-1 && elem.y <= element.y+85){
                            const fontNameNum = parseInt(elem.fontName.replace(/g_d\d*_f/gi, "")) % 7

                            if(elem.x > 104 && fontNameNum == 6){ //Cours ou Lieu dans le tableau
                                
                                if(elem.y - debutLigne >= 18){ //On est passé a une nouvelle ligne
                                    if(elem.y - debutLigne >= 36 && debutLigne != 0){
                                        semaine.addJour(elem.y - 18)
                                    }
                                    semaine.addJour(elem.y)
                                    debutLigne = elem.y
                                }
        
                                if(regex.test(elem.str.slice(0,2)) || elem.str == "Amphi"){ //Ajout du lieu
                                    if(semaine.getJourEntreCoord(elem.y) && await semaine.getJourEntreCoord(elem.y).getCoursEntreCoord(elem.x, elem.y)){
                                        
                                        let coursModif = await semaine.getJourEntreCoord(elem.y).getCoursEntreCoord(elem.x, elem.y)
                                        if(coursModif.getLieu() == ""){
                                            coursModif.setLieu(elem.str)
                                            coursModif.setEndOfCase(elem.x + elem.width)
        
                                            if(coursModif.getStartCoordY()-1 < elem.y && coursModif.getStartCoordY()+1 > elem.y){ //Cours et lieu sur la meme coordY

                                                let otherCours = semaine.getJourEntreCoord(elem.y).getOtherCoursParDebut(coursModif)
                                                if(semaine.getJourEntreCoord(elem.y).getStartCoordY()+5 > coursModif.getStartCoordY()){
                                                    coursModif.setCoursIng(true)
                                                    if(otherCours){
                                                        otherCours.setCoursAlt(true)
                                                    }
                                                }else{
                                                    coursModif.setCoursAlt(true)
                                                    if(otherCours){
                                                        otherCours.setCoursIng(true)
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
                                    let dernierJour = semaine.getDernierJour()
                                    if(dernierJour.getDernierCours() && dernierJour.getDernierCours().getNextCoordX() == 1000000){
                                        dernierJour.getDernierCours().setNextCoordX(elem.x)
                                    }
                                    dernierJour.addCours(elem.str, elem.x, elem.y, elem.width, elem.height)
                                }
                            }
        
                            if(elem.x > 104 && fontNameNum == 7){ //Prof dans le tableau
                                if(semaine.getDernierJour() && semaine.getDernierJour().getCoursParDebut(elem.x)){
                                    let coursModif = semaine.getDernierJour().getCoursParDebut(elem.x)
                                    coursModif.setProf(elem.str, elem.height)
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
                    await semaines.push(semaine)
                }
            }
        }
    }catch (err){
        console.log(err)
    }
}