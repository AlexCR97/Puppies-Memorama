class Pair {
    /** @type {Card} */
    a

    /** @type {Card} */
    b

    /** @type {String} */
    info

    /**
     * @param {Card} a 
     * @param {Card} b 
     * @param {String} info
     */
    constructor(a, b, info) {
        this.a = a
        this.b = b
        this.info = info
    }

    clone() {
        const aClone = this.a.clone()
        const bClone = this.b.clone()
        return new Pair(aClone, bClone, this.info)
    }
}

