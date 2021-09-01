const Cours = require('./cours.js')

const redNode = "\x1b[31m"
const blueNode = "\x1b[36m"
const oranNode = "\x1b[33m"
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
        this.#cours.push(new Cours(titre, coordX, coordY, width, height, this))
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
     * Récupère l'autre cours ayant la même coordonnée de début en X
     * @param {*} cours Le cours ayant la même coordonnée en X
     */
    getOtherCoursParDebut(cours){
        return this.#cours.find(element => {
            return element.getStartCoordX() == cours.getStartCoordX() && element != cours
        })
    }
    /**
     * Récupère le cours ayant la première coordonné supérieur a celle passé en parametre
     * @param {*} coordX La coordonnée à rechercher
     * @param {*} coordY La coordonnée en Y du cours appelant
     */
    getCoursFirstCoordX(coordX, coordY){
        let difference = 1000000
        let retour = null
        this.#cours.forEach(function(cours){
            if(cours.getStartCoordX() - coordX < difference && cours.getStartCoordX() - coordX > 120){
                if(!cours.isProfInName() || (cours.getStartCoordY()-1.5 < coordY && cours.getStartCoordY()+1.5 > coordY)){
                    difference = cours.getStartCoordX() - coordX
                    retour = cours.getStartCoordX()
                }
            }
        })
        return retour
    }
    /**
     * Récupère le cours qui contient certains coordonnées en X et Y
     * @param {*} coordX La coordonnée en X à rechercher
     * @param {*} coordY La coordonnée en Y à rechercher
     */
    getCoursEntreCoord(coordX, coordY){
        let coursPossible = new Array()
        for(let cour of this.#cours){
            if(this.isDoubleCours(coordX)){
                if(cour.getStartCoordX() <= coordX && cour.getNextCoordX() > coordX && (cour.getStartCoordY()-1.5 < coordY && cour.getStartCoordY()+1.5 > coordY)){
                    coursPossible.push(cour)
                }
            }else{
                if(cour.getStartCoordX() <= coordX && cour.getNextCoordX() > coordX){
                    coursPossible.push(cour)
                }
            }
        }
        let minCoordX = 1000000
        let retour = coursPossible[coursPossible.length-1]
        for(let cour of coursPossible){
            if(cour.getStartCoordX() < minCoordX && cour.getStartCoordX() > coordX){
                minCoordX = cour.getStartCoordX()
                retour = cour
            }
        }
        return retour
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
        return this.#cours
    }
}