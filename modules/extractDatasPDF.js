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
const urlPdf = "https://stri.fr/Gestion_STRI/TAV/M2/EDT_STRI3A_M2STRI.pdf"

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
            const prevVersion = getVersion()
    
            await downloadPDF(urlPdf, "EDT.pdf")
            console.log(blueNode, "PDF Downloaded", resetNode)
            
            //On récupère la nouvelle version du pdf
            const lastVersion = getVersion()

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
            let elements = data.pages[i].content
            elements = elements.sort(function(a, b){
                return a.x - b.x
            })
            elements = elements.sort(function(a, b){
                return a.y - b.y
            })

            for await(const element of elements){
                if(element.x < 65){ //Titre d'une semaine
                    //On initialise notre semaine
                    const regex = RegExp("U[1-4]/*")
                    let debutLigne = 0
                    let semaine = new Semaine(element.str)
                    
                    let elemWarning = new Array()
                    for await(const elem of elements){
                        //On reboucle pour chercher les infos utiles a notre semaine
                        if(elem.y >= element.y-1 && elem.y <= element.y+100){
                            const fontNameNum = parseInt(elem.fontName.replace(/g_d\d*_f/gi, "")) % 7

                            if(elem.x > 104 && fontNameNum == 5 && elem.str.length > 2){ //Cours ou Lieu dans le tableau
                                
                                if(elem.y - debutLigne >= 18){ //On est passé a une nouvelle ligne
                                    for(const warning of elemWarning){
                                        if(fontNameNum == 5 && warning.str.length > 2){ //Lieu
                                            if(semaine.getDernierJour().getCoursEntreCoord(warning.x, warning.y)){
                                                let coursModif = semaine.getDernierJour().getCoursEntreCoord(warning.x, warning.y)
                                                if(coursModif.getLieu() == ""){
                                                    coursModif.setLieu(warning.str)
                                                    coursModif.setEndOfCase(warning.x + warning.width)
                                                    if(coursModif.getStartCoordY()-1 < warning.y && coursModif.getStartCoordY()+1 > warning.y){ //Cours et lieu sur la meme coordY

                                                        let otherCours = semaine.getJourEntreCoord(warning.y).getOtherCoursParDebut(coursModif)
                                                        if(semaine.getJourEntreCoord(warning.y).getStartCoordY()+5 > coursModif.getStartCoordY()){
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
                                                }
                                            }else{
                                                console.log(redNode, "/!\\ WARNING - Lieu : " + warning.str, resetNode)
                                                console.log(warning)
                                            }
                                        }else{ //Prof
                                            if(semaine.getDernierJour().getCoursParDebut(warning.x)){
                                                let coursModif = semaine.getDernierJour().getCoursParDebut(warning.x)
                                                if(coursModif.getProf() == ""){
                                                    coursModif.setProf(warning.str, warning.height)
                                                }else{
                                                    console.log(redNode, "/!\\ WARNING - Prof : " + warning.str, resetNode)
                                                    console.log(warning)
                                                }
                                            }else if(semaine.getDernierJour().getCoursParDebut(semaine.getDernierJour().getCoursFirstCoordX(warning.x, warning.y))){
                                                const coursModif = semaine.getDernierJour().getCoursParDebut(semaine.getDernierJour().getCoursFirstCoordX(warning.x, warning.y))
                                                if(coursModif.getProf() == ""){
                                                    coursModif.setProf(warning.str, warning.height)
                                                }else{
                                                    console.log(redNode, "/!\\ WARNING - Prof : " + warning.str, resetNode)
                                                    console.log(warning)
                                                }
                                            }else{
                                                console.log(redNode, "/!\\ WARNING - Prof : " + warning.str, resetNode)
                                                console.log(warning)
                                            }
                                        }

                                    }
                                    elemWarning = new Array()

                                    if(elem.y - debutLigne >= 36 && debutLigne != 0){
                                        semaine.addJour(elem.y - 18)
                                    }
                                    semaine.addJour(elem.y)
                                    debutLigne = elem.y
                                }
        
                                if(regex.test(elem.str.slice(0,2)) || elem.str.includes("Amphi")){ //Ajout du lieu
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
                                            elemWarning.push(elem)
                                        }
                                    }else{
                                        elemWarning.push(elem)
                                    }
        
                                }else{ //Création du cours
                                    let dernierJour = semaine.getDernierJour()
                                    if(dernierJour.getDernierCours() && dernierJour.getDernierCours().getNextCoordX() == 1000000){
                                        dernierJour.getDernierCours().setNextCoordX(elem.x)
                                    }
                                    dernierJour.addCours(elem.str, elem.x, elem.y, elem.width, elem.height)
                                }
                            }
        
                            if(elem.x > 104 && (fontNameNum == 6 || elem.str.length <= 2)){ //Prof dans le tableau
                                if(semaine.getDernierJour() && semaine.getDernierJour().getCoursParDebut(elem.x)){
                                    let coursModif = semaine.getDernierJour().getCoursParDebut(elem.x)
                                    coursModif.setProf(elem.str, elem.height)
                                    coursModif.setCoursIng(false)
                                    coursModif.setCoursAlt(false)
                                }else if(semaine.getDernierJour() && semaine.getDernierJour().getCoursParDebut(semaine.getDernierJour().getCoursFirstCoordX(elem.x, elem.y))){
                                    const coursModif = semaine.getDernierJour().getCoursParDebut(semaine.getDernierJour().getCoursFirstCoordX(elem.x, elem.y))
                                    if(coursModif.getProf() == ""){
                                        coursModif.setProf(elem.str, elem.height)
                                        coursModif.setCoursIng(false)
                                        coursModif.setCoursAlt(false)
                                    }else{
                                        elemWarning.push(elem)
                                    }
                                }else{
                                    elemWarning.push(elem)
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