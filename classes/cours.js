function getClosest(min){
    minutes = [0, 15, 30, 45, 60]

    closest = 0
    lastCalc = 60
    minutes.forEach(function(elem){
        if(Math.abs(elem - min) < lastCalc){
            lastCalc = Math.abs(elem - min)
            closest = elem
        }
    })
    return closest
}

function secondesToHeure(secondes){
    let hour  = Math.floor(secondes / 3600)
    let min = Math.floor((secondes - (hour * 3600)) / 60)
    
    min = getClosest(min)
    if(min == 60){
        hour++
        min = 0
    }
    if(hour < 10){hour = `0${hour}`}
    if(min  < 10){min  = `0${min }`}

    return `${hour}:${min}`
}

function getSecondesByMultiplier(coordX){
    return  (-0.0000000000000240554) * Math.pow(coordX, 7)
            + 0.0000000000563162 * Math.pow(coordX, 6)
            + (-0.000000043126) * Math.pow(coordX, 5)
            + 0.00000630924 * Math.pow(coordX, 4)
            + 0.00728924 * Math.pow(coordX, 3)
            + (-3.69793) * Math.pow(coordX, 2)
            + 678.77 * coordX - 11216.7
}


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

    getHeureDebut(){
        return secondesToHeure(getSecondesByMultiplier(this.#coordX))
    }
    getHeureFin(){
        return secondesToHeure(getSecondesByMultiplier(this.#endOfCase))
    }

    print(){
        console.log(`       [${this.getHeureDebut()}${this.getEndOfCase() ? " - " + this.getHeureFin() : ""}]`)
        console.log(`       ${this.#titre}${this.#lieu ? " - " + this.#lieu : ""}${this.#prof ? " (" + this.#prof + ")" : ""}`)
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

}