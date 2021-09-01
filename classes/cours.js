const ParseCoord = require('./../modules/parseCoord.js')
const Discord = require('discord.js')

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
    /** Indique si on a du remplir le prof par la suite ou non */
    #profInName = false

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
        const regexTrois = /.* - [A-Z][A-Z][A-Z]/
        const regexDeux  = /.* - [A-Z][A-Z]/
        const regexTroisBis = /.* \([A-Z][A-Z][A-Z]\)/
        const regexDeuxBis  = /.* \([A-Z][A-Z]\)/
        if(titre.match(regexTrois)){ //Prof avec trois lettres
            this.#prof = titre.slice(-3).trim()
            this.#titre = titre.slice(0, -6).trim()
            this.#profInName = true
        }else if(titre.match(regexDeux)){ //Prof avec deux lettres
            this.#prof = titre.slice(-2).trim()
            this.#titre = titre.slice(0, -5).trim()
            this.#profInName = true
        }else if(titre.match(regexTroisBis)){ //Prof avec trois lettres
            this.#prof = titre.slice(-5).trim()
            this.#titre = titre.slice(0, -6).trim()
            this.#profInName = true
        }else if(titre.match(regexDeuxBis)){ //Prof avec deux lettres
            this.#prof = titre.slice(-4).trim()
            this.#titre = titre.slice(0, -5).trim()
            this.#profInName = true
        }else if(titre.endsWith(" - ")){ //Fin inutile
            this.#titre = titre.slice(0, -3).trim()
        }else{
            this.#titre = titre.trim()
        }
        if(this.#titre.endsWith("(")){
            this.#titre = this.#titre.slice(0, -1).trim()
        }
        this.#prof = this.#prof.replace("(", "").replace(")", "")

        if(jour && jour.getCoursFirstCoordX(coordX, coordY)){
            this.#nextCoordX = jour.getCoursFirstCoordX(coordX, coordY)
        }else{
            this.#nextCoordX = 1000000
        }

        if(titre.includes("Sport") || titre.includes("sauf alt")){
            this.#coursIng = true
            this.#coursAlt = false
        }

        this.#coordX = coordX
        this.#coordY = coordY
        this.#width  = width
        this.#height = height
    }

    /**
     * Récupère le message embed associé au cours
     */
    getEmbedMessage(){
        let messageEmbed = new Discord.MessageEmbed()
            .setTitle(this.#titre)
            .setDescription("=======================")
            .addField("Début", `${this.getHeureDebut()}`, true)
            .addField("Fin", `${this.getHeureFin()}`, true)
        if(this.#prof){
            messageEmbed.addField("Professeur", this.#prof)
        }
        if(this.#lieu){
            messageEmbed.addField("Salle", this.#lieu)
        }
        return messageEmbed
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
    isProfInName(){
        return this.#profInName
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