const Cours = require('./cours.js')

const redNode = "\x1b[31m"
const blueNode = "\x1b[36m"
const resetNode = "\x1b[0m"

const listeJours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]

module.exports = class Jour{
    /** Nom du jour */
    #nom = ""
    /** Coordonnée en Y */
    #coordY = 0
    /** Liste de cours */
    #cours = new Array()

    ///////////////////
    //// METHODES /////
    ///////////////////
    /**
     * Constructeur vérifiant aussi que le jour est bien un jour de cours
     * @param {*} nom Le nom du jour
     * @param {*} coordY La coordonnée en Y
     */
    constructor(nom, coordY){
        this.#nom = nom
        this.#coordY = coordY
        if(!listeJours.includes(nom)){
            console.log(redNode, `/!\\ WARNING - Le jour '${nom}' est inconnu !`, resetNode)
        }
    }

    /**
     * Ajoute un nouveau cours a la liste des cours du jour
     * @param {*} titre Titre souhaité (peut contenir prof / lieu en plus)
     * @param {*} coordX Coordonnée en X
     * @param {*} coordY Coordonnée en Y
     * @param {*} width Largeur
     * @param {*} height Hauteur
     */
    addCours(titre, coordX, coordY, width, height){
        this.#cours.push(new Cours(titre, coordX, coordY, width, height))
    }

    /**
     * Récupère le dernier cours de la liste
     */
    getDernierCours(){
        return this.#cours[this.#cours.length - 1]
    }
    /**
     * Récupère le cours ayant la même coordonnée de début en X
     * @param {*} coordX La coordonnée à rechercher
     */
    getCoursParDebut(coordX){
        return this.#cours.find(element => {
            return element.getStartCoordX() == coordX
        })
    }
    /**
     * Récupère le cours qui contient certains coordonnées en X et Y
     * @param {*} coordX La coordonnée en X à rechercher
     * @param {*} coordY La coordonnée en Y à rechercher
     */
    getCoursEntreCoord(coordX, coordY){
        return this.#cours.find(element => {
            if(this.isDoubleCours(coordX)){
                return element.getStartCoordX() <= coordX && element.getNextCoordX() > coordX && (element.getStartCoordY()-1 < coordY && element.getStartCoordY()+1 > coordY)
            }else{
                return element.getStartCoordX() <= coordX && element.getNextCoordX() > coordX
            }
        })
    }
    /**
     * Vérifie si pour une coordonnée on a deux cours possible en même teps
     * @param {*} coordX La ccoordonnée à rechercher
     */
    isDoubleCours(coordX){
        let cpt = 0
        this.#cours.forEach(function(cours){
            if(cours.getStartCoordX() <= coordX && cours.getNextCoordX() > coordX){
                cpt++
            }
        })
        return cpt > 1
    }

    /**
     * Affiche le nom du jour suivit pas sa liste de cours
     */
    print(){
        console.log(`   ${this.#nom} :`)
        this.#cours.forEach(function(cours){
            cours.print()
        })
    }

    ///////////////////////////
    //// GETTERS & SETTERS ////
    ///////////////////////////

    //Partie non commentée

    getNom(){
        return this.#nom
    }
    getStartCoordY(){
        return this.#coordY - 0.75
    }
    getEndCoordY(){
        return this.#coordY + 18
    }
    getCours(){
        return new Promise((resolve) => resolve(this.#cours))
    }
}