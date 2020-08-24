const Cours = require('./cours.js')

const redNode = "\x1b[31m"
const blueNode = "\x1b[36m"
const resetNode = "\x1b[0m"


const listeJours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]

module.exports = class Jour{
    #nom = ""
    #coordY = 0
    #cours = new Array()

    constructor(nom, coordY){
        this.#nom = nom
        this.#coordY = coordY
        if(!listeJours.includes(nom)){
            console.log(redNode, `/!\\ WARNING - Le jour '${nom}' est inconnu !`, resetNode)
        }
    }
    getNom(){
        return this.#nom
    }
    getStartCoordY(){
        return this.#coordY - 0.75
    }
    getEndCoordY(){
        return this.#coordY + 18.75
    }

    addCours(titre, coordX, coordY, width, height){
        this.#cours.push(new Cours(titre, coordX, coordY, width, height))
    }

    getDernierCours(){
        return this.#cours[this.#cours.length - 1]
    }
    getCoursParDebut(coordX){
        return this.#cours.find(element => {
            return element.getStartCoordX() == coordX
        })
    }
    getCoursParFin(coordX){
        return this.#cours.find(element => {
            return element.getEndCoordX() == coordX
        })
    }
    getCoursEntreCoord(coordX){
        return this.#cours.find(element => {
            return element.getStartCoordX() <= coordX && element.getNextCoordX() > coordX
        })
    }

    print(){
        console.log(`   ${this.#nom} :`)
        this.#cours.forEach(function(cours){
            cours.print()
        })
    }
}