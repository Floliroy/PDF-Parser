const Jour = require('./jour.js')

const listeJours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]
const listeMois  = ["janv", "fev", "mars", "avril", "mai", "juin", "juill", "août", "sept", "oct", "nov", "dec"]

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
        this.#nom = nom.trim()
    }

    /**
     * Getter sur le nom de la semaine
     */
    getNom(){
        return this.#nom
    }
    /**
     * Getter sur la liste des jours
     */
    getJours(){
        return new Promise((resolve) => resolve(this.#jours))
    }
    /**
     * Récupère le numéro du mois actuel
     */
    getNumeroMois(){
        let cpt = 1
        let semaine = this
        let retour
        listeMois.forEach(function(mois){
            if(semaine.getNom().endsWith(mois)){
                retour = cpt < 10 ? `0${cpt}` : cpt
            }
            cpt++
        })
        return retour
    }
    /**
     * Récupère le numéro du premier jour de la semaine
     */
    getNumeroPremierJourSemaine(){
        return parseInt(this.#nom.slice(0,2))
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

    /**
     * Supprime le cours ayant le meme titre et la meme date de début s'il exite
     * @param {*} nomCours Titre du cours
     * @param {*} dateDebut Date et heure de début du cours
     */
    async removeCours(nomCours, dateDebut){
        let dateAjd = new Date()
        let annee = dateAjd.getFullYear()

        let cptJour = 0
        const jours = await this.getJours()

        for(const jour of jours){
            const cours = await jour.getCours()
            for(const cour of cours){
                if(!cour.isCoursIng()){
                    if(this.getNumeroMois()-1 > dateAjd.getMonth() && this.getNumeroMois()-1 > 7 && dateAjd.getMonth <= 7){
                        annee -= 1
                    }
                    let date = new Date(annee, this.getNumeroMois()-1, this.getNumeroPremierJourSemaine() + cptJour)
                    date.addDays(cptJour)

                    let month = date.getMonth()+1 < 10 ? `0${date.getMonth()+1}` : date.getMonth()+1
                    let day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
                    
                if(dateDebut == `${annee}-${month}-${day}T${cour.getHeureDebut()}:00+0${/*date.getTimezoneOffset()/-60*/0}:00` && nomCours.includes(cour.getTitre())){
                        cours.splice(cours.indexOf(cour), 1)
                    }
                }
            }
            cptJour++
        }
    }
}