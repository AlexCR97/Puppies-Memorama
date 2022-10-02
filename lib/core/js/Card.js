class CardOptions {
    /** @type {String} */
    img

    /** @type {String} */
    label
}

class Card {
    /** @type {String} */
    id

    /** @type {String} */
    matchId

    /** @type {String} */
    img

    /** @type {String} */
    label

    size = '130px'
    checked = false
    disabled = false
    flipped = false

    /**
     * 
     * @param {String} id
     * @param {String} matchId
     * @param {CardOptions} options 
     */
    constructor(id, matchId, options) {
        this.id = id
        this.matchId = matchId
        this.img = options?.img
        this.label = options?.label
    }

    /**
     * @returns {Boolean}
     */
    get hasImg() {
        return this.img != undefined && this.img != null
    }

    /**
     * @returns {Boolean}
     */
    get hasLabel() {
        return this.label != undefined && this.label != null
    }

    /**
     * @returns {Card}
     */
    clone() {
        return new Card(this.id, this.matchId, { img: this.img, label: this.label })
    }
}
