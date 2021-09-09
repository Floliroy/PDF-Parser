const hours = ["8h", "9h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h"]
let coords = new Map()

module.exports = class ParseCoord{

    static loadDatas(datas, id){
        let hourToCoord = new Map()
        for(const hour of hours){
            for(const data of datas){
                if(data.str == hour){
                    hourToCoord.set(hour, data.x)
                    break
                }
            }
        }
        if(hourToCoord.has(id)) hourToCoord.delete(id)
        coords.set(id, hourToCoord)
    }

    static coordToHeure(coordX, addHour, id){
        return secondesToHeure(getSecondesByCoord(coordX, id), addHour)
    }
    
}

/**
 * Fonction permettant de récupérer la minute la plus proche dans l'ensemble (0,15,30,45,60) de la minute passée
 * @param {*} min La minute que l'on cherche a récupérer de manière normalisée
 */
function getClosest(min){
    const minutes = [0, 15, 30, 45, 60]

    let closest = 0
    let lastCalc = 60
    for(const minute of minutes){
        //On cherche la distance la plus courte avec la minute passée
        if(Math.abs(minute - min) < lastCalc){
            lastCalc = Math.abs(minute - min)
            closest = minute
        }
    }
    return closest
}

/**
 * Permet de transformer un temps en seconde au format HH:MM
 * @param {*} secondes Le temps en seconde à transformer
 */
function secondesToHeure(secondes, addHour){
    let hour  = Math.floor(secondes / 3600)
    let min = Math.floor((secondes - (hour * 3600)) / 60)
    
    min = getClosest(min)
    hour += addHour
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
function getSecondesByCoord(coordX, id){
    const hourToCoord = coords.get(id)
    let prevCoord
    for(const [hour, coord] of hourToCoord){
        if(coord > coordX){
            if(!prevCoord){
                return 27900
            }
            let seconds = (parseInt(hour.replace("h", "")) - 1) * 3600
            seconds += (coordX - prevCoord) / (coord - prevCoord) * 3600
            return seconds
        }
        prevCoord = coord
    }
    return 63900
}