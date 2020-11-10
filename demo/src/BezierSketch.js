import { BezierShapeBuilder, BezierShape } from 'p5-bezier-builder'
import BoxResizer from './BoxResizer'

class BezierSketch {
    constructor (canvasId = 'defaultCanvasId', fullScreen = false) {
        this.canvasId = canvasId
        this.active = 0
        this.builders = [new BezierShapeBuilder()]
        this.opacities = [255]
        this.colors = [[255, 255, 255]]
        this.size = { w: null, h: null }
        this.fullScreen = fullScreen
        this.builderMode = 1
        this.activeOnly = false
        this.showVertices = true
        this.showCross = true
        this.showGuides = false

        this.resizer = new BoxResizer()
        this.resizer.registerObject(this.getActive(), this.getObjRegisterFn(), this.getObjResizerFn())

        this.resizeImageMode = false
        this.memBuilderMode = 0
        this.backgroundImage = null
        this.showBackgroundImage = true
        this.imageXYWH = [100, 100, 400, 400]
    }

    /**
     * Toggles the image resize mode on an off
     */
    toggleResizeImageMode (resize = null) {
        this.resizeImageMode = resize === null ? !this.resizeImageMode : resize
        if (this.resizeImageMode) {
            this.memBuilderMode = this.builderMode
            this.setMode(0)
        } else {
            this.setMode(this.memBuilderMode)
            this.memBuilderMode = 0
        }
    }

    /**
     * Parameter function for the this.resizer param f
     */
    getObjRegisterFn () {
        self = this
        return (obj) => {
            // handle the case where image mode is active
            if (this.resizeImageMode) return this.imageXYWH
            // handle the case where we need the active bezier object
            const [y,,,x] = self.getActive().bezier.getRectangularBoundary()
            const [w, h] = self.getActive().bezier.getDim()
            return [x, y, w, h]
        }
    }

    /**
     * Parameter function for the this.resizer param f2
     */
    getObjResizerFn () {
        self = this
        return (start, end, corner) => {
            const [xd, yd] = [end[0] - start[0], end[1] - start[1]]
            let wp
            // handle the case where we need to resize the image
            if (this.resizeImageMode) {
                let [ix, iy, iw, ih] = this.imageXYWH
                if (['tr', 'br'].includes(corner)) {
                    wp = iw + xd
                } else {
                    wp = iw - xd
                    ix += xd
                }
                self.imageXYWH = [ix, iy, wp, ih]

                if (['tr', 'tl'].includes(corner)) {
                    self.imageXYWH = [ix, iy + yd, wp, ih - yd]
                } else {
                    self.imageXYWH = [ix, iy, wp, ih + yd]
                }
                return
            }
            // handle the case where we need to resize a bezier object
            const builder = self.getActive()
            const [w, h] = builder.getDim()
            if (['tr', 'br'].includes(corner)) {
                wp = w + xd
                builder.bezier.setDim(wp, h)
            } else {
                wp = w - xd
                builder.bezier.setDim(wp, h)
                builder.shift(xd, 0)
            }

            if (['tr', 'tl'].includes(corner)) {
                builder.bezier.setDim(wp, h - yd)
            } else {
                builder.bezier.setDim(wp, h + yd)
                builder.shift(0, yd)
            }
        }
    }

    /**
     * Helper to get the active builder
     */
    getActive () {
        return this.builders[this.active]
    }

    setActiveOnly (only = true) { this.activeOnly = only }
    getActiveOnly () { return this.activeOnly }

    /**
     * Sets the mode of the active builder
     */
    setMode (mode) {
        this.builderMode = mode
        this.resizer.toggle(mode === 0)
        for (const b of this.builders) {
           b.setMode(mode)
        }
    }

    /**
     * Sets all the builders to show their vertices or not
     */
    setShowVertices (show = true) {
       this.showVertices = show
       for (const b of this.builders) {
           b.setShowVertices(show)
       }
    }

    /**
     * Adds a new shape from to the builders array and sets it to active
     */
    addShape () {
        this.builders.push(new BezierShapeBuilder(5, this.builderMode))
        this.opacities.push(255)
        this.colors.push([255, 255, 255])
        this.active ++
    }

    /**
     * Removes the active shape from the builders array
     */
    deleteActiveShape () {
        this.builders.splice(this.active, 1)
        if (this.builders.length < 1) {
            this.addShape()
        }
        this.active = 0
    }

