const ParseCoord = require('./../modules/parseCoord.js')

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
    constructor(titre, coordX, coordY, width, height, jour){
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

        if(jour && jour.getCoursFirstCoordX(coordX)){
            this.#nextCoordX = jour.getCoursFirstCoordX(coordX)
        }else{
            this.#nextCoordX = 1000000
        }

        this.#coordX = coordX
        this.#coordY = coordY
        this.#width  = width
        this.#height = height
    }

    /**
     * Récupère l'heure de début du cours
     */
    getHeureDebut(){
        return ParseCoord.coordToHeure(this.#coordX, 0)
    }
    /**
     * Récupère l'heure de fin du cours
     */
    getHeureFin(){
        if(this.getEndOfCase()){
            return ParseCoord.coordToHeure(this.#endOfCase, 0)
        }else{
            return ParseCoord.coordToHeure(this.#coordX, 2)
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