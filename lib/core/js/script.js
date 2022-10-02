const ConfigVariableNotFoundError = (key) => `No se encontró la variable "${key}" en el archivo de configuración`
const MinimumRequiredError = (key, min) => `'La variable "${key}" debe tener un valor de al menos ${min}`
const IncorrectTypeError = (key, type) => `La variable "${key}" tiene un formato incorrecto. El formato debe ser de tipo [${type}]`
const MemoramaVariableNotFoundError = (key, index) => `No se encontró la variable "${key}" en la posición ${index} del memorama`
const MemoramaIncorrectTypeError = (key, type, index) => `La variable "${key}" en la posición ${index} del memorama tiene un formato incorrecto. El formato debe ser de tipo [${type}]`

new Vue({
  el: "#app",

  data: () => ({
    attempts: 0,
    cols: 0,
    rows: 0,
    timeout: 0,
    configError: undefined,
    configStatus: undefined,

    pairs: [],
    cards: [],
    foundPairs: [],

    flipped1: undefined,
    flipped2: undefined,
    timeoutSubscription: undefined,
    matchAttempts: 0,

    modal: undefined,
    modalMessage: undefined,
    modalIcon: undefined,

    infoModal: undefined,
    infoPair: {
      a: {
        label: '',
      },
      b: {
        label: '',
      },
      info: '',
    },
  }), // data

  computed: {
    columnClass() {
      const cols = 12 / this.cols
      return `col-${cols}`
    },
    matchedCardsCount() {
      return this.foundPairs.length
    },
    cardCount() {
      return this.rows * this.cols
    },
    isAllPairsGuessed() {
      return this.matchedCardsCount * 2 == this.cards.length
    },
  }, // computed

  mounted() {
    this.initAsync()
  }, // mounted

  methods: {
    cardClass(card) {
      return {
        'flipped': card.flipped,
        'checked': card.checked,
      }
    },

    cardStyle(card) {
      return {
        'background-image': `url('${card.img}')`,
      }
    },

    flipCardStyle(card) {
      let width = '130px'
      let height = '130px'

      if (window.innerWidth < 1200) {
        width = '100px'
        height = '100px'
      }

      if (window.innerWidth < 992) {
        width = '80px'
        height = '80px'
      }

      return {
        'width': width,
        'height': height,
      }
    },

    onCardClicked(card) {
      if (card.disabled)
        return

      card.flipped = !card.flipped
      card.disabled = true

      if (!this.flipped1) {
        this.flipped1 = card.clone()
        return
      }

      this.flipped2 = card.clone()
      this.verifyMatchAsync()
    },

    onContinueClicked() {
      this.infoModal.hide()

      if (this.isAllPairsGuessed) {
        this.endGame()
      } else {
        this.startTimeout()
      }
    },

    onPlayAgainClicked() {
      this.resetData()
      this.initAsync()
    },

    async initAsync() {
      const configResponse = await fetch('config.json')

      const statusCode = configResponse.status
      this.configStatus = statusCode

      if (statusCode != 200) {
        if (statusCode == 404) {
          this.configError = 'No se encontró el archivo de configuración.'
          return
        }
        return
      }

      try {
        const config = await configResponse.json()

        if (config.intentos == undefined || config.intentos == null)
          throw ConfigVariableNotFoundError('intentos')

        if (typeof config.intentos != 'number')
          throw IncorrectTypeError('intentos', 'número')

        if (config.intentos <= 0)
          throw MinimumRequiredError('intentos', 1)

        if (config.filas == undefined || config.filas == null)
          throw ConfigVariableNotFoundError('filas')

        if (typeof config.filas != 'number')
          throw IncorrectTypeError('filas', 'número')

        if (config.filas <= 0)
          throw MinimumRequiredError('filas', 1)

        if (config.columnas == undefined || config.columnas == null)
          throw ConfigVariableNotFoundError('columnas')

        if (typeof config.columnas != 'number')
          throw IncorrectTypeError('columnas', 'número')

        if (config.columnas <= 0)
          throw MinimumRequiredError('columnas', 1)

        if (config.tiempo == undefined || config.tiempo == null)
          throw ConfigVariableNotFoundError('tiempo')

        if (typeof config.tiempo != 'number')
          throw IncorrectTypeError('tiempo', 'número')

        if (config.tiempo <= 0)
          throw MinimumRequiredError('tiempo ', 1)

        if (config.memorama == undefined || config.memorama == null)
          throw ConfigVariableNotFoundError('memorama')

        if (!Array.isArray(config.memorama))
          throw IncorrectTypeError('memorama', 'lista')

        const requiredCardsForGrid = config.filas * config.columnas

        if (requiredCardsForGrid % 2 != 0)
          throw `La configuración proporcionada resulta en una cuadrícula impar de ${requiredCardsForGrid} cartas. Por favor abre el archivo de configuración y modifica la cantidad de filas y columnas para que sea una cuadrícula par.`

        config.memorama.forEach((item, index) => {
          if (item.label == undefined || item.label == null)
            throw MemoramaVariableNotFoundError('label', index)

          if (typeof item.label != 'string')
            throw MemoramaIncorrectTypeError('label', 'string', index)

          if (item.img == undefined || item.img == null)
            throw MemoramaVariableNotFoundError('img', index)

          if (typeof item.img != 'string')
            throw MemoramaIncorrectTypeError('img', 'string', index)

          if (item.description == undefined || item.description == null)
            throw MemoramaVariableNotFoundError('description', index)

          if (typeof item.description != 'string')
            throw MemoramaIncorrectTypeError('description', 'string', index)

          const matchId = guid()
          const imgCard = new Card(guid(), matchId, { img: item.img })
          const labelCard = new Card(guid(), matchId, { label: item.label })
          const pair = new Pair(imgCard, labelCard, item.description)
          this.pairs.push(pair)
        })

        this.attempts = config.intentos
        this.cols = config.columnas
        this.rows = config.filas
        this.timeout = config.tiempo

        this.initInfoModal()
        this.initModal()
        this.startGame(this.pairs)
      }
      catch (err) {
        this.configStatus = 500
        this.configError = `Error inesperado: ${err}`
      }
    },

    initModal() {
      const modalId = 'memoramaModal'
      const modalElement = document.getElementById(modalId)

      if (!modalElement)
        throw new Error(`Could not initialize modal with id [${modalId}]`)

      modalElement.setAttribute('data-bs-backdrop', 'static')
      this.modal = new bootstrap.Modal(modalElement)
    },

    initInfoModal() {
      const modalId = 'infoModal'
      const modalElement = document.getElementById(modalId)

      if (!modalElement)
        throw new Error(`Could not initialize modal with id [${modalId}]`)

      modalElement.setAttribute('data-bs-backdrop', 'static')
      this.infoModal = new bootstrap.Modal(modalElement)
    },

    resetData() {
      if (this.modal)
        this.modal.hide()

      if (this.infoModal)
        this.infoModal.hide()

      this.attempts = 0
      this.cols = 0
      this.rows = 0
      this.timeout = 0
      this.configError = undefined
      this.configStatus = undefined

      this.pairs = []
      this.cards = []
      this.foundPairs = []

      this.flipped1 = undefined
      this.flipped2 = undefined
      this.timeoutSubscription = undefined
      this.matchAttempts = 0

      this.modal = undefined
      this.modalMessage = undefined
      this.modalIcon = undefined

      this.infoModal = undefined
      this.infoPair = {
        a: {
          label: '',
        },
        b: {
          label: '',
        },
        info: '',
      }
    },

    startGame(pairs) {
      this.generateCardsFromPairs(pairs)
      this.startTimeout()
    },

    generateCardsFromPairs(pairs) {
      while (this.cards.length < this.cardCount) {
        const pair = randomItemFrom(pairs)
        const clone1 = pair.a.clone()
        const clone2 = pair.b.clone()
        clone1.id = guid()
        clone2.id = guid()
        this.cards.push(clone1)
        this.cards.push(clone2)
      }

      shuffle(this.cards)
    },

    startTimeout() {
      this.timeoutSubscription = setInterval(() => {
        this.timeout -= 1

        if (this.timeout <= 0) {
          this.clearTimeoutSubscription()
          this.endGame()
        }
      }, 1000)
    },

    clearTimeoutSubscription() {
      if (!this.timeoutSubscription)
        return

      clearInterval(this.timeoutSubscription)
    },

    checkCard(id, checked) {
      const card = this.cards.find(c => c.id == id)
      card.checked = checked
    },

    disableCard(id, value) {
      const card = this.cards.find(c => c.id == id)
      card.disabled = value
    },

    flipCard(id, value) {
      const card = this.cards.find(c => c.id == id)
      card.flipped = value
    },

    getLabelFromPair(pair) {
      if (pair.a.label)
        return pair.a.label

      return pair.b.label
    },

    async verifyMatchAsync() {
      if (!this.flipped1 || !this.flipped2)
        throw new Error('Cannot verify match. Either flipped1 or flipped2 is undefined or null')

      const isMatch = this.flipped1.matchId == this.flipped2.matchId

      const oneIsImgAndOtherIsLabel = false
        || (this.flipped1.hasImg && this.flipped2.hasLabel)
        || (this.flipped2.hasImg && this.flipped1.hasLabel)

      if (isMatch && oneIsImgAndOtherIsLabel) {
        await waitMillisecondsAsync(250)
        this.showInfoModal()
        await this.approveMatchAsync()
      }
      else {
        await this.denyMatchAsync()

        if (this.matchAttempts == this.attempts)
          this.endGame()
      }
    },

    showInfoModal() {
      if (!this.flipped1 || !this.flipped2)
        throw new Error('Cannot show info modal. Either flipped1 or flipped2 is undefined or null')

      const pair = this.pairs.find(p => p.a.matchId == this.flipped1.matchId)
      this.infoPair = pair.clone()
      this.infoModal.show()
      this.clearTimeoutSubscription()
    },

    async approveMatchAsync() {
      if (!this.flipped1 || !this.flipped2)
        throw new Error('Cannot approve match. Either flipped1 or flipped2 is undefined or null')

      this.foundPairs.push(new Pair(this.flipped1, this.flipped2))
      const flipped1Id = this.flipped1.id
      const flipped2Id = this.flipped2.id
      this.flipped1 = undefined
      this.flipped2 = undefined
      await waitMillisecondsAsync(500)
      this.checkCard(flipped1Id, true)
      this.checkCard(flipped2Id, true)
    },

    async denyMatchAsync() {
      if (!this.flipped1 || !this.flipped2)
        throw new Error('Cannot deny match. Either flipped1 or flipped2 is undefined or null')

      // TODO Show some sort of UI feedback for NO match
      const flipped1Id = this.flipped1.id
      const flipped2Id = this.flipped2.id
      this.flipped1 = undefined
      this.flipped2 = undefined
      await waitMillisecondsAsync(1000)
      this.flipCard(flipped1Id, false)
      this.flipCard(flipped2Id, false)
      this.disableCard(flipped1Id, false)
      this.disableCard(flipped2Id, false)
      this.matchAttempts += 1
    },

    endGame() {
      if (!this.modal)
        throw new Error('Could not end game. Modal is null or undefined')

      this.clearTimeoutSubscription()

      if (this.isAllPairsGuessed) {
        this.modalMessage = '¡Ganaste!'
        this.modalIcon = 'emoji-laughing'
      }
      else if (this.timeout == 0) {
        this.modalMessage = '¡Se acabó el tiempo!'
        this.modalIcon = 'emoji-smile-upside-down'
      }
      else if (this.matchAttempts >= this.attempts) {
        this.modalMessage = '¡Se te acabaron los intentos!'
        this.modalIcon = 'emoji-dizzy'
      }

      this.modal.show()
    }
  }, // methods
})
