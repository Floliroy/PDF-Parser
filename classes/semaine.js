const Jour = require('./jour.js')

const listeJours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]

module.exports = class Semaine{
    /** Le nom de la semaine */
    #nom = ""
    /** La liste des jours de la semaine */
    #jours = new Array()

    ///////////////////
    //// METHODES /////
    ///////////////////
    /**
     * Constructeur initialisant le nom de la semaine
     * @param {*} nom Nom souhaité
     */
    constructor(nom){
        this.#nom = nom
    }

    /**
     * Getter sur le nom de la semaine
     */
    getNom(){
        return this.#nom
    }
    /**
     * Ajoute un nouveau jour en l'initialisant correctement
     * @param {*} coordY La coordonnée en Y du nouveau jour
     */
    addJour(coordY){
        if(this.#jours.length < 5){
            this.#jours.push(new Jour(listeJours[this.#jours.length], coordY))
        }
    }
    /**
     * Récupère le dernier jour ajouté à la liste
     */
    getDernierJour(){
        return this.#jours[this.#jours.length - 1]
    }
    /**
     * Récupère le jour qui contient une coordonnée
     * @param {*} coordY Coordonnée à rechercher
     */
    getJourEntreCoord(coordY){
        return this.#jours.find(element => {
            return element.getStartCoordY() <= coordY && element.getEndCoordY() > coordY
        })
    }
    /**
     * Affiche le nom de la semaine suivit pas sa liste de jours
     */
    print(){
        console.log(`Semaine du ${this.#nom} :`)
        this.#jours.forEach(function(jour){
            jour.print()
        })
    }
}