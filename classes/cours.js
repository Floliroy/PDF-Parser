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
    #endOfCase = 0

    constructor(titre, coordX, coordY, width, height){
        const regexDeux  = RegExp("/* - [A-Z][A-Z]")
        const regexTrois = RegExp("/* - [A-Z][A-Z][A-Z]")
        if(regexDeux.test(titre)){
            this.#prof = titre.slice(-2).trim()
            this.#titre = titre.slice(0, -5).trim()
        }else if(regexTrois.test(titre)){
            this.#prof = titre.slice(-3).trim()
            this.#titre = titre.slice(0, -6).trim()
        }else if(titre.endsWith(" - ")){
            this.#titre = titre.slice(0, -3).trim()
        }else{
            this.#titre = titre.trim()
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

    setProf(prof){
        this.#prof = prof.trim()
    }
    setLieu(lieu){
        this.#lieu = lieu.trim()
    }
    setEvaluation(evaluation){
        this.#evaluation = evaluation == "true" ? true : false
    }
    isEvaluation(){
        return this.#evaluation
    }

    print(){
        console.log(`       ${this.#titre}${this.#lieu ? " - " + this.#lieu : ""}${this.#prof ? " (" + this.#prof + ")" : ""}`)
    }
}