/**
 * @param {String} id 
 */
function getElementOrThrow(id) {
    const element = document.getElementById(id)

    if (!element)
        throw new Error(`Could not initialize modal with id [${id}]`)

    return element
}

/**
 * @param {String} html 
 */
function htmlToElement(html) {
    const template = document.createElement('template')
    html = html.trim() // Never return a text node of whitespace as the result
    template.innerHTML = html
    return template.content.firstChild
}

/**
 * 
 * @param {Number} min 
 * @param {Number} max 
 * @type {Number}
 */
function randomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * @param {Array} array 
 */
function randomItemFrom(array) {
    const index = randomInt(0, array.length - 1)
    return array[index]
}

/**
 * @param {Array} array
 */
function shuffle(array) {
    let currentIndex = array.length, randomIndex

    // While there remain elements to shuffle
    while (currentIndex != 0) {

        // Pick a remaining element
        randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex--

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]]
    }

    return array;
}

/**
 * @param {Number} milliseconds 
 * @type {Promise<void>}
 */
async function waitMillisecondsAsync(milliseconds) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve()
        }, milliseconds);
    })
}

/**
 * @type {String}
 */
function guid() {
    const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4())
}
