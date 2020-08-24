const Jour = require('./jour.js')

const listeJours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]

module.exports = class Semaine{
    #nom = ""
    #jours = new Array()

    constructor(nom){
        this.#nom = nom
    }
    getNom(){
        return this.#nom
    }

    addJour(coordY){
        if(this.#jours.length < 5){
            this.#jours.push(new Jour(listeJours[this.#jours.length], coordY))
        }
    }

    getDernierJour(){
        return this.#jours[this.#jours.length - 1]
    }

    getJourEntreCoord(coordY){
        return this.#jours.find(element => {
            return element.getStartCoordY() <= coordY && element.getEndCoordY() >= coordY
        })
    }

    print(){
        console.log(`Semaine du ${this.#nom} :`)
        this.#jours.forEach(function(jour){
            jour.print()
        })
    }
}