    /**
     * Helper function to make changes to arrays reactive
     */
    #reactiveSet (prop, index, value) {
        this[prop] = this[prop].map((v, i) => {
            if (i === index) return value
            return v
        })
    }

    /**
     * Returns the active builders opacity
     */
    getActiveOpacity () {
        return this.opacities[this.active]
    }

    /**
     * Sets the opacity of the active builder
     */
    setActiveOpacity (opacity) {
        this.#reactiveSet('opacities', this.active, opacity)
    }

    /**
     * Returns the color of the active builder
     */
    getActiveColor () {
        return this.colors[this.active]
    }

    /**
     * Sets the active builders color based on an object
     * @param {{ (red|blue|green): [number, number number]}}
     */
    setActiveColor (o) {
        const [ red, blue, green ] = this.colors[this.active]
        const map = { red, blue, green }
        const getColor = (key) => typeof o[key] === 'number' ? o[key] : map[key]
        this.#reactiveSet('colors', this.active, [getColor('red'), getColor('blue'), getColor('green')])
    }

    /**
     * cycles left by decrementing through the builders
     */
    left () {
        this.active --
        if (this.active < 0) this.active = this.builders.length - 1
    }

    /**
     * cycles right by incrementing through the builders
     */
    right () {
        this.active = (this.active + 1) % this.builders.length
    }

    /**
     * Sets the size of the canvas
     */
    setSize (w, h) {
        this.size = { w, h }
    }

    /**
     * Helper to which calles the active builders undo function
     */
    undo () {
        this.getActive().undo()
    }

    /**
     * Moves a layer lower in the draw order
     */
    demoteLayer () {
        if (this.active === 0) return
        this.#swap(this.builders, this.active, this.active - 1)
        this.#swap(this.opacities, this.active, this.active - 1)
        this.#swap(this.colors, this.active, this.active - 1)
        this.active --
    }

    /**
     * Moves a layer higher up in the draw order
     */
    promoteLayer () {
        if (this.active === this.builders.length - 1) return
        this.#swap(this.builders, this.active, this.active + 1)
        this.#swap(this.opacities, this.active, this.active + 1)
        this.#swap(this.colors, this.active, this.active + 1)
        this.active ++
    }

    /**
     * Private function to swap to two elements in an array
     */
    #swap (arr, e1, e2) {
        [arr[e2], arr[e1]] = [arr[e1], arr[e2]]
    }

    /**
     * Gets the dimensions of the browser window
     */
    getWindowDim () {
        return [Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)]
    }

    /**
     * Checks if the mouse is over the canvas
     */
    mouseIsOverCanvas (p5) {
        return p5.mouseX > 0 && p5.mouseX < this.size.w && p5.mouseY > 0 && p5.mouseY < this.size.h
    }

    /**
     * Draw function to display the crosshair
     */
    drawCross (p5) {
        p5.stroke(150)
        p5.fill(0)
        p5.line(0, p5.mouseY, p5.width, p5.mouseY)
        p5.line(p5.mouseX, 0, p5.mouseX, p5.height)
        p5.noStroke()
        p5.text('' + Math.floor(p5.mouseX), p5.mouseX + 5, 15)
        p5.text('' + Math.floor(p5.mouseY), 10, p5.mouseY - 5)
    }

    /**
     * Helper to upload an image
     */
    uploadImage (dataURL) {
        this.p5.loadImage(dataURL,
            img => { this.backgroundImage = img },
            fail => { console.log('Failed to load image', fail) }
        )
    }


    /**
     * Sketch function for P5 initilaizer
     */
    sketch (p5) {
        const self = this
        // if fullscreen more we need to resize canvas on the fly
        if (this.fullScreen) {
            const updateWindowSize = function () {
                const [w, h] = self.getWindowDim()
                self.setSize(w, h)
                p5.resizeCanvas(w, h)
            }
            window.addEventListener('resize', updateWindowSize)
            updateWindowSize()
        }

        this.p5 = p5

        p5.setup = this.setup(p5)
        p5.draw = this.draw(p5)

        // START: handle p5 events

        p5.mousePressed = (event) => {
            if (event.target.localName !== 'canvas') {
                return
            }
            this.builders[this.active].handleEvent('mousePressed', event)
            this.resizer.handleEvent('mousePressed', event)
        }

        p5.mouseClicked = (event) => {
            if (event.target.localName !== 'canvas') {
                return
            }
            this.builders[this.active].handleEvent('mouseClicked', event)
        }

        p5.mouseReleased = (event) => {
            if (event.target.localName !== 'canvas') {
                return
            }
            this.builders[this.active].handleEvent('mouseReleased', event)
            this.resizer.handleEvent('mouseReleased', event)
        }

        p5.keyPressed = (event) => {
            this.builders[this.active].handleEvent('keyPressed', event)
        }

        // END: handle p5 events
    }

    /**
     * Setup function for P5 initilaizer
     */
    setup (p5) {
        return () => {
            let canvas = p5.createCanvas(this.size.w, this.size.h)
            canvas.id(this.canvasId)
            p5.background(200)
        }
    }

    /**
     * Draw function for P5 initializer
     */
    draw (p5) {
        return () => {
            p5.background(240)

            // draw the background image
            if (this.showBackgroundImage && this.backgroundImage !== null) {
                let [ x, y, w, h ] = this.imageXYWH
                p5.image(this.backgroundImage, x, y, w, h)
            }

            p5.fill(255)

            // if active only mode, we only need to draw current layer
            if (this.activeOnly) {
                p5.fill(...this.colors[this.active], this.opacities[this.active])
                p5.stroke(0)
                const builder = this.builders[this.active]
                builder.update(p5)
                builder.draw(p5)
            } else {
                for (let i = 0; i < this.builders.length; i ++) {
                    p5.fill(...this.colors[i], this.opacities[i])
                    p5.stroke(0)
                    const builder = this.builders[i]
                    if (i === this.active) {
                        if (this.showGuides) builder.drawVertexGuide(p5)
                        builder.update(p5)
                        builder.draw(p5)
                    } else {
                        builder.drawBezier(p5)
                    }
                }
            }

            // only activate resizer when builder mode is 0 or we're in resize image mode
            if (this.builderMode === 0 || this.resizeImageMode) {
                this.resizer.update(p5)
                this.resizer.draw(p5)
            }

            // cross should be the last thing drawn
            if (this.showCross) this.drawCross(p5)
        }
    }
}

export default BezierSketch