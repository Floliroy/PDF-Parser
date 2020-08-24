module.exports = class Cours{
    #titre = ""
    #prof = ""
    #lieu = ""
    #evaluation = false

    #coordX = 0
    #coordY = 0
    #width  = 0
    #height = 0
    
    #nextCoordX = 0

    constructor(titre, coordX, coordY, width, height){
        const regexDeux  = RegExp("/* - [A-Z][A-Z]")
        const regexTrois = RegExp("/* - [A-Z][A-Z][A-Z]")
        if(regexDeux.test(titre)){
            this.#prof = titre.slice(-2)
            this.#titre = titre.slice(0, -4)
        }else if(regexTrois.test(titre)){
            this.#prof = titre.slice(-3)
            this.#titre = titre.slice(0, -5)
        }else{
            this.#titre = titre
        }

        this.#coordX = coordX
        this.#coordY = coordY
        this.#width  = width
        this.#height = height
    }

    getTitre(){
        return this.#titre
    }
    getProf(){
        return this.#prof
    }
    getLieu(){
        return this.#lieu
    }

    getConsoleLogCours(){
        console.log(`Titre : '${this.#titre}'`)
        console.log(`Prof : '${this.#prof}'`)
        console.log(`Lieu : '${this.#lieu}'`)
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

    setProf(prof){
        this.#prof = prof
    }
    setLieu(lieu){
        this.#lieu = lieu
    }
    setEvaluation(evaluation){
        this.#evaluation = evaluation == "true" ? true : false
    }
    isEvaluation(){
        return this.#evaluation
    }
}