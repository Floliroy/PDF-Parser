/**
 * Fonction permettant de récupérer la minute la plus proche dans l'ensemble (0,15,30,45,60) de la minute passée
 * @param {*} min La minute que l'on cherche a récupérer de manière normalisée
 */
function getClosest(min){
    minutes = [0, 15, 30, 45, 60]

    closest = 0
    lastCalc = 60
    minutes.forEach(function(elem){
        //On cherche la distance la plus courte avec la minute passée
        if(Math.abs(elem - min) < lastCalc){
            lastCalc = Math.abs(elem - min)
            closest = elem
        }
    })
    return closest
}

/**
 * Permet de transformer un temps en seconde au format HH:MM
 * @param {*} secondes Le temps en seconde à transformer
 */
function secondesToHeure(secondes, addHour){
    let hour  = Math.floor(secondes / 3600) + addHour
    let min = Math.floor((secondes - (hour * 3600)) / 60)
    
    min = getClosest(min)
    //Si on a 60 c'est qu'on a une heure de plus
    if(min == 60){
        hour++
        min = 0
    }
    if(hour < 10){hour = `0${hour}`}
    if(min  < 10){min  = `0${min }`}

    return `${hour}:${min}`
}

/**
 * Permet de transformer une coordonnée en temps en seconde
 * @param {*} coordX La coordonnée à transformer
 */
function getSecondesByCoord(coordX){
    //On gère nos exceptions 
    if(coordX > 221-3 && coordX < 221+3){return 35100}
    if(coordX > 359-3 && coordX < 367+3){return 43200}
    if(coordX > 422-3 && coordX < 422+3){return 48600}
    if(coordX > 439-3 && coordX < 439+3){return 49500}
    if(coordX > 597-3 && coordX < 597+3){return 57600}
    
    //Sinon on utilise une fonction polynomiale de degrès 4
    return  0.00000019513359 * Math.pow(coordX, 4)
            + (-0.0003723993) * Math.pow(coordX, 3)
            + 0.2325723439 * Math.pow(coordX, 2)
            + 7.6856610283 * coordX + 25028.095126
}

module.exports = class Cours{
    /** Titre du cours */
    #titre = ""
    /** Prof du cours -> EVOL : Transformer initiale en nom complet */
    #prof = ""
    /** Lieu du cours */
    #lieu = ""
    /** Indique si c'est une évaluation -> EVOL : Trouver l'info utile */
    #evaluation = false
    /** Indique si c'est un cours juste pour les ingénieurs */
    #coursIng
    /** Indique si c'est un cours juste pour les alternants */
    #coursAlt

    /** Coordonnée X du titre du cours */
    #coordX = 0
    /** Coordonnée Y du titre du cours */
    #coordY = 0
    /** Largeur du titre du cours */
    #width  = 0
    /** Hauteur du titre du cours */
    #height = 0
    
    /** CoordX du prochain cours */
    #nextCoordX = 0
    /** CoordX de la fin de la case pour déterminer l'heure de fin */
    #endOfCase = 0

    ///////////////////
    //// METHODES /////
    ///////////////////
    /**
     * Constructeur intialisant les différents champs passés
     * Travail aussi le titre / prof / lieu en fonction du titre passé
     * @param {*} titre Titre souhaité (peut contenir prof / lieu en plus)
     * @param {*} coordX Coordonnée en X
     * @param {*} coordY Coordonnée en Y
     * @param {*} width Largeur
     * @param {*} height Hauteur
     */
    constructor(titre, coordX, coordY, width, height){
        const regexTrois = RegExp("/* - [A-Z][A-Z][A-Z]")
        const regexDeux  = RegExp("/* - [A-Z][A-Z]")
        if(regexTrois.test(titre)){ //Prof avec trois lettres
            this.#prof = titre.slice(-3).trim()
            this.#titre = titre.slice(0, -6).trim()
        }else if(regexDeux.test(titre)){ //Prof avec deux lettres
            this.#prof = titre.slice(-2).trim()
            this.#titre = titre.slice(0, -5).trim()
        }else if(titre.endsWith(" - ")){ //Fin inutile
            this.#titre = titre.slice(0, -3).trim()
        }else{
            this.#titre = titre.trim()
        }

        /*if(titre == "Sport"){
            this.#coursIng = true
        }*/

        this.#coordX = coordX
        this.#coordY = coordY
        this.#width  = width
        this.#height = height
    }

    /**
     * Récupère l'heure de début du cours
     */
    getHeureDebut(){
        return secondesToHeure(getSecondesByCoord(this.#coordX), 0)
    }
    /**
     * Récupère l'heure de fin du cours
     */
    getHeureFin(){
        if(this.getEndOfCase()){
            return secondesToHeure(getSecondesByCoord(this.#endOfCase), 0)
        }else{
            return secondesToHeure(getSecondesByCoord(this.#coordX), 2)
        }
    }

    /**
     * Affiche les infos utiles du cours
     */
    print(){
        console.log(`       [${this.getHeureDebut()}:${this.getHeureFin()} - ${this.#coordX}:${this.getEndOfCase()?this.#endOfCase:"???"}]`
                            + `${this.#coursAlt ? " - Alternant" : ""}${this.#coursIng ? " - Ingénieur" : ""}`)
        console.log(`       ${this.#titre}${this.#lieu ? " - " + this.#lieu : ""}${this.#prof ? " (" + this.#prof + ")" : ""}`)
    }

    ///////////////////////////
    //// GETTERS & SETTERS ////
    ///////////////////////////

    //Partie non commentée

    getTitre(){
        return this.#titre
    }
    setProf(prof){
        this.#prof = prof.trim()
    }
    getProf(){
        return this.#prof
    }
    setLieu(lieu){
        this.#lieu = lieu.trim()
    }
    getLieu(){
        return this.#lieu
    }
    setEvaluation(evaluation){
        this.#evaluation = evaluation == "true" ? true : false
    }
    isEvaluation(){
        return this.#evaluation
    }
    setCoursIng(coursIng){
        this.#coursIng = coursIng
    }
    isCoursIng(){
        return this.#coursIng
    }
    setCoursAlt(coursAlt){
        this.#coursAlt = coursAlt
    }
    isCoursAlt(){
        return this.#coursAlt
    }

    getStartCoordX(){
        return this.#coordX
    }
    getStartCoordY(){
        return this.#coordY
    }
    getEndCoordX(){
        return this.#coordX + this.#width
    }    
    getEndCoordY(){
        return this.#coordY + this.#height
    }
    setNextCoordX(nextCoordX){
        this.#nextCoordX = nextCoordX
    }
    getNextCoordX(){
        return this.#nextCoordX > this.#coordX ? this.#nextCoordX : 1000000
    }
    setEndOfCase(endOfCase){
        this.#endOfCase = endOfCase
    }
    getEndOfCase(){
        return this.#endOfCase != 0 ? this.#endOfCase : null
    }
}